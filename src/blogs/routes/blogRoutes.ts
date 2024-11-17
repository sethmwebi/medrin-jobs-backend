import { Router } from 'express';
import { BlogController } from '../controllers/blogController';
import { authenticateUser } from '../middleware/authMiddleware';
import { BlogService } from '../services/blogService'; // Ensure you import BlogService

const router = Router();

// Public Routes
router.get('/blogs', BlogController.getBlogPreviews); // Get all blog previews
router.get('/blogs/:id', authenticateUser, BlogController.getFullBlog); // Get full blog content

// Protected Routes (requires authentication)
router.post('/blogs', authenticateUser, BlogController.createBlog); // Create a blog (authenticated)

// DELETE route for deleting a blog (with authentication)
router.delete('/blogs/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;  // We know userId exists because of the authMiddleware
    const response = await BlogService.deleteBlog(id, userId);

    // If delete operation is successful
    if (response) {
      res.status(200).json({ message: 'Blog deleted successfully' });
    } else {
      res.status(404).json({ message: 'Blog not found or you are not the owner' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting blog', error: error.message });
  }
});

export default router;
