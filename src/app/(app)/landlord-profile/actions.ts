"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { landlordProfile } from "@/db/schema";

export async function saveLandlordProfile(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const addressLine1 = String(formData.get("addressLine1") ?? "").trim() || null;
  const cityStateZip = String(formData.get("cityStateZip") ?? "").trim() || null;
  const signatoryName = String(formData.get("signatoryName") ?? "").trim() || null;
  const signatoryTitle = String(formData.get("signatoryTitle") ?? "").trim() || null;

  if (!name) {
    throw new Error("Landlord entity name is required");
  }

  const [existing] = await db.select({ id: landlordProfile.id }).from(landlordProfile).limit(1);

  if (existing) {
    await db
      .update(landlordProfile)
      .set({ name, addressLine1, cityStateZip, signatoryName, signatoryTitle });
  } else {
    await db.insert(landlordProfile).values({ name, addressLine1, cityStateZip, signatoryName, signatoryTitle });
  }

  revalidatePath("/landlord-profile");
}
