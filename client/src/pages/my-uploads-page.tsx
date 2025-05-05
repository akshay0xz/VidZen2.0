import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileVideo, User, Loader2, Play, Eye, EyeOff, Trash } from "lucide-react";
import NavigationMenu from "@/components/navigation-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  isHidden?: boolean;
  user?: {
    id: number;
    username: string;
    displayName: string;
  };
}

export default function MyUploadsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

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

  // Toggle video visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const response = await fetch(`/api/videos/${videoId}/visibility`, {
        method: "PATCH",
      });
      if (!response.ok) {
        throw new Error("Failed to update video visibility");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-videos"] });
      toast({
        title: "Video visibility updated",
        description: "The video visibility has been updated successfully.",
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update video visibility",
        description: "There was an error updating the video visibility. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete video");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      
      // If the deleted video was the active video, clear it
      if (activeVideo && myVideos && myVideos.length > 1) {
        const newActiveVideo = myVideos.find(v => v.id !== activeVideo.id) || null;
        setActiveVideo(newActiveVideo);
      } else {
        setActiveVideo(null);
      }
      
      toast({
        title: "Video deleted",
        description: "The video has been deleted successfully.",
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete video",
        description: "There was an error deleting the video. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleVideoClick = (video: Video) => {
    viewMutation.mutate(video.id);
  };

  const handleToggleVisibility = (video: Video) => {
    toggleVisibilityMutation.mutate(video.id);
  };

  const handleDeleteVideo = (videoId: number) => {
    deleteVideoMutation.mutate(videoId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <NavigationMenu />
      <div className="container mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold gradient-heading mb-4">My Uploads</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">Manage your uploaded videos in VidZen</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Sidebar - Videos List */}
          <div className="md:col-span-4 space-y-6">
            <Card className="card-hover border-0 shadow-md overflow-hidden">
              <div className="h-2 gradient-bg w-full"></div>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center mr-2">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  My Videos
                </h2>
                
                {myVideosLoading ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                ) : myVideos && myVideos.length > 0 ? (
                  <ul className="space-y-3">
                    {myVideos.map((video) => (
                      <li 
                        key={video.id} 
                        className={`border border-blue-100 rounded-md overflow-hidden ${video.isHidden ? 'opacity-60' : ''}`}
                      >
                        <div 
                          className="cursor-pointer p-3 hover:bg-blue-50 flex items-center"
                          onClick={() => handleVideoClick(video)}
                        >
                          <div className="w-12 h-12 rounded-md bg-blue-100 flex items-center justify-center">
                            <FileVideo className="w-6 h-6 text-blue-500" />
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <h3 className="font-medium truncate text-gray-800">{video.title}</h3>
                            <div className="flex items-center text-xs text-gray-500">
                              <Eye className="w-3 h-3 mr-1" />
                              <span>{video.views} views</span>
                              {video.isHidden && (
                                <span className="ml-2 text-orange-500 flex items-center">
                                  <EyeOff className="w-3 h-3 mr-1" /> Hidden
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-2 border-t border-blue-100 flex justify-between">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:text-blue-600 h-8 px-2"
                            onClick={() => handleToggleVisibility(video)}
                          >
                            {video.isHidden ? (
                              <>
                                <Eye className="w-4 h-4 mr-1" />
                                <span className="text-xs">Show</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-4 h-4 mr-1" />
                                <span className="text-xs">Hide</span>
                              </>
                            )}
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 h-8 px-2"
                              >
                                <Trash className="w-4 h-4 mr-1" />
                                <span className="text-xs">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete your
                                  video "{video.title}" and remove the data from our servers.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteVideo(video.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-10 bg-blue-50 rounded-lg border border-blue-100">
                    <FileVideo className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                    <p className="text-gray-700 font-medium">No videos uploaded yet</p>
                    <p className="text-gray-500 mt-1">Your uploaded videos will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Right Content - Video Player */}
          <div className="md:col-span-8 space-y-6">
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
                        <span className="font-medium">{activeVideo.user?.displayName || user?.displayName || user?.username}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                          {activeVideo.views} views
                        </div>
                        {activeVideo.isHidden && (
                          <div className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                            Hidden
                          </div>
                        )}
                      </div>
                    </div>
                    {activeVideo.description && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700">{activeVideo.description}</p>
                      </div>
                    )}
                    
                    <div className="mt-6 flex gap-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleToggleVisibility(activeVideo)}
                      >
                        {activeVideo.isHidden ? (
                          <>
                            <Eye className="w-5 h-5 mr-2" />
                            Make Public
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-5 h-5 mr-2" />
                            Hide Video
                          </>
                        )}
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash className="w-5 h-5 mr-2" />
                            Delete Video
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the
                              video "{activeVideo.title}" and remove the data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteVideo(activeVideo.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-96 bg-blue-50 rounded-lg">
                    <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center mb-4">
                      <Play className="h-10 w-10 text-white" />
                    </div>
                    <p className="text-xl font-medium text-gray-700">Select a video to manage</p>
                    <p className="text-gray-500 mt-2">Choose from your uploads in the sidebar</p>
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