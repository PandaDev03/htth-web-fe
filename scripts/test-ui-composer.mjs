// Run without a production build: node scripts/test-ui-composer.mjs
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const sourceUrl = (text) =>
  "data:text/javascript;base64," + Buffer.from(text).toString("base64");
const compile = (source) =>
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
const modelUrl = sourceUrl(
  compile(
    await readFile(
      new URL(
        "../src/features/admin/ui-composer/uiComposer.ts",
        import.meta.url,
      ),
      "utf8",
    ),
  ),
);
const model = await import(modelUrl);
const rendererSource = compile(
  await readFile(
    new URL("../src/features/admin/ui-composer/uiRenderer.ts", import.meta.url),
    "utf8",
  ),
).replace('"./uiComposer"', JSON.stringify(modelUrl));
const { nineSliceRegions } = await import(sourceUrl(rendererSource));
let checks = 0;
function check(name, fn) {
  fn();
  checks++;
  console.log("PASS " + name);
}
const preset = model.createDevilCardPreset();
check("preset JSON round-trip and all four screens", () => {
  const result = model.parseDocument(JSON.parse(JSON.stringify(preset)));
  assert.deepEqual(result, preset);
  for (const screen of model.SCREENS)
    assert(model.visibleNodes(result, screen.value).length > 5);
});
check(
  "reject unsupported schema, invalid geometry, duplicate IDs and unknown node kinds",
  () => {
    assert.throws(() => model.parseDocument({ ...preset, version: 2 }));
    assert.throws(() => model.parseDocument({ ...preset, width: Infinity }));
    assert.throws(() =>
      model.parseDocument({
        ...preset,
        nodes: [preset.nodes[0], preset.nodes[0]],
      }),
    );
    assert.throws(() =>
      model.parseDocument({
        ...preset,
        nodes: [{ ...preset.nodes[0], kind: "__proto__" }],
      }),
    );
    assert.throws(() =>
      model.parseDocument({
        ...preset,
        nodes: [{ ...preset.nodes[0], x: NaN }],
      }),
    );
  },
);
check(
  "reject missing resources, non-raster payloads and excessive decoded pixels",
  () => {
    assert.throws(() =>
      model.parseDocument({
        ...preset,
        nodes: [{ ...preset.nodes[0], assetId: "missing" }],
      }),
    );
    const asset = {
      id: "asset",
      name: "test.png",
      dataUrl: "data:image/png;base64,iVBORw0KGgo=",
      width: 32,
      height: 32,
      resourceScale: 4,
    };
    assert.equal(
      model.parseDocument({ ...preset, assets: [asset] }).assets[0]
        .resourceScale,
      4,
    );
    assert.throws(() =>
      model.parseDocument({
        ...preset,
        assets: [{ ...asset, dataUrl: "data:image/svg+xml;base64,AA==" }],
      }),
    );
    assert.throws(() =>
      model.parseDocument({
        ...preset,
        assets: [{ ...asset, width: 8192, height: 8192 }],
      }),
    );
  },
);
check("hit-test respects paint order, screen, hidden layers and locks", () => {
  const bottom = {
    ...model.createNode("panel"),
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  };
  const top = {
    ...model.createNode("button"),
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  };
  const doc = { ...preset, nodes: [bottom, top] };
  assert.equal(model.hitTest(doc, "storage", 50, 50).id, top.id);
  assert.equal(
    model.hitTest(
      { ...doc, nodes: [bottom, { ...top, hidden: true }] },
      "storage",
      50,
      50,
    ).id,
    bottom.id,
  );
  assert.equal(
    model.hitTest(
      { ...doc, nodes: [bottom, { ...top, locked: true }] },
      "storage",
      50,
      50,
      true,
    ).id,
    bottom.id,
  );
  assert.equal(
    model.hitTest(
      { ...doc, nodes: [bottom, { ...top, screen: "craft" }] },
      "storage",
      50,
      50,
    ).id,
    bottom.id,
  );
  assert.equal(model.hitTest(doc, "storage", 100, 100), undefined);
});
check("tab hit-test ignores gaps and maps horizontal/vertical indices", () => {
  const node = {
    ...model.createNode("tabs"),
    x: 10,
    y: 10,
    width: 110,
    height: 110,
    gap: 10,
    labels: ["A", "B"],
  };
  assert.equal(model.tabIndexAt(node, 20, 20), 0);
  assert.equal(model.tabIndexAt(node, 64, 20), -1);
  assert.equal(model.tabIndexAt(node, 80, 20), 1);
  assert.equal(model.tabIndexAt({ ...node, direction: "vertical" }, 20, 80), 1);
});
check(
  "element filtering and scroll bounds support lists longer than a viewport",
  () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      id: String(i),
      name: "Card",
      element: i % 2 ? "Logia" : "Zoan",
      assetId: null,
      level: 1,
    }));
    const node = {
      ...model.createNode("itemList"),
      width: 500,
      height: 240,
      columns: 5,
      gap: 10,
      items,
    };
    const all = model.listMetrics(node, "Tất cả");
    assert.equal(all.items.length, 50);
    assert(all.maxScroll > 0);
    assert.equal(model.listMetrics(node, "Zoan").items.length, 25);
    assert.equal(model.listMetrics(node, "Paramecia").maxScroll, 0);
  },
);
check("9-slice x4 preserves corner size and fully covers target", () => {
  const source = { x: 12, y: 24, width: 64, height: 64 };
  const target = { x: 50, y: 60, width: 200, height: 100 };
  const regions = nineSliceRegions(
    source,
    { top: 16, right: 12, bottom: 8, left: 20 },
    4,
    target,
  );
  assert.equal(regions.length, 9);
  assert.deepEqual(regions[0].target, { x: 50, y: 60, width: 5, height: 4 });
  assert.equal(
    regions.reduce((sum, r) => sum + r.target.width * r.target.height, 0),
    target.width * target.height,
  );
  for (const r of regions) {
    assert(r.source.x >= source.x && r.source.y >= source.y);
    assert(r.source.x + r.source.width <= source.x + source.width);
    assert(r.target.x + r.target.width <= target.x + target.width);
  }
});
check(
  "9-slice small targets shrink edges without overlap or negative regions",
  () => {
    const target = { x: 0, y: 0, width: 2, height: 3 };
    const regions = nineSliceRegions(
      { x: 0, y: 0, width: 32, height: 32 },
      { top: 8, right: 8, bottom: 8, left: 8 },
      1,
      target,
    );
    assert.equal(regions.length, 4);
    assert.equal(
      regions.reduce((sum, r) => sum + r.target.width * r.target.height, 0),
      6,
    );
    assert(regions.every((r) => r.target.width > 0 && r.target.height > 0));
  },
);
check("9-slice with zero borders uses the entire crop as one region", () => {
  const source = { x: 3, y: 7, width: 12, height: 24 },
    target = { x: 10, y: 20, width: 120, height: 240 };
  assert.deepEqual(
    nineSliceRegions(
      source,
      { top: 0, right: 0, bottom: 0, left: 0 },
      4,
      target,
    ),
    [{ source, target }],
  );
});
console.log(checks + " checks passed.");
