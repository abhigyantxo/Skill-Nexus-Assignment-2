const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const Note = require("./models/Note");

const app = express();

app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err.message));

// JWT authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access denied. Token required."
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      message: "Invalid or expired token"
    });
  }
}

// Home
app.get("/", (req, res) => {
  res.send("Skill Nexus Notes API is running!");
});

// Create note
app.post("/notes", authenticateToken, async (req, res) => {
  try {
    const { title, content } = req.body;

    const note = await Note.create({
      title,
      content,
      userId: req.user.userId
    });

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create note",
      error: error.message
    });
  }
});

// Get user's notes
app.get("/notes", authenticateToken, async (req, res) => {
  try {
    const notes = await Note.find({
      userId: req.user.userId
    });

    res.json(notes);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get notes",
      error: error.message
    });
  }
});

// Update note
app.put("/notes/:id", authenticateToken, async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.userId
      },
      req.body,
      { new: true }
    );

    if (!note) {
      return res.status(404).json({
        message: "Note not found"
      });
    }

    res.json(note);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update note",
      error: error.message
    });
  }
});

// Delete note
app.delete("/notes/:id", authenticateToken, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!note) {
      return res.status(404).json({
        message: "Note not found"
      });
    }

    res.json({
      message: "Note deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete note",
      error: error.message
    });
  }
});

// Start server
const PORT = 5003;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});