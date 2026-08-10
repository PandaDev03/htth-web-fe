export type PartKey = "head" | "body" | "legs" | "accessory";

export type PoseKey = "stand" | "run" | "attack" | "die";

export type PosePartFrame = {
  frame: number;
  baseDx: number;
  baseDy: number;
};

export type CharacterPoseFrame = Record<PartKey, PosePartFrame>;

export type PartSpec = {
  key: PartKey;
  label: string;
  type: 0 | 1 | 2 | 4;
  frameCount: number;
  defaultMwearSlot: number;
  description: string;
};

export type UploadedPartAsset = {
  id: string;
  name: string;
  url: string;
  iconId: number | null;
  width: number;
  height: number;
};

export type FrameAssignment = {
  assetId: string | null;
  dx: number;
  dy: number;
};

export type PartConfiguration = {
  enabled: boolean;
  partId: number | null;
  mwearSlot: number;
  frames: FrameAssignment[];
};

export type FashionConfiguration = {
  id: number | null;
  icon: number | null;
  name: string;
  info: string;
  price: number;
  hsd: number;
  shopSale: boolean;
  op: string;
  specOp: string;
};

export type ComposerAssets = Record<PartKey, UploadedPartAsset[]>;
export type ComposerParts = Record<PartKey, PartConfiguration>;

export const PART_SPECS: PartSpec[] = [
  {
    key: "head",
    label: "Head",
    type: 0,
    frameCount: 5,
    defaultMwearSlot: 6,
    description: "Đầu hoặc mũ, 5 frame",
  },
  {
    key: "body",
    label: "Body",
    type: 1,
    frameCount: 20,
    defaultMwearSlot: 3,
    description: "Thân nhân vật, 20 frame",
  },
  {
    key: "legs",
    label: "Legs",
    type: 2,
    frameCount: 15,
    defaultMwearSlot: 5,
    description: "Chân nhân vật, 15 frame",
  },
  {
    key: "accessory",
    label: "Phụ kiện",
    type: 4,
    frameCount: 2,
    defaultMwearSlot: 4,
    description: "Cánh hoặc part bổ sung, 2 frame",
  },
];

export const PART_SPEC_BY_KEY = Object.fromEntries(
  PART_SPECS.map((spec) => [spec.key, spec]),
) as Record<PartKey, PartSpec>;

export const POSE_SPECS: Array<{
  key: PoseKey;
  label: string;
  description: string;
}> = [
  { key: "stand", label: "Stand", description: "Đứng yên" },
  { key: "run", label: "Run", description: "Chạy" },
  { key: "attack", label: "Attack", description: "Đánh cơ bản" },
  { key: "die", label: "Die", description: "Gục ngã" },
];

