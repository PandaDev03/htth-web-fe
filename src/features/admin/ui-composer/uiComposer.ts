export const SCREENS = [
  { value: "storage", label: "Nơi lưu thẻ" },
  { value: "craft", label: "Chế tạo thẻ" },
  { value: "skills", label: "Kỹ năng thẻ" },
  { value: "upgrade", label: "Cường hóa thẻ" },
] as const;
export const ELEMENTS = ["Tất cả", "Zoan", "Logia", "Paramecia"] as const;
export type Screen = (typeof SCREENS)[number]["value"];
export type NodeKind =
  "panel" | "image" | "text" | "button" | "tabs" | "itemList";
export type RenderMode = "stretch" | "contain" | "tile" | "nineSlice";
export type Rect = { x: number; y: number; width: number; height: number };
export type Insets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};
export type UiAsset = {
  id: string;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
  resourceScale: number;
};
export type UiItem = {
  id: string;
  name: string;
  element: string;
  assetId: string | null;
  level: number;
};
export type UiNode = Rect & {
  id: string;
  name: string;
  kind: NodeKind;
  screen: Screen | "all";
  hidden: boolean;
  locked: boolean;
  text: string;
  assetId: string | null;
  activeAssetId: string | null;
  renderMode: RenderMode;
  crop: Rect | null;
  slice: Insets;
  background: string;
  color: string;
  fontSize: number;
  direction: "horizontal" | "vertical";
  action: "none" | "screen" | "element";
  labels: string[];
  iconIds: Array<string | null>;
  columns: number;
  gap: number;
  items: UiItem[];
};
export type UiDocument = {
  schema: "htth-ui-composer";
  version: 1;
  name: string;
  width: number;
  height: number;
  background: string;
  assets: UiAsset[];
  nodes: UiNode[];
};
export type PreviewState = {
  screen: Screen;
  element: string;
  scroll: Record<string, number>;
};
export const KIND_LABELS: Record<NodeKind, string> = {
  panel: "Khung / nền",
  image: "Ảnh / tabIcon",
  text: "Chữ",
  button: "Button",
  tabs: "Nhóm tab",
  itemList: "Danh sách item",
};
export const newId = () => crypto.randomUUID();
export const MAX_RESOURCE_BYTES = 24 * 1024 * 1024;
export function createNode(
  kind: NodeKind,
  screen: Screen | "all" = "all",
): UiNode {
  return {
    id: newId(),
    name: KIND_LABELS[kind],
    kind,
    screen,
    x: 32,
    y: 60,
    width: kind === "text" ? 220 : 160,
    height: kind === "text" ? 32 : 60,
    hidden: false,
    locked: false,
    text: kind === "button" ? "Xác nhận" : kind === "text" ? "Nội dung" : "",
    assetId: null,
    activeAssetId: null,
    renderMode: "stretch",
    crop: null,
    slice: { top: 8, right: 8, bottom: 8, left: 8 },
    background: kind === "image" || kind === "text" ? "#00000000" : "#edd6a5",
    color: "#38251a",
    fontSize: 16,
    direction: "horizontal",
    action: "none",
    labels: ["Tab 1", "Tab 2"],
    iconIds: [],
    columns: 5,
    gap: 10,
    items: [],
  };
}

