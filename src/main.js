import {
  state,
  PROTOCOL,
  WS_ENDPOINT,
  SUB_ID,
  KEEPALIVE_MS,
  MAX_BACKOFF,
  INACTIVITY_MS,
  GLOBAL_AUTHOR_ID,
  DEFAULT_AVATAR,
  NOTIF_SUB_ID,
  GLOBAL_PAGE_TAG,
} from "./config.js";
window.state = state;
import { setGlobals } from "./config.js";
import { showToast } from "./ui/toast.js";
import {
  SUBSCRIBE_FORUM_POSTS,
  FETCH_CONTACTS_QUERY,
  GET_CONTACTS_BY_TAGS,
  GET_SUBSCRIBER_CONTACTS_FOR_MODAL,
  GET_ADMIN_CONTACTS_FOR_MODAL,
  UPDATE_SCHEDULED_TO_POST,
  GET_NOTIFICATIONS
} from "./api/queries.js";
import { buildTree } from "./ui/render.js";
import { mergeLists } from "./utils/merge.js";
import { initPosts, applyFilterAndRender } from "./features/posts/index.js";
import { fetchGraphQL } from "./api/fetch.js";
import { tribute } from "./utils/tribute.js";
import { initFilePond } from "./utils/filePond.js";
import "./features/uploads/handlers.js";
import { initEmojiHandlers } from "./ui/emoji.js";
import { initRichText } from "./utils/richText.js";
import { setupPlyr } from "./utils/plyr.js";
import { updateCurrentUserUI } from "./ui/user.js";
let contactIncludedInTag = false;

function terminateAndClose() {
  if (state.socket && state.socket.readyState === WebSocket.OPEN) {
    state.socket.send(JSON.stringify({ type: "CONNECTION_TERMINATE" }));
    state.socket.close();
  }
  if (state.notificationSocket && state.notificationSocket.readyState === WebSocket.OPEN) {
    state.notificationSocket.send(JSON.stringify({ type: "CONNECTION_TERMINATE" }));
    state.notificationSocket.close();
  }
}
const notificationTemplate = $.templates("#notificationTemplate");

// Connect notification
export function connectNotification() {
  if (
    state.notifIsConnecting ||
    (state.notificationSocket &&
      (state.notificationSocket.readyState === WebSocket.OPEN ||
        state.notificationSocket.readyState === WebSocket.CONNECTING))
  ) {
    return;
  }

  state.notifIsConnecting = true;
  state.notificationSocket = new WebSocket(WS_ENDPOINT, PROTOCOL);

  const notifContainer = document.getElementById("notificationContainerSocket");
  if (notifContainer) {
    notifContainer.innerHTML = `
      <div class="flex w-12 mx-auto my-6">
        <div class="relative">
          <div class="w-12 h-12 rounded-full absolute border border-solid border-gray-200"></div>
          <div class="w-12 h-12 rounded-full animate-spin absolute border border-solid border-yellow-500 border-t-transparent"></div>
        </div>
      </div>`;
  }

  state.notificationSocket.addEventListener("open", () => {
    state.notifBackoff = 1000;
    state.notificationSocket.send(JSON.stringify({ type: "CONNECTION_INIT" }));

    state.notifKeepAliveTimer = setInterval(() => {
      state.notificationSocket.send(JSON.stringify({ type: "KEEP_ALIVE" }));
    }, KEEPALIVE_MS);

    state.notifIsConnecting = false;
  });

  state.notificationSocket.addEventListener("message", ({ data }) => {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch {
      console.error("Invalid JSON", data);
      return;
    }

    if (msg.type === "CONNECTION_ACK") {
      state.notificationSocket.send(
        JSON.stringify({
          id: NOTIF_SUB_ID,
          type: "GQL_START",
          payload: {
            query: GET_NOTIFICATIONS,
            variables: { author_id: GLOBAL_AUTHOR_ID, notified_contact_id: GLOBAL_AUTHOR_ID },
          },
        })
      );
    } else if (
      msg.type === "GQL_DATA" &&
      msg.id === NOTIF_SUB_ID &&
      msg.payload?.data
    ) {
      const notifications = msg.payload.data.subscribeToAnnouncements;
      const notifContainer = document.getElementById("notificationContainerSocket");

      if (notifContainer) {
        notifContainer.innerHTML = "";

        if (!notifications || (Array.isArray(notifications) && notifications.length === 0)) {
          notifContainer.innerHTML = `<div class="text-gray-500 text-sm p-4">No notifications</div>`;
          return;
        }

        if (Array.isArray(notifications)) {
          notifications.forEach((notif) => {
            if (notif?.Title) {
              const html = notificationTemplate.render(notif);
              notifContainer.insertAdjacentHTML("beforeend", html);
            }
          });
        } else if (notifications?.Title) {
          const html = notificationTemplate.render(notifications);
          notifContainer.insertAdjacentHTML("beforeend", html);
        }
      }
    } else if (msg.type === "GQL_ERROR") {
      console.error("Notification subscription error", msg.payload);
    } else if (msg.type === "GQL_COMPLETE") {
      if (
        state.notificationSocket &&
        state.notificationSocket.readyState === WebSocket.OPEN
      ) {
        state.notificationSocket.send(JSON.stringify({ type: "CONNECTION_TERMINATE" }));
        state.notificationSocket.close();
      }
    }
  });

  state.notificationSocket.addEventListener("error", (e) => {
    console.error("Notification WebSocket error", e);
    state.notifIsConnecting = false;
  });

  state.notificationSocket.addEventListener("close", () => {
    clearInterval(state.notifKeepAliveTimer);
    state.notifKeepAliveTimer = null;
    state.notificationSocket = null;
    state.notifIsConnecting = false;
    setTimeout(connectNotification, state.notifBackoff);
    state.notifBackoff = Math.min(state.notifBackoff * 2, MAX_BACKOFF);
  });
}

