import { createProperty } from "../actions";

export default function NewPropertyPage() {
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-lg font-semibold">Add property</h1>
      <form action={createProperty} className="space-y-4 bg-white border border-slate-200 rounded-lg p-4">
        <Field label="Name" name="name" required />
        <Field label="Street address" name="addressStreet" required />
        <div className="grid grid-cols-3 gap-3">
          <Field label="City" name="addressCity" required />
          <Field label="State" name="addressState" required />
          <Field label="ZIP" name="addressZip" required />
        </div>
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
          Save property
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  required,
}: {
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        required={required}
        className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
      />
    </div>
  );
}
