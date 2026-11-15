/**
 * 个性化设置页面
 * NOTE: 合并了原「壁纸与背景」页的全部功能，并收纳外观效果、首页卡片尺寸与小组件管理
 */

import React, { useState, useRef } from 'react';
import { useData, DEFAULT_SETTINGS, type Bookmark } from '../../context/DataContext.tsx';
import {
  Image as ImageIcon, CheckCircle, Upload, RefreshCw, HelpCircle, LayoutGrid,
  AlarmClock, CloudSun, Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Eye, Palette, MapPin
} from 'lucide-react';
import { TRANSLATIONS } from '../../i18n/translations.ts';
import ConfirmModal from '../../components/ConfirmModal.tsx';

export default function Personalization() {
  const { state, updateSettings, addWidget, updateWidget, deleteWidget, reorderWidgets } = useData();
  const [localSettings, setLocalSettings] = useState(state.settings);
  const t = TRANSLATIONS[state.settings.language || 'zh-CN'];
  const isZh = (state.settings.language || 'zh-CN') === 'zh-CN';
  const [saved, setSaved] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(state.settings.wallpaperUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Bookmark | null>(null);
  const [widgetForm, setWidgetForm] = useState<{ title: string; size: string; widgetType: string; showBackground?: boolean; wrapLine?: boolean; weatherLocation?: string; }>({
    title: 'Clock', size: '2x1', widgetType: 'clock', showBackground: false, wrapLine: false, weatherLocation: '北京'
  });

  const handleSaveWidget = () => {
    const title = widgetForm.widgetType === 'clock' ? 'Clock' :
                  widgetForm.widgetType === 'search' ? 'Search' : 'Widget';
    const finalForm = {
      ...widgetForm,
      title,
      itemType: 'widget',
      url: '',
      icon: '',
      weatherLocation: widgetForm.widgetType === 'weather' ? (widgetForm.weatherLocation || '北京') : undefined,
    } as any;
    if (editingWidget) updateWidget(editingWidget.id, finalForm);
    else addWidget(finalForm);
    setIsWidgetModalOpen(false);
    setEditingWidget(null);
    setWidgetForm({ title: 'Clock', size: '2x1', widgetType: 'clock', showBackground: false, wrapLine: false, weatherLocation: '北京' });
  };

  const handleEditWidget = (widget: Bookmark) => {
    setEditingWidget(widget);
    setWidgetForm({
      title: widget.title || 'Widget',
      size: widget.size || '1x1',
      widgetType: widget.widgetType || 'clock',
      showBackground: !!widget.showBackground,
      wrapLine: !!widget.wrapLine,
      weatherLocation: widget.weatherLocation || '北京'
    });
    setIsWidgetModalOpen(true);
  };

  const handleMoveWidget = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    reorderWidgets(index, targetIndex);
  };

  const handleSave = () => {
    updateSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => setIsResetModalOpen(true);

  // 仅重置个性化相关项，避免误改站点名称、语言等基础配置
  const confirmReset = () => {
    setLocalSettings({
      ...localSettings,
      wallpaperType: DEFAULT_SETTINGS.wallpaperType,
      wallpaperUrl: DEFAULT_SETTINGS.wallpaperUrl,
      localWallpaper: DEFAULT_SETTINGS.localWallpaper,
      backgroundColor: DEFAULT_SETTINGS.backgroundColor,
      glassEffect: DEFAULT_SETTINGS.glassEffect,
      glassEffectOpacity: DEFAULT_SETTINGS.glassEffectOpacity,
      darkMask: DEFAULT_SETTINGS.darkMask,
      darkMaskOpacity: DEFAULT_SETTINGS.darkMaskOpacity,
      cardHeight: DEFAULT_SETTINGS.cardHeight,
      cardWidth: DEFAULT_SETTINGS.cardWidth,
      widgetAlignment: DEFAULT_SETTINGS.widgetAlignment,
      showWeather: DEFAULT_SETTINGS.showWeather,
      weatherLocation: DEFAULT_SETTINGS.weatherLocation,
      weatherTransparent: DEFAULT_SETTINGS.weatherTransparent,
    });
    setPreviewUrl(DEFAULT_SETTINGS.wallpaperUrl);
  };

  const handleLocalWallpaper = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert(t.uploadLimit); return; }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLocalSettings({ ...localSettings, wallpaperType: 'local', localWallpaper: base64 });
      setPreviewUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const refreshPreview = () => {
    if (localSettings.wallpaperType === 'api') {
      const url = localSettings.wallpaperUrl || 'https://pic.yumekai.top/pic?img=ua';
      const separator = url.includes('?') ? '&' : '?';
      setPreviewUrl(`${url}${separator}t=${Date.now()}`);
    } else if (localSettings.wallpaperType === 'local') {
      setPreviewUrl(localSettings.localWallpaper);
    } else {
      setPreviewUrl(localSettings.wallpaperUrl || 'https://pic.yumekai.top/pic?img=ua');
    }
  };

  const getEffectivePreviewUrl = () => {
    if (localSettings.wallpaperType === 'local') return localSettings.localWallpaper || previewUrl;
    return previewUrl || localSettings.wallpaperUrl || 'https://pic.yumekai.top/pic?img=ua';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6 sm:space-y-8 min-w-0">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">{t.navPersonalization}</h2>
          <p className="text-slate-500 mt-2">
            {isZh ? '壁纸与背景、玻璃效果、卡片尺寸与首页小组件' : 'Wallpaper, glass effect, card size and widgets'}
          </p>
        </div>
      </header>

      <div className="space-y-12 pb-24">
        {/* ===== 壁纸与背景 ===== */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <ImageIcon className="w-5 h-5 text-[#ec5b13]" />
            <h3 className="text-xl font-bold">{t.wallpaperTitle}</h3>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 min-w-0">
            <p className="text-sm text-slate-500">{t.wallpaperDesc}</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 预览区 */}
              <div
                className="aspect-video rounded-xl bg-slate-100 relative group overflow-hidden border border-slate-200"
                style={localSettings.wallpaperType === 'color' ? { backgroundColor: localSettings.backgroundColor } : {}}
              >
                {localSettings.wallpaperType === 'color' ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-lg border border-white/20 text-white text-xs font-medium">
                      {t.previewLabel}: {localSettings.backgroundColor}
                    </div>
                  </div>
                ) : getEffectivePreviewUrl() ? (
                  <img
                    src={getEffectivePreviewUrl()}
                    alt={t.previewLabel}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                {localSettings.wallpaperType !== 'color' && (
                  <button
                    onClick={refreshPreview}
                    className="absolute bottom-3 right-3 p-2 rounded-lg bg-black/40 text-white/80 hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100"
                    title={t.previewLabel}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* 配置区 */}
              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-sm font-semibold mb-2">{t.wallpaperType}</p>
                  <select
                    id="setting-wallpaper-type"
                    className="w-full rounded-lg border-slate-200 bg-white px-3 py-2.5 text-sm outline-none border focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors font-medium"
                    value={localSettings.wallpaperType}
                    onChange={(e) => {
                      const type = e.target.value as 'fixed' | 'api' | 'local' | 'color';
                      setLocalSettings({ ...localSettings, wallpaperType: type });
                      if (type === 'local') setPreviewUrl(localSettings.localWallpaper);
                      else if (type === 'color') setPreviewUrl('');
                      else setPreviewUrl(localSettings.wallpaperUrl);
                    }}
                  >
                    <option value="fixed">{t.typeFixed}</option>
                    <option value="api">{t.typeApi}</option>
                    <option value="local">{t.typeLocal}</option>
                    <option value="color">{t.typeColor}</option>
                  </select>
                </div>

                {localSettings.wallpaperType === 'local' ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-sm font-semibold mb-2">{t.typeLocal}</p>
                    <div
                      className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-[#ec5b13]/40 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-500">{t.uploadLabel}</p>
                      <p className="text-[10px] text-slate-400 mt-1">支持 JPG/PNG/WebP, {t.uploadLimit}</p>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLocalWallpaper} />
                  </div>
                ) : localSettings.wallpaperType === 'color' ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-sm font-semibold mb-3">{t.bgColorLabel}</p>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        id="setting-bg-color"
                        className="w-12 h-12 rounded-lg cursor-pointer border-2 border-white shadow-sm"
                        value={localSettings.backgroundColor}
                        onChange={(e) => setLocalSettings({ ...localSettings, backgroundColor: e.target.value })}
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          className="w-full rounded-lg border-slate-200 bg-white px-3 py-2 text-sm outline-none border focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors font-mono"
                          value={localSettings.backgroundColor}
                          onChange={(e) => setLocalSettings({ ...localSettings, backgroundColor: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-sm font-semibold mb-2">
                      {localSettings.wallpaperType === 'api' ? t.typeApi : t.imageUrlLabel}
                    </p>
                    <input
                      type="text"
                      id="setting-wallpaper-url"
                      className="w-full rounded-lg border-slate-200 bg-white px-3 py-2.5 text-sm outline-none border focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors placeholder:text-slate-300 font-medium"
                      placeholder="https://..."
                      value={localSettings.wallpaperUrl}
                      onChange={(e) => {
                        setLocalSettings({ ...localSettings, wallpaperUrl: e.target.value });
                        setPreviewUrl(e.target.value);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 视觉效果 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
              <div className="flex flex-col gap-4 p-4 rounded-xl border border-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[13px] font-bold text-slate-800">{t.glassEffectLabel}</p>
                    <div className="relative group flex items-center">
                      <div className="p-1 rounded-full text-slate-400 hover:text-[#ec5b13] hover:bg-[#ec5b13]/10 transition-colors cursor-help" title={t.glassEffectDesc}>
                        <HelpCircle className="w-3.5 h-3.5" />
                      </div>
                      <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:flex items-center px-3 py-1.5 bg-slate-900/95 text-white text-xs font-medium rounded-xl w-60 shadow-2xl backdrop-blur-md z-50 pointer-events-none transition-all leading-relaxed border border-white/10">
                        {t.glassEffectDesc}
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={localSettings.glassEffect}
                      onChange={(e) => setLocalSettings({ ...localSettings, glassEffect: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ec5b13]" />
                  </label>
                </div>
                {localSettings.glassEffect && (
                  <div className="space-y-2 animate-fade-in">
                    <div className="flex justify-between items-center text-[11px] font-medium text-slate-500">
                      <span>{t.glassOpacityLabel}</span>
                      <span className="font-mono">{localSettings.glassEffectOpacity}%</span>
                    </div>
                    <input
                      type="range" min="0" max="100" step="1"
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#ec5b13]"
                      value={localSettings.glassEffectOpacity}
                      onChange={(e) => setLocalSettings({ ...localSettings, glassEffectOpacity: parseInt(e.target.value) })}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4 p-4 rounded-xl border border-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[13px] font-bold text-slate-800">{t.darkMaskLabel}</p>
                    <div className="relative group flex items-center">
                      <div className="p-1 rounded-full text-slate-400 hover:text-[#ec5b13] hover:bg-[#ec5b13]/10 transition-colors cursor-help" title={t.darkMaskDesc}>
                        <HelpCircle className="w-3.5 h-3.5" />
                      </div>
                      <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:flex items-center px-3 py-1.5 bg-slate-900/95 text-white text-xs font-medium rounded-xl w-60 shadow-2xl backdrop-blur-md z-50 pointer-events-none transition-all leading-relaxed border border-white/10">
                        {t.darkMaskDesc}
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={localSettings.darkMask}
                      onChange={(e) => setLocalSettings({ ...localSettings, darkMask: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ec5b13]" />
                  </label>
                </div>
                {localSettings.darkMask && (
                  <div className="space-y-2 animate-fade-in">
                    <div className="flex justify-between items-center text-[11px] font-medium text-slate-500">
                      <span>{t.maskOpacityLabel}</span>
                      <span className="font-mono">{localSettings.darkMaskOpacity}%</span>
                    </div>
                    <input
                      type="range" min="0" max="100" step="1"
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#ec5b13]"
                      value={localSettings.darkMaskOpacity}
                      onChange={(e) => setLocalSettings({ ...localSettings, darkMaskOpacity: parseInt(e.target.value) })}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ===== 首页布局：卡片尺寸 ===== */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <LayoutGrid className="w-5 h-5 text-[#ec5b13]" />
            <h3 className="text-xl font-bold">{t.appearanceSettings}</h3>
          </div>
          <div className="grid gap-6 bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm min-w-0 overflow-hidden">
            {/* 卡片高度 */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-slate-400" />
                {t.cardHeightLabel}
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range" min={60} max={200} step={5}
                  value={localSettings.cardHeight || 80}
                  onChange={(e) => setLocalSettings({ ...localSettings, cardHeight: Number(e.target.value) } as any)}
                  className="flex-1 accent-[#ec5b13] cursor-pointer"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number" min={60} max={200} step={5}
                    value={localSettings.cardHeight || 80}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setLocalSettings({ ...localSettings, cardHeight: isNaN(v) ? 80 : Math.min(200, Math.max(60, v)) } as any);
                    }}
                    className="w-20 text-center text-base font-mono font-bold text-[#ec5b13] bg-[#ec5b13]/10 rounded-lg py-1 outline-none border border-[#ec5b13]/20 focus:border-[#ec5b13]"
                  />
                  <span className="text-xs text-slate-400 font-medium">px</span>
                </div>
              </div>
            </div>

            {/* 卡片宽度 */}
            <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
              <label className="text-sm font-semibold flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-slate-400" />
                {t.cardWidthLabel}
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range" min={120} max={400} step={10}
                  value={localSettings.cardWidth || 240}
                  onChange={(e) => setLocalSettings({ ...localSettings, cardWidth: Number(e.target.value) } as any)}
                  className="flex-1 accent-[#ec5b13] cursor-pointer"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number" min={120} max={400} step={10}
                    value={localSettings.cardWidth || 240}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setLocalSettings({ ...localSettings, cardWidth: isNaN(v) ? 240 : Math.min(400, Math.max(120, v)) } as any);
                    }}
                    className="w-20 text-center text-base font-mono font-bold text-[#ec5b13] bg-[#ec5b13]/10 rounded-lg py-1 outline-none border border-[#ec5b13]/20 focus:border-[#ec5b13]"
                  />
                  <span className="text-xs text-slate-400 font-medium">px</span>
                </div>
              </div>
              <p className="text-xs text-slate-400">{t.cardSizeDesc}</p>
            </div>
          </div>
        </section>

        {/* ===== 小组件（含右上角天气组件） ===== */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Palette className="w-5 h-5 text-[#ec5b13]" />
            <h3 className="text-xl font-bold">{t.widgetSettings || '小组件'}</h3>
          </div>
          <div className="grid gap-6 bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm min-w-0 overflow-hidden">
            {/* ===== 天气组件：固定在页面右上角，不占用小组件列表 ===== */}
            <div className="pb-6 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <CloudSun className="w-4 h-4 text-[#ec5b13]" />
                <h4 className="text-base font-bold text-slate-800">天气组件（页面右上角）</h4>
              </div>
              <p className="text-[11px] text-slate-400 mb-4">
                天气固定显示在首页右上角，不占用下方的小组件列表；桌面端滚动时自动收起为图标，点击可展开。
              </p>

              <div className="grid gap-4">
                {/* 显示开关 */}
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <label className="text-sm font-semibold text-slate-800">显示天气组件</label>
                    <p className="text-[11px] text-slate-400">固定在首页右上角，使用简体中文显示实况天气</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLocalSettings({ ...localSettings, showWeather: localSettings.showWeather === false })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                      localSettings.showWeather !== false ? 'bg-[#ec5b13]' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      localSettings.showWeather !== false ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* 手动输入地址 */}
                <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    城市 / 地址
                  </label>
                  <input
                    type="text"
                    id="setting-weather-location"
                    className="w-full rounded-xl border-slate-200 bg-slate-50 focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none border transition-colors text-sm"
                    placeholder="例如：北京、上海、杭州，或 39.90,116.40"
                    value={localSettings.weatherLocation || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, weatherLocation: e.target.value } as any)}
                  />
                  <p className="text-xs text-slate-400">
                    支持中文地名或「纬度,经度」，界面为简体中文；自动在「同源代理 / wttr.in / Open-Meteo」多个免费数据源间切换（无需密钥、带超时），每 30 分钟自动刷新。
                  </p>
                </div>

                {/* 透明背景开关 */}
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
                  <div className="space-y-0.5">
                    <label className="text-sm font-semibold text-slate-800">透明背景</label>
                    <p className="text-[11px] text-slate-400">开启后无底色、无边框，天气文字直接叠在壁纸上；关闭则显示玻璃卡片</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLocalSettings({ ...localSettings, weatherTransparent: localSettings.weatherTransparent === false })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                      localSettings.weatherTransparent !== false ? 'bg-[#ec5b13]' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      localSettings.weatherTransparent !== false ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-slate-400" />
                {t.widgetAlignmentLabel || '对齐方式'}
              </label>
              <select
                value={localSettings.widgetAlignment || 'center'}
                onChange={(e) => setLocalSettings({ ...localSettings, widgetAlignment: e.target.value as any })}
                className="w-full rounded-xl border-slate-200 bg-slate-50 focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none border transition-colors text-sm font-medium"
              >
                <option value="left">{t.alignLeft || '左对齐'}</option>
                <option value="center">{t.alignCenter || '居中'}</option>
                <option value="right">{t.alignRight || '右对齐'}</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-slate-400" />
                  {t.manageWidgets || '小组件列表'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setEditingWidget(null);
                    setWidgetForm({ title: 'Clock', size: '2x1', widgetType: 'clock', showBackground: false, wrapLine: false, weatherLocation: '北京' });
                    setIsWidgetModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-[#ec5b13] text-white rounded-lg text-xs font-semibold hover:bg-[#d4520f] transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t.addWidget || '添加小组件'}
                </button>
              </div>

              {state.widgets.length === 0 ? (
                <div className="text-center py-8 text-slate-400 flex flex-col items-center gap-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <LayoutGrid className="w-8 h-8 opacity-20" />
                  <p className="text-sm">{t.noWidgets || '暂无小组件，点击右上角添加'}</p>
                </div>
              ) : (
                <div
                  className="border border-slate-200/80 rounded-2xl p-4 sm:p-6 bg-slate-50/30 shadow-inner"
                  style={{
                    backgroundImage: 'radial-gradient(#e2e8f0 1.5px, transparent 1.5px)',
                    backgroundSize: '16px 16px'
                  }}
                >
                  <div className="text-[10px] sm:text-xs font-bold text-slate-400 mb-4 flex items-center gap-1.5 uppercase tracking-wider select-none">
                    <Eye className="w-3.5 h-3.5 text-[#ec5b13]" />
                    布局画布预览 (Mini Canvas Preview)
                  </div>
                  <div
                    className={`w-full flex flex-wrap gap-2.5 sm:gap-3 transition-all duration-300 ${
                      localSettings.widgetAlignment === 'left' ? 'justify-start' :
                      localSettings.widgetAlignment === 'right' ? 'justify-end' :
                      'justify-center'
                    }`}
                  >
                    {state.widgets.map((widget, index) => {
                      const basisClass =
                        widget.size?.startsWith('4x') ? 'basis-full sm:basis-[95%]' :
                        widget.size?.startsWith('3x') ? 'basis-[72%] sm:basis-[70%]' :
                        widget.size?.startsWith('2x') ? 'basis-[47%] sm:basis-[46%]' :
                        'basis-[22%] sm:basis-[21%]';

                      const heightClass = widget.size?.endsWith('x2') ? 'h-32 sm:h-36' : 'h-16 sm:h-20';

                      return (
                        <React.Fragment key={widget.id}>
                          {widget.wrapLine && index > 0 && <div className="w-full h-0 flex-shrink-0" />}
                          <div
                            className={`relative group border border-slate-200 rounded-xl p-3 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-between gap-3 shadow-sm ${basisClass} ${heightClass} min-w-[70px] overflow-hidden`}
                          >
                            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                              <div className="w-9 h-9 bg-[#ec5b13]/10 text-[#ec5b13] rounded-lg flex items-center justify-center shrink-0">
                                {widget.widgetType === 'clock' ? <AlarmClock className="w-4 h-4 sm:w-5 sm:h-5" /> :
                                 widget.widgetType === 'search' ? <Search className="w-4 h-4 sm:w-5 sm:h-5" /> :
                                 widget.widgetType === 'weather' ? <CloudSun className="w-4 h-4 sm:w-5 sm:h-5" /> :
                                 <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <div className="font-bold text-slate-700 text-[11px] sm:text-xs truncate">
                                  {widget.widgetType === 'clock' ? (t.widgetClock || '时钟与日期') :
                                   widget.widgetType === 'search' ? (t.widgetSearch || '快速搜索') :
                                   widget.widgetType === 'weather' ? (t.widgetWeather || '天气预报') : widget.title}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <span className="text-[8px] sm:text-[9px] font-bold font-mono bg-slate-100 border border-slate-200 px-1 py-0.2 rounded text-slate-500">{widget.size}</span>
                                  {widget.wrapLine && (
                                    <span className="text-[8px] sm:text-[9px] font-medium bg-purple-50 border border-purple-200 px-1 py-0.2 rounded text-purple-600 shrink-0">{isZh ? '换行' : 'Line Wrap'}</span>
                                  )}
                                  {widget.showBackground && (
                                    <span className="text-[8px] sm:text-[9px] font-medium bg-blue-50 border border-blue-200 px-1 py-0.2 rounded text-blue-600 shrink-0">{isZh ? '卡片' : 'Card BG'}</span>
                                  )}
                                  {widget.widgetType === 'weather' && (
                                    <span className="text-[8px] sm:text-[9px] font-medium bg-amber-50 border border-amber-200 px-1 py-0.2 rounded text-amber-600 shrink-0">
                                      📍 {widget.weatherLocation || localSettings.weatherLocation || '北京'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-0.5 sm:gap-1 opacity-0 sm:opacity-100 group-hover:opacity-100 transition-opacity shrink-0">
                              <div className="flex items-center border border-slate-150 bg-slate-50 rounded-lg p-0.5">
                                <button
                                  disabled={index === 0}
                                  onClick={() => handleMoveWidget(index, 'up')}
                                  className={`p-0.5 rounded transition-colors ${index === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-800 hover:bg-white'}`}
                                  title={isZh ? '前移' : 'Move Left'}
                                >
                                  <ChevronLeft className="w-3 h-3" />
                                </button>
                                <button
                                  disabled={index === state.widgets.length - 1}
                                  onClick={() => handleMoveWidget(index, 'down')}
                                  className={`p-0.5 rounded transition-colors ${index === state.widgets.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-800 hover:bg-white'}`}
                                  title={isZh ? '后移' : 'Move Right'}
                                >
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </div>
                              <button onClick={() => handleEditWidget(widget)} className="p-1 text-slate-400 hover:text-[#ec5b13] hover:bg-slate-100 rounded-lg transition-colors" title={t.edit || '编辑'}>
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button onClick={() => deleteWidget(widget.id)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title={t.delete || '删除'}>
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <footer className="sticky bottom-0 left-0 right-0 z-40 -mx-4 sm:-mx-8 px-4 sm:px-8 py-4 sm:py-6 flex justify-end gap-3 sm:gap-4 mt-8 bg-white/80 backdrop-blur-md border-t border-slate-100 sm:bg-transparent sm:backdrop-blur-none sm:border-0 pointer-events-none">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition-all shadow-sm pointer-events-auto text-sm sm:text-base"
          >
            {t.reset}
          </button>
          <button
            onClick={handleSave}
            className={`flex-[2] sm:flex-none px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold shadow-2xl transition-all flex items-center justify-center gap-2 pointer-events-auto text-sm sm:text-base ${
              saved ? 'bg-green-500 text-white shadow-green-500/30' : 'bg-[#ec5b13] text-white shadow-[#ec5b13]/30 hover:scale-[1.05] active:scale-[0.95]'
            }`}
          >
            {saved ? (<><CheckCircle className="w-4 h-4" />{t.saved}</>) : t.saveSettings}
          </button>
        </footer>
      </div>

      {/* 小组件编辑模态框 */}
      {isWidgetModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsWidgetModalOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-800">{editingWidget ? (t.editWidget || '编辑小组件') : (t.addWidget || '添加小组件')}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">{t.widgetTypeLabel || '组件类型'}</label>
                <select
                  className="w-full mt-1.5 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 outline-none border focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors appearance-none"
                  value={widgetForm.widgetType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    let newSize = widgetForm.size;
                    if (newType !== 'search' && (newSize === '3x1' || newSize === '4x1')) newSize = '2x1';
                    setWidgetForm({ ...widgetForm, widgetType: newType, size: newSize });
                  }}
                >
                  <option value="clock">{t.widgetClock || '时钟与日期'}</option>
                  <option value="search">{t.widgetSearch || '快速搜索'}</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">{t.itemSizeLabel || '显示尺寸'}</label>
                <div className="grid gap-2 mt-1.5" style={{ gridTemplateColumns: `repeat(${widgetForm.widgetType === 'search' ? 6 : 4}, minmax(0, 1fr))` }}>
                  {(widgetForm.widgetType === 'search'
                    ? ['1x1', '2x1', '3x1', '4x1', '1x2', '2x2']
                    : ['1x1', '2x1', '1x2', '2x2']
                  ).map(s => (
                    <button
                      key={s}
                      onClick={() => setWidgetForm({ ...widgetForm, size: s })}
                      className={`p-2 rounded-lg border-2 transition-all text-xs font-bold font-mono tracking-wider ${
                        (widgetForm.size || '1x1') === s ? 'border-[#ec5b13] bg-[#ec5b13]/5 text-[#ec5b13]' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="space-y-0.5">
                  <label className="text-sm font-semibold text-slate-700">
                    {t.widgetBackgroundLabel || '卡片背景'}
                  </label>
                  <p className="text-[11px] text-slate-400">开启后将显示白色半透明卡片背景</p>
                </div>
                <button
                  type="button"
                  onClick={() => setWidgetForm({ ...widgetForm, showBackground: !widgetForm.showBackground })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${widgetForm.showBackground ? 'bg-[#ec5b13]' : 'bg-slate-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${widgetForm.showBackground ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="space-y-0.5">
                  <label className="text-sm font-semibold text-slate-700">另起一行 (换行显示)</label>
                  <p className="text-[11px] text-slate-400">开启后此小组件将强制从新行开头显示</p>
                </div>
                <button
                  type="button"
                  onClick={() => setWidgetForm({ ...widgetForm, wrapLine: !widgetForm.wrapLine })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${widgetForm.wrapLine ? 'bg-[#ec5b13]' : 'bg-slate-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${widgetForm.wrapLine ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setIsWidgetModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 font-medium hover:bg-slate-50 transition-colors">{t.cancel}</button>
              <button onClick={handleSaveWidget} className="px-5 py-2.5 rounded-xl bg-[#ec5b13] text-white font-semibold hover:bg-[#d4520f] transition-colors shadow-lg shadow-[#ec5b13]/20">{t.save}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={confirmReset}
        title={t.reset}
        message={isZh
          ? '确定要重置个性化设置吗？壁纸、玻璃效果、卡片尺寸将恢复默认值（不影响站点名称与语言）。'
          : 'Reset personalization? Wallpaper, glass effect and card size will be restored (site name and language are untouched).'}
        confirmText={t.reset}
        cancelText={t.cancel || '取消'}
        type="warning"
      />
    </div>
  );
}
