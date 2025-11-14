/**
 * @module ProfileAction
 *
 * This module defines actions to manage user profile data.
 */
import ApiError from "../exceptions/api.error.js";
import PlatformAction from "../actions/platform.action.js";
import PostModel from "../models/post.model.js";
import LikeModel from "../models/like.model.js";
import CommentModel from "../models/comment.model.js";

import { get } from "mongoose";

/**
 * @method managePost
 * Updates both the account and profile data of a user.
 *
 * @param {string} identity - The user ID.
 * @param {object} payload - The new profile details.
 */
const getPosts = async (userId) => {
    const query = { user: userId, isDeletedAt: null, postStatus: "PUBLISHED" };
  
    // Fetch posts and total count
    const [posts, totalPosts] = await Promise.all([
      PostModel.find(query).sort({ featured: -1, createdAt: -1 }).exec(),
      PostModel.countDocuments(query).exec()
    ]);
    return { totalPosts,posts };
  };
  
  const getAllPosts = async () => {
    const query = { isDeletedAt: null, postStatus: "PUBLISHED" };
    const posts = await PostModel.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: 'user',
        select: 'displayName photo'
      })
      .exec();
    return posts;
  };
  
  const createPost = async (userId, payload) => {
    const province = await PlatformAction.getProvinceByCode(payload.provinceCode);
    if (!province) {
      throw new ApiError({ message: "Invalid state code provided.", code: "BAD_REQUEST", errors: { provinceCode: payload.provinceCode } });
    }
  
    const post = await PostModel.create({
      user: userId,
      postType: payload.postType, // Set the post type (e.g., 'text', 'image', 'video')
      caption: payload.caption, // Optional caption
      hashtags: payload.hashtags, // Optional hashtags
      postStatus: payload.postStatus, // Default to 'DRAFT' if not provided
      postStatusNote: payload.postStatusNote, // Optional status note
      media: payload.media, // Optional media array
      provinceCode: payload.provinceCode, // Optional province code
      countryCode: payload.countryCode, // Optional country code
      city: payload.city,
      timezone: payload.timezone
    });
    return post;
  };
  
  const putPosts = async (userId, postId, payload) => {
    console.log("payload",payload);
    console.log("postId",postId);
    console.log("userId",userId);
    const post = await PostModel.findOneAndUpdate(
      { user: userId, _id: postId },
      {
        content: payload.content,
        caption: payload.caption, // Allow updating caption
        hashtags: payload.hashtags, // Allow updating hashtags
        media: payload.media, // Allow updating media
        postStatus: payload.postStatus, // Allow updating post status
        postStatusNote: payload.postStatusNote // Allow updating status note
      },
      { new: true }
    ).exec();
    if (!post) {
      throw new ApiError({ message: "Post not found or you do not have permission to update this post.", code: "BAD_REQUEST" });
    }
    return post;
  };
  
  const deletePosts = async (userId, postId) => {
    const post = await PostModel.findOneAndUpdate(
      { user: userId, _id: postId }, // Match the post by user and post ID
      { $set: { isDeletedAt: Date.now() ,
      deletedBy: userId
      } }, // Set the isDeletedAt field to the current date
      { new: true } // Return the updated document
    ).exec();
    if (!post) {
      throw new Error("Post not found or you do not have permission to delete this post.");
    }
    return post;
  };
  
  const likePost = async (userId, postId) => {
    // Check if the post exists
    const post = await PostModel.findById(postId).exec();
    if (!post) {
      throw new ApiError({ message: "Post not found.", code: "BAD_REQUEST" });
    }
  
    // Check if the user has already liked the post
    const existingLike = await LikeModel.findOne({ user: userId, post: postId }).exec();
    if (existingLike) {
      throw new ApiError({ message: "You have already liked this post.", code: "BAD_REQUEST" });
    }
  
    // Create a new like
    const like = await LikeModel.create({ user: userId, post: postId });
  
    // Increment the likes count on the post
    post.likesCount += 1;
    await post.save();
  
    return like;
  };
  
  const unlikePost = async (userId, postId) => {
    // Check if the post exists
    const post = await PostModel.findById(postId).exec();
    if (!post) {
      throw new ApiError({ message: "Post not found.", code: "BAD_REQUEST" });
    }
  
    // Check if the user has liked the post
    const existingLike = await LikeModel.findOne({ user: userId, post: postId }).exec();
    if (!existingLike) {
      throw new ApiError({ message: "You have not liked this post.", code: "BAD_REQUEST" });
    }
  
    // Delete the like
    await LikeModel.deleteOne({ user: userId, post: postId }).exec();
  
    // Decrement the likes count on the post
    post.likesCount -= 1;
    await post.save();
  
    return existingLike;
  };
  
  const createComment = async (userId, postId, content, parentComment = null) => {
    const comment = await CommentModel.create({
      user: userId,
      post: postId,
      content,
      parentComment
    });
    return comment;
  };
  
  const updateComment = async (userId, commentId, content) => {
    const comment = await CommentModel.findOneAndUpdate(
      { user: userId, _id: commentId },
      { content },
      { new: true }
    ).exec();
    if (!comment) {
      throw new ApiError({ message: "Comment not found or you do not have permission to update this comment.", code: "BAD_REQUEST" });
    }
    return comment;
  };
  
  const deleteComment = async (userId, commentId) => {
    const comment = await CommentModel.findOneAndDelete({ user: userId, _id: commentId }).exec();
    if (!comment) {
      throw new ApiError({ message: "Comment not found or you do not have permission to delete this comment.", code: "BAD_REQUEST" });
    }
    return comment;
  };
  
  const getComments = async (postId) => {
    const comments = await CommentModel.find({ post: postId, parentComment: null }).populate('user').exec();
    return comments;
  };
  
  const getReplies = async (commentId) => {
    const replies = await CommentModel.find({ parentComment: commentId }).populate('user').exec();
    return replies;
  };
  
  const likeComment = async (userId, commentId ,postId) => {
    // Check if the comment exists
    const comment = await CommentModel.findById(commentId).exec();
    if (!comment) {
      throw new ApiError({ message: "Comment not found.", code: "BAD_REQUEST" });
    }
  
    // Check if the user has already liked the comment
    const existingLike = await LikeModel.findOne({ user: userId, comment: commentId }).exec();
    if (existingLike) {
      throw new ApiError({ message: "You have already liked this comment.", code: "BAD_REQUEST" });
    }
  
    // Create a new like
    const like = await LikeModel.create({ user: userId, comment: commentId , post: postId });
  
    // Increment the likes count on the comment
    comment.likesCount += 1;
    await comment.save();
  
    return like;
  };
  
  const unlikeComment = async (userId, commentId) => {
    // Check if the comment exists
    const comment = await CommentModel.findById(commentId).exec();
    if (!comment) {
      throw new ApiError({ message: "Comment not found.", code: "BAD_REQUEST" });
    }
  
    // Check if the user has liked the comment
    const existingLike = await LikeModel.findOne({ user: userId, comment: commentId }).exec();
    if (!existingLike) {
      throw new ApiError({ message: "You have not liked this comment.", code: "BAD_REQUEST" });
    }
  
    // Delete the like
    await LikeModel.deleteOne({ user: userId, comment: commentId }).exec();
  
    // Decrement the likes count on the comment
    comment.likesCount -= 1;
    await comment.save();
  
    return existingLike;
  };
  
  const PostAction = {
   
    getPosts,
    getAllPosts,
    createPost,
    putPosts,
    deletePosts,
    likePost,
    unlikePost,
    createComment,
    updateComment,
    deleteComment,
    getComments,
    getReplies,
    likeComment,
    unlikeComment
  }
  export default PostAction;