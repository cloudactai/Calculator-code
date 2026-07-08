// Reads an image File and returns a compressed JPEG data URL scaled to fit
// within `maxDimension` px on its longest side. Profile photos straight off a
// phone are easily several MB — the auth server rejects anything whose base64
// payload exceeds ~1.5MB — so downscaling here keeps uploads well under that
// limit and normalizes any PNG/GIF/WebP input to a format the backend accepts.
export function fileToResizedDataUrl(
  file,
  { maxDimension = 512, quality = 0.85 } = {}
) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not load the selected image."));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Image processing is not supported in this browser."));
          return;
        }
        // White backdrop so transparent PNGs don't flatten to black on JPEG.
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
