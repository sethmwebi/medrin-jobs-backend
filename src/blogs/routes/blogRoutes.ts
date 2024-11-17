import { Router } from 'express';
import { BlogController } from '../controllers/blogController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

// Public Routes
router.get('/blogs', BlogController.getBlogPreviews); // Get all blog previews
router.get('/blogs/:id', authenticateUser, BlogController.getFullBlog); // Get full blog content

// Protected Routes (requires authentication)
router.post('/blogs', authenticateUser, BlogController.createBlog); // Create a blog (authenticated)
router.delete('/blogs/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const response = await BlogService.deleteBlog(id, userId);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Error deleting blog', error: error.message });
  }
});

export default router;
