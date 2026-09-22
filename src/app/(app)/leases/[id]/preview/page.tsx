import Link from "next/link";
import { notFound } from "next/navigation";
import { previewLeaseDocumentParagraphs } from "@/lib/lease-document";

export const dynamic = "force-dynamic";

export default async function LeaseDocumentPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const leaseId = Number(id);
  if (!Number.isInteger(leaseId)) notFound();

  let paragraphs: string[];
  let error: string | null = null;
  try {
    paragraphs = await previewLeaseDocumentParagraphs(leaseId);
  } catch (err) {
    paragraphs = [];
    error = err instanceof Error ? err.message : "Failed to build preview";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/leases/${leaseId}`} className="text-sm text-slate-500 hover:underline">
            ← Back to lease
          </Link>
          <h1 className="text-lg font-semibold">Document preview</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/leases/${leaseId}/preview`} className="text-sm text-slate-600 hover:underline">
            Refresh
          </Link>
          <a
            href={`/api/leases/${leaseId}/document`}
            className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded hover:bg-slate-700"
          >
            Download .docx
          </a>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Plain-text preview of the generated document — reflects the lease's data right now,
        including anything left blank. Re-open this page after saving changes to see them here;
        it doesn't update live. Formatting (tables, bold, page layout) only shows properly in the
        downloaded .docx.
      </p>

      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
          {error}
        </p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-3xl">
          <div className="space-y-3 font-serif text-sm leading-relaxed text-slate-800">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
