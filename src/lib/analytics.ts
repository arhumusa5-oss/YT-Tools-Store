import fs from 'fs';
import path from 'path';
import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { Order } from './types';

export interface PageviewEvent {
  visitorId: string;
  sessionId: string;
  path: string;
  title?: string;
  referrer?: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  browser?: string;
  os?: string;
  isAdmin?: boolean;
}

export interface ActiveSessionHeartbeat {
  sessionId: string;
  visitorId: string;
  path: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  isAdmin?: boolean;
}

export interface PeriodStats {
  visitors: number;
  pageviews: number;
  orders: number;
  conversionRate: number;
  revenuePKR: number;
}

export interface AnalyticsSummary {
  liveVisitorsCount: number;
  liveSessions: Array<{
    sessionId: string;
    visitorId: string;
    lastPath: string;
    deviceType: string;
    secondsAgo: number;
  }>;
  today: PeriodStats;
  yesterday: PeriodStats;
  last7Days: PeriodStats;
  thisMonth: PeriodStats;
  lifetime: PeriodStats;
  dailyTrends: Array<{
    date: string;
    displayDate: string;
    visitors: number;
    pageviews: number;
    orders: number;
    conversionRate: number;
    revenuePKR: number;
  }>;
  topPages: Array<{
    path: string;
    views: number;
    visitors: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    views: number;
    visitors: number;
    percentage: number;
  }>;
  topReferrers: Array<{
    source: string;
    views: number;
    visitors: number;
    percentage: number;
  }>;
  recentPageviews: Array<{
    path: string;
    title: string;
    deviceType: string;
    referrer: string;
    createdAt: string;
    timeAgo: string;
  }>;
}

function findDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL;
  if (process.env.STORAGE_URL) return process.env.STORAGE_URL;
  if (process.env.STORAGE_DATABASE_URL) return process.env.STORAGE_DATABASE_URL;
  if (process.env.STORAGE_POSTGRES_URL) return process.env.STORAGE_POSTGRES_URL;
  if (process.env.NEON_DATABASE_URL) return process.env.NEON_DATABASE_URL;
  if (process.env.NEON2_DATABASE_URL) return process.env.NEON2_DATABASE_URL;
  if (process.env.NEON2_URL) return process.env.NEON2_URL;

  for (const [key, value] of Object.entries(process.env)) {
    if (
      typeof value === 'string' &&
      (value.startsWith('postgres://') || value.startsWith('postgresql://'))
    ) {
      return value;
    }
  }
  return undefined;
}

const DATABASE_URL = findDatabaseUrl();
let sql: NeonQueryFunction<false, false> | null = null;
let tablesInitialized = false;

if (DATABASE_URL) {
  try {
    sql = neon(DATABASE_URL);
  } catch {
    sql = null;
  }
}

// Local JSON fallback in case database is offline
const DATA_DIR = path.join(process.cwd(), 'data');
const LOCAL_FILE = path.join(DATA_DIR, 'analytics.json');

interface LocalAnalyticsData {
  pageviews: Array<PageviewEvent & { id: string; createdAt: string }>;
  activeSessions: Record<string, { visitorId: string; lastPath: string; deviceType: string; lastActiveAt: number; isAdmin: boolean }>;
}

function getLocalData(): LocalAnalyticsData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(LOCAL_FILE)) {
      const content = fs.readFileSync(LOCAL_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error reading local analytics:', e);
  }
  return { pageviews: [], activeSessions: {} };
}

function saveLocalData(data: LocalAnalyticsData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving local analytics:', e);
  }
}

