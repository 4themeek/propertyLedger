import { createTenant } from "../actions";

export default function NewTenantPage() {
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-lg font-semibold">Add tenant</h1>
      <form action={createTenant} className="space-y-4 bg-white border border-slate-200 rounded-lg p-4">
        <Field label="Entity name" name="entityName" required />
        <Field label="Contact name" name="contactName" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contact email" name="contactEmail" type="email" />
          <Field label="Contact phone" name="contactPhone" />
        </div>
        <Field label="Address line 1" name="addressLine1" />
        <Field label="City, State ZIP" name="cityStateZip" />
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            name="notes"
            rows={3}
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <button
          type="submit"
          className="rounded bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700"
        >
          Save tenant
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
      />
    </div>
  );
}
