import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import session from "express-session";
import { v4 as uuidv4 } from "uuid";

const app = express();
const port = 3000;

// PostgreSQL connection
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "lasallian_space",
  password: "luifranz2004",
  port: 5432,
});

db.connect();

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session configuration - creates unique session for each user
app.use(session({
  secret: 'your-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true
  }
}));

// Middleware to assign unique user ID to each visitor
app.use((req, res, next) => {
  if (!req.session.userId) {
    req.session.userId = uuidv4(); // Generate unique ID for this user
  }
  next();
});

// Get all posts with likes and comments count + user's like status
app.get("/", async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const result = await db.query(`
      SELECT 
        p.*,
        COUNT(DISTINCT l.id) as like_count,
        COUNT(DISTINCT c.id) as comment_count,
        EXISTS(
          SELECT 1 FROM likes 
          WHERE post_id = p.id AND user_id = $1
        ) as user_has_liked
      FROM posts p
      LEFT JOIN likes l ON p.id = l.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [userId]);
    
    res.render("index", { posts: result.rows });
  } catch (err) {
    console.error(err);
    res.render("index", { posts: [] });
  }
});

app.get("/addpost", (req, res) => {
  res.render("addpost");
});

// Create new post
app.post('/submit', async (req, res) => {
  const { title, content } = req.body;
  try {
    await db.query(
      `INSERT INTO posts (title, content, author, avatar, post_time) 
       VALUES ($1, $2, $3, $4, 'just now')`,
      [title, content, "Anonymous", "AN"]
    );
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// Toggle like - uses session-based user ID
app.post('/api/posts/:id/like', async (req, res) => {
  const postId = req.params.id;
  const userId = req.session.userId; // Get unique user ID from session
  
  try {
    // Check if user already liked
    const checkLike = await db.query(
      'SELECT id FROM likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );

    if (checkLike.rows.length > 0) {
      // Unlike
      await db.query('DELETE FROM likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
      const countResult = await db.query('SELECT COUNT(*) as count FROM likes WHERE post_id = $1', [postId]);
      res.json({ liked: false, likeCount: parseInt(countResult.rows[0].count) });
    } else {
      // Like
      await db.query('INSERT INTO likes (post_id, user_id) VALUES ($1, $2)', [postId, userId]);
      const countResult = await db.query('SELECT COUNT(*) as count FROM likes WHERE post_id = $1', [postId]);
      res.json({ liked: true, likeCount: parseInt(countResult.rows[0].count) });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get comments for a post
app.get('/api/posts/:id/comments', async (req, res) => {
  const postId = req.params.id;
  try {
    const result = await db.query(
      'SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at DESC',
      [postId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add comment
app.post('/api/posts/:id/comments', async (req, res) => {
  const postId = req.params.id;
  const { content } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO comments (post_id, author, content, avatar) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [postId, "Anonymous", content, "AN"]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});