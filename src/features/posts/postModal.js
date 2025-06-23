import { GET_SINGLE_POST_SUBSCRIPTION } from "../../api/queries.js";
import { buildTree } from "../../ui/render.js";
import { renderItems } from "../../ui/render.js";
import { setupPlyr } from "../../utils/plyr.js";
import { PROTOCOL, WS_ENDPOINT, KEEPALIVE_MS } from "../../config.js";

let modalTree = [];
function renderModal() {
  const container = document.getElementById("modalForumRoot");
  if (!container) return;
  container.innerHTML = renderItems(modalTree, { inModal: true });
  requestAnimationFrame(() => {
    setupPlyr();
  });
}

export function rerenderModal() {
  renderModal();
}

export function getModalTree() {
  return modalTree;
}

const MODAL_SKELETON = `
  <div id="modal-skeleton-loader" class="p-4 w-[855px] max-[855px]:w-full">
    <div class="skeleton-item flex gap-4 mb-4">
      <div class="skeleton-avatar"></div>
      <div class="flex-1 flex flex-col gap-2">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line medium"></div>
      </div>
    </div>
  </div>`;
const DELETED_MODAL_HTML = `
  <div class="flex items-start justify-between p-4 w-[855px] max-[855px]:w-full max-[855px]:w-full">
    <div class="font-semibold">
    <img src="https://files.ontraport.com/media/18ded122924c40dda5df5dfd30bd4874.phpju0bt7?Expires=4904280560&Signature=P4Q2t4zBd-FYETAdawPhNOvkAbj3qsmstq7FP5OdK52k72q6WGTEOy4NT9orvOk5nHhkf2DE9Y7ibtCgTbZ4NoezM-uTRcP8vpcfm6oXjeACVaqFwTEhgazYWm3xnF1YFU2ssPnvtmYI7kxGEtxTLPLovzYZMeOtkIm7PYhDHR094-Uc8x-VLyKktEFjjFbZ3zshhTnM50~t5zfjbuRDTJ16wY1YaWotp2DQVPwlzvbuzg6Rs2Vuo02a7rBq8370klWcfE835qHwYDYtxfiTvt8cPwqmeilTLemlBBNR~WYrmX39KTEgh2rxdbpFfZSKsx~1xmz8REkyIF6USwjsYA__&Key-Pair-Id=APKAJVAAMVW6XQYWSTNA" />
    </div>
    <div x-on:click="modalForPostOpen = false"
      class="group flex cursor-pointer items-center justify-start gap-2 rounded-[34px] bg-zinc-100 p-2 transition-all hover:bg-[var(--color-primary-shade)]">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M18.8535 18.146C18.8999 18.1925 18.9368 18.2476 18.9619 18.3083C18.9871 18.369 19 18.4341 19 18.4997C19 18.5654 18.9871 18.6305 18.9619 18.6912C18.9368 18.7519 18.8999 18.807 18.8535 18.8535C18.807 18.8999 18.7519 18.9368 18.6912 18.9619C18.6305 18.9871 18.5654 19 18.4997 19C18.4341 19 18.369 18.9871 18.3083 18.9619C18.2476 18.9368 18.1925 18.8999 18.146 18.8535L14 14.7068L9.85398 18.8535C9.76017 18.9473 9.63292 19 9.50025 19C9.36758 19 9.24033 18.9473 9.14652 18.8535C9.0527 18.7597 9 18.6324 9 18.4997C9 18.3671 9.0527 18.2398 9.14652 18.146L13.2932 14L9.14652 9.85398C9.0527 9.76017 9 9.63292 9 9.50025C9 9.36758 9.0527 9.24033 9.14652 9.14652C9.24033 9.0527 9.36758 9 9.50025 9C9.63292 9 9.76017 9.0527 9.85398 9.14652L14 13.2932L18.146 9.14652C18.2398 9.0527 18.3671 9 18.4997 9C18.6324 9 18.7597 9.0527 18.8535 9.14652C18.9473 9.24033 19 9.36758 19 9.50025C19 9.63292 18.9473 9.76017 18.8535 9.85398L14.7068 14L18.8535 18.146Z"
          fill="#0E0E0E"></path>
      </svg>
    </div>
  </div>`;

