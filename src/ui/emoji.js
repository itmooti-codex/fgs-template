export const emojiPickerHtml = `
  <div class="emoji-wrapper relative">
    <button type="button" class="emoji-toggle">😊</button>
    <div class="emoji-picker hidden absolute bg-white border rounded shadow-md p-1 mt-1 z-10">
      <span class="cursor-pointer px-1">😀</span>
      <span class="cursor-pointer px-1">😂</span>
      <span class="cursor-pointer px-1">😍</span>
      <span class="cursor-pointer px-1">😎</span>
      <span class="cursor-pointer px-1">🤔</span>
      <span class="cursor-pointer px-1">😢</span>
      <span class="cursor-pointer px-1">👍</span>
      <span class="cursor-pointer px-1">🎉</span>
      <span class="cursor-pointer px-1">🚀</span>
      <span class="cursor-pointer px-1">🥳</span>
    </div>
  </div>
`;

import { saveSelection, restoreSelection } from '../utils/caret.js';

export function initEmojiHandlers() {
  $(document).on('keyup mouseup input', '.editor', function () {
    saveSelection();
  });
  $(document).on('click', '.emoji-toggle', function (e) {
    e.stopPropagation();
    const picker = $(this).siblings('.emoji-picker');
    $('.emoji-picker').not(picker).addClass('hidden');
    picker.toggleClass('hidden');
  });

  $(document).on('click', function (e) {
    if (!$(e.target).closest('.emoji-picker, .emoji-toggle').length) {
      $('.emoji-picker').addClass('hidden');
    }
  });

  $(document).on('click', '.emoji-picker span', function () {
    const emoji = $(this).text();
    const container = $(this).closest('.comment-form, .post-form');
    const editor = container.find('.editor')[0];
    if (editor) insertEmoji(editor, emoji);
  });
}

function insertEmoji(editor, emoji) {
  editor.focus();
  restoreSelection(editor);
  document.execCommand('insertText', false, emoji);
  saveSelection();
}
