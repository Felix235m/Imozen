
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export default function NewLeadStep1Page() {
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formSchema = z.object({
    firstName: z.string().min(1, t.newLead.validation.firstNameRequired),
    lastName: z.string().min(1, t.newLead.validation.lastNameRequired),
    countryCode: z.string().min(1, t.newLead.validation.countryCodeRequired),
    phoneNumber: z.string().min(1, t.newLead.validation.phoneNumberRequired),
    email: z.string().email(t.newLead.validation.invalidEmail).optional().or(z.literal('')),
    language: z.string().optional(),
    leadSource: z.string().optional(),
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      countryCode: "+351",
      phoneNumber: "",
      email: "",
      language: "Portuguese",
      leadSource: "",
    },
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedData = sessionStorage.getItem('leadFormData');
      if (storedData) {
        const data = JSON.parse(storedData);
        if (data.step1) {
          form.reset(data.step1);
        }
      }
    }
  }, [form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
        const storedData = sessionStorage.getItem('leadFormData');
        const leadFormData = storedData ? JSON.parse(storedData) : {};
        
        const completePhoneNumber = `(${values.countryCode}) ${values.phoneNumber}`;
        
        leadFormData.step1 = { ...values, phoneNumber: completePhoneNumber };
        delete (leadFormData.step1 as any).countryCode;

        sessionStorage.setItem('leadFormData', JSON.stringify(leadFormData));
        
        router.push("/leads/new/step-2");

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: t.newLead.messages.errorTitle,
            description: t.newLead.messages.errorSaving,
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>{t.newLead.titles.createNewLead}</CardTitle>
          <CardDescription>{t.newLead.titles.enterContactInfo}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.newLead.labels.firstName} <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder={t.newLead.placeholders.firstName} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.newLead.labels.lastName} <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder={t.newLead.placeholders.lastName} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>{t.newLead.labels.phone} <span className="text-red-500">*</span></FormLabel>
                <div className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name="countryCode"
                    render={({ field }) => (
                      <FormControl>
                        <Input
                          placeholder="+351"
                          {...field}
                          className="w-20"
                        />
                      </FormControl>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormControl>
                        <Input type="tel" placeholder={t.newLead.placeholders.phoneNumber} {...field} />
                      </FormControl>
                    )}
                  />
                </div>
                <FormMessage>{form.formState.errors.phoneNumber?.message}</FormMessage>
              </FormItem>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.newLead.labels.email}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder={t.newLead.placeholders.email} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.newLead.labels.language}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t.newLead.placeholders.selectLanguage} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="English">{t.newLead.languages.english}</SelectItem>
                        <SelectItem value="Portuguese">{t.newLead.languages.portuguese}</SelectItem>
                        <SelectItem value="French">{t.newLead.languages.french}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="leadSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.newLead.labels.leadSource}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t.newLead.placeholders.selectSource} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="referral">{t.newLead.sources.referral}</SelectItem>
                        <SelectItem value="website">{t.newLead.sources.website}</SelectItem>
                        <SelectItem value="casayes">{t.newLead.sources.casayes}</SelectItem>
                        <SelectItem value="idealista">{t.newLead.sources.idealista}</SelectItem>
                        <SelectItem value="century-21-pt">{t.newLead.sources.century21}</SelectItem>
                        <SelectItem value="imovirtual">{t.newLead.sources.imovirtual}</SelectItem>
                        <SelectItem value="social-media-campaign">{t.newLead.sources.socialMedia}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="pt-6">
                 <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" type="button" size="lg" onClick={() => router.push('/leads')}>
                        {t.common.cancel}
                    </Button>
                    <Button type="submit" size="lg" className="bg-primary" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t.common.next}
                    </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
