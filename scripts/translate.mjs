#!/usr/bin/env node
// Fill in missing translations (English, Japanese, Spanish) for everything in
// content/, from the Chinese source. Run after adding or editing works:
//
//   ANTHROPIC_API_KEY=... npm run translate            only empty fields
//   ANTHROPIC_API_KEY=... npm run translate -- --force  redo all unreviewed
//   npm run translate -- --dry                          just list what's missing
//
// A language marked "已校對" (reviewed: true) in the CMS is never touched.
// The site only ever reads the saved text, so layout is unaffected.
//
// The engine is one small function (translate()) calling a lightweight model;
// swap it if you pick a different one. TRANSLATE_MODEL overrides the model.

import fs from "node:fs";
import path from "node:path";
import * as yaml from "js-yaml";

const LANGS = { en: "English", ja: "Japanese", es: "Spanish (neutral, international)" };
const MODEL = process.env.TRANSLATE_MODEL || "claude-haiku-5-5";
const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry");
const FORCE = args.has("--force");
const root = path.resolve(import.meta.dirname, "..", "content");

async function translate(source) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("Set ANTHROPIC_API_KEY (or run with --dry).");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      system:
        "You translate short portfolio copy from Traditional Chinese. Keep it concise and natural, " +
        "keep proper nouns, product names and code as they are, keep paragraph breaks, and do not add anything. " +
        `Reply with JSON only, shaped {${Object.keys(LANGS).map((l) => `"${l}": {…same keys as the input…}`).join(", ")}}. ` +
        `Languages: ${Object.entries(LANGS).map(([k, v]) => `${k} = ${v}`).join("; ")}.`,
      messages: [{ role: "user", content: JSON.stringify(source, null, 2) }],
    }),
  });
  if (!res.ok) throw new Error(`Translation API ${res.status}: ${await res.text()}`);
  const text = (await res.json()).content.map((c) => c.text ?? "").join("");
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(json);
}

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
  for (const lang of Object.keys(LANGS)) {
    const t = (data.i18n[lang] ??= {});
    if (t.reviewed) continue;
    const missing = Object.keys(source).filter((k) => source[k] && (FORCE || !t[k]));
    if (missing.length) todo[lang] = missing;
  }
  const langs = Object.keys(todo);
  if (!langs.length) return 0;
  console.log(`${name}: ${langs.map((l) => `${l} (${todo[l].join(", ")})`).join("; ")}`);
  if (DRY) return 0;
  const wanted = [...new Set(langs.flatMap((l) => todo[l]))];
  const out = await translate(Object.fromEntries(wanted.map((k) => [k, source[k]])));
  for (const lang of langs) {
    for (const k of todo[lang]) if (out[lang]?.[k]) data.i18n[lang][k] = String(out[lang][k]).trim();
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
