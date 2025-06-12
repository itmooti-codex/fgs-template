import { fetchGraphQL } from "../../api/fetch.js";
import {
  CREATE_FORUM_POST_MUTATION,
  DELETE_FORUM_POST_MUTATION,
  CREATE_REACTION_MUTATION,
  DELETE_REACTION_MUTATION,
  CREATE_BOOKMARK_MUTATION,
  DELETE_BOOKMARK_MUTATION,
  FETCH_CONTACTS_QUERY,
  UPDATE_FORUM_POST_MUTATION,
  CREATE_NOTIFICATION
} from "../../api/queries.js";
import {
  state,
  GLOBAL_PAGE_TAG,
  GLOBAL_AUTHOR_ID,
  GLOBAL_AUTHOR_DISPLAY_NAME,
  DEFAULT_AVATAR,
} from "../../config.js";
import { findNode, tmpl, buildTree, mapItem } from "../../ui/render.js";
import {
  pendingFile,
  fileTypeCheck,
  setPendingFile,
  setFileTypeCheck,
} from "../uploads/handlers.js";
import { emojiPickerHtml } from "../../ui/emoji.js";
import { moveCursorToEnd } from "../../utils/caret.js";
import { tribute } from "../../utils/tribute.js";
import { initFilePond } from "../../utils/filePond.js";
import { processFileFields } from "../../utils/handleFile.js";
import { applyFilterAndRender } from "./filters.js";
import { showToast } from "../../ui/toast.js";
import { removeRawById, findRawById } from "../../utils/posts.js";
import { safeArray } from "../../utils/formatter.js";
import { setupPlyr } from "../../utils/plyr.js";
import { updateCurrentUserUI } from "../../ui/user.js";
const deleteModal = document.getElementById("delete-modal");
const deleteModalTitle = document.getElementById("delete-modal-title");
let pendingDelete = null;

