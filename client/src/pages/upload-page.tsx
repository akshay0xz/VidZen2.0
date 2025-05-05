import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileVideo, Upload } from "lucide-react";
import NavigationMenu from "@/components/navigation-menu";
import { useLocation } from "wouter";

export default function UploadPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Video upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/videos", {
        method: "POST",
        body: formData,
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
      
      // Redirect to videos page to see the uploaded video
      setLocation("/videos");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to upload video",
        description: error.message || "There was an error uploading your video. Please try again.",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <NavigationMenu />
      <div className="container mx-auto max-w-3xl">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold gradient-heading mb-4">Upload to VidZen</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">Share your creativity with the world</p>
        </header>
        
        <Card className="card-hover border-0 shadow-md overflow-hidden">
          <div className="h-2 gradient-bg w-full"></div>
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center mr-3">
                <Upload className="w-5 h-5 text-white" />
              </div>
              Upload New Video
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-700 text-lg">Video Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter video title"
                  required
                  className="border-blue-200 focus:border-blue-500 text-lg p-6"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-700 text-lg">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter video description (optional)"
                  rows={4}
                  className="border-blue-200 focus:border-blue-500 text-lg p-4"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="video" className="text-gray-700 text-lg">Select Video File</Label>
                <div className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg p-10 text-center hover:bg-blue-100 transition-all">
                  <Input
                    id="video"
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="video"
                    className="flex flex-col items-center justify-center cursor-pointer text-blue-500 hover:text-blue-700"
                  >
                    <FileVideo className="w-16 h-16 mb-4" />
                    {videoFile ? (
                      <div>
                        <p className="font-medium text-lg">{videoFile.name}</p>
                        <p className="text-gray-500 mt-2">Click to change video</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-lg">Drag a video here or click to select</p>
                        <p className="text-gray-500 mt-2">MP4, WebM, or Ogg file types accepted</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
              
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full primary-button py-6 text-lg"
                  disabled={uploadMutation.isPending || !videoFile}
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Upload className="mr-2 h-5 w-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-5 w-5" />
                      Upload Video
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}