"use strict";

const SHARE_TITLE_FALLBACK = "Observatori Meteorològic Fontanillas";
const SHARE_TEXT = "Consulta les dades meteorològiques en temps real de l'Observatori Fontanillas (Sant Celoni, Montseny):";

function currentShareUrl() {
  return window.location.href.split("#")[0];
}

function currentShareTitle() {
  return document.title || SHARE_TITLE_FALLBACK;
}

function openExternal(url) {
  const popup = window.open(url, "_blank");
  if (popup) popup.opener = null;
  else window.location.href = url;
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export function initShare() {
  const modal = document.getElementById("shareModal");
  const shareBtn = document.getElementById("share-btn");
  const closeBtn = document.getElementById("share-close");

  if (!modal || !shareBtn) return false;
  if (shareBtn.dataset.shareReady === "1") return true;
  shareBtn.dataset.shareReady = "1";

  function openShare(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
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
    shareBtn.focus?.({ preventScroll: true });
  }

  async function copyLink() {
    const url = currentShareUrl();
    try {
      await copyText(url);
      alert("Enllaç copiat!");
    } catch (_) {
      alert("No s'ha pogut copiar automàticament. Enllaç: " + url);
    }
    closeShare();
  }

  async function shareToSocialApp(appName, webUrl) {
    const url = currentShareUrl();
    const title = currentShareTitle();

    if (navigator.share) {
      try {
        await navigator.share({ title, text: SHARE_TEXT, url });
        closeShare();
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }

    try { await copyText(url); } catch (_) {}
    alert(`Enllaç copiat. Obre ${appName} i enganxa'l on el vulguis compartir.`);
    openExternal(webUrl);
    closeShare();
  }

  async function nativeShare() {
    const url = currentShareUrl();
    const title = currentShareTitle();
    if (navigator.share) {
      try {
        await navigator.share({ title, text: SHARE_TEXT, url });
        closeShare();
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
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
      const url = currentShareUrl();
      const title = currentShareTitle();
      switch (button.dataset.share) {
        case "copy":
          await copyLink();
          break;
        case "whatsapp":
          openExternal(`https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT} ${url}`)}`);
          closeShare();
          break;
        case "x":
          openExternal(`https://x.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(url)}`);
          closeShare();
          break;
        case "facebook":
          openExternal(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
          closeShare();
          break;
        case "email":
          window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${SHARE_TEXT} ${url}`)}`;
          closeShare();
          break;
        case "instagram":
          await shareToSocialApp("Instagram", "https://www.instagram.com/");
          break;
        case "tiktok":
          await shareToSocialApp("TikTok", "https://www.tiktok.com/");
          break;
        case "native":
          await nativeShare();
          break;
      }
    });
  });

  window.openShare = openShare;
  window.closeShare = closeShare;
  return true;
}
