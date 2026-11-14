// Checks that the app's lease engine (src/lib/lease-engine-core.js) renders exactly
// what the standalone page (public/lease-builder/index.html) renders.
//
// Usage: node scripts/check-lease-parity.mjs
//
// It runs the page's own, unmodified renderDocument() in a Node vm with a stub DOM,
// and the app engine, on several lease variants in all three revision modes, and
// compares the HTML byte for byte. It also checks the anchors from LEASE_UPDATE.md.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const page = fs.readFileSync(path.join(root, "public", "lease-builder", "index.html"), "utf8").replace(/\r\n/g, "\n");
const app = await import(pathToFileURL(path.join(root, "src", "lib", "lease-engine-core.js")).href);

function slice(startMarker, endMarker) {
  const a = page.indexOf(startMarker);
  const b = page.indexOf(endMarker, a);
  if (a < 0 || b < 0) throw new Error(`marker not found: ${startMarker}`);
  return page.slice(a, b);
}
const pageCode =
  slice("var DEFAULTS = {", "\n  };\n") + "\n  };\n" +
  slice("  function esc(s){", "/* Lease -> .docx exporter") +
  "\nthis.__DEFAULTS = DEFAULTS; this.__render = renderDocument;";

function renderWithPage(state) {
  const sink = { innerHTML: "" };
  const ctx = { state, document: { getElementById: () => sink } };
  vm.createContext(ctx);
  vm.runInContext(pageCode, ctx);
  ctx.state = state;
  ctx.__render();
  return sink.innerHTML;
}

const D = app.DEFAULTS;
const VARIANTS = {
  default: {},
  "credit total $12,000": { rentCreditProvided: "yes", rentCreditMode: "total", rentCreditTotal: 12000 },
  "credit monthly": { rentCreditProvided: "yes", rentCreditMode: "monthly", rentCreditPerMonth: 1000, rentCreditMonths: 3 },
  "signer2 + guarantor2, early-term off, cap off": {
    tenantSigner2Name: "Jamie Rivera", tenantSigner2Title: "Member", guarantor2Name: "Jamie Rivera",
    earlyTermMonths: 0, utilitiesCapEnabled: false,
  },
  "parking off, moving off, LED on, no schedule": {
    parkingIncluded: "no", movingExpenseProvided: "no", ledScreenOption: "yes", revisionSchedule: "no",
  },
  "parking matches lease, cap years 3-5": { parkingTermMode: "lease", parkingSpaces: 1, utilitiesCapStartYear: 3, utilitiesCapEndYear: 5 },
};

