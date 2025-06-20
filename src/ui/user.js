export function updateCurrentUserUI(state) {
  const avatar = document.getElementById("current-user-avatar");
  const avatarForModal = document.getElementById("current-user-avatar-modal");
  if (avatar && state?.currentUser?.profile_image) {
    avatar.src = state.currentUser.profile_image;
    if (avatarForModal) {
      avatarForModal.src = state.currentUser.profile_image;
    }
  }
  const nameEl = document.getElementById("current-user-name");
  const nameElForModal = document.getElementById("current-user-name-modal");
  if (nameEl && state?.currentUser?.display_name) {
    nameEl.textContent = state.currentUser.display_name;
    if (nameElForModal) {
      nameElForModal.textContent = state.currentUser.display_name;
    }
  }
}
