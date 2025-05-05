import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Send, Trash2, Loader2 } from "lucide-react";
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

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  videoId: number;
  user?: {
    id: number;
    username: string;
    displayName: string;
    profilePicture?: string;
  };
}

interface VideoCommentsProps {
  videoId: number;
}

export default function VideoComments({ videoId }: VideoCommentsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comment, setComment] = useState("");

  // Fetch comments for this video
  const { data: comments, isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: [`/api/videos/${videoId}/comments`],
    queryFn: async () => {
      const res = await fetch(`/api/videos/${videoId}/comments`);
      if (!res.ok) {
        throw new Error("Failed to fetch comments");
      }
      return res.json();
    },
  });

  // Add a comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/videos/${videoId}/comments`, { content });
    },
    onSuccess: () => {
      // Clear the comment input
      setComment("");
      // Invalidate comments query to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}/comments`] });
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add comment",
        description: error.message || "There was an error adding your comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete a comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return apiRequest("DELETE", `/api/comments/${commentId}`);
    },
    onSuccess: () => {
      // Invalidate comments query to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}/comments`] });
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete comment",
        description: error.message || "There was an error deleting your comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast({
        title: "Comment is empty",
        description: "Please enter a comment before submitting.",
        variant: "destructive",
      });
      return;
    }
    addCommentMutation.mutate(comment);
  };

  const handleDeleteComment = (commentId: number) => {
    deleteCommentMutation.mutate(commentId);
  };

  // Format date to a readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Comments</h3>
      
      {/* Comment form */}
      <form onSubmit={handleSubmitComment} className="flex gap-2">
        <Textarea
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="flex-1 min-h-[80px]"
        />
        <Button 
          type="submit" 
          className="self-end"
          disabled={addCommentMutation.isPending || !comment.trim()}
        >
          {addCommentMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
      
      {/* Comments list */}
      <div className="space-y-4 mt-6">
        {commentsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : comments && comments.length > 0 ? (
          comments.map((comment) => (
            <Card key={comment.id} className="bg-gray-50 border-blue-100">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 mt-1">
                      {comment.user?.profilePicture ? (
                        <AvatarImage src={comment.user.profilePicture} alt={comment.user.displayName} />
                      ) : (
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{comment.user?.displayName || "Unknown User"}</span>
                        <span className="text-xs text-gray-500">{comment.createdAt && formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                  
                  {user && user.id === comment.userId && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-500 h-8 w-8 p-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your comment.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteComment(comment.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-gray-500">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
}