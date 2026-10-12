import {
  ELEMENTS,
  SCREENS,
  listMetrics,
  visibleNodes,
  type Insets,
  type PreviewState,
  type Rect,
  type UiAsset,
  type UiDocument,
  type UiNode,
} from "./uiComposer";

type LoadedAsset = { asset: UiAsset; image: HTMLImageElement };
export type LoadedAssets = Map<string, LoadedAsset>;
const imageCache = new Map<
  string,
  { url: string; promise: Promise<HTMLImageElement> }
>();

export async function loadGameFonts(): Promise<void> {
  const faces = await Promise.all([
    document.fonts.load('400 16px "HTTH Game"'),
    document.fonts.load('700 16px "HTTH Game"'),
  ]);
  if (faces.some((fonts) => !fonts.length))
    throw new Error("Không tải được font game.");
}

export async function loadAssets(assets: UiAsset[]): Promise<LoadedAssets> {
  const ids = new Set(assets.map((a) => a.id));
  for (const id of imageCache.keys()) if (!ids.has(id)) imageCache.delete(id);
  const results = await Promise.all(
    assets.map(async (asset) => {
      let cached = imageCache.get(asset.id);
      if (!cached || cached.url !== asset.dataUrl) {
        const promise = new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = () => {
            if (
              image.naturalWidth !== asset.width ||
              image.naturalHeight !== asset.height ||
              image.naturalWidth * image.naturalHeight > 16_777_216
            )
              reject(new Error("Kích thước res không khớp: " + asset.name));
            else resolve(image);
          };
          image.onerror = () =>
            reject(new Error("Không đọc được res: " + asset.name));
          image.src = asset.dataUrl;
        });
        cached = { url: asset.dataUrl, promise };
        imageCache.set(asset.id, cached);
      }
      return [asset.id, { asset, image: await cached.promise }] as const;
    }),
  );
  return new Map(results);
}

function fitEdges(
  first: number,
  last: number,
  length: number,
): [number, number] {
  const factor = first + last > length ? length / (first + last) : 1;
  return [first * factor, last * factor];
}

// Keep corners at logical source size; shrink proportionally for small targets.
export function nineSliceRegions(
  source: Rect,
  border: Insets,
  scale: number,
  target: Rect,
) {
  const [sl, sr] = fitEdges(border.left, border.right, source.width);
  const [st, sb] = fitEdges(border.top, border.bottom, source.height);
  const [dl, dr] = fitEdges(sl / scale, sr / scale, target.width);
  const [dt, db] = fitEdges(st / scale, sb / scale, target.height);
  const sx = [source.x, source.x + sl, source.x + source.width - sr];
  const sy = [source.y, source.y + st, source.y + source.height - sb];
  const sw = [sl, source.width - sl - sr, sr];
  const sh = [st, source.height - st - sb, sb];
  const dx = [target.x, target.x + dl, target.x + target.width - dr];
  const dy = [target.y, target.y + dt, target.y + target.height - db];
  const dw = [dl, target.width - dl - dr, dr];
  const dh = [dt, target.height - dt - db, db];
  return sy
    .flatMap((y, row) =>
      sx.map((x, column) => ({
        source: { x, y, width: sw[column], height: sh[row] },
        target: {
          x: dx[column],
          y: dy[row],
          width: dw[column],
          height: dh[row],
        },
      })),
    )
    .filter(
      (r) =>
        r.source.width > 0 &&
        r.source.height > 0 &&
        r.target.width > 0 &&
        r.target.height > 0,
    );
}

function paintSprite(
  ctx: CanvasRenderingContext2D,
  loaded: LoadedAsset | undefined,
  node: UiNode,
  target: Rect,
  mode = node.renderMode,
  crop = node.crop,
) {
  if (!loaded) return false;
  const { image, asset } = loaded;
  const x = Math.max(0, Math.min(image.naturalWidth - 1, crop?.x ?? 0));
  const y = Math.max(0, Math.min(image.naturalHeight - 1, crop?.y ?? 0));
  const source = {
    x,
    y,
    width: Math.min(crop?.width ?? image.naturalWidth, image.naturalWidth - x),
    height: Math.min(
      crop?.height ?? image.naturalHeight,
      image.naturalHeight - y,
    ),
  };
  if (mode === "nineSlice") {
    for (const region of nineSliceRegions(
      source,
      node.slice,
      asset.resourceScale,
      target,
    )) {
      const s = region.source;
      const d = region.target;
      ctx.drawImage(
        image,
        s.x,
        s.y,
        s.width,
        s.height,
        d.x,
        d.y,
        d.width,
        d.height,
      );
    }
  } else if (mode === "tile") {
    const tile = document.createElement("canvas");
    tile.width = Math.max(1, Math.round(source.width / asset.resourceScale));
    tile.height = Math.max(1, Math.round(source.height / asset.resourceScale));
    const tileCtx = tile.getContext("2d");
    if (!tileCtx) return false;
    tileCtx.imageSmoothingEnabled = false;
    tileCtx.drawImage(
      image,
      source.x,
      source.y,
      source.width,
      source.height,
      0,
      0,
      tile.width,
      tile.height,
    );
    const pattern = ctx.createPattern(tile, "repeat");
    if (pattern) {
      ctx.save();
      ctx.translate(target.x, target.y);
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, target.width, target.height);
      ctx.restore();
    }
  } else {
    let d = target;
    if (mode === "contain") {
      const ratio = Math.min(
        target.width / source.width,
        target.height / source.height,
      );
      const width = source.width * ratio,
        height = source.height * ratio;
      d = {
        x: target.x + (target.width - width) / 2,
        y: target.y + (target.height - height) / 2,
        width,
        height,
      };
    }
    ctx.drawImage(
      image,
      source.x,
      source.y,
      source.width,
      source.height,
      d.x,
      d.y,
      d.width,
      d.height,
    );
  }
  return true;
}

