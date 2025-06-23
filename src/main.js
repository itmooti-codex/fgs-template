import { state,notificationStore, GLOBAL_AUTHOR_ID, DEFAULT_AVATAR, GLOBAL_PAGE_TAG } from "./config.js";
import { setGlobals } from "./config.js";
import { FETCH_CONTACTS_QUERY, GET_CONTACTS_BY_TAGS, GET__CONTACTS_NOTIFICATION_PREFERENCEE, UPDATE_CONTACT_NOTIFICATION_PREFERENCE } from "./api/queries.js";
import { setupPlyr } from "./utils/plyr.js";
import { fetchGraphQL } from "./api/fetch.js";
import { tribute } from "./utils/tribute.js";
import { initFilePond } from "./utils/filePond.js";
import "./features/uploads/handlers.js";
import { initEmojiHandlers } from "./ui/emoji.js";
import { initRichText } from "./utils/richText.js";
import { initPosts } from "./features/posts/index.js";
import { updateCurrentUserUI } from "./ui/user.js";
import { connect, terminateAndClose, initWebSocketHandlers, setContactIncludedInTag } from "./ws.js";
import { connectNotification, initNotificationEvents } from "./notifications.js";
import { setupCreatePostModal, loadModalContacts, initScheduledPostHandler } from "./domEvents.js";
import { createForumToSubmit } from "./features/posts/actions.js";
import { renderNotificationToggles } from "./ui/notificationPreference.js";
import { toggleAllOff, toggleOption } from "./ui/notificationPreference.js";
import { showToast } from "./ui/toast.js";
import { refreshNotificationSubscription } from "./notifications.js";
import { disableBodyScroll, enableBodyScroll } from "./utils/bodyScroll.js";
export let notificationPreferences = null;

window.createForumToSubmit = createForumToSubmit;
window.toggleAllOff = toggleAllOff;
window.toggleOption = toggleOption;
window.state = state;
window.disableBodyScroll = disableBodyScroll;
window.enableBodyScroll = enableBodyScroll;

export function getNotificationPreferences(contactId) {
  return fetchGraphQL(GET__CONTACTS_NOTIFICATION_PREFERENCEE, { id: contactId })
    .then((res) => {
      const data = res?.data?.getContact;
      if (data) {
        notificationStore.preferences = data;
        renderNotificationToggles(data);
      }
    })
    .catch((err) => {
      console.error("Failed to fetch notification preferences", err);
    });
}
function startApp(tagName, contactId, displayName) {
  terminateAndClose();
  setContactIncludedInTag(false);
  setGlobals(contactId, tagName, displayName);
  const pageTag = GLOBAL_PAGE_TAG;
  let contactTagForQuery = "";
  const contactTag = tagName;
  if (contactTag === pageTag + "_Subscriber" || contactTag === pageTag + "_Admin") {
    contactTagForQuery = tagName;
    const role = contactTag.slice(pageTag.length + 1);
    state.userRole = role.toLowerCase();
  }

  tribute.attach(document.getElementById("post-editor"));
  fetchGraphQL(FETCH_CONTACTS_QUERY)
    .then((res) => {
      const contacts = res.data.calcContacts;
      state.allContacts = contacts.map((c) => c.Contact_ID);
      tribute.collection[0].values = contacts.map((c) => ({
        key: c.Display_Name || "Anonymous",
        value: c.Contact_ID,
        image: c.Profile_Image || DEFAULT_AVATAR,
      }));
      const current = contacts.find((c) => c.Contact_ID === GLOBAL_AUTHOR_ID);
      if (current) {
        state.currentUser = {
          display_name: current.Display_Name || "Anonymous",
          profile_image: current.Profile_Image || DEFAULT_AVATAR,
        };
        updateCurrentUserUI(state);
      }
    })
    .catch((err) => {
      console.error("Failed to fetch contacts", err);
    });
  getNotificationPreferences(contactId);
  initPosts();
  initFilePond();
  initEmojiHandlers();
  initRichText();
  setupCreatePostModal();

  fetchGraphQL(GET_CONTACTS_BY_TAGS, {
    id: GLOBAL_AUTHOR_ID,
    name: contactTagForQuery,
  })
    .then((res) => {
      const result = res?.data?.calcContacts;
      if (Array.isArray(result) && result.length > 0) {
        setContactIncludedInTag(true);
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
    })
    .catch((err) => {
      console.error("Failed to check contact tags", err);
    });
}


async function loadSelectedUserForum(tagName, contactId, displayName, profileImage) {
  if (displayName || profileImage) {
    state.currentUser = {
      display_name: displayName || "Anonymous",
      profile_image: profileImage || DEFAULT_AVATAR,
    };
    updateCurrentUserUI(state);
  }
    startApp(tagName, contactId, displayName);
}

window.loadSelectedUserForum = loadSelectedUserForum;

initWebSocketHandlers();
initNotificationEvents();
initScheduledPostHandler();

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
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day} ${month}, ${year}, ${hours}:${minutes}`;
  }
});
export async function updateNotificationPreferences() {
  const updatePreferenceButton = document.getElementById("updatePreferenceButton");
  updatePreferenceButton.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
  const prefs = notificationStore.preferences;
  const payload = {
    turn_off_all_notifications: prefs.Turn_Off_All_Notifications || false,
    notify_me_of_all_posts: prefs.Notify_me_of_all_Posts || false,
    notify_me_of_comments_replies_on_my_posts_only: prefs.Notify_me_of_comments_replies_on_my_posts_only || false,
    notify_me_when_i_am_mentioned: prefs.Notify_me_when_I_am_Mentioned || false
  };

  const res = await fetchGraphQL(UPDATE_CONTACT_NOTIFICATION_PREFERENCE, {
    id: GLOBAL_AUTHOR_ID,
    payload
  });
  if (res?.data?.updateContact) {
    showToast("Notification preferences updated successfully", "success");
    updatePreferenceButton.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
    refreshNotificationSubscription();
  }
}
window.updateNotificationPreferences = updateNotificationPreferences;
function updateLines() {
  const comments = document.querySelectorAll('.mainComment');
  comments.forEach(comment => {
    const container = comment.closest('.commentContainer');
    const ribbon = container?.querySelector('.ribbonForOpeningReplies');
    if (ribbon && ribbon.classList.contains('ribbonForOpeningReplies')) {
      const commentRect = comment.getBoundingClientRect();
      const ribbonRect = ribbon.getBoundingClientRect();
      const verticalDistance =
        ribbonRect.top + ribbonRect.height / 2 - commentRect.bottom;


      comment.style.setProperty('--line-height', `${verticalDistance}px`);
      comment.classList.add('line-ready');
    }
  });
}

const style = document.createElement('style');
style.textContent = `
    .mainComment.line-ready::after {
        height: var(--line-height);
        width:16px;
        border-left: 1px solid var(--grey-200);
        border-bottom: 1px solid var(--grey-200);
        box-sizing: border-box;
        border-radius: 0 0 0 12px;
    }
`;
document.head.appendChild(style);

// Initial run
updateLines();

// Watch for DOM changes (dynamic rendering)
const observer = new MutationObserver(() => updateLines());
observer.observe(document.body, { childList: true, subtree: true });