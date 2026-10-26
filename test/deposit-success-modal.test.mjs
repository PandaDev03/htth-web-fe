import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Run the real page's event/mutation callbacks with API, hooks and modal ports
// replaced. No DOM, network calls, payment credentials or new test dependencies.
const source = readFileSync(
  new URL("../src/features/deposit/pages/DepositPage.tsx", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

function mountPointsPage() {
  let auth = {
    serverId: "server1",
    user: { id: 1, username: "admin" },
    refreshToken: "test-refresh",
  };
  const mutations = [];
  const effects = [];
  const listeners = new Set();
  const timers = new Map();
  const success = [];
  const errors = [];
  const toasts = [];
  const invalidations = [];
  const dispatches = [];
  let refreshes = 0;
  let nextTimer = 1;
  const jsx = (type, props, key) => ({ type, props, key });
  const modal = (target) => (options) => {
    const handle = { destroy: () => options.afterClose?.(), options };
    target.push(handle);
    return handle;
  };
  const mocks = {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    react: {
      useRef: (current) => ({ current }),
      useState: (value) => [value, () => {}],
      useEffect: (effect) => effects.push(effect),
    },
    "@tanstack/react-query": {
      useQuery: () => ({
        data: {
          enabled: true,
          multiplier: 1,
          minAmount: 1000,
          maxAmount: 2000000,
        },
      }),
      useQueryClient: () => ({
        invalidateQueries: async ({ queryKey }) => invalidations.push(queryKey),
      }),
      useMutation: (options) => {
        const mutation = {
          options,
          variables: null,
          reset: () => {},
          mutate: (variables) => {
            mutation.variables = variables;
          },
        };
        mutations.push(mutation);
        return mutation;
      },
    },
    antd: {
      App: {
        useApp: () => ({
          modal: { success: modal(success), error: modal(errors) },
        }),
      },
    },
    "lucide-react": new Proxy({}, { get: () => () => null }),
    "react-router-dom": { Link: "Link" },
    sonner: {
      toast: { success: (message) => toasts.push(message), warning: () => {} },
    },
    "@/app/store/hooks": {
      useAppDispatch: () => (action) => dispatches.push(action),
      useAppSelector: (selector) => selector({ auth }),
    },
    "@/app/store/store": {
      store: {
        getState: () => ({ auth }),
        subscribe: (callback) => {
          listeners.add(callback);
          return () => listeners.delete(callback);
        },
      },
    },
    "@/features/auth/api/authApi": {
      refreshSession: async () => {
        refreshes += 1;
        return auth;
      },
    },
    "@/features/auth/model/authSlice": {
      setCredentials: (payload) => ({ type: "auth/setCredentials", payload }),
    },
    "@/shared/config/path": { PATH: {} },
    "@/features/deposit/api/payosApi": {},
    "@/shared/components/site/Header": { Header: "Header" },
    "@/shared/components/site/Footer": { Footer: "Footer" },
    "@/shared/utils/utils": { scrollToTop: () => {} },
  };
  const module = { exports: {} };
  runInNewContext(compiled, {
    module,
    exports: module.exports,
    require: (name) => {
      assert.ok(name in mocks, `Unexpected page dependency: ${name}`);
      return mocks[name];
    },
    window: {
      setTimeout: (callback, delay) => {
        const id = nextTimer++;
        timers.set(id, { callback, delay });
        return id;
      },
      clearTimeout: (id) => timers.delete(id),
    },
  });
  const tree = module.exports.default();
  const cleanups = effects
    .map((effect) => effect())
    .filter((value) => typeof value === "function");

  function find(node, predicate) {
    if (!node || typeof node !== "object") return null;
    if (Array.isArray(node))
      return node.map((child) => find(child, predicate)).find(Boolean);
    return predicate(node) ? node : find(node.props?.children, predicate);
  }
  function fireTimer(delay) {
    const entry = [...timers].find(([, timer]) => timer.delay === delay);
    assert.ok(entry, `Expected a ${delay}ms timer`);
    timers.delete(entry[0]);
    entry[1].callback();
  }
  function createOrder(orderCode, amount = 50000) {
    const preset = find(
      tree,
      (node) => node.type === "button" && Number(node.key) === amount,
    );
    assert.ok(preset && !preset.props.disabled);
    preset.props.onClick();
    fireTimer(900);
    const variables = mutations[0].variables;
    mutations[0].options.onSuccess(
      { message: "QR created", data: { order_code: orderCode, amount } },
      variables,
    );
    mutations[0].options.onSettled(null, null, variables);
    return { ...variables, orderCode, silent: false };
  }
  return {
    success,
    errors,
    toasts,
    invalidations,
    dispatches,
    createOrder,
    status: (variables, data) =>
      mutations[1].options.onSuccess(
        { message: "Payment result", data },
        variables,
      ),
    closeSuccess: () => success.at(-1)?.options.afterClose(),
    changeSession: (serverId) => {
      auth = { ...auth, serverId };
      listeners.forEach((listener) => listener());
    },
    unmount: () => cleanups.forEach((cleanup) => cleanup()),
    refreshCount: () => refreshes,
    pollScheduled: () =>
      [...timers.values()].some((timer) => timer.delay === 6000),
  };
}

test("pending and repeated queued responses open no success modal and keep polling", () => {
  const page = mountPointsPage();
  const order = page.createOrder("order-1");
  page.status(order, { paid: false, state: "pending" });
  page.status(order, { paid: false, state: "queued" });
  page.status(order, { paid: false, state: "queued" });
  assert.equal(page.success.length, 0);
  assert.equal(page.pollScheduled(), true);
});

test("queued then processed opens one success modal; closing it and duplicate responses cannot reopen it", async () => {
  const page = mountPointsPage();
  const order = page.createOrder("order-1");
  page.status(order, { paid: false, state: "queued" });
  page.status(order, { paid: true, state: "processed" });
  page.closeSuccess();
  page.status(order, { paid: true, state: "processed" });
  page.status(order, { paid: true, state: "duplicate" });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(page.success.length, 1);
  assert.equal(page.success[0].options.title, "Tích lũy Điểm thành công");
  assert.equal(page.pollScheduled(), false);
  assert.equal(page.invalidations.length, 2);
  assert.equal(page.refreshCount(), 1);
  assert.equal(page.dispatches.length, 1);
  assert.deepEqual(page.toasts, ["QR created"]);
});

test("an order already processed at the first poll also opens exactly one success modal", () => {
  const page = mountPointsPage();
  const order = page.createOrder("order-1");
  page.status(order, { paid: true, state: "processed" });
  page.status(order, { paid: true, state: "processed" });
  assert.equal(page.success.length, 1);
});

test("delivery failure with paid=true opens the support modal, not a success modal", () => {
  const page = mountPointsPage();
  const order = page.createOrder("order-1");
  page.status(order, { paid: true, state: "delivery_failed" });
  assert.equal(page.success.length, 0);
  assert.equal(page.errors.length, 1);
});

test("late paid response from a superseded QR cannot open a modal for the new order", () => {
  const page = mountPointsPage();
  const first = page.createOrder("order-1");
  const second = page.createOrder("order-2", 100000);
  page.status(first, { paid: true, state: "processed" });
  assert.equal(page.success.length, 0);
  page.status(second, { paid: true, state: "processed" });
  assert.equal(page.success.length, 1);
});

for (const change of ["server", "unmount"]) {
  test(`late paid response after ${change} change is ignored`, () => {
    const page = mountPointsPage();
    const order = page.createOrder("order-1");
    if (change === "server") page.changeSession("tan_binh");
    else page.unmount();
    page.status(order, { paid: true, state: "processed" });
    assert.equal(page.success.length, 0);
  });
}
