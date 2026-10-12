/**
 * YuNest 前台首页
 * NOTE: 核心导航展示界面，包含壁纸背景、实时时钟、搜索和书签卡片
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useData, PRESET_SEARCH_ENGINES } from '../context/DataContext.tsx';
import { 
  Search, 
  Settings as SettingsIcon, 
  ExternalLink, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Globe, 
  BookOpen, 
  Github,
  Bot,
  Cloud,
  Code2,
  Mail,
  Users,
  Palette,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Menu
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations.ts';
import { WidgetRenderer } from '../components/widgets/WidgetRenderer.tsx';
import { getFaviconProxyUrl, normalizeIconUrl } from '../lib/favicon.ts';
import { FaviconImg } from '../components/FaviconImg.tsx';


/** 实时时钟 Hook */
function useClock(timezoneID?: string, language: 'zh-CN' | 'en-US' = 'zh-CN') {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatWithFallback = (options: Intl.DateTimeFormatOptions) => {
    try {
      return new Intl.DateTimeFormat(language, options).format(now);
    } catch (e) {
      return new Intl.DateTimeFormat(language, { ...options, timeZone: 'Asia/Shanghai' }).format(now);
    }
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: timezoneID || undefined
  };

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    timeZone: timezoneID || undefined
  };

  return { 
    time: '', 
    date: '' 
  };
}

