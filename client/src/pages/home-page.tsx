import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { FileVideo, LogOut, User, Activity } from "lucide-react";
import NavigationMenu from "@/components/navigation-menu";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [_, setLocation] = useLocation();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <NavigationMenu />
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-extrabold mb-8 gradient-heading text-center">VidZen</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4">
                <User className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-center text-xl">
                Welcome, {user?.displayName || user?.username}!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                You're logged in and ready to explore our video platform.
              </p>
              <Button
                variant="outline"
                className="secondary-button w-full"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </Button>
            </CardContent>
          </Card>
          
          <Card className="card-hover md:col-span-2">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4">
                <FileVideo className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-center text-xl">VidZen Platform</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-gray-600">
                Upload and watch videos in our interactive platform. Share your creativity with others.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="flex flex-col items-center p-4 rounded-md bg-blue-50 border border-blue-100">
                  <FileVideo className="w-8 h-8 text-blue-500 mb-2" />
                  <h3 className="font-medium">Upload Videos</h3>
                  <p className="text-xs text-center text-gray-500">Share your content easily</p>
                </div>
                
                <div className="flex flex-col items-center p-4 rounded-md bg-purple-50 border border-purple-100">
                  <Activity className="w-8 h-8 text-purple-500 mb-2" />
                  <h3 className="font-medium">Track Views</h3>
                  <p className="text-xs text-center text-gray-500">See how popular your videos are</p>
                </div>
              </div>
              
              <Button 
                onClick={() => setLocation("/videos")}
                className="w-full primary-button mt-4"
              >
                <FileVideo className="mr-2 h-4 w-4" />
                Go to Video Platform
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
