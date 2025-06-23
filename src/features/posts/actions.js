import { fetchGraphQL } from "../../api/fetch.js";
import { CREATE_FORUM_POST_MUTATION } from "../../api/queries.js";
import {
  state,
  GLOBAL_PAGE_TAG,
  GLOBAL_AUTHOR_ID,
  GLOBAL_AUTHOR_DISPLAY_NAME,
  DEFAULT_AVATAR,
} from "../../config.js";
import { findNode, buildTree, mapItem } from "../../ui/render.js";
import {
  pendingFile,
  fileTypeCheck,
  setPendingFile,
  setFileTypeCheck,
} from "../uploads/handlers.js";
import { processFileFields } from "../../utils/handleFile.js";
import { applyFilterAndRender } from "./filters.js";
import { mergeLists } from "../../utils/merge.js";
import { showToast } from "../../ui/toast.js";
import { ensureCurrentUser } from "./user.js";
import { processContent } from "./content.js";
import { sendNotificationsAfterPost } from "./notifications.js";
import { getModalTree, rerenderModal } from "./postModal.js";

function getImageOrientation(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve(img.width >= img.height ? "landscape" : "portrait");
      };
      img.onerror = () => resolve("");
      img.src = e.target.result;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}
function formatFileSize(bytes) {
  const MB = 1024 * 1024;
  if (bytes >= MB) {
    return `${(bytes / MB).toFixed(2)}mb`;
  }
  return `${Math.ceil(bytes / 1024)}kb`;
}

export async function createForumToSubmit(
  depthOfForum,
  forumType,
  formElementId,
  uidParam,
) {
  depthOfForum = Number(depthOfForum);
  const computedType =
    depthOfForum === 0 ? "Post" : depthOfForum === 1 ? "Comment" : "Reply";
  forumType = forumType || computedType;

  await ensureCurrentUser();
  const formWrapper = document.querySelector(`.${formElementId}`);
  const $btn = formWrapper
    ? $(formWrapper).find('#submitForumPost')
    : $(this);
  const inModal = Boolean(formWrapper?.closest('#modalForumRoot'));
  const editor = $(`.${formElementId} .editor`);
  const htmlContent = editor.html().trim();
  if (!htmlContent && !pendingFile) {
    alert("Please enter some content or upload a file.");
    return null;
  }

  $btn.prop("disabled", true);
  $("#upload-options").prop("disabled", true);
  if (forumType === "Post") {
    $(".postingLoader").removeClass("hidden");
    $(".postingLoader").addClass("flex");
  } else {
    formWrapper.classList.add("state-disabled");
  }
  
  

  let parentForumId;
  if (forumType !== "Post" && uidParam) {
    const source = inModal ? getModalTree() : state.postsStore;
    const node = findNode(source, uidParam);
    if (node) {
      parentForumId = node.id;
    } else {
      console.log("Parent node not found, trying to find closest item");
      const elemetnt = document.querySelector(`.commentContainer_${uidParam}`);
      parentForumId = elemetnt ? elemetnt.getAttribute("data-id") : null;
    }
  }
  let publishedDatePayload = Date.now();
  let forumStatusForPayload = "Published - Not flagged";
  const scheduledDateUnix = document.getElementById('scheduledDateContainer');
  if (forumType === "Post" && scheduledDateUnix) {
    if (scheduledDateUnix.innerText.trim() === '') {
      publishedDatePayload = Date.now();
      forumStatusForPayload = "Published - Not flagged";
    } else {
      publishedDatePayload = scheduledDateUnix.innerText.trim();
      forumStatusForPayload = "Scheduled";
    }
  }

  const payload = {
    author_id: GLOBAL_AUTHOR_ID,
    Author: {
      display_name: GLOBAL_AUTHOR_DISPLAY_NAME,
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
      awsParamUrl,
    );
    let fileData =
      typeof toSubmitFields.file_content === 'string'
        ? JSON.parse(toSubmitFields.file_content)
        : toSubmitFields.file_content;
    fileData.name = fileData.name || pendingFile.name;
    fileData.size = fileData.size || pendingFile.size;
    fileData.type = fileData.type || pendingFile.type;
    finalPayload.file_content = JSON.stringify(fileData);
    finalPayload.file_type = fileTypeCheck;
    finalPayload.file_name = pendingFile.name;
    finalPayload.file_size = formatFileSize(pendingFile.size);
    finalPayload.file_link = JSON.stringify(fileData);
    if (fileTypeCheck === "Image") {
      finalPayload.image_orientation = await getImageOrientation(pendingFile);
    }
  }

  try {
    const res = await fetchGraphQL(CREATE_FORUM_POST_MUTATION, {
      payload: finalPayload,
    });
    const raw = res.data?.createForumPost;
    if (raw && raw.id) {
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
        const parentNode = findNode(
          inModal ? getModalTree() : state.postsStore,
          uidParam,
        );
        parentDisable = parentNode ? parentNode.commentsDisabled : false;
      }
      const newNode = mapItem(
        raw,
        nodeDepth,
        parentDisable || raw.disable_new_comments === true,
      );
      newNode.isCollapsed = false;

      if (forumType === "Post") {
        state.postsStore.unshift(newNode);
        raw.ForumComments = [];
        state.rawItems = mergeLists(state.rawItems, [raw]);
        state.postsStore = buildTree(state.postsStore, state.rawItems);
        applyFilterAndRender();
      } else if (inModal) {
        const modalTree = getModalTree();
        const parent = findNode(modalTree, uidParam);
        if (parent) {
          const exists = parent.children.find((c) => c.uid === newNode.uid);
          if (!exists) parent.children.push(newNode);
          parent.isCollapsed = false;
        } else {
          modalTree.push(newNode);
        }
        rerenderModal();
      } else {
        const parent = findNode(state.postsStore, uidParam);
        if (parent) {
          const exists = parent.children.find((c) => c.uid === newNode.uid);
          if (!exists) parent.children.push(newNode);
          parent.isCollapsed = false;
          state.collapsedState[parent.uid] = false;
        } else {
          state.postsStore.unshift(newNode);
        }
        state.rawItems = mergeLists(state.rawItems, [raw]);
        state.postsStore = buildTree(state.postsStore, state.rawItems);
        applyFilterAndRender();
      }
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
    if (scheduledDateUnix) scheduledDateUnix.textContent = '';
    editor.html("");
    setPendingFile(null);
    setFileTypeCheck("");
    $("#file-input").val("");
  } catch (err) {
    console.error("Post failed", err);
  } finally {
    $btn.prop("disabled", false);
    const filepondCloseButton = document.querySelector(
      ".filepond--action-remove-item",
    );
    if (filepondCloseButton) {
      filepondCloseButton.click();
    }
    $("#upload-options").prop("disabled", false);
    
    
    if (forumType === "Post") {
      $(".postingLoader").removeClass("flex");
      $(".postingLoader").addClass("hidden");
    }else{
      formWrapper.classList.remove("state-disabled");
    }
  }
}


