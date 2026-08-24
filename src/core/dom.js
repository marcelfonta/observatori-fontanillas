export const isNumber = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
export const format = (value, digits = 0) => isNumber(value) ? Number(value).toLocaleString('ca-ES', { minimumFractionDigits: digits, maximumFractionDigits: digits }) : '—';
export function cardinal(degrees) { if (!isNumber(degrees)) return 'Direcció pendent'; return ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO'][Math.round(Number(degrees) / 22.5) % 16]; }
export function setText(id, value) {
  const node = document.getElementById(id);
  if (!node) return;
  node.textContent = value;
  node.classList.remove('is-placeholder');
  node.removeAttribute('aria-busy');
}
export function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
