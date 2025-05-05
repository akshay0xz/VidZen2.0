import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  Menu, 
  Home, 
  Upload, 
  Video, 
  UserCircle, 
  LogOut,
  Layers
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function NavigationMenu() {
  const [_, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    setLocation("/");
  };

  const menuItems = [
    {
      label: "Home",
      icon: <Home className="h-5 w-5" />,
      onClick: () => setLocation("/home"),
    },
    {
      label: "Upload Video",
      icon: <Upload className="h-5 w-5" />,
      onClick: () => setLocation("/upload"),
    },
    {
      label: "Your Videos",
      icon: <Video className="h-5 w-5" />,
      onClick: () => setLocation("/my-uploads"),
    },
    {
      label: "Browse Videos",
      icon: <Layers className="h-5 w-5" />,
      onClick: () => setLocation("/videos"),
    },
    {
      label: "Profile",
      icon: <UserCircle className="h-5 w-5" />,
      onClick: () => setLocation("/profile"),
    },
  ];

  return (
    <>
      {/* Mobile Navigation */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="rounded-full h-12 w-12 bg-white shadow-md border-blue-100"
            >
              <Menu className="h-5 w-5 text-blue-600" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-gradient-to-br from-blue-50 to-indigo-100">
            <SheetHeader className="p-6 border-b border-blue-100">
              <SheetTitle className="gradient-heading text-xl">VidZen</SheetTitle>
            </SheetHeader>
            <div className="py-4">
              {menuItems.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start px-6 py-4 h-auto text-gray-700 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => {
                    item.onClick();
                    setIsOpen(false);
                  }}
                >
                  {item.icon}
                  <span className="ml-3 font-medium">{item.label}</span>
                </Button>
              ))}
              <div className="px-3 pt-6">
                <Button
                  variant="outline"
                  className="w-full justify-start text-gray-700 border-blue-200"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:block fixed top-6 right-6 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              className="rounded-full h-12 px-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
              size="lg"
            >
              <span className="font-medium">Menu</span>
              <Menu className="ml-2 h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl">
            <DropdownMenuLabel className="gradient-heading">VidZen</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {menuItems.map((item, index) => (
              <DropdownMenuItem
                key={index}
                className="py-3 cursor-pointer hover:bg-blue-50"
                onClick={item.onClick}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="py-3 cursor-pointer hover:bg-blue-50 text-red-500 hover:text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-3">Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}