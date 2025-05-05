import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { otpService } from "./otp-service";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../db";
import { 
  videos, 
  users, 
  comments, 
  likes, 
  insertVideoSchema, 
  insertCommentSchema, 
  insertLikeSchema 
} from "../shared/schema";
import { eq, and, sql, count } from "drizzle-orm";

// Set up multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage for video uploads
const videoStorage = multer.diskStorage({
  destination: function (_req: any, _file: Express.Multer.File, cb: any) {
    // Create videos directory if it doesn't exist
    const videosDir = path.join(uploadDir, "videos");
    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true });
    }
    cb(null, videosDir);
  },
  filename: function (_req: any, file: Express.Multer.File, cb: any) {
    // Generate a unique filename using the current timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `video-${uniqueSuffix}${ext}`);
  },
});

// Set up storage for thumbnails
const thumbnailStorage = multer.diskStorage({
  destination: function (_req: any, _file: Express.Multer.File, cb: any) {
    // Create thumbnails directory if it doesn't exist
    const thumbnailsDir = path.join(uploadDir, "thumbnails");
    if (!fs.existsSync(thumbnailsDir)) {
      fs.mkdirSync(thumbnailsDir, { recursive: true });
    }
    cb(null, thumbnailsDir);
  },
  filename: function (_req: any, file: Express.Multer.File, cb: any) {
    // Generate a unique filename using the current timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `thumbnail-${uniqueSuffix}${ext}`);
  },
});

// Create multer upload instances
const videoUpload = multer({ storage: videoStorage });
const thumbnailUpload = multer({ storage: thumbnailStorage });

