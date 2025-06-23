import { fetchGraphQL } from "../../api/fetch.js";
import {
  DELETE_FORUM_POST_MUTATION,
  UPDATE_FORUM_POST_MUTATION,
} from "../../api/queries.js";
import { state } from "../../config.js";
import { findNode } from "../../ui/render.js";
import { applyFilterAndRender } from "./filters.js";
import { getModalTree, rerenderModal } from "./postModal.js";
import { removeRawById, findRawById } from "../../utils/posts.js";
import { showToast } from "../../ui/toast.js";
import { disableBodyScroll, enableBodyScroll } from "../../utils/bodyScroll.js";

const deleteModal = document.getElementById("delete-modal");
const deleteModalTitle = document.getElementById("delete-modal-title");
let pendingDelete = null;

function removeNode(arr, uid) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].uid === uid) {
      arr.splice(i, 1);
      return true;
    }
    if (removeNode(arr[i].children, uid)) return true;
  }
  return false;
}

export function initModerationHandlers() {
  // DELETE
  $(document).on("click", ".btn-delete", function () {
    // const uid = $(this).data("uid");
    const uid = $(this).attr("data-uid");
    const inModal = $(this).closest("#modalForumRoot").length > 0;
    pendingDelete = { uid, inModal };
    const source = inModal ? getModalTree() : state.postsStore;
    const node = findNode(source, uid) || findNode(state.postsStore, uid);
    if (!node) {
      console.error("Node not found for uid", uid);
      return;
    }
    const label = node.depth === 0 ? "post" : node.depth === 1 ? "comment" : "reply";
    deleteModalTitle.textContent = `Do you want to delete this ${label}?`;
    deleteModal.classList.remove("hidden");
    disableBodyScroll();
  });

  $(document).on("click", "#delete-cancel", function () {
    deleteModal.classList.add("hidden");
    enableBodyScroll();
    pendingDelete = null;
  });

  $(document).on("click", "#delete-confirm", function () {
    if (!pendingDelete) return;
    const { uid, inModal } = pendingDelete;
    deleteModal.classList.add("hidden");
    enableBodyScroll();
    const $item = $(`[data-uid="${uid}"]`).closest(".item");
    $item.addClass("state-disabled");

    let node =
      findNode(state.postsStore, uid) || findNode(getModalTree(), uid);
    if (!node) {
      console.error("Node not found for uid", uid);
      $item.removeClass("state-disabled");
      pendingDelete = null;
      return;
    }

    fetchGraphQL(DELETE_FORUM_POST_MUTATION, { id: node.id })
      .then(() => {
        removeNode(state.postsStore, uid);
        removeNode(getModalTree(), uid);
        removeRawById(state.rawItems, node.id);
        $(`[data-uid="${uid}"]`).closest(".item").remove();
        showToast("Deleted");
        state.ignoreNextSocketUpdate = true;
        if (inModal) {
          rerenderModal();
        }
      })
      .catch((err) => {
        console.error("Delete failed", err);
        $item.removeClass("state-disabled");
        showToast("Delete failed");
      })
      .finally(() => {
        pendingDelete = null;
      });
  });

  // FEATURE
  $(document).on("click", ".btn-feature", async function () {
    const uid = $(this).attr("data-uid");
    const inModal = $(this).closest("#modalForumRoot").length > 0;
    const nodeMain = findNode(state.postsStore, uid);
    const nodeModal = findNode(getModalTree(), uid);
    const node = nodeMain || nodeModal;
    if (!node) return;
    $(this).addClass("state-disabled");
    try {
      await fetchGraphQL(UPDATE_FORUM_POST_MUTATION, {
        id: node.id,
        payload: { featured_forum: true },
      });
      if (nodeMain) nodeMain.isFeatured = true;
      if (nodeModal && nodeModal !== nodeMain) nodeModal.isFeatured = true;
      const rawItem = findRawById(state.rawItems, node.id);
      if (rawItem) rawItem.featured_forum = true;
      applyFilterAndRender();
      if (inModal) rerenderModal();
      showToast("Marked as featured");
    } catch (err) {
      console.error("Failed to mark featured", err);
    } finally {
      $(this).removeClass("state-disabled");
    }
  });

  // UNFEATURE
  $(document).on("click", ".btn-unfeature", async function () {
    const uid = $(this).attr("data-uid");
    const inModal = $(this).closest("#modalForumRoot").length > 0;
    const nodeMain = findNode(state.postsStore, uid);
    const nodeModal = findNode(getModalTree(), uid);
    const node = nodeMain || nodeModal;
    if (!node) return;
    $(this).addClass("state-disabled");
    try {
      await fetchGraphQL(UPDATE_FORUM_POST_MUTATION, {
        id: node.id,
        payload: { featured_forum: false },
      });
      if (nodeMain) nodeMain.isFeatured = false;
      if (nodeModal && nodeModal !== nodeMain) nodeModal.isFeatured = false;
      const rawItem = findRawById(state.rawItems, node.id);
      if (rawItem) rawItem.featured_forum = false;
      applyFilterAndRender();
      if (inModal) rerenderModal();
      showToast("Removed featured mark");
    } catch (err) {
      console.error("Failed to unmark featured", err);
    } finally {
      $(this).removeClass("state-disabled");
    }
  });

  // DISABLE COMMENTS
  $(document).on("click", ".btn-disable-comments", async function () {
    const uid = $(this).attr("data-uid");
    const inModal = $(this).closest("#modalForumRoot").length > 0;
    const nodeMain = findNode(state.postsStore, uid);
    const nodeModal = findNode(getModalTree(), uid);
    const node = nodeMain || nodeModal;
    if (!node) return;
    $(this).addClass("state-disabled");
    const updateTree = (n, val) => {
      n.commentsDisabled = val;
      if (Array.isArray(n.children)) {
        n.children.forEach((c) => updateTree(c, val));
      }
    };
    try {
      await fetchGraphQL(UPDATE_FORUM_POST_MUTATION, {
        id: node.id,
        payload: { disable_new_comments: true },
      });
      const rawItem = findRawById(state.rawItems, node.id);
      if (rawItem) rawItem.disable_new_comments = true;
      if (nodeMain) updateTree(nodeMain, true);
      if (nodeModal && nodeModal !== nodeMain) updateTree(nodeModal, true);
      applyFilterAndRender();
      if (inModal) rerenderModal();
      showToast("Comments disabled");
    } catch (err) {
      console.error("Failed to disable comments", err);
    } finally {
      $(this).removeClass("state-disabled");
    }
  });

  // ENABLE COMMENTS
  $(document).on("click", ".btn-enable-comments", async function () {
    const uid = $(this).attr("data-uid");
    const inModal = $(this).closest("#modalForumRoot").length > 0;
    const nodeMain = findNode(state.postsStore, uid);
    const nodeModal = findNode(getModalTree(), uid);
    const node = nodeMain || nodeModal;
    if (!node) return;
    $(this).addClass("state-disabled");
    const updateTree = (n, val) => {
      n.commentsDisabled = val;
      if (Array.isArray(n.children)) {
        n.children.forEach((c) => updateTree(c, val));
      }
    };
    try {
      await fetchGraphQL(UPDATE_FORUM_POST_MUTATION, {
        id: node.id,
        payload: { disable_new_comments: false },
      });
      const rawItem = findRawById(state.rawItems, node.id);
      if (rawItem) rawItem.disable_new_comments = false;
      if (nodeMain) updateTree(nodeMain, false);
      if (nodeModal && nodeModal !== nodeMain) updateTree(nodeModal, false);
      applyFilterAndRender();
      if (inModal) rerenderModal();
      showToast("Comments enabled");
    } catch (err) {
      console.error("Failed to enable comments", err);
    } finally {
      $(this).removeClass("state-disabled");
    }
  });
}
