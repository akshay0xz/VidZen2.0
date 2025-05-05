import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle, Camera, Save, Loader2, User } from "lucide-react";
import { useLocation } from "wouter";
import NavigationMenu from "@/components/navigation-menu";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [_, setLocation] = useLocation();

  // Load user profile data
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setBio(user.bio || "");
      
      // If user has a profile picture, set the preview URL
      if (user.profilePicture) {
        setPreviewUrl(user.profilePicture);
      }
    }
  }, [user]);

  // Handle profile picture change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Get user's videos
  const { data: userVideos, isLoading: videosLoading } = useQuery({
    queryKey: ["/api/my-videos"],
    queryFn: async () => {
      const res = await fetch("/api/my-videos");
      if (!res.ok) {
        throw new Error("Failed to fetch user videos");
      }
      return res.json();
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/profile", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to update profile");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append("displayName", displayName);
    formData.append("bio", bio || "");
    
    if (profilePicture) {
      formData.append("profilePicture", profilePicture);
    }
    
    updateProfileMutation.mutate(formData);
  };

  // Calculate initials for avatar fallback
  const getInitials = () => {
    if (!user || !user.displayName) return "U";
    
    const names = user.displayName.split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please login to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <NavigationMenu />
      
      <div className="container mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold gradient-heading mb-4">Your Profile</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">Manage your account information and videos</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="md:col-span-1 space-y-8">
            <Card className="card-hover border-0 shadow-md overflow-hidden">
              <div className="h-2 gradient-bg w-full"></div>
              <CardHeader className="px-6 pb-0">
                <CardTitle className="text-xl flex items-center">
                  <UserCircle className="w-5 h-5 mr-2 text-blue-600" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group mb-4">
                    <Avatar className="w-24 h-24 border-4 border-white shadow-md">
                      <AvatarImage src={previewUrl} alt={user.displayName} />
                      <AvatarFallback className="text-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="absolute -bottom-2 -right-2 rounded-full bg-white hover:bg-blue-50"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  <h3 className="text-lg font-semibold">{user.displayName}</h3>
                  <p className="text-gray-500 text-sm">@{user.username}</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your display name"
                      required
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </div>
                  
                  <Button 
                    type="submit"
                    className="w-full primary-button"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          
          {/* User Videos */}
          <div className="md:col-span-2 space-y-8">
            <Card className="card-hover border-0 shadow-md overflow-hidden">
              <div className="h-2 gradient-bg w-full"></div>
              <CardContent className="p-6">
                <Tabs defaultValue="yourVideos">
                  <TabsList className="mb-6 bg-blue-50">
                    <TabsTrigger value="yourVideos" className="data-[state=active]:bg-white">Your Videos</TabsTrigger>
                    <TabsTrigger value="stats" className="data-[state=active]:bg-white">Stats</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="yourVideos">
                    {videosLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                      </div>
                    ) : userVideos && userVideos.length > 0 ? (
                      <div className="space-y-4">
                        {userVideos.map((video: any) => (
                          <div key={video.id} className="video-card flex flex-col md:flex-row overflow-hidden">
                            <div className="md:w-48 h-32 bg-gray-100 flex items-center justify-center">
                              <User className="w-10 h-10 text-gray-300" />
                            </div>
                            <div className="p-4 flex-1">
                              <h3 className="font-medium text-gray-800">{video.title}</h3>
                              <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                                {video.description || "No description"}
                              </p>
                              <div className="flex justify-between items-center mt-3">
                                <div className="text-xs text-blue-600">{video.views} views</div>
                                <div className="flex space-x-2">
                                  <Button size="sm" variant="outline" onClick={() => setLocation(`/videos?id=${video.id}`)}>
                                    View
                                  </Button>
                                  <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50">
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-blue-50 rounded-lg">
                        <User className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                        <p className="text-gray-700 font-medium">You haven't uploaded any videos yet</p>
                        <Button className="mt-4 primary-button" onClick={() => setLocation("/videos?action=upload")}>
                          Upload Your First Video
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="stats">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-6 text-center">
                          <p className="text-lg text-gray-600">Total Videos</p>
                          <h3 className="text-4xl font-bold gradient-heading">
                            {userVideos ? userVideos.length : 0}
                          </h3>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6 text-center">
                          <p className="text-lg text-gray-600">Total Views</p>
                          <h3 className="text-4xl font-bold gradient-heading">
                            {userVideos ? userVideos.reduce((sum: number, video: any) => sum + video.views, 0) : 0}
                          </h3>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}