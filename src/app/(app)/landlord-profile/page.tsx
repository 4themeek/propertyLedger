import { db } from "@/db";
import { landlordProfile } from "@/db/schema";
import { saveLandlordProfile } from "./actions";

export const dynamic = "force-dynamic";

export default async function LandlordProfilePage() {
  const [profile] = await db.select().from(landlordProfile).limit(1);

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Landlord profile</h1>
        <p className="text-sm text-slate-500">
          Used to fill in generated lease documents. One entity for the whole app.
        </p>
      </div>
      <form action={saveLandlordProfile} className="space-y-4 bg-white border border-slate-200 rounded-lg p-4">
        <Field label="Entity name" name="name" defaultValue={profile?.name} required />
        <Field label="Address line 1" name="addressLine1" defaultValue={profile?.addressLine1} />
        <Field label="City, State ZIP" name="cityStateZip" defaultValue={profile?.cityStateZip} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Signatory name" name="signatoryName" defaultValue={profile?.signatoryName} />
          <Field label="Signatory title" name="signatoryTitle" defaultValue={profile?.signatoryTitle} />
        </div>
        <button
          type="submit"
          className="rounded bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700"
        >
          Save
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string | null;
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
        defaultValue={defaultValue ?? ""}
        className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
      />
    </div>
  );
}
