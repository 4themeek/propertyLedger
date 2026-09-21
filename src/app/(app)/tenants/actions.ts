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
  const mailingAddress = String(formData.get("mailingAddress") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!entityName) {
    throw new Error("Tenant entity name is required");
  }

  const [created] = await db
    .insert(tenants)
    .values({ entityName, contactName, contactEmail, contactPhone, mailingAddress, notes })
    .returning({ id: tenants.id });

  revalidatePath("/tenants");
  redirect(`/tenants/${created.id}`);
}
