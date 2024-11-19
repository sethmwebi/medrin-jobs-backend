// const blogWithLikesAndComments = await prisma.blog.findUnique({
//     where: { id: 1 },
//     include: {
//       likes: true,
//       comments: true,
//     },
//   });
  
//   const likesCount = blogWithLikesAndComments.likes.length;
//   const commentsCount = blogWithLikesAndComments.comments.length;

//   const savedBlogs = await prisma.savedBlog.findMany({
//     where: { userId: 1 },
//     include: {
//       blog: true, 
//     },
//   });
  