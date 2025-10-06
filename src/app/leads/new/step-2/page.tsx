
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
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

const formSchema = z.object({
  propertyType: z.string().min(1, "Property type is required"),
  budget: z.number().min(10000, "Budget must be at least $10,000"),
  bedrooms: z.number().min(0, "Bedrooms cannot be negative"),
});

export default function NewLeadStep2Page() {
  const router = useRouter();
  const [budget, setBudget] = useState(250000);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyType: "Condo",
      budget: 250000,
      bedrooms: 2,
    },
  });
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Step 1 data +", values);
    // In a real app, you would combine data from all steps and save the new lead.
    router.push("/leads");
  };

  return (
    <div className="p-4">
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>Property Requirements</CardTitle>
          <CardDescription>What is the lead looking for?</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="propertyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a property type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Condo">Condo</SelectItem>
                        <SelectItem value="Apartment">Apartment</SelectItem>
                        <SelectItem value="House">House</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                        <SelectItem value="Land">Land</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget</FormLabel>
                    <div className="flex items-center gap-4">
                      <FormControl>
                        <Slider
                          min={10000}
                          max={2000000}
                          step={10000}
                          value={[field.value]}
                          onValueChange={(values) => {
                            const newBudgetValue = values[0];
                            field.onChange(newBudgetValue);
                            setBudget(newBudgetValue);
                          }}
                        />
                      </FormControl>
                      <div className="font-semibold w-32 text-right">
                        ${field.value.toLocaleString()}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bedrooms</FormLabel>
                     <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select number of bedrooms" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">Studio / 0</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5+</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t">
                 <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    <Button variant="outline" type="button" size="lg" onClick={() => router.back()}>
                        Back
                    </Button>
                    <Button type="submit" size="lg" className="bg-primary">
                        Finish
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
