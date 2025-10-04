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
  <svg
    width="80"
    height="80"
    viewBox="0 0 125 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <text
      x="5"
      y="30"
      fontFamily="sans-serif"
      fontSize="24"
      fill="hsl(var(--foreground))"
      stroke="hsl(var(--foreground))"
      strokeWidth="0.5"
    >
      ImoZen
    </text>
    <path
      d="M95 35V15C95 12.2386 97.2386 10 100 10H110C112.761 10 115 12.2386 115 15V35"
      stroke="hsl(var(--primary))"
      strokeWidth="2"
    />
    <rect x="95" y="10" width="20" height="25" fill="hsl(var(--primary))" />
    <circle cx="110" cy="28" r="1.5" fill="hsl(var(--background))" />
    <style>
      {`
      @import url('https://fonts.googleapis.com/css2?family=PT+Sans:wght@700&display=swap');
      text {
        font-family: 'PT Sans', sans-serif;
        font-weight: 700;
        letter-spacing: -1px;
        paint-order: stroke;
        stroke-linejoin: round;
        stroke-linecap: round;
      }
      @media (prefers-color-scheme: dark) {
        text {
          fill: hsl(var(--foreground));
          stroke: hsl(var(--foreground));
        }
      }
      `}
    </style>
  </svg>
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
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
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
