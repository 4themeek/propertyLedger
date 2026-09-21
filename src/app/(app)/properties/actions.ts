"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { properties, suites } from "@/db/schema";

export async function createProperty(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const addressStreet = String(formData.get("addressStreet") ?? "").trim();
  const addressCity = String(formData.get("addressCity") ?? "").trim();
  const addressState = String(formData.get("addressState") ?? "").trim();
  const addressZip = String(formData.get("addressZip") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name || !addressStreet || !addressCity || !addressState || !addressZip) {
    throw new Error("Name and full address are required");
  }

  const [created] = await db
    .insert(properties)
    .values({ name, addressStreet, addressCity, addressState, addressZip, notes })
    .returning({ id: properties.id });

  revalidatePath("/");
  redirect(`/properties/${created.id}`);
}

export async function createSuite(propertyId: number, formData: FormData) {
  const suiteNumber = String(formData.get("suiteNumber") ?? "").trim();
  const rentableSqftRaw = String(formData.get("rentableSqft") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!suiteNumber) {
    throw new Error("Suite number is required");
  }

  await db.insert(suites).values({
    propertyId,
    suiteNumber,
    rentableSqft: rentableSqftRaw || null,
    notes,
  });

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/");
}

export async function deleteSuite(suiteId: number, propertyId: number) {
  await db.delete(suites).where(eq(suites.id, suiteId));
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/");
}