function paintSurface(
  ctx: CanvasRenderingContext2D,
  node: UiNode,
  target: Rect,
  assets: LoadedAssets,
  active = false,
) {
  ctx.fillStyle = active ? "#edc95a" : node.background;
  ctx.fillRect(target.x, target.y, target.width, target.height);
  const hasSprite = paintSprite(
    ctx,
    assets.get(
      (active ? (node.activeAssetId ?? node.assetId) : node.assetId) ?? "",
    ),
    node,
    target,
  );
  if (!hasSprite) {
    ctx.strokeStyle = active ? "#946520" : "#ad8755";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      target.x + 0.5,
      target.y + 0.5,
      target.width - 1,
      target.height - 1,
    );
  } else if (active && !node.activeAssetId) {
    ctx.strokeStyle = "#f4c846";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      target.x + 1,
      target.y + 1,
      target.width - 2,
      target.height - 2,
    );
  }
}
function linesFor(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const char of paragraph) {
      if (line && ctx.measureText(line + char).width > width) {
        lines.push(line.trimEnd());
        line = char.trimStart();
      } else line += char;
    }
    lines.push(line);
  }
  return lines;
}
function paintText(
  ctx: CanvasRenderingContext2D,
  node: UiNode,
  target: Rect,
  text = node.text,
  centered = false,
  color = node.color,
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(target.x, target.y, target.width, target.height);
  ctx.clip();
  ctx.fillStyle = color;
  ctx.font =
    (centered ? "700 " : "400 ") + node.fontSize + "px 'HTTH Game', sans-serif";
  ctx.textBaseline = "top";
  ctx.textAlign = centered ? "center" : "left";
  const lines = linesFor(ctx, text, Math.max(1, target.width - 8));
  const lineHeight = node.fontSize * 1.45;
  const startY = centered
    ? target.y + Math.max(0, (target.height - lines.length * lineHeight) / 2)
    : target.y + 2;
  lines.forEach((line, i) =>
    ctx.fillText(
      line,
      centered ? target.x + target.width / 2 : target.x + 4,
      startY + i * lineHeight,
    ),
  );
  ctx.restore();
}
function paintTabs(
  ctx: CanvasRenderingContext2D,
  node: UiNode,
  assets: LoadedAssets,
  preview: PreviewState,
) {
  const count = node.labels.length;
  const vertical = node.direction === "vertical";
  const size = Math.max(
    1,
    ((vertical ? node.height : node.width) - node.gap * (count - 1)) / count,
  );
  const selected =
    node.action === "screen"
      ? SCREENS.findIndex((s) => s.value === preview.screen)
      : node.action === "element"
        ? ELEMENTS.findIndex((s) => s === preview.element)
        : 0;
  node.labels.forEach((label, i) => {
    const r = {
      x: node.x + (vertical ? 0 : i * (size + node.gap)),
      y: node.y + (vertical ? i * (size + node.gap) : 0),
      width: vertical ? node.width : size,
      height: vertical ? size : node.height,
    };
    paintSurface(ctx, node, r, assets, selected === i);
    const icon = assets.get(node.iconIds[i] ?? "");
    const iconSize = Math.min(26, r.height - 12, r.width / 3);
    if (icon && iconSize > 0)
      paintSprite(
        ctx,
        icon,
        node,
        {
          x: r.x + 8,
          y: r.y + (r.height - iconSize) / 2,
          width: iconSize,
          height: iconSize,
        },
        "contain",
        null,
      );
    const offset = icon ? iconSize + 12 : 0;
    paintText(
      ctx,
      node,
      { ...r, x: r.x + offset, width: r.width - offset },
      label,
      true,
    );
  });
}
function paintList(
  ctx: CanvasRenderingContext2D,
  node: UiNode,
  assets: LoadedAssets,
  preview: PreviewState,
) {
  const filter = node.screen === "storage" ? preview.element : "Tất cả";
  const { items, cell, rowHeight, maxScroll } = listMetrics(node, filter);
  const scroll = Math.max(0, Math.min(preview.scroll[node.id] ?? 0, maxScroll));
  ctx.save();
  ctx.beginPath();
  ctx.rect(node.x, node.y, node.width, node.height);
  ctx.clip();
  if (!items.length) {
    paintText(
      ctx,
      { ...node, fontSize: 13 },
      node,
      node.items.length
        ? "Không có thẻ thuộc hệ này."
        : "Chọn layer này, thêm item và gán res để xem danh sách.",
      true,
      "#725539",
    );
  }
  items.forEach((item, i) => {
    const r = {
      x: node.x + (i % node.columns) * (cell + node.gap),
      y: node.y + Math.floor(i / node.columns) * rowHeight - scroll,
      width: cell,
      height: cell,
    };
    if (r.y + rowHeight < node.y || r.y > node.y + node.height) return;
    paintSurface(ctx, node, r, assets);
    const inset = Math.min(6, cell / 6);
    paintSprite(
      ctx,
      assets.get(item.assetId ?? ""),
      node,
      {
        x: r.x + inset,
        y: r.y + inset,
        width: cell - 2 * inset,
        height: cell - 2 * inset,
      },
      "contain",
      null,
    );
    paintText(
      ctx,
      { ...node, fontSize: 11 },
      { x: r.x + 2, y: r.y + cell - 19, width: cell - 4, height: 18 },
      "Lv." + item.level,
      false,
      "#ffffff",
    );
    paintText(
      ctx,
      { ...node, fontSize: 11 },
      { x: r.x, y: r.y + cell + 3, width: cell, height: 28 },
      item.name,
      true,
    );
  });
  if (maxScroll > 0) {
    const trackX = node.x + node.width - 5;
    const thumbHeight = Math.max(
      20,
      (node.height * node.height) / (node.height + maxScroll),
    );
    ctx.fillStyle = "#c4aa7d";
    ctx.fillRect(trackX, node.y, 4, node.height);
    ctx.fillStyle = "#6c4e32";
    ctx.fillRect(
      trackX,
      node.y + ((node.height - thumbHeight) * scroll) / maxScroll,
      4,
      thumbHeight,
    );
  }
  ctx.restore();
}

