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

const ImoZenLogo = () => (
  <div className="inline-flex items-center gap-2" style={{ height: 64 }}>
    <svg width="0" height="0">
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop
            offset="0%"
            style={{
              stopColor: "hsl(var(--primary))",
              stopOpacity: 1,
            }}
          />
          <stop
            offset="100%"
            style={{
              stopColor: "hsl(var(--accent))",
              stopOpacity: 1,
            }}
          />
        </linearGradient>
      </defs>
    </svg>

    <div
      style={{
        fontSize: "3rem",
        fontWeight: 700,
        letterSpacing: "-0.02em",
        color: "hsl(var(--foreground))",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        lineHeight: 1,
        display: "flex",
        alignItems: "center",
      }}
    >
      Imo
      <span style={{ color: "hsl(var(--primary))" }}>Zen</span>
    </div>

    <svg
      width={64}
      height={64}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="14"
        fill="hsl(var(--primary))"
      />

      <path
        d="M20 16C20 13.7909 21.7909 12 24 12H40C42.2091 12 44 13.7909 44 16V52H20V16Z"
        fill="hsl(var(--primary-foreground))"
        opacity="0.95"
      />

      <circle cx="36" cy="32" r="2.5" fill="hsl(var(--primary))" />

      <rect
        x="22"
        y="14"
        width="20"
        height="36"
        rx="2"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        fill="none"
        opacity="0.3"
      />

      <circle
        cx="32"
        cy="22"
        r="4"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
    </svg>
  </div>
);


export function LoginForm() {
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
    // Simulate network delay for a better user experience
    setTimeout(() => {
      if (
        values.username === "ImoZen@2250" &&
        values.password === "9500339370@2250"
      ) {
        toast({
          title: "Login Successful",
          description: "Welcome! You are now logged in.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: "Please check your username and password.",
        });
        form.setValue("password", "");
      }
      setIsLoading(false);
    }, 1000);
  }

  return (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader className="items-center text-center">
        <div className="mb-4">
          <ImoZenLogo />
        </div>
        <CardTitle className="font-headline text-3xl">ImoZen</CardTitle>
        <CardDescription>Enter your credentials to access the admin panel</CardDescription>
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
