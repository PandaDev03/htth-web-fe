import { parseDocument, type UiDocument } from "./uiComposer";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("htth-ui-composer", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Không mở được nơi lưu nháp."));
    request.onblocked = () =>
      reject(new Error("Nơi lưu nháp bị chặn bởi tab khác."));
  });
}
export async function loadDraft(): Promise<UiDocument | null> {
  const db = await openDatabase();
  try {
    const value = await new Promise<unknown>((resolve, reject) => {
      const request = db
        .transaction("drafts", "readonly")
        .objectStore("drafts")
        .get("current");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return value ? parseDocument(value) : null;
  } finally {
    db.close();
  }
}
export async function saveDraft(doc: UiDocument): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("drafts", "readwrite");
      tx.objectStore("drafts").put(doc, "current");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error("Lưu nháp bị hủy."));
    });
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
