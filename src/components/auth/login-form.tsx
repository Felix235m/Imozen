"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Lock, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ImoZenLogo } from "@/components/logo";
import { callAuthApi } from "@/lib/auth-api";

const formSchema = z.object({
  username: z.string().min(1, { message: "Username is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});


export function LoginForm({
  loginType = 'admin',
  onLoginSuccess,
}: {
  loginType: 'admin' | 'agent';
  onLoginSuccess: () => void;
}) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
      if (loginType === 'agent') {
        const data = await callAuthApi('login', {
          username: values.username,
          password: values.password
        });
        
        if (data.success) {
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('agent_data', JSON.stringify(data.agent));
        } else {
            // This case might not be hit if callAuthApi throws on non-ok responses,
            // but is good for safety.
            throw new Error(data.error?.message || 'Login failed');
        }

      } else { // Admin login
         const isAdminCredentials = values.username === "ImoZen@2250" && values.password === "9500339370@2250";
         if (!isAdminCredentials) {
            throw new Error("Please check your username and password.");
         }
      }

      toast({
        title: "Login Successful",
        description: "Welcome! You are now logged in.",
      });
      if (onLoginSuccess) {
        onLoginSuccess();
      }

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Authentication Failed",
            description: error.message || "An unexpected error occurred.",
        });
        form.setValue("password", "");
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader className="items-center text-center space-y-4">
        <ImoZenLogo size="md" />
        <CardTitle>{loginType === 'admin' ? 'Admin Login' : 'Agent Login'}</CardTitle>
        <CardDescription>Enter your credentials to access the panel</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Your username"
                          {...field}
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
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
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log In
            </Button>
            <div className="text-center">
              <Button variant="link" type="button" className="p-0 h-auto">
                Forgot Password?
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
