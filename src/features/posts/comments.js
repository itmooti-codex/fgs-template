import { state } from "../../config.js";
import { findNode } from "../../ui/render.js";
import { toolbarDesign } from "../../ui/emoji.js";
import { moveCursorToEnd } from "../../utils/caret.js";
import { tribute } from "../../utils/tribute.js";
import { initFilePond } from "../../utils/filePond.js";
import { applyFilterAndRender } from "./filters.js";
import { rerenderModal, getModalTree } from "./postModal.js";

export function initCommentHandlers() {
  $(document).off("click.btnComment");
  $(document).on("click.btnComment", ".btn-comment", function (e) {
    e.stopPropagation();
    // const uid = $(this).data("uid");
    let commentingUser =state.currentUser.profile_image;
    let uid = $(this).attr("data-uid");
    const container = $(this).closest(".item");
    const existing = container.children(".upload-section");

    if (existing.length) {
      existing.remove();
      return;
    }

    $(".comment-form").remove();
    const inModal = $(this).closest("#modalForumRoot").length > 0;
    const source = inModal ? getModalTree() : state.postsStore;
    const node = findNode(source, uid);
    if (!node) {
      console.error("Node not found for uid", uid);
      return;
    }
    const mentionHtml = `<span contenteditable="false" class="mention" data-mention-id="${node.authorId}">@${node.authorName}</span>&nbsp;`;

    const nextDepth = Math.min((node.depth || 0) + 1, 2);
    const nextType = nextDepth === 1 ? "Comment" : "Reply";
    const placeholder = nextType === "Comment" ? "Write a comment..." : "Write a reply...";
    if(nextType === "Reply") {  
      uid = $(this).closest('.commentContainer').attr('data-uid') || uid;
    }
   let isPost = (nextType === "Comment");

    const $form = $(`
      <div class="upload-section flex items-start gap-2 mt-2 ${isPost ? 'mx-4' : ''}">

<div class="!w-6 !h-6 shrink-0 rounded-full  border border-zinc-300 ">
    <img class=" size-full object-cover rounded-full" 
     src="${commentingUser}"

                     onerror="this.onerror=null;this.src='https://files.ontraport.com/media/b0456fe87439430680b173369cc54cea.php03bzcx?Expires=4895186056&Signature=fw-mkSjms67rj5eIsiDF9QfHb4EAe29jfz~yn3XT0--8jLdK4OGkxWBZR9YHSh26ZAp5EHj~6g5CUUncgjztHHKU9c9ymvZYfSbPO9JGht~ZJnr2Gwmp6vsvIpYvE1pEywTeoigeyClFm1dHrS7VakQk9uYac4Sw0suU4MpRGYQPFB6w3HUw-eO5TvaOLabtuSlgdyGRie6Ve0R7kzU76uXDvlhhWGMZ7alNCTdS7txSgUOT8oL9pJP832UsasK4~M~Na0ku1oY-8a7GcvvVv6j7yE0V0COB9OP0FbC8z7eSdZ8r7avFK~f9Wl0SEfS6MkPQR2YwWjr55bbJJhZnZA__&Key-Pair-Id=APKAJVAAMVW6XQYWSTNA';"
    />
  </div>

    <div class=" comment-form   w-full">
  <div class="flex w-full min-h-32 transtion-all border-[1px] hover:border-[var(--color-primary)] resize-y flex-col items-end justify-end gap-4 rounded-xl bg-[var(--grey-300)] px-3 py-2 focus-within:border focus-within:border-[var(--color-primary)]">
      <div contenteditable="true" id="editor" data-placeholder="${placeholder}" class="p2 editor flex-1 resize-y justify-start self-stretch outline-none">${mentionHtml}</div>
    <div class="flex w-full items-center justify-between">
    ${toolbarDesign}
    <div class="flex items-center gap-2">
      <div class="ml-auto flex cursor-pointer items-center justify-end gap-3" id="submitForumPost" onclick="createForumToSubmit('${nextDepth}','${nextType}','comment-form','${uid}');">
        <div class="group flex items-center justify-start gap-2 rounded bg-[var(--grey-100)] px-3 py-2 transition-all hover:bg-[var(--color-primary)]">
          <div class="p3 justify-start text-center text-white max-[702px]:hidden">Post</div>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path class="group-hover:fill-white" d="M10.4282 5.99409C10.4285 6.12138 10.3948 6.24645 10.3306 6.35635C10.2664 6.46625 10.174 6.557 10.0629 6.61922L2.56502 10.9062C2.45742 10.9672 2.33595 10.9995 2.21227 11C2.09832 10.9994 1.98616 10.9715 1.88517 10.9187C1.78417 10.8659 1.69727 10.7898 1.63172 10.6965C1.56617 10.6033 1.52386 10.4958 1.50834 10.3829C1.49282 10.27 1.50453 10.155 1.54249 10.0476L2.74809 6.47767C2.75987 6.44277 2.78216 6.41236 2.8119 6.39062C2.84163 6.36888 2.87736 6.35686 2.9142 6.35622H6.14162C6.19059 6.35633 6.23906 6.34636 6.28402 6.32695C6.32898 6.30754 6.36946 6.27909 6.40296 6.24337C6.43646 6.20765 6.46226 6.16543 6.47875 6.11932C6.49525 6.07321 6.50208 6.0242 6.49884 5.97534C6.49074 5.88348 6.44824 5.79808 6.37985 5.73623C6.31145 5.67438 6.22222 5.64065 6.13002 5.64179H2.91509C2.87772 5.64179 2.84129 5.63008 2.81094 5.60829C2.78058 5.5865 2.75782 5.55574 2.74586 5.52034L1.54026 1.95088C1.49228 1.81406 1.48705 1.66588 1.52529 1.52603C1.56352 1.38617 1.6434 1.26126 1.75432 1.16789C1.86524 1.07451 2.00194 1.01709 2.14626 1.00326C2.29059 0.989426 2.43571 1.01983 2.56234 1.09044L10.0638 5.37209C10.1743 5.43416 10.2662 5.52447 10.3302 5.63377C10.3942 5.74307 10.4281 5.86742 10.4282 5.99409Z" fill="white" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</div>
<div>
    <input type="file" id="file-input" class="file-input" style="display: none;" accept="image/*,audio/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
    <canvas class="canvasWaveform waveform mt-2 w-full" id="waveform" width="450" height="100"></canvas>
    </div>
  </div>
  </div>

  `);
    const actions = container.children(".actions").first();
    if (actions.length) {
      actions.after($form);
    } else {
      container.append($form);
    }
    const inserted = container.find(".comment-form");
    if (inserted.length) {
      const editorEl = inserted.find(".editor")[0];
      if (editorEl) {
        tribute.attach(editorEl);
      }
      container.find(".children").addClass("visible");
      requestAnimationFrame(() => {
        inserted[0].scrollIntoView({ behavior: "smooth", block: "center" });
        if (editorEl) {
          moveCursorToEnd(editorEl);
        }
      });
    }
    initFilePond();
  });

  // Toggle visibility of replies
  $(document).off("click.toggleReplies");
  $(document).on("click.toggleReplies", ".toggle-replies", function (e) {
    e.stopPropagation();
    const uid = $(this).data("uid");
    const inModal = $(this).closest("#modalForumRoot").length > 0;
    const source = inModal ? getModalTree() : state.postsStore;
    const node = findNode(source, uid);
    if (!node) {
      console.error("Node not found for uid", uid);
      return;
    }
    const newState = !node.isCollapsed;
    node.isCollapsed = newState;
    state.collapsedState[uid] = newState;
    if (inModal) {
      rerenderModal();
    } else {
      applyFilterAndRender();
    }
  });

  $(document).off("click.hideUploadMenu");
  $(document).on("click.hideUploadMenu", function (e) {
    if (!$(e.target).closest(".comment-form, #post-creation-form").length) {
      $("#upload-menu").hide();
    }
  });

  // Ribbon removal: replies stay hidden by default
}