export default function Home() {
  const { state, isReady } = useData();
  const { settings, categories, widgets = [] } = state;
  const t = TRANSLATIONS[settings.language || 'zh-CN'];
  const navigate = useNavigate();
  
  // 认证相关
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState(false);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('yunest_auth') === 'true');
  
  // 背景加载相关
  const [isBgLoaded, setIsBgLoaded] = useState(false);
  
  // 右键菜单相关
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, bookmark: any } | null>(null);

  // ====== 侧边栏状态 ======
  const [activeSidebarId, setActiveSidebarId] = useState<string>('all');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // ====== 侧边栏数据（完全由后台 categories 自动生成） ======
  const sidebarCategories = useMemo(() => {
    return categories
      .filter(c => c.bookmarks.length > 0)
      .filter(c => !c.isHidden || isAdmin);
  }, [categories, isAdmin]);

  // ====== 右侧内容区根据侧边栏选中状态过滤 ======
  const visibleCategories = useMemo(() => {
    if (activeSidebarId === 'all') {
      return sidebarCategories;
    }
    return sidebarCategories.filter(c => c.id === activeSidebarId);
  }, [sidebarCategories, activeSidebarId]);

  const handleContextMenu = (e: React.MouseEvent, bookmark: any) => {
    if (bookmark.lanUrl) {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, bookmark });
    }
  };

  useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);
    window.addEventListener('click', handleCloseMenu);
    window.addEventListener('scroll', handleCloseMenu);
    return () => {
      window.removeEventListener('click', handleCloseMenu);
      window.removeEventListener('scroll', handleCloseMenu);
    };
  }, []);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const safeScrollY = Math.max(0, currentScrollY);

      if (safeScrollY <= 20) {
        setIsScrolled(false);
      } else if (safeScrollY > lastScrollY) {
        setIsScrolled(true);
      } else if (safeScrollY < lastScrollY) {
        setIsScrolled(false);
      }
      lastScrollY = safeScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const blurValue = (settings.glassEffectOpacity / 100) * 40;
    const opacityValue = 0.1 + (settings.glassEffectOpacity / 100) * 0.7;
    
    root.style.setProperty('--glass-blur', `${blurValue}px`);
    root.style.setProperty('--glass-opacity', `${opacityValue}`);
  }, [settings.glassEffectOpacity]);

  // 选中分类后自动关闭移动端抽屉
  const handleSelectCategory = (id: string) => {
    setActiveSidebarId(id);
    setIsMobileSidebarOpen(false);
  };

  const bgUrl = useMemo(() => {
    if (settings.wallpaperType === 'local' && settings.localWallpaper) {
      return settings.localWallpaper;
    }
    const url = settings.wallpaperUrl || 'https://pic.yumekai.top/pic?img=ua';
    if (settings.wallpaperType === 'api') {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}t=${Date.now()}`;
    }
    return url;
  }, [settings.wallpaperType, settings.wallpaperUrl, settings.localWallpaper]);

  const handleAdminAuth = (e?: React.FormEvent) => {
    e?.preventDefault();
    const adminPass = (import.meta as any).env.ADMIN_PASSWORD || 'admin1234';
    
    if (password === adminPass) {
      sessionStorage.setItem('yunest_auth', 'true');
      sessionStorage.setItem('yunest_admin_pwd', password);
      setShowAuthModal(false);
      setIsAdmin(true);
      setPassword('');
      if (settings.authRedirect) {
        navigate('/admin/settings');
      }
    } else {
      setAuthError(true);
      setTimeout(() => setAuthError(false), 2000);
    }
  };

  const openAuth = () => {
    if (sessionStorage.getItem('yunest_auth') === 'true') {
      navigate('/admin/settings');
    } else {
      setShowAuthModal(true);
    }
  };

  if (!isReady) {
    return (
      <div className="fixed inset-0 z-[1000] bg-[#0a0a0a] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="text-3xl font-extralight tracking-[0.5em] text-white/90 uppercase animate-pulse">
            {settings.siteName || 'YuNest'}
          </div>
          <div className="mt-8 w-48 h-[1px] bg-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/40 animate-loading-bar" />
          </div>
        </div>
      </div>
    );
  }

  const renderIcon = (iconName: string, siteUrl?: string, size: string = 'w-5 h-5') => {
    if (iconName && (
      iconName.startsWith('http://') || iconName.startsWith('https://') ||
      iconName.startsWith('/') || iconName.startsWith('data:')
    )) {
      const src = normalizeIconUrl(iconName);
      const isProxyUrl = src.startsWith('/api/icon-proxy');
      if (isProxyUrl) {
        return <FaviconImg src={src} className={`${size} object-contain rounded-sm`} fallbackClassName={`${size} text-white/50`} />;
      }
      const fallbackProxySrc = siteUrl ? getFaviconProxyUrl(siteUrl) : '';
      return <FaviconImg src={src} fallbackSrc={fallbackProxySrc || undefined} className={`${size} object-contain rounded-sm`} fallbackClassName={`${size} text-white/50`} />;
    }

    const IconComponent = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    if (IconComponent) {
      return <IconComponent className={`${size} text-white/70`} />;
    }

    if (siteUrl) {
      const proxyUrl = getFaviconProxyUrl(siteUrl);
      if (proxyUrl) {
        return <FaviconImg src={proxyUrl} className={`${size} object-contain rounded-sm`} fallbackClassName={`${size} text-white/50`} />;
      }
    }

    return <Icons.Globe className={`${size} text-white/70`} />;
  };

  // ====== 侧边栏内容（复用于桌面端和移动端抽屉，自动撑高显示所有分类） ======
  const renderSidebarContent = (isMobile: boolean = false) => {
    const collapsed = isMobile ? false : isCollapsed;
    
    return (
      <div className="flex flex-col items-center gap-1.5 w-full px-3 py-4 rounded-3xl glass shadow-2xl">
        {/* 菜单列表 —— 不设高度限制，让侧边栏完整显示所有分类 */}
        <div className="flex flex-col items-center gap-1.5 w-full">
          
          {/* “全部” 入口 */}
          <div
            onClick={() => handleSelectCategory('all')}
            title={collapsed ? '全部' : undefined}
            className={`flex items-center justify-center w-full px-3 py-3 rounded-2xl cursor-pointer transition-all duration-300 group flex-shrink-0 ${
              activeSidebarId === 'all'
                ? 'bg-white/15 text-white shadow-lg border border-white/10'
                : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <LayoutGrid className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${
              activeSidebarId === 'all' ? 'text-white scale-110' : 'text-white/40 group-hover:text-white/70'
            }`} />
            {!collapsed && (
              <>
                <span className="ml-3 flex-1 text-[13px] font-medium tracking-wide text-left truncate">
                  全部
                </span>
                <span className={`text-[11px] font-mono ml-1 ${
                  activeSidebarId === 'all' ? 'text-white/60' : 'text-white/25'
                }`}>
                  {sidebarCategories.reduce((sum, c) => sum + c.bookmarks.length, 0)}
                </span>
              </>
            )}
          </div>

          {/* 分隔线 */}
          <div className="w-full h-px bg-white/5 my-1 flex-shrink-0" />

          {/* 动态分类（自动同步后台） */}
          {sidebarCategories.map((category) => {
            const isActive = activeSidebarId === category.id;
            return (
              <div
                key={category.id}
                onClick={() => handleSelectCategory(category.id)}
                title={collapsed ? category.title : undefined}
                className={`flex items-center justify-center w-full px-3 py-3 rounded-2xl cursor-pointer transition-all duration-300 group flex-shrink-0 ${
                  isActive
                    ? 'bg-white/15 text-white shadow-lg border border-white/10'
                    : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                  {renderIcon(category.icon, undefined, 'w-5 h-5')}
                </div>

                {!collapsed && (
                  <>
                    <span className="ml-3 flex-1 text-[13px] font-medium tracking-wide text-left truncate">
                      {category.title}
                    </span>
                    <span className={`text-[11px] font-mono ml-1 ${
                      isActive ? 'text-white/60' : 'text-white/25'
                    }`}>
                      {category.bookmarks.length}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* 折叠/展开按钮（移动端不显示） */}
        {!isMobile && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? '展开侧边栏' : '折叠侧边栏'}
            className="mt-3 flex items-center justify-center w-full py-2.5 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition-all duration-300 cursor-pointer border-0 bg-transparent flex-shrink-0"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="ml-2 text-[12px] font-medium">收起</span>
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  const sidebarWidth = isCollapsed ? 'w-[72px]' : 'w-[220px]';

  return (
    <div className="text-white min-h-screen font-sans selection:bg-white/20 relative overflow-hidden">
      {/* 背景壁纸层 */}
      <div className="fixed inset-0 z-0 overflow-hidden bg-[#0a0a0a]" 
        style={settings.wallpaperType === 'color' ? { backgroundColor: settings.backgroundColor } : {}}>
        
        {settings.wallpaperType !== 'color' && !isBgLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1c2c] via-[#4a192c] to-[#121212] animate-pulse opacity-40" />
        )}

        {settings.wallpaperType !== 'color' && (
          <img
            src={bgUrl}
            alt="Background"
            onLoad={() => setIsBgLoaded(true)}
            className={`w-full h-full object-cover animate-bg-drift transition-opacity duration-1000 ${
              isBgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== 'https://pic.yumekai.top/pic?img=ua') {
                target.src = 'https://pic.yumekai.top/pic?img=ua';
              }
            }}
          />
        )}
        {settings.darkMask && (
          <div 
            className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none transition-opacity duration-500" 
            style={{ opacity: settings.darkMaskOpacity / 100 }}
          />
        )}
        {settings.glassEffect && (
          <div 
            className="absolute inset-0 pointer-events-none transition-all duration-500" 
            style={{ 
              backdropFilter: `blur(${(settings.glassEffectOpacity / 100) * 12}px)`,
              WebkitBackdropFilter: `blur(${(settings.glassEffectOpacity / 100) * 12}px)`,
              backgroundColor: `rgba(0, 0, 0, ${ (settings.glassEffectOpacity / 100) * 0.08 })`
            }}
          />
        )}
      </div>

      {/* 左上角网站标题（桌面端） */}
      <div 
        className={`fixed top-6 left-8 z-50 transition-all duration-500 ease-in-out hidden sm:block ${
          isScrolled ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}
      >
        <a
          href="https://navdocs.072199.xyz/"
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-2 no-underline cursor-pointer"
          title={t.docsTooltip}
        >
          <h1 className="text-lg font-medium tracking-[0.15em] text-white/60 group-hover:text-white transition-colors duration-300 uppercase flex items-center gap-1.5">
            {settings.siteName}
            <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-all duration-300 -translate-x-1 group-hover:translate-x-0" />
          </h1>
        </a>
      </div>

      {/* 移动端汉堡按钮（左上角） */}
      <div className={`fixed top-6 left-4 z-50 md:hidden transition-all duration-500 ${
        isScrolled ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
      }`}>
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-3 rounded-2xl glass text-white/70 hover:text-white transition-all duration-300 hover:bg-white/10 border-0 cursor-pointer flex items-center justify-center"
          title="打开分类菜单"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* 右上角设置按钮 */}
      <div 
        className={`fixed top-6 right-6 z-50 transition-all duration-500 ease-in-out ${
          isScrolled ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}
      >
        <button
          onClick={openAuth}
          className="p-3 rounded-2xl glass text-white/40 hover:text-white/90 transition-all duration-300 hover:bg-white/10 group flex items-center justify-center border-0 cursor-pointer"
          title={t.settingsIcon}
        >
          <SettingsIcon className="w-5 h-5 transition-transform duration-500 group-hover:rotate-90" />
        </button>
      </div>

      {/* ====== 桌面端侧边栏（固定定位，上下居中，自动同步后台分类，完整显示所有分类） ====== */}
      <aside
        className={`hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 z-30 flex-col items-center transition-all duration-300 ease-in-out ${sidebarWidth}`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* ====== 移动端抽屉式侧边栏 ====== */}
      {/* 遮罩层 */}
      <div
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300 ${
          isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      {/* 抽屉本体（移动端分类过多时，超过 90vh 才出现滚动） */}
      <aside
        className={`fixed left-0 top-1/2 -translate-y-1/2 z-[70] w-[260px] px-3 md:hidden transition-transform duration-300 ease-out ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="relative">
          {/* 关闭按钮 */}
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md text-white/70 hover:text-white flex items-center justify-center border border-white/10 cursor-pointer"
            title="关闭菜单"
          >
            <X className="w-4 h-4" />
          </button>
          
          {renderSidebarContent(true)}
        </div>
      </aside>

      {/* ====== 右侧主内容区 ====== */}
      <div 
        className={`relative z-10 flex min-h-screen transition-all duration-300 ${
          isCollapsed ? 'md:pl-[72px]' : 'md:pl-[220px]'
        }`}
      >
        <main className={`flex-1 flex flex-col items-center justify-start min-h-screen px-4 sm:px-6 ${
          widgets && widgets.length > 0 ? 'pt-6 sm:pt-10' : 'pt-16 sm:pt-24'
        }`}>

          {/* 移动端标题 */}
          <header className="text-center mb-8 animate-fade-in sm:hidden" style={{ animationDelay: '0.1s' }}>
            <a
              href="https://navdocs.072199.xyz/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold tracking-[0.4em] text-white/40 hover:text-white/80 uppercase no-underline transition-colors"
              title={t.docsTooltip}
            >
              {settings.siteName}
            </a>
          </header>

          {/* 全局小组件区域 */}
          {widgets && widgets.length > 0 && (
            <div 
              className={`w-full max-w-7xl mb-6 animate-fade-in flex relative z-40 ${
                settings.widgetAlignment === 'left' ? 'justify-start' : 
                settings.widgetAlignment === 'right' ? 'justify-end' : 
                'justify-center'
              }`} 
              style={{ animationDelay: '0.2s' }}
            >
              <div 
                className="flex flex-wrap gap-3 sm:gap-4 px-1 relative z-40" 
                style={{ 
                  width: '100%',
                  justifyContent: settings.widgetAlignment === 'left' ? 'flex-start' : 
                                  settings.widgetAlignment === 'right' ? 'flex-end' : 
                                  'center'
                }}
              >
                {widgets.map((widget, index) => {
                  const widthClass = 
                    widget.size?.startsWith('4x') ? 'widget-width-4x' :
                    widget.size?.startsWith('3x') ? 'widget-width-3x' :
                    widget.size?.startsWith('2x') ? 'widget-width-2x' : 'widget-width-1x';
                  
                  const heightClass = !widget.showBackground && !widget.size?.endsWith('x2')
                    ? 'h-auto'
                    : widget.size?.endsWith('x2') ? 'widget-height-2x' : 'widget-height-1x';

                  return (
                    <React.Fragment key={widget.id}>
                      {widget.wrapLine && index > 0 && <div className="w-full h-0 flex-shrink-0" />}
                      <div className={`${widthClass} ${heightClass} flex-shrink-0 relative z-40`}>
                        <WidgetRenderer bookmark={widget} />
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* 书签分组 */}
          <div className="w-full max-w-7xl flex flex-col gap-12 pb-24">
            {visibleCategories.length === 0 ? (
              <div className="text-center text-white/40 text-sm py-20 animate-fade-in">
                该分类下暂无内容
              </div>
            ) : (
              visibleCategories.map((category, catIndex) => (
                <section
                  key={category.id}
                  className="animate-fade-in-scale"
                  style={{ animationDelay: `${0.4 + catIndex * 0.1}s` }}
                >
                  <h2 className="text-sm font-bold uppercase tracking-[0.25em] text-white/50 px-3 mb-6 flex items-center gap-3">
                    {renderIcon(category.icon, undefined, 'w-5 h-5')}
                    {category.title}
                    <span className="text-white/20 font-medium text-xs">({category.bookmarks.length})</span>
                  </h2>

                  {category.layout === 'grid' ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3 sm:gap-4 px-1">
                      {category.bookmarks.map((bookmark) => (
                        <a
                          key={bookmark.id}
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onContextMenu={(e) => handleContextMenu(e, bookmark)}
                          className="flex flex-col items-center justify-center group w-full h-full col-span-1 row-span-1 aspect-square glass rounded-2xl p-2 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                        >
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:-translate-y-1 transition-transform duration-300">
                            {renderIcon(bookmark.icon, bookmark.url, 'w-8 h-8')}
                          </div>
                          <span className="text-[12px] mt-1 font-medium text-white/50 group-hover:text-white transition-colors duration-300 text-center truncate w-full px-1">
                            {bookmark.title}
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 px-1">
                      {category.bookmarks.map((bookmark) => (
                        <a
                          key={bookmark.id}
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onContextMenu={(e) => handleContextMenu(e, bookmark)}
                          className="flex items-center p-3 sm:p-4 rounded-2xl glass hover:bg-white/10 hover:-translate-y-0.5 hover:border-white/15 transition-all duration-300 group min-w-0"
                        >
                          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/5 flex items-center justify-center mr-2.5 sm:mr-4 group-hover:bg-white/10 transition-colors duration-300 shrink-0">
                            {renderIcon(bookmark.icon, bookmark.url, 'w-5 h-5 sm:w-6 sm:h-6')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-white group-hover:text-white transition-colors duration-300 truncate">
                              {bookmark.title}
                            </p>
                            {bookmark.description && (
                              <p className="text-[9px] sm:text-[10px] text-white/50 uppercase tracking-wider mt-0.5 truncate">
                                {bookmark.description}
                              </p>
                            )}
                          </div>
                          <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/0 group-hover:text-white/30 transition-all duration-300 shrink-0 ml-1 sm:ml-2 hidden sm:block" />
                        </a>
                      ))}
                    </div>
                  )}
                </section>
              ))
            )}
          </div>

          {/* 页脚 */}
          <footer className="mt-auto pt-8 pb-10 text-center animate-fade-in flex flex-col items-center gap-3.5" style={{ animationDelay: '1.2s' }}>
            <div className="inline-flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-white/55 font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
              <span className="tracking-wider uppercase select-none text-white/50">{t.builtBy}</span>
              <span className="text-white/30 select-none">•</span>
              <div className="flex items-center gap-3">
                {/* 👇 个人博客链接：把 href 和文字换成你自己的 👇 */}
                <a
                  href="https://你的博客地址.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-white/70 hover:text-white transition-colors duration-200"
                  title="访问我的个人博客"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#ec5b13]" />
                  <span>个人博客</span>
                </a>
                <span className="text-white/30 select-none">•</span>
                {/* 👇 GitHub 链接：把 href 换成你自己的 👇 */}
                <a
                  href="https://github.com/你的用户名"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-white/70 hover:text-white transition-colors duration-200"
                  title="访问我的 GitHub"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub</span>
                </a>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* 认证弹窗 */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity" onClick={() => setShowAuthModal(false)} />
          <div className="relative w-full max-w-sm glass-modal rounded-3xl p-8 shadow-2xl animate-fade-in-scale text-white">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-2"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white/80 border border-white/10 mb-2">
                <Lock className="w-8 h-8" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{t.adminAuthTitle}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{t.adminAuthDesc}</p>
              </div>

              <form onSubmit={handleAdminAuth} className="w-full space-y-4">
                <div className="relative group">
                  <input
                    autoFocus
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t.adminAuthInput}
                    className={`w-full py-4 pl-6 pr-14 glass rounded-2xl outline-none text-center text-lg tracking-[0.3em] font-bold transition-all duration-300 border ${
                      authError ? 'border-red-500/50 text-red-100 bg-red-500/10 animate-shake' : 'border-white/5 focus:border-white/20 text-white'
                    }`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (authError) setAuthError(false);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-white/80 transition-all p-2 bg-white/5 rounded-xl hover:bg-white/10"
                  >
                    {showPassword ? <Icons.EyeOff className="w-5 h-5" /> : <Icons.Eye className="w-5 h-5" />}
                  </button>
                </div>
                {authError && (
                  <div className="flex items-center justify-center gap-2 text-[11px] font-bold tracking-widest text-red-400/90 uppercase animate-fade-in">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    {t.authFailed}
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-white/90 active:scale-95 transition-all shadow-xl shadow-white/5"
                >
                  {t.adminAuthSubmit}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 右键菜单 */}
      {contextMenu && (
        <div 
          className="fixed z-[200] w-48 glass-strong rounded-2xl p-1.5 shadow-2xl border border-white/10 animate-fade-in origin-top-left"
          style={{ 
            left: Math.min(contextMenu.x, window.innerWidth - 200), 
            top: Math.min(contextMenu.y, window.innerHeight - 120) 
          }}
          onClick={(e) => e.stopPropagation()}
        >
            <div className="px-3 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest border-b border-white/5 mb-1">
              {t.openMethod}
            </div>
            <button
              onClick={() => {
                window.open(contextMenu.bookmark.url, '_blank');
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <Icons.Globe className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold leading-none mb-1">{t.defaultUrl}</div>
                <div className="text-[10px] text-white/30 truncate w-24">{t.defaultUrlDesc}</div>
              </div>
            </button>
            
            <button
              onClick={() => {
                window.open(contextMenu.bookmark.lanUrl, '_blank');
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all group mt-1"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <Icons.Network className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold leading-none mb-1">{t.lanUrl}</div>
                <div className="text-[10px] text-white/30 truncate w-24">{t.lanUrlDesc}</div>
              </div>
            </button>
        </div>
      )}
    </div>
  );
}