async function ensureCurrentUser() {
  if (state.currentUser) {
    updateCurrentUserUI(state);
    return;
  }
  try {
    const res = await fetchGraphQL(FETCH_CONTACTS_QUERY);
    const contacts = res?.data?.calcContacts || [];
    const current = contacts.find((c) => c.Contact_ID === GLOBAL_AUTHOR_ID);
    if (current) {
      state.currentUser = {
        display_name: current.Display_Name || "Anonymous",
        profile_image: current.Profile_Image || DEFAULT_AVATAR,
      };
      updateCurrentUserUI(state);
    }
  } catch (err) {
    console.error("Failed to fetch current user", err);
  }
}
function processContent(rawHtml) {
  const isOnlyUrl = rawHtml.trim().match(/^(https?:\/\/[^\s]+)$/);
  const link = isOnlyUrl ? rawHtml.trim() : null;

  const yt =
    link &&
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/.exec(link);
  const vi = link && /vimeo\.com\/(\d+)/.exec(link);
  const loom = link && /loom\.com\/share\/([a-zA-Z0-9]+)/.exec(link);

  if (yt) {
    return `
    <a class="block mb-2" href="https://www.youtube.com/watch?v=${yt[1]}" target="_blank" style="color: blue; text-decoration: underline;">https://www.youtube.com/watch?v=${yt[1]}</a>
    <iframe class="!w-full" width="560" height="315" src="https://www.youtube.com/embed/${yt[1]}" frameborder="0" allow="autoplay; encrypted-media"></iframe>`;
  } else if (vi) {
    return `
    <a class="block mb-2" href="https://player.vimeo.com/video/${vi[1]}" target="_blank" style="color: blue; text-decoration: underline;">https://player.vimeo.com/video/${vi[1]}</a>
    <iframe class="!w-full" width="560" height="315" src="https://player.vimeo.com/video/${vi[1]}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture"></iframe>`;
  } else if (loom) {
    return `
    <a class="block mb-2" href="https://www.loom.com/share/${loom[1]}" target="_blank" style="color: blue; text-decoration: underline;">https://www.loom.com/share/${loom[1]}</a>
    <iframe class="!w-full" width="560" height="315" src="https://www.loom.com/embed/${loom[1]}" frameborder="0" allowfullscreen></iframe>`;
  } else if (link) {
    return `<a class="block mb-2" href="${link}" target="_blank" style="color: blue; text-decoration: underline;">${link}</a>`;
  }

  const container = document.createElement("div");
  container.innerHTML = rawHtml;

  container.querySelectorAll("a").forEach((a) => {
    const href = a.href;

    const ytMatch =
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/.exec(href);
    const viMatch = /vimeo\.com\/(\d+)/.exec(href);
    const loomMatch = /loom\.com\/share\/([a-zA-Z0-9]+)/.exec(href);

    let iframeHTML = null;

    if (ytMatch) {
      iframeHTML = `
      <a class="block mb-2" href="https://www.youtube.com/watch?v=${ytMatch[1]}" target="_blank" style="color: blue; text-decoration: underline;">https://www.youtube.com/watch?v=${ytMatch[1]}</a>
      <iframe class="!w-full" width="300" height="315" src="https://www.youtube.com/embed/${ytMatch[1]}" frameborder="0" allow="autoplay; encrypted-media"></iframe>`;
    } else if (viMatch) {
      iframeHTML = `
      <a class="block mb-2" href="https://player.vimeo.com/video/${viMatch[1]}" target="_blank" style="color: blue; text-decoration: underline;">https://player.vimeo.com/video/${viMatch[1]}</a>
      <iframe class="!w-full" width="300" height="315" src="https://player.vimeo.com/video/${viMatch[1]}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture"></iframe>`;
    } else if (loomMatch) {
      iframeHTML = `
      <a class="block mb-2" href="https://www.loom.com/share/${loomMatch[1]}" target="_blank" style="color: blue; text-decoration: underline;">https://www.loom.com/share/${loomMatch[1]}</a>
      <iframe class="!w-full" width="300" height="315" src="https://www.loom.com/embed/${loomMatch[1]}" frameborder="0" allowfullscreen></iframe>`;
    }

    if (iframeHTML) {
      a.classList.add("video-link");
      a.setAttribute("target", "_blank");

      const tooltipWrapper = document.createElement("span");
      tooltipWrapper.classList.add("video-tooltip-wrapper");

      const tooltip = document.createElement("span");
      tooltip.classList.add("video-tooltip");
      tooltip.innerHTML = iframeHTML;

      a.parentNode.insertBefore(tooltipWrapper, a);
      tooltipWrapper.appendChild(a);
      tooltipWrapper.appendChild(tooltip);
    } else {
      a.setAttribute("target", "_blank");
      a.style.color = "blue";
      a.style.textDecoration = "underline";
    }
  });

  return container.innerHTML;
}

