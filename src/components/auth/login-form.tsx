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

const formSchema = z.object({
  username: z.string().min(1, { message: "Username is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const ImoZenLogo = ({ size = "lg", variant = "gradient", className = "" }: { size?: 'sm' | 'md' | 'lg' | 'xl', variant?: 'default' | 'dark' | 'light' | 'gradient', className?: string }) => {
  const sizes = {
    sm: { height: 32, fontSize: '1.5rem', iconSize: 32 },
    md: { height: 48, fontSize: '2.25rem', iconSize: 48 },
    lg: { height: 64, fontSize: '3rem', iconSize: 64 },
    xl: { height: 80, fontSize: '4rem', iconSize: 80 }
  };

  const currentSize = sizes[size];

  // Using CSS variables for colors to respect the theme
  const colors = {
    default: {
      primary: 'hsl(var(--primary))',
      text: 'hsl(var(--foreground))',
      iconBg: 'hsl(var(--primary))',
      iconFg: 'hsl(var(--primary-foreground))'
    },
    dark: {
      primary: 'hsl(var(--primary))',
      text: 'hsl(var(--foreground))',
      iconBg: 'hsl(var(--primary))',
      iconFg: 'hsl(var(--primary-foreground))'
    },
    light: {
      primary: 'hsl(var(--primary))',
      text: 'hsl(var(--foreground))',
      iconBg: 'hsl(var(--primary))',
      iconFg: 'hsl(var(--primary-foreground))'
    },
    gradient: {
      primary: 'url(#logoGradient)',
      text: 'hsl(var(--foreground))',
      iconBg: 'url(#logoGradient)',
      iconFg: 'hsl(var(--primary-foreground))'
    }
  };

  const currentColors = colors[variant];

  return (
    <div 
      className={`inline-flex items-center gap-2 ${className}`}
      style={{ height: currentSize.height }}
    >
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))' }} />
            <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))' }} />
          </linearGradient>
        </defs>
      </svg>
      <div 
        style={{ 
          fontSize: currentSize.fontSize,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: currentColors.text,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        Imo<span style={{ fill: currentColors.primary, color: currentColors.primary }}>Zen</span>
      </div>
    </div>
  );
};


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

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    // Simulate a quick process, but no artifical delay
    const isAdminLogin = loginType === 'admin';
    const isAdminCredentials = values.username === "ImoZen@2250" && values.password === "9500339370@2250";
    // Dummy check for agent, you can replace this
    const isAgentCredentials = values.username === "agent" && values.password === "password";

    let success = false;
    if (isAdminLogin && isAdminCredentials) {
      success = true;
    } else if (!isAdminLogin && isAgentCredentials) {
      success = true;
    }

    if (success) {
      toast({
        title: "Login Successful",
        description: "Welcome! You are now logged in.",
      });
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } else {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: "Please check your username and password.",
      });
      form.setValue("password", "");
    }
    setIsLoading(false);
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
              className="w-full bg-accent text-accent-foreground transition-all hover:bg-accent/90 hover:scale-[1.02] active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log In
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
