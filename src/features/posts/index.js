import { initCommentHandlers } from './comments.js';
import { initReactionHandlers } from './reactions.js';
import { initModerationHandlers } from './moderation.js';
import { initFilterHandlers, applyFilterAndRender } from './filters.js';
import { initPreviewHandlers } from './preview.js';
import { initPostModalHandlers } from './postModal.js';

export function initPosts() {
  initCommentHandlers();
  initReactionHandlers();
  initModerationHandlers();
  initFilterHandlers();
  initPreviewHandlers();
  initPostModalHandlers();
}

export { applyFilterAndRender };
