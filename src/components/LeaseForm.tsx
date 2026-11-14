"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LEASE_FIELD_GROUPS,
  parseFieldValue,
  showIfMatches,
  type LeaseField,
  type LeaseState,
} from "@/lib/lease-engine";

const LINK_LABELS: Record<NonNullable<LeaseField["linkedTo"]>, string> = {
  landlord: "Edit in Landlord profile",
  tenant: "Edit on the tenant",
  property: "Edit on the property",
  suite: "Edit on the suite",
};

const INPUT = "w-full rounded border border-slate-300 px-2 py-1.5 text-sm disabled:bg-slate-100 disabled:text-slate-400";

/** Generic lease terms form, rendered from LEASE_FIELD_GROUPS. */
export function LeaseForm({
  initial,
  action,
  linkedHrefs,
}: {
  initial: LeaseState;
  action: (formData: FormData) => void | Promise<void>;
  linkedHrefs: Record<NonNullable<LeaseField["linkedTo"]>, string>;
}) {
  const [state, setState] = useState<LeaseState>(initial);

  function onChange(field: LeaseField, raw: string | boolean) {
    const value = field.type === "bool" ? Boolean(raw) : parseFieldValue(field, String(raw));
    setState((s) => ({ ...s, [field.key]: value }));
  }

  const parkingTotal =
    Math.min(2, Math.max(1, state.parkingSpaces || 1)) *
    (state.parkingMonthlyRatePerSpace || 0) *
    (state.parkingTermMode === "lease" ? state.initialTermMonths || 0 : (state.parkingYears || 0) * 12);

  return (
    <form action={action} className="space-y-4">
      {LEASE_FIELD_GROUPS.map((group) => (
        <section key={group.title} className="bg-white border border-slate-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-slate-700">{group.title}</h2>
          {group.hint && <p className="text-xs text-slate-500 mt-0.5 mb-3 max-w-2xl">{group.hint}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            {group.fields.map((field) => {
              if (!showIfMatches(field.showIf, state)) return null;
              const disabled = field.enableIf ? !state[field.enableIf] : false;
              const value = state[field.key];
              return (
                <div key={field.key} className={field.wide || field.type === "textarea" ? "sm:col-span-3" : ""}>
                  {field.type === "bool" ? (
                    <label className="flex items-center gap-2 text-sm font-medium mt-5">
                      <input type="hidden" name={`${field.key}__present`} value="1" />
                      <input
                        type="checkbox"
                        name={field.key}
                        checked={Boolean(value)}
                        onChange={(e) => onChange(field, e.target.checked)}
                      />
                      {field.label}
                    </label>
                  ) : (
                    <>
                      <label className="block text-xs font-medium mb-1" htmlFor={field.key}>
                        {field.label}
                        {(field.prefix || field.suffix) && (
                          <span className="font-normal text-slate-400">
                            {" "}({[field.prefix, field.suffix].filter(Boolean).join(" ")})
                          </span>
                        )}
                      </label>
                      {field.source === "linked" ? (
                        <div className="text-sm px-2 py-1.5 rounded bg-slate-50 border border-slate-200 min-h-[34px]">
                          {String(value ?? "") || <span className="text-slate-400">blank</span>}
                        </div>
                      ) : field.type === "select" ? (
                        <select
                          id={field.key}
                          name={field.key}
                          value={String(value ?? "")}
                          disabled={disabled}
                          onChange={(e) => onChange(field, e.target.value)}
                          className={INPUT}
                        >
                          {field.options!.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "textarea" ? (
                        <textarea
                          id={field.key}
                          name={field.key}
                          rows={6}
                          value={String(value ?? "")}
                          disabled={disabled}
                          onChange={(e) => onChange(field, e.target.value)}
                          className={INPUT}
                        />
                      ) : (
                        <input
                          id={field.key}
                          name={field.key}
                          type={field.type === "date" ? "date" : field.type === "text" ? "text" : "number"}
                          step={field.type === "num" ? "0.01" : field.type === "int" ? "1" : undefined}
                          min={field.type === "num" || field.type === "int" ? 0 : undefined}
                          value={String(value ?? "")}
                          disabled={disabled}
                          onChange={(e) => onChange(field, e.target.value)}
                          className={INPUT}
                        />
                      )}
                    </>
                  )}
                  {field.source === "linked" && field.linkedTo && (
                    <Link href={linkedHrefs[field.linkedTo]} className="text-xs text-slate-500 hover:underline">
                      {LINK_LABELS[field.linkedTo]}
                    </Link>
                  )}
                  {field.note && <p className="text-xs text-slate-500 mt-0.5">{field.note}</p>}
                  {field.key === "parkingCredit" && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Total Edge Lot parking cost over the term:{" "}
                      {parkingTotal.toLocaleString("en-US", { style: "currency", currency: "USD" })}.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="flex gap-2">
        <button type="submit" name="next" value="stay" className="rounded bg-slate-900 text-white px-3 py-1.5 text-sm font-medium hover:bg-slate-700">
          Save lease terms
        </button>
        <button type="submit" name="next" value="review" className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100">
          Save and open Review &amp; Print
        </button>
      </div>
    </form>
  );
}
