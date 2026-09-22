import { createTemplate } from "../actions";

export default function NewLeaseTemplatePage() {
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-lg font-semibold">Add lease template</h1>
      <form action={createTemplate} className="space-y-4 bg-white border border-slate-200 rounded-lg p-4">
        <div>
          <label className="block text-sm font-medium mb-1">Template name</label>
          <input
            name="name"
            required
            placeholder="e.g. Standard office suite"
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Permitted use</label>
          <input name="permittedUse" className="w-full rounded border border-slate-300 px-3 py-2" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Initial term (months)</label>
            <input
              type="number"
              name="initialTermMonths"
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Renewal option (years)</label>
            <input
              type="number"
              name="renewalOptionYears"
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Renewal notice (days)</label>
            <input
              type="number"
              name="renewalNoticeDays"
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea name="notes" rows={3} className="w-full rounded border border-slate-300 px-3 py-2" />
        </div>
        <button
          type="submit"
          className="rounded bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700"
        >
          Save template
        </button>
      </form>
    </div>
  );
}
