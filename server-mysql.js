require("dotenv").config();

const express = require('express');
const cors = require("cors");
const { connectDB } = require('./config/db-mysql');
const errorHandler = require('./middleware/errorHandler');

const userRoutes = require('./routes/userRoutes-mysql');
const postRoutes = require('./routes/postRoutes-mysql');

const app = express();
const PORT = process.env.PORT || 4000;

// Connect to Database
connectDB();

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    process.env.CLIENT_URL,
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get("/", (req, res) => {
  res.status(200).json({ message: "API is working (MySQL)" });
});

// Routes
app.use("/users", userRoutes);
app.use("/posts", postRoutes);

// Error handler 
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API is now online on port ${PORT} (MySQL)`);
  });
}

module.exports = { app };
