/**
 * Hand a Blob to the browser as a file download. Shared so the two places
 * that offer a generated agreement PDF — the Draft Agreements panel and the
 * matter's Documents folder — behave identically, including revoking the
 * object URL afterwards.
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default downloadBlob;