export async function ensureAnalyticsTables() {
  if (!sql || tablesInitialized) return;
  try {
    await sql.query(`
      CREATE TABLE IF NOT EXISTS yt_pageviews (
        id SERIAL PRIMARY KEY,
        visitor_id VARCHAR(64) NOT NULL,
        session_id VARCHAR(64) NOT NULL,
        path VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        referrer VARCHAR(255),
        device_type VARCHAR(32) DEFAULT 'desktop',
        browser VARCHAR(64),
        os VARCHAR(64),
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS yt_active_sessions (
        session_id VARCHAR(64) PRIMARY KEY,
        visitor_id VARCHAR(64) NOT NULL,
        last_path VARCHAR(255) NOT NULL,
        device_type VARCHAR(32) DEFAULT 'desktop',
        last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_admin BOOLEAN DEFAULT FALSE
      );
      CREATE INDEX IF NOT EXISTS idx_pageviews_created_at ON yt_pageviews(created_at);
      CREATE INDEX IF NOT EXISTS idx_pageviews_visitor_id ON yt_pageviews(visitor_id);
      CREATE INDEX IF NOT EXISTS idx_active_sessions_last_active ON yt_active_sessions(last_active_at);
    `);
    tablesInitialized = true;
  } catch (err) {
    console.error('Error ensuring analytics tables:', err);
  }
}

