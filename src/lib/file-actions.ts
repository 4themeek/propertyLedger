"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { files, type AttachedToType, type FileCategory } from "@/db/schema";
import { putObject, deleteObject, makeObjectKey } from "@/lib/r2";

export async function uploadFile(
  attachedToType: AttachedToType,
  attachedToId: number,
  category: FileCategory,
  revalidatePathValue: string,
  formData: FormData
) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a file to upload");
  }

  const key = makeObjectKey(attachedToType, attachedToId, category, file.name);
  const bytes = await file.arrayBuffer();
  await putObject(key, bytes, file.type || "application/octet-stream");

  await db.insert(files).values({
    r2Key: key,
    originalFilename: file.name,
    contentType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    category,
    attachedToType,
    attachedToId,
  });

  revalidatePath(revalidatePathValue);
}

export async function deleteFile(fileId: number, revalidatePathValue: string) {
  const [record] = await db.select().from(files).where(eq(files.id, fileId)).limit(1);
  if (record) {
    await deleteObject(record.r2Key);
    await db.delete(files).where(eq(files.id, fileId));
  }
  revalidatePath(revalidatePathValue);
}
