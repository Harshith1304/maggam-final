// Runs in the browser before an upload: shrinks very large photos so they upload fast and load fast.
export async function prepareImage(file, maxW = 2400) {
  if (file.type === 'image/gif') return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxW / bmp.width);
    if (scale === 1 && file.size < 3.5 * 1024 * 1024) return file;
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.88));
    return blob ? new File([blob], 'cover.jpg', { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}
