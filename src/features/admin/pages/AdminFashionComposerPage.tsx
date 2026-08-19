import {
  Alert,
  Button,
  Card,
  Checkbox,
  Input,
  InputNumber,
  Popconfirm,
  Segmented,
  Select,
  Switch,
  Tag,
  Tooltip,
  Upload,
} from "antd";
import {
  Check,
  Clipboard,
  Download,
  Eye,
  EyeOff,
  FileCode2,
  FileUp,
  FolderOpen,
  LayoutGrid,
  ImagePlus,
  Layers3,
  Pause,
  Play,
  RotateCcw,
  Save,
  SkipBack,
  SkipForward,
  Trash2,
} from "lucide-react";
import {
  type ChangeEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import {
  BIG_BODY_HEAD_SHIFT_IDS,
  BODY_STAND_OVERLAY_EFFECT_BY_PART_ID,
  createInitialAssets,
  createInitialParts,
  CHARACTER_POSE_FRAMES,
  DEFAULT_FASHION,
  DEFAULT_POSE_SEQUENCES,
  generateFashionSql,
  inferRawIconId,
  HEAD_SHIFT_EXEMPT_IDS,
  MWEAR_OVERRIDE_SLOTS,
  PART_SPEC_BY_KEY,
  PART_SPECS,
  POSE_SPECS,
  SUPPORTED_CHARACTER_FRAMES,
  type ComposerAssets,
  type ComposerParts,
  type FashionConfiguration,
  type FrameAssignment,
  type MwearOverrideSlot,
  type PartKey,
  type PoseKey,
  type UploadedPartAsset,
} from "@/features/admin/fashion-composer/fashionComposer";

const { Dragger } = Upload;

const EMPTY_PREVIEW_FRAMES: Record<PartKey, number> = {
  head: 0,
  body: 0,
  legs: 0,
  weapon: 0,
  accessory: 0,
  cloak: 0,
};

const EMPTY_VISIBILITY: Record<PartKey, boolean> = {
  head: true,
  body: true,
  legs: true,
  weapon: true,
  accessory: true,
  cloak: true,
};

const createInitialPoseInputs = (): Record<PoseKey, string> =>
  Object.fromEntries(
    Object.entries(DEFAULT_POSE_SEQUENCES).map(([key, frames]) => [
      key,
      frames.join(", "),
    ]),
  ) as Record<PoseKey, string>;

const parsePoseSequence = (value: string) => {
  const tokens = value.split(/[\s,;]+/).filter(Boolean);
  if (!tokens.length) {
    return { frames: [] as number[], error: "Cần ít nhất một frame." };
  }

  const frames = tokens.map(Number);
  if (frames.some((frame) => !Number.isInteger(frame))) {
    return {
      frames: [] as number[],
      error: "Chỉ nhập số nguyên, cách nhau bằng dấu phẩy.",
    };
  }

  const unsupported = frames.find(
    (frame) => !SUPPORTED_CHARACTER_FRAMES.includes(frame),
  );
  if (unsupported !== undefined) {
    return {
      frames: [] as number[],
      error: `Frame ${unsupported} chưa có dữ liệu CharInfo trong tool.`,
    };
  }

  return { frames, error: null as string | null };
};

const clampOffset = (value: number) => Math.max(-128, Math.min(127, value));

type OffsetChangeSource =
  | "preview-drag"
  | "preview-keyboard"
  | "linked-grid-drag"
  | "linked-grid-keyboard";

type PreviewDragSession = {
  source: OffsetChangeSource;
  pointerId: number;
  partKey: PartKey;
  characterFrame: number;
  frameIndex: number;
  previewCharacterFrames: number[];
  runtimeCharacterFrames: number[];
  startClientX: number;
  startClientY: number;
  startDx: number;
  startDy: number;
  baseDx: number;
  baseDy: number;
  logicalWidth: number;
  displayScale: number;
  direction: PreviewDirection;
  nextDx: number;
  nextDy: number;
};

type ResourceScale = 1 | 2 | 3 | 4;
type PreviewDirection = "left" | "right";
type PreviewFrameMode = "game" | "custom";
type WorkspaceViewMode = "frame-type" | "related";
type CharacterFrameOverrides = Partial<
  Record<number, Record<PartKey, number>>
>;
type OffsetChangeContext = {
  source: OffsetChangeSource;
  characterFrame: number;
  baseDx: number;
  baseDy: number;
  previewCharacterFrames: number[];
  runtimeCharacterFrames: number[];
};

type AlignmentStep = {
  characterFrame: number;
  partKey: PartKey;
  partFrame: number;
};

type SavedAssetReference = {
  name: string;
  iconId: number | null;
};

type SavedFrameAssignment = {
  asset: SavedAssetReference | null;
  dx: number;
  dy: number;
};

type SavedPartConfiguration = Omit<
  ComposerParts[PartKey],
  "frames"
> & {
  frames: SavedFrameAssignment[];
};

type ComposerConfigFile = {
  schema: "htth-fashion-composer";
  version: 2;
  exportedAt: string;
  mappingMode: "game";
  fashion: FashionConfiguration;
  parts: Record<PartKey, SavedPartConfiguration>;
  preview: {
    activePart: PartKey;
    previewFrames: Record<PartKey, number>;
    visibility: Record<PartKey, boolean>;
    zoom: number;
  };
};

type PendingAssetBindings = Record<
  PartKey,
  Array<SavedAssetReference | null>
>;

const COMPOSER_CONFIG_SCHEMA = "htth-fashion-composer";
const COMPOSER_CONFIG_VERSION = 2;
const SUPPORTED_COMPOSER_CONFIG_VERSIONS = [1, 2] as const;

const createEmptyAssetBindings = (): PendingAssetBindings =>
  Object.fromEntries(
    PART_SPECS.map((spec) => [
      spec.key,
      Array.from({ length: spec.frameCount }, () => null),
    ]),
  ) as PendingAssetBindings;

const normalizeAssetName = (name: string) => name.trim().toLocaleLowerCase();

const assetMatchesReference = (
  asset: Pick<UploadedPartAsset, "name" | "iconId">,
  reference: SavedAssetReference,
) =>
  (reference.iconId !== null && asset.iconId === reference.iconId) ||
  normalizeAssetName(asset.name) === normalizeAssetName(reference.name);

const findAssetByReference = (
  assets: UploadedPartAsset[],
  reference: SavedAssetReference,
) => {
  if (reference.iconId !== null) {
    const iconMatch = assets.find(
      (asset) => asset.iconId === reference.iconId,
    );
    if (iconMatch) return iconMatch;
  }
  return assets.find(
    (asset) =>
      normalizeAssetName(asset.name) === normalizeAssetName(reference.name),
  );
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isPartKey = (value: unknown): value is PartKey =>
  typeof value === "string" && value in PART_SPEC_BY_KEY;

const requireInteger = (value: unknown, label: string) => {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`${label} phải là số nguyên.`);
  }
  return value;
};

const requireNullableInteger = (value: unknown, label: string) =>
  value === null ? null : requireInteger(value, label);

const requireBoolean = (value: unknown, label: string) => {
  if (typeof value !== "boolean") {
    throw new Error(`${label} phải là true hoặc false.`);
  }
  return value;
};

function parseComposerConfigFile(value: unknown): ComposerConfigFile {
  if (!isRecord(value)) throw new Error("File config không phải JSON object.");
  const sourceVersion = value.version;
  if (
    value.schema !== COMPOSER_CONFIG_SCHEMA ||
    typeof sourceVersion !== "number" ||
    !SUPPORTED_COMPOSER_CONFIG_VERSIONS.includes(
      sourceVersion as (typeof SUPPORTED_COMPOSER_CONFIG_VERSIONS)[number],
    )
  ) {
    throw new Error("File config không đúng loại hoặc chưa được hỗ trợ.");
  }
  if (value.mappingMode !== "game") {
    throw new Error("Config phải sử dụng mapping Theo game.");
  }

  const rawFashion = value.fashion;
  if (!isRecord(rawFashion)) throw new Error("Thiếu cấu hình fashion.");
  const rawMwearOverrides = isRecord(rawFashion.mwearOverrides)
    ? rawFashion.mwearOverrides
    : {};
  const fashion: FashionConfiguration = {
    id: requireNullableInteger(rawFashion.id, "Fashion ID"),
    icon: requireNullableInteger(rawFashion.icon, "Fashion icon"),
    name: typeof rawFashion.name === "string" ? rawFashion.name : "",
    info: typeof rawFashion.info === "string" ? rawFashion.info : "",
    price: requireInteger(rawFashion.price, "Giá"),
    hsd: requireInteger(rawFashion.hsd, "Hạn sử dụng"),
    shopSale: requireBoolean(rawFashion.shopSale, "Trạng thái mở bán"),
    op: typeof rawFashion.op === "string" ? rawFashion.op : "[]",
    specOp:
      typeof rawFashion.specOp === "string" ? rawFashion.specOp : "[]",
    mwearOverrides: Object.fromEntries(
      MWEAR_OVERRIDE_SLOTS.map((slot) => [
        slot,
        rawMwearOverrides[slot] === undefined
          ? false
          : requireBoolean(
              rawMwearOverrides[slot],
              `mwear slot ${slot} sentinel -2`,
            ),
      ]),
    ) as FashionConfiguration["mwearOverrides"],
  };

  const rawParts = value.parts;
  if (!isRecord(rawParts)) throw new Error("Thiếu cấu hình parts.");
  const parts = Object.fromEntries(
    PART_SPECS.map((spec) => {
      const rawPart = rawParts[spec.key];
      if (sourceVersion === 1 && spec.key === "weapon" && rawPart === undefined) {
        return [
          spec.key,
          {
            enabled: false,
            partId: null,
            mwearSlot: spec.defaultMwearSlot,
            frames: Array.from({ length: spec.frameCount }, () => ({
              asset: null,
              dx: 0,
              dy: 0,
            })),
          },
        ];
      }
      if (!isRecord(rawPart) || !Array.isArray(rawPart.frames)) {
        throw new Error(`${spec.label}: cấu hình part không hợp lệ.`);
      }
      if (rawPart.frames.length !== spec.frameCount) {
        throw new Error(`${spec.label}: sai số lượng frame trong config.`);
      }
      const frames = rawPart.frames.map((rawFrame, index) => {
        if (!isRecord(rawFrame)) {
          throw new Error(`${spec.label} frame ${index}: dữ liệu không hợp lệ.`);
        }
        let asset: SavedAssetReference | null = null;
        if (rawFrame.asset !== null && rawFrame.asset !== undefined) {
          if (!isRecord(rawFrame.asset) || typeof rawFrame.asset.name !== "string") {
            throw new Error(`${spec.label} frame ${index}: asset không hợp lệ.`);
          }
          asset = {
            name: rawFrame.asset.name,
            iconId: requireNullableInteger(
              rawFrame.asset.iconId,
              `${spec.label} frame ${index} icon ID`,
            ),
          };
        }
        const dx = requireInteger(rawFrame.dx, `${spec.label} frame ${index} dx`);
        const dy = requireInteger(rawFrame.dy, `${spec.label} frame ${index} dy`);
        if (dx < -128 || dx > 127 || dy < -128 || dy > 127) {
          throw new Error(`${spec.label} frame ${index}: offset vượt giới hạn byte.`);
        }
        return { asset, dx, dy };
      });
      return [
        spec.key,
        {
          enabled: requireBoolean(
            rawPart.enabled,
            `${spec.label} trạng thái xuất part`,
          ),
          partId: requireNullableInteger(
            rawPart.partId,
            `${spec.label} Part ID`,
          ),
          mwearSlot: requireInteger(
            rawPart.mwearSlot,
            `${spec.label} mwear slot`,
          ),
          frames,
        },
      ];
    }),
  ) as Record<PartKey, SavedPartConfiguration>;

  const rawPreview = value.preview;
  if (!isRecord(rawPreview) || !isPartKey(rawPreview.activePart)) {
    throw new Error("Thiếu cấu hình Preview.");
  }
  if (!isRecord(rawPreview.previewFrames) || !isRecord(rawPreview.visibility)) {
    throw new Error("Cấu hình frame Preview không hợp lệ.");
  }
  const rawPreviewFrames = rawPreview.previewFrames;
  const rawVisibility = rawPreview.visibility;
  const previewFrames = Object.fromEntries(
    PART_SPECS.map((spec) => {
      const rawFrame = rawPreviewFrames[spec.key];
      const frame =
        sourceVersion === 1 && spec.key === "weapon" && rawFrame === undefined
          ? 0
          : requireInteger(rawFrame, `${spec.label} preview frame`);
      return [spec.key, Math.max(0, Math.min(spec.frameCount - 1, frame))];
    }),
  ) as Record<PartKey, number>;
  const visibility = Object.fromEntries(
    PART_SPECS.map((spec) => [
      spec.key,
      sourceVersion === 1 &&
      spec.key === "weapon" &&
      rawVisibility[spec.key] === undefined
        ? true
        : requireBoolean(
            rawVisibility[spec.key],
            `${spec.label} trạng thái hiển thị`,
          ),
    ]),
  ) as Record<PartKey, boolean>;
  const zoom = requireInteger(rawPreview.zoom, "Độ phóng Preview");

  return {
    schema: COMPOSER_CONFIG_SCHEMA,
    version: COMPOSER_CONFIG_VERSION,
    exportedAt:
      typeof value.exportedAt === "string" ? value.exportedAt : "",
    mappingMode: "game",
    fashion,
    parts,
    preview: {
      activePart: rawPreview.activePart,
      previewFrames,
      visibility,
      zoom: Math.max(1, Math.min(6, zoom)),
    },
  };
}

