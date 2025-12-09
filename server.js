import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { connectDB, gfs, mongoose } from "./config/db.js";
import upload from "./middleware/upload.js";
import Post from "./models/Post.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// CORS
app.use(cors({
  origin: [
    "https://emertezora.xyz",
    "https://www.emertezora.xyz",
    "https://emertezora-backend.onrender.com"
  ]
}));

app.use(express.json());

// Upload images to GridFS
app.post("/api/upload", upload.array("images[]", 4), (req, res) => {
  // Return filenames that can be used to retrieve images later
  const filenames = req.files.map(f => f.filename);
  res.json(filenames);
});

// Retrieve image from GridFS
app.get("/api/image/:filename", async (req, res) => {
  try {
    const file = await gfs.find({ filename: req.params.filename }).toArray();
    if (!file || file.length === 0) {
      return res.status(404).json({ err: "No file exists" });
    }

    // Check if image
    if (file[0].contentType === 'image/jpeg' || file[0].contentType === 'image/png' || file[0].contentType === 'image/gif') {
      const readStream = gfs.openDownloadStreamByName(req.params.filename);
      readStream.pipe(res);
    } else {
      res.status(404).json({ err: 'Not an image' });
    }
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// Get posts
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create post
app.post("/api/posts", async (req, res) => {
  const { text, images } = req.body;

  if (!text) return res.status(400).json({ error: "Text is required" });

  try {
    const newPost = new Post({
      text,
      images: images || [],
    });

    await newPost.save();
    res.json(newPost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete
app.delete("/api/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Optional: Delete associated images from GridFS
    // For now, we will just delete the post reference. 
    // Implementing full cleanup would require iterating post.images and deleting each from GridFS.

    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => res.send("Backend is running!"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
