const { getPool } = require('../config/db-mysql');

class Post {
  /**
   * Create a new post
   */
  static async create({ userId, author, title, content }) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      const query = `
        INSERT INTO posts (userId, author, title, content)
        VALUES (?, ?, ?, ?)
      `;

      const [result] = await connection.execute(query, [userId, author, title, content]);

      return {
        id: result.insertId,
        userId,
        author,
        title,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
        comments: [],
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Find post by ID with all comments
   */
  static async findById(postId) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      const postQuery = 'SELECT * FROM posts WHERE id = ?';
      const [postRows] = await connection.execute(postQuery, [postId]);

      if (postRows.length === 0) return null;

      const post = postRows[0];

      // Fetch comments for this post
      const commentsQuery = `
        SELECT id, postId, userId, username, text, createdAt, updatedAt
        FROM comments
        WHERE postId = ?
        ORDER BY createdAt ASC
      `;
      const [commentRows] = await connection.execute(commentsQuery, [postId]);

      post.comments = commentRows;
      return post;
    } finally {
      connection.release();
    }
  }

  /**
   * Find all posts with pagination
   */
  static async find({}, skip = 0, limit = 10) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      const query = `
        SELECT id, userId, author, title, content, createdAt, updatedAt
        FROM posts
        ORDER BY createdAt DESC
        LIMIT ? OFFSET ?
      `;

      const [rows] = await connection.execute(query, [limit, skip]);

      // Fetch comments for each post
      const postsWithComments = await Promise.all(
        rows.map(async (post) => {
          const commentsQuery = `
            SELECT id, postId, userId, username, text, createdAt, updatedAt
            FROM comments
            WHERE postId = ?
            ORDER BY createdAt ASC
          `;
          const [commentRows] = await connection.execute(commentsQuery, [post.id]);
          post.comments = commentRows;
          return post;
        })
      );

      return postsWithComments;
    } finally {
      connection.release();
    }
  }

  /**
   * Count total documents
   */
  static async countDocuments() {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      const query = 'SELECT COUNT(*) as count FROM posts';
      const [rows] = await connection.execute(query);
      return rows[0].count;
    } finally {
      connection.release();
    }
  }

  /**
   * Update post by ID (owner only, or admin can update any)
   */
  static async findOneAndUpdate(filter, updates) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      // First check if post exists and matches filter
      const selectQuery = 'SELECT * FROM posts WHERE id = ? AND userId = ?';
      const [rows] = await connection.execute(selectQuery, [filter._id, filter.userId]);

      if (rows.length === 0) return null;

      // Build update query
      const updateFields = [];
      const values = [];

      if (updates.title !== undefined) {
        updateFields.push('title = ?');
        values.push(updates.title);
      }

      if (updates.content !== undefined) {
        updateFields.push('content = ?');
        values.push(updates.content);
      }

      if (updateFields.length === 0) {
        return rows[0];
      }

      values.push(filter._id);

      const updateQuery = `UPDATE posts SET ${updateFields.join(', ')} WHERE id = ?`;
      await connection.execute(updateQuery, values);

      // Return updated post
      const [updatedRows] = await connection.execute('SELECT * FROM posts WHERE id = ?', [
        filter._id,
      ]);

      const post = updatedRows[0];
      const [commentRows] = await connection.execute(
        'SELECT * FROM comments WHERE postId = ? ORDER BY createdAt ASC',
        [post.id]
      );
      post.comments = commentRows;

      return post;
    } finally {
      connection.release();
    }
  }

  /**
   * Delete post by ID (owner only, or admin can delete any)
   */
  static async findOneAndDelete(filter) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      // Build WHERE clause based on filter
      let whereClause = 'WHERE id = ?';
      const values = [filter._id];

      if (filter.userId) {
        whereClause += ' AND userId = ?';
        values.push(filter.userId);
      }

      const selectQuery = `SELECT * FROM posts ${whereClause}`;
      const [rows] = await connection.execute(selectQuery, values);

      if (rows.length === 0) return null;

      // Delete the post (comments cascade delete)
      const deleteQuery = `DELETE FROM posts ${whereClause}`;
      await connection.execute(deleteQuery, values);

      return rows[0];
    } finally {
      connection.release();
    }
  }
}

module.exports = Post;
