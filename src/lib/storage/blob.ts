import { del } from "@vercel/blob";

export async function deleteBlobUrls(urls: string[]) {
  const uniqueUrls = [...new Set(urls.filter(Boolean))];
  if (uniqueUrls.length === 0) {
    return;
  }

  await Promise.allSettled(uniqueUrls.map((url) => del(url)));
}
