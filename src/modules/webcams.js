export function initWebcam() {
  document.querySelectorAll('#webcam-image, #hero-webcam-image').forEach(image => {
    image.addEventListener('error', () => {
      image.removeAttribute('src');
      image.alt = 'La webcam no està disponible temporalment. Les dades de l’estació continuen actualitzant-se.';
      image.closest('a')?.classList.add('is-unavailable');
    });
    image.addEventListener('load', () => image.closest('a')?.classList.remove('is-unavailable'));
  });
}
