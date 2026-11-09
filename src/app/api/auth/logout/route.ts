import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Admin logged out successfully' });
  response.cookies.delete('yt_admin_session');
  return response;
}
