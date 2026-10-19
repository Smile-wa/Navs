/**
 * 书签目录管理页面
 * NOTE: 恢复拖拽排序，去掉多余的复选框，表单双列布局
 */

import React, { useState, useMemo, useRef } from 'react';
import { useData, type Category, type Bookmark } from '../../context/DataContext.tsx';
import * as Icons from 'lucide-react';
import { 
  Plus, Edit2, Trash2, FolderOpen, Search, 
  Link as LinkIcon, GripVertical 
} from 'lucide-react';
import { Reorder, useDragControls } from 'motion/react';
import { TRANSLATIONS } from '../../i18n/translations.ts';
import ConfirmModal from '../../components/ConfirmModal.tsx';
import { getFaviconProxyUrl, normalizeIconUrl } from '../../lib/favicon.ts';

// ================= 拖拽组件：分类行 =================
function CategoryRowItem({
  category,
  onEdit,
  onAddBookmark,
  onDelete,
  onDragEnd,
}: {
  category: Category;
  onEdit: () => void;
  onAddBookmark: () => void;
  onDelete: () => void;
  onDragEnd: () => void;
}) {
  const dragControls = useDragControls();
  const timerRef = useRef<any>(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input')) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    startPosRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;

    timerRef.current = setTimeout(() => {
      isDraggingRef.current = true;
      dragControls.start(e);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(30);
      }
    }, 220);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!startPosRef.current || isDraggingRef.current) return;
    const dx = Math.abs(e.clientX - startPosRef.current.x);
    const dy = Math.abs(e.clientY - startPosRef.current.y);
    if (dx > 8 || dy > 8) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handlePointerUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  };

  return (
    <Reorder.Item
      value={category}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
      className="relative select-none group touch-pan-y bg-white border-b border-slate-100 last:border-b-0"
      transition={{ type: 'spring', damping: 30, stiffness: 400 }}
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* 拖拽手柄 */}
          <div
            className="p-1 -ml-2 text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing hover:bg-slate-200 rounded transition-colors"
            onPointerDown={(e) => {
              e.stopPropagation();
              isDraggingRef.current = true;
              dragControls.start(e);
            }}
          >
            <GripVertical className="w-5 h-5" />
          </div>
          
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">{category.title}</span>
              {category.isHidden && <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] rounded">仅登录可见</span>}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex gap-4">
              <span>{category.bookmarks.length} 个直属书签</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 text-slate-600">编辑</button>
          <button onClick={onAddBookmark} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 text-slate-600">加书签</button>
          <button onClick={onDelete} className="px-3 py-1.5 border border-red-200 text-red-600 bg-red-50 rounded-lg text-sm hover:bg-red-100">删除</button>
        </div>
      </div>
    </Reorder.Item>
  );
}

