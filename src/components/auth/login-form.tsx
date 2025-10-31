
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Lock, User, Eye, EyeOff } from "lucide-react";
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
import { useLanguage } from "@/hooks/useLanguage";
import { LANGUAGE_MAP } from "@/types/agent";


export function LoginForm({
  loginType = 'admin',
  onLoginSuccess,
}: {
  loginType: 'admin' | 'agent';
  onLoginSuccess: () => Promise<void> | void;
}) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const { toast } = useToast();
  const { t, setLanguage } = useLanguage();

  // Create form schema with translated validation messages
  const formSchema = React.useMemo(() => z.object({
    username: z.string().min(1, { message: t.login.validation.usernameRequired }),
    password: z.string().min(1, { message: t.login.validation.passwordRequired }),
  }), [t]);

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
        const response = await callAuthApi('login', {
          username: values.username,
          password: values.password
        });

        // Handle array response - unwrap first element
        const data = Array.isArray(response) ? response[0] : response;

        if (data.success === true && data.token && data.agent) {
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('agent_data', JSON.stringify(data.agent));

            // Set language from agent profile
            if (data.agent.agent_language) {
              const languageCode = LANGUAGE_MAP[data.agent.agent_language] || 'pt';
              setLanguage(languageCode);
            }
        } else {
            throw new Error(data.error?.message || t.login.messages.errorInvalidCredentials);
        }

      } else { // Admin login
         const isAdminCredentials = values.username === "ImoZen@2250" && values.password === "9500339370@2250";
         if (!isAdminCredentials) {
            throw new Error(t.login.messages.errorInvalidCredentials);
         }
      }

      toast({
        title: t.login.messages.successTitle,
        description: t.login.messages.successDescription,
      });
      if (onLoginSuccess) {
        onLoginSuccess();
      }

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: t.login.messages.errorTitle,
            description: error.message || t.login.messages.errorUnexpected,
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
        <CardTitle>{loginType === 'admin' ? t.login.adminTitle : t.login.agentTitle}</CardTitle>
        <CardDescription>{t.login.description}</CardDescription>
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
                    <FormLabel>{t.login.username}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder={t.login.usernamePlaceholder}
                          {...field}
                          className="pl-10"
                          disabled={isLoading}
                          suppressHydrationWarning
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
                    <FormLabel>{t.login.password}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder={t.login.passwordPlaceholder}
                          {...field}
                          className="pl-10 pr-10"
                          disabled={isLoading}
                          suppressHydrationWarning
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:bg-transparent"
                          onClick={() => setShowPassword(prev => !prev)}
                          disabled={isLoading}
                          suppressHydrationWarning
                        >
                          {showPassword ? <EyeOff /> : <Eye />}
                          <span className="sr-only">{showPassword ? t.login.hidePassword : t.login.showPassword}</span>
                        </Button>
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
              suppressHydrationWarning
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t.login.loginButton}
            </Button>
            <div className="text-center">
              <Button variant="link" type="button" className="p-0 h-auto" asChild>
                <Link href="/forgot-password">{t.login.forgotPassword}</Link>
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
