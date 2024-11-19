import { PrismaClient } from '@prisma/client';
import { prisma } from "../../";


// const prisma = new PrismaClient();

export class BlogService {
  // Create a blog post with limit check
  public static async createBlog(userId: string, title: string, post: string, image?: string) {
    // Step 1: Check blog creation limit for the week
    const currentDate = new Date();
    const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay())); // Start of the week

    const blogsThisWeek = await prisma.blog.count({
      where: {
        userId,
        createdAt: {
          gte: startOfWeek,
        }
      }
    });

    if (blogsThisWeek >= 5) {
      throw new Error('You can only create 5 blogs per week.');
    }

    // Step 2: Create the blog
    const blog = await prisma.blog.create({
      data: {
        title,
        post,
        image, // URL or local path to the image
        userId,
      },
    });

    return blog;
  }

  // Get previews of all blogs (only a snippet of the post content)
  public static async getBlogPreviews() {
    const blogs = await prisma.blog.findMany({
      select: {
        id: true,
        title: true,
        post: true,
        createdAt: true,
      },
    });

    // Limit the post content to the first 200 characters for preview
    return blogs.map(blog => ({
      ...blog,
      post: blog.post.slice(0, 200) + '...',
    }));
  }

  // Get full blog content
  public static async getFullBlog(id: string) {
    const blog = await prisma.blog.findUnique({
      where: { id },
      include: { comments: true, likes: true }, // Include related data for likes/comments
    });

    if (!blog) {
      throw new Error('Blog not found.');
    }

    return blog;
  }

  // Delete blog (only the user who created the blog can delete it)
  public static async deleteBlog(id: string, userId: string) {
    const blog = await prisma.blog.findUnique({
      where: { id },
    });

    if (!blog) {
      throw new Error('Blog not found.');
    }

    if (blog.userId !== userId) {
      throw new Error('You can only delete your own blogs.');
    }

    await prisma.blog.delete({
      where: { id },
    });

    return { message: 'Blog deleted successfully.' };
  }
}