export function paintDocument(
  canvas: HTMLCanvasElement,
  doc: UiDocument,
  assets: LoadedAssets,
  preview: PreviewState,
  options: { grid?: number; selectedId?: string | null } = {},
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Trình duyệt không hỗ trợ Canvas 2D.");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = doc.background;
  ctx.fillRect(0, 0, doc.width, doc.height);
  for (const node of visibleNodes(doc, preview.screen)) {
    if (node.kind === "tabs") paintTabs(ctx, node, assets, preview);
    else if (node.kind === "itemList") paintList(ctx, node, assets, preview);
    else if (node.kind === "text") paintText(ctx, node, node);
    else {
      paintSurface(ctx, node, node, assets);
      if (node.kind === "button") paintText(ctx, node, node, node.text, true);
      if (node.kind === "image" && !node.assetId)
        paintText(
          ctx,
          { ...node, fontSize: 12 },
          node,
          "Gán res",
          true,
          "#d1ad71",
        );
    }
  }
  if (options.grid) {
    ctx.strokeStyle = "#ffffff20";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = options.grid; x < doc.width; x += options.grid) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, doc.height);
    }
    for (let y = options.grid; y < doc.height; y += options.grid) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(doc.width, y + 0.5);
    }
    ctx.stroke();
  }
  const selected = visibleNodes(doc, preview.screen).find(
    (n) => n.id === options.selectedId,
  );
  if (selected) {
    ctx.strokeStyle = "#22a7e8";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.strokeRect(selected.x, selected.y, selected.width, selected.height);
    ctx.setLineDash([]);
    if (!selected.locked) {
      ctx.fillStyle = "#22a7e8";
      ctx.fillRect(
        selected.x + selected.width - 8,
        selected.y + selected.height - 8,
        8,
        8,
      );
    }
  }
}

export async function readAsset(file: File, scale: number): Promise<UiAsset> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new Error("Chọn PNG, JPG hoặc WEBP.");
  if (file.size > 4 * 1024 * 1024)
    throw new Error(file.name + ": tối đa 4 MB mỗi ảnh.");
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Không đọc được " + file.name));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Ảnh hỏng: " + file.name));
    img.src = dataUrl;
  });
  if (
    image.naturalWidth > 8192 ||
    image.naturalHeight > 8192 ||
    image.naturalWidth * image.naturalHeight > 16_777_216
  )
    throw new Error("Ảnh tối đa 8192px mỗi chiều và 16 triệu pixel.");
  return {
    id: crypto.randomUUID(),
    name: file.name,
    dataUrl,
    width: image.naturalWidth,
    height: image.naturalHeight,
    resourceScale: scale,
  };
}