const getLogicalSize = (physicalSize: number, resourceScale: ResourceScale) =>
  Math.floor(physicalSize / resourceScale);

const getRenderTranslation = (
  baseDx: number,
  baseDy: number,
  dx: number,
  dy: number,
  logicalWidth: number,
  direction: PreviewDirection,
) => ({
  x: direction === "left" ? baseDx + dx : -baseDx - dx - logicalWidth,
  y: baseDy + dy,
});

const getRuntimeBaseOffset = (
  characterFrame: number,
  partKey: PartKey,
  bodyPartId: number | null,
  headPartId: number | null,
) => {
  const baseOffset = CHARACTER_POSE_FRAMES[characterFrame][partKey];
  const headDy =
    bodyPartId !== null && BIG_BODY_HEAD_SHIFT_IDS.has(bodyPartId) ? -6 : 0;
  const receivesHeadShift =
    partKey === "accessory" ||
    partKey === "cloak" ||
    (partKey === "head" &&
      (headPartId === null || !HEAD_SHIFT_EXEMPT_IDS.has(headPartId)));
  return receivesHeadShift && headDy !== 0
    ? { ...baseOffset, baseDy: baseOffset.baseDy + headDy }
    : baseOffset;
};

const getRuntimeCharacterFrames = (
  partKey: PartKey,
  partFrame: number,
) =>
  SUPPORTED_CHARACTER_FRAMES.filter(
    (frame) => CHARACTER_POSE_FRAMES[frame][partKey].frame === partFrame,
  );

const getOffsetAlignmentOwner = (partKey: PartKey, partFrame: number) =>
  getRuntimeCharacterFrames(partKey, partFrame)[0];

// Keep the workflow stable: anchor feet to the ground first, then join the
// upper layers. Later character frames may reuse any of these PartImages.
const ALIGNMENT_PART_ORDER: readonly PartKey[] = [
  "legs",
  "body",
  "head",
  "accessory",
  "cloak",
  "weapon",
];

const getCharacterFrameCategory = (characterFrame: number) => {
  if (characterFrame <= 1) {
    return {
      label: "Stand",
      description: "Frame đứng yên lấy trực tiếp từ MainObject.feStand.",
      isSpecial: false,
    };
  }
  if (characterFrame <= 7) {
    return {
      label: "Run",
      description: "Frame chạy lấy trực tiếp từ MainObject.feRun.",
      isSpecial: false,
    };
  }
  if (characterFrame === 38) {
    return {
      label: "Die",
      description: "Frame gục ngã cố định của Action = 4.",
      isSpecial: false,
    };
  }
  return {
    label: "Attack",
    description:
      "Game chỉ dùng frame này khi action hoặc Plash của skill trỏ tới. Ảnh ghép tĩnh có thể trông lạ khi thiếu chuyển động và effect.",
    isSpecial: true,
  };
};

const WORKSPACE_FRAME_GROUPS = [
  {
    key: "stand",
    label: "STAND",
    description: "Frame đứng yên",
    frames: SUPPORTED_CHARACTER_FRAMES.filter((frame) => frame <= 1),
  },
  {
    key: "run",
    label: "RUN",
    description: "Frame di chuyển",
    frames: SUPPORTED_CHARACTER_FRAMES.filter(
      (frame) => frame >= 2 && frame <= 7,
    ),
  },
  {
    key: "attack",
    label: "ATTACK",
    description: "Frame tấn công, skill và trạng thái đặc biệt",
    frames: SUPPORTED_CHARACTER_FRAMES.filter(
      (frame) => frame > 7 && frame !== 38,
    ),
  },
  {
    key: "die",
    label: "DIE",
    description: "Frame gục ngã",
    frames: SUPPORTED_CHARACTER_FRAMES.filter((frame) => frame === 38),
  },
] as const;

const getEffectivePreviewPartFrame = (
  frameOverrides: CharacterFrameOverrides,
  characterFrame: number,
  partKey: PartKey,
) =>
  frameOverrides[characterFrame]?.[partKey] ??
  CHARACTER_POSE_FRAMES[characterFrame][partKey].frame;

const getPreviewCharacterFrames = (
  frameOverrides: CharacterFrameOverrides,
  partKey: PartKey,
  partFrame: number,
) =>
  SUPPORTED_CHARACTER_FRAMES.filter(
    (frame) =>
      getEffectivePreviewPartFrame(frameOverrides, frame, partKey) ===
      partFrame,
  );

const formatCharacterFrames = (frames: number[]) => {
  const visibleFrames = frames.slice(0, 12).join(", ");
  const remaining = frames.length - 12;
  return remaining > 0 ? `${visibleFrames}, +${remaining} frame` : visibleFrames;
};

const mwearOptions = [
  { value: -1, label: "Không gắn vào mwear" },
  { value: 0, label: "Slot 0 · Weapon" },
  { value: 1, label: "Slot 1 · Hat / Phụ kiện" },
  { value: 2, label: "Slot 2" },
  { value: 3, label: "Slot 3 · Body" },
  { value: 4, label: "Slot 4 · Cloak" },
  { value: 5, label: "Slot 5 · Legs" },
  { value: 6, label: "Slot 6 · Head" },
  { value: 7, label: "Slot 7 · Hair" },
];

function FieldLabel({ children, hint }: { children: string; hint?: string }) {
  return (
    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
      {children}
      {hint && (
        <span className="ml-1 font-normal text-slate-400">({hint})</span>
      )}
    </label>
  );
}

const PART_REQUIREMENT_LABELS = {
  required: "bắt buộc",
  "head-or-hat": "chọn ít nhất Head hoặc Hat",
  optional: "tùy chọn",
} as const;

function getImageDimensions(url: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () =>
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = reject;
    image.src = url;
  });
}

