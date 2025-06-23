import {
  subscriberContactsForModal,
  adminContactsForModal,
  GLOBAL_AUTHOR_ID,
} from "../config.js";
import { GLOBAL_PAGE_TAG } from "../config.js";
import { notificationStore } from "../config.js";

export const FETCH_CONTACTS_QUERY = `
query calcContacts {
  calcContacts(
    query: [
      {
        where: {
          TagsData: [
            {
              where: {
                Tag: [{ where: { name: "${GLOBAL_PAGE_TAG}_Admin" } }]
              }
            }
          ]
        }
      }
      {orWhere: {
          TagsData: [
            {
              where: {
                Tag: [{ where: { name: "${GLOBAL_PAGE_TAG}_Subscriber" } }]
              }
            }
          ]
        }
      }
    ]
  ) {
    Contact_ID: field(arg: ["id"])
    Display_Name: field(arg: ["display_name"])
    Profile_Image: field(arg: ["profile_image"])
  }
}

`;

export const CREATE_FORUM_POST_MUTATION = `
mutation createForumPost($payload: ForumPostCreateInput = null) {
  createForumPost(payload: $payload) {
    id 
    unique_id 
    author_id 
     Author{
      display_name
    }
    published_date
    created_at
    disable_new_comments
    featured_forum
    file_content
    file_type
    file_name
    file_link
    file_size
    image_orientation
    copy
    forum_status
    depth
    forum_type 
    formatted_json 
    parent_forum_id 
    Parent_Forum{
      author_id
    }
    forum_tag
    Mentioned_Contacts_Data{
      mentioned_contact_id
    }
  }
}
`;

export const DELETE_FORUM_POST_MUTATION = `
  mutation deleteForumPost($id: EduflowproForumPostID) {
    deleteForumPost(query: [{ where: { id: $id } }]) {
      id
    }
  }
`;

export const UPDATE_FORUM_POST_MUTATION = `
mutation updateForumPost($id: EduflowproForumPostID, $payload: ForumPostUpdateInput = null) {
  updateForumPost(query: [{ where: { id: $id } }], payload: $payload) {
    featured_forum
    disable_new_comments
  }
}`;

const SUBSCRIBE_FORUM_POSTS_FIELDS = `
      author_id
      Author {
        display_name
        profile_image
      }
      formatted_json
      created_at
      published_date
      disable_new_comments
      featured_forum
      file_content
      file_type
      file_name
      file_link
      file_size
      image_orientation
      id
      copy
      forum_status
      unique_id
      depth
      ForumPosts {
            id
            ForumPosts {
            id
      }
      }
      forum_type
      parent_forum_id
      Bookmarking_Contacts_Data{
        id
        Bookmarking_Contact{
          id
          first_name
          last_name
        }
        bookmarked_forum_id
      }
      Forum_Reactors_Data{
        id
        Forum_Reactor{
          id
          first_name
          last_name
        }
        reacted_to_forum_id
      }
`;

export function SUBSCRIBE_FORUM_POSTS(isAdmin = false) {
  const extraStatusFilter = isAdmin
    ? ""
    : `{ andWhere: { forum_status: \"Published - Not flagged\" } }`;
  const scheduledFilter = isAdmin
    ? '{ orWhere: { forum_status: "Scheduled" } }'
    : "";
  return `
  subscription subscribeToForumPosts($forum_tag: TextScalar) {
    subscribeToForumPosts(
      query: [
             {
        whereGroup: [
          {
            where: {
              forum_status: "Published - Not flagged"
            }
          }
          ${scheduledFilter}
        ]
      }
      ${extraStatusFilter}
        { andWhere: { forum_tag: $forum_tag } }
        { andWhere: { forum_type: "Post" } }
      ]
      orderBy: [{ path: ["published_date"], type: desc }]
    ) {
${SUBSCRIBE_FORUM_POSTS_FIELDS}
    }
  }
`;
}

export const CREATE_BOOKMARK_MUTATION = `
mutation createOBookmarkingContactBookmarkedForum($payload: OBookmarkingContactBookmarkedForumCreateInput = null) {
  createOBookmarkingContactBookmarkedForum(payload: $payload) {
    id
    bookmarked_forum_id
    bookmarking_contact_id
  }
}
`;

export const DELETE_BOOKMARK_MUTATION = `
mutation deleteOBookmarkingContactBookmarkedForum(
  $id: EduflowproOBookmarkingContactBookmarkedForumID
) {
  deleteOBookmarkingContactBookmarkedForum(
    query: [{ where: { id: $id } }]
  ) {
    id
  }
}

`;

export const CREATE_REACTION_MUTATION = `
mutation createOForumReactorReactedtoForum($payload: OForumReactorReactedtoForumCreateInput = null) {
  createOForumReactorReactedtoForum(payload: $payload) {
    id
    forum_reactor_id
    reacted_to_forum_id
  }
}
`;