// ================= 拖拽组件：书签行 =================
function BookmarkRowItem({
  bookmark,
  onEdit,
  onDelete,
  onDragEnd,
}: {
  bookmark: Bookmark & { categoryName: string, categoryId: string };
  onEdit: () => void;
  onDelete: () => void;
  onDragEnd: () => void;
}) {
  const dragControls = useDragControls();
  const timerRef = useRef<any>(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input')) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    startPosRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;

    timerRef.current = setTimeout(() => {
      isDraggingRef.current = true;
      dragControls.start(e);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(30);
      }
    }, 220);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!startPosRef.current || isDraggingRef.current) return;
    const dx = Math.abs(e.clientX - startPosRef.current.x);
    const dy = Math.abs(e.clientY - startPosRef.current.y);
    if (dx > 8 || dy > 8) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handlePointerUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  };

  return (
    <Reorder.Item
      value={bookmark}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
      className="relative select-none group touch-pan-y bg-white border-b border-slate-100 last:border-b-0"
      transition={{ type: 'spring', damping: 30, stiffness: 400 }}
    >
      {/* 表头已去掉复选框，所以网格列宽改为 40px_2fr_3fr_1fr_1fr_120px */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="grid grid-cols-[40px_2fr_3fr_1fr_1fr_120px] gap-4 p-4 items-center hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center justify-center">
          {/* 拖拽手柄 */}
          <div
            className="p-1 text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing hover:bg-slate-200 rounded transition-colors"
            onPointerDown={(e) => {
              e.stopPropagation();
              isDraggingRef.current = true;
              dragControls.start(e);
            }}
          >
            <GripVertical className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden" style={{ backgroundColor: bookmark.iconBgColor }}>
            {bookmark.icon ? <img src={normalizeIconUrl(bookmark.icon)} alt="" className="w-5 h-5 object-contain" /> : <LinkIcon className="w-4 h-4 text-slate-400" />}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-800 truncate">{bookmark.title}</div>
            {bookmark.description && <div className="text-[11px] text-slate-400 truncate">{bookmark.description}</div>}
          </div>
        </div>
        <div className="text-sm text-blue-600 truncate hover:underline cursor-pointer">{bookmark.url}</div>
        <div className="text-sm text-slate-600 truncate">{bookmark.categoryName}</div>
        <div className="text-sm text-slate-600">新标签页</div>
        <div className="flex items-center justify-center gap-1">
          <button onClick={onEdit} className="px-2 py-1 border border-slate-200 rounded text-xs hover:bg-slate-50">编辑</button>
          <button onClick={onDelete} className="px-2 py-1 border border-red-200 text-red-600 bg-red-50 rounded text-xs hover:bg-red-100">删除</button>
        </div>
      </div>
    </Reorder.Item>
  );
}

