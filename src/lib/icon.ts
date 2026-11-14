/**
 * 图标类型判断工具
 * NOTE: 图标字段支持四种形式：
 *       1. emoji          例如 🎬
 *       2. Iconify 图标名  例如 mdi:film / simple-icons:youtube
 *       3. 图片地址        http(s):// 、/ 开头或 data:
 *       4. Lucide 名称     例如 Folder
 */

/** 是否为 emoji 字符（含组合 emoji、变体选择符、旗帜） */
export function isEmojiIcon(value?: string | null): boolean {
  const s = (value || '').trim();
  if (!s || s.length > 8) return false;
  // 纯字母数字等可见 ASCII 视为普通名字，排除掉
  if (/^[a-zA-Z0-9\-_/.:?=&]+$/.test(s)) return false;
  return /(?:\p{Extended_Pictographic}|\p{Regional_Indicator})/u.test(s);
}

/** 是否为 Iconify 图标名，形如 mdi:film、ph:film-slate、simple-icons:youtube */
export function isIconifyIcon(value?: string | null): boolean {
  const s = (value || '').trim();
  if (!s) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*:[a-z0-9]+(?:[-_][a-z0-9]+)*$/i.test(s);
}

/** 是否为图片地址 */
export function isImageIcon(value?: string | null): boolean {
  const s = (value || '').trim();
  return (
    s.startsWith('http://') ||
    s.startsWith('https://') ||
    s.startsWith('/') ||
    s.startsWith('data:')
  );
}
