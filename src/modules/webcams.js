import { CONFIG } from '../core/config.js';
export function initWebcam() { const image=document.getElementById('webcam-image'); if(!image)return; image.addEventListener('error',()=>{ if(!image.src.startsWith(CONFIG.fallbackWebcam)) image.src=CONFIG.fallbackWebcam; }); }