// Logical pixels, top-left origin; source crop/slice use physical resource pixels.
export function createDevilCardPreset(): UiDocument {
  const nodes: UiNode[] = [];
  const add = (kind: NodeKind, patch: Partial<UiNode>) => {
    const node = { ...createNode(kind), ...patch };
    nodes.push(node);
    return node;
  };
  add("panel", {
    name: "Nền menu đậm",
    x: 8,
    y: 8,
    width: 744,
    height: 424,
    background: "#3b271e",
  });
  add("panel", {
    name: "Thanh tiêu đề",
    x: 18,
    y: 18,
    width: 724,
    height: 40,
    background: "#513729",
  });
  add("text", {
    name: "Tiêu đề",
    text: "Thẻ Ác Quỷ",
    x: 36,
    y: 20,
    width: 240,
    height: 36,
    fontSize: 23,
    color: "#f9e2ad",
  });
  add("button", {
    name: "Nút đóng",
    text: "×",
    x: 700,
    y: 21,
    width: 32,
    height: 32,
    background: "#ac3027",
    color: "#ffffff",
    fontSize: 26,
  });
  add("tabs", {
    name: "Menu trái",
    x: 22,
    y: 72,
    width: 166,
    height: 244,
    direction: "vertical",
    action: "screen",
    labels: SCREENS.map((s) => s.label),
    gap: 8,
  });
  add("panel", {
    name: "Nền nội dung",
    x: 200,
    y: 72,
    width: 538,
    height: 346,
    background: "#f5e2ba",
  });
  add("tabs", {
    name: "Filter hệ",
    screen: "storage",
    x: 218,
    y: 88,
    width: 502,
    height: 32,
    action: "element",
    labels: [...ELEMENTS],
    gap: 8,
    fontSize: 14,
  });
  add("itemList", {
    name: "Kho thẻ (cuộn)",
    screen: "storage",
    x: 218,
    y: 134,
    width: 502,
    height: 246,
    columns: 5,
    gap: 12,
    background: "#543726",
  });
  add("text", {
    name: "Gợi ý kho thẻ",
    screen: "storage",
    x: 218,
    y: 389,
    width: 490,
    height: 22,
    text: "Thêm ảnh thẻ trong Thuộc tính · Cuộn để xem toàn bộ",
    fontSize: 12,
  });
  add("text", {
    name: "Tiêu đề chế tạo",
    screen: "craft",
    x: 218,
    y: 84,
    width: 310,
    height: 30,
    text: "Chế Tạo Thẻ Ác Quỷ",
    fontSize: 19,
  });
  add("itemList", {
    name: "Nguyên liệu chế tạo",
    screen: "craft",
    x: 218,
    y: 126,
    width: 328,
    height: 106,
    columns: 4,
    gap: 8,
    background: "#543726",
  });
  add("text", {
    name: "Tỷ lệ chế tạo",
    screen: "craft",
    x: 218,
    y: 244,
    width: 328,
    height: 28,
    text: "Tỷ lệ thành công: 30%",
    fontSize: 16,
  });
  add("button", {
    name: "Chế tạo",
    screen: "craft",
    x: 296,
    y: 282,
    width: 166,
    height: 40,
    text: "Chế Tạo",
    background: "#d35921",
    color: "#ffffff",
  });
  add("text", {
    name: "Hướng dẫn chế tạo",
    screen: "craft",
    x: 560,
    y: 96,
    width: 158,
    height: 278,
    text: "Hướng dẫn\n\nThu thập đủ nguyên liệu để chế tạo thẻ.\n\nHệ Zoan: 100%\nHệ Logia: 30%\nHệ Paramecia: 10%",
    fontSize: 14,
  });
  add("text", {
    name: "Tiêu đề kỹ năng",
    screen: "skills",
    x: 218,
    y: 84,
    width: 480,
    height: 30,
    text: "Kỹ Năng Thẻ",
    fontSize: 19,
  });
  add("image", {
    name: "Thẻ chọn kỹ năng",
    screen: "skills",
    x: 224,
    y: 132,
    width: 116,
    height: 116,
    background: "#543726",
    renderMode: "contain",
  });
  add("text", {
    name: "Thông tin kỹ năng",
    screen: "skills",
    x: 218,
    y: 268,
    width: 138,
    height: 126,
    text: "Trái Ác Quỷ\nHệ: Paramecia\n\nHiệu ứng hiện tại",
    fontSize: 14,
  });
  for (let i = 0; i < 3; i++) {
    add("panel", {
      name: "Khung kỹ năng " + (i + 1),
      screen: "skills",
      x: 374,
      y: 128 + i * 80,
      width: 342,
      height: 68,
    });
    add("text", {
      name: "Kỹ năng " + (i + 1),
      screen: "skills",
      x: 386,
      y: 139 + i * 80,
      width: 230,
      height: 44,
      text: "Tên kỹ năng " + (i + 1) + "\nMô tả kỹ năng · Lv.1",
      fontSize: 14,
    });
    add("button", {
      name: "Chọn kỹ năng " + (i + 1),
      screen: "skills",
      x: 636,
      y: 148 + i * 80,
      width: 66,
      height: 30,
      text: "Chọn",
      background: "#e2b941",
      fontSize: 14,
    });
  }
  add("text", {
    name: "Tiêu đề cường hóa",
    screen: "upgrade",
    x: 218,
    y: 84,
    width: 480,
    height: 30,
    text: "Cường Hóa Thẻ Ác Quỷ",
    fontSize: 19,
  });
  add("image", {
    name: "Thẻ cường hóa",
    screen: "upgrade",
    x: 224,
    y: 128,
    width: 116,
    height: 116,
    background: "#543726",
    renderMode: "contain",
  });
  add("itemList", {
    name: "Nguyên liệu cường hóa",
    screen: "upgrade",
    x: 372,
    y: 138,
    width: 196,
    height: 106,
    columns: 2,
    gap: 12,
    background: "#543726",
  });
  add("text", {
    name: "Tỷ lệ cường hóa",
    screen: "upgrade",
    x: 368,
    y: 256,
    width: 210,
    height: 30,
    text: "Tỷ lệ thành công: 60%",
    fontSize: 14,
  });
  add("button", {
    name: "Cường hóa",
    screen: "upgrade",
    x: 378,
    y: 296,
    width: 190,
    height: 40,
    text: "Cường Hóa",
    background: "#d35921",
    color: "#ffffff",
  });
  add("text", {
    name: "Cấp tiếp theo",
    screen: "upgrade",
    x: 594,
    y: 142,
    width: 126,
    height: 150,
    text: "Cấp tiếp theo\n\nLv.4\nCông: +16%\nHP: +12%",
    fontSize: 15,
  });
  return {
    schema: "htth-ui-composer",
    version: 1,
    name: "Thẻ Ác Quỷ",
    width: 760,
    height: 440,
    background: "#17252d",
    assets: [],
    nodes,
  };
}

