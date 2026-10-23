import { CONFIG } from '../core/config.js';

export function presentClimateCo2(payload, now = new Date()) {
  const co2 = payload?.co2;
  const date = typeof co2?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(co2.date) ? new Date(`${co2.date}T00:00:00Z`) : null;
  const age = date ? (now.getTime() - date.getTime()) / 86400000 : Infinity;
  if (!Number.isFinite(co2?.ppm) || co2.ppm < 250 || co2.ppm > 650 || !date || Number.isNaN(date.getTime()) || age < 0 || age > 3 || co2.fresh !== true) return null;
  const dated = new Intl.DateTimeFormat('ca-ES', { day:'numeric', month:'long', year:'numeric', timeZone:'UTC' }).format(date);
  const change = Number.isFinite(co2.yearChangePpm) ? ` · ${co2.yearChangePpm >= 0 ? '+' : ''}${co2.yearChangePpm.toLocaleString('ca-ES', {maximumFractionDigits:2})} ppm respecte de fa un any` : '';
  return { value:`${co2.ppm.toLocaleString('ca-ES', {minimumFractionDigits:2,maximumFractionDigits:2})} ppm`, detail:`Mauna Loa · ${dated}${change}. Mitjana diària provisional de NOAA; no és la mitjana global.` };
}

export async function initClimatePage() {
  const value = document.getElementById('climate-co2-value');
  const detail = document.getElementById('climate-co2-detail');
  if (!value || !detail) return;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${CONFIG.apiUrl}/climate/co2`, { signal:controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const presentation = presentClimateCo2(await response.json());
    if (!presentation) throw new Error('Dada absent o antiga');
    value.textContent = presentation.value;
    detail.textContent = presentation.detail;
  } catch {
    value.textContent = 'Dada no disponible';
    detail.textContent = 'NOAA no ha proporcionat cap lectura recent verificable. Consulta la sèrie original.';
  } finally { clearTimeout(timeout); }
}
