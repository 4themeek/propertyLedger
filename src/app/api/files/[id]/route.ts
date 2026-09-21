import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { files } from "@/db/schema";
import { getObject, deleteObject } from "@/lib/r2";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const fileId = Number(id);
  if (!Number.isInteger(fileId)) {
    return NextResponse.json({ error: "Invalid file id" }, { status: 400 });
  }

  const [record] = await db.select().from(files).where(eq(files.id, fileId)).limit(1);
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const object = await getObject(record.r2Key);
  if (!object) {
    return NextResponse.json({ error: "File missing in storage" }, { status: 404 });
  }

  return new NextResponse(object.body, {
    headers: {
      "Content-Type": record.contentType,
      "Content-Disposition": `inline; filename="${record.originalFilename}"`,
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const fileId = Number(id);
  if (!Number.isInteger(fileId)) {
    return NextResponse.json({ error: "Invalid file id" }, { status: 400 });
  }

  const [record] = await db.select().from(files).where(eq(files.id, fileId)).limit(1);
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteObject(record.r2Key);
  await db.delete(files).where(eq(files.id, fileId));

  return NextResponse.json({ ok: true });
}
