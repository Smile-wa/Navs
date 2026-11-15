/**
 * 天气组件（固定在首页右上角）
 *  - 数据来自 src/lib/weather.ts 的多源竞速（同源代理 / wttr.in / Open-Meteo），带超时与本地缓存
 *  - 支持手动输入中文地名或「纬度,经度」，界面全部为简体中文
 *  - showBackground=false 时为完全透明背景，直接贴合壁纸
 */

import React, { useEffect, useState } from 'react';
import {
  Cloud, CloudRain, CloudSnow, CloudSun, CloudFog, CloudLightning,
  CloudDrizzle, Sun, Wind, Droplets, MapPin, RefreshCw, WifiOff
} from 'lucide-react';
import {
  fetchWeather, readWeatherCache, writeWeatherCache,
  type WeatherSnapshot, type WeatherIconKind,
} from '../../lib/weather.ts';

interface WeatherWidgetProps {
  size: string;
  showBackground?: boolean;
  location?: string;
}

const ICONS: Record<WeatherIconKind, React.ComponentType<{ className?: string }>> = {
  sun: Sun,
  cloudSun: CloudSun,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
};

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ size, showBackground, location }) => {
  const target = (location || '北京').trim() || '北京';
  const [data, setData] = useState<WeatherSnapshot | null>(() => readWeatherCache(target));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // 切换城市时先尝试展示该城市的缓存
    setData(readWeatherCache(target));
    setError('');

    const load = async () => {
      setLoading(true);
      try {
        const snapshot = await fetchWeather(target);
        if (cancelled) return;
        setData(snapshot);
        setError('');
        writeWeatherCache(target, snapshot);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : '天气数据暂不可用';
        // 有缓存时保留数据，只显示轻量提示
        setData(prev => prev || readWeatherCache(target));
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    // 每 30 分钟自动刷新
    const timer = setInterval(load, 30 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [target, refreshTick]);

  const ConditionIcon = ICONS[data?.icon || 'cloud'];
  const isSmall = size === '1x1';

  // 透明背景：无任何底色/边框/阴影；卡片背景：沿用站点玻璃拟态
  const shell = showBackground
    ? 'glass rounded-2xl border border-white/15 shadow-lg'
    : 'bg-transparent border border-transparent shadow-none';

  const shadowText = 'drop-shadow-[0_1px_3px_rgba(0,0,0,0.75)]';
  const showLoading = loading && !data;
  const showError = !loading && !!error && !data;

  return (
    <div className={`w-full relative overflow-hidden text-white transition-all ${shell} ${isSmall ? 'p-3' : 'p-4'}`}>
      {/* 顶部：地点 + 手动刷新 */}
      <div className="flex items-center justify-between gap-2">
        <div className={`flex items-center gap-1.5 min-w-0 ${shadowText}`}>
          <MapPin className="w-3.5 h-3.5 shrink-0 opacity-80" />
          <span className={`font-semibold truncate ${isSmall ? 'text-xs' : 'text-sm'}`} title={target}>
            {data?.city || target}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setRefreshTick(v => v + 1)}
          className={`shrink-0 p-1 rounded-md transition-colors cursor-pointer border-0 bg-transparent ${
            showBackground ? 'text-white/50 hover:text-white hover:bg-white/10' : `text-white/70 hover:text-white hover:bg-white/10 ${shadowText}`
          }`}
          title="刷新天气"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 加载中：仅在完全没有数据时占位，且不会无限转圈（每个源都有超时） */}
      {showLoading && (
        <div className={`py-4 text-center text-xs text-white/70 ${shadowText}`}>正在获取天气…</div>
      )}

      {/* 全部数据源失败且无缓存 */}
      {showError && (
        <button
          type="button"
          onClick={() => setRefreshTick(v => v + 1)}
          className={`w-full py-3 text-center text-xs text-white/80 bg-transparent border-0 cursor-pointer hover:text-white transition-colors ${shadowText}`}
          title="点击重试"
        >
          <WifiOff className="w-4 h-4 mx-auto mb-1 opacity-70" />
          {error}
          <span className="block text-[10px] text-white/50 mt-1">点击重试</span>
        </button>
      )}

      {data && (
        <>
          <div className="flex items-center justify-between gap-2 mt-2">
            <div className={`font-bold leading-none tracking-tighter ${shadowText} ${isSmall ? 'text-3xl' : 'text-4xl'}`}>
              {data.temp}<span className="text-xl align-top">°</span>
            </div>
            <div className={`flex items-center gap-1.5 text-right ${shadowText}`}>
              <ConditionIcon className={`${isSmall ? 'w-5 h-5' : 'w-7 h-7'} text-yellow-200 shrink-0`} />
              <span className={`${isSmall ? 'text-xs' : 'text-sm'} font-medium whitespace-nowrap`}>{data.label}</span>
            </div>
          </div>

          {/* 中文详情 */}
          <div className={`mt-3 pt-3 border-t border-white/20 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] ${shadowText}`}>
            <span className="text-white/85">最高 {data.high}° · 最低 {data.low}°</span>
            <span className="flex items-center gap-1 text-white/85 justify-end">
              <Droplets className="w-3 h-3" />降水 {data.precip}%
            </span>
            <span className="flex items-center gap-1 text-white/85">
              <Wind className="w-3 h-3" />风速 {data.wind} km/h
            </span>
            <span className="text-white/85 text-right">湿度 {data.humidity}%</span>
          </div>

          <div className={`mt-2 text-[10px] text-white/55 text-right ${shadowText}`}>
            {loading ? '更新中 · ' : ''}
            {data.cached ? '缓存数据 · ' : ''}
            {error && !loading ? `${error} · ` : ''}
            更新于 {data.updatedAt} · {data.source}
          </div>
        </>
      )}
    </div>
  );
};
