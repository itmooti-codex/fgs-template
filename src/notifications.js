import {
  state,
  PROTOCOL,
  WS_ENDPOINT,
  KEEPALIVE_MS,
  MAX_BACKOFF,
  NOTIF_SUB_ID,
  GLOBAL_AUTHOR_ID
} from "./config.js";
import { GET_NOTIFICATIONS } from "./api/queries.js";
import { fetchGraphQL } from "./api/fetch.js";
import { openPostModalById } from "./features/posts/postModal.js";

const notificationTemplate = $.templates("#notificationTemplate");

export function refreshNotificationSubscription() {
  if (
    !state.notificationSocket ||
    state.notificationSocket.readyState !== WebSocket.OPEN
  ) {
console.log("Notification socket is not open, cannot refresh subscription.");
    return;
  }

  state.notificationSocket.send(
    JSON.stringify({
      id: NOTIF_SUB_ID,
      type: "GQL_STOP"
    })
  );

  const updatedQuery = GET_NOTIFICATIONS();

  state.notificationSocket.send(
    JSON.stringify({
      id: NOTIF_SUB_ID,
      type: "GQL_START",
      payload: {
        query: updatedQuery,
        variables: {
          author_id: GLOBAL_AUTHOR_ID,
          notified_contact_id: GLOBAL_AUTHOR_ID
        }
      }
    })
  );
}

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
    const query = GET_NOTIFICATIONS();
    if (msg.type === "CONNECTION_ACK") {
      state.notificationSocket.send(
        JSON.stringify({
          id: NOTIF_SUB_ID,
          type: "GQL_START",
          payload: {
            query: query,
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

export function initNotificationEvents() {
  document.addEventListener("click", async (e) => {
    const notifEl = e.target.closest(".notification");
    if (notifEl) {
      const forumId = notifEl.getAttribute("data-parentforumid");
      if (forumId) {
        try {
          const body = document.querySelector("body");
          if (body && body.__x && body.__x.$data) {
            body.__x.$data.showNotifications = false;
          }
        } catch {
          console.error("Failed to hide notifications modal");
        }
        openPostModalById(forumId);
      }
    }

    const markAll = e.target.id === "markAllNotificationAsRead";

    let ids = [];

    if (markAll) {
      const container = document.getElementById("notificationContainerSocket");
      const elements = container.querySelectorAll("[data-announcement].unread");
      ids = Array.from(elements).map((el) => el.getAttribute("data-announcement"));
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
      payload: { is_read: true },
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
        elements.forEach((el) => {
          el.classList.remove("unread");
          el.classList.add("read");
        });
      } else {
        document.querySelectorAll(".unread").forEach((el) => {
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
}
