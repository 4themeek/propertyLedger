"use client";

import { buildLeaseDocx } from "@/lib/docx-export";

// Downloads the lease document currently rendered on the page as a Word (.docx) file.
// targetId = the id of the element wrapping <LeaseDocument /> (e.g. "lease-document").
// Copy the className from the existing PrintButton so the two buttons match.
export function ExportDocxButton({
  targetId,
  filename,
  className,
}: {
  targetId: string;
  filename: string;
  className?: string;
}) {
  function onClick() {
    const el = document.getElementById(targetId);
    if (!el) return;
    const blob = buildLeaseDocx(el);
    const name = filename.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim() || "Lease";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name.toLowerCase().endsWith(".docx") ? name : `${name}.docx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      Export Word (.docx)
    </button>
  );
}
