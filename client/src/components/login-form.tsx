import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { CardContent, CardFooter } from "@/components/ui/card";

const loginFormSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginForm() {
  const { loginMutation } = useAuth();
  const [_, setLocation] = useLocation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await loginMutation.mutateAsync({
        username: data.username,
        password: data.password,
      });
      setLocation("/home");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleRegisterClick = () => {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", "register");
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    // Force re-render by setting some state
    form.reset();
  };

  return (
    <>
      <CardContent className="space-y-4 pt-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Login to Your Account</h1>
          <p className="text-gray-600 text-sm mt-1">Enter your credentials to continue</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter your password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm cursor-pointer">Remember me</FormLabel>
                  </FormItem>
                )}
              />
              <Button variant="link" className="text-primary text-sm p-0 h-auto" type="button">
                Forgot Password?
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4 pt-0">
        <div className="text-center mt-4">
          <span className="text-gray-600 text-sm">Don't have an account?</span>{" "}
          <Button variant="link" className="text-primary p-0 h-auto" onClick={handleRegisterClick}>
            Register Now
          </Button>
        </div>
      </CardFooter>
    </>
  );
}
