
"use client";

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Mail, Phone } from "lucide-react";
import Link from 'next/link';

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
  contact: z.string().min(1, { message: "Email or phone number is required." }),
});

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contact: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
      await callAuthApi('password_reset_request', {
        identifier: values.contact
      });
      setIsSuccess(true);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Request Failed",
            description: error.message || "An unexpected error occurred.",
        });
    } finally {
        setIsLoading(false);
    }
  }
  
  if (isSuccess) {
      return (
          <main className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-4">
               <Card className="w-full max-w-sm shadow-xl">
                 <CardHeader className="items-center text-center space-y-4">
                    <ImoZenLogo size="md" />
                    <CardTitle>Instructions Sent</CardTitle>
                    <CardDescription>
                        If an account exists for {form.getValues("contact")}, you will receive an email or SMS with password reset instructions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Link href="/" passHref>
                        <Button className="w-full" variant="outline">
                            Back to Login
                        </Button>
                    </Link>
                </CardContent>
               </Card>
          </main>
      )
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <Card className="w-full max-w-sm shadow-xl">
          <CardHeader className="items-center text-center space-y-4">
            <ImoZenLogo size="md" />
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>Enter your email or phone to reset it.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email or Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="e.g., name@example.com"
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
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground transition-all hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Instructions
                </Button>
                <div className="text-center">
                    <Button variant="link" asChild className="p-0 h-auto">
                        <Link href="/">Back to Login</Link>
                    </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
