
export const SAVE_KEY = 'catcare.save.v1';
export const SAVE_VERSION = 1;

export function createSaveStore(storage, key = SAVE_KEY) {
  if (storage === undefined) {
    try { storage = globalThis.localStorage; }
    catch { /* Storage access can be restricted. */ }
  }
  return {
    load() {
      try {
        const raw = storage?.getItem(key);
        if (!raw) return null;
        const s = JSON.parse(raw);
        return s && s.version === SAVE_VERSION ? s : null;
      } catch { return null; }
    },
    save(state) {
      try { storage.setItem(key, JSON.stringify({ ...state, version: SAVE_VERSION, savedAt: Date.now() })); return true; }
      catch { return false; }
    },
    clear() { try { storage?.removeItem(key); } catch { /* Ignore unavailable storage. */ } },
  };
}
