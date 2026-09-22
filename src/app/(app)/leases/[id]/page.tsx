import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/db";
import {
  leases,
  suites,
  properties,
  tenants,
  rentSchedulePeriods,
  files,
  LEASE_STATUSES,
  FILE_CATEGORIES,
  type FileCategory,
} from "@/db/schema";
import {
  updateLeaseStatus,
  addRentSchedulePeriod,
  deleteRentSchedulePeriod,
  generateRentSchedule,
  updateLeaseDocumentDetails,
} from "../actions";
import { uploadFile, deleteFile } from "@/lib/file-actions";

export const dynamic = "force-dynamic";

const DOCUMENT_CATEGORIES = FILE_CATEGORIES.filter((c) => c !== "floorplan") as Exclude<
  FileCategory,
  "floorplan"
>[];

function formatMoney(value: string | null) {
  if (!value) return "—";
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function LeaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const leaseId = Number(id);
  if (!Number.isInteger(leaseId)) notFound();

  const [lease] = await db.select().from(leases).where(eq(leases.id, leaseId)).limit(1);
  if (!lease) notFound();

  const [suite] = await db.select().from(suites).where(eq(suites.id, lease.suiteId)).limit(1);
  const [property] = suite
    ? await db.select().from(properties).where(eq(properties.id, suite.propertyId)).limit(1)
    : [undefined];
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, lease.tenantId)).limit(1);

  const schedule = await db
    .select()
    .from(rentSchedulePeriods)
    .where(eq(rentSchedulePeriods.leaseId, leaseId))
    .orderBy(asc(rentSchedulePeriods.periodStart));

  const documents = await db
    .select()
    .from(files)
    .where(and(eq(files.attachedToType, "lease"), eq(files.attachedToId, leaseId)));

  const revalidatePathValue = `/leases/${leaseId}`;
  const boundAddPeriod = addRentSchedulePeriod.bind(null, leaseId);
  const boundUpdateStatus = updateLeaseStatus.bind(null, leaseId);
  const boundGenerateSchedule = generateRentSchedule.bind(null, leaseId);
  const boundUpdateDocumentDetails = updateLeaseDocumentDetails.bind(null, leaseId);

  return (
    <div className="space-y-8">
      <div>
        {property && suite && (
          <Link href={`/suites/${suite.id}`} className="text-sm text-slate-500 hover:underline">
            {property.name} · Suite {suite.suiteNumber}
          </Link>
        )}
        <h1 className="text-lg font-semibold">
          {tenant ? (
            <Link href={`/tenants/${tenant.id}`} className="hover:underline">
              {tenant.entityName}
            </Link>
          ) : (
            "Lease"
          )}
        </h1>
        <div className="text-sm text-slate-600 mt-1 space-y-0.5">
          {lease.permittedUse && <div>Permitted use: {lease.permittedUse}</div>}
          {lease.commencementDate && <div>Commencement date: {lease.commencementDate}</div>}
          {lease.initialTermMonths && <div>Initial term: {lease.initialTermMonths} months</div>}
          {lease.renewalOptionYears && (
            <div>
              Renewal option: {lease.renewalOptionYears} year(s), {lease.renewalNoticeDays ?? "?"}{" "}
              days notice
            </div>
          )}
          {lease.notes && <div className="mt-2 text-slate-600">{lease.notes}</div>}
        </div>

        <div className="flex items-center gap-4 mt-3">
          <form action={boundUpdateStatus} className="flex items-center gap-2">
            <label className="text-sm font-medium">Status</label>
            <select name="status" defaultValue={lease.status} className="rounded border border-slate-300 px-2 py-1 text-sm">
              {LEASE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button type="submit" className="text-sm text-slate-600 hover:underline">
              Update
            </button>
          </form>
          <Link href={`/leases/new?cloneFrom=${leaseId}`} className="text-sm text-slate-600 hover:underline">
            Duplicate this lease
          </Link>
          <Link href={`/leases/${leaseId}/preview`} className="text-sm text-slate-600 hover:underline">
            Preview document
          </Link>
          <a
            href={`/api/leases/${leaseId}/document`}
            className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded hover:bg-slate-700"
          >
            Download lease document
          </a>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Both reflect the fields below right now — works at any point, even with blanks left for
          details you haven&apos;t filled in yet. &quot;Preview&quot; shows the text on this page;
          &quot;Download&quot; gets you the actual formatted .docx.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Rent schedule</h2>
        {schedule.length > 0 && (
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden bg-white mb-3">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="px-3 py-2">Start</th>
                <th className="px-3 py-2">End</th>
                <th className="px-3 py-2">Monthly base rent</th>
                <th className="px-3 py-2">Monthly additional rent</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {schedule.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-2">{row.periodStart}</td>
                  <td className="px-3 py-2">{row.periodEnd}</td>
                  <td className="px-3 py-2">{formatMoney(row.monthlyBaseRent)}</td>
                  <td className="px-3 py-2">{formatMoney(row.monthlyAdditionalRent)}</td>
                  <td className="px-3 py-2 text-right">
                    <form action={deleteRentSchedulePeriod.bind(null, row.id, leaseId)}>
                      <button type="submit" className="text-xs text-red-600 hover:underline">
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <form
          action={boundAddPeriod}
          className="flex flex-wrap items-end gap-3 bg-white border border-slate-200 rounded-lg p-4"
        >
          <div>
            <label className="block text-xs font-medium mb-1">Start</label>
            <input type="date" name="periodStart" required className="rounded border border-slate-300 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">End</label>
            <input type="date" name="periodEnd" required className="rounded border border-slate-300 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Monthly base rent</label>
            <input
              type="number"
              step="0.01"
              name="monthlyBaseRent"
              required
              className="rounded border border-slate-300 px-2 py-1.5 text-sm w-32"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Monthly additional rent</label>
            <input
              type="number"
              step="0.01"
              name="monthlyAdditionalRent"
              className="rounded border border-slate-300 px-2 py-1.5 text-sm w-32"
            />
          </div>
          <button
            type="submit"
            className="rounded bg-slate-900 text-white px-3 py-1.5 text-sm font-medium hover:bg-slate-700"
          >
            Add row
          </button>
        </form>

        <details className="mt-3">
          <summary className="text-sm text-slate-600 cursor-pointer hover:underline">
            Generate a schedule instead of adding rows one at a time
          </summary>
          <form
            action={boundGenerateSchedule}
            className="flex flex-wrap items-end gap-3 bg-white border border-slate-200 rounded-lg p-4 mt-2"
          >
            <div>
              <label className="block text-xs font-medium mb-1">First period starts</label>
              <input
                type="date"
                name="firstPeriodStart"
                required
                defaultValue={lease.commencementDate ?? undefined}
                className="rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1"># of periods</label>
              <input
                type="number"
                name="numberOfPeriods"
                min={1}
                required
                defaultValue={lease.renewalOptionYears ? undefined : 1}
                className="rounded border border-slate-300 px-2 py-1.5 text-sm w-20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Months per period</label>
              <input
                type="number"
                name="monthsPerPeriod"
                min={1}
                required
                defaultValue={12}
                className="rounded border border-slate-300 px-2 py-1.5 text-sm w-20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Starting monthly base rent</label>
              <input
                type="number"
                step="0.01"
                name="startingMonthlyBaseRent"
                required
                className="rounded border border-slate-300 px-2 py-1.5 text-sm w-32"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Base rent escalation %/period</label>
              <input
                type="number"
                step="0.01"
                name="baseRentEscalationPct"
                defaultValue={0}
                className="rounded border border-slate-300 px-2 py-1.5 text-sm w-28"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Starting monthly additional rent</label>
              <input
                type="number"
                step="0.01"
                name="startingMonthlyAdditionalRent"
                className="rounded border border-slate-300 px-2 py-1.5 text-sm w-32"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Additional rent escalation %/period</label>
              <input
                type="number"
                step="0.01"
                name="additionalRentEscalationPct"
                defaultValue={0}
                className="rounded border border-slate-300 px-2 py-1.5 text-sm w-28"
              />
            </div>
            <label className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" name="replaceExisting" />
              Replace existing rows
            </label>
            <button
              type="submit"
              className="rounded bg-slate-900 text-white px-3 py-1.5 text-sm font-medium hover:bg-slate-700"
            >
              Generate
            </button>
          </form>
        </details>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Document details</h2>
        <p className="text-xs text-slate-500 mb-2">
          Only used to fill in the generated lease document — optional, leave blank if not
          applicable to this deal.
        </p>
        <form
          action={boundUpdateDocumentDetails}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white border border-slate-200 rounded-lg p-4"
        >
          <DocField label="Renewal option count" name="renewalOptionCount" type="number" defaultValue={lease.renewalOptionCount} />
          <DocField label="Early occupancy (weeks)" name="earlyOccupancyWeeks" type="number" defaultValue={lease.earlyOccupancyWeeks} />
          <DocField label="Rent-free months" name="rentFreeMonths" type="number" defaultValue={lease.rentFreeMonths} />
          <DocField label="First rent due date" name="firstRentDueDate" type="date" defaultValue={lease.firstRentDueDate} />
          <DocField label="Lease execution date" name="leaseExecutionDate" type="date" defaultValue={lease.leaseExecutionDate} />
          <DocField label="Guarantee period ends" name="guaranteePeriodEndDate" type="date" defaultValue={lease.guaranteePeriodEndDate} />
          <DocField label="Security deposit (months)" name="securityDepositMonths" type="number" defaultValue={lease.securityDepositMonths} />
          <DocField label="Security deposit amount" name="securityDepositAmount" type="number" step="0.01" defaultValue={lease.securityDepositAmount} />
          <DocField label="Parking payment amount" name="parkingPaymentAmount" type="number" step="0.01" defaultValue={lease.parkingPaymentAmount} />
          <DocField label="Parking spot count" name="parkingSpotCount" type="number" defaultValue={lease.parkingSpotCount} />
          <DocField label="Parking years" name="parkingYears" type="number" defaultValue={lease.parkingYears} />
          <DocField label="Moving expense amount" name="movingExpenseAmount" type="number" step="0.01" defaultValue={lease.movingExpenseAmount} />
          <DocField label="Tenant signatory name" name="tenantSignatoryName" defaultValue={lease.tenantSignatoryName} />
          <DocField label="Tenant signatory title" name="tenantSignatoryTitle" defaultValue={lease.tenantSignatoryTitle} />
          <DocField label="Guarantor name" name="guarantorName" defaultValue={lease.guarantorName} />
          <div className="col-span-2 sm:col-span-4">
            <button
              type="submit"
              className="rounded bg-slate-900 text-white px-3 py-1.5 text-sm font-medium hover:bg-slate-700"
            >
              Save document details
            </button>
          </div>
        </form>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Documents</h2>
        {documents.length === 0 ? (
          <p className="text-sm text-slate-500 mb-3">No documents uploaded yet.</p>
        ) : (
          <ul className="space-y-1 mb-3">
            {documents.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between text-sm bg-white border border-slate-200 rounded px-3 py-2"
              >
                <a href={`/api/files/${f.id}`} target="_blank" className="hover:underline">
                  {f.originalFilename}
                </a>
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-wide text-slate-500">{f.category}</span>
                  <form action={deleteFile.bind(null, f.id, revalidatePathValue)}>
                    <button type="submit" className="text-xs text-red-600 hover:underline">
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}

        <DocumentUploadForm leaseId={leaseId} revalidatePathValue={revalidatePathValue} />
      </div>
    </div>
  );
}

function DocField({
  label,
  name,
  type = "text",
  step,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  step?: string;
  defaultValue?: string | number | null;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1">{label}</label>
      <input
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
      />
    </div>
  );
}

function DocumentUploadForm({
  leaseId,
  revalidatePathValue,
}: {
  leaseId: number;
  revalidatePathValue: string;
}) {
  async function upload(formData: FormData) {
    "use server";
    const category = String(formData.get("category") ?? "other") as FileCategory;
    await uploadFile(
      "lease",
      leaseId,
      FILE_CATEGORIES.includes(category) ? category : "other",
      revalidatePathValue,
      formData
    );
  }

  return (
    <form action={upload} encType="multipart/form-data" className="flex items-center gap-2">
      <select name="category" className="rounded border border-slate-300 px-2 py-1.5 text-sm">
        {DOCUMENT_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input type="file" name="file" required className="text-sm" />
      <button
        type="submit"
        className="rounded bg-slate-900 text-white px-3 py-1.5 text-sm font-medium hover:bg-slate-700"
      >
        Upload
      </button>
    </form>
  );
}
