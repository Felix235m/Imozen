
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  initialNote: z.string().optional(),
});

export default function NewLeadStep4Page() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      initialNote: "",
    },
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedData = sessionStorage.getItem('leadFormData');
      if (storedData) {
        const data = JSON.parse(storedData);
        if (data.step4) {
          form.reset(data.step4);
        }
      }
    }
  }, [form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
        const storedData = sessionStorage.getItem('leadFormData');
        const leadFormData = storedData ? JSON.parse(storedData) : {};
        leadFormData.step4 = values;
        
        const token = localStorage.getItem('auth_token');
        const leadId = sessionStorage.getItem('lead_id');

        if (!leadId) {
            throw new Error("Lead ID not found. Please start the process again.");
        }

        const payload = {
            ...leadFormData,
            lead_id: leadId,
        };

        const response = await fetch("https://eurekagathr.app.n8n.cloud/webhook/New-Lead", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorJson = JSON.parse(errorText);
                throw new Error(errorJson.message || "Failed to create lead. Please try again.");
            } catch (e) {
                throw new Error(errorText || "Failed to create lead. Please try again.");
            }
        }
        
        const responseData = await response.json();

        toast({
            title: "Lead Created!",
            description: "The new lead has been successfully added to your list.",
        });

        sessionStorage.removeItem('leadFormData');
        sessionStorage.removeItem('lead_id');
        sessionStorage.removeItem('lead_creation_session_id');

        if (responseData.lead_id) {
          router.push(`/leads/${responseData.lead_id}`);
        } else {
          router.push("/leads");
        }

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Could not create the lead.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSaveAsDraft = () => {
    const values = form.getValues();
    const storedData = sessionStorage.getItem('leadFormData');
    const leadFormData = storedData ? JSON.parse(storedData) : {};
    leadFormData.step4 = values;
    sessionStorage.setItem('leadFormData', JSON.stringify(leadFormData));
    
    toast({
        title: "Draft Saved",
        description: "Your lead information has been saved as a draft.",
    });
    router.push("/leads");
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4">
        <Card className="border-none shadow-none">
          <CardHeader>
            <CardTitle>Initial Note</CardTitle>
            <CardDescription>Add any additional information about this lead for future reference.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="initialNote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Client is very interested in properties with a backyard for their dog. Prefers modern architecture..."
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="pt-6">
                    <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                        <Button variant="outline" type="button" size="lg" onClick={() => router.back()}>
                            Previous
                        </Button>
                        <Button variant="secondary" type="button" size="lg" onClick={handleSaveAsDraft}>
                            Save as Draft
                        </Button>
                        <Button type="submit" size="lg" className="bg-primary" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create New Lead
                        </Button>
                    </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

