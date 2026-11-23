
const bundle = () => globalThis.__CATCARE_BUNDLE__ ?? null;

export function assetUrl(path) { return bundle()?.assets?.[path] ?? path; }

export function loadImage(path) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${path}`));
    img.src = assetUrl(path);
  });
}

export async function loadJSON(name) {
  const b = bundle();
  if (b) return b.data[name];
  const r = await fetch(`data/${name}.json`);
  if (!r.ok) throw new Error(`data/${name}.json: ${r.status}`);
  return r.json();
}