export const DELETE_REACTION_MUTATION = `
mutation deleteOForumReactorReactedtoForum(
  $id: EduflowproOForumReactorReactedtoForumID
) {
  deleteOForumReactorReactedtoForum(query: [{ where: { id: $id } }]) {
    id
  }
}
`;

export const GET_CONTACTS_BY_TAGS = `
query calcContacts($id: EduflowproContactID, $name: TextScalar) {
  calcContacts(
    query: [
      { where: { id: $id } }
      {
        andWhere: {
          TagsData: [
            { where: { Tag: [{ where: { name: $name } }] } }
          ]
        }
      }
    ]
  ) {
    Contact_ID: field(arg: ["id"])
  }
}
`;

export const GET_SUBSCRIBER_CONTACTS_FOR_MODAL = `
query calcContacts {
  calcContacts(
    query: [
      { whereIn: { id: [${subscriberContactsForModal}], _OPERATOR_: in } }
    ]
  ) {
    Display_Name: field(arg: ["display_name"])
    Profile_Image: field(arg: ["profile_image"])
    TagName: field(arg: ["TagsData", "Tag", "name"])
    Contact_ID: field(arg: ["id"])
  }
}`;

export const GET_ADMIN_CONTACTS_FOR_MODAL = `
query calcContacts {
  calcContacts(
    query: [
      { whereIn: { id: [${adminContactsForModal}], _OPERATOR_: in } }
    ]
  ) {
    Display_Name: field(arg: ["display_name"])
    Profile_Image: field(arg: ["profile_image"])
    TagName: field(arg: ["TagsData", "Tag", "name"])
    Contact_ID: field(arg: ["id"])
  }
}`;

export const UPDATE_SCHEDULED_TO_POST = `
mutation updateForumPost(
  $unique_id: StringScalar_0_8
  $payload: ForumPostUpdateInput = null
) {
  updateForumPost(
    query: [{ where: { unique_id: $unique_id } }]
    payload: $payload
  ) {
    forum_status
  }
}
`;

export const CREATE_NOTIFICATION = `
mutation createAnnouncements(
  $payload: [AnnouncementCreateInput] = null
) {
  createAnnouncements(payload: $payload) {
    parent_forum_id
    notified_contact_id
    parent_forum_if_not_a_post
    notification_type 
    title 
  }
}
`;
export function GET_NOTIFICATIONS() {
  let preferences = notificationStore.preferences;
  let filterForNotifications = '';

  if (preferences?.Notify_me_of_comments_replies_on_my_posts_only) {
    filterForNotifications = `
    {
      andWhere: {
        Notified_Contact: [
          {
            where: {
              notify_me_of_comments_replies_on_my_posts_only: true
            }
          }
        ]
      }
    }
    {
        andWhere: {
          Parent_Forum: [
            {
              whereGroup: [
                { where: { forum_type: "Comment" } }
                { orWhere: { forum_type: "Reply" } }
              ]
            }
          ]
        }
      }
      {
        andWhere: {
          Parent_Forum: [
            {
              where: {
                Parent_Forum: [{ where: { author_id: ${GLOBAL_AUTHOR_ID} } }]
              }
            }
          ]
        }
      }
    `;
  }

  if (preferences?.Notify_me_when_I_am_Mentioned) {
    filterForNotifications = `
    {
      andWhere: {
        Notified_Contact: [
          {
            where: { notify_me_when_i_am_mentioned: true }
          }
        ]
      }
    }
    {
      andWhere: {
        Parent_Forum: [
          {
            where: {
              Mentioned_Contacts_Data: [{ where: { mentioned_contact_id: ${GLOBAL_AUTHOR_ID} } }]
            }
          }
        ]
      }
    }
    `;
  }

  return `
  subscription subscribeToAnnouncements(
    $author_id: EduflowproContactID 
    $notified_contact_id: EduflowproContactID 
  ) {
    subscribeToAnnouncements(
      query: [
        {
          where: {
            Parent_Forum: [
              {
                where: {
                  author_id: $author_id
                  _OPERATOR_: neq
                }
              }
             {
              andWhere: {
                forum_status: "Published - Not flagged"
              }
            }
            ]
          }
        }
        ${filterForNotifications}
        {
          andWhere: {
            notified_contact_id: $notified_contact_id
          }
        }
        {
        andWhere: {
          Notified_Contact: [
            {
              whereGroup: [
                {
                  where: {
                    turn_off_all_notifications: false
                  }
                }
                {
                  andWhereGroup: [
                    {
                      where: {
                        notify_me_of_all_posts: true
                      }
                    }
                    {
                      orWhere: {
                        notify_me_of_all_comments_replies_on_posts: true
                      }
                    }
                    {
                      orWhere: {
                        notify_me_when_i_am_mentioned: true
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
      ]
      orderBy: [
        {
          path: ["Parent_Forum", "published_date"]
          type: desc
        }
      ]
    ) {
      ID: id
      Is_Read: is_read
      Title: title
      Parent_Forum_If_Not_A_Post: parent_forum_if_not_a_post
      Notification_Type: notification_type
      Parent_Forum_ID: parent_forum_id
      Notified_Contact_ID: notified_contact_id
      Parent_Forum {
        copy 
        published_date
      }
    }
  }
  `;
}

