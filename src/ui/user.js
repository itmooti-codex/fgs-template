export function updateCurrentUserUI(state) {
  const avatar = document.getElementById("current-user-avatar");
  if (avatar && state?.currentUser?.profile_image) {
    avatar.src = state.currentUser.profile_image;
  }
  const nameEl = document.getElementById("current-user-name");
  if (nameEl && state?.currentUser?.display_name) {
    nameEl.textContent = state.currentUser.display_name;
  }
}
