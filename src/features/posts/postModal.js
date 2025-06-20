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
  <div id="modal-skeleton-loader" class="p-4 w-[855px]">
    <div class="skeleton-item flex gap-4 mb-4">
      <div class="skeleton-avatar"></div>
      <div class="flex-1 flex flex-col gap-2">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line medium"></div>
      </div>
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
        if (!data) return;
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
