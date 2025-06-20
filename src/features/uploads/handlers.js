export let pendingFile = null;
export let fileTypeCheck = "";

export function setPendingFile(file) {
  pendingFile = file;
}

export function setFileTypeCheck(type) {
  fileTypeCheck = type;
}
$(document).on("change", ".file-input, #file-input", function (e) {
  pendingFile = e.target.files[0] || null;
  if (pendingFile) {
    const type = pendingFile.type;
    if (type.startsWith("audio/")) {
      fileTypeCheck = "Audio";
    } else if (type.startsWith("video/")) {
      fileTypeCheck = "Video";
    } else if (type.startsWith("image/")) {
      fileTypeCheck = "Image";
    }else{
      fileTypeCheck = "File";
    }
  }
});