export function visibleNodes(doc: UiDocument, screen: Screen) {
  return doc.nodes.filter(
    (n) => !n.hidden && (n.screen === "all" || n.screen === screen),
  );
}
export function hitTest(
  doc: UiDocument,
  screen: Screen,
  x: number,
  y: number,
  editing = false,
) {
  return visibleNodes(doc, screen)
    .reverse()
    .find(
      (n) =>
        (!editing || !n.locked) &&
        x >= n.x &&
        y >= n.y &&
        x < n.x + n.width &&
        y < n.y + n.height,
    );
}
export function tabIndexAt(node: UiNode, x: number, y: number) {
  const count = node.labels.length;
  if (!count) return -1;
  const vertical = node.direction === "vertical";
  const size =
    ((vertical ? node.height : node.width) - node.gap * (count - 1)) / count;
  const offset = vertical ? y - node.y : x - node.x;
  const index = Math.floor(offset / (size + node.gap));
  return index >= 0 &&
    index < count &&
    offset - index * (size + node.gap) < size
    ? index
    : -1;
}
export function listMetrics(node: UiNode, element: string) {
  const items = node.items.filter(
    (item) => element === "Tất cả" || item.element === element,
  );
  const cell = Math.max(
    8,
    (node.width - 16 - node.gap * (node.columns - 1)) / node.columns,
  );
  const rowHeight = cell + 32 + node.gap;
  const contentHeight = Math.ceil(items.length / node.columns) * rowHeight;
  return {
    items,
    cell,
    rowHeight,
    maxScroll: Math.max(0, contentHeight - node.height),
  };
}

