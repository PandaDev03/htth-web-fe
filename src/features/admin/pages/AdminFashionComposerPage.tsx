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
  Slider,
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
  ImagePlus,
  Layers3,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Trash2,
} from "lucide-react";
import {
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import {
  createInitialAssets,
  createInitialParts,
  CHARACTER_POSE_FRAMES,
  DEFAULT_FASHION,
  DEFAULT_POSE_SEQUENCES,
  generateFashionSql,
  inferRawIconId,
  PART_SPEC_BY_KEY,
  PART_SPECS,
  POSE_SPECS,
  SUPPORTED_CHARACTER_FRAMES,
  type ComposerAssets,
  type ComposerParts,
  type FashionConfiguration,
  type FrameAssignment,
  type PartKey,
  type PoseKey,
  type UploadedPartAsset,
} from "@/features/admin/fashion-composer/fashionComposer";

const { Dragger } = Upload;

const EMPTY_PREVIEW_FRAMES: Record<PartKey, number> = {
  head: 0,
  body: 0,
  legs: 0,
  accessory: 0,
  cloak: 0,
};

const EMPTY_VISIBILITY: Record<PartKey, boolean> = {
  head: true,
  body: true,
  legs: true,
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

type PreviewDragSession = {
  pointerId: number;
  partKey: PartKey;
  frameIndex: number;
  startClientX: number;
  startClientY: number;
  startDx: number;
  startDy: number;
  baseDx: number;
  baseDy: number;
  logicalWidth: number;
  direction: PreviewDirection;
  nextDx: number;
  nextDy: number;
};

type ResourceScale = 1 | 2 | 3 | 4;
type PreviewDirection = "left" | "right";
type PreviewFrameMode = "game" | "custom";

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
          Ảnh đầu tiên tự điền toàn bộ frame còn trống. Sau đó vẫn có thể đổi
          từng frame bằng dropdown. File chỉ nằm trong trình duyệt, không upload
          lên server. Tên file 10xxx sẽ tự bỏ offset 10000, Icon ID vẫn sửa được.
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
            {spec.frameCount} frame bắt buộc cho parts.type = {spec.type}.
            Auto-fill không ghi đè lựa chọn hiện có; dropdown dùng để custom
            từng frame.
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
  previewFrames,
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
  previewFrames: Record<PartKey, number>;
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
  const [frameMode, setFrameMode] = useState<PreviewFrameMode>("game");
  const [referenceCharacterFrame, setReferenceCharacterFrame] = useState(0);
  const dragSessionRef = useRef<PreviewDragSession | null>(null);
  const layerRefs = useRef<Partial<Record<PartKey, HTMLDivElement | null>>>({});
  const selectionBoxRef = useRef<HTMLDivElement | null>(null);
  const coordinatesRef = useRef<HTMLSpanElement | null>(null);
  // Cloak uses paint index 7 and CharInfo slot 4, then renders behind the
  // standard character parts in both directions.
  const layerOrder: PartKey[] = [
    "cloak",
    "legs",
    "body",
    "head",
    "accessory",
  ];
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
  const currentPoseSequence = poseValidation[selectedPose].frames;
  const animationCharacterFrame = currentPoseSequence.length
    ? currentPoseSequence[animationStep % currentPoseSequence.length]
    : undefined;
  const characterFrame =
    animationEnabled && animationCharacterFrame !== undefined
      ? animationCharacterFrame
      : referenceCharacterFrame;
  const characterPoseFrame =
    CHARACTER_POSE_FRAMES[characterFrame] ?? CHARACTER_POSE_FRAMES[0];
  const followsGameFrame = animationEnabled || frameMode === "game";
  const effectivePreviewFrames =
    followsGameFrame
      ? (Object.fromEntries(
          PART_SPECS.map((spec) => [
            spec.key,
            characterPoseFrame[spec.key].frame,
          ]),
        ) as Record<PartKey, number>)
      : previewFrames;
  const getBaseOffset = (key: PartKey) => characterPoseFrame[key];
  const selectedBaseOffset = getBaseOffset(selectedLayer);
  const selectedConfiguration = parts[selectedLayer];
  const selectedFrameIndex = effectivePreviewFrames[selectedLayer];
  const selectedFrame = selectedConfiguration.frames[selectedFrameIndex];
  const selectedAsset = assets[selectedLayer].find(
    (item) => item.id === selectedFrame?.assetId,
  );
  const canMoveSelected = Boolean(
    selectedConfiguration.enabled &&
    visibility[selectedLayer] &&
    selectedFrame &&
    selectedAsset,
  );
  const selectedLogicalWidth = selectedAsset
    ? getLogicalSize(selectedAsset.width, resourceScale)
    : 0;
  const selectedLogicalHeight = selectedAsset
    ? getLogicalSize(selectedAsset.height, resourceScale)
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

  const updateDraggedElements = (session: PreviewDragSession) => {
    const position = getRenderTranslation(
      session.baseDx,
      session.baseDy,
      session.nextDx,
      session.nextDy,
      session.logicalWidth,
      session.direction,
    );
    const transform = `translate(${position.x}px, ${position.y}px)`;
    const layer = layerRefs.current[session.partKey];
    if (layer) layer.style.transform = transform;
    if (selectionBoxRef.current) {
      selectionBoxRef.current.style.transform = transform;
    }
    if (coordinatesRef.current) {
      coordinatesRef.current.textContent = `Offset X ${session.nextDx}, Y ${session.nextDy}`;
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    const hitTarget =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>("[data-preview-part]")
        : null;
    const hitPartKey = hitTarget?.dataset.previewPart as PartKey | undefined;
    const partKey = hitPartKey ?? selectedLayer;
    const configuration = parts[partKey];
    const frameIndex = effectivePreviewFrames[partKey];
    const frame = configuration.frames[frameIndex];
    const asset = assets[partKey].find((item) => item.id === frame?.assetId);

    if (!configuration.enabled || !visibility[partKey] || !frame || !asset) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    if (partKey !== selectedLayer) onSelectLayer(partKey);
    if (animationEnabled) {
      setIsPlaying(false);
      if (previewFrames[partKey] !== frameIndex) {
        onChangeFrame(partKey, frameIndex);
      }
    }
    const { baseDx, baseDy } = getBaseOffset(partKey);
    dragSessionRef.current = {
      pointerId: event.pointerId,
      partKey,
      frameIndex,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startDx: frame.dx,
      startDy: frame.dy,
      baseDx,
      baseDy,
      logicalWidth: getLogicalSize(asset.width, resourceScale),
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
        Math.round((event.clientX - session.startClientX) / zoom) *
          horizontalDirection,
    );
    session.nextDy = clampOffset(
      session.startDy +
        Math.round((event.clientY - session.startClientY) / zoom),
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
    onChangeOffset(
      session.partKey,
      session.frameIndex,
      session.nextDx,
      session.nextDy,
    );
  };

  const handlePreviewKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!canMoveSelected || !selectedFrame) return;

    const keyDirection = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[event.key];
    if (!keyDirection) return;

    event.preventDefault();
    if (animationEnabled) {
      setIsPlaying(false);
      if (previewFrames[selectedLayer] !== selectedFrameIndex) {
        onChangeFrame(selectedLayer, selectedFrameIndex);
      }
    }
    const step = event.shiftKey ? 5 : 1;
    const horizontalDirection = direction === "left" ? 1 : -1;
    onChangeOffset(
      selectedLayer,
      selectedFrameIndex,
      clampOffset(
        selectedFrame.dx + keyDirection[0] * step * horizontalDirection,
      ),
      clampOffset(selectedFrame.dy + keyDirection[1] * step),
    );
  };

  return (
    <Card
      className="border-slate-200 shadow-sm xl:sticky xl:top-24"
      styles={{ body: { padding: 20 } }}
    >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
                <Layers3 size={18} className="text-amber-700" />
                Preview ghép layer
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Nhấn trực tiếp part hoặc chọn layer bên dưới, sau đó kéo để căn.
              </p>
            </div>
            <Tag color="gold">
              Ảnh x{resourceScale} · Preview {zoom}x
            </Tag>
          </div>
          <div
            role="group"
            tabIndex={0}
            aria-label={`Preview ${PART_SPEC_BY_KEY[selectedLayer].label} frame ${selectedFrameIndex}. Kéo hoặc dùng phím mũi tên để chỉnh offset.`}
            className={`relative mx-auto aspect-[4/5] min-h-[520px] w-full max-w-[620px] overflow-hidden rounded-xl border border-slate-300 bg-[#f8fafc] bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px] focus-visible:border-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/25 ${canMoveSelected ? (dragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"}`}
            style={{ touchAction: "none" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishPointerDrag}
            onPointerCancel={finishPointerDrag}
            onKeyDown={handlePreviewKeyDown}
          >
            <div className="pointer-events-none absolute left-1/2 top-[72%] h-px w-full -translate-x-1/2 bg-amber-600/35" />
            <div className="pointer-events-none absolute left-1/2 top-[72%] h-full w-px -translate-y-1/2 bg-amber-600/35" />
            <div className="pointer-events-none absolute left-1/2 top-[72%] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-700 bg-amber-100" />
            <span className="pointer-events-none absolute left-[calc(50%+8px)] top-[calc(72%+6px)] rounded bg-white/80 px-1 py-0.5 font-mono text-[9px] text-amber-800">
              Gốc render (0,0)
            </span>
            <div
              className="absolute left-1/2 top-[72%]"
              style={{ transform: `scale(${zoom})`, transformOrigin: "0 0" }}
            >
              {layerOrder.map((key) => {
                const configuration = parts[key];
                const frameIndex = effectivePreviewFrames[key];
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
                const { baseDx, baseDy } = getBaseOffset(key);
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
                    key={key}
                    ref={(node) => {
                      layerRefs.current[key] = node;
                    }}
                    data-preview-part={key}
                    className="pointer-events-auto absolute left-0 top-0 cursor-grab select-none active:cursor-grabbing"
                    style={{
                      width: logicalWidth,
                      height: logicalHeight,
                      transform: `translate(${position.x}px, ${position.y}px)`,
                      willChange:
                        key === selectedLayer ? "transform" : undefined,
                    }}
                  >
                    <img
                      src={asset.url}
                      alt={`${PART_SPEC_BY_KEY[key].label} frame ${frameIndex}`}
                      draggable={false}
                      className="block max-w-none [image-rendering:pixelated]"
                      style={{
                        width: logicalWidth,
                        height: logicalHeight,
                        transform:
                          direction === "right" ? "scaleX(-1)" : undefined,
                      }}
                    />
                  </div>
                );
              })}
              {canMoveSelected && selectedFrame && selectedAsset && (
                <div
                  ref={selectionBoxRef}
                  className="pointer-events-none absolute left-0 top-0 border border-dashed border-amber-600 bg-amber-400/5"
                  style={{
                    width: selectedLogicalWidth,
                    height: selectedLogicalHeight,
                    transform: `translate(${selectedRenderPosition.x}px, ${selectedRenderPosition.y}px)`,
                    willChange: "transform",
                  }}
                />
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs">
            <span className="font-semibold text-amber-800">
              {PART_SPEC_BY_KEY[selectedLayer].label} / Frame{" "}
              {selectedFrameIndex}
            </span>
            <span ref={coordinatesRef} className="font-mono text-amber-700">
              Offset X {selectedFrame?.dx ?? 0}, Y {selectedFrame?.dy ?? 0}
            </span>
          </div>
          <p className="mt-2 text-[11px] leading-4 text-slate-400">
            Giao điểm là tọa độ x/y truyền vào MainObject.paintBody, tức điểm
            đứng của nhân vật. Offset luôn tính theo pixel logic x1. Kéo bằng
            chuột hoặc cảm ứng. Phím mũi tên chỉnh 1px, giữ Shift để chỉnh 5px.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                Chọn frame part
              </span>
              <Segmented<PreviewFrameMode>
                block
                disabled={animationEnabled}
                value={frameMode}
                options={[
                  { value: "game", label: "Theo game" },
                  { value: "custom", label: "Tùy chỉnh" },
                ]}
                onChange={setFrameMode}
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
                options={SUPPORTED_CHARACTER_FRAMES.map((frame) => ({
                  value: frame,
                  label: `Frame ${frame}`,
                }))}
                onChange={setReferenceCharacterFrame}
              />
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-4 text-slate-400">
            Chọn đúng thư mục resource đang upload. PC x4 dùng x4, mobile x1-x3
            dùng scale tương ứng. Animation luôn ép frame part theo CharInfo game.
          </p>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Độ phóng
              </span>
              <span className="font-mono text-xs text-slate-500">{zoom}x</span>
            </div>
            <Slider
              min={1}
              max={6}
              step={1}
              value={zoom}
              onChange={onChangeZoom}
              tooltip={{ formatter: (value) => `${value}x` }}
            />
          </div>

          <div className="mt-4 space-y-2">
            {PART_SPECS.map((spec) => (
              <div
                key={spec.key}
                className={`grid grid-cols-[minmax(88px,1fr)_118px_36px] items-center gap-2 rounded-lg px-1 py-1 ${selectedLayer === spec.key ? "bg-amber-50" : ""}`}
              >
                <button
                  type="button"
                  disabled={!parts[spec.key].enabled}
                  onClick={() => onSelectLayer(spec.key)}
                  className={`truncate rounded-md px-2 py-1 text-left text-xs font-semibold disabled:cursor-not-allowed disabled:text-slate-300 ${selectedLayer === spec.key ? "text-amber-800" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  {spec.label}
                </button>
                <Select
                  size="small"
                  value={effectivePreviewFrames[spec.key]}
                  disabled={!parts[spec.key].enabled || followsGameFrame}
                  options={Array.from(
                    { length: spec.frameCount },
                    (_, index) => ({
                      value: index,
                      label: `Frame ${index}`,
                    }),
                  )}
                  onChange={(value) => {
                    onSelectLayer(spec.key);
                    onChangeFrame(spec.key, value);
                  }}
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
              onChange={setSelectedPose}
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
                {POSE_SPECS.map((pose) => {
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
                            if (pose.key === selectedPose) {
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
                          if (pose.key === selectedPose) {
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
                Frame hỗ trợ: {SUPPORTED_CHARACTER_FRAMES.join(", ")}. Attack là
                preset đánh cơ bản, skill riêng có thể dùng chuỗi khác.
              </p>
            </details>
          </div>
    </Card>
  );
}

function AdminFashionComposerPage() {
  const [fashion, setFashion] = useState<FashionConfiguration>({
    ...DEFAULT_FASHION,
  });
  const [parts, setParts] = useState<ComposerParts>(createInitialParts);
  const [assets, setAssets] = useState<ComposerAssets>(createInitialAssets);
  const [activePart, setActivePart] = useState<PartKey>("head");
  const [previewFrames, setPreviewFrames] = useState(EMPTY_PREVIEW_FRAMES);
  const [visibility, setVisibility] = useState(EMPTY_VISIBILITY);
  const [zoom, setZoom] = useState(4);
  const [previewResetVersion, setPreviewResetVersion] = useState(0);
  const assetsRef = useRef(assets);

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

  const activeSpec = PART_SPEC_BY_KEY[activePart];
  const activeConfiguration = parts[activePart];

  const updateFashion = <K extends keyof FashionConfiguration>(
    key: K,
    value: FashionConfiguration[K],
  ) => setFashion((current) => ({ ...current, [key]: value }));

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
  ) =>
    setParts((current) => ({
      ...current,
      [key]: {
        ...current[key],
        frames: current[key].frames.map((frame, frameIndex) =>
          frameIndex === index ? { ...frame, ...patch } : frame,
        ),
      },
    }));

  const handleUpload = async (key: PartKey, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn đúng file ảnh.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${file.name}: ảnh không được vượt quá 5MB.`);
      return;
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
      setAssets((current) => ({
        ...current,
        [key]: [...current[key], asset],
      }));
      setParts((current) => {
        const frames = current[key].frames;
        if (frames.every((frame) => frame.assetId !== null)) return current;

        return {
          ...current,
          [key]: {
            ...current[key],
            frames: frames.map((frame) =>
              frame.assetId === null ? { ...frame, assetId: asset.id } : frame,
            ),
          },
        };
      });
    } catch {
      URL.revokeObjectURL(url);
      toast.error(`${file.name}: không thể đọc ảnh.`);
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
    toast.success(
      `Đã gán part cho toàn bộ frame ${PART_SPEC_BY_KEY[key].label}.`,
    );
  };

  const removeAsset = (key: PartKey, assetId: string) => {
    const asset = assets[key].find((item) => item.id === assetId);
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
    setFashion({ ...DEFAULT_FASHION });
    setParts(createInitialParts());
    setAssets(createInitialAssets());
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
          </div>
      </Card>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_560px] 2xl:grid-cols-[minmax(0,1fr)_640px]">
        <Card
          className="min-w-0 border-slate-200 shadow-sm"
          styles={{ body: { padding: 24 } }}
        >
          <div className="mb-5">
            <h2 className="text-base font-bold text-slate-800">
              Parts và frame
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Chọn nhóm part, gán ảnh cho từng frame rồi chỉnh offset X/Y.
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
                <FieldLabel hint={`type ${activeSpec.type}`}>
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
                  updateFrame(activePart, index, patch)
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

        <aside className="min-w-0" aria-label="Preview fashion">
          <ComposerPreview
            key={previewResetVersion}
            parts={parts}
            assets={assets}
            previewFrames={previewFrames}
            visibility={visibility}
            selectedLayer={activePart}
            zoom={zoom}
            onChangeFrame={(key, frame) =>
              setPreviewFrames((current) => ({ ...current, [key]: frame }))
            }
            onSelectLayer={setActivePart}
            onChangeOffset={(key, frameIndex, dx, dy) =>
              updateFrame(key, frameIndex, { dx, dy })
            }
            onToggleVisibility={(key) =>
              setVisibility((current) => ({
                ...current,
                [key]: !current[key],
              }))
            }
            onChangeZoom={setZoom}
          />
        </aside>
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
