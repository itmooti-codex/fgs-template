let savedRange = null;

export function saveSelection() {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    savedRange = sel.getRangeAt(0).cloneRange();
  }
}

export function restoreSelection(el) {
  if (!savedRange) return;
  const sel = window.getSelection();
  if (el.contains(savedRange.startContainer)) {
    sel.removeAllRanges();
    sel.addRange(savedRange);
  }
}

export function moveCursorToEnd(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  el.focus();
  savedRange = range.cloneRange();
}
