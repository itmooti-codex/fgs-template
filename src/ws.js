import {
  state,
  PROTOCOL,
  WS_ENDPOINT,
  SUB_ID,
  KEEPALIVE_MS,
  MAX_BACKOFF,
  INACTIVITY_MS,
  GLOBAL_PAGE_TAG
} from "./config.js";
import { SUBSCRIBE_FORUM_POSTS } from "./api/queries.js";
import { buildTree } from "./ui/render.js";
import { mergeLists } from "./utils/merge.js";
import { applyFilterAndRender } from "./features/posts/index.js";
import { setupPlyr } from "./utils/plyr.js";

let contactIncludedInTag = false;

export function setContactIncludedInTag(val) {
  contactIncludedInTag = val;
}

export function terminateAndClose() {
  if (state.socket && state.socket.readyState === WebSocket.OPEN) {
    state.socket.send(JSON.stringify({ type: "CONNECTION_TERMINATE" }));
    state.socket.close();
  }
  if (
    state.notificationSocket &&
    state.notificationSocket.readyState === WebSocket.OPEN
  ) {
    state.notificationSocket.send(
      JSON.stringify({ type: "CONNECTION_TERMINATE" })
    );
    state.notificationSocket.close();
  }
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
      setupPlyr();
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
            query: SUBSCRIBE_FORUM_POSTS(state.userRole === "admin"),
            variables: { forum_tag: GLOBAL_PAGE_TAG }
          }
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
      const frames = {};
      document.querySelectorAll('.js-player').forEach((el) => {
        const uid = el.closest('.item')?.dataset.uid;
        if (uid) {
          frames[uid] = el.plyr;
        }else{
          console.log("No UID found for player element", el);
        }
      });
      requestAnimationFrame(setupPlyr);
      document.querySelectorAll('.js-player').forEach((el) => {
        const uid = el.closest('.item')?.dataset.uid;
        if (uid && frames[uid]) {
          el.plyr = frames[uid];
        } else {
          setupPlyr();
        }
      });
    } else if (msg.type === "GQL_ERROR") {
      console.error("Subscription error", msg.payload);
      } else if (msg.type === "GQL_COMPLETE") {
        if (state.socket && state.socket.readyState === WebSocket.OPEN) {
          state.socket.send(JSON.stringify({ type: "CONNECTION_TERMINATE" }));
          state.socket.close();
        }
    }
  });
  state.socket.addEventListener("error", e => {
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

function handleVisibilityChange() {
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
        // Contact not included in tag, skipping connection.
      }
    } else if (!state.keepAliveTimer) {
      state.keepAliveTimer = setInterval(() => {
        if (state.socket.readyState === WebSocket.OPEN) {
          state.socket.send(JSON.stringify({ type: "KEEP_ALIVE" }));
        }
      }, KEEPALIVE_MS);
    }
  }
}

export function initWebSocketHandlers() {
  document.addEventListener("visibilitychange", handleVisibilityChange);
}