// Authentication middleware
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from uploads directory without authentication
  app.use("/uploads", express.static(uploadDir));
  
  // Setup authentication routes
  setupAuth(app);

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });
  
  // Development-only endpoint to get the latest OTP for testing
  app.get("/api/development-get-latest-otp", (_req, res) => {
    const latestOtp = otpService.getLatestOtpForDevelopment();
    res.status(200).json({ otp: latestOtp });
  });

  // Video API routes
  
  // Upload a video
  app.post(
    "/api/videos",
    isAuthenticated,
    videoUpload.single("video"),
    async (req: Request & { file?: Express.Multer.File }, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No video file uploaded" });
        }

        const videoFile = req.file;
        
        // Get video details from the request body
        const { title, description } = req.body;
        
        // Create a new video entry in the database
        const videoData = {
          title,
          description,
          filePath: `/uploads/videos/${videoFile.filename}`,
          thumbnailPath: null, // We'll implement thumbnail generation later
          userId: req.user!.id,
        };
        
        // Validate the video data
        const validatedData = insertVideoSchema.parse(videoData);
        
        // Insert the video into the database
        const [newVideo] = await db.insert(videos).values(validatedData).returning();
        
        res.status(201).json(newVideo);
      } catch (error) {
        console.error("Error uploading video:", error);
        res.status(500).json({ message: "Error uploading video" });
      }
    }
  );

  // Get all videos with optional search
  app.get("/api/videos", isAuthenticated, async (req, res) => {
    try {
      const { search } = req.query;
      
      // Base query
      let query = db.query.videos.findMany({
        with: {
          user: true,
        },
        orderBy: (videosTable: any, { desc }: any) => [desc(videosTable.createdAt)],
      });
      
      // If search parameter is provided, filter by title or description
      if (search && typeof search === 'string' && search.trim() !== '') {
        const searchTerm = search.trim().toLowerCase();
        
        // We need to use a different approach since we can't easily modify the query builder
        // Fetch all videos and filter them manually
        const allVideos = await query;
        
        // Filter videos by title or description containing the search term
        const filteredVideos = allVideos.filter(video => {
          const titleMatch = video.title && video.title.toLowerCase().includes(searchTerm);
          const descMatch = video.description && video.description.toLowerCase().includes(searchTerm);
          const usernameMatch = video.user && video.user.displayName && 
                               video.user.displayName.toLowerCase().includes(searchTerm);
          
          return titleMatch || descMatch || usernameMatch;
        });
        
        return res.status(200).json(filteredVideos);
      }
      
      // If no search parameter or it's empty, return all videos
      const allVideos = await query;
      res.status(200).json(allVideos);
    } catch (error) {
      console.error("Error fetching videos:", error);
      res.status(500).json({ message: "Error fetching videos" });
    }
  });

  // Get a single video by ID
  app.get("/api/videos/:id", isAuthenticated, async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      
      if (isNaN(videoId)) {
        return res.status(400).json({ message: "Invalid video ID" });
      }
      
      const video = await db.query.videos.findFirst({
        where: eq(videos.id, videoId),
        with: {
          user: true,
        },
      });
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      // Update the view count
      await db
        .update(videos)
        .set({ views: video.views + 1 })
        .where(eq(videos.id, videoId))
        .execute();
        
      // Get the updated video
      const updatedVideo = await db.query.videos.findFirst({
        where: eq(videos.id, videoId),
        with: {
          user: true,
        },
      });
      
      res.status(200).json(updatedVideo);
    } catch (error) {
      console.error("Error fetching video:", error);
      res.status(500).json({ message: "Error fetching video" });
    }
  });

  // Get videos uploaded by the current user
  app.get("/api/my-videos", isAuthenticated, async (req, res) => {
    try {
      const userVideos = await db.query.videos.findMany({
        where: eq(videos.userId, req.user!.id),
        with: {
          user: true,
        },
        orderBy: (videosTable: any, { desc }: any) => [desc(videosTable.createdAt)],
      });
      
      res.status(200).json(userVideos);
    } catch (error) {
      console.error("Error fetching user videos:", error);
      res.status(500).json({ message: "Error fetching user videos" });
    }
  });

  // Configure profile picture storage
  const profilePicStorage = multer.diskStorage({
    destination: function (_req: any, _file: Express.Multer.File, cb: any) {
      // Create profile pictures directory if it doesn't exist
      const profileDir = path.join(uploadDir, "profiles");
      if (!fs.existsSync(profileDir)) {
        fs.mkdirSync(profileDir, { recursive: true });
      }
      cb(null, profileDir);
    },
    filename: function (_req: any, file: Express.Multer.File, cb: any) {
      // Generate a unique filename using the current timestamp
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `profile-${uniqueSuffix}${ext}`);
    },
  });

  const profileUpload = multer({ storage: profilePicStorage });

  // Update user profile
  app.post(
    "/api/profile",
    isAuthenticated,
    profileUpload.single("profilePicture"),
    async (req: Request & { file?: Express.Multer.File }, res) => {
      try {
        const userId = req.user!.id;
        const { displayName, bio } = req.body;
        
        // Start with the basic profile updates
        const updateData: any = {
          displayName,
          bio: bio || null,
        };
        
        // If a profile picture was uploaded, add it to the update data
        if (req.file) {
          updateData.profilePicture = `/uploads/profiles/${req.file.filename}`;
        }
        
        // Update the user profile
        const [updatedUser] = await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, userId))
          .returning();
        
        res.status(200).json(updatedUser);
      } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Error updating profile" });
      }
    }
  );

  // Get comments for a video
  app.get("/api/videos/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      
      if (isNaN(videoId)) {
        return res.status(400).json({ message: "Invalid video ID" });
      }
      
      const videoComments = await db.query.comments.findMany({
        where: eq(comments.videoId, videoId),
        with: {
          user: true,
        },
        orderBy: (commentsTable: any, { desc }: any) => [desc(commentsTable.createdAt)],
      });
      
      res.status(200).json(videoComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Error fetching comments" });
    }
  });

  // Add a comment to a video
  app.post("/api/videos/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      
      if (isNaN(videoId)) {
        return res.status(400).json({ message: "Invalid video ID" });
      }
      
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Comment content is required" });
      }
      
      // Check if the video exists
      const video = await db.query.videos.findFirst({
        where: eq(videos.id, videoId),
      });
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      // Create the comment data
      const commentData = {
        content,
        videoId,
        userId: req.user!.id,
      };
      
      // Validate and insert the comment
      const validatedData = insertCommentSchema.parse(commentData);
      const [newComment] = await db.insert(comments).values(validatedData).returning();
      
      // Get the comment with user info
      const commentWithUser = await db.query.comments.findFirst({
        where: eq(comments.id, newComment.id),
        with: {
          user: true,
        },
      });
      
      res.status(201).json(commentWithUser);
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Error adding comment" });
    }
  });

  // Delete a comment
  app.delete("/api/comments/:id", isAuthenticated, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      
      if (isNaN(commentId)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }
      
      // Check if the comment exists and belongs to the user
      const comment = await db.query.comments.findFirst({
        where: eq(comments.id, commentId),
      });
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Check if the user is the author of the comment
      if (comment.userId !== req.user!.id) {
        return res.status(403).json({ message: "You can only delete your own comments" });
      }
      
      // Delete the comment
      await db.delete(comments).where(eq(comments.id, commentId));
      
      res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Error deleting comment" });
    }
  });

  // Like a video
  app.post("/api/videos/:id/like", isAuthenticated, async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      
      if (isNaN(videoId)) {
        return res.status(400).json({ message: "Invalid video ID" });
      }
      
      // Check if the video exists
      const video = await db.query.videos.findFirst({
        where: eq(videos.id, videoId),
      });
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      // Check if the user has already liked the video
      const existingLike = await db.query.likes.findFirst({
        where: and(
          eq(likes.videoId, videoId),
          eq(likes.userId, req.user!.id)
        ),
      });
      
      if (existingLike) {
        return res.status(400).json({ message: "You have already liked this video" });
      }
      
      // Create the like data
      const likeData = {
        videoId,
        userId: req.user!.id,
      };
      
      // Validate and insert the like
      const validatedData = insertLikeSchema.parse(likeData);
      const [newLike] = await db.insert(likes).values(validatedData).returning();
      
      res.status(201).json(newLike);
    } catch (error) {
      console.error("Error liking video:", error);
      res.status(500).json({ message: "Error liking video" });
    }
  });

  // Unlike a video
  app.delete("/api/videos/:id/like", isAuthenticated, async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      
      if (isNaN(videoId)) {
        return res.status(400).json({ message: "Invalid video ID" });
      }
      
      // Check if the like exists
      const existingLike = await db.query.likes.findFirst({
        where: and(
          eq(likes.videoId, videoId),
          eq(likes.userId, req.user!.id)
        ),
      });
      
      if (!existingLike) {
        return res.status(404).json({ message: "You have not liked this video" });
      }
      
      // Delete the like
      await db.delete(likes).where(
        and(
          eq(likes.videoId, videoId),
          eq(likes.userId, req.user!.id)
        )
      );
      
      res.status(200).json({ message: "Video unliked successfully" });
    } catch (error) {
      console.error("Error unliking video:", error);
      res.status(500).json({ message: "Error unliking video" });
    }
  });

  // Get like count for a video
  app.get("/api/videos/:id/likes", isAuthenticated, async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      
      if (isNaN(videoId)) {
        return res.status(400).json({ message: "Invalid video ID" });
      }
      
      // Count the likes for the video
      const result = await db
        .select({ count: count() })
        .from(likes)
        .where(eq(likes.videoId, videoId));
      
      // Check if the current user has liked the video
      const userLike = await db.query.likes.findFirst({
        where: and(
          eq(likes.videoId, videoId),
          eq(likes.userId, req.user!.id)
        ),
      });
      
      res.status(200).json({
        count: result[0]?.count || 0,
        userLiked: !!userLike,
      });
    } catch (error) {
      console.error("Error fetching likes:", error);
      res.status(500).json({ message: "Error fetching likes" });
    }
  });

  // Hide/unhide a video (toggle)
  app.patch("/api/videos/:id/visibility", isAuthenticated, async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      
      if (isNaN(videoId)) {
        return res.status(400).json({ message: "Invalid video ID" });
      }
      
      // Check if the video exists and belongs to the user
      const video = await db.query.videos.findFirst({
        where: eq(videos.id, videoId),
      });
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      if (video.userId !== req.user!.id) {
        return res.status(403).json({ message: "You can only modify your own videos" });
      }
      
      // Toggle the visibility
      const newVisibility = !video.isHidden;
      
      // Update the video
      const [updatedVideo] = await db
        .update(videos)
        .set({ isHidden: newVisibility })
        .where(eq(videos.id, videoId))
        .returning();
      
      res.status(200).json(updatedVideo);
    } catch (error) {
      console.error("Error updating video visibility:", error);
      res.status(500).json({ message: "Error updating video visibility" });
    }
  });

  // Delete a video
  app.delete("/api/videos/:id", isAuthenticated, async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      
      if (isNaN(videoId)) {
        return res.status(400).json({ message: "Invalid video ID" });
      }
      
      // Check if the video exists and belongs to the user
      const video = await db.query.videos.findFirst({
        where: eq(videos.id, videoId),
      });
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      if (video.userId !== req.user!.id) {
        return res.status(403).json({ message: "You can only delete your own videos" });
      }
      
      // Delete related comments and likes first (due to foreign key constraints)
      await db.delete(comments).where(eq(comments.videoId, videoId));
      await db.delete(likes).where(eq(likes.videoId, videoId));
      
      // Delete the video itself
      await db.delete(videos).where(eq(videos.id, videoId));
      
      // Remove the video file
      if (video.filePath) {
        const filePath = path.join(process.cwd(), video.filePath.replace('/uploads', 'uploads'));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      // Remove the thumbnail file if it exists
      if (video.thumbnailPath) {
        const thumbnailPath = path.join(process.cwd(), video.thumbnailPath.replace('/uploads', 'uploads'));
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
        }
      }
      
      res.status(200).json({ message: "Video deleted successfully" });
    } catch (error) {
      console.error("Error deleting video:", error);
      res.status(500).json({ message: "Error deleting video" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
