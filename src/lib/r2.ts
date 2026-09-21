import { AwsClient } from "aws4fetch";

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error("R2 environment variables are not fully set");
  }

  return {
    accountId,
    bucketName,
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    client: new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: "s3",
      region: "auto",
    }),
  };
}

export async function putObject(
  key: string,
  body: ArrayBuffer,
  contentType: string
): Promise<void> {
  const { client, endpoint, bucketName } = getR2Config();
  const res = await client.fetch(`${endpoint}/${bucketName}/${key}`, {
    method: "PUT",
    body,
    headers: { "Content-Type": contentType },
  });
  if (!res.ok) {
    throw new Error(`R2 upload failed: ${res.status} ${await res.text()}`);
  }
}

export async function getObject(
  key: string
): Promise<{ body: ReadableStream; contentType: string } | null> {
  const { client, endpoint, bucketName } = getR2Config();
  const res = await client.fetch(`${endpoint}/${bucketName}/${key}`, {
    method: "GET",
  });
  if (res.status === 404) return null;
  if (!res.ok || !res.body) {
    throw new Error(`R2 download failed: ${res.status} ${await res.text()}`);
  }
  return {
    body: res.body,
    contentType: res.headers.get("content-type") ?? "application/octet-stream",
  };
}

export async function deleteObject(key: string): Promise<void> {
  const { client, endpoint, bucketName } = getR2Config();
  const res = await client.fetch(`${endpoint}/${bucketName}/${key}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`R2 delete failed: ${res.status} ${await res.text()}`);
  }
}

export function makeObjectKey(
  attachedToType: string,
  attachedToId: number,
  category: string,
  originalFilename: string
): string {
  const safeName = originalFilename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const unique = crypto.randomUUID();
  return `${attachedToType}/${attachedToId}/${category}/${unique}-${safeName}`;
}
