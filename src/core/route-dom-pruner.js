(() => {
  const activePage = document.documentElement.dataset.portalPage || 'inici';
  const routeBlocks = Array.from(document.querySelectorAll('main [data-portal-page]'));
  let removedBlocks = 0;
  let removedElements = 0;

  routeBlocks.forEach(block => {
    if (!block.isConnected) return;

    const pages = String(block.dataset.portalPage || '').split(/\s+/).filter(Boolean);
    if (pages.includes(activePage)) return;

    removedBlocks += 1;
    removedElements += block.querySelectorAll('*').length + 1;
    block.remove();
  });

  document.documentElement.dataset.portalPruned = 'true';
  globalThis.__PORTAL_DOM_METRICS__ = Object.freeze({
    activePage,
    removedBlocks,
    removedElements,
    retainedElements: document.querySelectorAll('main *').length
  });
})();
