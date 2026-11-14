import Link from "next/link";
import { notFound } from "next/navigation";
import { loadLeaseState } from "@/lib/lease-state";
import { renderLeaseHtml, leaseFileName, TEMPLATE_VERSION } from "@/lib/lease-engine";
import { updateRevisionSettings } from "../../lease-builder-actions";
import { PrintButton } from "@/components/PrintButton";
import { ExportDocxButton } from "@/components/ExportDocxButton";
import "./lease-sheet.css";

export const dynamic = "force-dynamic";

const BUTTON = "text-sm border border-slate-300 bg-white px-3 py-1.5 rounded hover:bg-slate-100";
const PRIMARY = "text-sm bg-slate-900 text-white px-3 py-1.5 rounded hover:bg-slate-700";

export default async function LeaseReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const leaseId = Number(id);
  if (!Number.isInteger(leaseId)) notFound();

  const loaded = await loadLeaseState(leaseId);
  if (!loaded) notFound();
  const { state, landlordMissing } = loaded;

  const html = renderLeaseHtml(state);
  const boundUpdate = updateRevisionSettings.bind(null, leaseId);

  return (
    <div className="lease-review space-y-4">
      <div className="review-controls space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link href={`/leases/${leaseId}`} className="text-sm text-slate-500 hover:underline">
              ← Back to lease
            </Link>
            <h1 className="text-lg font-semibold">Review &amp; Print</h1>
            <p className="text-xs text-slate-500">2026 lease template · {TEMPLATE_VERSION}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/leases/${leaseId}/terms`} className={BUTTON}>
              Edit lease terms
            </Link>
            <ExportDocxButton targetId="lease-document" filename={leaseFileName(state)} className={BUTTON} />
            <PrintButton className={PRIMARY} />
          </div>
        </div>

        <form action={boundUpdate} className="flex flex-wrap items-end gap-3 bg-white border border-slate-200 rounded-lg p-4">
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="revisionMode">Lease text</label>
            <select id="revisionMode" name="revisionMode" defaultValue={state.revisionMode} className="rounded border border-slate-300 px-2 py-1.5 text-sm">
              <option value="original">Original lease (no proposed changes)</option>
              <option value="review">Review copy: original clauses with PROPOSED paragraphs</option>
              <option value="clean">Clean draft: proposed changes merged in</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="revisionSchedule">Schedule 1.7-A (month by month)</label>
            <select id="revisionSchedule" name="revisionSchedule" defaultValue={state.revisionSchedule} className="rounded border border-slate-300 px-2 py-1.5 text-sm">
              <option value="yes">Attach (Review copy and Clean draft)</option>
              <option value="no">Do not attach</option>
            </select>
          </div>
          <button type="submit" className={PRIMARY}>Apply</button>
          <p className="text-xs text-slate-500 basis-full">
            Draft, not for execution. Every figure is generated from this lease&apos;s terms; have counsel review before signing.
          </p>
        </form>

        {landlordMissing && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
            The landlord profile is not set up yet, so the Landlord&apos;s name and address are blank.{" "}
            <Link href="/landlord-profile" className="underline">Fill it in</Link>.
          </p>
        )}
      </div>

      <div className="flex justify-center">
        <article id="lease-document" className="sheet" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
