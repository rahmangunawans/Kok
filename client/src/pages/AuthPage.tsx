import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MonitorPlay, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertUserSchema } from "@shared/schema";

interface AuthPageProps {
  mode: "login" | "register";
}

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function AuthPage({ mode }: AuthPageProps) {
  const [_, setLocation] = useLocation();
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  
  const form = useForm({
    resolver: zodResolver(mode === "login" ? loginSchema : registerSchema),
    defaultValues: {
      username: "",
      password: "",
      avatarUrl: "",
    },
  });

  const onSubmit = (data: any) => {
    if (mode === "login") {
      login(data, {
        onSuccess: () => setLocation("/"),
      });
    } else {
      register(data, {
        onSuccess: () => setLocation("/login"),
      });
    }
  };

  const isLoading = isLoggingIn || isRegistering;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1574267432553-4b4628081c31?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      <Card className="w-full max-w-md relative z-10 border-white/10 bg-background/60 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mb-2">
            <MonitorPlay className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display font-bold">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription>
            {mode === "login" 
              ? "Enter your credentials to access your account" 
              : "Join us and start streaming today"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} className="bg-white/5 border-white/10" />
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
                      <Input type="password" placeholder="••••••••" {...field} className="bg-white/5 border-white/10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {mode === "register" && (
                 <FormField
                 control={form.control}
                 name="avatarUrl"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Avatar URL (Optional)</FormLabel>
                     <FormControl>
                       <Input placeholder="https://..." {...field} value={field.value || ""} className="bg-white/5 border-white/10" />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
              )}

              <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "login" ? "Sign In" : "Create Account"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <p>Don't have an account? <Link href="/register" className="text-primary hover:underline font-medium">Sign up</Link></p>
            ) : (
              <p>Already have an account? <Link href="/login" className="text-primary hover:underline font-medium">Log in</Link></p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
