import { initPostHandlers } from './actions.js';
import { initFilterHandlers, applyFilterAndRender } from './filters.js';
import { initPreviewHandlers } from './preview.js';

export function initPosts() {
  initPostHandlers();
  initFilterHandlers();
  initPreviewHandlers();
}

export { applyFilterAndRender };
