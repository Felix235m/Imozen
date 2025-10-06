"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
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
import NewLeadLayout from "@/components/leads/new-lead-layout";
import { countries } from "@/lib/countries";
import { Combobox } from "@/components/ui/combobox";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  countryCode: z.string().min(1, "Country code is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  leadSource: z.string().optional(),
});

const leadSourceOptions = [
  "Referral",
  "Social Media",
  "Website",
  "Idealista",
  "CasaYes",
  "ImoVirtual",
  "Century 21",
  "Campaign",
];

const countryOptions = countries.map(country => ({
    value: country.dial_code,
    label: `${country.name} (${country.dial_code})`,
    searchValue: `${country.name.toLowerCase()} ${country.dial_code}`,
}));

export default function NewLeadStep1() {
  const router = useRouter();
  // Here you would retrieve stored data from a global state/context if available
  const defaultValues = {
    firstName: "",
    lastName: "",
    countryCode: "+351",
    phone: "",
    email: "",
    leadSource: "",
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onChange'
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Here you would save the data to a global state/context
    const fullPhoneNumber = `${values.countryCode}${values.phone}`;
    console.log({ ...values, phone: fullPhoneNumber });
    router.push("/leads/new/step-2"); // Navigate to the next step
  };

  return (
    <NewLeadLayout
      currentStep={1}
      totalSteps={3}
      title="Create New Lead"
      description="Start by entering the lead's contact information."
      onCancel={() => router.push("/leads")}
      onNext={form.handleSubmit(onSubmit)}
      isNextDisabled={!form.formState.isValid}
    >
      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter first name" {...field} />
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
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel>Phone</FormLabel>
            <div className="flex gap-2">
                <FormField
                    control={form.control}
                    name="countryCode"
                    render={({ field }) => (
                        <FormItem className="w-48">
                             <Combobox
                                options={countryOptions}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select country..."
                                searchPlaceholder="Search country..."
                                notFoundText="No country found."
                             />
                             <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem className="flex-1">
                            <FormControl>
                                <Input placeholder="Enter phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
          </FormItem>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter email address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="leadSource"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lead Source</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a source" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {leadSourceOptions.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </NewLeadLayout>
  );
}
