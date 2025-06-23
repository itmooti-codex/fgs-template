import { safeArray, timeAgo, parseDate } from "../utils/formatter.js";

function parseFileField(val) {
  if (!val) return {};
  let result = val;

  // Keep parsing until it's a proper object
  while (typeof result === "string") {
    try {
      result = JSON.parse(result);
    } catch {
      // If not JSON anymore, return as { link: result }
      return { link: result };
    }
  }

  return result;
}


import { GLOBAL_AUTHOR_ID, DEFAULT_AVATAR, state } from "../config.js";

export function buildTree(existingPosts, rawItems) {
  (function gather(arr) {
    for (const item of arr) {
      if (!state.collapsedState.hasOwnProperty(item.uid)) {
        state.collapsedState[item.uid] = item.isCollapsed;
      }
      gather(item.children || []);
    }
  })(existingPosts);

  const rawById = new Map();
  rawItems.forEach((raw) => {
    rawById.set(raw.id, { ...raw, _children: [] });
  });

  const rawRoots = [];
  rawById.forEach((raw) => {
    if (raw.parent_forum_id && rawById.has(raw.parent_forum_id)) {
      rawById.get(raw.parent_forum_id)._children.push(raw);
    } else {
      rawRoots.push(raw);
    }
  });

  function cloneState(uid, defaultState = true) {
    if (state.collapsedState.hasOwnProperty(uid)) {
      return { isCollapsed: state.collapsedState[uid] };
    }
    state.collapsedState[uid] = defaultState;
    return { isCollapsed: defaultState };
  }

  function convert(rawArr, depth = 0, inheritedDisable = false) {
    const list = [];
    for (const raw of rawArr) {
      const nodeDisable = inheritedDisable || raw.disable_new_comments === true;
      const node = mapItem(raw, depth, nodeDisable);
      const defaultCollapse = depth === 0 ? false : true;
      Object.assign(node, cloneState(node.uid, defaultCollapse));
      node.children = [];
      list.push(node);
      const nextDepth = depth === 0 ? 1 : 2;
      if (raw._children && raw._children.length) {
        if (depth <=1 ) {
          node.children = convert(raw._children, nextDepth, nodeDisable);
        } else {
          list.push(...convert(raw._children, 2, nodeDisable));
        }
      }
    }
    return list;
  }

  return convert(rawRoots);
}

export function mapItem(raw, depth = 0, isDisabled = false) {
  const createdAt = parseDate(raw.published_date || raw.created_at);

  const reactors = safeArray(raw.Forum_Reactors_Data);
  const userReaction = reactors.find(
    (r) => r.Forum_Reactor?.id === GLOBAL_AUTHOR_ID
  );

  const bookmarks = safeArray(raw.Bookmarking_Contacts_Data);
  const userBookmark = bookmarks.find(
    (b) => b.Bookmarking_Contact?.id === GLOBAL_AUTHOR_ID
  );

  const linkData = raw.file_content;
  const parsed =  parseFileField(linkData);
  const fileContent = parsed.link || "";
  const fileName = raw.file_name || parsed.name || "";
  const fileSize = raw.file_size || parsed.size || 0;
  const orientation = raw.image_orientation || "";

  return {
    id: raw.id,
    uid: raw.unique_id,
    authorId: raw.author_id,
    canDelete: raw.author_id === GLOBAL_AUTHOR_ID || state.userRole === "admin",
    isAdmin: state.userRole === "admin",
    depth,
    sheduledDate: raw.published_date || null,
    forumStatus: raw.forum_status,
    forumType:
      raw.forum_type ||
      (depth === 0 ? "Post" : depth === 1 ? "Comment" : "Reply"),
    authorName: raw.Author?.display_name || "Anonymous",
    authorImage: raw.Author?.profile_image || DEFAULT_AVATAR,
    createdAt,
    timeAgo: createdAt ? timeAgo(createdAt) : "",
    content: raw.copy || "",
    upvotes: reactors.length,
    hasUpvoted: Boolean(userReaction),
    voteRecordId: userReaction?.id || null,
    hasBookmarked: Boolean(userBookmark),
    bookmarkRecordId: userBookmark?.id || null,
    children: [],
    isCollapsed: true,
    parentId: raw.parent_forum_id,
    isFeatured: raw.featured_forum === true,
    commentsDisabled: isDisabled,
    fileType: raw.file_type || "None",
    fileContent: depth === 0 ? fileContent : "",
    fileContentName: depth === 0 ? fileName : "",
    fileSize: fileSize,
    imageOrientation: orientation,
    fileContentComment: depth > 0 ? fileContent : null,
    fileContentCommentName: depth > 0 ? fileName : "",
    totalCommentAndReplies: (raw.ForumPosts ? raw.ForumPosts.length : 0) + (raw.ForumPosts?.reduce((sum, item) => sum + (item.ForumPosts?.length || 0), 0) || 0)

  };
}

export function findNode(arr, uid) {
  for (const x of arr) {
    if (x.uid === uid) return x;
    const found = findNode(x.children, uid);
    if (found) return found;
  }
  return null;
}

export const tmplPost = $.templates("#tmpl-post");
export const tmplComment = $.templates("#tmpl-comment");

export function renderItems(items, data) {
  return items
    .map((item) =>
      item.depth === 0
        ? tmplPost.render(item, data)
        : tmplComment.render(item, data)
    )
    .join("");
}
