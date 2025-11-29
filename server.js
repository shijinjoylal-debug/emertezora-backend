import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: ["https://emertezora.xyz", "https://www.emertezora.xyz"],
}));
app.use(express.json());

// Path to posts.json
const postsFile = path.join(__dirname, "posts.json");

// Ensure posts.json exists
if (!fs.existsSync(postsFile)) {
  fs.writeFileSync(postsFile, JSON.stringify([]));
}

// GET all posts
app.get("/api/posts", (req, res) => {
  const posts = JSON.parse(fs.readFileSync(postsFile));
  res.json(posts);
});

// CREATE new post
app.post("/api/posts", (req, res) => {
  const { text, images } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Text is required" });
  }

  const newPost = {
    id: Date.now(),
    text,
    images: images || [],
    createdAt: new Date().toISOString()
  };

  const posts = JSON.parse(fs.readFileSync(postsFile));
  posts.unshift(newPost);
  fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));

  res.json(newPost);
});

// DELETE post
app.delete("/api/posts/:id", (req, res) => {
  const id = req.params.id;
  let posts = JSON.parse(fs.readFileSync(postsFile));

  const index = posts.findIndex(p => p.id == id);
  if (index === -1) return res.status(404).json({ error: "Post not found" });

  posts.splice(index, 1);
  fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));

  res.json({ success: true });
});

app.get("/", (req, res) => {
  res.send("Backend is running.");
});

app.listen(PORT, () => {
  console.log(`Backend live: https://emertezora-backend.onrender.com`);
});
