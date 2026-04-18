export function blobImageSrc(url: string): string {
  if (url.includes("blob.vercel-storage.com")) {
    return `/api/image-produit?url=${encodeURIComponent(url)}`;
  }
  // Anciennes images locales (/uploads/...) servies directement
  return url;
}
