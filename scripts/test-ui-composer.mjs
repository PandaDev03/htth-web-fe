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
const blank = model.createEmptyDocument();
const preset = { ...blank, screens: [{ id: "inventory", name: "Túi đồ" }, { id: "craft", name: "Chế tạo" }], nodes: [model.createNode("panel")] };
const asset = { id: "asset", name: "frame.png", dataUrl: "data:image/png;base64,iVBORw0KGgo=", width: 144, height: 144, resourceScale: 4 };
check("new Menu has no sample or fixed screens; custom screens round-trip", () => {
  assert.deepEqual(blank.screens, []);
  assert.deepEqual(blank.nodes, []);
  const tabs = { ...model.createNode("tabs"), action: "screen", labels: ["Trang 1", "Trang 2"], screenTargets: ["craft", "inventory"] };
  const doc = { ...preset, nodes: [...preset.nodes, tabs, model.createNode("text", "inventory")] };
  assert.deepEqual(model.parseDocument(JSON.parse(JSON.stringify(doc))), doc);
  assert.equal(model.visibleNodes(doc,"inventory").length, 3);
  assert.equal(model.visibleNodes(doc,"all").length, 2);
});
check("layout-only JSON preserves res IDs, crops, tab icons, item refs and scale on upload", () => {
  const node = { ...model.createNode("tabs"), assetId: asset.id, activeAssetId: asset.id, iconIds: [asset.id], crop: {x:12,y:16,width:80,height:80}, items: [{id:"item",name:"Vật phẩm",element:"Zoan",level:3,assetId:asset.id}] };
  const doc = { ...preset, assets: [asset], nodes: [node] };
  const layout = model.exportDocument(doc);
  assert.equal(layout.assets[0].dataUrl,null);
  assert.deepEqual(layout.nodes,doc.nodes);
  assert.deepEqual(model.parseDocument(JSON.parse(JSON.stringify(layout))),layout);
  assert.deepEqual(model.exportDocument(doc,true),doc);
  const restored = { ...layout, assets: model.mergeUploadedAssets(layout.assets,[{...asset,id:"new-upload",resourceScale:1}]) };
  assert.deepEqual(model.parseDocument(restored),doc);
  const duplicates = model.mergeUploadedAssets([{...asset,id:"copy",dataUrl:null},asset],[{...asset,id:"upload"}]);
  assert.deepEqual(duplicates.map(a=>a.id),["copy","asset"]);
  assert(duplicates.every(a=>a.dataUrl===asset.dataUrl));
});
check("legacy v1 JSON retains its used screens and tab targets", () => {
  const legacy = { ...preset, version:1, nodes: [model.createNode("image","storage"),{...model.createNode("tabs"),action:"screen",labels:["A","B","C","D"]}] };
  delete legacy.id;delete legacy.screens;
  legacy.nodes.forEach(n=>delete n.screenTargets);
  const result = model.parseDocument(legacy);
  assert.equal(result.version,2);
  assert.deepEqual(result.screens.map(s=>s.id),["storage","craft","skills","upgrade"]);
  assert.deepEqual(result.nodes[1].screenTargets,result.screens.map(s=>s.id));
  assert.deepEqual(model.parseDocument(result),result);
  const emptyLegacy={...blank,version:1};delete emptyLegacy.id;delete emptyLegacy.screens;
  assert.deepEqual(model.parseDocument(emptyLegacy).screens,[]);
});
check("add/rename/remove screens preserves layers and clears deleted tab destinations", () => {
  let doc = model.addMenuScreen(blank,"Túi đồ");
  const id = doc.screens[0].id;
  const node = model.createNode("image",id);
  const tabs = {...model.createNode("tabs"),action:"screen",labels:["Túi"],screenTargets:[id]};
  doc={...doc,nodes:[node,tabs]};
  assert.throws(()=>model.addMenuScreen(doc,"Túi đồ"));
  assert.throws(()=>model.addMenuScreen(doc," "));
  doc=model.renameMenuScreen(doc,id,"Kho đồ");
  assert.equal(doc.nodes[0].screen,id);
  assert.equal(doc.nodes[1].screenTargets[0],id);
  assert.equal(doc.screens[0].name,"Kho đồ");
  doc=model.removeMenuScreen(doc,id);
  assert.equal(doc.nodes[0].screen,"all");
  assert.deepEqual(doc.nodes[1].screenTargets,[null]);
  assert.deepEqual(model.parseDocument(doc),doc);
});
check("reject invalid schema, geometry, duplicate IDs and dangling screens/res", () => {
  assert.throws(()=>model.parseDocument({...preset,version:3}));
  assert.throws(()=>model.parseDocument({...preset,id:""}));
  assert.throws(()=>model.parseDocument({...preset,width:Infinity}));
  assert.throws(()=>model.parseDocument({...preset,nodes:[preset.nodes[0],preset.nodes[0]]}));
  assert.throws(()=>model.parseDocument({...preset,nodes:[{...preset.nodes[0],kind:"__proto__"}]}));
  assert.throws(()=>model.parseDocument({...preset,nodes:[{...preset.nodes[0],x:NaN}]}));
  assert.throws(()=>model.parseDocument({...preset,nodes:[{...preset.nodes[0],assetId:"missing"}]}));
  assert.throws(()=>model.parseDocument({...preset,nodes:[{...preset.nodes[0],screen:"missing"}]}));
  assert.throws(()=>model.parseDocument({...preset,screens:[{id:"all",name:"Shared"}]}));
  assert.throws(()=>model.parseDocument({...preset,screens:[preset.screens[0],preset.screens[0]]}));
  assert.throws(()=>model.parseDocument({...preset,nodes:[{...model.createNode("tabs"),action:"screen",screenTargets:["missing",null]}]}));
});
check("reject non-raster payloads and excessive pixels; accept manifest without image bytes", () => {
  assert.equal(model.parseDocument({...preset,assets:[asset]}).assets[0].resourceScale,4);
  assert.equal(model.parseDocument({...preset,assets:[{...asset,dataUrl:null}]}).assets[0].dataUrl,null);
  assert.throws(()=>model.parseDocument({...preset,assets:[{...asset,dataUrl:"data:image/svg+xml;base64,AA=="}]}));
  assert.throws(()=>model.parseDocument({...preset,assets:[{...asset,width:8192,height:8192}]}));
});
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
  assert.equal(model.hitTest(doc, "inventory", 50, 50).id, top.id);
  assert.equal(
    model.hitTest(
      { ...doc, nodes: [bottom, { ...top, hidden: true }] },
      "inventory",
      50,
      50,
    ).id,
    bottom.id,
  );
  assert.equal(
    model.hitTest(
      { ...doc, nodes: [bottom, { ...top, locked: true }] },
      "inventory",
      50,
      50,
      true,
    ).id,
    bottom.id,
  );
  assert.equal(
    model.hitTest(
      { ...doc, nodes: [bottom, { ...top, screen: "craft" }] },
      "inventory",
      50,
      50,
    ).id,
    bottom.id,
  );
  assert.equal(model.hitTest(doc, "inventory", 100, 100), undefined);
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
