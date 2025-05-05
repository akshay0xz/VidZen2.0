import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileVideo, Upload, Play, User, Loader2 } from "lucide-react";
import NavigationMenu from "@/components/navigation-menu";
import VideoLikeButton from "@/components/video-like-button";
import VideoComments from "@/components/video-comments";

// Define the Video interface based on the schema in shared/schema.ts
interface Video {
  id: number;
  title: string;
  description?: string;
  filePath: string;
  thumbnailPath?: string;
  userId: number;
  views: number;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    displayName: string;
  };
}

export default function VideosPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch all videos with optional search term
  const { data: videos, isLoading: videosLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos", searchTerm],
    queryFn: async () => {
      const url = searchTerm 
        ? `/api/videos?search=${encodeURIComponent(searchTerm)}` 
        : "/api/videos";
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch videos");
      }
      return res.json();
    },
  });
  
  // Effect to automatically select the first video if none is selected
  useEffect(() => {
    if (videos && videos.length > 0 && !activeVideo) {
      handleVideoClick(videos[0]);
    }
  }, [videos]);

  // Fetch user's uploaded videos
  const { data: myVideos, isLoading: myVideosLoading } = useQuery<Video[]>({
    queryKey: ["/api/my-videos"],
    queryFn: async () => {
      const res = await fetch("/api/my-videos");
      if (!res.ok) {
        throw new Error("Failed to fetch my videos");
      }
      return res.json();
    },
  });

  // Video upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/videos", {
        method: "POST",
        body: formData,
        // Don't set Content-Type here, it will be set automatically for FormData
      });
      if (!response.ok) {
        throw new Error("Failed to upload video");
      }
      return response.json();
    },
    onSuccess: () => {
      // Reset form
      setTitle("");
      setDescription("");
      setVideoFile(null);
      
      // Invalidate videos queries to refresh the lists
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-videos"] });
      
      toast({
        title: "Video uploaded successfully",
        description: "Your video has been uploaded and is now available for viewing.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to upload video",
        description: error.message || "There was an error uploading your video. Please try again.",
        variant: "destructive",
      });
    },
  });

  // View video mutation (to increment view count)
  const viewMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const response = await fetch(`/api/videos/${videoId}`);
      if (!response.ok) {
        throw new Error("Failed to load video");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setActiveVideo(data);
    },
    onError: () => {
      toast({
        title: "Failed to load video",
        description: "There was an error loading the video. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!videoFile) {
      toast({
        title: "No video selected",
        description: "Please select a video file to upload.",
        variant: "destructive",
      });
      return;
    }
    
    if (!title) {
      toast({
        title: "Title is required",
        description: "Please provide a title for your video.",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append("video", videoFile);
    formData.append("title", title);
    
    if (description) {
      formData.append("description", description);
    }
    
    uploadMutation.mutate(formData);
  };

  const handleVideoClick = (video: Video) => {
    viewMutation.mutate(video.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <NavigationMenu />
      <div className="container mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold gradient-heading mb-4">VidZen</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">Upload, share, and watch videos with friends and family</p>
        </header>
        
        <div className="grid grid-cols-1 gap-8">
          {/* Main Content - Video Player */}
          <div className="space-y-8">
            <Card className="card-hover border-0 shadow-md overflow-hidden">
              <div className="h-2 gradient-bg w-full"></div>
              <CardContent className="p-6">
                {activeVideo ? (
                  <div>
                    <div className="bg-black rounded-lg aspect-video overflow-hidden mb-4 shadow-lg">
                      <video
                        controls
                        className="w-full h-full"
                        src={activeVideo.filePath}
                        autoPlay
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    <h2 className="text-2xl font-bold mb-2 gradient-heading">{activeVideo.title}</h2>
                    <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center mr-2">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-medium">{activeVideo.user?.displayName || "Unknown User"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                          {activeVideo.views} views
                        </div>
                        <VideoLikeButton videoId={activeVideo.id} />
                      </div>
                    </div>
                    {activeVideo.description && (
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <p className="text-gray-700">{activeVideo.description}</p>
                      </div>
                    )}
                    
                    <VideoComments videoId={activeVideo.id} />
                  </div>
                ) : videos && videos.length > 0 ? (
                  // Loading placeholder while auto-selection happens via useEffect
                  <div className="flex flex-col items-center justify-center h-96 bg-blue-50 rounded-lg">
                    <Loader2 className="w-16 h-16 animate-spin text-blue-300 mb-4" />
                    <p className="text-gray-700 font-medium">Loading video...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-96 bg-blue-50 rounded-lg">
                    <FileVideo className="w-16 h-16 text-blue-300 mb-4" />
                    <p className="text-gray-700 font-medium">No videos available</p>
                    <p className="text-gray-500 mt-1">Upload your first video to get started!</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Video Listings */}
            <Card className="card-hover border-0 shadow-md overflow-hidden">
              <div className="h-2 gradient-bg w-full"></div>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                  <h2 className="text-xl font-semibold flex items-center">
                    <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center mr-2">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                    Latest Videos
                  </h2>
                  
                  {/* Search Bar */}
                  <div className="relative w-full md:w-64">
                    <Input
                      type="text"
                      placeholder="Search videos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white border-blue-200"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </div>
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setSearchTerm("")}
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </Button>
                    )}
                  </div>
                </div>
                {videosLoading ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                ) : videos && videos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {videos.map((video) => (
                      <div 
                        key={video.id} 
                        className="video-card cursor-pointer"
                        onClick={() => handleVideoClick(video)}
                      >
                        <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center relative group">
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100">
                              <Play className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          <h3 className="font-medium truncate text-gray-800">{video.title}</h3>
                          <div className="flex justify-between text-xs mt-2">
                            <span className="text-blue-600 font-medium">{video.user?.displayName}</span>
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{video.views} views</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-blue-50 rounded-lg border border-blue-100">
                    <FileVideo className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                    <p className="text-gray-700 font-medium">No videos available yet</p>
                    <p className="text-gray-500 mt-1">Be the first to upload a video!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}