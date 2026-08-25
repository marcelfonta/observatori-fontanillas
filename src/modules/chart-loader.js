const url = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js';
let loading;

export function loadChartJs() {
  if (window.Chart) return Promise.resolve(window.Chart);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => window.Chart ? resolve(window.Chart) : reject(new Error('Chart.js no s’ha carregat correctament.'));
    script.onerror = () => reject(new Error('No s’ha pogut carregar Chart.js.'));
    document.head.append(script);
  });
  return loading;
}
