import { DEFAULT_AVATAR } from "../config.js";

export const tribute = new Tribute({
    collection: [
      {
        trigger: "@",
        menuItemTemplate: (item) =>
          `<div class="mention-item flex items-center gap-4">
           <img src="${item.original.image || DEFAULT_AVATAR}" width="24" height="24" class = "rounded-full"/>
           <span class = "font-light text-sm">${item.string}</span>
         </div>`,
        selectTemplate: (item) =>
          `<span contenteditable="false" class="mention bg-gray-200 px-1 rounded" data-mention-id="${item.original.value}">
           @${item.original.key}
         </span>&nbsp;`,
        values: [],
      },
    ],
  });
