import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { useAuth } from "@/hooks/use-auth";
import { CardContent, CardFooter } from "@/components/ui/card";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const mobileRegex = /^\d{10}$/;

const registrationFormSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  mobile: z.string().refine((val) => mobileRegex.test(val), {
    message: "Mobile number must be 10 digits",
  }),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  otp: z.string().length(6, "OTP must be 6 digits").optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegistrationFormValues = z.infer<typeof registrationFormSchema>;

export default function RegistrationForm() {
  const { registerMutation, requestOtpMutation, verifyOtpMutation } = useAuth();
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const { toast } = useToast();

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      displayName: "",
      username: "",
      mobile: "",
      password: "",
      confirmPassword: "",
      otp: "",
    },
  });

  const [displayedOtp, setDisplayedOtp] = useState<string | null>(null);
  
  const sendOtp = async () => {
    const mobileValue = form.getValues("mobile");
    
    // Validate mobile number
    if (!mobileRegex.test(mobileValue)) {
      form.setError("mobile", { 
        type: "manual", 
        message: "Please enter a valid 10-digit mobile number" 
      });
      return;
    }
    
    try {
      await requestOtpMutation.mutateAsync({ mobile: mobileValue });
      setOtpSent(true);
      
      // Display toast notification
      toast({
        title: "OTP Sent",
        description: "A verification code has been sent to your mobile number.",
        variant: "default",
      });
      
      // Get the OTP from the development endpoint and display it on screen
      setTimeout(() => {
        fetch('/api/development-get-latest-otp')
          .then(res => res.json())
          .then(data => {
            if (data.otp) {
              setDisplayedOtp(data.otp);
              // Auto-fill the OTP field for testing
              form.setValue('otp', data.otp);
            }
          })
          .catch(err => console.error('Error fetching OTP:', err));
      }, 500);
    } catch (error) {
      // Error is handled by the mutation
    }
  };
  
  const verifyOtp = async () => {
    const mobileValue = form.getValues("mobile");
    const otpValue = form.getValues("otp");
    
    if (!otpValue || otpValue.length !== 6) {
      form.setError("otp", { 
        type: "manual", 
        message: "Please enter a valid 6-digit OTP" 
      });
      return;
    }
    
    try {
      const result = await verifyOtpMutation.mutateAsync({ 
        mobile: mobileValue, 
        otp: otpValue 
      });
      
      if (result.verified) {
        setOtpVerified(true);
      }
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const onSubmit = async (data: RegistrationFormValues) => {
    if (!otpVerified) {
      toast({
        title: "Verification required",
        description: "Please verify your mobile number with OTP",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await registerMutation.mutateAsync({
        displayName: data.displayName,
        username: data.username,
        mobile: data.mobile,
        password: data.password,
        otpVerified: true,
      });
      
      // Switch to login tab after successful registration
      const params = new URLSearchParams(window.location.search);
      params.set("tab", "login");
      window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
      
      // Reset the form
      form.reset();
      setOtpSent(false);
      setOtpVerified(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleLoginClick = () => {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", "login");
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    // Force re-render by resetting the form
    form.reset();
  };

  return (
    <>
      <CardContent className="space-y-4 pt-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Create New Account</h1>
          <p className="text-gray-600 text-sm mt-1">Fill in your details to register</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your display name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <div className="flex space-x-2">
                    <FormControl>
                      <Input 
                        placeholder="Enter your 10-digit mobile number" 
                        {...field} 
                        type="tel"
                        disabled={otpSent && otpVerified}
                      />
                    </FormControl>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      className="shrink-0"
                      onClick={sendOtp}
                      disabled={requestOtpMutation.isPending || otpVerified}
                    >
                      {requestOtpMutation.isPending ? "Sending..." : (otpVerified ? "Verified" : "Send OTP")}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {otpSent && (
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enter OTP</FormLabel>
                    <div className="flex space-x-2">
                      <FormControl>
                        <Input 
                          placeholder="Enter 6-digit OTP" 
                          {...field} 
                          maxLength={6}
                          disabled={otpVerified}
                        />
                      </FormControl>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="shrink-0"
                        onClick={verifyOtp}
                        disabled={verifyOtpMutation.isPending || otpVerified}
                      >
                        {verifyOtpMutation.isPending ? "Verifying..." : (otpVerified ? "Verified" : "Verify OTP")}
                      </Button>
                    </div>
                    
                    {/* OTP display for development */}
                    {displayedOtp && !otpVerified && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        <span className="font-medium">Your OTP is: </span>
                        <span className="font-bold">{displayedOtp}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mt-1">
                      <FormMessage />
                      {otpSent && !otpVerified && (
                        <Button 
                          variant="link" 
                          className="text-xs p-0 h-auto" 
                          type="button" 
                          onClick={sendOtp}
                          disabled={requestOtpMutation.isPending}
                        >
                          Resend OTP
                        </Button>
                      )}
                    </div>
                  </FormItem>
                )}
              />
            )}

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

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Re-enter your password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 mt-6"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Registering..." : "Register"}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4 pt-0">
        <div className="text-center mt-4">
          <span className="text-gray-600 text-sm">Already have an account?</span>{" "}
          <Button variant="link" className="text-primary p-0 h-auto" onClick={handleLoginClick}>
            Login
          </Button>
        </div>
      </CardFooter>
    </>
  );
}
