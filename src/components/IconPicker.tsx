/**
 * 图标选择器（后台分类 / 书签共用）
 * NOTE: 支持 emoji、Iconify 图标名（icon-sets.iconify.design 全量图标集）、
 *       图片地址和 Lucide 名称，并内置 Iconify 在线搜索，选中即回填。
 */

import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import * as Icons from 'lucide-react';
import { Search, Loader2, ExternalLink, FolderOpen, X } from 'lucide-react';
import { isEmojiIcon, isIconifyIcon, isImageIcon } from '../lib/icon.ts';

/** 常用 emoji 快捷选项 */
const EMOJIS = ['📁', '🎬', '🛠️', '☁️', '📚', '🎨', '🔍', '💡', '🌐', '🛒', '🎵', '📝', '🧰', '🎮'];

/** 常用图标集（对应 Iconify 的 prefix） */
const ICON_SETS = [
  { id: '', name: '全部图标集' },
  { id: 'mdi', name: 'Material Design' },
  { id: 'ph', name: 'Phosphor' },
  { id: 'tabler', name: 'Tabler' },
  { id: 'lucide', name: 'Lucide' },
  { id: 'simple-icons', name: '品牌 Logo' },
  { id: 'material-symbols', name: 'Material Symbols' },
  { id: 'carbon', name: 'Carbon' },
  { id: 'fluent-emoji-flat', name: 'Fluent Emoji' },
];

/** 统一图标预览：emoji / Iconify / 图片 / Lucide / 兜底 */
export function IconPreview({
  icon,
  size = 'w-5 h-5',
  colorClass = 'text-slate-600',
  emojiClass = 'text-xl',
}: {
  icon?: string;
  size?: string;
  colorClass?: string;
  emojiClass?: string;
}) {
  const value = (icon || '').trim();

  if (isEmojiIcon(value)) {
    return <span className={`${emojiClass} leading-none select-none`}>{value}</span>;
  }
  if (isIconifyIcon(value)) {
    return <Icon icon={value} className={`${size} ${colorClass}`} />;
  }
  if (isImageIcon(value)) {
    return <img src={value} alt="" className={`${size} object-contain`} />;
  }
  const Comp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[value];
  if (Comp) return <Comp className={`${size} ${colorClass}`} />;
  return <FolderOpen className={`${size} ${colorClass}`} />;
}

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  const [query, setQuery] = useState('');
  const [prefix, setPrefix] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Iconify 在线搜索（防抖 350ms）
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setError('');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ query: q, limit: '60' });
        if (prefix) params.set('prefix', prefix);
        const res = await fetch(`https://api.iconify.design/search?${params.toString()}`);
        if (!res.ok) throw new Error('request failed');
        const data = await res.json();
        if (cancelled) return;
        setResults(Array.isArray(data.icons) ? data.icons : []);
        setError('');
      } catch {
        if (cancelled) return;
        setResults([]);
        setError('图标搜索失败，请检查网络后重试');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, prefix]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">分类图标</label>
        <a
          href="https://icon-sets.iconify.design/"
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1"
        >
          在 Iconify 浏览图标
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* 当前图标预览 + 输入框 */}
      <div className="flex items-center gap-2">
        <div className="w-11 h-11 shrink-0 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600 overflow-hidden">
          <IconPreview icon={value} size="w-5 h-5" emojiClass="text-2xl" />
        </div>
        <div className="relative flex-1">
          <input
            type="text"
            className="w-full border border-slate-200 rounded-lg p-2.5 pr-9 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="🎬 / mdi:film / Folder / https://..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              title="清空"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* emoji 快捷选择 */}
      <div className="flex flex-wrap gap-1">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onChange(e)}
            className={`w-8 h-8 rounded-lg text-lg leading-none flex items-center justify-center transition-colors ${
              value === e ? 'bg-blue-100 ring-1 ring-blue-400' : 'hover:bg-slate-100'
            }`}
            title={`使用 ${e}`}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Iconify 搜索 */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-8 text-sm outline-none focus:border-blue-500"
              placeholder="搜索 Iconify 图标，例如 film、cloud、tool"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {loading && (
              <Loader2 className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
            )}
          </div>
          <select
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm text-slate-600 outline-none focus:border-blue-500 max-w-[150px]"
          >
            {ICON_SETS.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {error && <div className="text-[11px] text-red-500">{error}</div>}

        {!query.trim() ? (
          <div className="text-[11px] text-slate-400">
            搜索后点击图标即可使用，图标名形如 <code className="text-slate-500">mdi:film</code>
          </div>
        ) : results.length === 0 && !loading ? (
          <div className="text-[11px] text-slate-400 py-2">没有找到匹配的图标</div>
        ) : (
          <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 max-h-48 overflow-y-auto pr-1">
            {results.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => onChange(name)}
                title={name}
                className={`h-9 rounded-lg flex items-center justify-center transition-colors ${
                  value === name ? 'bg-blue-100 ring-1 ring-blue-400' : 'bg-white hover:bg-blue-50'
                }`}
              >
                <Icon icon={name} className="w-5 h-5 text-slate-600" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
