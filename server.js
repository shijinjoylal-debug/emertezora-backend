import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// CORS
app.use(cors({
  origin: [
    "https://emertezora.xyz",
    "https://www.emertezora.xyz",
    "https://emertezora-backend.onrender.com"
  ]
}));

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Create uploads folder if missing
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop();
    cb(null, Date.now() + "." + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Upload images
app.post("/api/upload", upload.array("images[]", 4), (req, res) => {
  const filePaths = req.files.map(f => `/uploads/${f.filename}`);
  res.json(filePaths);
});

// POSTS JSON FILE
const postsFile = path.join(__dirname, "posts.json");
if (!fs.existsSync(postsFile)) {
  fs.writeFileSync(postsFile, JSON.stringify([]));
}

// Get posts
app.get("/api/posts", (req, res) => {
  const posts = JSON.parse(fs.readFileSync(postsFile));
  res.json(posts);
});

// Create post
app.post("/api/posts", (req, res) => {
  const { text, images } = req.body;

  if (!text) return res.status(400).json({ error: "Text is required" });

  const newPost = {
    id: Date.now(),
    text,
    images: images || [],
    createdAt: new Date().toISOString(),
  };

  const posts = JSON.parse(fs.readFileSync(postsFile));
  posts.unshift(newPost);

  fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));
  res.json(newPost);
});

// Delete
app.delete("/api/posts/:id", (req, res) => {
  const id = req.params.id;
  let posts = JSON.parse(fs.readFileSync(postsFile));

  const index = posts.findIndex(p => p.id == id);
  if (index === -1) return res.status(404).json({ error: "Post not found" });

  posts.splice(index, 1);
  fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));
  res.json({ success: true });
});

app.get("/", (req, res) => res.send("Backend is running!"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
