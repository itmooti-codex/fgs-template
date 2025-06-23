let openModals = 0;

export function disableBodyScroll() {
  openModals++;
  if (openModals === 1) {
    document.body.classList.add('overflow-hidden');
  }
}

export function enableBodyScroll() {
  if (openModals > 0) {
    openModals--;
  }
  if (openModals === 0) {
    document.body.classList.remove('overflow-hidden');
  }
}
