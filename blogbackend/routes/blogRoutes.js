const express = require('express');
const BlogPost = require('../BlogPost');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Setup multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // Save files to 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));  // Append timestamp to file
  }
});

const upload = multer({ storage });

// Create a new blog post
router.post('/create', upload.single('image'), async (req, res) => {
  try {
    const { title, content, author } = req.body;
    const newPost = new BlogPost({
      title,
      content,
      author,
      image: req.file ? req.file.filename : null  // Save the filename
    });
    
    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Serve static files for image uploads
router.use('/uploads', express.static('uploads'));

// Get all blog posts
router.get('/posts', async (req, res) => {
  try {
    const posts = await BlogPost.find();
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single blog post by ID
router.get('/posts/:id', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.status(200).json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a blog post by ID with image handling
router.put('/posts/:id', upload.single('image'), async (req, res) => {
  try {
    const { title, content, author } = req.body;
    const post = await BlogPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // If a new image is uploaded, delete the old image file
    if (req.file) {
      const oldImagePath = path.join(__dirname, '../uploads', post.image);
      if (post.image && fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath); // Delete old image
      }
      post.image = req.file.filename; // Update with new image file name
    }

    // Update post details
    post.title = title;
    post.content = content;
    post.author = author;

    await post.save();
    res.status(200).json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a blog post by ID
router.delete('/posts/:id', async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // If the post has an image, delete it from the file system
    if (post.image) {
      const imagePath = path.join(__dirname, '../uploads', post.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath); // Delete image from server
      }
    }

    res.status(200).json({ message: 'Post and image deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
