const LEGACY_SCREENS = [
  { id: "storage", name: "Nơi lưu thẻ" },
  { id: "craft", name: "Chế tạo thẻ" },
  { id: "skills", name: "Kỹ năng thẻ" },
  { id: "upgrade", name: "Cường hóa thẻ" },
];
export const ELEMENTS = ["Tất cả", "Zoan", "Logia", "Paramecia"] as const;
export const MAX_SCREENS = 32;
export type Screen = string;
export type UiScreen = { id: string; name: string };
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
  dataUrl: string | null;
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
  screen: Screen;
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
  screenTargets: Array<string | null>;
  columns: number;
  gap: number;
  items: UiItem[];
};
export type UiDocument = {
  schema: "htth-ui-composer";
  version: 2;
  id: string;
  screens: UiScreen[];
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
  screen: Screen = "all",
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
    screenTargets: [],
    columns: 5,
    gap: 10,
    items: [],
  };
}

// Logical pixels, top-left origin; source crop/slice use physical resource pixels.
export function createEmptyDocument(): UiDocument {
  return {
    schema: "htth-ui-composer",
    version: 2,
    id: newId(),
    name: "Menu mới",
    width: 760,
    height: 440,
    background: "#17252d",
    screens: [],
    assets: [],
    nodes: [],
  };
}
function validateScreenName(doc: UiDocument, name: string, excludeId?: string) {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 100)
    throw new Error("Tên màn hình cần từ 1 đến 100 ký tự.");
  if (doc.screens.some(
    (screen) => screen.id !== excludeId &&
      screen.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase(),
  )) throw new Error("Tên màn hình đã tồn tại.");
  return trimmed;
}
export function addMenuScreen(doc: UiDocument, name: string): UiDocument {
  if (doc.screens.length >= MAX_SCREENS) throw new Error("Tối đa " + MAX_SCREENS + " màn hình.");
  return {
    ...doc,
    screens: [...doc.screens, { id: newId(), name: validateScreenName(doc, name) }],
  };
}
export function renameMenuScreen(doc: UiDocument, id: string, name: string): UiDocument {
  const trimmed = validateScreenName(doc, name, id);
  return {
    ...doc,
    screens: doc.screens.map((screen) =>
      screen.id === id ? { ...screen, name: trimmed } : screen,
    ),
  };
}
export function removeMenuScreen(doc: UiDocument, id: string): UiDocument {
  return {
    ...doc,
    screens: doc.screens.filter((screen) => screen.id !== id),
    nodes: doc.nodes.map((node) => ({
      ...node,
      screen: node.screen === id ? "all" : node.screen,
      screenTargets: node.screenTargets.map((target) => target === id ? null : target),
    })),
  };
}
// Layout-only JSON keeps resource IDs/filenames so a later upload can reattach them.
export function exportDocument(doc: UiDocument, includeResources = false): UiDocument {
  return parseDocument({
    ...doc,
    assets: doc.assets.map((asset) => ({
      ...asset,
      dataUrl: includeResources ? asset.dataUrl : null,
    })),
  });
}
export function mergeUploadedAssets(existing: UiAsset[], incoming: UiAsset[]): UiAsset[] {
  const result = [...existing];
  for (const asset of incoming) {
    const matches = result
      .map((existingAsset, index) => existingAsset.name === asset.name ? index : -1)
      .filter((index) => index >= 0);
    // Keep every existing resource ID and scale, including repeated filename refs.
    if (matches.length) {
      for (const index of matches) {
        result[index] = {
          ...result[index],
          dataUrl: asset.dataUrl,
          width: asset.width,
          height: asset.height,
        };
      }
    } else result.push(asset);
  }
  return result;
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
    (value.version !== 1 && value.version !== 2)
  )
    throw new Error("File không đúng schema htth-ui-composer v1/v2.");
  if (
    !Array.isArray(value.assets) ||
    !Array.isArray(value.nodes) ||
    value.assets.length > 200 ||
    value.nodes.length > 300
  )
    throw new Error("Tối đa 200 res và 300 layer.");
  const legacy = value.version === 1;
  if (!legacy && (typeof value.id !== "string" || !value.id.trim())) throw new Error("Menu ID không hợp lệ.");
  const legacyIds = new Set<string>();
  if (legacy) {
    for (const node of value.nodes) {
      if (!record(node)) continue;
      if (node.screen !== "all" && typeof node.screen === "string")
        legacyIds.add(node.screen);
      if (node.kind === "tabs" && node.action === "screen")
        LEGACY_SCREENS.forEach((screen) => legacyIds.add(screen.id));
    }
  }
  const rawScreens = legacy ? LEGACY_SCREENS.filter(s => legacyIds.has(s.id)) : value.screens;
  if (!Array.isArray(rawScreens) || rawScreens.length > MAX_SCREENS) throw new Error("Danh sách màn hình không hợp lệ.");
  const screens: UiScreen[] = rawScreens.map(s => {
    if (!record(s)) throw new Error("Màn hình không hợp lệ.");
    const id = string(s.id, 100, "Màn hình ID");
    const name = string(s.name, 100, "Tên màn hình").trim();
    if (!id.trim() || id === "all" || !name) throw new Error("ID/tên màn hình không hợp lệ.");
    return { id, name };
  });
  const screenIds = new Set(screens.map(s => s.id));
  if (screenIds.size !== screens.length) throw new Error("Màn hình ID trùng.");
  let bytes = 0;
  const assets: UiAsset[] = value.assets.map((a) => {
    if (!record(a)) throw new Error("Res không hợp lệ.");
    const dataUrl = a.dataUrl === null ? null : string(a.dataUrl, MAX_RESOURCE_BYTES * 1.4, "Ảnh");
    if (dataUrl !== null && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(dataUrl))
      throw new Error("Res chỉ hỗ trợ PNG, JPG, WEBP base64.");
    bytes += (dataUrl?.length ?? 0) * 0.75;
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
    if (typeof n.screen !== "string" || (n.screen !== "all" && !screenIds.has(n.screen)))
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
    if (n.action === "element" && n.labels.length !== ELEMENTS.length)
      throw new Error("Tab lọc hệ cần đúng " + ELEMENTS.length + " nhãn.");
    const rawTargets = legacy && n.screenTargets === undefined
      ? (n.kind === "tabs" && n.action === "screen"
          ? LEGACY_SCREENS.map((screen) => screen.id)
          : [])
      : n.screenTargets;
    if (
      !Array.isArray(rawTargets) || rawTargets.length > 12 ||
      (n.action === "screen" && rawTargets.length !== n.labels.length)
    ) throw new Error("Đích chuyển màn hình không hợp lệ.");
    const screenTargets = rawTargets.map(target => {
      if (target === null) return null;
      if (typeof target !== "string" || !screenIds.has(target)) throw new Error("Tab tham chiếu màn hình không tồn tại.");
      return target;
    });
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
      screenTargets,
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
    version: 2,
    id: legacy ? newId() : string(value.id, 100, "Menu ID"),
    screens,
    name: string(value.name, 200, "Tên menu"),
    width: number(value.width, 160, 4096, "Rộng canvas"),
    height: number(value.height, 120, 4096, "Cao canvas"),
    background: color(value.background),
    assets,
    nodes,
  };
}
