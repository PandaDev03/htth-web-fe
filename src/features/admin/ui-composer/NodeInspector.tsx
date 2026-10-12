import { Button, Input, InputNumber, Select, Switch } from "antd";
import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import {
  ELEMENTS,
  newId,
  type Rect,
  type UiDocument,
  type UiItem,
  type UiNode,
} from "./uiComposer";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-3">
      <div className="mb-1 text-xs font-medium text-slate-600">{label}</div>
      {children}
    </div>
  );
}
export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 8192,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <Field label={label}>
      <InputNumber
        aria-label={label}
        className="!w-full"
        value={value}
        precision={0}
        min={min}
        max={max}
        onChange={(v) => {
          if (v !== null) onChange(Math.round(Math.max(min, Math.min(max, v))));
        }}
      />
    </Field>
  );
}
export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={label}
          value={value.slice(0, 7)}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-9 cursor-pointer border-0 bg-transparent p-0"
        />
        <span className="font-mono text-xs text-slate-500">{value}</span>
        <Button
          size="small"
          onClick={() =>
            onChange(value.length === 9 ? value.slice(0, 7) : value + "00")
          }
        >
          {value.length === 9 ? "Có màu" : "Trong suốt"}
        </Button>
      </div>
    </Field>
  );
}
export function NodeInspector({
  doc,
  node,
  onPatch,
  onAddScreen,
}: {
  doc: UiDocument;
  node: UiNode;
  onPatch: (patch: Partial<UiNode>) => void;
  onAddScreen: () => void;
}) {
  const options = [
    { value: "", label: "Chưa gán res" },
    ...doc.assets.map((asset) => ({
      value: asset.id,
      label: asset.name + (asset.dataUrl ? "" : " (chưa upload)"),
    })),
  ];
  const asset = doc.assets.find((a) => a.id === node.assetId);
  const assetSelect = (
    value: string | null,
    onChange: (id: string | null) => void,
    label: string,
  ) => (
    <Select
      aria-label={label}
      className="w-full"
      showSearch
      optionFilterProp="label"
      value={value ?? ""}
      options={options}
      onChange={(id) => onChange(id || null)}
    />
  );
  const patchCrop = (key: keyof Rect, value: number) =>
    node.crop && onPatch({ crop: { ...node.crop, [key]: value } });
  const patchItem = (id: string, patch: Partial<UiItem>) =>
    onPatch({
      items: node.items.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  const section = (label: string) => (
    <h3 className="mb-3 mt-5 border-t border-slate-100 pt-4 text-sm font-semibold text-slate-800">
      {label}
    </h3>
  );
  return (
    <div>
      <Field label="Tên layer">
        <Input
          aria-label="Tên layer"
          maxLength={200}
          value={node.name}
          onChange={(e) => onPatch({ name: e.target.value })}
        />
      </Field>
      <Field label="Hiện ở màn hình">
        <Select
          aria-label="Hiện ở màn hình"
          className="w-full"
          value={node.screen}
          options={[
            { value: "all", label: "Tất cả màn hình" },
            ...doc.screens.map((screen) => ({ value: screen.id, label: screen.name })),
          ]}
          onChange={(screen) => onPatch({ screen })}
        />
        <Button
          size="small"
          type="text"
          className="mt-1"
          icon={<Plus size={12} />}
          onClick={onAddScreen}
        >
          Thêm màn hình
        </Button>
      </Field>
      <div className="grid grid-cols-2 gap-x-3">
        <NumberField
          label="X (px)"
          value={node.x}
          min={-8192}
          onChange={(x) => onPatch({ x })}
        />
        <NumberField
          label="Y (px)"
          value={node.y}
          min={-8192}
          onChange={(y) => onPatch({ y })}
        />
        <NumberField
          label="Rộng (px)"
          value={node.width}
          min={1}
          onChange={(width) => onPatch({ width })}
        />
        <NumberField
          label="Cao (px)"
          value={node.height}
          min={1}
          onChange={(height) => onPatch({ height })}
        />
      </div>
      <div className="mb-4 flex justify-between gap-3 text-xs text-slate-600">
        <label className="flex items-center gap-2">
          <Switch
            size="small"
            checked={node.hidden}
            onChange={(hidden) => onPatch({ hidden })}
          />
          Ẩn
        </label>
        <label className="flex items-center gap-2">
          <Switch
            size="small"
            checked={node.locked}
            onChange={(locked) => onPatch({ locked })}
          />
          Khóa kéo
        </label>
      </div>
      {node.kind !== "text" && (
        <>
          {section(
            node.kind === "itemList" ? "Res khung slot" : "Res nền / ảnh",
          )}
          <Field label="Ảnh">
            {assetSelect(
              node.assetId,
              (assetId) => onPatch({ assetId, crop: null }),
              "Ảnh layer",
            )}
          </Field>
          {(node.kind === "tabs" || node.kind === "button") && (
            <Field label="Ảnh khi chọn">
              {assetSelect(
                node.activeAssetId,
                (activeAssetId) => onPatch({ activeAssetId }),
                "Ảnh khi chọn",
              )}
            </Field>
          )}
          <Field label="Cách ghép">
            <Select
              aria-label="Cách ghép"
              className="w-full"
              value={node.renderMode}
              onChange={(renderMode) => onPatch({ renderMode })}
              options={[
                { value: "stretch", label: "Stretch: kéo giãn" },
                { value: "contain", label: "Contain: giữ tỷ lệ" },
                { value: "tile", label: "Tile: lặp ảnh nhỏ" },
                { value: "nineSlice", label: "9-slice: giữ góc" },
              ]}
            />
          </Field>
          <ColorField
            label="Màu nền dự phòng"
            value={node.background}
            onChange={(background) => onPatch({ background })}
          />
          {node.renderMode === "nineSlice" && (
            <>
              <p className="mb-2 text-xs text-slate-500">
                Biên tính bằng pixel ảnh gốc. Res x4: biên 32px hiển thị 8px.
              </p>
              <div className="grid grid-cols-2 gap-x-3">
                {(["top", "right", "bottom", "left"] as const).map((key, i) => (
                  <NumberField
                    key={key}
                    label={
                      ["Biên trên", "Biên phải", "Biên dưới", "Biên trái"][i]
                    }
                    value={node.slice[key]}
                    max={4096}
                    onChange={(v) =>
                      onPatch({ slice: { ...node.slice, [key]: v } })
                    }
                  />
                ))}
              </div>
            </>
          )}
          <label className="mb-3 flex items-center justify-between text-xs text-slate-600">
            Crop spritesheet (px ảnh)
            <Switch
              size="small"
              disabled={!asset}
              checked={!!node.crop}
              onChange={(enabled) =>
                onPatch({
                  crop:
                    enabled && asset
                      ? { x: 0, y: 0, width: asset.width, height: asset.height }
                      : null,
                })
              }
            />
          </label>
          {node.crop && (
            <div className="grid grid-cols-2 gap-x-3">
              <NumberField
                label="Crop X"
                value={node.crop.x}
                onChange={(v) => patchCrop("x", v)}
              />
              <NumberField
                label="Crop Y"
                value={node.crop.y}
                onChange={(v) => patchCrop("y", v)}
              />
              <NumberField
                label="Crop rộng"
                value={node.crop.width}
                min={1}
                onChange={(v) => patchCrop("width", v)}
              />
              <NumberField
                label="Crop cao"
                value={node.crop.height}
                min={1}
                onChange={(v) => patchCrop("height", v)}
              />
            </div>
          )}
        </>
      )}
      {["text", "button", "tabs", "itemList"].includes(node.kind) && (
        <>
          {section("Chữ")}
          {(node.kind === "text" || node.kind === "button") && (
            <Field label="Nội dung">
              <Input.TextArea
                aria-label="Nội dung"
                maxLength={4000}
                rows={3}
                value={node.text}
                onChange={(e) => onPatch({ text: e.target.value })}
              />
            </Field>
          )}
          <NumberField
            label="Cỡ chữ"
            value={node.fontSize}
            min={6}
            max={128}
            onChange={(fontSize) => onPatch({ fontSize })}
          />
          <ColorField
            label="Màu chữ"
            value={node.color}
            onChange={(color) => onPatch({ color })}
          />
        </>
      )}
      {node.kind === "tabs" && (
        <>
          {section("Nhóm tab")}
          <Field label="Hướng">
            <Select
              aria-label="Hướng tab"
              className="w-full"
              value={node.direction}
              options={[
                { value: "vertical", label: "Dọc" },
                { value: "horizontal", label: "Ngang" },
              ]}
              onChange={(direction) => onPatch({ direction })}
            />
          </Field>
          <Field label="Hành vi preview">
            <Select
              aria-label="Hành vi preview"
              className="w-full"
              value={node.action}
              options={[
                { value: "none", label: "Chỉ minh họa" },
                { value: "screen", label: "Chuyển màn hình", disabled: !doc.screens.length },
                { value: "element", label: "Lọc theo hệ" },
              ]}
              onChange={(action) =>
                onPatch({
                  action,
                  screenTargets: action === "screen"
                    ? doc.screens.slice(0, 12).map((screen) => screen.id)
                    : [],
                  labels:
                    action === "screen"
                      ? doc.screens.slice(0, 12).map((s) => s.name)
                      : action === "element"
                        ? [...ELEMENTS]
                        : node.labels,
                })
              }
            />
          </Field>
          <NumberField
            label="Khoảng cách tab"
            value={node.gap}
            max={64}
            onChange={(gap) => onPatch({ gap })}
          />
          <Field label="Tên tab (mỗi dòng một tên)">
            <Input.TextArea
              aria-label="Tên các tab"
              rows={4}
              maxLength={1200}
              value={node.labels.join("\n")}
              onChange={(e) => {
                const labels = e.target.value
                  .split("\n")
                  .slice(0, node.action === "element" ? ELEMENTS.length : 12)
                  .map((s) => s.slice(0, 100));
                if (node.action === "element")
                  while (labels.length < ELEMENTS.length) labels.push("");
                onPatch({
                  labels,
                  iconIds: node.iconIds.slice(0, labels.length),
                  screenTargets: node.action === "screen"
                    ? labels.map((_, index) => node.screenTargets[index] ?? null)
                    : [],
                });
              }}
            />
          </Field>
          {node.labels.map((label, i) => (
            <Field key={i} label={"Tab " + (i + 1) + ": " + label}>
              {node.action === "screen" && (
                <Select
                  aria-label={"Màn hình của tab " + (i + 1)}
                  className="mb-2 w-full"
                  value={node.screenTargets[i] ?? ""}
                  options={[
                    { value: "", label: "Không chuyển màn hình" },
                    ...doc.screens.map((screen) => ({ value: screen.id, label: screen.name })),
                  ]}
                  onChange={(id) => onPatch({
                    screenTargets: node.labels.map((_, index) =>
                      index === i ? (id || null) : (node.screenTargets[index] ?? null),
                    ),
                  })}
                />
              )}
              {assetSelect(
                node.iconIds[i] ?? null,
                (id) => {
                  const iconIds = node.labels.map((_, index) =>
                    index === i ? id : (node.iconIds[index] ?? null),
                  );
                  onPatch({ iconIds });
                },
                "tabIcon " + (i + 1),
              )}
            </Field>
          ))}
        </>
      )}
      {node.kind === "itemList" && (
        <>
          {section("Danh sách item")}
          <div className="grid grid-cols-2 gap-x-3">
            <NumberField
              label="Số cột"
              value={node.columns}
              min={1}
              max={12}
              onChange={(columns) => onPatch({ columns })}
            />
            <NumberField
              label="Gap item"
              value={node.gap}
              max={64}
              onChange={(gap) => onPatch({ gap })}
            />
          </div>
          <p className="mb-3 text-xs text-slate-500">
            Cuộn trong preview. Dùng tab lọc hệ để lọc danh sách item.
          </p>
          <Button
            block
            icon={<Plus size={14} />}
            disabled={node.items.length >= 500}
            onClick={() =>
              onPatch({
                items: [
                  ...node.items,
                  {
                    id: newId(),
                    name: "Item mới",
                    element: "Zoan",
                    assetId: null,
                    level: 1,
                  },
                ],
              })
            }
          >
            Thêm item
          </Button>
          <div className="mt-3 max-h-[420px] space-y-3 overflow-y-auto">
            {node.items.map((item, i) => (
              <div
                key={item.id}
                className="rounded-lg border border-slate-200 p-2"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs text-slate-400">{i + 1}</span>
                  <Input
                    size="small"
                    aria-label={"Tên item " + (i + 1)}
                    maxLength={100}
                    value={item.name}
                    onChange={(e) =>
                      patchItem(item.id, { name: e.target.value })
                    }
                  />
                  <Button
                    size="small"
                    type="text"
                    danger
                    aria-label="Xóa item"
                    icon={<Trash2 size={13} />}
                    onClick={() =>
                      onPatch({
                        items: node.items.filter((v) => v.id !== item.id),
                      })
                    }
                  />
                </div>
                {assetSelect(
                  item.assetId,
                  (assetId) => patchItem(item.id, { assetId }),
                  "Res item " + (i + 1),
                )}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Select
                    size="small"
                    aria-label={"Hệ item " + (i + 1)}
                    value={item.element}
                    options={ELEMENTS.slice(1).map((e) => ({
                      value: e,
                      label: e,
                    }))}
                    onChange={(element) => patchItem(item.id, { element })}
                  />
                  <InputNumber
                    size="small"
                    className="!w-full"
                    aria-label={"Cấp item " + (i + 1)}
                    min={1}
                    max={100}
                    precision={0}
                    value={item.level}
                    onChange={(v) =>
                      v !== null &&
                      patchItem(item.id, {
                        level: Math.round(Math.max(1, Math.min(100, v))),
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
