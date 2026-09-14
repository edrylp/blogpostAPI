const mysql = require('mysql2/promise');

let pool;

const connectDB = async () => {
  try {
    // Support both MYSQL_URL and discrete connection parameters
    let config;

    if (process.env.MYSQL_URL) {
      // Parse connection URL: mysql://user:password@host:port/database
      const url = new URL(process.env.MYSQL_URL);
      config = {
        host: url.hostname,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
        port: url.port || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      };
    } else {
      // Fall back to discrete environment variables
      config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'blog_api',
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      };
    }

    pool = mysql.createPool(config);

    // Test the connection
    const connection = await pool.getConnection();
    console.log(`MySQL connected: ${config.host}:${config.port}/${config.database}`);
    connection.release();

    return pool;
  } catch (error) {
    console.error(`MySQL connection error: ${error.message}`);
    process.exit(1);
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call connectDB() first.');
  }
  return pool;
};

module.exports = { connectDB, getPool };
