"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { tenants } from "@/db/schema";

export async function createTenant(formData: FormData) {
  const entityName = String(formData.get("entityName") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim() || null;
  const contactEmail = String(formData.get("contactEmail") ?? "").trim() || null;
  const contactPhone = String(formData.get("contactPhone") ?? "").trim() || null;
  const addressLine1 = String(formData.get("addressLine1") ?? "").trim() || null;
  const cityStateZip = String(formData.get("cityStateZip") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!entityName) {
    throw new Error("Tenant entity name is required");
  }

  const [created] = await db
    .insert(tenants)
    .values({ entityName, contactName, contactEmail, contactPhone, addressLine1, cityStateZip, notes })
    .returning({ id: tenants.id });

  revalidatePath("/tenants");
  redirect(`/tenants/${created.id}`);
}
