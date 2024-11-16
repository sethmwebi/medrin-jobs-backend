import { Request, Response } from 'express';
import { BlogService } from '../services/blogService';

export class BlogController {
  // Handle blog creation
  public static async createBlog(req: Request, res: Response): Promise<void> {
    try {
      const { title, post, image } = req.body;
      const userId = req.userId!;

      const blog = await BlogService.createBlog(userId, title, post, image);
      res.status(201).json(blog);
    } catch (error) {
      res.status(500).json({ message: 'Error creating blog', error: error.message });
    }
  }

  // Get all blog previews (short snippet of blog content for non-authenticated users)
  public static async getBlogPreviews(req: Request, res: Response): Promise<void> {
    try {
      const blogs = await BlogService.getBlogPreviews();
      res.status(200).json(blogs);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching blogs', error: error.message });
    }
  }

  // Get full blog content (Only for authenticated users)
  public static async getFullBlog(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const blog = await BlogService.getFullBlog(id);
      res.status(200).json(blog);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching blog', error: error.message });
    }
  }
}
