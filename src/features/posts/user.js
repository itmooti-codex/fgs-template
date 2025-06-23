import { fetchGraphQL } from "../../api/fetch.js";
import { FETCH_CONTACTS_QUERY } from "../../api/queries.js";
import {
  state,
  GLOBAL_AUTHOR_ID,
  DEFAULT_AVATAR,
} from "../../config.js";
import { updateCurrentUserUI } from "../../ui/user.js";

export async function ensureCurrentUser() {
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
