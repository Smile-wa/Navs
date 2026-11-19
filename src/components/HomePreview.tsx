/**
 * 前台首页实时预览窗口（后台「个性化设置」页使用）
 *
 * 用同源 iframe 加载真实首页（/?preview=1#/），父窗口通过 postMessage 把当前
 * 「未保存」的设置 / 小组件 / 分类推送给 iframe 内的 DataProvider 做覆盖显示。
 * 因此壁纸、玻璃效果、暗色蒙版、卡片尺寸、小组件和天气都能即时反映，
 * 且不会写入 localStorage，也不影响实际站点。
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, Monitor, Smartphone, RefreshCw, ExternalLink } from 'lucide-react';
import type { Settings, Bookmark, Category } from '../context/DataContext.tsx';

interface HomePreviewProps {
  settings: Settings;
  widgets: Bookmark[];
  categories: Category[];
  isZh?: boolean;
  /** 桌面端固定在视口右侧：不随内容上下滚动 */
  sticky?: boolean;
  /** 预览画面（含外框）允许占用的最大高度，超出时按比例整体缩小 */
  maxHeight?: number;
}

type PreviewMode = 'desktop' | 'mobile';

/** iframe 内部布局视口尺寸（手机模式会限制外框宽度，避免放得过大） */
const FRAME: Record<PreviewMode, { width: number; height: number; maxWidth: number }> = {
  // 桌面：16:10 左右的页面视口，缩放后高度与真实首页更接近
  desktop: { width: 1280, height: 780, maxWidth: Number.POSITIVE_INFINITY },
  // 手机：接近主流手机屏幕比例
  mobile: { width: 390, height: 720, maxWidth: 320 },
};

export default function HomePreview({
  settings,
  widgets,
  categories,
  isZh = true,
  sticky = false,
  maxHeight = 560,
}: HomePreviewProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mode, setMode] = useState<PreviewMode>('desktop');
  const [frameWidth, setFrameWidth] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(
    () => (typeof window === 'undefined' ? 900 : window.innerHeight)
  );
  const [ready, setReady] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  // 始终持有最新的预览数据，避免消息监听反复解绑/重绑
  const payloadRef = useRef({ type: 'NAVS_PREVIEW_SETTINGS', settings, widgets, categories });
  payloadRef.current = { type: 'NAVS_PREVIEW_SETTINGS', settings, widgets, categories };

  const push = useCallback(() => {
    try {
      iframeRef.current?.contentWindow?.postMessage(payloadRef.current, window.location.origin);
    } catch { /* iframe 尚未就绪时忽略 */ }
  }, []);

  // 监听 iframe 就绪信号，并立即推送一次当前设置
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.source !== iframeRef.current?.contentWindow) return;
      if (e.data?.type === 'NAVS_PREVIEW_READY') {
        setReady(true);
        push();
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [push]);

  // 设置/小组件/分类变化 → 实时推送（轻微防抖，避免拖动滑杆时刷屏）
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(push, 120);
    return () => clearTimeout(timer);
  }, [settings, widgets, categories, ready, push]);

  // 预览区宽度自适应，内容按比例缩放
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = (w: number) => setFrameWidth(w);
    update(el.clientWidth);
    const ro = new ResizeObserver(entries => update(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 视口高度变化时重新计算缩放，保证粘性预览始终完整可见
  useEffect(() => {
    if (!sticky) return;
    const onResize = () => setViewportHeight(window.innerHeight);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [sticky]);

  const cfg = FRAME[mode];

  // 可用空间：宽度取列宽，高度取视口剩余高度（留出标题栏、页脚与上下留白）
  const availableWidth = frameWidth > 0 ? Math.min(frameWidth, cfg.maxWidth) : cfg.width * 0.4;
  const availableHeight = sticky
    ? Math.max(200, Math.min(maxHeight, viewportHeight - 240))
    : Number.POSITIVE_INFINITY;

  // 同时满足宽高限制的等比缩放：既铺满列宽，又不会溢出视口
  const scale = frameWidth > 0
    ? Math.min(availableWidth / cfg.width, availableHeight / cfg.height)
    : 0.4;
  const scaledWidth = cfg.width * scale;
  const scaledHeight = cfg.height * scale;

  const reload = () => {
    setReady(false);
    setReloadTick(v => v + 1);
  };

  return (
    <section
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5 sm:p-5 min-w-0 ${
        sticky ? 'lg:shadow-[0_18px_50px_-24px_rgba(15,23,42,0.28)]' : 'sm:rounded-3xl sm:p-6'
      }`}
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-[#ec5b13] shrink-0" />
          <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
            {isZh ? '前台效果预览' : 'Live Homepage Preview'}
          </h3>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {isZh ? '实时' : 'Live'}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* 桌面 / 手机视图切换 */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setMode('desktop')}
              className={`px-2 py-1.5 text-[11px] font-semibold flex items-center gap-1 transition-colors border-0 cursor-pointer ${
                mode === 'desktop' ? 'bg-[#ec5b13] text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
              title={isZh ? '桌面视图' : 'Desktop'}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">{isZh ? '桌面' : 'Desktop'}</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('mobile')}
              className={`px-2 py-1.5 text-[11px] font-semibold flex items-center gap-1 transition-colors border-0 cursor-pointer ${
                mode === 'mobile' ? 'bg-[#ec5b13] text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
              title={isZh ? '手机视图' : 'Mobile'}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">{isZh ? '手机' : 'Mobile'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={reload}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-[#ec5b13] transition-colors cursor-pointer"
            title={isZh ? '重新加载预览' : 'Reload preview'}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <a
            href="/#/"
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-[#ec5b13] transition-colors cursor-pointer no-underline"
            title={isZh ? '查看已保存的实际首页（新窗口）' : 'Open saved homepage in a new tab'}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 浏览器窗口外框 */}
      <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner">
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-100/80 border-b border-slate-200">
          <span className="flex gap-1.5 shrink-0">
            <i className="w-2 h-2 rounded-full bg-red-300" />
            <i className="w-2 h-2 rounded-full bg-amber-300" />
            <i className="w-2 h-2 rounded-full bg-green-300" />
          </span>
          <div className="flex-1 min-w-0 mx-1 px-2 py-0.5 bg-white rounded-md border border-slate-200 text-[10px] text-slate-400 truncate">
            {window.location.origin}/#/
          </div>
          <span className="text-[10px] text-slate-400 shrink-0 font-mono">
            {cfg.width}×{cfg.height}
          </span>
        </div>

        {/* 预览画面：内部使用真实布局视口，按比例缩放显示 */}
        <div
          ref={frameRef}
          className="relative overflow-hidden bg-slate-200"
          style={{ height: scaledHeight }}
        >
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 z-10">
              {isZh ? '正在加载预览…' : 'Loading preview…'}
            </div>
          )}
          <div
            className="absolute top-0 origin-top-left"
            style={{
              width: cfg.width,
              height: cfg.height,
              transform: `scale(${scale})`,
              left: Math.max(0, (frameWidth - scaledWidth) / 2),
            }}
          >
            <iframe
              key={reloadTick}
              ref={iframeRef}
              title={isZh ? '前台首页预览' : 'Homepage preview'}
              src="/?preview=1#/"
              className="w-full h-full border-0 pointer-events-none"
              onLoad={() => { setReady(true); push(); }}
            />
          </div>
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-slate-400 mt-3">
        {isZh
          ? '预览使用本页当前设置（含未保存改动），不会写入站点数据；点击「保存设置」后才会应用到前台。'
          : 'Preview reflects the settings on this page (including unsaved changes) without writing to site data. Save to apply.'}
      </p>
    </section>
  );
}
