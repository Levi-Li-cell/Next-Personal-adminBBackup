export async function uploadImageToBlob(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();
  if (!result.success || !result.url) {
    throw new Error(result.error || "上传失败");
  }

  return result.url as string;
}
