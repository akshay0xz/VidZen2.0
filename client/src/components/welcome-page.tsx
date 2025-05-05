import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { UserIcon, LogInIcon, Video, Play } from "lucide-react";

export default function WelcomePage() {
  const [_, setLocation] = useLocation();

  const goToLogin = () => {
    setLocation("/auth?tab=login");
  };

  const goToRegister = () => {
    setLocation("/auth?tab=register");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full flex flex-col md:flex-row gap-8">
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-4xl font-extrabold mb-4 gradient-heading">VideoShare</h1>
          <p className="text-lg text-gray-700 mb-6">Your personal video platform for sharing and watching videos with friends</p>
          
          <div className="flex flex-col space-y-3 mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center mr-4">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Upload Videos</h3>
                <p className="text-gray-600 text-sm">Share your videos with the world</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center mr-4">
                <Play className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Watch Anywhere</h3>
                <p className="text-gray-600 text-sm">Enjoy videos from any device</p>
              </div>
            </div>
          </div>
        </div>
        
        <Card className="w-full max-w-md card-hover">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold gradient-heading mb-2">Get Started</h2>
              <p className="text-gray-600">Please login or create a new account</p>
            </div>
            
            <div className="space-y-4">
              <Button 
                onClick={goToLogin}
                className="w-full primary-button py-6"
              >
                <LogInIcon className="mr-2 h-5 w-5" />
                Login
              </Button>
              
              <Button 
                onClick={goToRegister}
                variant="outline" 
                className="w-full secondary-button py-6"
              >
                <UserIcon className="mr-2 h-5 w-5" />
                New Registration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
