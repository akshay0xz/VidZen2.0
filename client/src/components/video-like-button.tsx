import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Heart } from "lucide-react";

interface VideoLikeButtonProps {
  videoId: number;
}

export default function VideoLikeButton({ videoId }: VideoLikeButtonProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  // Get the like count and user liked status
  const { data: likeData, isLoading } = useQuery({
    queryKey: [`/api/videos/${videoId}/likes`],
    queryFn: async () => {
      const res = await fetch(`/api/videos/${videoId}/likes`);
      if (!res.ok) {
        throw new Error("Failed to fetch likes data");
      }
      return res.json();
    },
    // Don't refetch on window focus to avoid bouncing UI
    refetchOnWindowFocus: false,
  });

  // Like the video mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      setIsUpdating(true);
      return apiRequest("POST", `/api/videos/${videoId}/like`);
    },
    onSuccess: () => {
      // Invalidate like count query to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}/likes`] });
      setIsUpdating(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to like video",
        description: error.message || "There was an error liking the video. Please try again.",
        variant: "destructive",
      });
      setIsUpdating(false);
    },
  });

  // Unlike the video mutation
  const unlikeMutation = useMutation({
    mutationFn: async () => {
      setIsUpdating(true);
      return apiRequest("DELETE", `/api/videos/${videoId}/like`);
    },
    onSuccess: () => {
      // Invalidate like count query to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}/likes`] });
      setIsUpdating(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to unlike video",
        description: error.message || "There was an error unliking the video. Please try again.",
        variant: "destructive",
      });
      setIsUpdating(false);
    },
  });

  const handleLikeAction = () => {
    if (isUpdating) return;

    if (likeData?.userLiked) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" className="text-gray-500" disabled>
        <Heart className="h-4 w-4 mr-1" />
        Loading...
      </Button>
    );
  }

  return (
    <Button
      variant={likeData?.userLiked ? "default" : "outline"}
      size="sm"
      className={`${
        likeData?.userLiked
          ? "bg-red-500 hover:bg-red-600 text-white"
          : "text-red-500 hover:text-red-600 border-red-200"
      }`}
      onClick={handleLikeAction}
      disabled={isUpdating}
    >
      <Heart className={`h-4 w-4 mr-1 ${likeData?.userLiked ? "fill-white" : ""}`} />
      {likeData?.count || 0}
    </Button>
  );
}