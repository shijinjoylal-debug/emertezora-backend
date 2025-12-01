import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// posts.json storage
const postsFile = path.join(__dirname, "posts.json");

if (!fs.existsSync(postsFile)) {
  fs.writeFileSync(postsFile, JSON.stringify([]));
}

app.get("/api/posts", (req, res) => {
  const posts = JSON.parse(fs.readFileSync(postsFile));
  res.json(posts);
});

app.post("/api/posts", (req, res) => {
  const { text, images } = req.body;

  if (!text) return res.status(400).json({ error: "Text required" });

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

app.delete("/api/posts/:id", (req, res) => {
  const posts = JSON.parse(fs.readFileSync(postsFile));
  const id = req.params.id;
  const index = posts.findIndex(p => p.id == id);

  if (index === -1) return res.status(404).json({ error: "Post not found" });

  posts.splice(index, 1);
  fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));

  res.json({ success: true });
});

app.listen(PORT, () =>
  console.log(`Backend live at https://emertezora-backend.onrender.com`)
);
