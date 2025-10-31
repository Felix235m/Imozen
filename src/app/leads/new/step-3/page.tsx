
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
import { DollarSign, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
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
  financingType: z.string().optional(),
  creditPreApproval: z.boolean().default(false),
  purchaseTimeframe: z.string().optional(),
  searchDuration: z.string().optional(),
  propertiesViewed: z.string().optional(),
});

export default function NewLeadStep3Page() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedData = sessionStorage.getItem('leadFormData');
      if (storedData) {
        const data = JSON.parse(storedData);
        if (data.step3) {
          form.reset(data.step3);
        }
      }
    }
  }, [form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const storedData = sessionStorage.getItem('leadFormData');
    const leadFormData = storedData ? JSON.parse(storedData) : {};
    leadFormData.step3 = values;
    sessionStorage.setItem('leadFormData', JSON.stringify(leadFormData));
    router.push("/leads/new/step-4");
  };

  const handleSaveAsDraft = () => {
    const values = form.getValues();
    const storedData = sessionStorage.getItem('leadFormData');
    const leadFormData = storedData ? JSON.parse(storedData) : {};
    leadFormData.step3 = values;
    sessionStorage.setItem('leadFormData', JSON.stringify(leadFormData));
    
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
          <CardTitle>{t.newLead.qualificationDetails}</CardTitle>
          <CardDescription>{t.newLead.qualificationDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="financingType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.newLead.financingType}</FormLabel>
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
                        {t.newLead.creditPreApproval}
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
                    <FormLabel>{t.newLead.whenPlanning}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
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
                    <FormLabel>{t.newLead.howLongLooking}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
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
                    <FormLabel>{t.newLead.seenOtherProperties}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
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

              <div className="pt-6">
                 <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                    <Button variant="outline" type="button" size="lg" onClick={() => router.back()}>
                        {t.newLead.previous}
                    </Button>
                    <Button variant="secondary" type="button" size="lg" onClick={handleSaveAsDraft}>
                        {t.newLead.saveAsDraft}
                    </Button>
                    <Button type="submit" size="lg" className="bg-primary">
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
