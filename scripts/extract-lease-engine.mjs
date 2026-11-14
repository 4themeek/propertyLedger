// Generates src/lib/lease-engine-core.js from the standalone Lease Builder page
// (public/lease-builder/index.html), so the app renders exactly the same lease
// text, numbering and math as the page.
//
// Usage: node scripts/extract-lease-engine.mjs
// Re-run it whenever the page is updated (e.g. v1.8), then run
// node scripts/check-lease-parity.mjs.
//
// The page's code is copied unchanged except for the edits in PATCHES below.
// Each patch must match exactly once, or the script stops.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const pagePath = path.join(root, "public", "lease-builder", "index.html");
const outPath = path.join(root, "src", "lib", "lease-engine-core.js");

const page = fs.readFileSync(pagePath, "utf8").replace(/\r\n/g, "\n");

function between(startMarker, endMarker, label) {
  const start = page.indexOf(startMarker);
  if (start < 0) throw new Error(`extract: start of ${label} not found`);
  const end = page.indexOf(endMarker, start);
  if (end < 0) throw new Error(`extract: end of ${label} not found`);
  return page.slice(start, end);
}

// 1. Template version label from the page header ("2026 lease template · v1.7").
const versionMatch = page.match(/class="sub">[^<]*?(v\d+(?:\.\d+)+)</);
if (!versionMatch) throw new Error("extract: version label not found");
const version = versionMatch[1];

// 2. DEFAULTS object literal.
const defaultsSrc = between("var DEFAULTS = {", "\n  };\n", "DEFAULTS") + "\n  };";

// 3. Helpers, computeModel and the renderers: from esc() to the end of renderDocument().
let engineSrc = between("  function esc(s){", "/* Lease -> .docx exporter", "engine");

const PATCHES = [
  {
    // Return the HTML instead of writing it into the page.
    find: '    document.getElementById("docSheet").innerHTML = out;',
    replace: "    return out;",
  },
  {
    // App hook: landlord signer title from the landlord profile (page hard-codes it).
    find: 'var lSignTitle = "Managing Member";',
    replace: 'var lSignTitle = esc(s.landlordSignerTitle||"") || "Managing Member";',
  },
  {
    // App hook: building name from the property (page hard-codes it).
    find: "RAW('<p class=\"bldgtitle\">The Edge Office Building</p>');",
    replace: "RAW('<p class=\"bldgtitle\">'+(esc(s.buildingName||\"\")||\"The Edge Office Building\")+'</p>');",
  },
  {
    // App hook: Exhibit D items from the lease's tenant-improvement details (page hard-codes them).
    find: '    ["New carpet tile in the private offices",',
    replace: '    ((s.exhibitDItems && s.exhibitDItems.length) ? s.exhibitDItems.map(esc) : ["New carpet tile in the private offices",',
  },
  {
    find: '"Demising walls per the plan in Exhibit B"].forEach(function(line){ ITEM("&bull;", line); });',
    replace: '"Demising walls per the plan in Exhibit B"]).forEach(function(line){ ITEM("&bull;", line); });',
  },
];

for (const p of PATCHES) {
  const count = engineSrc.split(p.find).length - 1;
  if (count !== 1) throw new Error(`extract: patch matched ${count} times: ${p.find.slice(0, 70)}`);
  engineSrc = engineSrc.replace(p.find, () => p.replace);
}
if (/document\.|window\.|localStorage/.test(engineSrc)) {
  throw new Error("extract: engine code still touches the DOM; update the patches");
}

const out = `// GENERATED FILE - do not edit by hand.
// Source: public/lease-builder/index.html (${version}), via scripts/extract-lease-engine.mjs.
// Typed wrapper and app-specific code: src/lib/lease-engine.ts.
/* eslint-disable */

export const TEMPLATE_VERSION = ${JSON.stringify(version)};

export const DEFAULTS = (function(){
  ${defaultsSrc}
  return DEFAULTS;
})();

function createEngine(state){
  "use strict";
${engineSrc.replace(/\s+$/, "")}

  return { computeModel: computeModel, renderDocument: renderDocument };
}

/** Full lease HTML (the page's renderDocument output) for a complete state object. */
export function renderLeaseHtml(state){
  return createEngine(state).renderDocument();
}

/** The page's computeModel: dates, rent rows, monthly schedule, totals. */
export function computeLeaseModel(state){
  return createEngine(state).computeModel(state);
}
`;

fs.writeFileSync(outPath, out);
console.log(`wrote ${path.relative(root, outPath)} (${version}, ${out.length} bytes)`);
