import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import LoginForm from "@/components/login-form";
import RegistrationForm from "@/components/registration-form";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { Loader2, Video, Play, UserCheck, Lock } from "lucide-react";

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const searchParams = useSearch();
  const params = new URLSearchParams(searchParams);
  const defaultTab = params.get("tab") || "login";

  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/home");
    }
  }, [user, isLoading, setLocation]);

  const handleTabChange = (value: string) => {
    // Update the URL with the new tab without navigating
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", value);
    window.history.replaceState(null, "", `${location}?${newParams.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="hidden md:flex flex-col space-y-8">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-extrabold gradient-heading mb-4">
              VideoShare Platform
            </h1>
            <p className="text-gray-600 max-w-md">
              Join our community to share and watch videos with friends and family
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center flex-shrink-0 mr-4">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg mb-1">Share Your Videos</h3>
                <p className="text-gray-600">Upload and share your videos with our easy-to-use platform</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center flex-shrink-0 mr-4">
                <Play className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg mb-1">Watch Anywhere</h3>
                <p className="text-gray-600">Access your favorite videos from any device, anytime</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center flex-shrink-0 mr-4">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg mb-1">Community</h3>
                <p className="text-gray-600">Join a community of video enthusiasts and creators</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Auth Card */}
        <Card className="card-hover border-0 shadow-lg overflow-hidden w-full max-w-md mx-auto">
          <div className="h-2 gradient-bg w-full"></div>
          <Tabs defaultValue={defaultTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-1 mt-4 mx-4 bg-blue-50">
              <TabsTrigger 
                value="login"
                className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-md"
              >
                <Lock className="w-4 h-4 mr-2" />
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="register"
                className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-md"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Register
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            <TabsContent value="register">
              <RegistrationForm />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