// ================= 主页面 =================
export default function Bookmarks({ defaultView = 'categories' }: { defaultView?: 'categories' | 'bookmarks' }) {
  const { 
    state, 
    addCategory, updateCategory, deleteCategory, setCategoriesOrder,
    addBookmark, updateBookmark, deleteBookmark, moveBookmark
  } = useData();
  const t = TRANSLATIONS[state.settings.language || 'zh-CN'];

  const activeView = defaultView;
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- 模态框状态 ---
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingBookmark, setEditingBookmark] = useState<{ b: Bookmark; catId: string } | null>(null);
  
  // --- 表单状态 ---
  const [categoryForm, setCategoryForm] = useState({ title: '', icon: 'Folder', isHidden: false });
  const [bookmarkForm, setBookmarkForm] = useState<Partial<Bookmark> & { categoryId?: string }>({});
  
  // --- 确认弹窗 ---
  const [confirmModal, setConfirmModal] = useState<any>({ isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'danger' });

  // --- 数据计算 ---
  const filteredCategories = useMemo(() => 
    state.categories.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())), 
  [state.categories, searchQuery]);

  const allBookmarks = useMemo(() => {
    return state.categories.flatMap(c => 
      c.bookmarks.map(b => ({ ...b, categoryId: c.id, categoryName: c.title }))
    );
  }, [state.categories]);

  const filteredBookmarks = useMemo(() => 
    allBookmarks.filter(b => 
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      b.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
    ), 
  [allBookmarks, searchQuery]);

  // --- 拖拽排序处理 ---
  const handleCategoriesReorder = (newItems: Category[]) => {
    setCategoriesOrder(newItems);
  };

  const handleBookmarksReorder = (newItems: any[]) => {
    const newCategories = state.categories.map(cat => {
      const catBookmarks = newItems.filter(b => b.categoryId === cat.id).map(b => {
        const { categoryId, categoryName, ...bookmark } = b;
        return bookmark;
      });
      return { ...cat, bookmarks: catBookmarks };
    });
    setCategoriesOrder(newCategories);
  };

  const handleSaveCategory = () => {
    if (!categoryForm.title.trim()) return;
    if (editingCategory) updateCategory(editingCategory.id, categoryForm);
    else addCategory(categoryForm as any);
    setIsCategoryModalOpen(false);
  };

  const handleSaveBookmark = () => {
    if (!bookmarkForm.title?.trim() || !bookmarkForm.url?.trim()) return;
    
    const finalForm = { ...bookmarkForm };
    if (!finalForm.icon && finalForm.url) {
      finalForm.icon = getFaviconProxyUrl(finalForm.url);
    }

    const targetCatId = bookmarkForm.categoryId || state.categories[0]?.id;
    if (!targetCatId) return alert('请先创建一个分类');

    if (editingBookmark) {
      if (editingBookmark.catId !== targetCatId) {
        moveBookmark(editingBookmark.catId, targetCatId, editingBookmark.b.id);
      }
      updateBookmark(targetCatId, editingBookmark.b.id, finalForm);
    } else {
      addBookmark(targetCatId, finalForm as any);
    }
    setIsBookmarkModalOpen(false);
  };

  const openAddBookmark = (catId?: string) => {
    setEditingBookmark(null);
    setBookmarkForm({ categoryId: catId || state.categories[0]?.id });
    setIsBookmarkModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa]">
      {/* 顶部工具栏 */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-slate-800">
            {activeView === 'categories' ? '分类管理' : '书签列表'}
          </h1>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder={activeView === 'categories' ? "搜索分类..." : "搜索标题、链接或分类..."}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {activeView === 'categories' ? (
            <button onClick={() => { setEditingCategory(null); setCategoryForm({ title: '', icon: 'Folder', isHidden: false }); setIsCategoryModalOpen(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap">
              <Plus className="w-4 h-4" /> 新增分类
            </button>
          ) : (
            <button onClick={() => openAddBookmark()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap">
              <Plus className="w-4 h-4" /> 新增书签
            </button>
          )}
        </div>
      </div>

      {/* 列表内容区 */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm min-h-full flex flex-col max-w-[1400px] mx-auto">
          
          {activeView === 'categories' ? (
            // ================= 分类管理 (支持拖拽) =================
            <>
              <div className="flex items-center gap-3 p-4 border-b border-slate-100 text-slate-500 text-sm">
                <span className="font-medium">提示：按住左侧图标可拖拽排序</span>
              </div>
              <div className="flex-1">
                <Reorder.Group axis="y" values={state.categories} onReorder={handleCategoriesReorder}>
                  {filteredCategories.map(cat => (
                    <CategoryRowItem
                      key={cat.id}
                      category={cat}
                      onEdit={() => { setEditingCategory(cat); setCategoryForm({ title: cat.title, icon: cat.icon, isHidden: cat.isHidden || false }); setIsCategoryModalOpen(true); }}
                      onAddBookmark={() => openAddBookmark(cat.id)}
                      onDelete={() => setConfirmModal({ isOpen: true, title: '删除分类', message: `确定删除分类「${cat.title}」及其所有书签吗？`, onConfirm: () => deleteCategory(cat.id) })}
                      onDragEnd={() => {}}
                    />
                  ))}
                </Reorder.Group>
                {filteredCategories.length === 0 && <div className="p-10 text-center text-slate-400">暂无分类</div>}
              </div>
            </>
          ) : (
            // ================= 书签管理 (支持拖拽) =================
            <>
              <div className="grid grid-cols-[40px_2fr_3fr_1fr_1fr_120px] gap-4 p-4 border-b border-slate-100 text-sm font-semibold text-slate-500 bg-slate-50/50 items-center">
                <div className="text-center">排序</div>
                <div>标题 ↕</div>
                <div>链接 ↕</div>
                <div>分类 ↕</div>
                <div>打开方式 ↕</div>
                <div className="text-center">操作</div>
              </div>
              <div className="flex-1">
                <Reorder.Group axis="y" values={filteredBookmarks} onReorder={handleBookmarksReorder}>
                  {filteredBookmarks.map(bm => (
                    <BookmarkRowItem
                      key={`${bm.id}-${bm.categoryId}`}
                      bookmark={bm}
                      onEdit={() => { setEditingBookmark({ b: bm, catId: bm.categoryId }); setBookmarkForm({ ...bm }); setIsBookmarkModalOpen(true); }}
                      onDelete={() => setConfirmModal({ isOpen: true, title: '删除书签', message: '确定删除此站点吗？', onConfirm: () => deleteBookmark(bm.categoryId, bm.id) })}
                      onDragEnd={() => {}}
                    />
                  ))}
                </Reorder.Group>
                {filteredBookmarks.length === 0 && <div className="p-10 text-center text-slate-400">暂无书签</div>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ================= 编辑/新增书签模态框（双列布局） ================= */}
      {isBookmarkModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">{editingBookmark ? '编辑书签' : '新增书签'}</h2>
              <button onClick={() => setIsBookmarkModalOpen(false)} className="px-4 py-1.5 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">取消</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-semibold text-slate-700">所属分类</label>
                  <select 
                    className="w-full mt-1.5 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 outline-none border focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={bookmarkForm.categoryId || ''}
                    onChange={e => setBookmarkForm({...bookmarkForm, categoryId: e.target.value})}
                  >
                    {state.categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">书签标题</label>
                  <input 
                    type="text" 
                    className="w-full mt-1.5 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 outline-none border focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    value={bookmarkForm.title || ''} 
                    onChange={e => setBookmarkForm({...bookmarkForm, title: e.target.value})} 
                    placeholder="请输入站点名称"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-semibold text-slate-700">URL 地址</label>
                  <input 
                    type="text" 
                    className="w-full mt-1.5 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 outline-none border focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    value={bookmarkForm.url || ''} 
                    onChange={e => setBookmarkForm({...bookmarkForm, url: e.target.value})} 
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">内网地址 (可选)</label>
                  <input 
                    type="text" 
                    className="w-full mt-1.5 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 outline-none border focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    value={bookmarkForm.lanUrl || ''} 
                    onChange={e => setBookmarkForm({...bookmarkForm, lanUrl: e.target.value})} 
                    placeholder="http://192.168.1.10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-semibold text-slate-700">描述 (可选)</label>
                  <input 
                    type="text" 
                    className="w-full mt-1.5 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 outline-none border focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    value={bookmarkForm.description || ''} 
                    onChange={e => setBookmarkForm({...bookmarkForm, description: e.target.value})} 
                    placeholder="..."
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">图标 (可选)</label>
                  <input 
                    type="text" 
                    className="w-full mt-1.5 rounded-xl border-slate-200 bg-slate-50 px-4 py-3 outline-none border focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    value={bookmarkForm.icon || ''} 
                    onChange={e => setBookmarkForm({...bookmarkForm, icon: e.target.value})} 
                    placeholder="URL / Lucide"
                  />
                </div>
              </div>
              
              <div className="text-[11px] text-slate-400 -mt-2">
                {t.autoFaviconTip}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={bookmarkForm.isPrivate || false} 
                    onChange={e => setBookmarkForm({...bookmarkForm, isPrivate: e.target.checked})} 
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                  />
                  <span className="text-sm font-semibold text-slate-700">设为私密链接（仅登录可见）</span>
                </label>
                <p className="text-xs text-slate-400 mt-1">开启后，未登录访客不会看到这个书签。</p>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex items-center justify-between">
              {editingBookmark ? (
                <button onClick={() => setConfirmModal({ isOpen: true, title: '删除书签', message: '确定删除此站点吗？', onConfirm: () => { deleteBookmark(editingBookmark.catId, editingBookmark.b.id); setIsBookmarkModalOpen(false); } })} className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 rounded-lg text-sm hover:bg-red-100">
                  删除
                </button>
              ) : <div></div>}
              
              <div className="flex gap-3 ml-auto">
                <button onClick={() => setIsBookmarkModalOpen(false)} className="px-5 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">取消</button>
                <button onClick={handleSaveBookmark} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 分类编辑/新增模态框 */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-lg font-bold mb-4">{editingCategory ? '编辑分类' : '新增分类'}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">分类名称</label>
                <input type="text" className="w-full mt-1.5 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-500" value={categoryForm.title} onChange={e => setCategoryForm({...categoryForm, title: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">分类图标 (Lucide)</label>
                <input type="text" className="w-full mt-1.5 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-500" value={categoryForm.icon} onChange={e => setCategoryForm({...categoryForm, icon: e.target.value})} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={categoryForm.isHidden} onChange={e => setCategoryForm({...categoryForm, isHidden: e.target.checked})} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                <span className="text-sm text-slate-600">仅登录可见（私密）</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">取消</button>
              <button onClick={handleSaveCategory} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">保存</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="确定"
        cancelText="取消"
        type={confirmModal.type}
      />
    </div>
  );
}
