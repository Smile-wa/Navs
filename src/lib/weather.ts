/**
 * 天气数据聚合层（简体中文）
 *
 * 国内网络下 api.open-meteo.com 经常连接超时，因此采用「三源并行竞速」：
 *   1. 同源 /api/weather      —— Vite dev 中间件 / Cloudflare Pages Function 转发，绕开浏览器网络限制
 *   2. wttr.in 直连           —— 支持中文地名、经纬度，带 CORS: *
 *   3. Open-Meteo             —— geocoding + forecast 作为最后的免费兜底
 * 每个请求都有独立超时，谁先返回有效数据用谁；全部失败时组件会读取本地缓存并显示明确提示。
 */

export type WeatherIconKind =
  | 'sun' | 'cloudSun' | 'cloud' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm';

export interface WeatherSnapshot {
  temp: number;
  high: number;
  low: number;
  humidity: number;
  wind: number;      // km/h
  precip: number;    // %
  label: string;     // 简体中文天气描述
  icon: WeatherIconKind;
  city: string;
  source: string;
  updatedAt: string; // HH:mm
  cached?: boolean;
}

const num = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const round = (n: number) => Math.round(n);
export const nowTime = () =>
  new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

/** wttr.in（World Weather Online）天气码 → 简体中文 + 图标 */
const WTTR_META: Record<string, { label: string; icon: WeatherIconKind }> = {
  '113': { label: '晴', icon: 'sun' },
  '116': { label: '晴间多云', icon: 'cloudSun' },
  '119': { label: '多云', icon: 'cloud' },
  '122': { label: '阴', icon: 'cloud' },
  '143': { label: '薄雾', icon: 'fog' },
  '149': { label: '烟霾', icon: 'fog' },
  '176': { label: '局部有雨', icon: 'rain' },
  '179': { label: '局部有雪', icon: 'snow' },
  '182': { label: '局部雨夹雪', icon: 'snow' },
  '185': { label: '局部冻毛毛雨', icon: 'drizzle' },
  '200': { label: '局部雷阵雨', icon: 'storm' },
  '227': { label: '风吹雪', icon: 'snow' },
  '230': { label: '暴风雪', icon: 'snow' },
  '248': { label: '雾', icon: 'fog' },
  '260': { label: '冻雾', icon: 'fog' },
  '263': { label: '零星小毛毛雨', icon: 'drizzle' },
  '266': { label: '小毛毛雨', icon: 'drizzle' },
  '281': { label: '冻毛毛雨', icon: 'drizzle' },
  '284': { label: '强冻毛毛雨', icon: 'drizzle' },
  '293': { label: '零星小雨', icon: 'rain' },
  '296': { label: '小雨', icon: 'rain' },
  '299': { label: '间歇性中雨', icon: 'rain' },
  '302': { label: '中雨', icon: 'rain' },
  '305': { label: '间歇性大雨', icon: 'rain' },
  '308': { label: '大雨', icon: 'rain' },
  '311': { label: '小冻雨', icon: 'rain' },
  '314': { label: '中到大冻雨', icon: 'rain' },
  '317': { label: '小雨夹雪', icon: 'snow' },
  '320': { label: '中到大雨夹雪', icon: 'snow' },
  '323': { label: '零星小雪', icon: 'snow' },
  '326': { label: '小雪', icon: 'snow' },
  '329': { label: '局部中雪', icon: 'snow' },
  '332': { label: '中雪', icon: 'snow' },
  '335': { label: '局部大雪', icon: 'snow' },
  '338': { label: '大雪', icon: 'snow' },
  '350': { label: '冰粒', icon: 'snow' },
  '353': { label: '小阵雨', icon: 'rain' },
  '356': { label: '中到大阵雨', icon: 'rain' },
  '359': { label: '暴雨', icon: 'rain' },
  '362': { label: '小雨夹雪阵', icon: 'snow' },
  '365': { label: '中到大雨夹雪阵', icon: 'snow' },
  '368': { label: '小阵雪', icon: 'snow' },
  '371': { label: '中到大阵雪', icon: 'snow' },
  '374': { label: '小冰粒阵', icon: 'snow' },
  '377': { label: '中到大冰粒阵', icon: 'snow' },
  '386': { label: '局部雷阵雨', icon: 'storm' },
  '389': { label: '强雷阵雨', icon: 'storm' },
  '392': { label: '局部雷阵雪', icon: 'storm' },
  '395': { label: '强雷阵雪', icon: 'storm' },
};

