
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

const formSchema = z.object({
  initialNote: z.string().optional(),
});

export default function NewLeadStep4Page() {
  const router = useRouter();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      initialNote: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Step 4 data:", values);
    // In a real app, you would compile all data from previous steps and create the lead
    toast({
        title: "Lead Created!",
        description: "The new lead has been successfully added to your list.",
    });
    router.push("/leads");
  };

  const handleSaveAsDraft = () => {
    console.log("Saving as draft:", form.getValues());
    // In a real app, you would compile all data and save as a draft
    toast({
        title: "Draft Saved",
        description: "Your lead information has been saved as a draft.",
    });
    router.push("/leads");
  }

  return (
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
              
              <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t">
                 <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                    <Button variant="outline" type="button" size="lg" onClick={() => router.back()}>
                        Previous
                    </Button>
                    <Button variant="secondary" type="button" size="lg" onClick={handleSaveAsDraft}>
                        Save as Draft
                    </Button>
                    <Button type="submit" size="lg" className="bg-primary">
                        Create New Lead
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
