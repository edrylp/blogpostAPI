const bcrypt = require('bcrypt');
const { getPool } = require('../config/db-mysql');

class User {
  /**
   * Create a new user with hashed password
   */
  static async create({ username, email, password }) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const query = `
        INSERT INTO users (username, email, password, role)
        VALUES (?, ?, ?, 'user')
      `;

      const [result] = await connection.execute(query, [username, email, hashedPassword]);

      return {
        id: result.insertId,
        username,
        email,
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Find user by email (with password for login)
   */
  static async findOne(filter) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      let query = 'SELECT * FROM users WHERE ';
      const values = [];

      if (filter.email) {
        query += 'email = ?';
        values.push(filter.email);
      } else if (filter.id) {
        query += 'id = ?';
        values.push(filter.id);
      }

      const [rows] = await connection.execute(query, values);
      return rows.length > 0 ? rows[0] : null;
    } finally {
      connection.release();
    }
  }

  /**
   * Find user by ID (excludes password by default)
   */
  static async findById(id) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      const query = 'SELECT id, username, email, role, createdAt, updatedAt FROM users WHERE id = ?';
      const [rows] = await connection.execute(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } finally {
      connection.release();
    }
  }

  /**
   * Instance method to verify password
   */
  static async matchPassword(user, password) {
    return bcrypt.compare(password, user.password);
  }

  /**
   * Check if password was changed after JWT issued (iat)
   */
  static changedPasswordAfter(user, iat) {
    if (!user.passwordChangedAt) return false;
    const changedTimestamp = Math.floor(new Date(user.passwordChangedAt).getTime() / 1000);
    return iat < changedTimestamp;
  }

  /**
   * Update user password and set passwordChangedAt
   */
  static async updatePassword(id, newPassword) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const query = `
        UPDATE users 
        SET password = ?, passwordChangedAt = NOW()
        WHERE id = ?
      `;

      await connection.execute(query, [hashedPassword, id]);
      return true;
    } finally {
      connection.release();
    }
  }
}

module.exports = User;