function AssetLibrary({
  partKey,
  assets,
  onUpload,
  onChangeIcon,
  onAssignAll,
  onRemove,
}: {
  partKey: PartKey;
  assets: UploadedPartAsset[];
  onUpload: (file: File) => void;
  onChangeIcon: (assetId: string, iconId: number | null) => void;
  onAssignAll: (assetId: string) => void;
  onRemove: (assetId: string) => void;
}) {
  return (
    <section aria-labelledby={`${partKey}-assets-heading`}>
      <div className="mb-3">
        <h3
          id={`${partKey}-assets-heading`}
          className="text-sm font-bold text-slate-800"
        >
          Kho ảnh part
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Mỗi ảnh mới tự gán vào frame trống kế tiếp, không duplicate để lấp đầy
          các frame còn lại. Sau đó vẫn có thể đổi từng frame bằng dropdown. File
          chỉ nằm trong trình duyệt, không upload lên server. Tên file 10xxx sẽ
          tự bỏ offset 10000, Icon ID vẫn sửa được. Nếu đã import config, asset
          chờ khớp sẽ được ưu tiên trước auto-fill.
        </p>
      </div>

      <Dragger
        accept=".png,.jpg,.jpeg,.webp"
        multiple
        fileList={[]}
        showUploadList={false}
        beforeUpload={(file) => {
          onUpload(file);
          return false;
        }}
        className="!bg-slate-50 hover:!border-amber-500"
      >
        <div className="flex items-center justify-center gap-3 px-4 py-2">
          <ImagePlus size={22} className="text-amber-700" />
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-700">
              Thả ảnh hoặc bấm để chọn
            </p>
            <p className="text-xs text-slate-400">PNG, JPG, WEBP tối đa 5MB</p>
          </div>
        </div>
      </Dragger>

      {assets.length > 0 && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="flex min-w-0 gap-3 rounded-xl border border-slate-200 bg-white p-3"
            >
              <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] bg-[length:12px_12px] bg-[position:0_0,0_6px,6px_-6px,-6px_0px]">
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="max-h-full max-w-full object-contain [image-rendering:pixelated]"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-700">
                  {asset.name}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {asset.width} x {asset.height}px
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <InputNumber<number>
                    aria-label={`Icon ID của ${asset.name}`}
                    value={asset.iconId ?? undefined}
                    min={-32_768}
                    max={32_767}
                    precision={0}
                    placeholder="Icon ID"
                    controls={false}
                    className="min-w-0 flex-1"
                    onChange={(value) => onChangeIcon(asset.id, value)}
                  />
                  <Tooltip title="Gán ảnh này cho toàn bộ frame">
                    <Button
                      aria-label={`Gán ${asset.name} cho toàn bộ frame`}
                      icon={<Check size={15} />}
                      onClick={() => onAssignAll(asset.id)}
                    />
                  </Tooltip>
                  <Popconfirm
                    title="Xóa ảnh part?"
                    description="Các frame đang dùng ảnh này sẽ được bỏ chọn."
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => onRemove(asset.id)}
                  >
                    <Button
                      danger
                      aria-label={`Xóa ${asset.name}`}
                      icon={<Trash2 size={15} />}
                    />
                  </Popconfirm>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function FrameEditor({
  partKey,
  frames,
  assets,
  previewFrame,
  onChange,
  onPreview,
}: {
  partKey: PartKey;
  frames: FrameAssignment[];
  assets: UploadedPartAsset[];
  previewFrame: number;
  onChange: (index: number, patch: Partial<FrameAssignment>) => void;
  onPreview: (index: number) => void;
}) {
  const spec = PART_SPEC_BY_KEY[partKey];
  const assetOptions = assets.map((asset) => ({
    value: asset.id,
    label: `${asset.name}${asset.iconId === null ? "" : ` [${asset.iconId}]`}`,
  }));

  return (
    <section className="mt-6" aria-labelledby={`${partKey}-frames-heading`}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3
            id={`${partKey}-frames-heading`}
            className="text-sm font-bold text-slate-800"
          >
            Gán part cho frame
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Khi bật nhóm này, cần đủ {spec.frameCount} frame cho parts.type = {spec.type}.
            Auto-fill gán tuần tự đến ảnh cuối cùng, không ghi đè lựa chọn hiện
            có; dropdown dùng để custom từng frame.
          </p>
        </div>
        <Tag color="gold">
          {frames.filter((frame) => frame.assetId).length}/{spec.frameCount} đã
          gán
        </Tag>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="hidden grid-cols-[76px_minmax(180px,1fr)_92px_92px_64px] gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 md:grid">
          <span>Frame</span>
          <span>Part đã chọn</span>
          <span>Offset X</span>
          <span>Offset Y</span>
          <span>Xem</span>
        </div>
        <div className="divide-y divide-slate-100">
          {frames.map((frame, index) => {
            const asset = assets.find((item) => item.id === frame.assetId);
            const isPreviewed = previewFrame === index;
            return (
              <div
                key={index}
                className={`grid gap-3 p-3 md:grid-cols-[76px_minmax(180px,1fr)_92px_92px_64px] md:items-center ${isPreviewed ? "bg-amber-50/70" : "bg-white"}`}
              >
                <button
                  type="button"
                  onClick={() => onPreview(index)}
                  className="flex items-center gap-2 text-left text-xs font-bold text-slate-700"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 font-mono text-[11px]">
                    {index}
                  </span>
                  <span className="md:hidden">Frame {index}</span>
                </button>
                <Select
                  value={frame.assetId ?? undefined}
                  options={assetOptions}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder={
                    assets.length ? "Chọn ảnh part" : "Upload ảnh trước"
                  }
                  className="w-full"
                  onChange={(assetId) =>
                    onChange(index, { assetId: assetId ?? null })
                  }
                  notFoundContent="Chưa có ảnh part"
                />
                <div>
                  <span className="mb-1 block text-[11px] font-semibold text-slate-500 md:hidden">
                    Offset X
                  </span>
                  <InputNumber<number>
                    aria-label={`Offset X frame ${index}`}
                    value={frame.dx}
                    min={-128}
                    max={127}
                    precision={0}
                    controls={false}
                    className="w-full"
                    onChange={(value) => onChange(index, { dx: value ?? 0 })}
                  />
                </div>
                <div>
                  <span className="mb-1 block text-[11px] font-semibold text-slate-500 md:hidden">
                    Offset Y
                  </span>
                  <InputNumber<number>
                    aria-label={`Offset Y frame ${index}`}
                    value={frame.dy}
                    min={-128}
                    max={127}
                    precision={0}
                    controls={false}
                    className="w-full"
                    onChange={(value) => onChange(index, { dy: value ?? 0 })}
                  />
                </div>
                <Button
                  type={isPreviewed ? "primary" : "default"}
                  aria-label={`Xem frame ${index}`}
                  icon={
                    asset ? (
                      <img
                        src={asset.url}
                        alt=""
                        className="h-5 w-5 object-contain [image-rendering:pixelated]"
                      />
                    ) : (
                      <Eye size={14} />
                    )
                  }
                  onClick={() => onPreview(index)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ComposerPreview({
  parts,
  assets,
  visibility,
  selectedLayer,
  zoom,
  onChangeFrame,
  onSelectLayer,
  onChangeOffset,
  onToggleVisibility,
  onChangeZoom,
}: {
  parts: ComposerParts;
  assets: ComposerAssets;
  visibility: Record<PartKey, boolean>;
  selectedLayer: PartKey;
  zoom: number;
  onChangeFrame: (key: PartKey, frame: number) => void;
  onSelectLayer: (key: PartKey) => void;
  onChangeOffset: (
    key: PartKey,
    frameIndex: number,
    dx: number,
    dy: number,
    context: OffsetChangeContext,
  ) => void;
  onToggleVisibility: (key: PartKey) => void;
  onChangeZoom: (zoom: number) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [animationEnabled, setAnimationEnabled] = useState(false);
  const [selectedPose, setSelectedPose] = useState<PoseKey>("stand");
  const [poseInputs, setPoseInputs] = useState(createInitialPoseInputs);
  const [animationStep, setAnimationStep] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [resourceScale, setResourceScale] = useState<ResourceScale>(4);
  const [direction, setDirection] = useState<PreviewDirection>("left");
  const [workspaceViewMode, setWorkspaceViewMode] =
    useState<WorkspaceViewMode>("frame-type");
  const [frameOverrides, setFrameOverrides] =
    useState<CharacterFrameOverrides>({});
  const [selectionVisible, setSelectionVisible] = useState(true);
  const [referenceCharacterFrame, setReferenceCharacterFrame] = useState(0);
  const dragSessionRef = useRef<PreviewDragSession | null>(null);
  const linkedGridLayerRefs = useRef<
    Record<number, Partial<Record<PartKey, HTMLDivElement | null>>>
  >({});
  const linkedGridSelectionRefs = useRef<
    Record<number, HTMLDivElement | null>
  >({});
  const coordinatesRef = useRef<HTMLSpanElement | null>(null);
  // Mirrors MainObject.mSortPaint/mSortPaintRight for supported layers.
  const layerOrder: PartKey[] =
    direction === "left"
      ? ["cloak", "legs", "body", "head", "accessory", "weapon"]
      : ["cloak", "legs", "body", "weapon", "head", "accessory"];
  const poseValidation = useMemo(
    () =>
      Object.fromEntries(
        POSE_SPECS.map((pose) => [
          pose.key,
          parsePoseSequence(poseInputs[pose.key]),
        ]),
      ) as Record<PoseKey, ReturnType<typeof parsePoseSequence>>,
    [poseInputs],
  );
  const allPoseSequence = (["stand", "run", "attack", "die"] as const).flatMap(
    (pose) => poseValidation[pose].frames,
  );
  const currentPoseSequence =
    selectedPose === "all"
      ? allPoseSequence
      : poseValidation[selectedPose].frames;
  const animationCharacterFrame = currentPoseSequence.length
    ? currentPoseSequence[animationStep % currentPoseSequence.length]
    : undefined;
  const characterFrame =
    animationEnabled && animationCharacterFrame !== undefined
      ? animationCharacterFrame
      : referenceCharacterFrame;
  const characterPoseFrame =
    CHARACTER_POSE_FRAMES[characterFrame] ?? CHARACTER_POSE_FRAMES[0];
  const gamePreviewFrames = useMemo(
    () =>
      Object.fromEntries(
        PART_SPECS.map((spec) => [
          spec.key,
          characterPoseFrame[spec.key].frame,
        ]),
      ) as Record<PartKey, number>,
    [characterPoseFrame],
  );
  const currentFrameOverride = frameOverrides[characterFrame];
  const isCurrentFrameCustom = Boolean(currentFrameOverride);
  const effectivePreviewFrames = currentFrameOverride ?? gamePreviewFrames;
  const bodyPartId = parts.body.enabled ? parts.body.partId : null;
  const headPartId = parts.head.enabled ? parts.head.partId : null;
  const runtimeHeadDy =
    bodyPartId !== null && BIG_BODY_HEAD_SHIFT_IDS.has(bodyPartId) ? -6 : 0;
  const bodyStandOverlayEffectId =
    bodyPartId === null
      ? undefined
      : BODY_STAND_OVERLAY_EFFECT_BY_PART_ID[bodyPartId];
  const getBaseOffsetForCharacterFrame = (
    candidateFrame: number,
    key: PartKey,
  ) => getRuntimeBaseOffset(candidateFrame, key, bodyPartId, headPartId);
  const getBaseOffset = (key: PartKey) =>
    getBaseOffsetForCharacterFrame(characterFrame, key);
  const selectedBaseOffset = getBaseOffset(selectedLayer);
  const selectedConfiguration = parts[selectedLayer];
  const selectedFrameIndex = effectivePreviewFrames[selectedLayer];
  const selectedFrame = selectedConfiguration.frames[selectedFrameIndex];
  const selectedAsset = assets[selectedLayer].find(
    (item) => item.id === selectedFrame?.assetId,
  );
  const selectedRuntimeCharacterFrames = getRuntimeCharacterFrames(
    selectedLayer,
    selectedFrameIndex,
  );
  const selectedPreviewCharacterFrames = getPreviewCharacterFrames(
    frameOverrides,
    selectedLayer,
    selectedFrameIndex,
  );
  const workspaceCharacterFrames = SUPPORTED_CHARACTER_FRAMES;
  const relatedWorkspaceFrameGroups = useMemo(() => {
    const framesByPartFrame = new Map<number, number[]>();
    SUPPORTED_CHARACTER_FRAMES.forEach((candidateFrame) => {
      const partFrame =
        CHARACTER_POSE_FRAMES[candidateFrame][selectedLayer].frame;
      const relatedFrames = framesByPartFrame.get(partFrame) ?? [];
      relatedFrames.push(candidateFrame);
      framesByPartFrame.set(partFrame, relatedFrames);
    });

    return Array.from(framesByPartFrame.entries())
      .sort(([, leftFrames], [, rightFrames]) =>
        (leftFrames[0] ?? 0) - (rightFrames[0] ?? 0),
      )
      .map(([partFrame, frames]) => {
        const frameTypes = Array.from(
          new Set(
            frames.map((candidateFrame) =>
              getCharacterFrameCategory(candidateFrame).label.toUpperCase(),
            ),
          ),
        );
        return {
          key: `related-${partFrame}`,
          label: `PART FRAME ${partFrame}`,
          description: `Mốc character frame ${getOffsetAlignmentOwner(selectedLayer, partFrame) ?? "-"} · ${frameTypes.join(" + ")} dùng chung offset`,
          frames,
        };
      });
  }, [selectedLayer]);
  const visibleWorkspaceFrameGroups =
    workspaceViewMode === "related"
      ? relatedWorkspaceFrameGroups
      : WORKSPACE_FRAME_GROUPS;
  const selectedOffsetOwner = getOffsetAlignmentOwner(
    selectedLayer,
    selectedFrameIndex,
  );
  const isSelectedOffsetLocked =
    selectedOffsetOwner !== undefined &&
    selectedOffsetOwner !== characterFrame;
  const isSelectedPreviewShared = selectedPreviewCharacterFrames.length > 1;
  const isSelectedRuntimeShared = selectedRuntimeCharacterFrames.length > 1;
  const previewMatchesRuntime =
    selectedPreviewCharacterFrames.length ===
      selectedRuntimeCharacterFrames.length &&
    selectedPreviewCharacterFrames.every(
      (frame, index) => frame === selectedRuntimeCharacterFrames[index],
    );
  const selectedLogicalWidth = selectedAsset
    ? getLogicalSize(selectedAsset.width, resourceScale)
    : 0;
  const selectedRenderPosition = selectedFrame
    ? getRenderTranslation(
        selectedBaseOffset.baseDx,
        selectedBaseOffset.baseDy,
        selectedFrame.dx,
        selectedFrame.dy,
        selectedLogicalWidth,
        direction,
      )
    : { x: 0, y: 0 };
  const selectedOwnerBaseOffset =
    selectedOffsetOwner === undefined
      ? null
      : getBaseOffsetForCharacterFrame(selectedOffsetOwner, selectedLayer);
  const selectedOwnerRenderPosition =
    selectedFrame && selectedOwnerBaseOffset
      ? getRenderTranslation(
          selectedOwnerBaseOffset.baseDx,
          selectedOwnerBaseOffset.baseDy,
          selectedFrame.dx,
          selectedFrame.dy,
          selectedLogicalWidth,
          direction,
        )
      : null;
  const characterFrameCategory = getCharacterFrameCategory(characterFrame);
  const getAlignmentPartsForCharacterFrame = (candidateFrame: number) =>
    ALIGNMENT_PART_ORDER.map((key) => PART_SPEC_BY_KEY[key]).filter((spec) => {
      if (!parts[spec.key].enabled) {
        return false;
      }
      const partFrame = CHARACTER_POSE_FRAMES[candidateFrame][spec.key].frame;
      const frame = parts[spec.key].frames[partFrame];
      return (
        Boolean(frame?.assetId) &&
        getOffsetAlignmentOwner(spec.key, partFrame) === candidateFrame
      );
    });
  const alignmentPartsAtCurrentFrame =
    getAlignmentPartsForCharacterFrame(characterFrame);
  const alignmentSteps = SUPPORTED_CHARACTER_FRAMES.flatMap(
    (candidateFrame): AlignmentStep[] =>
      getAlignmentPartsForCharacterFrame(candidateFrame).map((spec) => ({
        characterFrame: candidateFrame,
        partKey: spec.key,
        partFrame: CHARACTER_POSE_FRAMES[candidateFrame][spec.key].frame,
      })),
  );
  const alignmentFrames = Array.from(
    new Set(alignmentSteps.map((step) => step.characterFrame)),
  ).sort((a, b) => a - b);
  const currentAlignmentStepIndex = alignmentSteps.findIndex(
    (step) =>
      step.characterFrame === characterFrame &&
      step.partKey === selectedLayer &&
      step.partFrame === effectivePreviewFrames[selectedLayer],
  );
  const previousAlignmentStep =
    currentAlignmentStepIndex >= 0
      ? alignmentSteps[currentAlignmentStepIndex - 1]
      : alignmentSteps.reduce<AlignmentStep | undefined>(
          (previous, step) =>
            step.characterFrame < characterFrame ? step : previous,
          undefined,
        );
  const nextAlignmentStep =
    currentAlignmentStepIndex >= 0
      ? alignmentSteps[currentAlignmentStepIndex + 1]
      : alignmentSteps.find((step) => step.characterFrame >= characterFrame);
  const configuredPartFrameCount = PART_SPECS.reduce((total, spec) => {
    const configuration = parts[spec.key];
    if (!configuration.enabled) return total;
    return total + configuration.frames.filter((frame) => frame.assetId).length;
  }, 0);
  const currentAlignmentFrameIndex = alignmentFrames.indexOf(characterFrame);
  const currentRuntimePartSummary = PART_SPECS.filter((spec) => {
    const configuration = parts[spec.key];
    return configuration.enabled;
  })
    .map(
      (spec) => {
        const partFrame = characterPoseFrame[spec.key].frame;
        const owner = getOffsetAlignmentOwner(spec.key, partFrame);
        return `${spec.label} ${partFrame} (mốc ${owner ?? "-"})`;
      },
    )
    .join(" | ");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (
      !animationEnabled ||
      !isPlaying ||
      prefersReducedMotion ||
      currentPoseSequence.length <= 1
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setAnimationStep((current) => (current + 1) % currentPoseSequence.length);
    }, animationSpeed);
    return () => window.clearInterval(timer);
  }, [
    animationEnabled,
    animationSpeed,
    currentPoseSequence.length,
    isPlaying,
    prefersReducedMotion,
  ]);

  useEffect(() => {
    setAnimationStep(0);
    setIsPlaying(false);
  }, [selectedPose]);

  useEffect(() => {
    setSelectionVisible(true);
  }, [selectedLayer]);

  useEffect(() => {
    const snapshot = PART_SPECS.map((spec) => {
      const partFrame = effectivePreviewFrames[spec.key];
      const storedOffset = parts[spec.key].frames[partFrame];
      const baseOffset = getRuntimeBaseOffset(
        characterFrame,
        spec.key,
        bodyPartId,
        headPartId,
      );
      const alignmentOwner = getOffsetAlignmentOwner(spec.key, partFrame);
      const asset = assets[spec.key].find(
        (item) => item.id === storedOffset?.assetId,
      );
      const logicalWidth = asset
        ? getLogicalSize(asset.width, resourceScale)
        : 0;
      const renderPosition = getRenderTranslation(
        baseOffset.baseDx,
        baseOffset.baseDy,
        storedOffset?.dx ?? 0,
        storedOffset?.dy ?? 0,
        logicalWidth,
        direction,
      );
      const ownerBaseOffset =
        alignmentOwner === undefined
          ? null
          : getRuntimeBaseOffset(
              alignmentOwner,
              spec.key,
              bodyPartId,
              headPartId,
            );
      const ownerRenderPosition = ownerBaseOffset
        ? getRenderTranslation(
            ownerBaseOffset.baseDx,
            ownerBaseOffset.baseDy,
            storedOffset?.dx ?? 0,
            storedOffset?.dy ?? 0,
            logicalWidth,
            direction,
          )
        : null;
      return {
        part: spec.key,
        characterFrame,
        partFrame,
        direction,
        baseDx: baseOffset.baseDx,
        baseDy: baseOffset.baseDy,
        storedDx: storedOffset?.dx ?? null,
        storedDy: storedOffset?.dy ?? null,
        renderX: renderPosition.x,
        renderY: renderPosition.y,
        alignmentOwner: alignmentOwner ?? null,
        ownerBaseDx: ownerBaseOffset?.baseDx ?? null,
        ownerBaseDy: ownerBaseOffset?.baseDy ?? null,
        ownerRenderX: ownerRenderPosition?.x ?? null,
        ownerRenderY: ownerRenderPosition?.y ?? null,
        renderDeltaFromOwnerX:
          ownerRenderPosition === null
            ? null
            : renderPosition.x - ownerRenderPosition.x,
        renderDeltaFromOwnerY:
          ownerRenderPosition === null
            ? null
            : renderPosition.y - ownerRenderPosition.y,
        editableAtCurrentFrame: alignmentOwner === characterFrame,
        previewConsumers: getPreviewCharacterFrames(
          frameOverrides,
          spec.key,
          partFrame,
        ).join(","),
        runtimeConsumers: getRuntimeCharacterFrames(spec.key, partFrame).join(
          ",",
        ),
      };
    });

    console.groupCollapsed(
      `[FashionComposer][preview] characterFrame=${characterFrame}`,
    );
    console.table(snapshot);
    console.groupEnd();
  }, [
    bodyPartId,
    characterFrame,
    characterPoseFrame,
    direction,
    effectivePreviewFrames,
    frameOverrides,
    headPartId,
    assets,
    parts,
    resourceScale,
  ]);

  const changeCurrentFrameMode = (mode: PreviewFrameMode) => {
    setIsPlaying(false);
    setFrameOverrides((current) => {
      if (mode === "custom") {
        return current[characterFrame]
          ? current
          : {
              ...current,
              [characterFrame]: { ...gamePreviewFrames },
            };
      }

      const next = { ...current };
      delete next[characterFrame];
      return next;
    });
  };

  const changeCurrentPartFrame = (partKey: PartKey, frameIndex: number) => {
    setIsPlaying(false);
    setSelectionVisible(true);
    setFrameOverrides((current) => ({
      ...current,
      [characterFrame]: {
        ...(current[characterFrame] ?? gamePreviewFrames),
        [partKey]: frameIndex,
      },
    }));
    onSelectLayer(partKey);
    onChangeFrame(partKey, frameIndex);
  };

  const updateDraggedElements = (session: PreviewDragSession) => {
    const position = getRenderTranslation(
      session.baseDx,
      session.baseDy,
      session.nextDx,
      session.nextDy,
      session.logicalWidth,
      session.direction,
    );
    session.runtimeCharacterFrames.forEach((candidateFrame) => {
      const linkedLayer =
        linkedGridLayerRefs.current[candidateFrame]?.[session.partKey];
      if (!linkedLayer) return;
      const linkedBaseOffset = getBaseOffsetForCharacterFrame(
        candidateFrame,
        session.partKey,
      );
      const linkedPosition = getRenderTranslation(
        linkedBaseOffset.baseDx,
        linkedBaseOffset.baseDy,
        session.nextDx,
        session.nextDy,
        session.logicalWidth,
        session.direction,
      );
      linkedLayer.style.transform = `translate(${linkedPosition.x}px, ${linkedPosition.y}px)`;
      const linkedSelection =
        linkedGridSelectionRefs.current[candidateFrame];
      if (linkedSelection) {
        linkedSelection.style.transform = `translate(${linkedPosition.x}px, ${linkedPosition.y}px)`;
      }
    });
    if (coordinatesRef.current) {
      coordinatesRef.current.textContent = `Base ${session.baseDx},${session.baseDy} · Stored ${session.nextDx},${session.nextDy} · Render ${position.x},${position.y}`;
    }
  };

  const handleLinkedGridPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
    candidateFrame: number,
  ) => {
    if (event.button !== 0) return;

    const hitTarget =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>("[data-grid-part]")
        : null;
    const partKey = hitTarget?.dataset.gridPart as PartKey | undefined;
    if (!partKey) {
      event.preventDefault();
      event.stopPropagation();
      setSelectionVisible(false);
      setDragging(false);
      dragSessionRef.current = null;
      return;
    }

    const frameIndex =
      CHARACTER_POSE_FRAMES[candidateFrame][partKey].frame;
    const configuration = parts[partKey];
    const frame = configuration.frames[frameIndex];
    const asset = assets[partKey].find(
      (item) => item.id === frame?.assetId,
    );
    if (
      !configuration.enabled ||
      !visibility[partKey] ||
      !frame ||
      !asset
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setAnimationEnabled(false);
    setIsPlaying(false);
    setReferenceCharacterFrame(candidateFrame);
    setSelectionVisible(true);
    if (partKey !== selectedLayer) onSelectLayer(partKey);
    onChangeFrame(partKey, frameIndex);
    const { baseDx, baseDy } = getBaseOffsetForCharacterFrame(
      candidateFrame,
      partKey,
    );
    dragSessionRef.current = {
      source: "linked-grid-drag",
      pointerId: event.pointerId,
      partKey,
      characterFrame: candidateFrame,
      frameIndex,
      previewCharacterFrames: getPreviewCharacterFrames(
        frameOverrides,
        partKey,
        frameIndex,
      ),
      runtimeCharacterFrames: getRuntimeCharacterFrames(
        partKey,
        frameIndex,
      ),
      startClientX: event.clientX,
      startClientY: event.clientY,
      startDx: frame.dx,
      startDy: frame.dy,
      baseDx,
      baseDy,
      logicalWidth: getLogicalSize(asset.width, resourceScale),
      displayScale: zoom,
      direction,
      nextDx: frame.dx,
      nextDy: frame.dy,
    };
    setDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;

    const horizontalDirection = session.direction === "left" ? 1 : -1;
    session.nextDx = clampOffset(
      session.startDx +
        Math.round(
          (event.clientX - session.startClientX) / session.displayScale,
        ) *
          horizontalDirection,
    );
    session.nextDy = clampOffset(
      session.startDy +
        Math.round(
          (event.clientY - session.startClientY) / session.displayScale,
        ),
    );
    updateDraggedElements(session);
  };

  const finishPointerDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragSessionRef.current = null;
    setDragging(false);
    if (
      session.nextDx !== session.startDx ||
      session.nextDy !== session.startDy
    ) {
      console.debug("[FashionComposer][offset:alignment-owner]", {
        partKey: session.partKey,
        partFrame: session.frameIndex,
        alignmentCharacterFrame: getOffsetAlignmentOwner(
          session.partKey,
          session.frameIndex,
        ),
        editedAtCharacterFrame: session.characterFrame,
      });
    }
    onChangeOffset(
      session.partKey,
      session.frameIndex,
      session.nextDx,
      session.nextDy,
      {
        source: session.source,
        characterFrame: session.characterFrame,
        baseDx: session.baseDx,
        baseDy: session.baseDy,
        previewCharacterFrames: session.previewCharacterFrames,
        runtimeCharacterFrames: session.runtimeCharacterFrames,
      },
    );
  };

  const handleLinkedGridKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    candidateFrame: number,
  ) => {
    if (!selectionVisible) return;

    const keyDirection = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[event.key];
    if (!keyDirection) return;

    const frameIndex =
      CHARACTER_POSE_FRAMES[candidateFrame][selectedLayer].frame;
    const configuration = parts[selectedLayer];
    const frame = configuration.frames[frameIndex];
    const asset = assets[selectedLayer].find(
      (item) => item.id === frame?.assetId,
    );
    if (
      !configuration.enabled ||
      !visibility[selectedLayer] ||
      !frame ||
      !asset
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    inspectLinkedCharacterFrame(candidateFrame);
    const step = event.shiftKey ? 5 : 1;
    const horizontalDirection = direction === "left" ? 1 : -1;
    const nextDx = clampOffset(
      frame.dx + keyDirection[0] * step * horizontalDirection,
    );
    const nextDy = clampOffset(frame.dy + keyDirection[1] * step);
    if (nextDx === frame.dx && nextDy === frame.dy) return;

    const { baseDx, baseDy } = getBaseOffsetForCharacterFrame(
      candidateFrame,
      selectedLayer,
    );
    onChangeOffset(selectedLayer, frameIndex, nextDx, nextDy, {
      source: "linked-grid-keyboard",
      characterFrame: candidateFrame,
      baseDx,
      baseDy,
      previewCharacterFrames: getPreviewCharacterFrames(
        frameOverrides,
        selectedLayer,
        frameIndex,
      ),
      runtimeCharacterFrames: getRuntimeCharacterFrames(
        selectedLayer,
        frameIndex,
      ),
    });
  };

  const goToAlignmentStep = (step: AlignmentStep | undefined) => {
    if (!step) return;
    setAnimationEnabled(false);
    setIsPlaying(false);
    setReferenceCharacterFrame(step.characterFrame);
    setSelectionVisible(true);
    onSelectLayer(step.partKey);
    onChangeFrame(step.partKey, step.partFrame);
  };

  const inspectLinkedCharacterFrame = (candidateFrame: number) => {
    setAnimationEnabled(false);
    setIsPlaying(false);
    setReferenceCharacterFrame(candidateFrame);
    setSelectionVisible(true);
    onSelectLayer(selectedLayer);
    onChangeFrame(
      selectedLayer,
      CHARACTER_POSE_FRAMES[candidateFrame][selectedLayer].frame,
    );
  };

  return (
    <Card
      className="w-full border-slate-200 shadow-sm"
      styles={{ body: { padding: 24 } }}
    >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
                <Layers3 size={18} className="text-amber-700" />
                Preview tất cả frame
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Chọn layer rồi kéo trực tiếp trên bất kỳ ô nào để căn toàn bộ
                nhóm PartImage liên quan.
              </p>
            </div>
            <Tag color="gold">
              {SUPPORTED_CHARACTER_FRAMES.length} frame · Grid {zoom}x
            </Tag>
          </div>
          {(runtimeHeadDy !== 0 || bodyStandOverlayEffectId !== undefined) && (
            <Alert
              className="mb-3"
              type={bodyStandOverlayEffectId !== undefined ? "warning" : "info"}
              showIcon
              message={`Body ${bodyPartId}: có rule render riêng trong MainObject`}
              description={
                <div className="text-xs leading-5">
                  {runtimeHeadDy !== 0 && (
                    <p>
                      Preview đã cộng lechYHead {runtimeHeadDy}px cho Head,
                      Hat và Cloak giống Game.
                    </p>
                  )}
                  {bodyStandOverlayEffectId !== undefined && (
                    <p>
                      Stand frame 0-1 trong Game thay Body bằng effect{" "}
                      {bodyStandOverlayEffectId} (resource{" "}
                      {23_000 + bodyStandOverlayEffectId}.png). Preview hiện vẫn
                      dùng ảnh Body trong parts.data nên chưa mô phỏng overlay
                      này.
                    </p>
                  )}
                  {parts.weapon.enabled && runtimeHeadDy !== 0 && (
                    <p>
                      Weapon của body lớn còn nhận offset theo class nhân vật;
                      Preview đang hiển thị vị trí CharInfo gốc.
                    </p>
                  )}
                </div>
              }
            />
          )}
          <div className="mb-3 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[minmax(0,2fr)_minmax(180px,1fr)_minmax(180px,1fr)_minmax(180px,1fr)]">
            <div>
              <span className="mb-2 block text-xs font-semibold text-slate-600">
                Layer đang căn
              </span>
              <Segmented<PartKey>
                block
                value={selectionVisible ? selectedLayer : undefined}
                options={PART_SPECS.map((spec) => ({
                  value: spec.key,
                  label: spec.label,
                  disabled: !parts[spec.key].enabled,
                }))}
                onChange={(partKey) => {
                  setSelectionVisible(true);
                  onSelectLayer(partKey);
                }}
              />
            </div>
            <div>
              <span className="mb-2 block text-xs font-semibold text-slate-600">
                Scale resource
              </span>
              <Segmented<ResourceScale>
                block
                value={resourceScale}
                options={[1, 2, 3, 4].map((value) => ({
                  value: value as ResourceScale,
                  label: `x${value}`,
                }))}
                onChange={setResourceScale}
              />
            </div>
            <div>
              <span className="mb-2 block text-xs font-semibold text-slate-600">
                Hướng nhân vật
              </span>
              <Segmented<PreviewDirection>
                block
                value={direction}
                options={[
                  { value: "left", label: "Trái" },
                  { value: "right", label: "Phải" },
                ]}
                onChange={setDirection}
              />
            </div>
            <div>
              <span className="mb-2 block text-xs font-semibold text-slate-600">
                Độ phóng grid
              </span>
              <Segmented<number>
                block
                value={zoom}
                options={[1, 2, 3, 4, 5, 6].map((value) => ({
                  value,
                  label: `${value}x`,
                }))}
                onChange={onChangeZoom}
              />
            </div>
          </div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs">
            <span className="font-semibold text-amber-800">
              {selectionVisible
                ? `${PART_SPEC_BY_KEY[selectedLayer].label} / Frame ${selectedFrameIndex}`
                : "Không chọn layer"}
            </span>
            <span
              ref={coordinatesRef}
              className="font-mono text-amber-700"
            >
              {selectionVisible
                ? `Base ${selectedBaseOffset.baseDx},${selectedBaseOffset.baseDy} · Stored ${selectedFrame?.dx ?? 0},${selectedFrame?.dy ?? 0} · Render ${selectedRenderPosition.x},${selectedRenderPosition.y}`
                : "Click part để chọn lại"}
            </span>
          </div>
          {selectionVisible &&
            (isSelectedOffsetLocked ||
              isSelectedPreviewShared ||
              isSelectedRuntimeShared) && (
            <Alert
              className="mt-3"
              type={
                !previewMatchesRuntime ? "warning" : "info"
              }
              showIcon
              action={
                isSelectedOffsetLocked && selectedOffsetOwner !== undefined ? (
                  <Button
                    size="small"
                    onClick={() =>
                      goToAlignmentStep({
                        characterFrame: selectedOffsetOwner,
                        partKey: selectedLayer,
                        partFrame: selectedFrameIndex,
                      })
                    }
                  >
                    Về mốc {selectedOffsetOwner}
                  </Button>
                ) : undefined
              }
              message={
                isSelectedOffsetLocked
                  ? "PartImage đang được dùng lại từ frame mốc"
                  : !previewMatchesRuntime
                    ? "Preview tùy chỉnh khác CharInfo của Game"
                    : "Đây là frame mốc của PartImage"
              }
              description={
                <div className="text-xs leading-5">
                  {PART_SPEC_BY_KEY[selectedLayer].label}{" "}
                  frame {selectedFrameIndex} được dùng bởi character frame:{" "}
                  {formatCharacterFrames(selectedPreviewCharacterFrames)}.{" "}
                  {!previewMatchesRuntime && (
                    <>
                      Theo CharInfo của Game, part frame này vẫn được dùng bởi:{" "}
                      {formatCharacterFrames(selectedRuntimeCharacterFrames)}.
                      Override chỉ tách mapping trong Preview; SQL parts không
                      thay CharInfo của client.{" "}
                    </>
                  )}
                  {isSelectedOffsetLocked
                    ? `Character frame ${selectedOffsetOwner} là lần xuất hiện sớm nhất của PartImage này. Kéo tại frame ${characterFrame} hoặc bất kỳ ô cùng nhóm mốc sẽ sửa offset chung và cập nhật tất cả consumer ngay trong grid.`
                    : isSelectedPreviewShared &&
                        selectedOffsetOwner === characterFrame
                      ? `Character frame ${characterFrame} là lần xuất hiện sớm nhất. Kéo bất kỳ ô nào cùng nhóm để căn và theo dõi mọi consumer cùng lúc.`
                      : isSelectedPreviewShared
                        ? "Offset vẫn thuộc character frame mốc nhỏ nhất theo CharInfo của Game."
                        : `Character frame ${characterFrame} là mốc duy nhất của PartImage này.`}
                  {selectedOwnerBaseOffset && selectedOwnerRenderPosition && (
                    <p className="mt-1 font-mono text-[10px]">
                      Frame {characterFrame}: base {selectedBaseOffset.baseDx},
                      {selectedBaseOffset.baseDy} · render {selectedRenderPosition.x},
                      {selectedRenderPosition.y}. Mốc {selectedOffsetOwner}: base{" "}
                      {selectedOwnerBaseOffset.baseDx},
                      {selectedOwnerBaseOffset.baseDy} · render{" "}
                      {selectedOwnerRenderPosition.x},{selectedOwnerRenderPosition.y}.
                    </p>
                  )}
                </div>
              }
            />
            )}
          <section
            className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
            aria-label="Workspace tất cả character frame"
          >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-white px-3 py-3">
                <div>
                  <h3 className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <LayoutGrid size={14} className="text-amber-700" />
                    Grid căn đồng bộ
                  </h3>
                  <p className="mt-1 text-[11px] leading-4 text-slate-500">
                    Hiển thị toàn bộ {workspaceCharacterFrames.length} character
                    frame theo CharInfo Game.{" "}
                    {workspaceViewMode === "related"
                      ? selectionVisible
                        ? `Combine theo ${PART_SPEC_BY_KEY[selectedLayer].label}: mỗi block gom mọi character frame đang dùng chung một PartFrame và offset.`
                        : "Chọn một part để combine các character frame liên quan."
                      : selectionVisible
                        ? `Kéo ${PART_SPEC_BY_KEY[selectedLayer].label} trong một ô; mọi ô dùng chung PartImage sẽ cập nhật ngay. Viền vàng đánh dấu nhóm PartFrame đang active.`
                        : "Click trực tiếp một part để chọn và kéo. Click vùng trống để bỏ chọn."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Segmented<WorkspaceViewMode>
                    size="small"
                    value={workspaceViewMode}
                    options={[
                      { value: "frame-type", label: "Theo frame type" },
                      { value: "related", label: "Combine liên quan" },
                    ]}
                    onChange={setWorkspaceViewMode}
                  />
                  <Tag color="gold">
                    {selectionVisible
                      ? `Layer: ${PART_SPEC_BY_KEY[selectedLayer].label}`
                      : "Chưa chọn layer"}
                  </Tag>
                </div>
              </div>
              <div className="divide-y divide-slate-200 px-3">
                {workspaceViewMode === "related" && !selectionVisible ? (
                  <div className="px-4 py-12 text-center">
                    <p className="text-sm font-semibold text-slate-600">
                      Chưa có part để combine
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Click một part trong bất kỳ frame hoặc chọn layer trên
                      toolbar.
                    </p>
                  </div>
                ) : visibleWorkspaceFrameGroups.map((group) => (
                  <section
                    key={group.key}
                    className="py-5 first:pt-3 last:pb-3"
                    aria-labelledby={`frame-group-${group.key}`}
                  >
                    <div className="flex flex-wrap items-end justify-between gap-2">
                      <div>
                        <h4
                          id={`frame-group-${group.key}`}
                          className="text-xs font-extrabold tracking-[0.14em] text-slate-800"
                        >
                          {group.label}
                        </h4>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {group.description}
                        </p>
                      </div>
                      <span className="font-mono text-[10px] font-semibold text-slate-400">
                        {group.frames.length} frame
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                    {group.frames.map((candidateFrame) => {
                      const candidatePose = CHARACTER_POSE_FRAMES[candidateFrame];
                      const category = getCharacterFrameCategory(candidateFrame);
                      const candidateSelectedFrame =
                        candidatePose[selectedLayer].frame;
                      const candidateOffsetOwner = getOffsetAlignmentOwner(
                        selectedLayer,
                        candidateSelectedFrame,
                      );
                      const isOwner = candidateFrame === candidateOffsetOwner;
                      const isCurrent =
                        selectionVisible && candidateFrame === characterFrame;
                      const sharesCurrentPartFrame =
                        selectionVisible &&
                        candidateSelectedFrame === selectedFrameIndex;
                      const candidateSelectedAssignment =
                        selectedConfiguration.frames[candidateSelectedFrame];
                      const candidateSelectedAsset = assets[selectedLayer].find(
                        (item) =>
                          item.id === candidateSelectedAssignment?.assetId,
                      );
                      const canEditCandidate =
                        selectionVisible &&
                        selectedConfiguration.enabled &&
                        visibility[selectedLayer] &&
                        Boolean(
                          candidateSelectedAssignment && candidateSelectedAsset,
                        );
                      const isGridDragging =
                        dragging &&
                        dragSessionRef.current?.source === "linked-grid-drag" &&
                        dragSessionRef.current.characterFrame === candidateFrame;
                      return (
                        <div
                          key={candidateFrame}
                          className={`min-w-[220px] max-w-[320px] flex-[1_1_220px] overflow-hidden rounded-lg border text-left transition-[border-color,box-shadow,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30 ${
                            isCurrent
                              ? "border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/30"
                              : sharesCurrentPartFrame
                                ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-400/30"
                                : "border-slate-200 bg-white hover:border-amber-300"
                          }`}
                        >
                          <button
                            type="button"
                            aria-label={`Xem character frame ${candidateFrame}, ${category.label}`}
                            onClick={() =>
                              inspectLinkedCharacterFrame(candidateFrame)
                            }
                            className={`flex w-full items-center justify-between gap-2 border-b px-2 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500/30 ${
                              sharesCurrentPartFrame
                                ? "border-amber-200 bg-amber-50/70"
                                : "border-slate-100 bg-white"
                            }`}
                          >
                            <span className="truncate text-[10px] font-bold text-slate-700">
                              Frame {candidateFrame}
                              {workspaceViewMode === "related"
                                ? ` | ${category.label}`
                                : ""}
                            </span>
                            <span
                              className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold ${
                                isOwner
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {isOwner
                                ? selectionVisible
                                  ? "Mốc"
                                  : "Chưa chọn"
                                : selectionVisible
                                  ? `Dùng mốc ${candidateOffsetOwner ?? "-"}`
                                  : "Chưa chọn"}
                            </span>
                          </button>
                          <div
                            role="group"
                            tabIndex={canEditCandidate ? 0 : -1}
                            aria-label={
                              selectionVisible
                                ? `Căn ${PART_SPEC_BY_KEY[selectedLayer].label} tại character frame ${candidateFrame}. Kéo hoặc dùng phím mũi tên để chỉnh offset dùng chung.`
                                : `Character frame ${candidateFrame}. Click một part để chọn.`
                            }
                            onPointerDown={(event) =>
                              handleLinkedGridPointerDown(event, candidateFrame)
                            }
                            onPointerMove={handlePointerMove}
                            onPointerUp={finishPointerDrag}
                            onPointerCancel={finishPointerDrag}
                            onKeyDown={(event) =>
                              handleLinkedGridKeyDown(event, candidateFrame)
                            }
                            className={`relative aspect-[4/5] min-h-[168px] touch-none select-none overflow-hidden bg-[#f8fafc] bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] bg-[length:12px_12px] bg-[position:0_0,0_6px,6px_-6px,-6px_0px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500/40 ${
                              canEditCandidate
                                ? isGridDragging
                                  ? "cursor-grabbing"
                                  : "cursor-grab"
                                : "cursor-default"
                            }`}
                          >
                            <div className="pointer-events-none absolute left-1/2 top-[72%] h-px w-full -translate-x-1/2 bg-amber-600/25" />
                            <div className="pointer-events-none absolute left-1/2 top-[72%] h-full w-px -translate-y-1/2 bg-amber-600/25" />
                            <div className="pointer-events-none absolute left-1/2 top-[72%] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-700 bg-amber-100" />
                            <div
                              className="pointer-events-none absolute left-1/2 top-[72%]"
                              style={{
                                transform: `scale(${zoom})`,
                                transformOrigin: "0 0",
                              }}
                            >
                              {layerOrder.map((key) => {
                                const configuration = parts[key];
                                const frameIndex = candidatePose[key].frame;
                                const frame = configuration.frames[frameIndex];
                                const asset = assets[key].find(
                                  (item) => item.id === frame?.assetId,
                                );
                                if (
                                  !configuration.enabled ||
                                  !visibility[key] ||
                                  !asset ||
                                  !frame
                                ) {
                                  return null;
                                }
                                const { baseDx, baseDy } =
                                  getBaseOffsetForCharacterFrame(
                                    candidateFrame,
                                    key,
                                  );
                                const logicalWidth = getLogicalSize(
                                  asset.width,
                                  resourceScale,
                                );
                                const logicalHeight = getLogicalSize(
                                  asset.height,
                                  resourceScale,
                                );
                                const position = getRenderTranslation(
                                  baseDx,
                                  baseDy,
                                  frame.dx,
                                  frame.dy,
                                  logicalWidth,
                                  direction,
                                );
                                return (
                                  <div
                                    key={`${candidateFrame}-${key}`}
                                    data-grid-part={key}
                                    ref={(node) => {
                                      linkedGridLayerRefs.current[
                                        candidateFrame
                                      ] ??= {};
                                      linkedGridLayerRefs.current[
                                        candidateFrame
                                      ][key] = node;
                                    }}
                                    className="pointer-events-auto absolute left-0 top-0"
                                    style={{
                                      width: logicalWidth,
                                      height: logicalHeight,
                                      transform: `translate(${position.x}px, ${position.y}px)`,
                                      willChange:
                                        key === selectedLayer
                                          ? "transform"
                                          : undefined,
                                    }}
                                  >
                                    <img
                                      src={asset.url}
                                      alt=""
                                      draggable={false}
                                      className="block max-w-none [image-rendering:pixelated]"
                                      style={{
                                        width: logicalWidth,
                                        height: logicalHeight,
                                        transform:
                                          direction === "right"
                                            ? "scaleX(-1)"
                                            : undefined,
                                      }}
                                    />
                                  </div>
                                );
                              })}
                              {selectionVisible && (() => {
                                const configuration = parts[selectedLayer];
                                const frame =
                                  configuration.frames[candidateSelectedFrame];
                                const asset = assets[selectedLayer].find(
                                  (item) => item.id === frame?.assetId,
                                );
                                if (!frame || !asset) return null;
                                const { baseDx, baseDy } =
                                  getBaseOffsetForCharacterFrame(
                                    candidateFrame,
                                    selectedLayer,
                                  );
                                const logicalWidth = getLogicalSize(
                                  asset.width,
                                  resourceScale,
                                );
                                const logicalHeight = getLogicalSize(
                                  asset.height,
                                  resourceScale,
                                );
                                const position = getRenderTranslation(
                                  baseDx,
                                  baseDy,
                                  frame.dx,
                                  frame.dy,
                                  logicalWidth,
                                  direction,
                                );
                                return (
                                  <div
                                    ref={(node) => {
                                      linkedGridSelectionRefs.current[
                                        candidateFrame
                                      ] = node;
                                    }}
                                    className={`pointer-events-none absolute left-0 top-0 border border-dashed ${
                                      isOwner
                                        ? "border-amber-600 bg-amber-400/5"
                                        : "border-slate-500/70"
                                    }`}
                                    style={{
                                      width: logicalWidth,
                                      height: logicalHeight,
                                      transform: `translate(${position.x}px, ${position.y}px)`,
                                    }}
                                  />
                                );
                              })()}
                            </div>
                          </div>
                          <div
                            className={`flex items-center justify-between gap-2 px-2 py-1.5 font-mono text-[9px] ${
                              sharesCurrentPartFrame
                                ? "bg-amber-50/70 font-semibold text-amber-800"
                                : "bg-white text-slate-500"
                            }`}
                          >
                            <span>
                              {selectionVisible
                                ? `${PART_SPEC_BY_KEY[selectedLayer].label} ${candidateSelectedFrame}`
                                : "Chưa chọn part"}
                            </span>
                            <span>
                              {!selectionVisible
                                ? "Click part để chọn"
                                : canEditCandidate
                                ? sharesCurrentPartFrame
                                  ? "Active · Kéo để căn"
                                  : "Kéo để căn"
                                : "Chỉ xem"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </section>
                ))}
              </div>
          </section>
          <p className="mt-2 text-[11px] leading-4 text-slate-400">
            Giao điểm là tọa độ x/y truyền vào MainObject.paintBody, tức điểm
            đứng của nhân vật. Offset luôn tính theo pixel logic x1. Kéo bằng
            chuột hoặc cảm ứng. Phím mũi tên chỉnh 1px, giữ Shift để chỉnh 5px.
            Các ô có cùng nhãn mốc đang dùng chung một offset trong SQL/runtime.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <span className="mb-2 block text-xs font-semibold text-slate-600">
                Chọn frame part
              </span>
              <Segmented<PreviewFrameMode>
                block
                value={isCurrentFrameCustom ? "custom" : "game"}
                options={[
                  { value: "game", label: "Theo game" },
                  { value: "custom", label: "Tùy chỉnh" },
                ]}
                onChange={changeCurrentFrameMode}
              />
            </div>
            <div>
              <span className="mb-2 block text-xs font-semibold text-slate-600">
                Frame nhân vật
              </span>
              <Select
                size="small"
                showSearch
                className="w-full"
                value={characterFrame}
                disabled={animationEnabled}
                optionFilterProp="label"
                options={SUPPORTED_CHARACTER_FRAMES.map((frame) => {
                  const category = getCharacterFrameCategory(frame);
                  const alignmentParts =
                    getAlignmentPartsForCharacterFrame(frame);
                  return {
                    value: frame,
                    label: `Frame ${frame} | ${category.label}${
                      alignmentParts.length
                        ? ` | Mốc ${alignmentParts
                            .map((spec) => spec.label)
                            .join(", ")}`
                        : " | Chỉ kiểm tra"
                    }`,
                  };
                })}
                onChange={setReferenceCharacterFrame}
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button
                  size="small"
                  disabled={animationEnabled || !previousAlignmentStep}
                  icon={<SkipBack size={13} />}
                  onClick={() => goToAlignmentStep(previousAlignmentStep)}
                >
                  Bước trước
                </Button>
                <Button
                  size="small"
                  disabled={animationEnabled || !nextAlignmentStep}
                  icon={<SkipForward size={13} />}
                  onClick={() => goToAlignmentStep(nextAlignmentStep)}
                >
                  Bước tiếp
                </Button>
              </div>
            </div>
          </div>
          <div
            className={`mt-3 rounded-lg border px-3 py-2 text-[11px] leading-4 ${
              characterFrameCategory.isSpecial
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-slate-200 bg-slate-50 text-slate-600"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 font-semibold">
              <span>
                {currentAlignmentStepIndex >= 0
                  ? `Bước căn ${currentAlignmentStepIndex + 1}/${alignmentSteps.length}: ${PART_SPEC_BY_KEY[selectedLayer].label} frame ${selectedFrameIndex} tại character frame ${characterFrame}`
                  : currentAlignmentFrameIndex >= 0
                    ? `Mốc frame ${characterFrame}: ${alignmentPartsAtCurrentFrame
                        .map(
                          (spec) =>
                            `${spec.label} ${characterPoseFrame[spec.key].frame}`,
                        )
                        .join(", ")}`
                    : `Frame ${characterFrame} chỉ dùng để kiểm tra`}
              </span>
              <span className="font-mono">
                {configuredPartFrameCount} PartImage | {alignmentSteps.length} bước |{" "}
                {alignmentFrames.length} mốc
              </span>
            </div>
            <p className="mt-1">{characterFrameCategory.description}</p>
            {currentRuntimePartSummary && (
              <p className="mt-1 font-mono text-[10px] opacity-80">
                CharInfo Game: {currentRuntimePartSummary}
              </p>
            )}
            {currentAlignmentFrameIndex < 0 && (
              <p className="mt-1">
                Nếu Body/Legs hở hoặc đè sai tại frame kiểm tra nhưng từng
                PartImage đã đúng ở mốc, bộ PNG không tương thích với cách Game
                tái sử dụng frame. SQL offset không thể sửa riêng frame này.
              </p>
            )}
          </div>
          <p className="mt-2 text-[11px] leading-4 text-slate-400">
            Chọn đúng thư mục resource đang upload. PC x4 dùng x4, mobile x1-x3
            dùng scale tương ứng. Tùy chỉnh chỉ áp dụng riêng Frame nhân vật{" "}
            {characterFrame}; frame khác vẫn giữ mapping của chính nó.
          </p>
          {isCurrentFrameCustom && (
            <p className="mt-1 text-[11px] leading-4 text-amber-700">
              Override chỉ đổi mapping kiểm tra trong Preview. SQL parts không
              lưu mapping thay thế CharInfo của client.
            </p>
          )}

          <div className="mt-4 space-y-2">
            {PART_SPECS.map((spec) => (
              <div
                key={spec.key}
                className={`grid grid-cols-[minmax(88px,1fr)_118px_36px] items-center gap-2 rounded-lg px-1 py-1 ${selectionVisible && selectedLayer === spec.key ? "bg-amber-50" : ""}`}
              >
                <button
                  type="button"
                  disabled={!parts[spec.key].enabled}
                  onClick={() => {
                    setSelectionVisible(true);
                    onSelectLayer(spec.key);
                  }}
                  className={`truncate rounded-md px-2 py-1 text-left text-xs font-semibold disabled:cursor-not-allowed disabled:text-slate-300 ${selectionVisible && selectedLayer === spec.key ? "text-amber-800" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  {spec.label}
                </button>
                <Select
                  size="small"
                  value={effectivePreviewFrames[spec.key]}
                  disabled={!parts[spec.key].enabled || !isCurrentFrameCustom}
                  options={Array.from(
                    { length: spec.frameCount },
                    (_, index) => ({
                      value: index,
                      label: `Frame ${index}`,
                    }),
                  )}
                  onChange={(value) =>
                    changeCurrentPartFrame(spec.key, value)
                  }
                />
                <Button
                  type="text"
                  size="small"
                  disabled={!parts[spec.key].enabled}
                  aria-label={`${visibility[spec.key] ? "Ẩn" : "Hiện"} ${spec.label}`}
                  icon={
                    visibility[spec.key] ? (
                      <Eye size={15} />
                    ) : (
                      <EyeOff size={15} />
                    )
                  }
                  onClick={() => onToggleVisibility(spec.key)}
                />
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-slate-200 pt-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Preview animation
                </h3>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">
                  Preset lấy từ frame nhân vật và CharInfo của Unity.
                </p>
              </div>
              <Switch
                size="small"
                checked={animationEnabled}
                aria-label="Bật preview animation"
                onChange={(checked) => {
                  setAnimationEnabled(checked);
                  setAnimationStep(0);
                  setIsPlaying(false);
                }}
              />
            </div>

            <Segmented<PoseKey>
              block
              disabled={!animationEnabled}
              value={selectedPose}
              options={POSE_SPECS.map((pose) => ({
                value: pose.key,
                label: pose.label,
              }))}
              onChange={(pose) => {
                setSelectedPose(pose);
                setAnimationStep(0);
                setIsPlaying(false);
              }}
            />

            <div className="mt-3 grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-2">
              <div className="flex items-center">
                <Tooltip title="Frame trước">
                  <Button
                    size="small"
                    disabled={!animationEnabled || !currentPoseSequence.length}
                    aria-label="Xem frame animation trước"
                    icon={<SkipBack size={14} />}
                    onClick={() => {
                      setIsPlaying(false);
                      setAnimationStep(
                        (current) =>
                          (current - 1 + currentPoseSequence.length) %
                          currentPoseSequence.length,
                      );
                    }}
                  />
                </Tooltip>
                <Tooltip title="Frame tiếp theo">
                  <Button
                    size="small"
                    disabled={!animationEnabled || !currentPoseSequence.length}
                    aria-label="Xem frame animation tiếp theo"
                    icon={<SkipForward size={14} />}
                    onClick={() => {
                      setIsPlaying(false);
                      setAnimationStep(
                        (current) => (current + 1) % currentPoseSequence.length,
                      );
                    }}
                  />
                </Tooltip>
              </div>
              <Tooltip
                title={
                  prefersReducedMotion
                    ? "Trình duyệt đang bật giảm chuyển động. Dùng nút xem từng frame."
                    : undefined
                }
              >
                <Button
                  size="small"
                  type={isPlaying ? "default" : "primary"}
                  disabled={
                    !animationEnabled ||
                    prefersReducedMotion ||
                    currentPoseSequence.length <= 1
                  }
                  icon={isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  onClick={() => setIsPlaying((current) => !current)}
                >
                  {isPlaying ? "Dừng" : "Chạy"}
                </Button>
              </Tooltip>
              <Select
                size="small"
                value={animationSpeed}
                disabled={!animationEnabled}
                aria-label="Tốc độ preview animation"
                options={[
                  { value: 80, label: "Nhanh 80ms" },
                  { value: 120, label: "Chuẩn 120ms" },
                  { value: 180, label: "Chậm 180ms" },
                  { value: 240, label: "Rất chậm 240ms" },
                ]}
                onChange={setAnimationSpeed}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
              <span>
                {
                  POSE_SPECS.find((pose) => pose.key === selectedPose)
                    ?.description
                }
              </span>
              <span className="font-mono">
                Bước {currentPoseSequence.length ? animationStep + 1 : 0}/
                {currentPoseSequence.length} | Frame nhân vật{" "}
                {characterFrame ?? "?"}
              </span>
            </div>

            <details className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <summary className="cursor-pointer select-none text-xs font-semibold text-slate-700">
                Gán pose thủ công
              </summary>
              <p className="mt-2 text-[11px] leading-4 text-slate-500">
                Nhập chuỗi frame nhân vật. Có thể lặp frame để giữ pose lâu hơn.
                Tool tự đổi sang frame từng part và base offset tương ứng.
              </p>
              <div className="mt-3 space-y-3">
                {POSE_SPECS.filter((pose) => pose.key !== "all").map((pose) => {
                  const validation = poseValidation[pose.key];
                  return (
                    <div key={pose.key}>
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <label
                          htmlFor={`pose-${pose.key}`}
                          className="text-[11px] font-semibold text-slate-600"
                        >
                          {pose.label}
                        </label>
                        <Button
                          type="link"
                          size="small"
                          className="!h-auto !p-0 text-[11px]"
                          onClick={() => {
                            setPoseInputs((current) => ({
                              ...current,
                              [pose.key]:
                                DEFAULT_POSE_SEQUENCES[pose.key].join(", "),
                            }));
                            if (
                              pose.key === selectedPose ||
                              selectedPose === "all"
                            ) {
                              setAnimationStep(0);
                              setIsPlaying(false);
                            }
                          }}
                        >
                          Đặt lại preset
                        </Button>
                      </div>
                      <Input
                        id={`pose-${pose.key}`}
                        size="small"
                        value={poseInputs[pose.key]}
                        status={validation.error ? "error" : undefined}
                        className="font-mono text-xs"
                        aria-describedby={
                          validation.error
                            ? `pose-${pose.key}-error`
                            : undefined
                        }
                        onChange={(event) => {
                          setPoseInputs((current) => ({
                            ...current,
                            [pose.key]: event.target.value,
                          }));
                          if (
                            pose.key === selectedPose ||
                            selectedPose === "all"
                          ) {
                            setAnimationStep(0);
                            setIsPlaying(false);
                          }
                        }}
                      />
                      {validation.error && (
                        <p
                          id={`pose-${pose.key}-error`}
                          className="mt-1 text-[11px] text-red-600"
                        >
                          {validation.error}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[10px] leading-4 text-slate-400">
                Frame hỗ trợ: {SUPPORTED_CHARACTER_FRAMES.join(", ")}. Stand,
                Run và Die lấy trực tiếp từ MainObject. Attack mặc định lấy đủ
                chuỗi từ Plashdata; skill riêng vẫn có thể thay bằng
                Plash.mDataPlash.
              </p>
            </details>
          </div>
    </Card>
  );
}

function AdminFashionComposerPage() {
  const [fashion, setFashion] = useState<FashionConfiguration>(() => ({
    ...DEFAULT_FASHION,
    mwearOverrides: { ...DEFAULT_FASHION.mwearOverrides },
  }));
  const [parts, setParts] = useState<ComposerParts>(createInitialParts);
  const [assets, setAssets] = useState<ComposerAssets>(createInitialAssets);
  const [activePart, setActivePart] = useState<PartKey>("head");
  const [previewFrames, setPreviewFrames] = useState(EMPTY_PREVIEW_FRAMES);
  const [visibility, setVisibility] = useState(EMPTY_VISIBILITY);
  const [zoom, setZoom] = useState(4);
  const [previewResetVersion, setPreviewResetVersion] = useState(0);
  const [pendingAssetBindings, setPendingAssetBindings] =
    useState<PendingAssetBindings>(createEmptyAssetBindings);
  const assetsRef = useRef(assets);
  const pendingAssetBindingsRef = useRef(pendingAssetBindings);
  const configFileInputRef = useRef<HTMLInputElement | null>(null);
  const assetBundleInputRef = useRef<HTMLInputElement | null>(null);

  const commitPendingAssetBindings = (next: PendingAssetBindings) => {
    pendingAssetBindingsRef.current = next;
    setPendingAssetBindings(next);
  };

  useEffect(() => {
    assetsRef.current = assets;
  }, [assets]);

  useEffect(
    () => () => {
      Object.values(assetsRef.current)
        .flat()
        .forEach((asset) => URL.revokeObjectURL(asset.url));
    },
    [],
  );

  const sqlResult = useMemo(
    () => generateFashionSql(fashion, parts, assets),
    [fashion, parts, assets],
  );
  const pendingAssetCount = useMemo(
    () =>
      Object.values(pendingAssetBindings)
        .flat()
        .filter(Boolean).length,
    [pendingAssetBindings],
  );

  const activeSpec = PART_SPEC_BY_KEY[activePart];
  const activeConfiguration = parts[activePart];
  const activePendingAssetCount = pendingAssetBindings[activePart].filter(
    Boolean,
  ).length;

  const updateFashion = <K extends keyof FashionConfiguration>(
    key: K,
    value: FashionConfiguration[K],
  ) => setFashion((current) => ({ ...current, [key]: value }));

  const updateMwearOverride = (slot: MwearOverrideSlot, enabled: boolean) =>
    setFashion((current) => ({
      ...current,
      mwearOverrides: {
        ...current.mwearOverrides,
        [slot]: enabled,
      },
    }));

  const updatePart = (
    key: PartKey,
    patch: Partial<Omit<ComposerParts[PartKey], "frames">>,
  ) =>
    setParts((current) => ({
      ...current,
      [key]: { ...current[key], ...patch },
    }));

  const updateFrame = (
    key: PartKey,
    index: number,
    patch: Partial<FrameAssignment>,
    context?: OffsetChangeContext,
  ) =>
    setParts((current) => {
      const before = current[key].frames[index];
      const after = { ...before, ...patch };
      const offsetChanged =
        before && (before.dx !== after.dx || before.dy !== after.dy);

      if (offsetChanged) {
        const previewCharacterFrames =
          context?.previewCharacterFrames ?? null;
        const runtimeCharacterFrames =
          context?.runtimeCharacterFrames ??
          getRuntimeCharacterFrames(key, index);
        const payload = {
          source: context?.source ?? "frame-editor",
          partKey: key,
          partFrame: index,
          characterFrame: context?.characterFrame ?? null,
          alignmentCharacterFrame: getOffsetAlignmentOwner(key, index) ?? null,
          previewCharacterFrames,
          runtimeCharacterFrames,
          baseDx: context?.baseDx ?? null,
          baseDy: context?.baseDy ?? null,
          before: { dx: before.dx, dy: before.dy },
          after: { dx: after.dx, dy: after.dy },
          previewAffectedCount: previewCharacterFrames?.length ?? null,
          runtimeAffectedCount: runtimeCharacterFrames.length,
        };
        console.groupCollapsed(
          `[FashionComposer][offset:commit] ${key} partFrame=${index}`,
        );
        console.table([payload]);
        console.debug("[FashionComposer][offset:detail]", payload);
        if (runtimeCharacterFrames.length > 1) {
          console.warn(
            "[FashionComposer][offset:shared] SQL/runtime still shares this stored PartImage offset.",
            {
              previewCharacterFrames,
              runtimeCharacterFrames,
            },
          );
        }
        console.groupEnd();
      }

      return {
        ...current,
        [key]: {
          ...current[key],
          frames: current[key].frames.map((frame, frameIndex) =>
            frameIndex === index ? after : frame,
          ),
        },
      };
    });

  const updateFrameAssignment = (
    key: PartKey,
    index: number,
    patch: Partial<FrameAssignment>,
  ) => {
    if (patch.assetId !== undefined) {
      const currentBindings = pendingAssetBindingsRef.current;
      commitPendingAssetBindings({
        ...currentBindings,
        [key]: currentBindings[key].map((reference, frameIndex) =>
          frameIndex === index ? null : reference,
        ),
      });
    }
    updateFrame(key, index, patch);
  };

  const handleUpload = async (
    key: PartKey,
    file: File,
    options?: { silentMatchToast?: boolean },
  ) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn đúng file ảnh.");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${file.name}: ảnh không được vượt quá 5MB.`);
      return false;
    }

    const url = URL.createObjectURL(file);
    try {
      const dimensions = await getImageDimensions(url);
      const asset: UploadedPartAsset = {
        id: crypto.randomUUID(),
        name: file.name,
        url,
        iconId: inferRawIconId(file.name),
        ...dimensions,
      };
      const pendingForPart = pendingAssetBindingsRef.current[key];
      const matchedFrameIndexes = pendingForPart.flatMap(
        (reference, index) =>
          reference && assetMatchesReference(asset, reference) ? [index] : [],
      );
      const matchedReferences = matchedFrameIndexes
        .map((index) => pendingForPart[index])
        .filter((reference): reference is SavedAssetReference =>
          Boolean(reference),
        );
      const savedIconId = matchedReferences.find(
        (reference) => reference.iconId !== null,
      )?.iconId;
      if (savedIconId !== undefined) asset.iconId = savedIconId;

      setAssets((current) => ({
        ...current,
        [key]: [...current[key], asset],
      }));
      setParts((current) => {
        const frames = current[key].frames;
        if (matchedFrameIndexes.length > 0) {
          return {
            ...current,
            [key]: {
              ...current[key],
              frames: frames.map((frame, frameIndex) =>
                matchedFrameIndexes.includes(frameIndex)
                  ? { ...frame, assetId: asset.id }
                  : frame,
              ),
            },
          };
        }

        const nextEmptyFrame = frames.findIndex(
          (frame, index) =>
            frame.assetId === null && pendingForPart[index] === null,
        );
        if (nextEmptyFrame === -1) return current;

        return {
          ...current,
          [key]: {
            ...current[key],
            frames: frames.map((frame, frameIndex) =>
              frameIndex === nextEmptyFrame
                ? { ...frame, assetId: asset.id }
                : frame,
            ),
          },
        };
      });
      if (matchedFrameIndexes.length > 0) {
        const currentBindings = pendingAssetBindingsRef.current;
        commitPendingAssetBindings({
          ...currentBindings,
          [key]: currentBindings[key].map((reference, index) =>
            matchedFrameIndexes.includes(index) ? null : reference,
          ),
        });
        console.info("[FashionComposer][config:asset-matched]", {
          partKey: key,
          asset: { name: asset.name, iconId: asset.iconId },
          frameIndexes: matchedFrameIndexes,
        });
        if (!options?.silentMatchToast) {
          toast.success(
            `${file.name}: đã khớp lại ${matchedFrameIndexes.length} frame từ config.`,
          );
        }
      }
      return true;
    } catch {
      URL.revokeObjectURL(url);
      toast.error(`${file.name}: không thể đọc ảnh.`);
      return false;
    }
  };

  const changeAssetIcon = (
    key: PartKey,
    assetId: string,
    iconId: number | null,
  ) =>
    setAssets((current) => ({
      ...current,
      [key]: current[key].map((asset) =>
        asset.id === assetId ? { ...asset, iconId } : asset,
      ),
    }));

  const assignAllFrames = (key: PartKey, assetId: string) => {
    setParts((current) => ({
      ...current,
      [key]: {
        ...current[key],
        frames: current[key].frames.map((frame) => ({ ...frame, assetId })),
      },
    }));
    const currentBindings = pendingAssetBindingsRef.current;
    commitPendingAssetBindings({
      ...currentBindings,
      [key]: currentBindings[key].map(() => null),
    });
    toast.success(
      `Đã gán part cho toàn bộ frame ${PART_SPEC_BY_KEY[key].label}.`,
    );
  };

  const removeAsset = (key: PartKey, assetId: string) => {
    const asset = assets[key].find((item) => item.id === assetId);
    if (asset) {
      const currentBindings = pendingAssetBindingsRef.current;
      commitPendingAssetBindings({
        ...currentBindings,
        [key]: currentBindings[key].map((reference, index) =>
          parts[key].frames[index]?.assetId === assetId
            ? { name: asset.name, iconId: asset.iconId }
            : reference,
        ),
      });
    }
    if (asset) URL.revokeObjectURL(asset.url);
    setAssets((current) => ({
      ...current,
      [key]: current[key].filter((item) => item.id !== assetId),
    }));
    setParts((current) => ({
      ...current,
      [key]: {
        ...current[key],
        frames: current[key].frames.map((frame) =>
          frame.assetId === assetId ? { ...frame, assetId: null } : frame,
        ),
      },
    }));
  };

  const createConfigFile = (): ComposerConfigFile => ({
    schema: COMPOSER_CONFIG_SCHEMA,
    version: COMPOSER_CONFIG_VERSION,
    exportedAt: new Date().toISOString(),
    mappingMode: "game",
    fashion: {
      ...fashion,
      mwearOverrides: { ...fashion.mwearOverrides },
    },
    parts: Object.fromEntries(
      PART_SPECS.map((spec) => {
        const configuration = parts[spec.key];
        return [
          spec.key,
          {
            enabled: configuration.enabled,
            partId: configuration.partId,
            mwearSlot: configuration.mwearSlot,
            frames: configuration.frames.map((frame, index) => {
              const asset = assets[spec.key].find(
                (item) => item.id === frame.assetId,
              );
              const savedAsset = asset
                ? { name: asset.name, iconId: asset.iconId }
                : pendingAssetBindings[spec.key][index];
              return {
                asset: savedAsset ? { ...savedAsset } : null,
                dx: frame.dx,
                dy: frame.dy,
              };
            }),
          },
        ];
      }),
    ) as Record<PartKey, SavedPartConfiguration>,
    preview: {
      activePart,
      previewFrames: { ...previewFrames },
      visibility: { ...visibility },
      zoom,
    },
  });

  const downloadConfig = () => {
    const config = createConfigFile();
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fashion-${fashion.id ?? "draft"}.composer.json`;
    link.click();
    URL.revokeObjectURL(url);
    console.info("[FashionComposer][config:export]", {
      fashionId: fashion.id,
      pendingAssetCount,
      config,
    });
    toast.success("Đã lưu file config. Ảnh resource không được nhúng vào file.");
  };

  const importConfig = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File config không được vượt quá 2MB.");
      return;
    }

    try {
      const config = parseComposerConfigFile(JSON.parse(await file.text()));
      const loadedAssets = assetsRef.current;
      const nextPendingBindings = createEmptyAssetBindings();
      const assetIconOverrides = new Map<string, number | null>();
      let matchedAssetCount = 0;
      const nextParts = Object.fromEntries(
        PART_SPECS.map((spec) => {
          const savedPart = config.parts[spec.key];
          return [
            spec.key,
            {
              enabled: savedPart.enabled,
              partId: savedPart.partId,
              mwearSlot: savedPart.mwearSlot,
              frames: savedPart.frames.map((savedFrame, index) => {
                const matchedAsset = savedFrame.asset
                  ? findAssetByReference(
                      loadedAssets[spec.key],
                      savedFrame.asset,
                    )
                  : undefined;
                if (matchedAsset) {
                  matchedAssetCount++;
                  assetIconOverrides.set(
                    matchedAsset.id,
                    savedFrame.asset?.iconId ?? matchedAsset.iconId,
                  );
                } else if (savedFrame.asset) {
                  nextPendingBindings[spec.key][index] = {
                    ...savedFrame.asset,
                  };
                }
                return {
                  assetId: matchedAsset?.id ?? null,
                  dx: savedFrame.dx,
                  dy: savedFrame.dy,
                };
              }),
            },
          ];
        }),
      ) as ComposerParts;
      const unresolvedAssetCount = Object.values(nextPendingBindings)
        .flat()
        .filter(Boolean).length;

      setAssets((current) =>
        Object.fromEntries(
          PART_SPECS.map((spec) => [
            spec.key,
            current[spec.key].map((asset) =>
              assetIconOverrides.has(asset.id)
                ? {
                    ...asset,
                    iconId: assetIconOverrides.get(asset.id) ?? null,
                  }
                : asset,
            ),
          ]),
        ) as ComposerAssets,
      );
      setFashion({
        ...config.fashion,
        mwearOverrides: { ...config.fashion.mwearOverrides },
      });
      setParts(nextParts);
      commitPendingAssetBindings(nextPendingBindings);
      setActivePart(config.preview.activePart);
      setPreviewFrames({ ...config.preview.previewFrames });
      setVisibility({ ...config.preview.visibility });
      setZoom(config.preview.zoom);
      setPreviewResetVersion((current) => current + 1);

      console.info("[FashionComposer][config:import]", {
        fileName: file.name,
        fashionId: config.fashion.id,
        matchedAssetCount,
        unresolvedAssetCount,
        config,
      });
      toast.success(
        unresolvedAssetCount > 0
          ? `Đã nạp config. Còn ${unresolvedAssetCount} frame chờ đúng asset.`
          : "Đã nạp config và khớp lại toàn bộ asset.",
      );
    } catch (error) {
      console.error("[FashionComposer][config:import-failed]", error);
      toast.error(
        error instanceof Error ? error.message : "Không thể đọc file config.",
      );
    }
  };

  const importAssetBundle = async (files: File[]) => {
    let matchedFileCount = 0;
    const unmatchedFiles: string[] = [];

    for (const file of files) {
      const candidate = {
        name: file.name,
        iconId: inferRawIconId(file.name),
      };
      const matchedSpec = PART_SPECS.find((spec) =>
        pendingAssetBindingsRef.current[spec.key].some(
          (reference) =>
            reference && assetMatchesReference(candidate, reference),
        ),
      );
      if (!matchedSpec) {
        unmatchedFiles.push(file.name);
        continue;
      }
      const didUpload = await handleUpload(matchedSpec.key, file, {
        silentMatchToast: true,
      });
      if (didUpload) matchedFileCount++;
    }

    console.info("[FashionComposer][config:asset-bundle]", {
      selectedFileCount: files.length,
      matchedFileCount,
      unmatchedFiles,
    });
    if (matchedFileCount > 0) {
      toast.success(`Đã tự khớp ${matchedFileCount} asset từ bộ resource.`);
    }
    if (unmatchedFiles.length > 0) {
      toast.warning(
        `${unmatchedFiles.length} file không có reference trong config nên chưa được gán.`,
      );
    }
  };

  const handleAssetBundleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length > 0) void importAssetBundle(files);
  };

  const handleConfigFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void importConfig(file);
  };

  const copySql = async () => {
    if (!sqlResult.sql) return;
    try {
      await navigator.clipboard.writeText(sqlResult.sql);
      toast.success("Đã sao chép SQL.");
    } catch {
      toast.error("Không thể sao chép SQL trên trình duyệt này.");
    }
  };

  const downloadSql = () => {
    if (!sqlResult.sql) return;
    const blob = new Blob([sqlResult.sql], { type: "text/sql;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fashion-${fashion.id ?? "draft"}.sql`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetComposer = () => {
    Object.values(assets)
      .flat()
      .forEach((asset) => URL.revokeObjectURL(asset.url));
    setFashion({
      ...DEFAULT_FASHION,
      mwearOverrides: { ...DEFAULT_FASHION.mwearOverrides },
    });
    setParts(createInitialParts());
    setAssets(createInitialAssets());
    commitPendingAssetBindings(createEmptyAssetBindings());
    setActivePart("head");
    setPreviewFrames({ ...EMPTY_PREVIEW_FRAMES });
    setVisibility({ ...EMPTY_VISIBILITY });
    setZoom(4);
    setPreviewResetVersion((current) => current + 1);
    toast.success("Đã tạo bản nháp mới.");
  };

  return (
    <div className="space-y-6">
      {/* <Alert
        type="info"
        showIcon
        message="Công cụ tạo dữ liệu, không ghi trực tiếp vào game server"
        description="Ảnh part chỉ dùng để căn preview trong phiên hiện tại. SQL cần được review trước khi chạy trên database và ảnh resource vẫn phải upload theo quy trình game."
      /> */}

      <Card
          className="min-w-0 border-slate-200 shadow-sm"
          styles={{ body: { padding: 24 } }}
        >
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Fashiontemplate
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Khai báo dữ liệu item và các slot part sẽ mặc.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={configFileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleConfigFileChange}
              />
              <input
                ref={assetBundleInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                multiple
                className="hidden"
                onChange={handleAssetBundleChange}
              />
              <Button
                icon={<FileUp size={15} />}
                onClick={() => configFileInputRef.current?.click()}
              >
                Import config
              </Button>
              <Button
                icon={<FolderOpen size={15} />}
                disabled={pendingAssetCount === 0}
                onClick={() => assetBundleInputRef.current?.click()}
              >
                Nạp bộ asset
                {pendingAssetCount > 0 ? ` (${pendingAssetCount})` : ""}
              </Button>
              <Button icon={<Save size={15} />} onClick={downloadConfig}>
                Lưu config
              </Button>
              <Popconfirm
                title="Tạo lại bản nháp?"
                description="Toàn bộ ảnh, frame và offset hiện tại sẽ bị xóa."
                okText="Tạo lại"
                cancelText="Hủy"
                onConfirm={resetComposer}
              >
                <Button icon={<RotateCcw size={15} />}>Bản nháp mới</Button>
              </Popconfirm>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <FieldLabel hint="0-255">Fashion ID</FieldLabel>
              <InputNumber<number>
                value={fashion.id ?? undefined}
                min={0}
                max={255}
                precision={0}
                controls={false}
                placeholder="Ví dụ: 132"
                className="w-full"
                onChange={(value) => updateFashion("id", value)}
              />
            </div>
            <div>
              <FieldLabel hint="raw ID">Icon item</FieldLabel>
              <InputNumber<number>
                value={fashion.icon ?? undefined}
                min={-32_768}
                max={32_767}
                precision={0}
                controls={false}
                placeholder="Không cộng 20000"
                className="w-full"
                onChange={(value) => updateFashion("icon", value)}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Tên fashion</FieldLabel>
              <Input
                value={fashion.name}
                maxLength={255}
                placeholder="Tên hiển thị trong game"
                onChange={(event) => updateFashion("name", event.target.value)}
              />
            </div>
            <div className="sm:col-span-2 xl:col-span-4">
              <FieldLabel>Thông tin</FieldLabel>
              <Input.TextArea
                value={fashion.info}
                autoSize={{ minRows: 2, maxRows: 4 }}
                placeholder="Mô tả fashion"
                onChange={(event) => updateFashion("info", event.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Giá</FieldLabel>
              <InputNumber<number>
                value={fashion.price}
                min={0}
                max={2_147_483_647}
                precision={0}
                controls={false}
                className="w-full"
                onChange={(value) => updateFashion("price", value ?? 0)}
              />
            </div>
            <div>
              <FieldLabel hint="-1 là vĩnh viễn">Hạn sử dụng</FieldLabel>
              <InputNumber<number>
                value={fashion.hsd}
                min={-1}
                max={2_147_483_647}
                precision={0}
                controls={false}
                className="w-full"
                onChange={(value) => updateFashion("hsd", value ?? -1)}
              />
            </div>
            <div className="flex items-end sm:col-span-2">
              <div className="flex h-8 items-center gap-3">
                <Switch
                  checked={fashion.shopSale}
                  onChange={(value) => updateFashion("shopSale", value)}
                />
                <span className="text-sm font-semibold text-slate-700">
                  Mở bán trong shop
                </span>
              </div>
            </div>
            <div className="sm:col-span-2">
              <FieldLabel hint="JSON array">op</FieldLabel>
              <Input.TextArea
                value={fashion.op}
                autoSize={{ minRows: 3, maxRows: 8 }}
                className="font-mono text-xs"
                onChange={(event) => updateFashion("op", event.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel hint="JSON array">spec_op</FieldLabel>
              <Input.TextArea
                value={fashion.specOp}
                autoSize={{ minRows: 3, maxRows: 8 }}
                className="font-mono text-xs"
                onChange={(event) =>
                  updateFashion("specOp", event.target.value)
                }
              />
            </div>
            <div className="sm:col-span-2 xl:col-span-4">
              <FieldLabel hint="ghi -2 vào fashiontemplate.mwear">
                Ẩn layer trang bị gốc
              </FieldLabel>
              <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                {([
                  [1, "Hat + Hair khi merge · slot 1"],
                  [4, "Cloak · slot 4"],
                  [7, "Hair qua server · slot 7"],
                ] as const).map(([slot, label]) => (
                  <Checkbox
                    key={slot}
                    checked={fashion.mwearOverrides[slot]}
                    onChange={(event) =>
                      updateMwearOverride(slot, event.target.checked)
                    }
                  >
                    {label}
                  </Checkbox>
                ))}
                <p className="w-full text-xs leading-5 text-slate-500">
                  Head có sẵn tóc như Chấn Thiên/Nika nên bật Hair slot 7. Không
                  bật cùng slot đang gắn một Part ID. Slot 1 là rule merge của
                  client, đồng thời bỏ Hat và Hair hiện có.
                </p>
              </div>
            </div>
          </div>
      </Card>

      <section className="w-full" aria-label="Preview tất cả frame fashion">
        <ComposerPreview
          key={previewResetVersion}
          parts={parts}
          assets={assets}
          visibility={visibility}
          selectedLayer={activePart}
          zoom={zoom}
          onChangeFrame={(key, frame) =>
            setPreviewFrames((current) => ({ ...current, [key]: frame }))
          }
          onSelectLayer={setActivePart}
          onChangeOffset={(key, frameIndex, dx, dy, context) =>
            updateFrame(key, frameIndex, { dx, dy }, context)
          }
          onToggleVisibility={(key) =>
            setVisibility((current) => ({
              ...current,
              [key]: !current[key],
            }))
          }
          onChangeZoom={setZoom}
        />
      </section>

      <div className="grid items-start gap-6">
        <Card
          className="min-w-0 border-slate-200 shadow-sm"
          styles={{ body: { padding: 24 } }}
        >
          <div className="mb-5">
            <h2 className="text-base font-bold text-slate-800">
              Parts và frame
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Body và Legs bắt buộc. Cần ít nhất một trong Head hoặc Hat / Phụ
              kiện. Cloak và Weapon tùy chọn.
            </p>
          </div>

          <Segmented<PartKey>
            block
            value={activePart}
            options={PART_SPECS.map((spec) => ({
              value: spec.key,
              label: spec.label,
            }))}
            onChange={setActivePart}
            className="mb-5"
          />

          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-4 md:grid-cols-[minmax(140px,1fr)_minmax(180px,1fr)_auto] md:items-end">
              <div>
                <FieldLabel
                  hint={`type ${activeSpec.type} · ${PART_REQUIREMENT_LABELS[activeSpec.sqlRequirement]}`}
                >
                  {`Part ID ${activeSpec.label}`}
                </FieldLabel>
                <InputNumber<number>
                  value={activeConfiguration.partId ?? undefined}
                  min={-32_768}
                  max={32_767}
                  precision={0}
                  controls={false}
                  placeholder="Part ID trong bảng parts"
                  className="w-full"
                  disabled={!activeConfiguration.enabled}
                  onChange={(value) =>
                    updatePart(activePart, { partId: value })
                  }
                />
              </div>
              <div>
                <FieldLabel>Slot mwear</FieldLabel>
                <Select
                  value={activeConfiguration.mwearSlot}
                  options={mwearOptions}
                  className="w-full"
                  disabled={!activeConfiguration.enabled}
                  onChange={(value) =>
                    updatePart(activePart, { mwearSlot: value })
                  }
                />
              </div>
              <Checkbox
                checked={activeConfiguration.enabled}
                onChange={(event) =>
                  updatePart(activePart, { enabled: event.target.checked })
                }
                className="h-8 items-center whitespace-nowrap"
              >
                Xuất part này
              </Checkbox>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {activeSpec.description}. Slot mặc định theo cấu trúc hiện tại, có
              thể đổi hoặc chọn không gắn vào mwear.
            </p>
          </div>

          {activeConfiguration.enabled ? (
            <>
              {activePendingAssetCount > 0 && (
                <Alert
                  className="mb-4"
                  type="warning"
                  showIcon
                  message={`${activePendingAssetCount} frame ${activeSpec.label} đang chờ asset`}
                  description="Upload bộ ảnh của part này. Tool sẽ tự khớp icon ID trước, sau đó fallback theo tên file và giữ nguyên offset từ config."
                />
              )}
              <AssetLibrary
                partKey={activePart}
                assets={assets[activePart]}
                onUpload={(file) => void handleUpload(activePart, file)}
                onChangeIcon={(assetId, iconId) =>
                  changeAssetIcon(activePart, assetId, iconId)
                }
                onAssignAll={(assetId) => assignAllFrames(activePart, assetId)}
                onRemove={(assetId) => removeAsset(activePart, assetId)}
              />
              <FrameEditor
                partKey={activePart}
                frames={activeConfiguration.frames}
                assets={assets[activePart]}
                previewFrame={previewFrames[activePart]}
                onChange={(index, patch) =>
                  updateFrameAssignment(activePart, index, patch)
                }
                onPreview={(index) =>
                  setPreviewFrames((current) => ({
                    ...current,
                    [activePart]: index,
                  }))
                }
              />
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <p className="text-sm font-semibold text-slate-600">
                Nhóm part này đang tắt
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Bật “Xuất part này” để cấu hình ảnh và frame.
              </p>
            </div>
          )}
        </Card>

      </div>

      <Card
        className="border-slate-200 shadow-sm"
        styles={{ body: { padding: 24 } }}
      >
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
              <FileCode2 size={18} className="text-amber-700" />
              SQL insert
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Sinh INSERT cho parts và fashiontemplate trong một transaction.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              icon={<Clipboard size={15} />}
              disabled={!sqlResult.sql}
              onClick={() => void copySql()}
            >
              Sao chép SQL
            </Button>
            <Button
              type="primary"
              icon={<Download size={15} />}
              disabled={!sqlResult.sql}
              onClick={downloadSql}
            >
              Tải file .sql
            </Button>
          </div>
        </div>

        {sqlResult.errors.length > 0 && (
          <Alert
            type="warning"
            showIcon
            className="mb-4"
            message={`Cần hoàn thiện ${sqlResult.errors.length} mục trước khi xuất SQL`}
            description={
              <ul className="mt-1 list-disc space-y-1 pl-5 text-xs">
                {sqlResult.errors.slice(0, 8).map((error) => (
                  <li key={error}>{error}</li>
                ))}
                {sqlResult.errors.length > 8 && (
                  <li>Còn {sqlResult.errors.length - 8} mục chưa hiển thị.</li>
                )}
              </ul>
            }
          />
        )}

        <Input.TextArea
          readOnly
          value={
            sqlResult.sql ||
            "-- SQL sẽ xuất hiện khi fashion và toàn bộ frame hợp lệ."
          }
          autoSize={{ minRows: 12, maxRows: 28 }}
          className="font-mono text-xs leading-5"
          aria-label="SQL insert đã tạo"
        />
      </Card>
    </div>
  );
}

export default AdminFashionComposerPage;
