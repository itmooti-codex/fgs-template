import {
  subscriberContactsForModal,
  adminContactsForModal,
} from "../config.js";
import { GLOBAL_PAGE_TAG } from "../config.js";

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

export const SUBSCRIBE_FORUM_POSTS = `
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
          { orWhere: { forum_status: "Scheduled" } }
        ]
      }
        { andWhere: { forum_tag: $forum_tag } }
      ]
      orderBy: [{ path: ["published_date"], type: desc }]
    ) {
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
      id
      copy
      forum_status
      unique_id
      depth
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
    }
  }
`;

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
mutation deleteOBookmarkingContactBookmarkedForum {
  deleteOBookmarkingContactBookmarkedForum {
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
mutation deleteOForumReactorReactedtoForum {
  deleteOForumReactorReactedtoForum {
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
export const UPDATE_SCHEDULED_TO_POST=`
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
export const CREATE_NOTIFICATION=`
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
export const GET_NOTIFICATIONS=`
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
          ]
        }
      }
     {
        andWhere: {
          notified_contact_id: $notified_contact_id
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