/** 未知天气码时按英文描述粗略归类 */
const guessMeta = (desc: string): { label: string; icon: WeatherIconKind } => {
  const d = (desc || '').toLowerCase();
  if (/thunder|lightning/.test(d)) return { label: '雷阵雨', icon: 'storm' };
  if (/snow|sleet|blizzard|ice/.test(d)) return { label: '降雪', icon: 'snow' };
  if (/rain|shower|drizzle/.test(d)) return { label: '降雨', icon: 'rain' };
  if (/fog|mist|haze|smok/.test(d)) return { label: '雾或霾', icon: 'fog' };
  if (/overcast|cloudy/.test(d)) return { label: '多云', icon: 'cloud' };
  if (/sunny|clear/.test(d)) return { label: '晴', icon: 'sun' };
  return { label: '天气', icon: 'cloud' };
};

/** WMO 天气码（Open-Meteo）→ 简体中文 + 图标 */
export const wmoMeta = (code: number): { label: string; icon: WeatherIconKind } => {
  if (code === 0) return { label: '晴', icon: 'sun' };
  if (code === 1 || code === 2) return { label: code === 1 ? '晴间多云' : '多云', icon: 'cloudSun' };
  if (code === 3) return { label: '阴', icon: 'cloud' };
  if (code === 45 || code === 48) return { label: code === 45 ? '有雾' : '雾凇', icon: 'fog' };
  if (code >= 51 && code <= 57) return { label: '毛毛雨', icon: 'drizzle' };
  if (code >= 61 && code <= 67) return { label: code >= 65 ? '大雨' : '小雨', icon: 'rain' };
  if (code >= 71 && code <= 77) return { label: '降雪', icon: 'snow' };
  if (code >= 80 && code <= 82) return { label: '阵雨', icon: 'rain' };
  if (code >= 85 && code <= 86) return { label: '阵雪', icon: 'snow' };
  if (code >= 95) return { label: '雷阵雨', icon: 'storm' };
  return { label: '多云', icon: 'cloud' };
};

/** 内置常用城市经纬度（Open-Meteo 地理编码不可用时使用） */
const CITY_FALLBACK: Array<{ keys: string[]; name: string; lat: number; lon: number }> = [
  { keys: ['北京'], name: '北京', lat: 39.9075, lon: 116.39723 },
  { keys: ['上海'], name: '上海', lat: 31.22222, lon: 121.45806 },
  { keys: ['广州'], name: '广州', lat: 23.11667, lon: 113.25 },
  { keys: ['深圳'], name: '深圳', lat: 22.54554, lon: 114.0683 },
  { keys: ['杭州'], name: '杭州', lat: 30.29365, lon: 120.16142 },
  { keys: ['成都'], name: '成都', lat: 30.66667, lon: 104.06667 },
  { keys: ['重庆'], name: '重庆', lat: 29.56278, lon: 106.55278 },
  { keys: ['南京'], name: '南京', lat: 32.06167, lon: 118.77778 },
  { keys: ['武汉'], name: '武汉', lat: 30.58333, lon: 114.26667 },
  { keys: ['西安'], name: '西安', lat: 34.25833, lon: 108.92861 },
  { keys: ['天津'], name: '天津', lat: 39.14222, lon: 117.17667 },
  { keys: ['苏州'], name: '苏州', lat: 31.30408, lon: 120.59346 },
  { keys: ['郑州'], name: '郑州', lat: 34.75778, lon: 113.64861 },
  { keys: ['长沙'], name: '长沙', lat: 28.19875, lon: 112.93881 },
  { keys: ['青岛'], name: '青岛', lat: 36.06488, lon: 120.38024 },
  { keys: ['临沂'], name: '临沂', lat: 35.06306, lon: 118.34278 },
  { keys: ['香港'], name: '中国香港', lat: 22.28552, lon: 114.15769 },
  { keys: ['台北'], name: '中国台北', lat: 25.04776, lon: 121.53185 },
  { keys: ['东京', 'Tokyo'], name: '东京', lat: 35.6895, lon: 139.69171 },
  { keys: ['纽约', 'New York'], name: '纽约', lat: 40.71427, lon: -74.00597 },
  { keys: ['伦敦', 'London'], name: '伦敦', lat: 51.50853, lon: -0.12574 },
];