export const DEFAULT_POSE_SEQUENCES: Record<PoseKey, number[]> = {
  stand: [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0],
  run: [2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7],
  attack: [8, 8, 8, 9, 9, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  die: [38],
};

// MainObject.CharInfo[characterFrame][slot] = [partFrame, baseDx, baseDy].
// Slots used here: 0 head, 1 legs, 2 body, 4 hat/accessory.
export const CHARACTER_POSE_FRAMES: Record<number, CharacterPoseFrame> = {
  0: {
    head: { frame: 0, baseDx: -5, baseDy: -42 },
    legs: { frame: 0, baseDx: -11, baseDy: -18 },
    body: { frame: 0, baseDx: -8, baseDy: -30 },
    accessory: { frame: 0, baseDx: -9, baseDy: -44 },
  },
  1: {
    head: { frame: 0, baseDx: -5, baseDy: -41 },
    legs: { frame: 0, baseDx: -11, baseDy: -18 },
    body: { frame: 0, baseDx: -8, baseDy: -29 },
    accessory: { frame: 0, baseDx: -9, baseDy: -43 },
  },
  2: {
    head: { frame: 0, baseDx: -11, baseDy: -40 },
    legs: { frame: 1, baseDx: -18, baseDy: -18 },
    body: { frame: 1, baseDx: -11, baseDy: -31 },
    accessory: { frame: 0, baseDx: -15, baseDy: -42 },
  },
  3: {
    head: { frame: 0, baseDx: -11, baseDy: -41 },
    legs: { frame: 2, baseDx: -6, baseDy: -18 },
    body: { frame: 2, baseDx: -7, baseDy: -30 },
    accessory: { frame: 0, baseDx: -15, baseDy: -43 },
  },
  4: {
    head: { frame: 0, baseDx: -11, baseDy: -43 },
    legs: { frame: 3, baseDx: -6, baseDy: -22 },
    body: { frame: 3, baseDx: -17, baseDy: -37 },
    accessory: { frame: 0, baseDx: -15, baseDy: -45 },
  },
  5: {
    head: { frame: 0, baseDx: -11, baseDy: -41 },
    legs: { frame: 4, baseDx: -14, baseDy: -20 },
    body: { frame: 3, baseDx: -17, baseDy: -35 },
    accessory: { frame: 0, baseDx: -15, baseDy: -43 },
  },
  6: {
    head: { frame: 0, baseDx: -11, baseDy: -42 },
    legs: { frame: 5, baseDx: -5, baseDy: -19 },
    body: { frame: 2, baseDx: -7, baseDy: -31 },
    accessory: { frame: 0, baseDx: -15, baseDy: -44 },
  },
  7: {
    head: { frame: 0, baseDx: -11, baseDy: -44 },
    legs: { frame: 6, baseDx: -9, baseDy: -23 },
    body: { frame: 4, baseDx: -13, baseDy: -35 },
    accessory: { frame: 0, baseDx: -15, baseDy: -46 },
  },
  8: {
    head: { frame: 1, baseDx: -7, baseDy: -40 },
    legs: { frame: 7, baseDx: -12, baseDy: -17 },
    body: { frame: 5, baseDx: -15, baseDy: -29 },
    accessory: { frame: 0, baseDx: -11, baseDy: -42 },
  },
  9: {
    head: { frame: 1, baseDx: -7, baseDy: -39 },
    legs: { frame: 7, baseDx: -12, baseDy: -17 },
    body: { frame: 5, baseDx: -15, baseDy: -28 },
    accessory: { frame: 0, baseDx: -11, baseDy: -41 },
  },
  10: {
    head: { frame: 3, baseDx: -6, baseDy: -39 },
    legs: { frame: 7, baseDx: -12, baseDy: -17 },
    body: { frame: 5, baseDx: -15, baseDy: -28 },
    accessory: { frame: 0, baseDx: -10, baseDy: -41 },
  },
  38: {
    head: { frame: 1, baseDx: -4, baseDy: -41 },
    legs: { frame: 14, baseDx: -9, baseDy: -17 },
    body: { frame: 17, baseDx: -15, baseDy: -34 },
    accessory: { frame: 0, baseDx: -8, baseDy: -43 },
  },
};

export const SUPPORTED_CHARACTER_FRAMES = Object.keys(CHARACTER_POSE_FRAMES).map(
  Number,
);

export const createFrames = (count: number): FrameAssignment[] =>
  Array.from({ length: count }, () => ({ assetId: null, dx: 0, dy: 0 }));

export const createInitialParts = (): ComposerParts =>
  Object.fromEntries(
    PART_SPECS.map((spec) => [
      spec.key,
      {
        enabled: true,
        partId: null,
        mwearSlot: spec.defaultMwearSlot,
        frames: createFrames(spec.frameCount),
      },
    ]),
  ) as ComposerParts;

export const createInitialAssets = (): ComposerAssets => ({
  head: [],
  body: [],
  legs: [],
  accessory: [],
});

export const DEFAULT_FASHION: FashionConfiguration = {
  id: null,
  icon: null,
  name: "",
  info: "",
  price: 0,
  hsd: -1,
  shopSale: false,
  op: "[]",
  specOp: "[]",
};

export function inferRawIconId(fileName: string): number | null {
  const matches = fileName.match(/\d+/g);
  if (!matches?.length) return null;

  const parsed = Math.max(...matches.map(Number));
  if (!Number.isInteger(parsed)) return null;

  return parsed >= 10_000 && parsed <= 42_767 ? parsed - 10_000 : parsed;
}

function parseJsonArray(value: string, label: string, errors: string[]) {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      errors.push(`${label} phải là một JSON array.`);
      return [];
    }
    return parsed;
  } catch {
    errors.push(`${label} chưa phải JSON hợp lệ.`);
    return [];
  }
}

const isIntegerInRange = (value: number | null, min: number, max: number) =>
  value !== null && Number.isInteger(value) && value >= min && value <= max;

