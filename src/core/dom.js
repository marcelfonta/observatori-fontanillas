import { getLocale, t, translateDocument } from './i18n.js';

export const isNumber = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
export const format = (value, digits = 0) => isNumber(value) ? Number(value).toLocaleString(getLocale(), { minimumFractionDigits: digits, maximumFractionDigits: digits }) : '—';
export function cardinal(degrees) {
  if (!isNumber(degrees)) return t('Direcció pendent');
  const labels=getLocale()==='en-GB'?['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']:['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO'];
  return labels[Math.round(Number(degrees) / 22.5) % 16];
}
export function setText(id, value) {
  const node = document.getElementById(id);
  if (!node) return;
  node.textContent = value;
  translateDocument(node);
  node.classList.remove('is-placeholder');
  node.removeAttribute('aria-busy');
}
export function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
