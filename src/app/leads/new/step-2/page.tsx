
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
import { useEffect, useState } from "react";
import { Home, Building, Warehouse, Mountain, Minus, Plus, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

const propertyTypes = [
  { name: "Apartment", icon: Building },
  { name: "House", icon: Home },
  { name: "Commercial", icon: Warehouse },
  { name: "Land", icon: Mountain },
];

const allLocations = [
    { value: "lisbon", label: "Lisbon" },
    { value: "porto", label: "Porto" },
    { value: "faro", label: "Faro" },
    { value: "coimbra", label: "Coimbra" },
    { value: "braga", label: "Braga" },
    { value: "aveiro", label: "Aveiro" },
    { value: "sintra", label: "Sintra" },
    { value: "cascais", label: "Cascais" },
    { value: "funchal", label: "Funchal" },
    { value: "guimaraes", label: "Guimarães" }
];


const formSchema = z.object({
  propertyType: z.string().min(1, "Property type is required"),
  locations: z.array(z.string()).optional(),
  budget: z.number().min(1, "Budget is required"),
  budgetCurrency: z.string(),
  bedrooms: z.number().min(0, "Bedrooms cannot be negative"),
});

export default function NewLeadStep2Page() {
  const router = useRouter();
  const { toast } = useToast();
  const [openLocationPopover, setOpenLocationPopover] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyType: "",
      locations: [],
      budget: 0,
      budgetCurrency: "EUR",
      bedrooms: 0,
    },
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedData = sessionStorage.getItem('leadFormData');
      if (storedData) {
        try {
            const data = JSON.parse(storedData);
            if (data.step2) {
              form.reset(data.step2);
            }
        } catch (e) {
            console.error("Failed to parse lead form data from session storage", e);
        }
      }
    }
  }, [form]);


  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const storedData = sessionStorage.getItem('leadFormData');
    const leadFormData = storedData ? JSON.parse(storedData) : {};
    leadFormData.step2 = values;
    sessionStorage.setItem('leadFormData', JSON.stringify(leadFormData));
    router.push("/leads/new/step-3");
  };

  const handleSaveAsDraft = () => {
    const values = form.getValues();
    const storedData = sessionStorage.getItem('leadFormData');
    const leadFormData = storedData ? JSON.parse(storedData) : {};
    leadFormData.step2 = values;
    sessionStorage.setItem('leadFormData', JSON.stringify(leadFormData));
    
    toast({
        title: "Draft Saved",
        description: "Your lead information has been saved as a draft.",
    });
    router.push("/leads");
  }

  const propertyType = form.watch("propertyType");
  const bedrooms = form.watch("bedrooms");
  const locations = form.watch("locations") || [];
  const isBedroomsDisabled = propertyType === 'Commercial' || propertyType === 'Land';

  useEffect(() => {
    if (isBedroomsDisabled) {
        form.setValue('bedrooms', 0);
    }
  }, [isBedroomsDisabled, form]);

  const handleLocationSelect = (locationValue: string) => {
    const currentLocations = form.getValues('locations') || [];
    if (!currentLocations.includes(locationValue)) {
      form.setValue('locations', [...currentLocations, locationValue]);
    }
    setOpenLocationPopover(false);
  }

  const handleLocationRemove = (locationValue: string) => {
    const currentLocations = form.getValues('locations') || [];
    form.setValue('locations', currentLocations.filter(loc => loc !== locationValue));
  }


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
                    <FormLabel>Property Type <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-4">
                        {propertyTypes.map((type) => (
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
                name="locations"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Location Preferences</FormLabel>
                        <Popover open={openLocationPopover} onOpenChange={setOpenLocationPopover}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openLocationPopover}
                                    className="w-full justify-start h-auto min-h-10"
                                >
                                    <div className="flex gap-1 flex-wrap items-center">
                                        <Search className="h-4 w-4 mr-2 shrink-0" />
                                        {locations.length > 0 ? (
                                            locations.map(locValue => {
                                                const location = allLocations.find(l => l.value === locValue);
                                                return (
                                                    <Badge
                                                        key={locValue}
                                                        variant="secondary"
                                                        className="mr-1"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleLocationRemove(locValue);
                                                        }}
                                                    >
                                                        {location?.label}
                                                        <X className="ml-1 h-3 w-3" />
                                                    </Badge>
                                                )
                                            })
                                        ) : (
                                            <span className="text-muted-foreground">Select locations...</span>
                                        )}
                                    </div>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search location..." />
                                    <CommandList>
                                        <CommandEmpty>No location found.</CommandEmpty>
                                        <CommandGroup>
                                            {allLocations.map((location) => (
                                                <CommandItem
                                                    key={location.value}
                                                    value={location.value}
                                                    onSelect={handleLocationSelect}
                                                    disabled={locations.includes(location.value)}
                                                >
                                                    {location.label}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Budget <span className="text-red-500">*</span></FormLabel>
                <div className="flex items-center gap-2">
                    <FormField
                        control={form.control}
                        name="budgetCurrency"
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger className="w-24">
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="EUR">€ EUR</SelectItem>
                                    <SelectItem value="USD">$ USD</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="Enter budget"
                                    {...field}
                                    onChange={e => field.onChange(Number(e.target.value))}
                                />
                            </FormControl>
                        )}
                    />
                </div>
                 <FormMessage>{form.formState.errors.budget?.message}</FormMessage>
              </FormItem>

              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem className={cn(isBedroomsDisabled && "opacity-50")}>
                    <FormLabel>Number of Bedrooms</FormLabel>
                    <FormControl>
                        <div className="flex items-center justify-center gap-4 p-2 border rounded-lg">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => field.onChange(Math.max(0, bedrooms - 1))}
                                disabled={isBedroomsDisabled}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="text-2xl font-bold w-12 text-center">{bedrooms}</span>
                             <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => field.onChange(bedrooms + 1)}
                                disabled={isBedroomsDisabled}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
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

    