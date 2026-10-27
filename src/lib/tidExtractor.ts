import { createWorker } from 'tesseract.js';
import os from 'os';
import path from 'path';
import { extractTidFromText } from './tidRegex';

export { extractTidFromText };

let sharedWorker: any = null;
let workerInitializing = false;

async function getWorker() {
  if (sharedWorker) return sharedWorker;
  if (workerInitializing) {
    let waited = 0;
    while (workerInitializing && !sharedWorker && waited < 5000) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      waited += 100;
    }
    if (sharedWorker) return sharedWorker;
  }

  workerInitializing = true;
  try {
    const cachePath = os.tmpdir();
    const workerPath = path.resolve(process.cwd(), 'node_modules/tesseract.js/src/worker-script/node/index.js');
    sharedWorker = await createWorker('eng', 1, {
      cachePath,
      workerPath: typeof window === 'undefined' ? workerPath : undefined,
    });
  } catch (err) {
    console.error('Failed to create Tesseract worker:', err);
    sharedWorker = null;
  } finally {
    workerInitializing = false;
  }
  return sharedWorker;
}

export async function recognizeTidFromImage(imageBuffer: Buffer): Promise<{ tid: string | null; rawText: string }> {
  const timeoutPromise = new Promise<{ tid: string | null; rawText: string }>((resolve) => {
    setTimeout(() => {
      resolve({ tid: null, rawText: '' });
    }, 6000);
  });

  const workerPromise = (async () => {
    try {
      const worker = await getWorker();
      if (!worker) {
        return { tid: null, rawText: '' };
      }

      const ret = await worker.recognize(imageBuffer);
      const rawText = ret?.data?.text || '';
      const tid = extractTidFromText(rawText);

      return { tid, rawText };
    } catch (err) {
      console.error('Error during OCR TID recognition:', err);
      return { tid: null, rawText: '' };
    }
  })();

  return Promise.race([workerPromise, timeoutPromise]);
}