let failures = 0;
function check(label, ok, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? "  " + detail : ""}`);
}

// DEFAULTS must be identical too.
const pageDefaults = (() => {
  const ctx = { state: {}, document: { getElementById: () => ({}) } };
  vm.createContext(ctx);
  vm.runInContext(pageCode, ctx);
  return ctx.__DEFAULTS;
})();
check("DEFAULTS identical", JSON.stringify(pageDefaults) === JSON.stringify(D));

for (const [name, overrides] of Object.entries(VARIANTS)) {
  for (const mode of ["original", "review", "clean"]) {
    const state = { ...D, ...overrides, revisionMode: mode };
    const a = renderWithPage({ ...state });
    const b = app.renderLeaseHtml({ ...state });
    let detail = "";
    if (a !== b) {
      let i = 0;
      while (i < a.length && a[i] === b[i]) i++;
      detail = `first difference at ${i}: page "${a.slice(i, i + 60)}" vs app "${b.slice(i, i + 60)}"`;
    }
    check(`${name} / ${mode}`, a === b, detail);
  }
}

// Anchors from LEASE_UPDATE.md, default lease.
const orig = app.renderLeaseHtml({ ...D, revisionMode: "original" });
const review = app.renderLeaseHtml({ ...D, revisionMode: "review" });
const clean = app.renderLeaseHtml({ ...D, revisionMode: "clean" });
const paraNo = (html, label) => {
  const m = html.match(new RegExp(`<strong class="pn">([\\d.]+)</strong> <strong>${label}`));
  return m ? m[1] : null;
};
check("63 numbered paragraphs", (orig.match(/class="pn"/g) || []).length === 63);
check("23 numbered sections", (orig.match(/<h3 class="sec[^"]*">Section /g) || []).length === 23);
check("rent schedule caption 1.7", orig.includes("<caption>Section 1.7 &mdash; Rent Schedule</caption>"));
check("Demised Premises is 1.8", paraNo(orig, "Demised Premises") === "1.8");
check("Early Termination is 1.9", paraNo(orig, "Early Termination Option") === "1.9");
check("early termination effective August 31, 2032", /Early Termination Option:<\/strong>[\s\S]*?effective August 31, 2032/.test(orig));
check("no unresolved cross-references", !/(?<!_)__(?!_)/.test(orig + review + clean) && !/\{\{/.test(orig + review + clean));
check("original has no PROPOSED paragraphs", !/class="prop"/.test(orig) && !/PROPOSED/.test(orig));
check("review has PROPOSED paragraphs", /PROPOSED/.test(review));
check('clean drops "with no termination fee"', !clean.includes("with no termination fee"));
check('clean drops "shall cease upon expiration of the Guarantee Period"', !clean.includes("shall cease upon expiration of the Guarantee Period"));

const EXPECTED_ROWS = [
  ["1", "1-3", "FREE", "FREE", "$0.00 (abated)", "$750.00", "$250.00"],
  ["1", "4-12", "20.00", "$5,066.67", "$45,600.03", "$2,250.00", "$250.00"],
  ["2", "13-24", "20.50", "$5,193.33", "$62,319.96", "$3,075.00", "$256.25"],
  ["3", "25-36", "21.01", "$5,322.53", "$63,870.36", "$3,151.87", "$262.66"],
  ["4", "37-48", "21.54", "$5,456.80", "$65,481.60", "$3,230.67", "$269.22"],
  ["5", "49-60", "22.08", "$5,593.60", "$67,123.20", "$3,311.44", "$275.95"],
  ["6", "61-72", "22.63", "$5,732.93", "$68,795.16", "$3,394.22", "$282.85"],
  ["7", "73-84", "23.19", "$5,874.80", "$70,497.60", "$3,479.08", "$289.92"],
  ["8 (Partial)", "85-87", "23.77", "$6,021.73", "$18,065.19", "$891.52", "$297.17"],
];
const model = app.computeLeaseModel({ ...D });
const got = model.rentRows.map((r) => [r.yearNum, r.months, r.rate, r.monthlyBase, r.annualBase, r.annualUtilities, r.monthlyUtilities]);
check("default rent table matches LEASE_UPDATE.md section 1", JSON.stringify(got) === JSON.stringify(EXPECTED_ROWS));
check("totals $461,753.10 base / $23,533.80 utilities",
  Math.abs(model.totalBase - 461753.1) < 0.005 && Math.abs(model.totalUtilities - 23533.8) < 0.005,
  `(${model.totalBase.toFixed(2)} / ${model.totalUtilities.toFixed(2)})`);

const credit = app.computeLeaseModel({ ...D, rentCreditProvided: "yes", rentCreditMode: "total", rentCreditTotal: 12000 });
const cr = credit.rentRows.slice(0, 4).map((r) => [r.months, r.monthlyBase, r.annualBase]);
check("credit $12,000 rows (LEASE_UPDATE.md section 9)", JSON.stringify(cr) === JSON.stringify([
  ["1-3", "FREE", "$0.00 (abated)"], ["4-5", "CREDIT", "$0.00 (credited)"],
  ["6", "CREDIT ($3,200.01 net due)", "$3,200.01"], ["7-12", "$5,066.67", "$30,400.02"],
]), JSON.stringify(cr));
let ledgerOk = true;
for (const m of credit.months) if (Math.abs(m.base - m.credit - m.net) > 0.005) ledgerOk = false;
check("Schedule 1.7-A: scheduled - credit = net on every month", ledgerOk);

console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
