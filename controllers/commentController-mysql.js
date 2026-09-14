const Post = require("../models/Post-mysql");
const Comment = require("../models/Comment-mysql");

const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    const { postId } = req.params;

    if (!text || text.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Please provide your comment",
      });
    }

    // 1️⃣ Find blog post
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    // 2️⃣ Create new comment (snapshot username!)
    const newComment = await Comment.addComment({
      postId: parseInt(postId),
      userId: req.user.id,
      username: req.user.username,
      text: text.trim(),
    });

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: newComment,
    });
  } catch (error) {
    next(error);
  }
};

const getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: "Post ID is required.",
      });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Get all comments for this post
    const comments = await Comment.getCommentsByPostId(postId);

    return res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    next(error);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const { postId, commentId } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide updated comment text.',
      });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // 1️⃣ Find the comment
    const comment = await Comment.getCommentById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // 2️⃣ Owner-only check (no admin override)
    const isOwner = comment.userId === req.user.id;

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to update this comment',
      });
    }

    // 3️⃣ Update comment text
    const updatedComment = await Comment.updateComment({
      commentId: parseInt(commentId),
      userId: req.user.id,
      text: text.trim(),
    });

    return res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: updatedComment,
    });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { postId, commentId } = req.params;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // 1️⃣ Find the comment
    const comment = await Comment.getCommentById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // 2️⃣ Check ownership OR admin role
    const isOwner = comment.userId === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to delete this comment',
      });
    }

    // 3️⃣ Delete comment
    await Comment.deleteComment({
      commentId: parseInt(commentId),
      userId: req.user.id,
      isAdmin,
    });

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { addComment, getComments, deleteComment, updateComment };
