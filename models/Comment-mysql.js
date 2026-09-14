const { getPool } = require('../config/db-mysql');

class Comment {
  /**
   * Add comment to a post
   */
  static async addComment({ postId, userId, username, text }) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      const query = `
        INSERT INTO comments (postId, userId, username, text)
        VALUES (?, ?, ?, ?)
      `;

      const [result] = await connection.execute(query, [postId, userId, username, text]);

      return {
        id: result.insertId,
        postId,
        userId,
        username,
        text,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Get all comments for a post
   */
  static async getCommentsByPostId(postId) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      const query = `
        SELECT id, postId, userId, username, text, createdAt, updatedAt
        FROM comments
        WHERE postId = ?
        ORDER BY createdAt ASC
      `;

      const [rows] = await connection.execute(query, [postId]);
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Get comment by ID
   */
  static async getCommentById(commentId) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      const query = `
        SELECT id, postId, userId, username, text, createdAt, updatedAt
        FROM comments
        WHERE id = ?
      `;

      const [rows] = await connection.execute(query, [commentId]);
      return rows.length > 0 ? rows[0] : null;
    } finally {
      connection.release();
    }
  }

  /**
   * Update comment (owner only)
   */
  static async updateComment({ commentId, userId, text }) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      // Verify ownership
      const selectQuery = 'SELECT * FROM comments WHERE id = ? AND userId = ?';
      const [rows] = await connection.execute(selectQuery, [commentId, userId]);

      if (rows.length === 0) return null;

      // Update comment
      const updateQuery = 'UPDATE comments SET text = ? WHERE id = ?';
      await connection.execute(updateQuery, [text, commentId]);

      // Return updated comment
      const [updatedRows] = await connection.execute(
        'SELECT id, postId, userId, username, text, createdAt, updatedAt FROM comments WHERE id = ?',
        [commentId]
      );

      return updatedRows[0];
    } finally {
      connection.release();
    }
  }

  /**
   * Delete comment (owner or admin)
   */
  static async deleteComment({ commentId, userId, isAdmin }) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      // Get comment to verify ownership
      const selectQuery = 'SELECT * FROM comments WHERE id = ?';
      const [rows] = await connection.execute(selectQuery, [commentId]);

      if (rows.length === 0) return null;

      const comment = rows[0];

      // Check permissions: owner or admin
      if (comment.userId !== userId && !isAdmin) {
        return null; // Unauthorized
      }

      // Delete comment
      const deleteQuery = 'DELETE FROM comments WHERE id = ?';
      await connection.execute(deleteQuery, [commentId]);

      return comment;
    } finally {
      connection.release();
    }
  }
}

module.exports = Comment;
