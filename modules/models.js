import { setText } from '../js/utils.js';

const layerNames = {
  'rain-3h':'precipitació cada 3 hores',
  'temperature-2m':'temperatura a 2 metres',
  'wind-10m':'vent a 10 metres',
  'clouds-total':'nuvolositat total',
  pressure:'pressió atmosfèrica'
};

let model = 'gfs';
let layer = 'rain-3h';

function updateViewer() {
  const frame=document.getElementById('model-viewer-frame');
  if(frame)frame.src=`https://embed.ventusky.com/?p=41.69;2.49;6&l=${layer}&m=${model}`;
  setText('model-viewer-caption',`${model.toUpperCase()} · ${layerNames[layer]}`);
}

export function initModelViewer() {
  const frame=document.getElementById('model-viewer-frame');
  if(frame&&!frame.getAttribute('src')&&frame.dataset.src)frame.src=frame.dataset.src;
  document.querySelectorAll('[data-viewer-model]').forEach(button=>button.addEventListener('click',()=>{
    model=button.dataset.viewerModel;
    document.querySelectorAll('[data-viewer-model]').forEach(item=>item.classList.toggle('is-active',item===button));
    updateViewer();
  }));
  document.querySelectorAll('[data-viewer-layer]').forEach(button=>button.addEventListener('click',()=>{
    layer=button.dataset.viewerLayer;
    document.querySelectorAll('[data-viewer-layer]').forEach(item=>item.classList.toggle('is-active',item===button));
    updateViewer();
  }));
}
