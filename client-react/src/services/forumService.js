import api from "./authService";

const FORUM_URL = "/forum";

export const createTopicAPI = (data) => api.post(`${FORUM_URL}/topics`, data);

export const updateTopicAPI = (topicId, data) =>
  api.put(`${FORUM_URL}/topics/${topicId}`, data);

export const getTopicAPI = (topicId) =>
  api.get(`${FORUM_URL}/topics/${topicId}`);

export const getTopicsByClassAPI = (classId, params) =>
  api.get(`${FORUM_URL}/classes/${classId}/topics`, { params });

export const getAllTopicsAPI = (params) =>
  api.get(`${FORUM_URL}/topics`, { params });

export const pinTopicAPI = (topicId) =>
  api.patch(`${FORUM_URL}/topics/${topicId}/pin`);

export const unpinTopicAPI = (topicId) =>
  api.patch(`${FORUM_URL}/topics/${topicId}/unpin`);

export const getTopicWithNestedPostsAPI = (topicId) =>
  api.get(`${FORUM_URL}/topics/${topicId}/posts/nested`);

export const deleteTopicAPI = (topicId) =>
  api.delete(`${FORUM_URL}/topics/${topicId}`);

export const createPostAPI = (data) => api.post(`${FORUM_URL}/posts`, data);

export const updatePostAPI = (postId, content) =>
  api.put(`${FORUM_URL}/posts/${postId}`, content, {
    headers: { "Content-Type": "text/plain" },
  });

export const deletePostAPI = (postId) =>
  api.delete(`${FORUM_URL}/posts/${postId}`);

export const getPostsByTopicAPI = (topicId, params) =>
  api.get(`${FORUM_URL}/topics/${topicId}/posts`, { params });

export const likePostAPI = (postId) =>
  api.post(`${FORUM_URL}/posts/${postId}/like`);

export const unlikePostAPI = (postId) =>
  api.delete(`${FORUM_URL}/posts/${postId}/like`);

export const getLikeStatusAPI = (postIds) =>
  api.get(`${FORUM_URL}/posts/like-status`, {
    data: postIds,
    headers: { "Content-Type": "application/json" },
  });

export const createReportAPI = (data) => api.post(`${FORUM_URL}/reports`, data);

export const searchForumAPI = (params) => {
  const queryParams = {
    keyword: params.keyword,
    classId: params.classId,
    searchType: params.searchType,
    authorName: params.authorName,
    pinned: params.pinned,
    page: params.pageable.pageNumber,
    size: params.pageable.pageSize,
    ...(params.pageable.sort && { sort: params.pageable.sort }),
  };

  Object.keys(queryParams).forEach((key) => {
    if (queryParams[key] == null) {
      delete queryParams[key];
    }
  });

  return api.get(`${FORUM_URL}/search`, { params: queryParams });
};
