import {
  Alert,
  Button,
  Empty,
  Input,
  Popconfirm,
  Select,
  Segmented,
  Skeleton,
  Switch,
  Tabs,
  Tooltip,
} from "antd";
import {
  Copy,
  Download,
  Eye,
  EyeOff,
  FileUp,
  ImagePlus,
  Layers3,
  LockKeyhole,
  Plus,
  Redo2,
  Save,
  Trash2,
  Undo2,
  UnlockKeyhole,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent,
} from "react";
import { toast } from "sonner";

import {
  ColorField,
  NodeInspector,
  NumberField,
} from "@/features/admin/ui-composer/NodeInspector";
import {
  ELEMENTS,
  KIND_LABELS,
  MAX_RESOURCE_BYTES,
  SCREENS,
  createDevilCardPreset,
  createNode,
  hitTest,
  listMetrics,
  newId,
  parseDocument,
  tabIndexAt,
  type NodeKind,
  type PreviewState,
  type UiAsset,
  type UiDocument,
  type UiNode,
} from "@/features/admin/ui-composer/uiComposer";
import {
  loadAssets,
  loadGameFonts,
  paintDocument,
  readAsset,
  type LoadedAssets,
} from "@/features/admin/ui-composer/uiRenderer";
import {
  downloadFile,
  loadDraft,
  saveDraft,
} from "@/features/admin/ui-composer/uiStorage";

import "@/features/admin/ui-composer/gameFonts.css";

type History = {
  present: UiDocument;
  past: UiDocument[];
  future: UiDocument[];
};
type Drag = {
  pointerId: number;
  type: "move" | "resize" | "scroll";
  node: UiNode;
  startX: number;
  startY: number;
  startDoc: UiDocument;
  startScroll: number;
  changed: boolean;
};
const initialPreview: PreviewState = {
  screen: "storage",
  element: "Tất cả",
  scroll: {},
};
const snapValue = (value: number, snap: number) =>
  Math.round(value / snap) * snap;
const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));
const panelClass = "rounded-xl border border-slate-200 bg-white";
const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Thao tác không thành công.";