/** 带超时的 JSON 请求 */
async function fetchJson(url: string, timeout = 7000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    // 静态托管无 Functions 时 /api/weather 会返回 index.html，需挡掉
    if (!text.trim().startsWith('{')) throw new Error('non-json response');
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

/** 将 wttr.in 原始 JSON 归一化 */
export function parseWttr(json: any, city: string, source = 'wttr.in'): WeatherSnapshot {
  const cur = json?.current_condition?.[0];
  if (!cur || cur.temp_C === undefined) throw new Error('invalid weather payload');

  const day = json?.weather?.[0] || {};
  const hourly: any[] = Array.isArray(day.hourly) ? day.hourly : [];
  const precip = hourly.length
    ? Math.max(...hourly.map(h => num(h.chanceofrain)))
    : num(cur.precipMM) > 0 ? 60 : 0;

  const code = String(cur.weatherCode ?? '');
  const meta = WTTR_META[code] || guessMeta(cur.weatherDesc?.[0]?.value || '');

  return {
    temp: round(num(cur.temp_C)),
    high: round(num(day.maxtempC, num(cur.temp_C))),
    low: round(num(day.mintempC, num(cur.temp_C))),
    humidity: round(num(cur.humidity)),
    wind: round(num(cur.windspeedKmph)),
    precip: round(precip),
    label: meta.label,
    icon: meta.icon,
    city,
    source,
    updatedAt: nowTime(),
  };
}

/** 构造 wttr.in 路径：中文编码，但保留经纬度的逗号 */
const wttrPath = (city: string) =>
  encodeURIComponent(city.trim()).replace(/%2C/gi, ',').replace(/%2F/gi, '/');

/** 源 1：同源代理（Vite dev 中间件 / Cloudflare Pages Function） */
const fromSameOrigin = async (city: string) =>
  parseWttr(await fetchJson(`/api/weather?city=${encodeURIComponent(city)}`), city, 'wttr.in');

/** 源 2：浏览器直连 wttr.in（CORS: *） */
const fromWttr = async (city: string) =>
  parseWttr(await fetchJson(`https://wttr.in/${wttrPath(city)}?format=j1`), city, 'wttr.in');

/** 源 3：Open-Meteo（geocoding + forecast） */
const fromOpenMeteo = async (city: string): Promise<WeatherSnapshot> => {
  let lat: number;
  let lon: number;
  let name = city;

  const coord = city.trim().match(/^(-?\d+(?:\.\d+)?)\s*[,，\s]\s*(-?\d+(?:\.\d+)?)$/);
  if (coord) {
    lat = Number(coord[1]);
    lon = Number(coord[2]);
  } else {
    let geo: any = null;
    try {
      geo = await fetchJson(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`,
        4500
      );
    } catch { /* 使用内置城市兜底 */ }

    if (geo?.results?.length) {
      lat = num(geo.results[0].latitude);
      lon = num(geo.results[0].longitude);
      name = geo.results[0].name || city;
    } else {
      const fb = CITY_FALLBACK.find(c =>
        c.keys.some(k => city.includes(k) || city.toLowerCase().includes(k.toLowerCase()))
      );
      if (!fb) throw new Error('未找到该城市');
      lat = fb.lat;
      lon = fb.lon;
      name = fb.name;
    }
  }

  const wx = await fetchJson(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&timezone=auto&forecast_days=1`,
    6500
  );
  if (!wx?.current) throw new Error('invalid open-meteo payload');

  const code = num(wx.current.weather_code, 3);
  const meta = wmoMeta(code);
  return {
    temp: round(num(wx.current.temperature_2m)),
    high: round(num(wx.daily?.temperature_2m_max?.[0], num(wx.current.temperature_2m))),
    low: round(num(wx.daily?.temperature_2m_min?.[0], num(wx.current.temperature_2m))),
    humidity: round(num(wx.current.relative_humidity_2m)),
    wind: round(num(wx.current.wind_speed_10m)),
    precip: round(num(wx.daily?.precipitation_probability_max?.[0])),
    label: meta.label,
    icon: meta.icon,
    city: name,
    source: 'Open-Meteo',
    updatedAt: nowTime(),
  };
};

/* ================= 本地缓存（网络全失败时展示旧数据） ================= */
const CACHE_PREFIX = 'navs.weather.v2.';
const CACHE_TTL = 60 * 60 * 1000; // 1 小时内都可用于兜底

export function readWeatherCache(city: string): WeatherSnapshot | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + city);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (!data || Date.now() - ts > CACHE_TTL) return null;
    return { ...data, cached: true } as WeatherSnapshot;
  } catch {
    return null;
  }
}

export function writeWeatherCache(city: string, data: WeatherSnapshot) {
  try {
    localStorage.setItem(CACHE_PREFIX + city, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* 隐私模式下 localStorage 可能不可用 */ }
}

/**
 * 三源并行竞速获取天气。全部失败时抛出带中文原因的 Error。
 */
export async function fetchWeather(city: string): Promise<WeatherSnapshot> {
  const tasks: Array<Promise<WeatherSnapshot>> = [
    fromSameOrigin(city).catch(() => Promise.reject(new Error('同源代理不可用'))),
    fromWttr(city).catch(() => Promise.reject(new Error('直连接口不可用'))),
    fromOpenMeteo(city).catch(e =>
      Promise.reject(e instanceof Error && e.message === '未找到该城市' ? e : new Error('备用接口不可用'))
    ),
  ];

  try {
    return await Promise.any(tasks);
  } catch (err) {
    const errors = (err as AggregateError)?.errors;
    if (Array.isArray(errors) && errors.some((e: Error) => e?.message === '未找到该城市')) {
      throw new Error('未找到该城市，请检查地址');
    }
    throw new Error('天气接口连接超时或不可达');
  }
}
