/**
 * Cloudflare Pages Function – 天气同源代理
 * 路由: /api/weather?city=临沂   （也支持 "35.06,118.34" 经纬度）
 *
 * 目的：国内浏览器直连 api.open-meteo.com / wttr.in 时常超时，
 *       由 Cloudflare 边缘节点代取 wttr.in 的 JSON，再以同源响应返回给前端。
 *       前端 src/lib/weather.ts 会并行尝试「本代理 / 直连 wttr.in / Open-Meteo」三源。
 */

interface CFContext {
  request: Request;
}

const UPSTREAM_TIMEOUT_MS = 6500;

const jsonError = (message: string, status = 502) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

/** 中文/空格编码，但保留经纬度的逗号 */
const wttrPath = (city: string) =>
  encodeURIComponent(city.trim()).replace(/%2C/gi, ',');

export async function onRequestGet({ request }: CFContext) {
  const reqUrl = new URL(request.url);
  const city = (reqUrl.searchParams.get('city') || '北京').trim().slice(0, 60);
  if (!city) return jsonError('Missing city parameter', 400);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const upstream = await fetch(`https://wttr.in/${wttrPath(city)}?format=j1`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; NavsWeather/1.0)',
      },
    });
    const text = await upstream.text();

    // wttr.in 限流时可能返回 HTML 或纯文本，必须挡掉，让前端自动切换其它数据源
    if (!upstream.ok || !text.trim().startsWith('{')) {
      return jsonError('Weather upstream unavailable');
    }

    return new Response(text, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        // 边缘与浏览器各缓存 10 分钟，降低上游限流概率
        'Cache-Control': 'public, max-age=600, s-maxage=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return jsonError('Weather upstream timeout');
  } finally {
    clearTimeout(timer);
  }
}
