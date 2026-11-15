#!/usr/bin/env node
// Fill in missing translations (English, Japanese, Spanish) for everything in
// content/, from the Chinese source. Runs automatically in GitHub Actions
// whenever content changes (.github/workflows/translate.yml), or by hand:
//
//   npm run translate              only empty fields
//   npm run translate -- --force   redo every unreviewed translation
//   npm run translate -- --dry     just list what's missing
//
// A language marked "已校對" (reviewed: true) in the CMS is never touched.
// The site only ever reads the saved text, so layout is unaffected.
//
// Engine: M2M100 (418M, MIT licence), an open model that runs locally through
// transformers.js. No API key, no cost. The first run downloads the model
// (a few hundred MB) into node_modules/.cache. To try another engine, replace
// translateText() below; TRANSLATE_MODEL overrides the model id.

import fs from "node:fs";
import path from "node:path";
import * as yaml from "js-yaml";

const LANGS = ["en", "ja", "es"];
const MODEL = process.env.TRANSLATE_MODEL || "Xenova/m2m100_418M";
const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry");
const FORCE = args.has("--force");
const root = path.resolve(import.meta.dirname, "..", "content");

let pipe;
/** Translate one piece of Chinese text. Paragraphs go through one at a time. */
async function translateText(text, lang) {
  if (!pipe) {
    console.log(`Loading ${MODEL}…`);
    const { pipeline } = await import("@huggingface/transformers");
    pipe = await pipeline("translation", MODEL, { dtype: "q8" });
  }
  const out = [];
  for (const para of text.split(/\n\s*\n/)) {
    const line = para.replace(/\s*\n\s*/g, " ").trim();
    if (!line) continue;
    const [r] = await pipe(line, { src_lang: "zh", tgt_lang: lang, max_new_tokens: 400 });
    out.push(r.translation_text.trim());
  }
  return out.join("\n\n");
}

/** Latin-only text (names like "Click Rush") is kept as is. */
const needsTranslation = (s) => /[\u3400-\u9fff]/.test(s);

// Markdoc → plain paragraphs (translated bodies are stored as plain text).
const plain = (md) =>
  md
    .replace(/\{%[^%]*%\}/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`#>]/g, "")
    .trim();

/** Translate `fields` of one entry in place. Returns how many languages changed. */
async function fillEntry(name, data, source) {
  data.i18n ??= {};
  const todo = {};
  for (const lang of LANGS) {
    const t = (data.i18n[lang] ??= {});
    if (t.reviewed) continue;
    const missing = Object.keys(source).filter((k) => source[k] && (FORCE || !t[k]));
    if (missing.length) todo[lang] = missing;
  }
  const langs = Object.keys(todo);
  if (!langs.length) return 0;
  console.log(`${name}: ${langs.map((l) => `${l} (${todo[l].join(", ")})`).join("; ")}`);
  if (DRY) return 0;
  for (const lang of langs) {
    for (const k of todo[lang]) {
      const src = String(source[k]);
      data.i18n[lang][k] = needsTranslation(src) ? await translateText(src, lang) : src;
    }
    data.i18n[lang].reviewed = false;
  }
  return langs.length;
}

const dump = (data) => yaml.dump(data, { lineWidth: -1, noRefs: true });
let changed = 0;

// profile
const profilePath = path.join(root, "profile.yaml");
if (fs.existsSync(profilePath)) {
  const data = yaml.load(fs.readFileSync(profilePath, "utf8")) ?? {};
  const n = await fillEntry("profile", data, { title: data.title, tagline: data.tagline });
  if (n) fs.writeFileSync(profilePath, dump(data));
  changed += n;
}

// works
const worksDir = path.join(root, "works");
for (const file of fs.readdirSync(worksDir).filter((f) => f.endsWith(".mdoc")).sort()) {
  const full = path.join(worksDir, file);
  const m = fs.readFileSync(full, "utf8").match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) continue;
  const data = yaml.load(m[1]) ?? {};
  const n = await fillEntry(file, data, {
    title: data.title,
    summary: data.summary,
    role: data.role,
    body: plain(m[2]),
  });
  if (n) fs.writeFileSync(full, `---\n${dump(data)}---\n${m[2]}`);
  changed += n;
}

console.log(DRY ? "Dry run: nothing written." : changed ? `Done: ${changed} translation(s) written. Review them in /keystatic.` : "Everything is already translated.");
