const Post = require("../models/Post-mysql");

const addPost = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    if (!title || !content || title.trim() === "" || content.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Title and content are required.",
      });
    }

    const newPost = await Post.create({
      userId: req.user.id,
      author: req.user.username,
      title: title.trim(),
      content: content.trim(),
    });

    return res.status(201).json({
      success: true,
      data: newPost,
    });
  } catch (error) {
    next(error);
  }
};

const getPosts = async (req, res, next) => {
  try {
    // pagination query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const posts = await Post.find({}, skip, limit);
    const totalPosts = await Post.countDocuments();

    return res.status(200).json({
      success: true,
      results: posts.length,
      totalPosts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

const getPostById = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { title, content } = req.body;

    if (!title && !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title or content to update.',
      });
    }

    // Only update fields that are provided
    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (content !== undefined) updates.content = content.trim();

    // Owner-only update
    const updatedPost = await Post.findOneAndUpdate(
      { _id: parseInt(postId), userId: req.user.id },
      updates
    );

    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or you are not allowed to update it',
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedPost,
    });
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const filter =
      req.user.role === 'admin'
        ? { _id: parseInt(postId) }
        : { _id: parseInt(postId), userId: req.user.id };

    const deleted = await Post.findOneAndDelete(filter);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message:
          req.user.role === 'admin'
            ? 'Post not found'
            : 'Post not found or you are not allowed to delete it',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
    addPost,
    getPosts,
    getPostById,
    updatePost,
    deletePost
};