export const GET__CONTACTS_NOTIFICATION_PREFERENCEE = `
query getContact($id: EduflowproContactID) {
  getContact(query: [{ where: { id: $id } }]) {
    Turn_Off_All_Notifications: turn_off_all_notifications
    Notify_me_of_all_Posts: notify_me_of_all_posts
    Notify_me_of_comments_replies_on_my_posts_only: notify_me_of_comments_replies_on_my_posts_only
    Notify_me_when_I_am_Mentioned: notify_me_when_i_am_mentioned
  }
}
`;
export const UPDATE_CONTACT_NOTIFICATION_PREFERENCE = `
mutation updateContact(
  $id: EduflowproContactID
  $payload: ContactUpdateInput = null
) {
  updateContact(
    query: [{ where: { id: $id } }]
    payload: $payload
  ) {
    Turn_Off_All_Notifications: turn_off_all_notifications
    Notify_me_of_all_Posts: notify_me_of_all_posts
    Notify_me_of_comments_replies_on_my_posts_only: notify_me_of_comments_replies_on_my_posts_only
    Notify_me_when_I_am_Mentioned: notify_me_when_i_am_mentioned
  }
}
`;
export const GET_SINGLE_POST_SUBSCRIPTION = `
subscription subscribeToForumPost(
  $id: EduflowproForumPostID
) {
  subscribeToForumPost(
    query: [{ where: { id: $id } }]
    orderBy: [{ path: ["published_date"], type: desc }]
  ) {
    Author_ID: author_id
    Formatted_Json: formatted_json
    Date_Added: created_at
    Published_Date: published_date
    Disable_New_Comments: disable_new_comments
    Featured_Forum: featured_forum
    File_Content: file_content
    File_Type: file_type
    file_name
    file_link
    file_size
    image_orientation
    ID: id
    Copy: copy
    Forum_Status: forum_status
    Unique_ID: unique_id
    Depth: depth
    Forum_Type: forum_type
    Parent_Forum_ID: parent_forum_id
    Author {
      display_name
      profile_image
    }
    Bookmarking_Contacts_Data {
      id
      bookmarked_forum_id
      Bookmarking_Contact {
        id
        first_name
        last_name
      }
    }
    Forum_Reactors_Data {
      id
      reacted_to_forum_id
      Forum_Reactor {
        id
        first_name
        last_name
      }
    }
    ForumPosts {
      Author_ID: author_id
      Formatted_Json: formatted_json
      Date_Added: created_at
      Published_Date: published_date
      Disable_New_Comments: disable_new_comments
      Featured_Forum: featured_forum
      File_Content: file_content
      File_Type: file_type
      file_name
      file_link
      file_size
      image_orientation
      ID: id
      Copy: copy
      Forum_Status: forum_status
      Unique_ID: unique_id
      Depth: depth
      Forum_Type: forum_type
      Parent_Forum_ID: parent_forum_id
      Author {
        display_name
        profile_image
      }
      Bookmarking_Contacts_Data {
        id
        bookmarked_forum_id
        Bookmarking_Contact {
          id
          first_name
          last_name
        }
      }
      Forum_Reactors_Data {
        id
        reacted_to_forum_id
        Forum_Reactor {
          id
          first_name
          last_name
        }
      }
      ForumPosts {
        Author_ID: author_id
        Formatted_Json: formatted_json
        Date_Added: created_at
        Published_Date: published_date
        Disable_New_Comments: disable_new_comments
        Featured_Forum: featured_forum
        File_Content: file_content
        File_Type: file_type
        file_name
        file_link
        file_size
        image_orientation
        ID: id
        Copy: copy
        Forum_Status: forum_status
        Unique_ID: unique_id
        Depth: depth
        Forum_Type: forum_type
        Parent_Forum_ID: parent_forum_id
        Author {
          display_name
          profile_image
        }
        Bookmarking_Contacts_Data {
          id
          bookmarked_forum_id
          Bookmarking_Contact {
            id
            first_name
            last_name
          }
        }
        Forum_Reactors_Data {
          id
          reacted_to_forum_id
          Forum_Reactor {
            id
            first_name
            last_name
          }
        }
      }
    }
  }
}

`;