export function connect() {
  if (
    state.isConnecting ||
    (state.socket &&
      (state.socket.readyState === WebSocket.OPEN ||
        state.socket.readyState === WebSocket.CONNECTING))
  ) {
    return;
  }
  state.isConnecting = true;
  state.socket = new WebSocket(WS_ENDPOINT, PROTOCOL);
  state.socket.addEventListener("open", () => {
    state.backoff = 1000;
    state.socket.send(JSON.stringify({ type: "CONNECTION_INIT" }));
    state.keepAliveTimer = setInterval(() => {
      state.socket.send(JSON.stringify({ type: "KEEP_ALIVE" }));
    }, KEEPALIVE_MS);
    state.isConnecting = false;
  });
  state.socket.addEventListener("message", ({ data }) => {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch {
      console.error("Invalid JSON", data);
      return;
    }
    if (msg.type === "CONNECTION_ACK") {
      state.socket.send(
        JSON.stringify({
          id: SUB_ID,
          type: "GQL_START",
          payload: {
            query: SUBSCRIBE_FORUM_POSTS,
            variables: { forum_tag: GLOBAL_PAGE_TAG },
          },
        })
      );
    } else if (
      msg.type === "GQL_DATA" &&
      msg.id === SUB_ID &&
      msg.payload?.data
    ) {
      const incoming = msg.payload.data.subscribeToForumPosts ?? [];
      state.rawItems = mergeLists(state.rawItems, incoming);
      state.postsStore = buildTree(state.postsStore, state.rawItems);
      state.initialPostsLoaded = true;
      if (state.ignoreNextSocketUpdate) {
        state.ignoreNextSocketUpdate = false;
      } else {
        applyFilterAndRender();
      }
      requestAnimationFrame(setupPlyr);
    } else if (msg.type === "GQL_ERROR") {
      console.error("Subscription error", msg.payload);
    } else if (msg.type === "GQL_COMPLETE") {
      console.warn("Subscription complete");
      if (state.socket && state.socket.readyState === WebSocket.OPEN) {
        state.socket.send(JSON.stringify({ type: "CONNECTION_TERMINATE" }));
        state.socket.close();
      }
    }
  });
  state.socket.addEventListener("error", (e) => {
    console.error("WebSocket error", e);
    state.isConnecting = false;
  });
  state.socket.addEventListener("close", () => {
    clearInterval(state.keepAliveTimer);
    state.keepAliveTimer = null;
    state.socket = null;
    state.isConnecting = false;
    setTimeout(connect, state.backoff);
    state.backoff = Math.min(state.backoff * 2, MAX_BACKOFF);
  });
}

let inactivityTimer;

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      clearInterval(state.keepAliveTimer);
      terminateAndClose();
    }, INACTIVITY_MS);
  } else {
    clearTimeout(inactivityTimer);
    if (!state.socket || state.socket.readyState === WebSocket.CLOSED) {
      if (contactIncludedInTag) {
        connect();
      } else {
        console.log("Contact not included in tag, skipping connection.");
      }
    } else if (!state.keepAliveTimer) {
      state.keepAliveTimer = setInterval(() => {
        if (state.socket.readyState === WebSocket.OPEN) {
          state.socket.send(JSON.stringify({ type: "KEEP_ALIVE" }));
        }
      }, KEEPALIVE_MS);
    }
  }
});