const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const number = (v: unknown, min: number, max: number, label: string) => {
  if (typeof v !== "number" || !Number.isInteger(v) || v < min || v > max)
    throw new Error(label + ": số nguyên từ " + min + " đến " + max + ".");
  return v;
};
const string = (v: unknown, max: number, label: string) => {
  if (typeof v !== "string" || v.length > max)
    throw new Error(label + ": chuỗi không hợp lệ.");
  return v;
};
const color = (v: unknown) => {
  const result = string(v, 9, "Màu");
  if (!/^#[\da-f]{6}([\da-f]{2})?$/i.test(result))
    throw new Error("Màu phải là #RRGGBB hoặc #RRGGBBAA.");
  return result;
};
const boolean = (v: unknown) => {
  if (typeof v !== "boolean") throw new Error("Trạng thái phải là boolean.");
  return v;
};
function rectangle(v: unknown, positionMin = 0): Rect {
  if (!record(v)) throw new Error("Vùng ảnh không hợp lệ.");
  return {
    x: number(v.x, positionMin, 8192, "X"),
    y: number(v.y, positionMin, 8192, "Y"),
    width: number(v.width, 1, 8192, "Rộng"),
    height: number(v.height, 1, 8192, "Cao"),
  };
}
export function parseDocument(value: unknown): UiDocument {
  if (
    !record(value) ||
    value.schema !== "htth-ui-composer" ||
    value.version !== 1
  )
    throw new Error("File không đúng schema htth-ui-composer v1.");
  if (
    !Array.isArray(value.assets) ||
    !Array.isArray(value.nodes) ||
    value.assets.length > 200 ||
    value.nodes.length > 300
  )
    throw new Error("Tối đa 200 res và 300 layer.");
  let bytes = 0;
  const assets: UiAsset[] = value.assets.map((a) => {
    if (!record(a)) throw new Error("Res không hợp lệ.");
    const dataUrl = string(a.dataUrl, MAX_RESOURCE_BYTES * 1.4, "Ảnh");
    if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(dataUrl))
      throw new Error("Res chỉ hỗ trợ PNG, JPG, WEBP base64.");
    bytes += dataUrl.length * 0.75;
    return {
      id: string(a.id, 100, "Res ID"),
      name: string(a.name, 200, "Tên res"),
      dataUrl,
      width: number(a.width, 1, 8192, "Rộng ảnh"),
      height: number(a.height, 1, 8192, "Cao ảnh"),
      resourceScale: number(a.resourceScale, 1, 4, "Scale res"),
    };
  });
  if (bytes > MAX_RESOURCE_BYTES) throw new Error("Tổng res vượt 24 MB.");
  if (
    assets.some((a) => a.width * a.height > 16_777_216) ||
    assets.reduce((sum, a) => sum + a.width * a.height, 0) > 67_108_864
  )
    throw new Error("Res vượt giới hạn pixel: 16 triệu/ảnh, 64 triệu tổng.");
  const ids = new Set(assets.map((a) => a.id));
  if (ids.size !== assets.length) throw new Error("Res ID trùng.");
  const reference = (v: unknown) => {
    if (v === null) return null;
    if (typeof v !== "string" || !ids.has(v))
      throw new Error("Layer tham chiếu res không tồn tại.");
    return v;
  };
  const nodes: UiNode[] = value.nodes.map((n) => {
    if (
      !record(n) ||
      typeof n.kind !== "string" ||
      !Object.prototype.hasOwnProperty.call(KIND_LABELS, n.kind)
    )
      throw new Error("Loại layer không hợp lệ.");
    if (n.screen !== "all" && !SCREENS.some((s) => s.value === n.screen))
      throw new Error("Tab màn hình không hợp lệ.");
    if (
      !["stretch", "contain", "tile", "nineSlice"].includes(
        String(n.renderMode),
      )
    )
      throw new Error("Chế độ ảnh không hợp lệ.");
    if (n.direction !== "horizontal" && n.direction !== "vertical")
      throw new Error("Hướng tab không hợp lệ.");
    if (!["none", "screen", "element"].includes(String(n.action)))
      throw new Error("Hành vi tab không hợp lệ.");
    if (
      !record(n.slice) ||
      !Array.isArray(n.labels) ||
      n.labels.length < 1 ||
      n.labels.length > 12 ||
      !Array.isArray(n.iconIds) ||
      n.iconIds.length > 12 ||
      !Array.isArray(n.items) ||
      n.items.length > 500
    )
      throw new Error("Dữ liệu tab/list không hợp lệ.");
    if (n.action !== "none" && n.labels.length !== 4)
      throw new Error("Tab chuyển màn hình/lọc hệ cần đúng 4 nhãn.");
    return {
      ...rectangle(n, -8192),
      id: string(n.id, 100, "Layer ID"),
      name: string(n.name, 200, "Tên layer"),
      kind: n.kind as NodeKind,
      screen: n.screen as UiNode["screen"],
      hidden: boolean(n.hidden),
      locked: boolean(n.locked),
      text: string(n.text, 4000, "Nội dung"),
      assetId: reference(n.assetId),
      activeAssetId: reference(n.activeAssetId),
      renderMode: n.renderMode as RenderMode,
      crop: n.crop === null ? null : rectangle(n.crop),
      slice: {
        top: number(n.slice.top, 0, 4096, "Slice trên"),
        right: number(n.slice.right, 0, 4096, "Slice phải"),
        bottom: number(n.slice.bottom, 0, 4096, "Slice dưới"),
        left: number(n.slice.left, 0, 4096, "Slice trái"),
      },
      background: color(n.background),
      color: color(n.color),
      fontSize: number(n.fontSize, 6, 128, "Cỡ chữ"),
      direction: n.direction,
      action: n.action as UiNode["action"],
      labels: n.labels.map((l) => string(l, 100, "Tên tab")),
      iconIds: n.iconIds.map(reference),
      columns: number(n.columns, 1, 12, "Cột"),
      gap: number(n.gap, 0, 64, "Khoảng cách"),
      items: n.items.map((item) => {
        if (!record(item)) throw new Error("Item không hợp lệ.");
        const element = string(item.element, 20, "Hệ");
        if (!ELEMENTS.slice(1).some((e) => e === element))
          throw new Error("Hệ item không hợp lệ.");
        return {
          id: string(item.id, 100, "Item ID"),
          name: string(item.name, 100, "Tên item"),
          element,
          assetId: reference(item.assetId),
          level: number(item.level, 1, 100, "Cấp"),
        };
      }),
    };
  });
  if (new Set(nodes.map((n) => n.id)).size !== nodes.length)
    throw new Error("Layer ID trùng.");
  return {
    schema: "htth-ui-composer",
    version: 1,
    name: string(value.name, 200, "Tên menu"),
    width: number(value.width, 160, 4096, "Rộng canvas"),
    height: number(value.height, 120, 4096, "Cao canvas"),
    background: color(value.background),
    assets,
    nodes,
  };
}
