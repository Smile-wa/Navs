/**
 * 个性化设置页面
 * NOTE: 合并了原「壁纸与背景」页的全部功能，并收纳外观效果、首页卡片尺寸与小组件管理
 */

import React, { useState, useRef } from 'react';
import { useData, DEFAULT_SETTINGS, type Bookmark } from '../../context/DataContext.tsx';
import {
  Image as ImageIcon, CheckCircle, Upload, RefreshCw, HelpCircle, LayoutGrid,
  AlarmClock, CloudSun, Search, Plus, Trash2, ChevronLeft, ChevronRight, Palette, MapPin
} from 'lucide-react';
import { TRANSLATIONS } from '../../i18n/translations.ts';
import ConfirmModal from '../../components/ConfirmModal.tsx';
import HomePreview from '../../components/HomePreview.tsx';

export default function Personalization() {
  const { state, updateSettings, addWidget, updateWidget, deleteWidget, reorderWidgets } = useData();
  const [localSettings, setLocalSettings] = useState(state.settings);
  const t = TRANSLATIONS[state.settings.language || 'zh-CN'];
  const isZh = (state.settings.language || 'zh-CN') === 'zh-CN';
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'wallpaper' | 'appearance' | 'widgets'>('wallpaper');
  const [previewUrl, setPreviewUrl] = useState(state.settings.wallpaperUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // 添加小组件（各项设置直接用列表中的下拉框修改，无需弹窗）
  const handleAddWidget = () => {
    addWidget({
      title: 'Clock',
      size: '2x1',
      widgetType: 'clock',
      showBackground: false,
      wrapLine: false,
      itemType: 'widget',
      url: '',
      icon: '',
    } as any);
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

  // 顶部切换标签：壁纸与背景 / 外观设置 / 小组件设置（含副标题）
  const TABS = [
    {
      key: 'wallpaper' as const,
      label: t.wallpaperTitle,
      subtitle: isZh ? '壁纸、背景与视觉效果' : 'Wallpaper & visual effects',
      icon: ImageIcon,
    },
    {
      key: 'appearance' as const,
      label: t.appearanceSettings,
      subtitle: isZh ? '配色方案与卡片风格' : 'Colors & card style',
      icon: LayoutGrid,
    },
    {
      key: 'widgets' as const,
      label: t.widgetSettings || (isZh ? '小组件设置' : 'Widgets'),
      subtitle: isZh ? '天气、时钟与小组件管理' : 'Weather, clock & widgets',
      icon: Palette,
    },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 min-w-0">
      {/* ===== 页面标题 + 右上角操作 ===== */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 lg:mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">{t.navPersonalization}</h2>
          <p className="text-slate-500 mt-1.5">
            {isZh ? '壁纸与背景、玻璃效果、卡片尺寸与首页小组件' : 'Wallpaper, glass effect, card size and widgets'}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${saved ? 'text-green-600' : 'text-slate-400'}`}>
            <CheckCircle className="w-3.5 h-3.5" />
            {saved ? (isZh ? '配置已保存' : 'Saved') : (isZh ? '配置已同步' : 'Synced')}
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition-all shadow-sm text-sm"
          >
            {t.reset}
          </button>
          <button
            onClick={handleSave}
            className={`px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 text-sm ${
              saved ? 'bg-green-500 text-white shadow-green-500/30' : 'bg-[#ec5b13] text-white shadow-[#ec5b13]/30 hover:scale-[1.03] active:scale-[0.97]'
            }`}
          >
            {saved ? (<><CheckCircle className="w-4 h-4" />{t.saved}</>) : (isZh ? '保存配置' : t.saveSettings)}
          </button>
        </div>
      </header>

      {/* ===== 一体化设置卡片：顶部标签栏 + 下方左右两列 ===== */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm min-w-0">

        {/* 顶部标签栏（带副标题） */}
        <div className="flex gap-1 sm:gap-2 overflow-x-auto border-b border-slate-200 px-2 sm:px-4 pt-2 min-w-0 rounded-t-2xl">
          {TABS.map(({ key, label, subtitle, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`relative shrink-0 flex items-center gap-2.5 px-3 sm:px-5 py-3 sm:py-4 rounded-t-xl border-b-[3px] text-left transition-all ${
                  active
                    ? 'border-[#ec5b13] bg-[#ec5b13]/[0.04]'
                    : 'border-transparent hover:bg-slate-50'
                }`}
              >
                <span className={`p-2 rounded-lg shrink-0 transition-colors ${active ? 'bg-[#ec5b13]/10 text-[#ec5b13]' : 'bg-slate-100 text-slate-400'}`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
                <span className="flex flex-col min-w-0">
                  <span className={`font-bold text-sm sm:text-base whitespace-nowrap transition-colors ${active ? 'text-[#ec5b13]' : 'text-slate-700'}`}>{label}</span>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 whitespace-nowrap font-medium">{subtitle}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* 下方两列：左侧设置内容（约 3/5）、右侧预览（约 2/5，滚动时固定） */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(320px,38%)] items-start">

        {/* ===== 左下角：当前标签的设置内容 ===== */}
        <div className="p-4 sm:p-6 lg:p-8 min-w-0 order-last lg:order-1">

        {/* ===== 壁纸与背景 ===== */}
        {activeTab === 'wallpaper' && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <ImageIcon className="w-5 h-5 text-[#ec5b13]" />
            <h3 className="text-xl font-bold">{t.wallpaperTitle}</h3>
          </div>

          <div className="bg-slate-50/70 p-4 sm:p-6 rounded-2xl border border-slate-100 space-y-6 min-w-0">
            <p className="text-sm text-slate-500">{t.wallpaperDesc}</p>

            <div className="grid grid-cols-1 min-[1400px]:grid-cols-2 gap-6">
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
        )}

        {/* ===== 首页布局：卡片尺寸 ===== */}
        {activeTab === 'appearance' && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <LayoutGrid className="w-5 h-5 text-[#ec5b13]" />
            <h3 className="text-xl font-bold">{t.appearanceSettings}</h3>
          </div>
          <div className="grid gap-6 bg-slate-50/70 p-4 sm:p-6 rounded-2xl border border-slate-100 min-w-0 overflow-hidden">
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
        )}

        {/* ===== 小组件（含右上角天气组件） ===== */}
        {activeTab === 'widgets' && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Palette className="w-5 h-5 text-[#ec5b13]" />
            <h3 className="text-xl font-bold">{t.widgetSettings || '小组件'}</h3>
          </div>
          <div className="grid gap-6 bg-slate-50/70 p-4 sm:p-6 rounded-2xl border border-slate-100 min-w-0 overflow-hidden">
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
                  onClick={handleAddWidget}
                  className="px-3 py-1.5 bg-[#ec5b13] text-white rounded-lg text-xs font-semibold hover:bg-[#d4520f] transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t.addWidget || '添加小组件'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                {isZh ? '各小组件的显示效果可在右侧实时预览窗口查看。' : 'See changes in the live preview on the right.'}
              </p>

              {/* ===== 右上角天气组件设置（整合自原独立天气卡片，紧凑行） ===== */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 mb-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 shrink-0">
                  <CloudSun className="w-4 h-4 text-[#ec5b13]" />
                  {isZh ? '右上角天气' : 'Corner weather'}
                </div>
                {/* 显示开关 */}
                <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer shrink-0">
                  {isZh ? '显示' : 'Show'}
                  <button
                    type="button"
                    aria-label={isZh ? '显示天气组件' : 'Show weather'}
                    onClick={() => setLocalSettings({ ...localSettings, showWeather: localSettings.showWeather === false })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      localSettings.showWeather !== false ? 'bg-[#ec5b13]' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                      localSettings.showWeather !== false ? 'translate-x-[18px]' : 'translate-x-[3px]'
                    }`} />
                  </button>
                </label>
                {/* 城市 / 地址 */}
                <div className="flex items-center gap-1.5 min-w-0 flex-1 sm:flex-none">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    aria-label={isZh ? '城市' : 'City'}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors w-full sm:w-28"
                    placeholder={isZh ? '城市 / 地址' : 'City'}
                    value={localSettings.weatherLocation || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, weatherLocation: e.target.value } as any)}
                  />
                </div>
                {/* 透明背景开关 */}
                <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer shrink-0">
                  {isZh ? '透明背景' : 'Transparent'}
                  <button
                    type="button"
                    aria-label={isZh ? '透明背景' : 'Transparent background'}
                    onClick={() => setLocalSettings({ ...localSettings, weatherTransparent: localSettings.weatherTransparent === false })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      localSettings.weatherTransparent !== false ? 'bg-[#ec5b13]' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                      localSettings.weatherTransparent !== false ? 'translate-x-[18px]' : 'translate-x-[3px]'
                    }`} />
                  </button>
                </label>
              </div>

              {state.widgets.length === 0 ? (
                <div className="text-center py-8 text-slate-400 flex flex-col items-center gap-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <LayoutGrid className="w-8 h-8 opacity-20" />
                  <p className="text-sm">{t.noWidgets || '暂无小组件，点击右上角添加'}</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {state.widgets.map((widget, index) => {
                    const isSearch = widget.widgetType === 'search';
                    const sizeOptions = isSearch
                      ? ['1x1', '2x1', '3x1', '4x1', '1x2', '2x2']
                      : ['1x1', '2x1', '1x2', '2x2'];
                    const TypeIcon = widget.widgetType === 'clock' ? AlarmClock :
                                     widget.widgetType === 'search' ? Search :
                                     widget.widgetType === 'weather' ? CloudSun : LayoutGrid;
                    const selectCls = "rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 outline-none focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors cursor-pointer";

                    return (
                      <div key={widget.id} className="flex flex-wrap items-center gap-2 p-2.5 sm:p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                        {/* 序号 + 类型图标 */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="w-5 h-5 rounded-md bg-[#ec5b13]/10 text-[#ec5b13] text-[10px] font-bold flex items-center justify-center">{index + 1}</span>
                          <span className="w-8 h-8 bg-[#ec5b13]/10 text-[#ec5b13] rounded-lg flex items-center justify-center shrink-0">
                            <TypeIcon className="w-4 h-4" />
                          </span>
                        </div>

                        {/* 类型 */}
                        <select
                          aria-label={isZh ? '组件类型' : 'Widget type'}
                          className={selectCls}
                          value={widget.widgetType || 'clock'}
                          onChange={(e) => {
                            const newType = e.target.value;
                            const newSize = (newType !== 'search' && (widget.size === '3x1' || widget.size === '4x1')) ? '2x1' : (widget.size || '1x1');
                            updateWidget(widget.id, {
                              widgetType: newType,
                              size: newSize as any,
                              title: newType === 'clock' ? 'Clock' : newType === 'search' ? 'Search' : 'Widget',
                            });
                          }}
                        >
                          <option value="clock">{t.widgetClock || '时钟与日期'}</option>
                          <option value="search">{t.widgetSearch || '快速搜索'}</option>
                          <option value="weather">{t.widgetWeather || '天气预报'}</option>
                        </select>

                        {/* 尺寸 */}
                        <select
                          aria-label={isZh ? '显示尺寸' : 'Size'}
                          className={selectCls}
                          value={widget.size || '1x1'}
                          onChange={(e) => updateWidget(widget.id, { size: e.target.value as any })}
                        >
                          {sizeOptions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>

                        {/* 卡片背景 */}
                        <select
                          aria-label={isZh ? '卡片背景' : 'Card background'}
                          className={selectCls}
                          value={widget.showBackground ? 'on' : 'off'}
                          onChange={(e) => updateWidget(widget.id, { showBackground: e.target.value === 'on' })}
                        >
                          <option value="off">{isZh ? '透明背景' : 'Transparent'}</option>
                          <option value="on">{isZh ? '卡片背景' : 'Card BG'}</option>
                        </select>

                        {/* 换行 */}
                        <select
                          aria-label={isZh ? '换行显示' : 'Line wrap'}
                          className={selectCls}
                          value={widget.wrapLine ? 'on' : 'off'}
                          onChange={(e) => updateWidget(widget.id, { wrapLine: e.target.value === 'on' })}
                        >
                          <option value="off">{isZh ? '同行显示' : 'Inline'}</option>
                          <option value="on">{isZh ? '另起一行' : 'New line'}</option>
                        </select>

                        {/* 天气地址（天气类型时显示） */}
                        {widget.widgetType === 'weather' && (
                          <input
                            type="text"
                            aria-label={isZh ? '城市' : 'City'}
                            className={`${selectCls} w-24 min-w-0`}
                            placeholder={isZh ? '城市' : 'City'}
                            value={widget.weatherLocation || ''}
                            onChange={(e) => updateWidget(widget.id, { weatherLocation: e.target.value })}
                          />
                        )}

                        {/* 排序与删除 */}
                        <div className="flex items-center gap-0.5 ml-auto shrink-0">
                          <button
                            disabled={index === 0}
                            onClick={() => handleMoveWidget(index, 'up')}
                            className={`p-1 rounded transition-colors ${index === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                            title={isZh ? '前移' : 'Move left'}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            disabled={index === state.widgets.length - 1}
                            onClick={() => handleMoveWidget(index, 'down')}
                            className={`p-1 rounded transition-colors ${index === state.widgets.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                            title={isZh ? '后移' : 'Move right'}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteWidget(widget.id)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title={t.delete || '删除'}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
        )}

        </div>
        {/* ===== 左下角：设置内容列结束 ===== */}

        {/* ===== 右下角：实时预览（桌面端滚动时固定） ===== */}
        <div className="order-first lg:order-2 lg:self-stretch min-w-0 border-b lg:border-b-0 lg:border-l border-slate-100 bg-slate-50/40 p-3 sm:p-4">
          <div className="lg:sticky lg:top-6">
            <HomePreview
              sticky
              maxHeight={620}
              settings={localSettings}
              widgets={state.widgets || []}
              categories={state.categories || []}
              isZh={isZh}
            />
          </div>
        </div>
        </div>
        {/* ===== 两列布局结束 ===== */}
      </div>
      {/* ===== 一体化设置卡片结束 ===== */}

      {/* 移动端底部操作栏 */}
      <div className="lg:hidden sticky bottom-0 z-30 mt-4 flex justify-end gap-3 rounded-2xl border border-slate-200/70 bg-white/90 backdrop-blur-md px-3 py-3 shadow-lg">
        <button type="button" onClick={handleReset} className="px-5 py-2.5 rounded-xl font-bold bg-white border border-slate-200 text-slate-600 text-sm">{t.reset}</button>
        <button onClick={handleSave} className={`px-6 py-2.5 rounded-xl font-bold text-sm ${saved ? 'bg-green-500 text-white' : 'bg-[#ec5b13] text-white'}`}>
          {saved ? (<><CheckCircle className="w-4 h-4 inline mr-1" />{t.saved}</>) : (isZh ? '保存配置' : t.saveSettings)}
        </button>
      </div>


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
