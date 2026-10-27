import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { recognizeTidFromImage } from '@/lib/tidExtractor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { imageBase64, url } = body;

    let buffer: Buffer | null = null;

    if (imageBase64 && typeof imageBase64 === 'string') {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    } else if (url && typeof url === 'string') {
      if (url.startsWith('data:image')) {
        const base64Data = url.replace(/^data:image\/\w+;base64,/, '');
        buffer = Buffer.from(base64Data, 'base64');
      } else if (url.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), 'public', url);
        if (fs.existsSync(filePath)) {
          buffer = fs.readFileSync(filePath);
        }
      } else if (url.startsWith('http://') || url.startsWith('https://')) {
        try {
          const res = await fetch(url);
          const ab = await res.arrayBuffer();
          buffer = Buffer.from(ab);
        } catch (fetchErr) {
          console.warn('Failed to fetch image url for OCR:', fetchErr);
        }
      }
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json({ success: true, tid: null });
    }

    const { tid } = await recognizeTidFromImage(buffer);
    return NextResponse.json({ success: true, tid });
  } catch (err) {
    console.error('Error in /api/extract-tid:', err);
    return NextResponse.json({ success: true, tid: null });
  }
}