function startApp(tagName, contactId, displayName) {
  terminateAndClose();
  setGlobals(contactId, tagName, displayName);
  const pageTag = GLOBAL_PAGE_TAG;
  let contactTagForQuery = "";
  const contactTag = tagName;
  if (contactTag === pageTag + "_Subscriber" || contactTag === pageTag + "_Admin") {
    contactTagForQuery = tagName;
    const role = contactTag.slice(pageTag.length + 1);
    state.userRole = role.toLowerCase();
    console.log("Extra Text:", contactTag.slice(pageTag.length));
  } else {
    console.log("No Match");
  }

  tribute.attach(document.getElementById("post-editor"));
  fetchGraphQL(FETCH_CONTACTS_QUERY).then((res) => {
    const contacts = res.data.calcContacts;
    state.allContacts = contacts.map(c => c.Contact_ID);
    tribute.collection[0].values = contacts.map((c) => ({
      key: c.Display_Name || "Anonymous",
      value: c.Contact_ID,
      image: c.Profile_Image,
    }));
    const current = contacts.find((c) => c.Contact_ID === GLOBAL_AUTHOR_ID);
    if (current) {
      state.currentUser = {
        display_name: current.Display_Name || "Anonymous",
        profile_image: current.Profile_Image || DEFAULT_AVATAR,
      };
      updateCurrentUserUI(state);
    }
  });

  initPosts();
  initFilePond();
  initEmojiHandlers();
  initRichText();

  fetchGraphQL(GET_CONTACTS_BY_TAGS, {
    id: GLOBAL_AUTHOR_ID,
    name: contactTagForQuery,
  }).then((res) => {
    const result = res?.data?.calcContacts;
    if (Array.isArray(result) && result.length > 0) {
      contactIncludedInTag = true;
      connect();
      connectNotification();
    } else {
      const el = document.getElementById("forum-root");
      document.getElementById("skeleton-loader")?.remove();
      el.replaceChildren(
        Object.assign(document.createElement("h2"), {
          className: "text-center text-gray-500",
          textContent: "No posts found.",
        })
      );
    }
  });

  const trigger = document.getElementById("create-post-trigger");
  const modal = document.getElementById("create-post-modal");
  const closeBtn = document.getElementById("close-post-modal");

  if (trigger && modal) {
    trigger.addEventListener("click", () => {
      modal.classList.remove("hidden");
      modal.classList.add("show");
      document.getElementById("post-editor").focus();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.classList.add("hidden");
      modal.classList.remove("show");
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeBtn?.click();
      }
    });
  }
}

function renderContacts(list, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.classList = "";
  container.classList.add("grid", "grid-cols-2", "gap-4", "p-4");
  container.innerHTML = list
    .map((c) => {
      const isAdmin = containerId === "adminContacts";
      return `
    <div 
      @click="${isAdmin
          ? `
            document.getElementById('adminSchedulePostButton').classList.remove('hidden');
            document.getElementById('tabsForAdmin').classList.remove('hidden');
          `
          : `
            document.getElementById('adminSchedulePostButton').classList.add('hidden');
            document.getElementById('tabsForAdmin').classList.add('hidden');
          `
        }
      loadSelectedUserForum('${c.TagName}','${c.Contact_ID}','${c.Display_Name?.replace(/'/g, "\\'") || "Anonymous"}','${c.Profile_Image || DEFAULT_AVATAR}');
      modalToSelectUser=false;" 
      class="cursor-pointer flex items-center flex-col "
    >
      <div class="flex items-center flex-col gap-2 m-[5px] cursor-pointer h-[128px] w-[128px] rounded-full border-[4px] border-[rgba(200,200,200,0.4)] transition-[border] duration-200 ease-linear hover:border-[rgba(0,0,0,0.2)]">
        <img
          src="${c.Profile_Image || DEFAULT_AVATAR}"
          alt="${c.Display_Name || "Anonymous"}"
          class="h-full w-full rounded-full object-cover" />
      </div>
      <div>${c.Display_Name || "Anonymous"}</div>
    </div>
  `;
    })

    .join("");
}

function loadModalContacts() {
  fetchGraphQL(GET_SUBSCRIBER_CONTACTS_FOR_MODAL).then((res) => {
    const contacts = res?.data?.calcContacts || [];
    renderContacts(contacts, "subscriberContacts");
  });
  fetchGraphQL(GET_ADMIN_CONTACTS_FOR_MODAL).then((res) => {
    const contacts = res?.data?.calcContacts || [];
    renderContacts(contacts, "adminContacts");
  });
}

