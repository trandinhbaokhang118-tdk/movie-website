import { readFile, readdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outputPath = new URL("../app/i18n/generated-translations.json", import.meta.url);
const existing = JSON.parse(await readFile(outputPath, "utf8"));
const targets = { "en-US": "en", "fr-FR": "fr", "ja-JP": "ja", "ko-KR": "ko", "zh-CN": "zh-CN" };

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : [path];
  }));
  return nested.flat();
}

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const files = (await Promise.all([sourceFiles(join(projectRoot, "app")), sourceFiles(join(projectRoot, "lib"))])).flat()
  .filter((path) => [".ts", ".tsx"].includes(extname(path)) && !path.endsWith("dictionaries.ts"));
// Source files are authoritative. The legacy hand-written dictionary contains
// mojibake keys from an earlier encoding issue, so feeding those keys back into
// translation creates hundreds of unusable entries.
const phraseSet = new Set();
const vietnamese = /[ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯàáâãèéêìíòóôõùúăđĩũơưẠ-ỹ]/;
for (const file of files) {
  const contents = await readFile(file, "utf8");
  const candidates = [
    ...Array.from(contents.matchAll(/(["'])([^"'\r\n]{2,260})\1/g), (item) => item[2]),
    ...Array.from(contents.matchAll(/>\s*([^<>{}\r\n]{2,260}?)\s*</g), (item) => item[1]),
  ];
  for (const raw of candidates) {
    const text = raw.replace(/\s+/g, " ").trim();
    if (vietnamese.test(text) && !/[{}=`]/.test(text) && !/\b(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE)\b/i.test(text)) phraseSet.add(text);
  }
}

async function translate(text, target) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const query = new URLSearchParams({ client: "gtx", sl: "vi", tl: target, dt: "t", q: text });
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?${query}`, {
      headers: { "User-Agent": "CineWaveTranslationBuilder/1.0" },
    });
    if (response.ok) {
      const payload = await response.json();
      return payload[0].map((part) => part[0]).join("");
    }
    if (attempt === 3) throw new Error(`Translation failed with HTTP ${response.status}: ${text}`);
    await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }
  return text;
}

const entries = Array.from(phraseSet).sort((left, right) => left.localeCompare(right, "vi"));
const generated = {};
for (const [locale, target] of Object.entries(targets)) {
  generated[locale] = {};
  for (let index = 0; index < entries.length; index += 4) {
    const batch = entries.slice(index, index + 4);
    const values = await Promise.all(batch.map((text) => existing[locale]?.[text] ?? translate(text, target)));
    batch.forEach((text, valueIndex) => { generated[locale][text] = values[valueIndex]; });
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
}
await writeFile(outputPath, `${JSON.stringify(generated, null, 2)}\n`, "utf8");
console.log(`Generated ${entries.length} phrases for ${Object.keys(targets).length} locales.`);