export default function AdminUiComposerPage() {
  const [history, setHistory] = useState<History>(() => ({
    present: createDevilCardPreset(),
    past: [],
    future: [],
  }));
  const doc = history.present;
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"design" | "preview">("design");
  const [preview, setPreview] = useState<PreviewState>(initialPreview);
  const [loaded, setLoaded] = useState<LoadedAssets>(new Map());
  const [renderError, setRenderError] = useState("");
  const [fontError, setFontError] = useState("");
  const [saveStatus, setSaveStatus] = useState("Đang mở nháp…");
  const [storageError, setStorageError] = useState("");
  const [search, setSearch] = useState("");
  const [uploadScale, setUploadScale] = useState(4);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [grid, setGrid] = useState(false);
  const [snap, setSnap] = useState(1);
  const [zoom, setZoom] = useState("fit");
  const [previewWidth, setPreviewWidth] = useState(640);
  const [inspectorTab, setInspectorTab] = useState("properties");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const revision = useRef(0);
  const selected = doc.nodes.find((n) => n.id === selectedId);
  const scale =
    zoom === "fit"
      ? Math.min(1, (previewWidth - 24) / doc.width)
      : Number(zoom);

  const commit = useCallback(
    (transform: (current: UiDocument) => UiDocument) => {
      revision.current++;
      setHistory((previous) => {
        const present = transform(previous.present);
        if (present === previous.present) return previous;
        return {
          present,
          past: [...previous.past, previous.present].slice(-30),
          future: [],
        };
      });
    },
    [],
  );
  const patchNode = useCallback(
    (id: string, patch: Partial<UiNode>) => {
      commit((current) => ({
        ...current,
        nodes: current.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
      }));
    },
    [commit],
  );

  useEffect(() => {
    let active = true;
    void loadDraft()
      .then((draft) => {
        if (active && draft)
          setHistory({ present: draft, past: [], future: [] });
      })
      .catch((error) => {
        if (active)
          setStorageError("Không mở được nháp tại máy: " + errorMessage(error));
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    setSaveStatus("Chưa lưu…");
    const currentRevision = revision.current;
    const timer = window.setTimeout(() => {
      setSaveStatus("Đang lưu…");
      saveQueue.current = saveQueue.current
        .catch(() => undefined)
        .then(() => saveDraft(doc));
      void saveQueue.current
        .then(() => {
          if (currentRevision === revision.current) {
            setSaveStatus("Đã lưu nháp tại máy");
            setStorageError("");
          }
        })
        .catch((error) => {
          if (currentRevision === revision.current) {
            setSaveStatus("Lưu nháp thất bại");
            setStorageError(
              errorMessage(error) + " Hãy xuất JSON để giữ thiết kế.",
            );
          }
        });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [doc, ready]);

  useEffect(() => {
    let active = true;
    void loadAssets(doc.assets)
      .then((assets) => {
        if (active) {
          setLoaded(assets);
          setRenderError("");
        }
      })
      .catch((error) => {
        if (active) {
          setLoaded(new Map());
          setRenderError(errorMessage(error));
        }
      });
    return () => {
      active = false;
    };
  }, [doc.assets]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let active = true;
    const paint = () => {
      if (active)
        paintDocument(canvas, doc, loaded, preview, {
          grid: mode === "design" && grid ? 16 : undefined,
          selectedId: mode === "design" ? selectedId : null,
        });
    };
    void loadGameFonts()
      .then(() => {
        if (active) {
          setFontError("");
          paint();
        }
      })
      .catch((error) => {
        if (active) setFontError(errorMessage(error));
      });
    return () => {
      active = false;
    };
  }, [doc, loaded, preview, grid, mode, selectedId, ready]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(([entry]) =>
      setPreviewWidth(entry.contentRect.width),
    );
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [ready]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || mode !== "preview") return;
    const wheel = (event: WheelEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) * doc.width) / bounds.width;
      const y = ((event.clientY - bounds.top) * doc.height) / bounds.height;
      const node = hitTest(doc, preview.screen, x, y);
      if (node?.kind !== "itemList") return;
      const { maxScroll } = listMetrics(
        node,
        node.screen === "storage" ? preview.element : "Tất cả",
      );
      if (!maxScroll) return;
      event.preventDefault();
      const delta =
        event.deltaY *
        (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? node.height : 1);
      setPreview((p) => ({
        ...p,
        scroll: {
          ...p.scroll,
          [node.id]: clamp((p.scroll[node.id] ?? 0) + delta, 0, maxScroll),
        },
      }));
    };
    canvas.addEventListener("wheel", wheel, { passive: false });
    return () => canvas.removeEventListener("wheel", wheel);
  }, [doc, mode, preview, ready]);

  function undo() {
    revision.current++;
    setHistory((h) =>
      h.past.length
        ? {
            present: h.past[h.past.length - 1],
            past: h.past.slice(0, -1),
            future: [h.present, ...h.future].slice(0, 30),
          }
        : h,
    );
  }
  function redo() {
    revision.current++;
    setHistory((h) =>
      h.future.length
        ? {
            present: h.future[0],
            past: [...h.past, h.present].slice(-30),
            future: h.future.slice(1),
          }
        : h,
    );
  }
  function point(event: ReactPointerEvent<HTMLCanvasElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) * doc.width) / bounds.width,
      y: ((event.clientY - bounds.top) * doc.height) / bounds.height,
    };
  }
  function pointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (event.button !== 0) return;
    event.currentTarget.focus();
    const p = point(event);
    const node = hitTest(doc, preview.screen, p.x, p.y, mode === "design");
    if (mode === "preview") {
      if (node?.kind === "tabs") {
        const index = tabIndexAt(node, p.x, p.y);
        if (index < 0) return;
        if (node.action === "screen" && SCREENS[index]) {
          setPreview((prev) => ({
            ...prev,
            screen: SCREENS[index].value,
            scroll: {},
          }));
          return;
        }
        if (node.action === "element" && ELEMENTS[index]) {
          setPreview((prev) => ({
            ...prev,
            element: ELEMENTS[index],
            scroll: {},
          }));
          return;
        }
      }
      if (node?.kind === "button")
        toast.info("Preview bố cục: " + (node.text || node.name));
      if (node?.kind !== "itemList") return;
    } else {
      setSelectedId(node?.id ?? null);
      setInspectorTab("properties");
      if (!node || node.locked) return;
    }
    if (!node) return;
    const resizing =
      mode === "design" &&
      p.x >= node.x + node.width - 12 &&
      p.y >= node.y + node.height - 12;
    dragRef.current = {
      pointerId: event.pointerId,
      type: mode === "preview" ? "scroll" : resizing ? "resize" : "move",
      node,
      startX: p.x,
      startY: p.y,
      startDoc: doc,
      startScroll: preview.scroll[node.id] ?? 0,
      changed: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function pointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const p = point(event),
      dx = p.x - drag.startX,
      dy = p.y - drag.startY;
    if (drag.type === "scroll") {
      const { maxScroll } = listMetrics(
        drag.node,
        drag.node.screen === "storage" ? preview.element : "Tất cả",
      );
      setPreview((prev) => ({
        ...prev,
        scroll: {
          ...prev.scroll,
          [drag.node.id]: clamp(drag.startScroll - dy, 0, maxScroll),
        },
      }));
      return;
    }
    if (Math.abs(dx) + Math.abs(dy) < 1 && !drag.changed) return;
    drag.changed = true;
    revision.current++;
    const patch =
      drag.type === "resize"
        ? {
            width: clamp(snapValue(drag.node.width + dx, snap), 8, 8192),
            height: clamp(snapValue(drag.node.height + dy, snap), 8, 8192),
          }
        : {
            x: clamp(snapValue(drag.node.x + dx, snap), -8192, 8192),
            y: clamp(snapValue(drag.node.y + dy, snap), -8192, 8192),
          };
    setHistory((h) => ({
      ...h,
      present: {
        ...h.present,
        nodes: h.present.nodes.map((n) =>
          n.id === drag.node.id ? { ...n, ...patch } : n,
        ),
      },
    }));
  }
  function pointerUp(event: ReactPointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (drag.changed)
      setHistory((h) => ({
        ...h,
        past: [...h.past, drag.startDoc].slice(-30),
        future: [],
      }));
  }
  function keyboard(event: KeyboardEvent<HTMLCanvasElement>) {
    if (mode !== "design") return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
      return;
    }
    if (
      !selected ||
      selected.locked ||
      !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
    )
      return;
    event.preventDefault();
    const step = event.shiftKey ? 10 : snap;
    patchNode(selected.id, {
      x: clamp(
        selected.x +
          (event.key === "ArrowRight"
            ? step
            : event.key === "ArrowLeft"
              ? -step
              : 0),
        -8192,
        8192,
      ),
      y: clamp(
        selected.y +
          (event.key === "ArrowDown"
            ? step
            : event.key === "ArrowUp"
              ? -step
              : 0),
        -8192,
        8192,
      ),
    });
  }
  function addNode(kind: NodeKind) {
    if (doc.nodes.length >= 300) {
      toast.error("Tối đa 300 layer.");
      return;
    }
    const node = createNode(kind, preview.screen);
    if (kind === "itemList") {
      node.width = 400;
      node.height = 250;
    }
    commit((current) => ({ ...current, nodes: [...current.nodes, node] }));
    setSelectedId(node.id);
    setInspectorTab("properties");
    setMode("design");
  }
  function assignAsset(id: string) {
    if (selected) {
      patchNode(selected.id, { assetId: id, crop: null });
      return;
    }
    if (doc.nodes.length >= 300) {
      toast.error("Tối đa 300 layer.");
      return;
    }
    const asset = doc.assets.find((a) => a.id === id);
    if (!asset) return;
    const node = {
      ...createNode("image", preview.screen),
      assetId: id,
      name: asset.name,
      width: Math.max(1, Math.round(asset.width / asset.resourceScale)),
      height: Math.max(1, Math.round(asset.height / asset.resourceScale)),
      renderMode: "contain" as const,
    };
    commit((current) => ({ ...current, nodes: [...current.nodes, node] }));
    setSelectedId(node.id);
    setInspectorTab("properties");
    setMode("design");
  }
  function removeAsset(id: string) {
    commit((current) => ({
      ...current,
      assets: current.assets.filter((a) => a.id !== id),
      nodes: current.nodes.map((n) => ({
        ...n,
        assetId: n.assetId === id ? null : n.assetId,
        crop: n.assetId === id ? null : n.crop,
        activeAssetId: n.activeAssetId === id ? null : n.activeAssetId,
        iconIds: n.iconIds.map((v) => (v === id ? null : v)),
        items: n.items.map((i) => ({
          ...i,
          assetId: i.assetId === id ? null : i.assetId,
        })),
      })),
    }));
  }
  async function uploadFiles(files: File[]) {
    if (!files.length || uploading) return;
    if (files.length + doc.assets.length > 200) {
      toast.error("Tối đa 200 res.");
      return;
    }
    const existingBytes = doc.assets.reduce(
      (sum, a) => sum + a.dataUrl.length * 0.75,
      0,
    );
    if (
      existingBytes + files.reduce((sum, f) => sum + f.size, 0) >
      MAX_RESOURCE_BYTES
    ) {
      toast.error("Tổng res tối đa 24 MB.");
      return;
    }
    setUploading(true);
    try {
      const assets: UiAsset[] = [];
      for (const file of files) assets.push(await readAsset(file, uploadScale));
      if (
        [...doc.assets, ...assets].reduce(
          (sum, a) => sum + a.width * a.height,
          0,
        ) > 67_108_864
      )
        throw new Error("Tổng res vượt 64 triệu pixel.");
      commit((current) => ({
        ...current,
        assets: [...current.assets, ...assets],
      }));
      toast.success("Đã thêm " + assets.length + " res.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setUploading(false);
    }
  }
  async function importFile(file: File) {
    if (file.size > 36 * 1024 * 1024) {
      toast.error("File JSON tối đa 36 MB.");
      return;
    }
    setExporting(true);
    try {
      const next = parseDocument(JSON.parse(await file.text()));
      await loadAssets(next.assets);
      commit(() => next);
      setSelectedId(null);
      setPreview(initialPreview);
      toast.success("Đã nhập layout và res.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setExporting(false);
    }
  }
  function exportJson() {
    downloadFile(
      new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" }),
      "ui-layout.json",
    );
  }
  async function exportPng() {
    setExporting(true);
    try {
      const assets = await loadAssets(doc.assets);
      await loadGameFonts();
      const canvas = document.createElement("canvas");
      canvas.width = doc.width;
      canvas.height = doc.height;
      paintDocument(canvas, doc, assets, preview);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Không xuất được PNG."))),
          "image/png",
        ),
      );
      downloadFile(blob, "ui-" + preview.screen + ".png");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setExporting(false);
    }
  }
  function reorderNode(id: string, delta: number) {
    commit((current) => {
      const nodes = [...current.nodes],
        index = nodes.findIndex((n) => n.id === id),
        target = index + delta;
      if (target < 0 || target >= nodes.length) return current;
      [nodes[index], nodes[target]] = [nodes[target], nodes[index]];
      return { ...current, nodes };
    });
  }
  function chooseNode(node: UiNode) {
    setSelectedId(node.id);
    setInspectorTab("properties");
    setMode("design");
    if (node.screen !== "all")
      setPreview((p) => ({
        ...p,
        screen: node.screen as PreviewState["screen"],
      }));
  }

  if (!ready) return <Skeleton active paragraph={{ rows: 10 }} />;
  const filteredAssets = doc.assets.filter((a) =>
    a.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-600">
            Ghép res, căn pixel và xem menu game ngay khi chỉnh.
          </p>
          <p className="mt-1 text-xs text-slate-500" role="status">
            {saveStatus}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Tooltip title="Hoàn tác (Ctrl+Z trên canvas)">
            <Button
              aria-label="Hoàn tác"
              icon={<Undo2 size={16} />}
              disabled={!history.past.length}
              onClick={undo}
            />
          </Tooltip>
          <Tooltip title="Làm lại">
            <Button
              aria-label="Làm lại"
              icon={<Redo2 size={16} />}
              disabled={!history.future.length}
              onClick={redo}
            />
          </Tooltip>
          <Button
            icon={<Save size={15} />}
            onClick={() => {
              const currentRevision = revision.current;
              saveQueue.current = saveQueue.current
                .catch(() => undefined)
                .then(() => saveDraft(doc));
              void saveQueue.current
                .then(() => {
                  if (currentRevision === revision.current) {
                    setSaveStatus("Đã lưu nháp tại máy");
                    setStorageError("");
                  }
                  toast.success("Đã lưu nháp.");
                })
                .catch((e) => {
                  setStorageError(errorMessage(e));
                  toast.error(errorMessage(e));
                });
            }}
          >
            Lưu nháp
          </Button>
          <Button
            icon={<FileUp size={15} />}
            disabled={exporting || uploading}
            onClick={() => importRef.current?.click()}
          >
            Nhập JSON
          </Button>
          <Button icon={<Download size={15} />} onClick={exportJson}>
            Xuất JSON
          </Button>
          <Button
            type="primary"
            icon={<ImagePlus size={15} />}
            loading={exporting}
            onClick={() => void exportPng()}
          >
            Xuất PNG
          </Button>
        </div>
      </div>
      {storageError && <Alert type="warning" showIcon message={storageError} />}
      {(fontError || renderError) && (
        <Alert type="error" showIcon message={fontError || renderError} />
      )}
      <input
        ref={uploadRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          void uploadFiles(files);
        }}
      />
      <input
        ref={importRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void importFile(file);
        }}
      />
      <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[200px_minmax(0,1fr)_280px]">
        <section className={panelClass + " p-4"} aria-label="Thư viện res">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">
            Thư viện res{" "}
            <span className="font-normal text-slate-400">
              ({doc.assets.length})
            </span>
          </h2>
          <Select
            aria-label="Scale res upload"
            className="mb-2 w-full"
            value={uploadScale}
            options={[1, 2, 3, 4].map((s) => ({
              value: s,
              label: "Res x" + s,
            }))}
            onChange={setUploadScale}
          />
          <Button
            block
            type="primary"
            icon={<Plus size={15} />}
            loading={uploading}
            onClick={() => uploadRef.current?.click()}
          >
            Upload res
          </Button>
          <p className="mb-3 mt-2 text-xs leading-5 text-slate-500">
            PNG/JPG/WEBP, tối đa 4 MB/ảnh. Chọn nhiều file cùng lúc.
          </p>
          <Input.Search
            aria-label="Tìm res"
            placeholder="Tìm tên res…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-3"
          />
          <div className="max-h-[600px] space-y-3 overflow-y-auto">
            {!filteredAssets.length && (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  doc.assets.length
                    ? "Không tìm thấy res"
                    : "Upload res để bắt đầu"
                }
              />
            )}
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="rounded-lg border border-slate-200 p-2"
              >
                <button
                  type="button"
                  aria-label={"Gán res " + asset.name}
                  onClick={() => assignAsset(asset.id)}
                  className="block w-full text-left"
                >
                  <div
                    className="mb-2 flex h-20 items-center justify-center rounded bg-slate-100"
                    style={{
                      backgroundImage:
                        "conic-gradient(#e2e8f0 25%, #f8fafc 0 50%, #e2e8f0 0 75%, #f8fafc 0)",
                      backgroundSize: "16px 16px",
                    }}
                  >
                    <img
                      src={asset.dataUrl}
                      alt={asset.name}
                      className="max-h-full max-w-full object-contain"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </div>
                  <div
                    className="truncate text-xs font-semibold text-slate-700"
                    title={asset.name}
                  >
                    {asset.name}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {asset.width} × {asset.height}px · Nhấn để gán
                  </div>
                </button>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <Select
                    size="small"
                    aria-label={"Scale " + asset.name}
                    value={asset.resourceScale}
                    options={[1, 2, 3, 4].map((s) => ({
                      value: s,
                      label: "x" + s,
                    }))}
                    onChange={(resourceScale) =>
                      commit((current) => ({
                        ...current,
                        assets: current.assets.map((a) =>
                          a.id === asset.id ? { ...a, resourceScale } : a,
                        ),
                      }))
                    }
                  />
                  <Popconfirm
                    title="Xóa res và bỏ các liên kết của res này?"
                    onConfirm={() => removeAsset(asset.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                  >
                    <Button
                      size="small"
                      type="text"
                      danger
                      aria-label={"Xóa res " + asset.name}
                      icon={<Trash2 size={14} />}
                    />
                  </Popconfirm>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section
          className={panelClass + " min-w-0 overflow-hidden"}
          aria-label="Canvas thiết kế"
        >
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3">
            <Segmented
              aria-label="Chế độ canvas"
              value={mode}
              onChange={(value) => setMode(value as "design" | "preview")}
              options={[
                { value: "design", label: "Thiết kế" },
                { value: "preview", label: "Preview" },
              ]}
            />
            <Select
              aria-label="Màn hình preview"
              className="min-w-[150px] flex-1"
              value={preview.screen}
              options={[...SCREENS]}
              onChange={(screen) =>
                setPreview((p) => ({ ...p, screen, scroll: {} }))
              }
            />
            <Select
              aria-label="Zoom canvas"
              value={zoom}
              options={[
                { value: "fit", label: "Vừa khung" },
                { value: "1", label: "100%" },
                { value: "1.5", label: "150%" },
                { value: "2", label: "200%" },
              ]}
              onChange={setZoom}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-3 py-2 text-xs text-slate-500">
            <label className="flex items-center gap-2">
              <Switch
                size="small"
                checked={grid}
                onChange={setGrid}
                disabled={mode === "preview"}
              />
              Lưới
            </label>
            <Select
              size="small"
              aria-label="Snap pixel"
              value={snap}
              disabled={mode === "preview"}
              options={[1, 4, 8, 16].map((s) => ({
                value: s,
                label: "Snap " + s + "px",
              }))}
              onChange={setSnap}
            />
            {preview.screen === "storage" && (
              <Select
                size="small"
                aria-label="Filter hệ"
                value={preview.element}
                options={ELEMENTS.map((e) => ({ value: e, label: e }))}
                onChange={(element) =>
                  setPreview((p) => ({ ...p, element, scroll: {} }))
                }
              />
            )}
            <span className="ml-auto font-mono">
              {doc.width} × {doc.height}
            </span>
          </div>
          <div
            ref={viewportRef}
            className="max-h-[640px] min-h-[240px] overflow-auto bg-slate-200/70 p-3"
          >
            <div className="flex min-h-[320px] w-max min-w-full items-center justify-center">
              <canvas
                ref={canvasRef}
                width={doc.width}
                height={doc.height}
                tabIndex={0}
                aria-label="Preview menu game. Thiết kế: kéo để di chuyển, kéo góc dưới phải để đổi kích thước. Preview: nhấn tab hoặc cuộn danh sách."
                style={{
                  width: doc.width * Math.max(0.1, scale),
                  height: doc.height * Math.max(0.1, scale),
                  touchAction: "none",
                  imageRendering: "pixelated",
                  cursor: mode === "design" ? "move" : "default",
                }}
                className="block shrink-0 max-w-none shadow-md outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                onPointerDown={pointerDown}
                onPointerMove={pointerMove}
                onPointerUp={pointerUp}
                onPointerCancel={pointerUp}
                onLostPointerCapture={pointerUp}
                onKeyDown={keyboard}
              />
            </div>
          </div>
          <p className="border-t border-slate-200 px-3 py-2 text-xs leading-5 text-slate-500">
            {mode === "design"
              ? "Kéo để di chuyển. Góc dưới phải đổi kích thước. Phím mũi tên căn pixel; Shift di chuyển 10px."
              : "Nhấn tab để chuyển màn hình/lọc hệ. Lăn chuột hoặc kéo danh sách để cuộn."}
          </p>
          <div className="border-t border-slate-100 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">
              Canvas & mẫu
            </h3>
            <Input
              aria-label="Tên menu"
              maxLength={200}
              value={doc.name}
              onChange={(e) =>
                commit((current) => ({ ...current, name: e.target.value }))
              }
              className="mb-3"
            />
            <div className="grid grid-cols-2 gap-x-3">
              <NumberField
                label="Rộng canvas"
                value={doc.width}
                min={160}
                max={4096}
                onChange={(width) =>
                  commit((current) => ({ ...current, width }))
                }
              />
              <NumberField
                label="Cao canvas"
                value={doc.height}
                min={120}
                max={4096}
                onChange={(height) =>
                  commit((current) => ({ ...current, height }))
                }
              />
            </div>
            <ColorField
              label="Màu canvas"
              value={doc.background}
              onChange={(background) =>
                commit((current) => ({ ...current, background }))
              }
            />
            <div className="flex flex-wrap gap-2">
              <Popconfirm
                title="Thay bố cục bằng mẫu Thẻ Ác Quỷ?"
                description="Res đã upload được giữ lại. Có thể hoàn tác."
                okText="Dùng mẫu"
                cancelText="Hủy"
                onConfirm={() => {
                  commit((current) => ({
                    ...createDevilCardPreset(),
                    assets: current.assets,
                  }));
                  setSelectedId(null);
                  setPreview(initialPreview);
                }}
              >
                <Button size="small">Mẫu Thẻ Ác Quỷ</Button>
              </Popconfirm>
              <Popconfirm
                title="Xóa bố cục để tạo menu mới?"
                description="Res đã upload được giữ lại. Có thể hoàn tác."
                okText="Tạo mới"
                cancelText="Hủy"
                onConfirm={() => {
                  commit((current) => ({
                    ...current,
                    name: "Menu mới",
                    nodes: [],
                  }));
                  setSelectedId(null);
                  setPreview(initialPreview);
                }}
              >
                <Button size="small">Canvas trống</Button>
              </Popconfirm>
            </div>
          </div>
        </section>
        <section
          className={panelClass + " min-w-0 p-4"}
          aria-label="Thuộc tính và layer"
        >
          <Select<NodeKind | null>
            aria-label="Thêm thành phần"
            className="mb-3 w-full"
            placeholder="＋ Thêm thành phần"
            value={null}
            options={Object.entries(KIND_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
            onChange={(kind) => {
              if (kind) addNode(kind);
            }}
          />
          <Tabs
            activeKey={inspectorTab}
            onChange={setInspectorTab}
            size="small"
            items={[
              {
                key: "properties",
                label: "Thuộc tính",
                children: selected ? (
                  <>
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {KIND_LABELS[selected.kind]}
                      </span>
                      <div className="flex gap-1">
                        <Tooltip title="Nhân bản layer">
                          <Button
                            size="small"
                            type="text"
                            aria-label="Nhân bản layer"
                            icon={<Copy size={14} />}
                            disabled={doc.nodes.length >= 300}
                            onClick={() => {
                              const clone = {
                                ...selected,
                                id: newId(),
                                name: (selected.name + " (copy)").slice(0, 200),
                                x: clamp(selected.x + 12, -8192, 8192),
                                y: clamp(selected.y + 12, -8192, 8192),
                                items: selected.items.map((i) => ({
                                  ...i,
                                  id: newId(),
                                })),
                              };
                              commit((current) => ({
                                ...current,
                                nodes: [...current.nodes, clone],
                              }));
                              setSelectedId(clone.id);
                            }}
                          />
                        </Tooltip>
                        <Popconfirm
                          title="Xóa layer này?"
                          okText="Xóa"
                          cancelText="Hủy"
                          onConfirm={() => {
                            commit((current) => ({
                              ...current,
                              nodes: current.nodes.filter(
                                (n) => n.id !== selected.id,
                              ),
                            }));
                            setSelectedId(null);
                          }}
                        >
                          <Button
                            size="small"
                            type="text"
                            danger
                            aria-label="Xóa layer"
                            icon={<Trash2 size={14} />}
                          />
                        </Popconfirm>
                      </div>
                    </div>
                    <NodeInspector
                      doc={doc}
                      node={selected}
                      onPatch={(patch) => patchNode(selected.id, patch)}
                    />
                  </>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Chọn layer trên canvas hoặc trong danh sách."
                  />
                ),
              },
              {
                key: "layers",
                label: (
                  <span className="flex items-center gap-1">
                    <Layers3 size={13} />
                    Layers
                  </span>
                ),
                children: (
                  <div>
                    <p className="mb-3 text-xs text-slate-500">
                      Layer trên danh sách nằm trước khi vẽ.
                    </p>
                    {!doc.nodes.length && (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Chưa có layer"
                      />
                    )}
                    <div className="max-h-[620px] space-y-1 overflow-y-auto">
                      {[...doc.nodes].reverse().map((node, i) => (
                        <div
                          key={node.id}
                          className={
                            "rounded-lg border p-2 " +
                            (selectedId === node.id
                              ? "border-amber-400 bg-amber-50"
                              : "border-slate-100")
                          }
                        >
                          <button
                            type="button"
                            className="mb-1 w-full truncate text-left text-xs font-semibold text-slate-700"
                            onClick={() => chooseNode(node)}
                            title={node.name}
                          >
                            {node.name}
                          </button>
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate text-[10px] text-slate-400">
                              {node.screen === "all"
                                ? "Tất cả"
                                : SCREENS.find((s) => s.value === node.screen)
                                    ?.label}
                            </span>
                            <div className="flex">
                              <Button
                                size="small"
                                type="text"
                                aria-label={
                                  node.hidden ? "Hiện layer" : "Ẩn layer"
                                }
                                icon={
                                  node.hidden ? (
                                    <EyeOff size={12} />
                                  ) : (
                                    <Eye size={12} />
                                  )
                                }
                                onClick={() =>
                                  patchNode(node.id, { hidden: !node.hidden })
                                }
                              />
                              <Button
                                size="small"
                                type="text"
                                aria-label={
                                  node.locked ? "Mở khóa layer" : "Khóa layer"
                                }
                                icon={
                                  node.locked ? (
                                    <LockKeyhole size={12} />
                                  ) : (
                                    <UnlockKeyhole size={12} />
                                  )
                                }
                                onClick={() =>
                                  patchNode(node.id, { locked: !node.locked })
                                }
                              />
                              <Button
                                size="small"
                                type="text"
                                aria-label="Đưa layer lên"
                                disabled={i === 0}
                                onClick={() => reorderNode(node.id, 1)}
                              >
                                ↑
                              </Button>
                              <Button
                                size="small"
                                type="text"
                                aria-label="Đưa layer xuống"
                                disabled={i === doc.nodes.length - 1}
                                onClick={() => reorderNode(node.id, -1)}
                              >
                                ↓
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </section>
      </div>
    </div>
  );
}