export function validateComposer(
  fashion: FashionConfiguration,
  parts: ComposerParts,
  assets: ComposerAssets,
) {
  const errors: string[] = [];

  if (!isIntegerInRange(fashion.id, 0, 255)) {
    errors.push("Fashion ID phải là số nguyên từ 0 đến 255.");
  }
  if (!isIntegerInRange(fashion.icon, -32_768, 32_767)) {
    errors.push("Fashion icon phải nằm trong giới hạn short.");
  }
  if (!fashion.name.trim()) errors.push("Chưa nhập tên fashion.");
  if (!Number.isInteger(fashion.price) || fashion.price < 0) {
    errors.push("Giá phải là số nguyên không âm.");
  }
  if (!Number.isInteger(fashion.hsd) || fashion.hsd < -1) {
    errors.push("Hạn sử dụng phải là -1 hoặc số ngày không âm.");
  }

  const parsedOp = parseJsonArray(fashion.op, "op", errors);
  const parsedSpecOp = parseJsonArray(fashion.specOp, "spec_op", errors);
  const enabledSpecs = PART_SPECS.filter((spec) => parts[spec.key].enabled);

  if (!enabledSpecs.length) errors.push("Cần bật ít nhất một nhóm part.");

  const seenPartIds = new Set<number>();
  const seenSlots = new Set<number>();

  for (const spec of enabledSpecs) {
    const configuration = parts[spec.key];
    if (!isIntegerInRange(configuration.partId, -32_768, 32_767)) {
      errors.push(`${spec.label}: Part ID phải nằm trong giới hạn short.`);
    } else if (seenPartIds.has(configuration.partId as number)) {
      errors.push(`${spec.label}: Part ID đang trùng với nhóm khác.`);
    } else {
      seenPartIds.add(configuration.partId as number);
    }

    if (
      !Number.isInteger(configuration.mwearSlot) ||
      configuration.mwearSlot < -1 ||
      configuration.mwearSlot > 7
    ) {
      errors.push(`${spec.label}: Slot mwear chỉ nhận -1 hoặc từ 0 đến 7.`);
    } else if (configuration.mwearSlot >= 0) {
      if (seenSlots.has(configuration.mwearSlot)) {
        errors.push(`${spec.label}: Slot mwear đang trùng với nhóm khác.`);
      }
      seenSlots.add(configuration.mwearSlot);
    }

    if (configuration.frames.length !== spec.frameCount) {
      errors.push(`${spec.label}: Sai số lượng frame yêu cầu.`);
      continue;
    }

    configuration.frames.forEach((frame, index) => {
      const asset = assets[spec.key].find((item) => item.id === frame.assetId);
      if (!asset) {
        errors.push(`${spec.label} frame ${index}: Chưa chọn part.`);
      } else if (!isIntegerInRange(asset.iconId, -32_768, 32_767)) {
        errors.push(`${spec.label} frame ${index}: Icon ID không hợp lệ.`);
      }
      if (!Number.isInteger(frame.dx) || frame.dx < -128 || frame.dx > 127) {
        errors.push(`${spec.label} frame ${index}: Offset X vượt giới hạn byte.`);
      }
      if (!Number.isInteger(frame.dy) || frame.dy < -128 || frame.dy > 127) {
        errors.push(`${spec.label} frame ${index}: Offset Y vượt giới hạn byte.`);
      }
    });
  }

  return { errors, parsedOp, parsedSpecOp };
}

const escapeSqlString = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/\0/g, "\\0")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .split(String.fromCharCode(26))
    .join("\\Z")
    .replace(/'/g, "''");

export function generateFashionSql(
  fashion: FashionConfiguration,
  parts: ComposerParts,
  assets: ComposerAssets,
) {
  const validation = validateComposer(fashion, parts, assets);
  if (validation.errors.length) {
    return { sql: "", errors: validation.errors };
  }

  const enabledSpecs = PART_SPECS.filter((spec) => parts[spec.key].enabled);
  const partRows = enabledSpecs.map((spec) => {
    const configuration = parts[spec.key];
    const data = configuration.frames.map((frame) => {
      const asset = assets[spec.key].find((item) => item.id === frame.assetId);
      return [asset?.iconId, frame.dx, frame.dy];
    });
    return `  (${configuration.partId}, ${spec.type}, '${escapeSqlString(JSON.stringify(data))}')`;
  });

  const mwear = Array.from({ length: 8 }, () => -1);
  for (const spec of enabledSpecs) {
    const configuration = parts[spec.key];
    if (configuration.mwearSlot >= 0) {
      mwear[configuration.mwearSlot] = configuration.partId as number;
    }
  }

  const sql = [
    "START TRANSACTION;",
    "",
    "INSERT INTO `parts` (`id`, `type`, `data`) VALUES",
    `${partRows.join(",\n")};`,
    "",
    "INSERT INTO `fashiontemplate`",
    "  (`id`, `icon`, `name`, `info`, `mwear`, `op`, `spec_op`, `price`, `hsd`, `shop_sale`)",
    "VALUES",
    `  (${fashion.id}, ${fashion.icon}, '${escapeSqlString(fashion.name.trim())}', '${escapeSqlString(fashion.info.trim())}', '${escapeSqlString(JSON.stringify(mwear))}', '${escapeSqlString(JSON.stringify(validation.parsedOp))}', '${escapeSqlString(JSON.stringify(validation.parsedSpecOp))}', ${fashion.price}, ${fashion.hsd}, ${fashion.shopSale ? 1 : 0});`,
    "",
    "COMMIT;",
  ].join("\n");

  return { sql, errors: [] as string[] };
}
