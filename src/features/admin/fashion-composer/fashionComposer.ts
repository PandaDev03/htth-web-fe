export type PartKey = "head" | "body" | "legs" | "accessory" | "cloak";

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
    label: "Hat / Phụ kiện",
    type: 4,
    frameCount: 2,
    defaultMwearSlot: 1,
    description: "Mũ hoặc part phủ phía trước nhân vật, 2 frame",
  },
  {
    key: "cloak",
    label: "Cloak",
    type: 4,
    frameCount: 2,
    defaultMwearSlot: 4,
    description: "Áo choàng, mây hoặc part nền phía sau nhân vật, 2 frame",
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
  {
    key: "attack",
    label: "Attack",
    description: "Preset mẫu; skill thật lấy chuỗi frame từ Plash",
  },
  { key: "die", label: "Die", description: "Gục ngã" },
];

export const DEFAULT_POSE_SEQUENCES: Record<PoseKey, number[]> = {
  stand: [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0],
  run: [2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7],
  // Attack runtime is skill-specific through Plash.mDataPlash. This sequence
  // only gives the composer a small manual-preview preset.
  attack: [8, 8, 8, 9, 9, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  die: [38],
};

// MainObject.CharInfo[characterFrame][slot] = [partFrame, baseDx, baseDy].
// Tuple order below: head(slot 0), legs(slot 1), body(slot 2), hat(slot 4).
type CharacterPartTuple = readonly [frame: number, baseDx: number, baseDy: number];
type CharacterPoseTuple = readonly [
  head: CharacterPartTuple,
  legs: CharacterPartTuple,
  body: CharacterPartTuple,
  accessory: CharacterPartTuple,
];

const CHARACTER_POSE_DATA: readonly CharacterPoseTuple[] = [
  [[0, -5, -42], [0, -11, -18], [0, -8, -30], [0, -9, -44]], // 0
  [[0, -5, -41], [0, -11, -18], [0, -8, -29], [0, -9, -43]], // 1
  [[0, -11, -40], [1, -18, -18], [1, -11, -31], [0, -15, -42]], // 2
  [[0, -11, -41], [2, -6, -18], [2, -7, -30], [0, -15, -43]], // 3
  [[0, -11, -43], [3, -6, -22], [3, -17, -37], [0, -15, -45]], // 4
  [[0, -11, -41], [4, -14, -20], [3, -17, -35], [0, -15, -43]], // 5
  [[0, -11, -42], [5, -5, -19], [2, -7, -31], [0, -15, -44]], // 6
  [[0, -11, -44], [6, -9, -23], [4, -13, -35], [0, -15, -46]], // 7
  [[1, -7, -40], [7, -12, -17], [5, -15, -29], [0, -11, -42]], // 8
  [[1, -7, -39], [7, -12, -17], [5, -15, -28], [0, -11, -41]], // 9
  [[3, -6, -39], [7, -12, -17], [5, -15, -28], [0, -10, -41]], // 10
  [[2, -7, -42], [6, -9, -18], [5, -15, -31], [0, -11, -44]], // 11
  [[1, -7, -41], [5, -4, -16], [5, -15, -30], [0, -11, -43]], // 12
  [[1, -10, -41], [8, -17, -18], [2, -6, -30], [0, -14, -43]], // 13
  [[1, -10, -42], [6, -8, -18], [2, -6, -31], [0, -14, -44]], // 14
  [[2, -13, -39], [9, -21, -18], [6, -19, -28], [0, -17, -41]], // 15
  [[2, -13, -39], [14, -9, -18], [6, -19, -28], [0, -17, -41]], // 16
  [[4, -13, -40], [9, -21, -18], [7, -19, -29], [1, -17, -42]], // 17
  [[4, -13, -40], [14, -9, -18], [7, -19, -29], [1, -17, -42]], // 18
  [[1, -10, -41], [8, -17, -18], [8, -2, -46], [0, -14, -43]], // 19
  [[1, -10, -41], [6, -8, -18], [8, -2, -46], [0, -14, -43]], // 20
  [[1, -10, -41], [8, -17, -18], [9, -2, -48], [0, -14, -43]], // 21
  [[1, -10, -41], [6, -8, -18], [9, -2, -48], [0, -14, -43]], // 22
  [[1, -12, -39], [8, -17, -18], [10, -4, -32], [0, -16, -41]], // 23
  [[1, -12, -39], [6, -8, -18], [10, -4, -32], [0, -16, -41]], // 24
  [[2, -10, -40], [9, -21, -18], [11, -18, -29], [0, -14, -42]], // 25
  [[2, -10, -40], [14, -9, -18], [11, -18, -29], [0, -14, -42]], // 26
  [[1, -5, -44], [10, -21, -27], [12, -9, -32], [0, -9, -46]], // 27
  [[2, -7, -44], [11, -23, -29], [13, -12, -32], [0, -11, -46]], // 28
  [[2, -7, -44], [12, -28, -25], [13, -12, -32], [0, -11, -46]], // 29
  [[2, -7, -44], [13, -17, -37], [13, -12, -32], [0, -11, -46]], // 30
  [[1, -7, -41], [8, -17, -18], [14, -16, -29], [0, -11, -43]], // 31
  [[1, -7, -41], [14, -9, -17], [14, -16, -29], [0, -11, -43]], // 32
  [[1, -4, -41], [8, -17, -18], [15, -11, -34], [0, -8, -43]], // 33
  [[1, -4, -41], [14, -9, -17], [15, -11, -34], [0, -8, -43]], // 34
  [[1, -7, -41], [8, -17, -18], [16, -19, -30], [0, -11, -43]], // 35
  [[1, -7, -41], [14, -9, -17], [16, -19, -30], [0, -11, -43]], // 36
  [[1, -4, -41], [8, -17, -18], [17, -15, -34], [0, -8, -43]], // 37
  [[1, -4, -41], [14, -9, -17], [17, -15, -34], [0, -8, -43]], // 38
  [[2, -7, -41], [8, -17, -18], [18, -13, -29], [0, -11, -43]], // 39
  [[2, -7, -41], [14, -9, -17], [18, -13, -29], [0, -11, -43]], // 40
  [[2, -2, -41], [9, -19, -18], [19, -9, -29], [0, -6, -43]], // 41
  [[2, -2, -41], [14, -8, -17], [19, -9, -29], [0, -6, -43]], // 42
  [[1, -13, -39], [1, -18, -17], [10, -5, -32], [0, -17, -41]], // 43
  [[1, -13, -40], [2, -6, -18], [10, -5, -33], [0, -17, -42]], // 44
  [[1, -13, -42], [3, -6, -22], [10, -5, -35], [0, -17, -44]], // 45
  [[1, -13, -40], [4, -14, -19], [10, -5, -33], [0, -17, -42]], // 46
  [[1, -13, -41], [5, -5, -19], [10, -5, -34], [0, -17, -43]], // 47
  [[1, -13, -44], [6, -9, -23], [10, -5, -37], [0, -17, -46]], // 48
  [[3, -3, -41], [8, -17, -18], [17, -14, -34], [0, -7, -43]], // 49
  [[3, -4, -41], [14, -9, -17], [17, -15, -34], [0, -8, -43]], // 50
  [[3, -4, -42], [5, -5, -19], [17, -15, -35], [0, -8, -44]], // 51
  [[2, -13, -39], [1, -18, -17], [6, -19, -28], [0, -17, -41]], // 52
  [[4, -13, -40], [1, -18, -17], [7, -19, -29], [1, -17, -42]], // 53
  [[2, -10, -40], [1, -18, -17], [11, -18, -29], [0, -14, -42]], // 54
  [[0, -17, -44], [11, -23, -29], [4, -19, -35], [0, -21, -46]], // 55
  [[2, -15, -44], [12, -28, -25], [4, -18, -34], [0, -19, -46]], // 56
  [[2, -20, -43], [12, -28, -25], [6, -26, -32], [0, -24, -45]], // 57
  [[4, -19, -44], [12, -28, -25], [7, -25, -33], [1, -23, -46]], // 58
  [[4, -19, -44], [11, -23, -29], [7, -25, -33], [1, -23, -46]], // 59
  [[1, -11, -40], [14, -9, -18], [1, -11, -31], [0, -15, -42]], // 60
  [[1, -8, -42], [0, -11, -18], [5, -16, -31], [0, -12, -44]], // 61
];

const POSE_PART_KEYS: readonly PartKey[] = [
  "head",
  "legs",
  "body",
  "accessory",
];

const toPosePartFrame = ([frame, baseDx, baseDy]: CharacterPartTuple) => ({
  frame,
  baseDx,
  baseDy,
});

export const CHARACTER_POSE_FRAMES: Record<number, CharacterPoseFrame> =
  Object.fromEntries(
    CHARACTER_POSE_DATA.map((pose, characterFrame) => {
      const basePose = Object.fromEntries(
        POSE_PART_KEYS.map((key, index) => [
          key,
          toPosePartFrame(pose[index]),
        ]),
      ) as Omit<CharacterPoseFrame, "cloak">;
      return [
        characterFrame,
        {
          ...basePose,
          cloak: { ...basePose.accessory },
        },
      ];
    }),
  );

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
  cloak: [],
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
