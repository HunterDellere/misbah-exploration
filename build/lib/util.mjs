export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
export function escapeAttr(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
export function slugify(s) {
  return String(s).toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}
export function fillTemplate(tpl, vars) {
  return tpl.replace(/\{\{\{(\w+)\}\}\}/g, (_, k) => vars[k] ?? '');
}
