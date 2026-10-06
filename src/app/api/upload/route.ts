import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded.' }, { status: 400 });
    }

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file format. Please upload JPG, PNG, WebP, or SVG.' },
        { status: 400 }
      );
    }

    // Limit size to 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File is too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Try saving to public/uploads
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const extension = path.extname(file.name) || '.png';
      const cleanBase = path.basename(file.name, extension).replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `tool_${Date.now()}_${cleanBase}${extension}`;
      const filePath = path.join(uploadsDir, filename);

      fs.writeFileSync(filePath, buffer);
      const publicUrl = `/uploads/${filename}`;

      return NextResponse.json({
        success: true,
        url: publicUrl,
        filename,
      });
    } catch {
      // Fallback for environments with read-only filesystem (e.g. serverless):
      // Return base64 Data URI
      const base64 = buffer.toString('base64');
      const dataUri = `data:${file.type || 'image/png'};base64,${base64}`;

      return NextResponse.json({
        success: true,
        url: dataUri,
        filename: file.name,
      });
    }
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to process file upload.' },
      { status: 500 }
    );
  }
}
