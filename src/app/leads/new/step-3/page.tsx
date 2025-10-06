
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DollarSign, CreditCard, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const financingTypes = [
  { name: "Cash", icon: DollarSign },
  { name: "Credit", icon: CreditCard },
];

const purchaseTimeframes = ["Immediately (under 3 months)", "3-6 months", "After 6 months"];
const searchDurations = ["Starting now", "0-2 months", "3-6 months", "More than 6 months"];
const propertiesViewedOptions = ["No", "A few", "Many"];


const formSchema = z.object({
  financingType: z.string().min(1, "Financing type is required"),
  creditPreApproval: z.boolean().default(false),
  purchaseTimeframe: z.string().optional(),
  searchDuration: z.string().optional(),
  propertiesViewed: z.string().optional(),
});

export default function NewLeadStep3Page() {
  const router = useRouter();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      financingType: "",
      creditPreApproval: false,
      purchaseTimeframe: "",
      searchDuration: "",
      propertiesViewed: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Step 3 data:", values);
    router.push("/leads/new/step-4");
  };

  const handleSaveAsDraft = () => {
    console.log("Saving as draft:", form.getValues());
    toast({
        title: "Draft Saved",
        description: "Your lead information has been saved as a draft.",
    });
    router.push("/leads");
  }

  const financingType = form.watch("financingType");
  const isCreditPreApprovalDisabled = financingType !== 'Credit';

  useEffect(() => {
    if (isCreditPreApprovalDisabled) {
        form.setValue('creditPreApproval', false);
    }
  }, [isCreditPreApprovalDisabled, form]);

  return (
    <div className="p-4">
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>Qualification Details</CardTitle>
          <CardDescription>Tell us more about the lead's qualifications.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="financingType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Financing Type <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-4">
                        {financingTypes.map((type) => (
                          <Button
                            key={type.name}
                            variant={field.value === type.name ? "default" : "outline"}
                            onClick={(e) => {
                              e.preventDefault();
                              field.onChange(type.name);
                            }}
                            className={cn("h-auto py-4 flex flex-col gap-2 transition-all", field.value === type.name ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent hover:text-accent-foreground")}
                          >
                            <type.icon className="h-6 w-6" />
                            <span>{type.name}</span>
                          </Button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="creditPreApproval"
                render={({ field }) => (
                  <FormItem className={cn("flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4", isCreditPreApprovalDisabled && "opacity-50 cursor-not-allowed")}>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isCreditPreApprovalDisabled}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className={cn(isCreditPreApprovalDisabled && "cursor-not-allowed")}>
                        Credit Pre-approval
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="purchaseTimeframe"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>When are they planning to buy?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        {purchaseTimeframes.map((item) => (
                            <FormItem key={item} className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                <RadioGroupItem value={item} />
                                </FormControl>
                                <FormLabel className="font-normal">{item}</FormLabel>
                            </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="searchDuration"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>How long have they been looking?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        {searchDurations.map((item) => (
                            <FormItem key={item} className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                <RadioGroupItem value={item} />
                                </FormControl>
                                <FormLabel className="font-normal">{item}</FormLabel>
                            </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="propertiesViewed"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Have they seen any other properties?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        {propertiesViewedOptions.map((item) => (
                            <FormItem key={item} className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                <RadioGroupItem value={item} />
                                </FormControl>
                                <FormLabel className="font-normal">{item}</FormLabel>
                            </FormItem>
                        ))}
                      </RadioGroup>
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
                        Next
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
