window.APP_CONFIG = {
  API_KEY: "uXVeRpnkFYHhT8SQK6JXo",
  AWS_PARAM: "5d26643c9bf758f00272ffed8558a0d9",
  AWS_PARAM_URL: "https://learn.eduflowpro.com/s/aws",
  HTTP_ENDPOINT: "https://eduflowpro.vitalstats.app/api/v1/graphql",
  WS_ENDPOINT:
    "wss://eduflowpro.vitalstats.app/api/v1/graphql?apiKey=uXVeRpnkFYHhT8SQK6JXo",
};

export const env = (typeof process !== "undefined" && process.env) || {};
export const cfg = (typeof window !== "undefined" && window.APP_CONFIG) || {};

export const API_KEY = cfg.API_KEY || env.API_KEY || "";
export const awsParam = cfg.AWS_PARAM || env.AWS_PARAM || "";
export const awsParamUrl = cfg.AWS_PARAM_URL || env.AWS_PARAM_URL || "";
export const HTTP_ENDPOINT =
  cfg.HTTP_ENDPOINT ||
  env.HTTP_ENDPOINT ||
  "https://eduflowpro.vitalstats.app/api/v1/graphql";
export const WS_ENDPOINT =
  cfg.WS_ENDPOINT ||
  env.WS_ENDPOINT ||
  `wss://eduflowpro.vitalstats.app/api/v1/graphql?apiKey=${API_KEY}`;

if (typeof window !== "undefined") {
  window.awsParam = awsParam;
  window.awsParamUrl = awsParamUrl;
}
export const PROTOCOL = "vitalstats";
export const SUB_ID = "forum-subscription";
export const NOTIF_SUB_ID = "notification-subscription";
export const KEEPALIVE_MS = 80000;
export const MAX_BACKOFF = 30000;
export const INACTIVITY_MS = 10 * 60 * 1000; 
export let GLOBAL_AUTHOR_ID = 62;
export let GLOBAL_AUTHOR_DISPLAY_NAME = "Eduflow Pro";
export let GLOBAL_PAGE_TAG ="Demo_Forum";
export function setGlobals(authorId, pageTag, displayName) {
  GLOBAL_AUTHOR_ID = Number(authorId);
  GLOBAL_AUTHOR_DISPLAY_NAME = displayName;
}
export const DEFAULT_AVATAR =
  "https://files.ontraport.com/media/b0456fe87439430680b173369cc54cea.php03bzcx?Expires=4895186056&Signature=fw-mkSjms67rj5eIsiDF9QfHb4EAe29jfz~yn3XT0--8jLdK4OGkxWBZR9YHSh26ZAp5EHj~6g5CUUncgjztHHKU9c9ymvZYfSbPO9JGht~ZJnr2Gwmp6vsvIpYvE1pEywTeoigeyClFm1dHrS7VakQk9uYac4Sw0suU4MpRGYQPFB6w3HUw-eO5TvaOLabtuSlgdyGRie6Ve0R7kzU76uXDvlhhWGMZ7alNCTdS7txSgUOT8oL9pJP832UsasK4~M~Na0ku1oY-8a7GcvvVv6j7yE0V0COB9OP0FbC8z7eSdZ8r7avFK~f9Wl0SEfS6MkPQR2YwWjr55bbJJhZnZA__&Key-Pair-Id=APKAJVAAMVW6XQYWSTNA";
export const state = {
  socket: null,
  notificationSocket: null,
  notifIsConnecting: false,
  notifKeepAliveTimer: null,
  notifBackoff :1000,
  allContacts: [],
  backoff: 1000,
  keepAliveTimer: null,
  rawItems: [],
  postsStore: [],
  notificationStore: [],
  collapsedState: {},
  currentFilter: "Recent",
  currentFileFilter: "All",
  currentSort: "Latest",
  currentSearchTerm: "",
  debounceTimer: null,
  currentUser: null,
  initialPostsLoaded: false,
  isConnecting: false,
  ignoreNextSocketUpdate: false,
  userRole: "subscriber",
};
export const searchInput = document.getElementById("searchPost");
export const clearIcon = document.querySelector(".clearIcon");
export const searchIcon = document.querySelector(".searchIcon");
export const subscriberContactsForModal = [40, 62];
export const adminContactsForModal = [83];