function normalize(node, list) {
  const {
    Author_ID,
    Formatted_Json,
    Date_Added,
    Published_Date,
    Disable_New_Comments,
    Featured_Forum,
    File_Content,
    File_Type,
    ID,
    Copy,
    Forum_Status,
    Unique_ID,
    Depth,
    Forum_Type,
    Parent_Forum_ID,
    Author,
    Bookmarking_Contacts_Data,
    Forum_Reactors_Data,
    ForumPosts,
  } = node;
  list.push({
    author_id: Author_ID,
    formatted_json: Formatted_Json,
    created_at: Date_Added,
    published_date: Published_Date,
    disable_new_comments: Disable_New_Comments,
    featured_forum: Featured_Forum,
    file_content: File_Content,
    file_type: File_Type,
    id: ID,
    copy: Copy,
    forum_status: Forum_Status,
    unique_id: Unique_ID,
    depth: Depth,
    forum_type: Forum_Type,
    parent_forum_id: Parent_Forum_ID,
    Author,
    Bookmarking_Contacts_Data,
    Forum_Reactors_Data,
  });
  if (Array.isArray(ForumPosts)) {
    ForumPosts.forEach((child) => normalize(child, list));
  }
}

const POST_MODAL_SUB_ID = "post-modal-subscription";
let modalSocket = null;
let keepAliveTimer = null;

function closeModalSocket() {
  if (modalSocket && modalSocket.readyState === WebSocket.OPEN) {
    modalSocket.send(JSON.stringify({ type: "CONNECTION_TERMINATE" }));
    modalSocket.close();
  }
  clearInterval(keepAliveTimer);
  keepAliveTimer = null;
  modalSocket = null;
}

export function openPostModalById(postId, author = "") {
  if (!postId) return;

  // ensure the modal is displayed (Alpine data)
  try {
    const body = document.querySelector("body");
    if (body && body.__x && body.__x.$data) {
      body.__x.$data.modalForPostOpen = true;
    }
  } catch {
    // ignore if Alpine isn't available
  }

  const container = document.getElementById("modalForumRoot");
  if (container) {
    container.innerHTML = MODAL_SKELETON;
  }

  const titleEl = document.getElementById("defaultModalTitle");
  if (titleEl) {
    titleEl.textContent = author || "";
  }

  closeModalSocket();
  modalSocket = new WebSocket(WS_ENDPOINT, PROTOCOL);

    modalSocket.addEventListener("open", () => {
      modalSocket.send(JSON.stringify({ type: "CONNECTION_INIT" }));
      keepAliveTimer = setInterval(() => {
        modalSocket.send(JSON.stringify({ type: "KEEP_ALIVE" }));
      }, KEEPALIVE_MS);
    });

    modalSocket.addEventListener("message", ({ data }) => {
      let msg;
      try {
        msg = JSON.parse(data);
      } catch {
        console.error("Invalid JSON", data);
        return;
      }

      if (msg.type === "CONNECTION_ACK") {
        modalSocket.send(
          JSON.stringify({
            id: POST_MODAL_SUB_ID,
            type: "GQL_START",
            payload: {
              query: GET_SINGLE_POST_SUBSCRIPTION,
              variables: { id: postId },
            },
          })
        );
      } else if (
        msg.type === "GQL_DATA" &&
        msg.id === POST_MODAL_SUB_ID &&
        msg.payload?.data
      ) {
        const data = msg.payload.data.subscribeToForumPost;
        if (!data) {
          console.log("Post not found or deleted");
          if (container) {
            container.innerHTML = DELETED_MODAL_HTML;
          }
          return;
        }
        const list = [];
        normalize(data, list);
        modalTree = buildTree([], list);
        // replies remain collapsed; comment forms remain closed by default

        if (container) {
          renderModal();
        }
      } else if (msg.type === "GQL_ERROR") {
        console.error("Subscription error", msg.payload);
      } else if (msg.type === "GQL_COMPLETE") {
        closeModalSocket();
      }
    });

    modalSocket.addEventListener("error", (e) => {
      console.error("Post modal WebSocket error", e);
      closeModalSocket();
    });

  modalSocket.addEventListener("close", () => {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
    modalSocket = null;
  });
}

export function initPostModalHandlers() {
  $(document).on("click", ".openPostModal", function () {
    const postId = $(this).data("id");
    const author = $(this).data("author");
    openPostModalById(postId, author);
  });

  document.addEventListener("click", (e) => {
    if (e.target.closest('[x-on\\:click="modalForPostOpen = false"]')) {
      closeModalSocket();
    }
  });
}
