API_URL="https://emertezora.xyz/econnection.html"
import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// ✅ Middleware setup
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Serve frontend file (adjust if your HTML filename changes)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "https://emertezora.xyz/econnection.html"));
});

// ✅ Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("🗂️  Created uploads directory");
}

// ✅ Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ✅ posts.json file path
const postsFile = path.join(__dirname, "posts.json");

// ✅ Initialize posts.json if not found or invalid
if (!fs.existsSync(postsFile)) {
  fs.writeFileSync(postsFile, JSON.stringify([]));
}
try {
  JSON.parse(fs.readFileSync(postsFile));
} catch (err) {
  console.error("⚠️ posts.json was corrupted, resetting...");
  fs.writeFileSync(postsFile, JSON.stringify([]));
}

// ✅ Handle post submission
app.post("/api/posts", upload.array("images", 4), (req, res) => {
  const text = req.body.text?.trim();
  if (!text) return res.status(400).json({ error: "Text is required" });

  const images = req.files?.map(f => `/uploads/${f.filename}`) || [];
  const newPost = { id: Date.now(), text, images, createdAt: new Date().toISOString() };

  const posts = JSON.parse(fs.readFileSync(postsFile));
  posts.unshift(newPost);
  fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));

  res.json(newPost);
});

// ✅ Get all posts
app.get("/api/posts", (req, res) => {
  const posts = JSON.parse(fs.readFileSync(postsFile));
  res.json(posts);
});
// ✅ Delete a post by ID
app.delete("/api/posts/:id", (req, res) => {
  const { id } = req.params;
  const posts = JSON.parse(fs.readFileSync(postsFile));

  const index = posts.findIndex(p => p.id == id);
  if (index === -1) return res.status(404).json({ error: "Post not found" });

  // Remove post and its images from uploads
  const deleted = posts.splice(index, 1)[0];
  fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));

  // Delete image files if they exist
  deleted.images.forEach(imgPath => {
    const filePath = path.join(__dirname, imgPath.replace("/uploads/", "uploads/"));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });

  res.json({ success: true, message: "Post deleted" });
});


// ✅ Start the server
app.listen(PORT, () => console.log(`🚀 Server running at https://emertezora-backend.onrender.com:${PORT}`));
