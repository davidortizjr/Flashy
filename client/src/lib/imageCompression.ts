// Downscales and re-compresses a photo before upload. This matters a lot
// once several photos can be uploaded together: modern phone photos are
// commonly 3-8MB each, and Vercel's serverless functions reject request
// bodies over 4.5MB — so without this, picking more than one full-res photo
// could fail outright in production even though it works fine locally.
const MAX_DIMENSION = 1800
const JPEG_QUALITY = 0.82

export async function compressImage(file: File): Promise<File> {
  // Nothing to do for non-images (PDFs, text) or already-small files.
  if (!file.type.startsWith('image/') || file.size < 400 * 1024) {
    return file
  }

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file

    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
    )
    if (!blob || blob.size >= file.size) return file

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], newName, { type: 'image/jpeg' })
  } catch {
    // If anything about compression fails (unsupported format, etc.), fall
    // back to the original file rather than blocking the upload.
    return file
  }
}

export async function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map(compressImage))
}