function loadSelectedUserForum(tagName, contactId, displayName, profileImage) {
  console.log("Loading selected user forum");
  if (displayName || profileImage) {
    state.currentUser = {
      display_name: displayName || "Anonymous",
      profile_image: profileImage || DEFAULT_AVATAR,
    };
    updateCurrentUserUI(state);
  }
  startApp(tagName, contactId,displayName);
}

window.loadSelectedUserForum = loadSelectedUserForum;
window.addEventListener("DOMContentLoaded", () => {
  loadModalContacts();
});

$.views.helpers({
  totalComments: function (comments) {
    return comments.reduce((total, comment) => {
      return total + 1 + (comment.children?.length || 0);
    }, 0);
  },
  formatDate: function (unix) {
    if (!unix) return "";
    const date = new Date(Number(unix) * 1000);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  }
});

document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".postNowFromScheduled");
  if (!btn) return;
  btn.classList.add("opacity-50", "cursor-not-allowed", "pointer-events-none");
  const uid = btn.getAttribute("data-uid");
  if (!uid) return;
  const variables = {
    unique_id: uid,
    payload: {
      forum_status: "Published - Not flagged"
    }
  };

  try {
    const response = await fetchGraphQL(UPDATE_SCHEDULED_TO_POST, variables, UPDATE_SCHEDULED_TO_POST);
   showToast("Post updated successfully!");
    btn.classList.add("opacity-50", "cursor-not-allowed", "pointer-events-none");
  } catch (error) {
    console.error("Error updating post:", error);
  }
});

// tab functionality for Published and Scheduled Post

const publishedTab = document.getElementById("publishedTab");
const scheduledTab = document.getElementById("scheduledTab");

function showPublished() {
  document.querySelectorAll('[data-forumstatus="Published - Not flagged"]').forEach(el => el.style.display = '');
  document.querySelectorAll('[data-forumstatus="Scheduled"]').forEach(el => el.style.display = 'none');

  publishedTab.classList.add("active");
  scheduledTab.classList.remove("active");
}

function showScheduled() {
  document.querySelectorAll('[data-forumstatus="Published - Not flagged"]').forEach(el => el.style.display = 'none');
  document.querySelectorAll('[data-forumstatus="Scheduled"]').forEach(el => el.style.display = '');

  scheduledTab.classList.add("active");
  publishedTab.classList.remove("active");
}

document.addEventListener("DOMContentLoaded", function () {
  publishedTab.addEventListener("click", showPublished);
  scheduledTab.addEventListener("click", showScheduled);
  showPublished(); // Default state
});

// Update Announcement to read
document.addEventListener("click", async (e) => {
  const markAll = e.target.id === "markAllNotificationAsRead";

  let ids = [];

  if (markAll) {
    const container = document.getElementById("notificationContainerSocket");
    const elements = container.querySelectorAll("[data-announcement].unread");
    ids = Array.from(elements).map(el => el.getAttribute("data-announcement"));
  } else {
    const unreadElements = document.querySelectorAll(".unread");
    for (const el of unreadElements) {
      if (el.contains(e.target)) {
        const announcementId = el.getAttribute("data-announcement");
        if (!announcementId) return;
        ids = [announcementId];
        break;
      }
    }
  }

  if (!ids.length) return;

  const variables = {
    payload: { is_read: true }
  };

  const UPDATE_ANNOUNCEMENT = `
    mutation updateAnnouncements($payload: AnnouncementUpdateInput = null) {
      updateAnnouncements(query: [{ whereIn: { id: [${ids.join(",")}] } }], payload: $payload) {
        is_read
      }
    }
  `;

  try {
    await fetchGraphQL(UPDATE_ANNOUNCEMENT, variables, UPDATE_ANNOUNCEMENT);

    if (markAll) {
      const container = document.getElementById("notificationContainerSocket");
      const elements = container.querySelectorAll("[data-announcement].unread");
      elements.forEach(el => {
        el.classList.remove("unread");
        el.classList.add("read");
      });
    } else {
      document.querySelectorAll(".unread").forEach(el => {
        if (ids.includes(el.getAttribute("data-announcement"))) {
          el.classList.remove("unread");
          el.classList.add("read");
        }
      });
    }
  } catch (error) {
    console.error("Error marking announcement(s) as read:", error);
  }
});
