import { fetchGraphQL } from "../../api/fetch.js";
import {
  CREATE_REACTION_MUTATION,
  DELETE_REACTION_MUTATION,
  CREATE_BOOKMARK_MUTATION,
  DELETE_BOOKMARK_MUTATION,
} from "../../api/queries.js";
import { state, GLOBAL_AUTHOR_ID } from "../../config.js";
import { findNode } from "../../ui/render.js";
import { getModalTree } from "./postModal.js";
import { findRawById } from "../../utils/posts.js";
import { safeArray } from "../../utils/formatter.js";
import { showToast } from "../../ui/toast.js";

export function initReactionHandlers() {
  // LIKE / UNLIKE
  $(document).on("click", ".btn-like", async function () {
    // const uid = $(this).data("uid");
    const uid = $(this).attr("data-uid");
    const inModal = $(this).closest("#modalForumRoot").length > 0;
    const source = inModal ? getModalTree() : state.postsStore;
    const node = findNode(source, uid);
    if (!node) {
      console.error("Node not found for uid", uid);
      return;
    }
    $(this).addClass("state-disabled");
    let toastMsg = "";

    try {
      if (node.hasUpvoted) {
        if (node.voteRecordId) {
          await fetchGraphQL(DELETE_REACTION_MUTATION, { id: node.voteRecordId });
        }
        const rawItem = findRawById(state.rawItems, node.id);
        if (rawItem) {
          rawItem.Forum_Reactors_Data = safeArray(rawItem.Forum_Reactors_Data).filter((u) => u.id !== node.voteRecordId);
        }
        node.upvotes--;
        node.hasUpvoted = false;
        node.voteRecordId = null;
        toastMsg = "Vote removed";
      } else {
        const payload = {
          forum_reactor_id: GLOBAL_AUTHOR_ID,
          reacted_to_forum_id: node.id,
        };
        const res = await fetchGraphQL(CREATE_REACTION_MUTATION, { payload });
        const newId = res.data.createOForumReactorReactedtoForum?.id;
        const rawItem = findRawById(state.rawItems, node.id);
        if (rawItem) {
          rawItem.Forum_Reactors_Data = [
            ...safeArray(rawItem.Forum_Reactors_Data),
            {
              id: newId,
              reacted_to_forum_id: node.id,
              Forum_Reactor: { id: GLOBAL_AUTHOR_ID },
            },
          ];
        }
        node.upvotes++;
        node.hasUpvoted = true;
        node.voteRecordId = newId;
        toastMsg = "Voted";
      }
    } catch (err) {
      console.error("error is", err);
    } finally {
      $(this).removeClass("state-disabled");
    }
    const $item = $(`[data-uid="${uid}"]`);
    $item.find(".btn-like span").text(node.upvotes);
    $item.find(".btn-like").toggleClass("liked", node.hasUpvoted);
    if (toastMsg) showToast(toastMsg);
  });

  // BOOKMARK / UNBOOKMARK
  $(document).on("click", ".btn-bookmark", async function () {
    // const uid = $(this).data("uid");
    const uid = $(this).attr("data-uid");
    const inModal = $(this).closest("#modalForumRoot").length > 0;
    const source = inModal ? getModalTree() : state.postsStore;
    const node = findNode(source, uid);
    if (!node) {
      console.error("Node not found for uid", uid);
      return;
    }
    $(this).addClass("state-disabled");
    let toastMsg = "";

    try {
      if (node.hasBookmarked) {
        if (node.bookmarkRecordId) {
          await fetchGraphQL(DELETE_BOOKMARK_MUTATION, { id: node.bookmarkRecordId });
        }
        const rawItem = findRawById(state.rawItems, node.id);
        if (rawItem) {
          rawItem.Bookmarking_Contacts_Data = safeArray(rawItem.Bookmarking_Contacts_Data).filter((c) => c.id !== node.bookmarkRecordId);
        }
        node.hasBookmarked = false;
        node.bookmarkRecordId = null;
        toastMsg = "Bookmark removed";
      } else {
        const payload = {
          bookmarking_contact_id: GLOBAL_AUTHOR_ID,
          bookmarked_forum_id: node.id,
        };
        const res = await fetchGraphQL(CREATE_BOOKMARK_MUTATION, { payload });
        const rawItem = findRawById(state.rawItems, node.id);
        if (rawItem) {
          rawItem.Bookmarking_Contacts_Data = [
            ...safeArray(rawItem.Bookmarking_Contacts_Data),
            {
              id: res.data.createOBookmarkingContactBookmarkedForum.id,
              bookmarked_forum_id: node.id,
              Bookmarking_Contact: { id: GLOBAL_AUTHOR_ID },
            },
          ];
        }
        node.hasBookmarked = true;
        node.bookmarkRecordId = res.data.createOBookmarkingContactBookmarkedForum.id;
        toastMsg = "Bookmarked";
      }
    } catch (err) {
      console.error("error is", err);
    } finally {
      $(this).removeClass("state-disabled");
    }
    const $item = $(`[data-uid="${uid}"]`);
    $item.find(".btn-bookmark").toggleClass("bookmarked", node.hasBookmarked);
    if (toastMsg) showToast(toastMsg);
  });
}
