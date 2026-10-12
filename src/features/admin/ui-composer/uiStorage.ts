import { parseDocument, type UiDocument } from "./uiComposer";

export type SavedMenu = { id: string; name: string; updatedAt: number };

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("htth-ui-composer", 2);
    let blocked = false;
    request.onupgradeneeded = () => {
      for (const store of ["drafts", "menus"]) {
        if (!request.result.objectStoreNames.contains(store))
          request.result.createObjectStore(store);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      if (blocked) {
        db.close();
        return;
      }
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () =>
      reject(request.error ?? new Error("Không mở được nơi lưu Menu."));
    request.onblocked = () => {
      blocked = true;
      reject(new Error("Nơi lưu Menu bị chặn; đóng các tab Ghép UI khác rồi thử lại."));
    };
  });
}

async function readValue(store: string, id: string): Promise<unknown> {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction(store, "readonly").objectStore(store).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

async function writeValue(store: string, id: string, value: unknown): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(store, "readwrite");
      tx.objectStore(store).put(value, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error("Lưu Menu bị hủy."));
    });
  } finally {
    db.close();
  }
}

export async function loadDraft(): Promise<UiDocument | null> {
  const value = await readValue("drafts", "current");
  return value ? parseDocument(value) : null;
}

export async function saveDraft(doc: UiDocument): Promise<void> {
  await writeValue("drafts", "current", doc);
}

export async function saveMenu(doc: UiDocument): Promise<void> {
  const checked = parseDocument(doc);
  if (!checked.name.trim()) throw new Error("Nhập tên Menu trước khi lưu.");
  await writeValue("menus", checked.id, {
    id: checked.id,
    name: checked.name,
    updatedAt: Date.now(),
    document: checked,
  });
}

export async function loadMenu(id: string): Promise<UiDocument> {
  const value = await readValue("menus", id);
  if (!value || typeof value !== "object" || !("document" in value))
    throw new Error("Menu đã lưu không còn tồn tại.");
  return parseDocument(value.document);
}

export async function listSavedMenus(): Promise<SavedMenu[]> {
  const db = await openDatabase();
  try {
    const values = await new Promise<SavedMenu[]>((resolve, reject) => {
      const items: SavedMenu[] = [];
      const request = db.transaction("menus", "readonly").objectStore("menus").openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          resolve(items);
          return;
        }
        const value = cursor.value;
        if (
          value && typeof value.id === "string" &&
          typeof value.name === "string" && typeof value.updatedAt === "number"
        ) items.push({ id: value.id, name: value.name, updatedAt: value.updatedAt });
        cursor.continue();
      };
      request.onerror = () => reject(request.error);
    });
    return values.sort((a, b) => b.updatedAt - a.updatedAt);
  } finally {
    db.close();
  }
}

export function downloadFile(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
