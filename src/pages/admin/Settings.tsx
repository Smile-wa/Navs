/**
 * 基本设置页面
 * NOTE: 站点名称、默认搜索引擎、系统语言、时区、认证跳转等基础配置
 *       壁纸、外观与布局相关配置已移至「个性化设置」页面
 */

import React, { useState, useRef } from 'react';
import { useData, PRESET_SEARCH_ENGINES, DEFAULT_SETTINGS } from '../../context/DataContext.tsx';
import { Settings as SettingsIcon, Search, CheckCircle, Globe, HelpCircle, Upload, Image as ImageIcon, X } from 'lucide-react';
import { TRANSLATIONS } from '../../i18n/translations.ts';
import ConfirmModal from '../../components/ConfirmModal.tsx';

export default function Settings() {
  const { state, updateSettings } = useData();
  const [localSettings, setLocalSettings] = useState(state.settings);
  const t = TRANSLATIONS[state.settings.language || 'zh-CN'];
  const isZh = (state.settings.language || 'zh-CN') === 'zh-CN';
  const [saved, setSaved] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // 搜索引擎下拉值：预设 url 用 url 本身，自定义统一为 '__custom__'
  const SEARCH_CUSTOM_VALUE = '__custom__';
  const isPresetEngine = (url: string) => PRESET_SEARCH_ENGINES.some(e => e.url === url);
  const searchSelectValue = isPresetEngine(localSettings.searchEngine) ? localSettings.searchEngine : SEARCH_CUSTOM_VALUE;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert(isZh ? '图标大小不能超过 2MB' : 'Logo size must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = (event) => {
      setLocalSettings({ ...localSettings, siteLogo: event.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => setIsResetModalOpen(true);

  // 仅重置基础配置，不影响壁纸、外观等个性化设置
  const confirmReset = () => {
    setLocalSettings({
      ...localSettings,
      siteName: DEFAULT_SETTINGS.siteName,
      siteLogo: DEFAULT_SETTINGS.siteLogo,
      searchEngine: DEFAULT_SETTINGS.searchEngine,
      language: DEFAULT_SETTINGS.language,
      timezone: DEFAULT_SETTINGS.timezone,
      authRedirect: DEFAULT_SETTINGS.authRedirect,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6 sm:space-y-8 min-w-0">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">{t.basicSettings}</h2>
          <p className="text-slate-500 mt-2">
            {isZh ? '站点名称、搜索引擎、语言与时区等基础配置' : 'Site name, search engine, language and timezone'}
          </p>
        </div>
      </header>

      <div className="space-y-12 pb-24">
        <section>
          <div className="flex items-center gap-2 mb-6">
            <SettingsIcon className="w-5 h-5 text-[#ec5b13]" />
            <h3 className="text-xl font-bold">{t.basicSettings}</h3>
          </div>

          <div className="grid gap-6 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm min-w-0 overflow-hidden">
            {/* 网站名称 */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">{t.siteNameLabel}</label>
              <input
                type="text"
                id="setting-site-name"
                className="w-full rounded-xl border-slate-200 bg-slate-50 focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none border transition-colors"
                placeholder={t.siteNamePlaceholder}
                value={localSettings.siteName}
                onChange={(e) => setLocalSettings({ ...localSettings, siteName: e.target.value })}
              />
            </div>

            {/* 网站图标 */}
            <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
              <label className="text-sm font-semibold flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-slate-400" />
                {t.siteLogoLabel}
              </label>
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-[#ec5b13]/50 transition-colors"
                  onClick={() => logoInputRef.current?.click()}
                  title={t.siteLogoUpload}
                >
                  {localSettings.siteLogo ? (
                    <img src={localSettings.siteLogo} alt="logo" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-7 h-7 text-slate-300" />
                  )}
                </div>
                <div className="flex flex-col gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ec5b13]/10 text-[#ec5b13] font-semibold text-sm hover:bg-[#ec5b13]/20 transition-colors w-fit"
                  >
                    <Upload className="w-4 h-4" />
                    {t.siteLogoUpload}
                  </button>
                  {localSettings.siteLogo && (
                    <button
                      type="button"
                      onClick={() => setLocalSettings({ ...localSettings, siteLogo: '' })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors text-xs w-fit"
                    >
                      <X className="w-3.5 h-3.5" />
                      {t.removeLogo || '移除图标'}
                    </button>
                  )}
                  <p className="text-xs text-slate-400">{t.siteLogoDesc}</p>
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </div>
            </div>

            {/* 默认搜索引擎 */}
            <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                {t.searchEngineLabel}
              </label>

              <select
                id="setting-search-engine"
                className="w-full rounded-xl border-slate-200 bg-slate-50 focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none border transition-colors text-sm font-medium cursor-pointer"
                value={searchSelectValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setLocalSettings({
                    ...localSettings,
                    searchEngine: value === SEARCH_CUSTOM_VALUE
                      ? (isPresetEngine(localSettings.searchEngine) ? '' : localSettings.searchEngine)
                      : value,
                  });
                }}
              >
                {PRESET_SEARCH_ENGINES.map((engine) => (
                  <option key={engine.id} value={engine.url}>{engine.name}</option>
                ))}
                <option value={SEARCH_CUSTOM_VALUE}>{t.searchEngineOther || '其他（手动输入）'}</option>
              </select>

              {!isPresetEngine(localSettings.searchEngine) && (
                <div className="space-y-2 animate-fade-in">
                  <p className="text-xs font-medium text-slate-400">{t.searchEngineManual}</p>
                  <input
                    type="text"
                    id="setting-search-engine-url"
                    className="w-full rounded-xl border-slate-200 bg-slate-50 focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none border transition-colors text-sm"
                    placeholder="例如: https://www.google.com/search?q="
                    value={localSettings.searchEngine}
                    onChange={(e) => setLocalSettings({ ...localSettings, searchEngine: e.target.value })}
                  />
                  <p className="text-xs text-slate-400">{t.searchEngineDesc}</p>
                </div>
              )}
            </div>

            {/* 系统语言 */}
            <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
              <label className="text-sm font-semibold flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-slate-400" />
                {t.languageLabel}
              </label>
              <select
                value={localSettings.language}
                onChange={(e) => setLocalSettings({ ...localSettings, language: e.target.value as any })}
                className="w-full rounded-xl border-slate-200 bg-slate-50 focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none border transition-colors text-sm font-medium"
              >
                <option value="zh-CN">简体中文 (Chinese Simplified)</option>
                <option value="en-US">English (United States)</option>
              </select>
            </div>

            {/* 显示时区 */}
            <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-400" />
                {t.timezoneLabel}
              </label>
              <select
                className="w-full rounded-xl border-slate-200 bg-slate-50 focus:ring-[#ec5b13] focus:border-[#ec5b13] px-4 py-3 outline-none border transition-colors text-sm font-medium cursor-pointer"
                value={localSettings.timezone}
                onChange={(e) => setLocalSettings({ ...localSettings, timezone: e.target.value })}
              >
                <option value="">{t.timezoneSystem}</option>
                <option value="Asia/Shanghai">中国/北京 (Asia/Shanghai)</option>
                <option value="Asia/Hong_Kong">中国/香港 (Asia/Hong_Kong)</option>
                <option value="Asia/Taipei">中国/台北 (Asia/Taipei)</option>
                <option value="Asia/Tokyo">日本/东京 (Asia/Tokyo)</option>
                <option value="Asia/Singapore">新加坡 (Asia/Singapore)</option>
                <option value="America/New_York">美国/纽约 (America/New_York)</option>
                <option value="America/Los_Angeles">美国/洛杉矶 (America/Los_Angeles)</option>
                <option value="Europe/London">英国/伦敦 (Europe/London)</option>
                <option value="Europe/Paris">法国/巴黎 (Europe/Paris)</option>
                <option value="Europe/Berlin">德国/柏林 (Europe/Berlin)</option>
                <option value="Australia/Sydney">澳大利亚/悉尼 (Australia/Sydney)</option>
              </select>
              <p className="text-xs text-slate-400">{t.timezoneDesc}</p>
            </div>

            {/* 认证跳转 */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-slate-800">{t.authRedirectLabel}</label>
                <div className="relative group flex items-center">
                  <div className="p-1 rounded-full text-slate-400 hover:text-[#ec5b13] hover:bg-[#ec5b13]/10 transition-colors cursor-help" title={t.authRedirectDesc}>
                    <HelpCircle className="w-3.5 h-3.5" />
                  </div>
                  <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:flex items-center px-3 py-1.5 bg-slate-900/95 text-white text-xs font-medium rounded-xl w-64 sm:w-72 shadow-2xl backdrop-blur-md z-50 pointer-events-none transition-all leading-relaxed border border-white/10">
                    {t.authRedirectDesc}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, authRedirect: !localSettings.authRedirect })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                  localSettings.authRedirect ? 'bg-[#ec5b13]' : 'bg-slate-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  localSettings.authRedirect ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
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

      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={confirmReset}
        title={t.reset}
        message={isZh
          ? '确定要重置基础配置吗？站点名称、搜索引擎、语言与时区将恢复默认值（不影响壁纸与外观）。'
          : 'Reset basic settings? Site name, search engine, language and timezone will be restored (wallpaper and appearance are untouched).'}
        confirmText={t.reset}
        cancelText={t.cancel || '取消'}
        type="warning"
      />
    </div>
  );
}
