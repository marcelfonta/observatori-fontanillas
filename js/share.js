(() => {
  "use strict";
  const SHARE_URL = "https://meteo.fontanillas.cat/";
  const SHARE_TITLE = "Observatori Meteorològic Fontanillas";
  const SHARE_TEXT = "Consulta les dades meteorològiques en temps real de l'Observatori Fontanillas (Sant Celoni, Montseny):";
  const $ = (selector) => document.querySelector(selector);

  function initShare() {
    const modal = $("#shareModal");
    const shareBtn = $("#share-btn");
    const closeBtn = $("#share-close");
    if (!shareBtn || !modal) return;

    function openShare(event) {
      if (event) event.preventDefault();
      modal.hidden = false;
      modal.style.display = "flex";
      document.body.style.overflow = "hidden";
      const firstButton = modal.querySelector("[data-share]");
      if (firstButton) requestAnimationFrame(() => firstButton.focus());
    }

    function closeShare() {
      modal.style.display = "none";
      modal.hidden = true;
      document.body.style.overflow = "";
      if (shareBtn) shareBtn.focus({ preventScroll: true });
    }

    async function copyLink() {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(SHARE_URL);
        } else {
          throw new Error("Clipboard API no disponible");
        }
      } catch (_) {
        const textarea = document.createElement("textarea");
        textarea.value = SHARE_URL;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      alert("Enllaç copiat!");
      closeShare();
    }

    function openExternal(url) {
      const popup = window.open(url, "_blank");
      if (popup) popup.opener = null;
      else window.location.href = url;
    }

    async function nativeShare() {
      if (navigator.share) {
        try {
          await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url: SHARE_URL });
          closeShare();
          return;
        } catch (error) {
          if (error && error.name === "AbortError") return;
        }
      }
      await copyLink();
    }

    shareBtn.addEventListener("click", openShare);
    closeBtn?.addEventListener("click", closeShare);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeShare();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) closeShare();
    });

    modal.querySelectorAll("[data-share]").forEach((button) => {
      button.addEventListener("click", async () => {
        const type = button.dataset.share;
        switch (type) {
          case "copy":
            await copyLink();
            break;
          case "whatsapp":
            openExternal(`https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT} ${SHARE_URL}`)}`);
            closeShare();
            break;
          case "x":
            openExternal(`https://x.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SHARE_URL)}`);
            closeShare();
            break;
          case "facebook":
            openExternal(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}`);
            closeShare();
            break;
          case "email":
            window.location.href = `mailto:?subject=${encodeURIComponent(SHARE_TITLE)}&body=${encodeURIComponent(`${SHARE_TEXT} ${SHARE_URL}`)}`;
            closeShare();
            break;
          case "native":
            await nativeShare();
            break;
        }
      });
    });

    window.openShare = openShare;
    window.closeShare = closeShare;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initShare, { once: true });
  else initShare();
})();