export function initPostHandlers() {
  $(document).on("click", ".btn-comment", function (e) {
    e.stopPropagation();
    const uid = $(this).data("uid");
    const container = $(this).closest(".item");
    const existing = container.find(".comment-form");

    if (existing.length) {
      existing.remove();
      return;
    }

    $(".comment-form").remove();
    const node = findNode(state.postsStore, uid);
    const mentionHtml = `<span contenteditable="false" class="mention" data-mention-id="${node.authorId}">@${node.authorName}</span>&nbsp;`;

    const nextDepth = Math.min((node.depth || 0) + 1, 2);
    const nextType = nextDepth === 1 ? "Comment" : "Reply";

    const $form = $(`
    <div class="comment-form my-2">
      <div class="toolbar mb-2">
        <button data-cmd="bold"><b>B</b></button>
        <button data-cmd="italic"><i>I</i></button>
        <button data-cmd="underline"><u>U</u></button>
        <button data-cmd="link"><i class="fa-solid fa-link"></i></button>
      </div>
      <div class="editor min-h-[80px] resize-y p-2 rounded" contenteditable="true" data-placeholder="Write a reply...">${mentionHtml}</div>
      <div class="upload-section w-full mt-2 flex flex-col gap-2">
        <div class="flex items-center gap-2">
        ${emojiPickerHtml}
        <button id="recordBtn" class="recordBtn"><i class="fa-solid fa-microphone"></i> Start Recording</button>

        <button onclick="createForumToSubmit('${nextDepth}','${nextType}','comment-form','${uid}');">Post</button>
        </div>
        <input type="file" id="file-input" class="file-input" style="display: none;"
          accept="image/*,audio/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
        <canvas class="canvasWaveform waveform w-full mt-2" id="waveform" width="450" height="100"></canvas>
      </div>
    </div>
  `);
    // <button class="btn-submit-comment" data-uid="${uid}">Post</button>
    container.append($form);
    const inserted = container.find(".comment-form");
    if (inserted.length) {
      const editorEl = inserted.find(".editor")[0];
      if (editorEl) {
        tribute.attach(editorEl);
      }
      container.find(".children").addClass("visible");
      initFilePond();
      // scroll to the newly inserted textarea so it's in view
      requestAnimationFrame(() => {
        inserted[0].scrollIntoView({ behavior: "smooth", block: "center" });
        if (editorEl) {
          moveCursorToEnd(editorEl);
        }
      });
    }
  });

  $(document).on("click", function (e) {
    if (!$(e.target).closest(".comment-form, #post-creation-form").length) {
      $("#upload-menu").hide();
    }
  });

  $(document).on("click", ".ribbon", function () {
    const uid = $(this).data("uid");
    let node = findNode(state.postsStore, uid);
    if (node) {
      node.isCollapsed = !node.isCollapsed;
      state.collapsedState[node.uid] = node.isCollapsed;
      applyFilterAndRender();
    }
  });

  $(document).on("click", ".btn-delete", function () {
    const uid = $(this).data("uid");
    pendingDelete = { uid };
    const node = findNode(state.postsStore, uid);
    const label =
      node.depth === 0 ? "post" : node.depth === 1 ? "comment" : "reply";
    deleteModalTitle.textContent = `Do you want to delete this ${label}?`;
    deleteModal.classList.remove("hidden");
  });

  $(document).on("click", "#delete-cancel", function () {
    deleteModal.classList.add("hidden");
    pendingDelete = null;
  });

  $(document).on("click", "#delete-confirm", function () {
    if (!pendingDelete) return;
    const uid = pendingDelete.uid;
    deleteModal.classList.add("hidden");
    const $item = $(`[data-uid="${uid}"]`).closest(".item");
    $item.addClass("state-disabled");

    let node;
    (function find(arr) {
      for (const x of arr) {
        if (x.uid === uid) {
          node = x;
          return;
        }
        find(x.children);
        if (node) return;
      }
    })(state.postsStore);

    const mutation = DELETE_FORUM_POST_MUTATION;
    const variables = { id: node.id };

    fetchGraphQL(mutation, variables)
      .then(() => {
        removeNode(state.postsStore, uid);
        removeRawById(state.rawItems, node.id);
        $(`[data-uid="${uid}"]`).closest(".item").remove();
        showToast("Deleted");
        state.ignoreNextSocketUpdate = true;
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

  // Create notification
    async function sendNotificationsAfterPost(forumData) {
      if (
        !forumData ||
        !forumData.id ||
        !Array.isArray(state.allContacts)
      ) return;

      const {
        id,
        parent_forum_id,
        forum_type,
        copy,
        Author,
        Parent_Forum
      } = forumData;

      const type = forum_type || "Post";
      const isPost = type === "Post";
      const mentionedIds = Array.from(copy.matchAll(/data-mention-id=["'](\d+)["']/g)).map(m => Number(m[1]));
      const postAuthorName = Author?.display_name || "Someone";
      const parentForumAuthorId = Parent_Forum?.author_id || null;

      const payload = state.allContacts.map(contactId => {
        const isMentioned = mentionedIds.includes(contactId);
        const isParentOwner = contactId === parentForumAuthorId;
        const isSelfMention = isMentioned && isParentOwner;

        let title = `${postAuthorName} created a ${type.toLowerCase()}.`;
        let notification_type = type;

        if (isMentioned) {
          if (isPost) {
            title = `${postAuthorName} mentioned you in a post.`;
          } else if (isSelfMention) {
            title = `${postAuthorName} mentioned you in a ${type.toLowerCase()} in your post.`;
          } else if (isParentOwner) {
            title = `${postAuthorName} mentioned you in a ${type.toLowerCase()} in your comment.`;
          } else {
            title = `${postAuthorName} mentioned you in a ${type.toLowerCase()}.`;
          }
          notification_type = `${type} Mention`;
        } else if (!isPost && isParentOwner) {
          title = type === "Comment"
            ? `${postAuthorName} commented on your post.`
            : `${postAuthorName} replied to your comment.`;
        }

        return {
          notified_contact_id: contactId,
          parent_forum_id: id,
          ...(isPost ? {} : { parent_forum_if_not_a_post: parent_forum_id }),
          notification_type,
          title
        };
      });

      try {
        await fetchGraphQL(CREATE_NOTIFICATION, { payload });
        console.log("Notifications sent successfully");
      } catch (err) {
        console.error("Failed to send notifications", err);
      }
    }

    // Create forum 
  async function createForumToSubmit(
    depthOfForum,
    forumType,
    formElementId,
    uidParam,

  ) {
    console.log("all contacts are",state.allContacts);
    depthOfForum = Number(depthOfForum);
    const computedType =
      depthOfForum === 0 ? "Post" : depthOfForum === 1 ? "Comment" : "Reply";
    forumType = forumType || computedType;

    await ensureCurrentUser();
    //requestAnimationFrame(setupPlyr);
    const $btn = $(this);
    const formWrapper = document.querySelector(`.${formElementId}`);
    console.log("Form wrapper:", formWrapper);
    const editor = $(`.${formElementId} .editor`);
    console.log("Editor found:", editor);
    const htmlContent = editor.html().trim();
    console.log("HTML content:", htmlContent);
    if (!htmlContent && !pendingFile) {
      console.warn("No content to submit");
      return;
    } else {
      console.log("Content to submit:", htmlContent);
    }

    $btn.prop("disabled", true);
    $("#upload-options").prop("disabled", true);
    formWrapper.classList.add("state-disabled");
    if (forumType === "Post") {
      document.querySelector(".createPostMainModal").classList.add("state-disabled");
    }

    let parentForumId;
    if (forumType !== "Post" && uidParam) {
      const node = findNode(state.postsStore, uidParam);
      parentForumId = node ? node.id : null;
    }
    let publishedDatePayload = Date.now();
    let forumStatusForPayload = "Published - Not flagged";
    let scheduledDateUnix = document.getElementById('scheduledDateContainer');
    if (forumType === "Post" && scheduledDateUnix) {
      if (scheduledDateUnix.innerText.trim() == '') {
        publishedDatePayload = Date.now();
        forumStatusForPayload = "Published - Not flagged";
      } else {
        publishedDatePayload = scheduledDateUnix.innerText.trim();
        forumStatusForPayload = "Scheduled";
      }
    }
    const matches = [...htmlContent.matchAll(/data-mention-id=["'](\d+)["']/g)];
    if (matches.length > 0) {
      console.log("Has attribute data-mention-id");
      const ids = matches.map(m => m[1]);
      console.log("IDs:", ids);

    } else {
      console.log("Does not have attribute data-mention-id");
    }


    const payload = {
      author_id: GLOBAL_AUTHOR_ID,
      Author:{
      display_name: GLOBAL_AUTHOR_DISPLAY_NAME
      },
      copy: processContent(htmlContent),
      published_date: publishedDatePayload,
      depth: depthOfForum,
      Mentioned_Contacts_Data: [],
      forum_type: forumType,
      forum_status: forumStatusForPayload,
    };

    if (forumType === "Post") {
      payload.forum_tag = GLOBAL_PAGE_TAG;
    } else {
      payload.parent_forum_id = parentForumId || null;
      payload.forum_tag = GLOBAL_PAGE_TAG;
    }

    editor.find("span.mention").each(function () {
      payload.Mentioned_Contacts_Data.push({
        mentioned_contact_id: $(this).data("mention-id"),
      });
    });

    let finalPayload = { ...payload };

    if (pendingFile) {
      const fileFields = [{ fieldName: "file_content", file: pendingFile }];
      const toSubmitFields = {};
      await processFileFields(
        toSubmitFields,
        fileFields,
        awsParam,
        awsParamUrl
      );
      let fileData =
        typeof toSubmitFields.file_content === "string"
          ? JSON.parse(toSubmitFields.file_content)
          : toSubmitFields.file_content;
      fileData.name = fileData.name || pendingFile.name;
      fileData.size = fileData.size || pendingFile.size;
      fileData.type = fileData.type || pendingFile.type;
      finalPayload.file_content = JSON.stringify(fileData);
      finalPayload.file_type = fileTypeCheck;
    }

    try {
      const res = await fetchGraphQL(CREATE_FORUM_POST_MUTATION, {
        payload: finalPayload,
      });
      const raw = res.data?.createForumPost;
      if (raw && raw.id) {
        console.log("Post created with ID:", raw.id);
        await sendNotificationsAfterPost(raw);
      }
      if (raw) {
        if (!raw.Author) {
          raw.Author = {
            display_name: state.currentUser?.display_name || "Anonymous",
            profile_image: state.currentUser?.profile_image || DEFAULT_AVATAR,
          };
        }
        const nodeDepth = Number(raw.depth ?? depthOfForum);
        let parentDisable = false;
        if (forumType !== "Post" && uidParam) {
          const parentNode = findNode(state.postsStore, uidParam);
          parentDisable = parentNode ? parentNode.commentsDisabled : false;
        }
        const newNode = mapItem(
          raw,
          nodeDepth,
          parentDisable || raw.disable_new_comments === true
        );
        newNode.isCollapsed = false;

        if (forumType === "Post") {
          state.postsStore.unshift(newNode);
          raw.ForumComments = [];
          state.rawItems.unshift(raw);
        } else {
          const parent = findNode(state.postsStore, uidParam);
          if (parent) {
            parent.children.push(newNode);
            parent.isCollapsed = false;
            state.collapsedState[parent.uid] = false;
          } else {
            state.postsStore.unshift(newNode);
          }
          state.rawItems.push(raw);
        }
        state.postsStore = buildTree(state.postsStore, state.rawItems);
        applyFilterAndRender();
        requestAnimationFrame(() => {
          document
            .querySelector(`[data-uid="${newNode.uid}"]`)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        state.ignoreNextSocketUpdate = true;
        showToast(forumType === "Post" ? "Post created" : "Comment added");
        if (forumType === "Post") {
          $("#create-post-modal").addClass("hidden").removeClass("show");
        } else {
          $(`.${formElementId}`).remove();
        }
      }
      scheduledDateUnix.textContent = '';
      editor.html("");
      setPendingFile(null);
      setFileTypeCheck("");
      $("#file-input").val("");
    } catch (err) {
      console.error("Post failed", err);
    } finally {
      $btn.prop("disabled", false);
      const filepondCloseButton = document.querySelector(
        ".filepond--action-remove-item"
      );
      if (filepondCloseButton) {
        filepondCloseButton.click();
      }

      $("#upload-options").prop("disabled", false);
      formWrapper.classList.remove("state-disabled");
      if (forumType === "Post") {
        document.querySelector(".createPostMainModal").classList.remove("state-disabled");
      }
    }
  }
  window.createForumToSubmit = createForumToSubmit;

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

  // HANDLE LIKE / UNLIKE
  $(document).on("click", ".btn-like", async function () {
    const uid = $(this).data("uid");
    const node = findNode(state.postsStore, uid);
    $(this).addClass("state-disabled");
    let toastMsg = "";

    try {
      if (node.hasUpvoted) {
        await fetchGraphQL(DELETE_REACTION_MUTATION);
        const rawItem = findRawById(state.rawItems, node.id);
        if (rawItem) {
          rawItem.Forum_Reactors_Data = safeArray(
            rawItem.Forum_Reactors_Data
          ).filter((u) => u.id !== node.voteRecordId);
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
      console.log("error is", err);
    } finally {
      $(this).removeClass("state-disabled");
    }
    const $item = $(`[data-uid="${uid}"]`);
    $item.find(".btn-like span").text(node.upvotes);
    $item.find(".btn-like").toggleClass("liked", node.hasUpvoted);
    if (toastMsg) showToast(toastMsg);
  });

  // HANDLE BOOKMARK / UNBOOKMARK (posts only)
  $(document).on("click", ".btn-bookmark", async function () {
    const uid = $(this).data("uid");
    const node = findNode(state.postsStore, uid);
    $(this).addClass("state-disabled");
    let toastMsg = "";

    try {
      if (node.hasBookmarked) {
        await fetchGraphQL(DELETE_BOOKMARK_MUTATION);
        const rawItem = findRawById(state.rawItems, node.id);
        if (rawItem) {
          rawItem.Bookmarking_Contacts_Data = safeArray(
            rawItem.Bookmarking_Contacts_Data
          ).filter((c) => c.id !== node.bookmarkRecordId);
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
        node.bookmarkRecordId =
          res.data.createOBookmarkingContactBookmarkedForum.id;
        toastMsg = "Bookmarked";
      }
    } catch (err) {
      console.log("error is", err);
    } finally {
      $(this).removeClass("state-disabled");
    }
    const $item = $(`[data-uid="${uid}"]`);
    $item.find(".btn-bookmark").toggleClass("bookmarked", node.hasBookmarked);
    if (toastMsg) showToast(toastMsg);
  });

  // MARK POST FEATURED
  $(document).on("click", ".btn-feature", async function () {
    const uid = $(this).data("uid");
    const node = findNode(state.postsStore, uid);
    if (!node) return;
    $(this).addClass("state-disabled");
    try {
      await fetchGraphQL(UPDATE_FORUM_POST_MUTATION, {
        id: node.id,
        payload: { featured_forum: true },
      });
      node.isFeatured = true;
      const rawItem = findRawById(state.rawItems, node.id);
      if (rawItem) rawItem.featured_forum = true;
      applyFilterAndRender();
      showToast("Marked as featured");
    } catch (err) {
      console.error("Failed to mark featured", err);
    } finally {
      $(this).removeClass("state-disabled");
    }
  });

  // UNMARK POST FEATURED
  $(document).on("click", ".btn-unfeature", async function () {
    const uid = $(this).data("uid");
    const node = findNode(state.postsStore, uid);
    if (!node) return;
    $(this).addClass("state-disabled");
    try {
      await fetchGraphQL(UPDATE_FORUM_POST_MUTATION, {
        id: node.id,
        payload: { featured_forum: false },
      });
      node.isFeatured = false;
      const rawItem = findRawById(state.rawItems, node.id);
      if (rawItem) rawItem.featured_forum = false;
      applyFilterAndRender();
      showToast("Removed featured mark");
    } catch (err) {
      console.error("Failed to unmark featured", err);
    } finally {
      $(this).removeClass("state-disabled");
    }
  });

  // DISABLE COMMENTS
  $(document).on("click", ".btn-disable-comments", async function () {
    const uid = $(this).data("uid");
    const node = findNode(state.postsStore, uid);
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
      updateTree(node, true);
      applyFilterAndRender();
      showToast("Comments disabled");
    } catch (err) {
      console.error("Failed to disable comments", err);
    } finally {
      $(this).removeClass("state-disabled");
    }
  });

  // ENABLE COMMENTS
  $(document).on("click", ".btn-enable-comments", async function () {
    const uid = $(this).data("uid");
    const node = findNode(state.postsStore, uid);
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
      updateTree(node, false);
      applyFilterAndRender();
      showToast("Comments enabled");
    } catch (err) {
      console.error("Failed to enable comments", err);
    } finally {
      $(this).removeClass("state-disabled");
    }
  });
}
