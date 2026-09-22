import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leases, tenants } from "@/db/schema";
import { generateLeaseDocument } from "@/lib/lease-document";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const leaseId = Number(id);
  if (!Number.isInteger(leaseId)) {
    return NextResponse.json({ error: "Invalid lease id" }, { status: 400 });
  }

  const [lease] = await db.select().from(leases).where(eq(leases.id, leaseId)).limit(1);
  if (!lease) {
    return NextResponse.json({ error: "Lease not found" }, { status: 404 });
  }
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, lease.tenantId)).limit(1);

  let buffer: Buffer;
  try {
    buffer = await generateLeaseDocument(leaseId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate document";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const safeTenantName = (tenant?.entityName ?? "lease").replace(/[^a-zA-Z0-9_-]+/g, "_");
  const filename = `Lease-${safeTenantName}-${leaseId}.docx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
