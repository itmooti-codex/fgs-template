import { disableBodyScroll, enableBodyScroll } from "../../utils/bodyScroll.js";

export function initPreviewHandlers() {
// File preview modal logic
const previewModal = document.getElementById('file-preview-modal');
const previewContainer = document.getElementById('preview-container');
const previewClose = document.getElementById('close-file-preview');
const previewDownload = document.getElementById('download-preview');

if (previewClose) {
  previewClose.addEventListener('click', () => {
    previewModal.classList.add('hidden');
    previewModal.classList.remove('show');
    previewContainer.innerHTML = '';
    enableBodyScroll();
  });
}

if (previewModal) {
  previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) {
      previewClose.click();
    }
  });
}

$(document).on(
  'click',
  '.file-preview img',
  function (e) {
    e.preventDefault();
    if (!previewModal) return;
    let src = this.src || $(this).attr('href');
    if (!src) return;
    let el;
    if (this.tagName.toLowerCase() === 'img') {
      el = document.createElement('img');
      el.src = src;
    } else if (this.tagName.toLowerCase() === 'video') {
      el = document.createElement('video');
      el.src = src;
      el.controls = true;
    } else if (this.tagName.toLowerCase() === 'audio') {
      el = document.createElement('audio');
      el.src = src;
      el.controls = true;
    } else {
      el = document.createElement('iframe');
      el.src = src;
      el.className = 'w-full h-full';
    }
    previewContainer.innerHTML = '';
    previewContainer.appendChild(el);
    if (previewDownload) {
      previewDownload.href = src;
      previewDownload.download = src.split('/').pop();
    }
    previewModal.classList.remove('hidden');
    previewModal.classList.add('show');
    disableBodyScroll();
  }
);
}