export async function recordPageview(event: PageviewEvent): Promise<boolean> {
  // If explicitly flagged as admin, do not pollute public analytics
  if (event.isAdmin) {
    return false;
  }

  // Ensure tables exist
  await ensureAnalyticsTables();

  const visitorId = (event.visitorId || 'v_anon').slice(0, 64);
  const sessionId = (event.sessionId || 's_anon').slice(0, 64);
  const pathVal = (event.path || '/').slice(0, 255);
  const titleVal = (event.title || '').slice(0, 255);
  const referrerVal = (event.referrer || '').slice(0, 255);
  const deviceTypeVal = (event.deviceType || 'desktop').slice(0, 32);
  const browserVal = (event.browser || '').slice(0, 64);
  const osVal = (event.os || '').slice(0, 64);
  const isAdminVal = false;

  if (sql) {
    try {
      await sql`
        INSERT INTO yt_pageviews (visitor_id, session_id, path, title, referrer, device_type, browser, os, is_admin)
        VALUES (${visitorId}, ${sessionId}, ${pathVal}, ${titleVal}, ${referrerVal}, ${deviceTypeVal}, ${browserVal}, ${osVal}, ${isAdminVal})
      `;

      await sql`
        INSERT INTO yt_active_sessions (session_id, visitor_id, last_path, device_type, last_active_at, is_admin)
        VALUES (${sessionId}, ${visitorId}, ${pathVal}, ${deviceTypeVal}, CURRENT_TIMESTAMP, ${isAdminVal})
        ON CONFLICT (session_id) DO UPDATE SET
          last_active_at = CURRENT_TIMESTAMP,
          last_path = EXCLUDED.last_path,
          device_type = EXCLUDED.device_type,
          is_admin = EXCLUDED.is_admin
      `;
      return true;
    } catch (err) {
      console.error('Failed to record pageview to Neon, falling back to local:', err);
    }
  }

  // Fallback to local file
  try {
    const local = getLocalData();
    local.pageviews.push({
      ...event,
      id: `pv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    });
    // Limit local array to last 5,000 pageviews
    if (local.pageviews.length > 5000) {
      local.pageviews = local.pageviews.slice(-5000);
    }
    local.activeSessions[sessionId] = {
      visitorId,
      lastPath: pathVal,
      deviceType: deviceTypeVal,
      lastActiveAt: Date.now(),
      isAdmin: false,
    };
    saveLocalData(local);
    return true;
  } catch (err) {
    console.error('Local fallback failed:', err);
    return false;
  }
}

export async function recordHeartbeat(heartbeat: ActiveSessionHeartbeat): Promise<boolean> {
  if (heartbeat.isAdmin) return false;

  await ensureAnalyticsTables();

  const visitorId = (heartbeat.visitorId || 'v_anon').slice(0, 64);
  const sessionId = (heartbeat.sessionId || 's_anon').slice(0, 64);
  const pathVal = (heartbeat.path || '/').slice(0, 255);
  const deviceTypeVal = (heartbeat.deviceType || 'desktop').slice(0, 32);

  if (sql) {
    try {
      await sql`
        INSERT INTO yt_active_sessions (session_id, visitor_id, last_path, device_type, last_active_at, is_admin)
        VALUES (${sessionId}, ${visitorId}, ${pathVal}, ${deviceTypeVal}, CURRENT_TIMESTAMP, false)
        ON CONFLICT (session_id) DO UPDATE SET
          last_active_at = CURRENT_TIMESTAMP,
          last_path = EXCLUDED.last_path,
          device_type = EXCLUDED.device_type,
          is_admin = false
      `;
      return true;
    } catch (err) {
      console.error('Failed heartbeat to Neon:', err);
    }
  }

  try {
    const local = getLocalData();
    local.activeSessions[sessionId] = {
      visitorId,
      lastPath: pathVal,
      deviceType: deviceTypeVal,
      lastActiveAt: Date.now(),
      isAdmin: false,
    };
    saveLocalData(local);
    return true;
  } catch {
    return false;
  }
}

function getTimeAgoString(secondsAgo: number): string {
  if (secondsAgo < 60) return `${Math.max(1, secondsAgo)}s ago`;
  const mins = Math.floor(secondsAgo / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export async function getAnalyticsSummary(allOrders: Order[] = []): Promise<AnalyticsSummary> {
  await ensureAnalyticsTables();

  // Helper to calculate order stats for given date range
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

  const sevenDaysAgoDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const firstOfMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  // Compute order stats per day map
  const ordersByDate = new Map<string, { count: number; revenue: number }>();
  allOrders.forEach((o) => {
    if (!o.createdAt) return;
    const dateStr = String(o.createdAt).slice(0, 10);
    const existing = ordersByDate.get(dateStr) || { count: 0, revenue: 0 };
    existing.count += 1;
    existing.revenue += Number(o.totalPKR) || 0;
    ordersByDate.set(dateStr, existing);
  });

  const getOrdersInInterval = (filterFn: (date: Date) => boolean) => {
    let count = 0;
    let revenue = 0;
    allOrders.forEach((o) => {
      if (!o.createdAt) return;
      const d = new Date(o.createdAt);
      if (filterFn(d)) {
        count += 1;
        revenue += Number(o.totalPKR) || 0;
      }
    });
    return { count, revenue };
  };

  const todayOrders = getOrdersInInterval((d) => d.toISOString().slice(0, 10) === todayStr);
  const yesterdayOrders = getOrdersInInterval((d) => d.toISOString().slice(0, 10) === yesterdayStr);
  const last7DaysOrders = getOrdersInInterval((d) => d.getTime() >= sevenDaysAgoDate.getTime());
  const thisMonthOrders = getOrdersInInterval((d) => d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth());
  const lifetimeOrders = {
    count: allOrders.length,
    revenue: allOrders.reduce((sum, o) => sum + (Number(o.totalPKR) || 0), 0),
  };

  if (sql) {
    try {
      // 1. Live Visitors
      const liveVisitorsRes = await sql.query(`
        SELECT COUNT(DISTINCT visitor_id)::int AS count 
        FROM yt_active_sessions 
        WHERE is_admin = FALSE 
          AND last_active_at > NOW() - INTERVAL '3 minutes'
      `);
      const liveVisitorsCount = liveVisitorsRes[0]?.count || 0;

      // 2. Live Active Sessions
      const liveSessionsRes = await sql.query(`
        SELECT 
          session_id, 
          visitor_id, 
          last_path, 
          COALESCE(device_type, 'desktop') AS device_type,
          EXTRACT(EPOCH FROM (NOW() - last_active_at))::int AS seconds_ago
        FROM yt_active_sessions 
        WHERE is_admin = FALSE 
          AND last_active_at > NOW() - INTERVAL '3 minutes'
        ORDER BY last_active_at DESC 
        LIMIT 20
      `);

      const liveSessions = (liveSessionsRes || []).map((row: any) => ({
        sessionId: row.session_id,
        visitorId: row.visitor_id,
        lastPath: row.last_path,
        deviceType: row.device_type,
        secondsAgo: Math.max(0, row.seconds_ago || 0),
      }));

      // 3. Period Stats (Today, Yesterday, Last 7 days, This Month, Lifetime)
      const periodStatsRes = await sql.query(`
        SELECT 
          COUNT(DISTINCT CASE WHEN created_at >= CURRENT_DATE THEN visitor_id END)::int AS today_visitors,
          COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END)::int AS today_views,

          COUNT(DISTINCT CASE WHEN created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE THEN visitor_id END)::int AS yesterday_visitors,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE THEN 1 END)::int AS yesterday_views,

          COUNT(DISTINCT CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN visitor_id END)::int AS week_visitors,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END)::int AS week_views,

          COUNT(DISTINCT CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN visitor_id END)::int AS month_visitors,
          COUNT(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END)::int AS month_views,

          COUNT(DISTINCT visitor_id)::int AS lifetime_visitors,
          COUNT(1)::int AS lifetime_views
        FROM yt_pageviews
        WHERE is_admin = FALSE
      `);

      const pRow = periodStatsRes[0] || {};
      const todayVisitors = pRow.today_visitors || 0;
      const todayViews = pRow.today_views || 0;
      const yesterdayVisitors = pRow.yesterday_visitors || 0;
      const yesterdayViews = pRow.yesterday_views || 0;
      const weekVisitors = pRow.week_visitors || 0;
      const weekViews = pRow.week_views || 0;
      const monthVisitors = pRow.month_visitors || 0;
      const monthViews = pRow.month_views || 0;
      const lifetimeVisitors = pRow.lifetime_visitors || 0;
      const lifetimeViews = pRow.lifetime_views || 0;

      // 4. Daily Trends for past 30 days
      const dailyTrendsRes = await sql.query(`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM-DD') AS day,
          COUNT(DISTINCT visitor_id)::int AS visitors,
          COUNT(id)::int AS pageviews
        FROM yt_pageviews
        WHERE is_admin = FALSE 
          AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY day
        ORDER BY day ASC
      `);

      const trafficByDay = new Map<string, { visitors: number; pageviews: number }>();
      (dailyTrendsRes || []).forEach((r: any) => {
        trafficByDay.set(r.day, { visitors: r.visitors, pageviews: r.pageviews });
      });

      // Construct continuous 30-day array
      const dailyTrends: AnalyticsSummary['dailyTrends'] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStr = d.toISOString().slice(0, 10);
        const traffic = trafficByDay.get(dayStr) || { visitors: 0, pageviews: 0 };
        const orderData = ordersByDate.get(dayStr) || { count: 0, revenue: 0 };
        const conversion = traffic.visitors > 0 ? (orderData.count / traffic.visitors) * 100 : 0;

        dailyTrends.push({
          date: dayStr,
          displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          visitors: traffic.visitors,
          pageviews: traffic.pageviews,
          orders: orderData.count,
          conversionRate: Number(conversion.toFixed(1)),
          revenuePKR: orderData.revenue,
        });
      }

      // 5. Top Visited Pages
      const topPagesRes = await sql.query(`
        SELECT 
          path,
          COUNT(id)::int AS views,
          COUNT(DISTINCT visitor_id)::int AS visitors
        FROM yt_pageviews
        WHERE is_admin = FALSE 
          AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY path
        ORDER BY views DESC 
        LIMIT 12
      `);

      const topPages = (topPagesRes || []).map((r: any) => ({
        path: r.path,
        views: r.views,
        visitors: r.visitors,
      }));

      // 6. Device Breakdown
      const deviceRes = await sql.query(`
        SELECT 
          COALESCE(device_type, 'desktop') AS device,
          COUNT(id)::int AS views,
          COUNT(DISTINCT visitor_id)::int AS visitors
        FROM yt_pageviews
        WHERE is_admin = FALSE 
          AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY device
        ORDER BY views DESC
      `);

      const totalDeviceViews = (deviceRes || []).reduce((acc: number, r: any) => acc + (r.views || 0), 0) || 1;
      const deviceBreakdown = (deviceRes || []).map((r: any) => ({
        device: r.device,
        views: r.views,
        visitors: r.visitors,
        percentage: Math.round(((r.views || 0) / totalDeviceViews) * 100),
      }));

      // 7. Top Referrers
      const referrersRes = await sql.query(`
        SELECT 
          COALESCE(NULLIF(referrer, ''), 'Direct / WhatsApp / Social') AS source,
          COUNT(id)::int AS views,
          COUNT(DISTINCT visitor_id)::int AS visitors
        FROM yt_pageviews
        WHERE is_admin = FALSE 
          AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY source
        ORDER BY views DESC 
        LIMIT 8
      `);

      const totalReferrerViews = (referrersRes || []).reduce((acc: number, r: any) => acc + (r.views || 0), 0) || 1;
      const topReferrers = (referrersRes || []).map((r: any) => ({
        source: r.source,
        views: r.views,
        visitors: r.visitors,
        percentage: Math.round(((r.views || 0) / totalReferrerViews) * 100),
      }));

      // 8. Recent 20 pageviews
      const recentRes = await sql.query(`
        SELECT 
          path, 
          COALESCE(title, path) AS title, 
          COALESCE(device_type, 'desktop') AS device_type,
          COALESCE(NULLIF(referrer, ''), 'Direct') AS referrer,
          created_at,
          EXTRACT(EPOCH FROM (NOW() - created_at))::int AS seconds_ago
        FROM yt_pageviews
        WHERE is_admin = FALSE
        ORDER BY created_at DESC 
        LIMIT 20
      `);

      const recentPageviews = (recentRes || []).map((r: any) => ({
        path: r.path,
        title: r.title,
        deviceType: r.device_type,
        referrer: r.referrer,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        timeAgo: getTimeAgoString(r.seconds_ago || 0),
      }));

      return {
        liveVisitorsCount,
        liveSessions,
        today: {
          visitors: todayVisitors,
          pageviews: todayViews,
          orders: todayOrders.count,
          conversionRate: todayVisitors > 0 ? Number(((todayOrders.count / todayVisitors) * 100).toFixed(1)) : 0,
          revenuePKR: todayOrders.revenue,
        },
        yesterday: {
          visitors: yesterdayVisitors,
          pageviews: yesterdayViews,
          orders: yesterdayOrders.count,
          conversionRate: yesterdayVisitors > 0 ? Number(((yesterdayOrders.count / yesterdayVisitors) * 100).toFixed(1)) : 0,
          revenuePKR: yesterdayOrders.revenue,
        },
        last7Days: {
          visitors: weekVisitors,
          pageviews: weekViews,
          orders: last7DaysOrders.count,
          conversionRate: weekVisitors > 0 ? Number(((last7DaysOrders.count / weekVisitors) * 100).toFixed(1)) : 0,
          revenuePKR: last7DaysOrders.revenue,
        },
        thisMonth: {
          visitors: monthVisitors,
          pageviews: monthViews,
          orders: thisMonthOrders.count,
          conversionRate: monthVisitors > 0 ? Number(((thisMonthOrders.count / monthVisitors) * 100).toFixed(1)) : 0,
          revenuePKR: thisMonthOrders.revenue,
        },
        lifetime: {
          visitors: lifetimeVisitors,
          pageviews: lifetimeViews,
          orders: lifetimeOrders.count,
          conversionRate: lifetimeVisitors > 0 ? Number(((lifetimeOrders.count / lifetimeVisitors) * 100).toFixed(1)) : 0,
          revenuePKR: lifetimeOrders.revenue,
        },
        dailyTrends,
        topPages,
        deviceBreakdown,
        topReferrers,
        recentPageviews,
      };
    } catch (err) {
      console.error('Error fetching analytics from Neon, falling back to local:', err);
    }
  }

  // Fallback if SQL is unavailable
  const local = getLocalData();
  const threeMinutesAgo = Date.now() - 3 * 60 * 1000;
  const activeEntries = Object.entries(local.activeSessions).filter(
    ([, s]) => !s.isAdmin && s.lastActiveAt > threeMinutesAgo
  );

  const liveVisitorsCount = new Set(activeEntries.map(([, s]) => s.visitorId)).size;
  const liveSessions = activeEntries.slice(0, 20).map(([sessId, s]) => ({
    sessionId: sessId,
    visitorId: s.visitorId,
    lastPath: s.lastPath,
    deviceType: s.deviceType,
    secondsAgo: Math.max(0, Math.floor((Date.now() - s.lastActiveAt) / 1000)),
  }));

  const nonAdminPageviews = local.pageviews.filter((p) => !p.isAdmin);
  const todayViews = nonAdminPageviews.filter((p) => p.createdAt?.slice(0, 10) === todayStr);
  const todayVisitors = new Set(todayViews.map((p) => p.visitorId)).size;

  const yesterdayViews = nonAdminPageviews.filter((p) => p.createdAt?.slice(0, 10) === yesterdayStr);
  const yesterdayVisitors = new Set(yesterdayViews.map((p) => p.visitorId)).size;

  const weekViews = nonAdminPageviews.filter((p) => new Date(p.createdAt).getTime() >= sevenDaysAgoDate.getTime());
  const weekVisitors = new Set(weekViews.map((p) => p.visitorId)).size;

  const monthViews = nonAdminPageviews.filter((p) => p.createdAt?.startsWith(firstOfMonthStr.slice(0, 7)));
  const monthVisitors = new Set(monthViews.map((p) => p.visitorId)).size;

  const lifetimeViews = nonAdminPageviews.length;
  const lifetimeVisitors = new Set(nonAdminPageviews.map((p) => p.visitorId)).size;

  // Build daily trends
  const dailyTrends: AnalyticsSummary['dailyTrends'] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayStr = d.toISOString().slice(0, 10);
    const dayViews = nonAdminPageviews.filter((p) => p.createdAt?.slice(0, 10) === dayStr);
    const dayVisitors = new Set(dayViews.map((p) => p.visitorId)).size;
    const orderData = ordersByDate.get(dayStr) || { count: 0, revenue: 0 };
    const conversion = dayVisitors > 0 ? (orderData.count / dayVisitors) * 100 : 0;

    dailyTrends.push({
      date: dayStr,
      displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      visitors: dayVisitors,
      pageviews: dayViews.length,
      orders: orderData.count,
      conversionRate: Number(conversion.toFixed(1)),
      revenuePKR: orderData.revenue,
    });
  }

  // Top pages
  const pageMap = new Map<string, { views: number; visitors: Set<string> }>();
  nonAdminPageviews.forEach((p) => {
    const entry = pageMap.get(p.path) || { views: 0, visitors: new Set<string>() };
    entry.views += 1;
    entry.visitors.add(p.visitorId);
    pageMap.set(p.path, entry);
  });

  const topPages = Array.from(pageMap.entries())
    .map(([p, data]) => ({ path: p, views: data.views, visitors: data.visitors.size }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 12);

  return {
    liveVisitorsCount,
    liveSessions,
    today: {
      visitors: todayVisitors,
      pageviews: todayViews.length,
      orders: todayOrders.count,
      conversionRate: todayVisitors > 0 ? Number(((todayOrders.count / todayVisitors) * 100).toFixed(1)) : 0,
      revenuePKR: todayOrders.revenue,
    },
    yesterday: {
      visitors: yesterdayVisitors,
      pageviews: yesterdayViews.length,
      orders: yesterdayOrders.count,
      conversionRate: yesterdayVisitors > 0 ? Number(((yesterdayOrders.count / yesterdayVisitors) * 100).toFixed(1)) : 0,
      revenuePKR: yesterdayOrders.revenue,
    },
    last7Days: {
      visitors: weekVisitors,
      pageviews: weekViews.length,
      orders: last7DaysOrders.count,
      conversionRate: weekVisitors > 0 ? Number(((last7DaysOrders.count / weekVisitors) * 100).toFixed(1)) : 0,
      revenuePKR: last7DaysOrders.revenue,
    },
    thisMonth: {
      visitors: monthVisitors,
      pageviews: monthViews.length,
      orders: thisMonthOrders.count,
      conversionRate: monthVisitors > 0 ? Number(((thisMonthOrders.count / monthVisitors) * 100).toFixed(1)) : 0,
      revenuePKR: thisMonthOrders.revenue,
    },
    lifetime: {
      visitors: lifetimeVisitors,
      pageviews: lifetimeViews,
      orders: lifetimeOrders.count,
      conversionRate: lifetimeVisitors > 0 ? Number(((lifetimeOrders.count / lifetimeVisitors) * 100).toFixed(1)) : 0,
      revenuePKR: lifetimeOrders.revenue,
    },
    dailyTrends,
    topPages,
    deviceBreakdown: [],
    topReferrers: [],
    recentPageviews: [],
  };
}
