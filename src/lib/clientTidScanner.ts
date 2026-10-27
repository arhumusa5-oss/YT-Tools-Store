import { extractTidFromText } from './tidRegex';

let browserWorker: any = null;
let initializing = false;

export async function scanTidFromClient(imageSource: string | File | Blob): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    const { createWorker } = await import('tesseract.js');

    if (!browserWorker) {
      if (initializing) {
        let waited = 0;
        while (initializing && !browserWorker && waited < 12000) {
          await new Promise((r) => setTimeout(r, 100));
          waited += 100;
        }
      } else {
        initializing = true;
        try {
          browserWorker = await createWorker('eng');
        } catch (initErr) {
          console.error('[TID Scanner Client] Init failed:', initErr);
          browserWorker = null;
        } finally {
          initializing = false;
        }
      }
    }

    if (!browserWorker) return null;

    const ret = await browserWorker.recognize(imageSource);
    const text = ret?.data?.text || '';
    const extracted = extractTidFromText(text);
    return extracted;
  } catch (err) {
    console.warn('[TID Scanner Client] Recognition error:', err);
    return null;
  }
}
