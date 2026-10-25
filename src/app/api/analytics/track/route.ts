import { NextRequest, NextResponse } from 'next/server';
import { recordPageview, recordHeartbeat, PageviewEvent, ActiveSessionHeartbeat } from '@/lib/analytics';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, visitorId, sessionId, path, title, referrer, deviceType, isAdmin } = body;

    // Check if request is from admin or admin path
    const refererHeader = req.headers.get('referer') || '';
    const userAgent = req.headers.get('user-agent') || '';
    const isBot = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp/i.test(userAgent);

    if (isBot) {
      return NextResponse.json({ success: true, ignored: 'bot' });
    }

    const detectedAdmin =
      Boolean(isAdmin) ||
      (path && String(path).startsWith('/admin')) ||
      refererHeader.includes('/admin');

    if (detectedAdmin) {
      return NextResponse.json({ success: true, ignored: 'admin' });
    }

    if (!visitorId || !sessionId) {
      return NextResponse.json({ success: false, error: 'Missing visitor or session id' }, { status: 400 });
    }

    if (type === 'heartbeat') {
      const heartbeat: ActiveSessionHeartbeat = {
        visitorId: String(visitorId),
        sessionId: String(sessionId),
        path: String(path || '/'),
        deviceType: deviceType || 'desktop',
        isAdmin: false,
      };
      await recordHeartbeat(heartbeat);
      return NextResponse.json({ success: true });
    }

    // Default: pageview
    const event: PageviewEvent = {
      visitorId: String(visitorId),
      sessionId: String(sessionId),
      path: String(path || '/'),
      title: title ? String(title) : undefined,
      referrer: referrer ? String(referrer) : undefined,
      deviceType: deviceType || 'desktop',
      browser: userAgent.slice(0, 64),
      isAdmin: false,
    };

    await recordPageview(event);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics track error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
