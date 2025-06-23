export function initRichText() {
  $(document).on('click', '.toolbar button', function (e) {
    e.preventDefault();
    const cmd = $(this).data('cmd');
    const editor = $(this)
      .closest('.comment-form, #post-creation-form')
      .find('.editor')[0];
    if (!editor) return;
    editor.focus();
    if (cmd === 'link') {
      let url = prompt('Enter URL');
      if (url) {
        url = url.trim();
        if (!/^https?:\/\//i.test(url)) {
          url = `https://${url}`;
        }
        applyFormat('link', editor, url);
      }
    } else {
      applyFormat(cmd, editor);
    }
  });
}

function applyFormat(cmd, editor, value) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return;

  let tag = null;
  if (cmd === 'bold') tag = 'strong';
  else if (cmd === 'italic') tag = 'em';
  else if (cmd === 'underline') tag = 'u';
  else if (cmd === 'link') tag = 'a';
  if (!tag) return;

  const wrapper = document.createElement(tag);
  if (cmd === 'link') {
    wrapper.setAttribute('href', value);
    wrapper.setAttribute('target', '_blank');
    wrapper.setAttribute('rel', 'noopener noreferrer');
  }

  if (range.collapsed) {
    range.insertNode(wrapper);
    const caretRange = document.createRange();
    caretRange.selectNodeContents(wrapper);
    caretRange.collapse(false);
    sel.removeAllRanges();
    sel.addRange(caretRange);
    return;
  }

  const contents = range.extractContents();
  wrapper.appendChild(contents);
  range.insertNode(wrapper);
  const caretRange = document.createRange();
  caretRange.selectNodeContents(wrapper);
  caretRange.collapse(false);
  sel.removeAllRanges();
  sel.addRange(caretRange);
}
