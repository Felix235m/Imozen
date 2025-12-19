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
import { Loader2, Home, Building, Warehouse, Mountain, Minus, Plus, X, ChevronsUpDown, DollarSign, CreditCard } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import { extractLeadType, extractLeadStage, extractTemperature } from "@/lib/lead-normalization";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useLeads, useNotifications } from "@/hooks/useAppData";
import { localStorageManager } from "@/lib/local-storage-manager";
import { processNewLeadResponse } from "@/lib/new-lead-processor";
import type { Notification } from "@/types/app-data";

// Constants
const propertyTypes = [
  { name: "Apartment", nameKey: "apartment", icon: Building },
  { name: "House", nameKey: "house", icon: Home },
  { name: "Commercial", nameKey: "commercial", icon: Warehouse },
  { name: "Land", nameKey: "land", icon: Mountain },
];


const financingTypes = [
  { name: "Cash", nameKey: "cash", icon: DollarSign },
  { name: "Credit", nameKey: "credit", icon: CreditCard },
];

const purchaseTimeframes = [
  { key: "immediately", nameKey: "immediately" },
  { key: "threeToSixMonths", nameKey: "threeToSixMonths" },
  { key: "afterSixMonths", nameKey: "afterSixMonths" }
];

const searchDurations = [
  { key: "startingNow", nameKey: "startingNow" },
  { key: "zeroToTwoMonths", nameKey: "zeroToTwoMonths" },
  { key: "threeToSixMonths", nameKey: "threeToSixMonths" },
  { key: "moreThanSixMonths", nameKey: "moreThanSixMonths" }
];

const propertiesViewedOptions = [
  { key: "no", nameKey: "no" },
  { key: "aFew", nameKey: "aFew" },
  { key: "many", nameKey: "many" }
];

export default function NewLeadPage() {
  const { t } = useLanguage();

  // Combined form schema with all fields
  const formSchema = z.object({
    // Step 1: Contact Information
    leadType: z.enum(['Buyer', 'Seller']).default('Buyer'),
    firstName: z.string().min(1, t.newLead.validation.firstNameRequired),
    lastName: z.string().min(1, t.newLead.validation.lastNameRequired),
    countryCode: z.string().min(1, t.newLead.validation.countryCodeRequired),
    phoneNumber: z.string().min(1, t.newLead.validation.phoneNumberRequired),
    email: z.string().email(t.newLead.validation.invalidEmail).optional().or(z.literal('')),
    language: z.string().optional(),
    leadSource: z.string().optional(),

    // Step 2: Property Requirements
    propertyType: z.string().optional(),
    locations: z.string().optional(),
    budget: z.number().optional(),
    budgetCurrency: z.string(),
    bedrooms: z.number().min(0, t.newLead.validation.bedroomsNegative),

    // Step 3: Qualification
    financingType: z.string().optional(),
    creditPreApproval: z.boolean().default(false),
    purchaseTimeframe: z.string().optional(),
    searchDuration: z.string().optional(),
    propertiesViewed: z.string().optional(),

    // Step 4: Initial Note
    initialNote: z.string().optional(),
  });
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hooks for localStorage management
  const { addLead, updateSingleLead, deleteLead } = useLeads();
  const { updateNotifications } = useNotifications();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Step 1 defaults
      leadType: "Buyer",
      firstName: "",
      lastName: "",
      countryCode: "+351",
      phoneNumber: "",
      email: "",
      language: "Portuguese",
      leadSource: "",
      // Step 2 defaults
      propertyType: "",
      locations: "",
      budget: 0,
      budgetCurrency: "EUR",
      bedrooms: 0,
      // Step 3 defaults
      financingType: "",
      creditPreApproval: false,
      purchaseTimeframe: "",
      searchDuration: "",
      propertiesViewed: "",
      // Step 4 defaults
      initialNote: "",
    },
  });

  // Load data from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedData = sessionStorage.getItem('leadFormData');
      if (storedData) {
        try {
          const data = JSON.parse(storedData);

          // Parse phone number if it's already formatted to avoid concatenation
          if (data.phoneNumber && data.phoneNumber.includes('(')) {
            const match = data.phoneNumber.match(/\(([^)]+)\)\s*(.+)/);
            if (match) {
              data.countryCode = match[1];
              data.phoneNumber = match[2].trim();
            }
          }

          // Ensure numeric fields have valid defaults
          if (typeof data.bedrooms !== 'number') {
            data.bedrooms = 0;
          }
          if (typeof data.budget !== 'number') {
            data.budget = 0;
          }

          form.reset(data);
        } catch (e) {
          console.error("Failed to parse lead form data from session storage", e);
        }
      }
    }
  }, [form]);

  // Save to sessionStorage on changes (debounced)
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('leadFormData', JSON.stringify(values));
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Watch values for conditional logic
  const leadType = form.watch("leadType");
  const propertyType = form.watch("propertyType");
  const bedrooms = form.watch("bedrooms") ?? 0;
  const locations = form.watch("locations") || "";
  const financingType = form.watch("financingType");

  const isBedroomsDisabled = propertyType === 'Commercial' || propertyType === 'Land';
  const isCreditPreApprovalDisabled = financingType !== 'Credit';
  const isBuyer = leadType === 'Buyer';

  // Auto-disable bedrooms for Commercial/Land
  useEffect(() => {
    if (isBedroomsDisabled) {
      form.setValue('bedrooms', 0);
    }
  }, [isBedroomsDisabled, form]);

  // Auto-disable credit pre-approval if not Credit
  useEffect(() => {
    if (isCreditPreApprovalDisabled) {
      form.setValue('creditPreApproval', false);
    }
  }, [isCreditPreApprovalDisabled, form]);


  // Form submission with optimistic updates
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const leadId = sessionStorage.getItem('lead_id');

    if (!leadId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Lead ID not found. Please start the process again.",
      });
      return;
    }

    // Clean phone number before concatenation to avoid duplicates
    let cleanPhone = values.phoneNumber.replace(/\([^)]+\)/g, '').replace(/\s+/g, '').trim();
    const completePhoneNumber = `(${values.countryCode}) ${cleanPhone}`;

    // Prepare payload for webhook
    const payload = {
      leadType: values.leadType,
      firstName: values.firstName,
      lastName: values.lastName,
      phoneNumber: completePhoneNumber,
      email: values.email,
      language: values.language,
      leadSource: values.leadSource,
      propertyType: values.propertyType,
      locations: values.locations ? [values.locations] : [],
      budget: values.budget,
      budgetCurrency: values.budgetCurrency,
      bedrooms: values.bedrooms,
      financingType: values.financingType,
      creditPreApproval: values.creditPreApproval,
      purchaseTimeframe: values.purchaseTimeframe,
      searchDuration: values.searchDuration,
      propertiesViewed: values.propertiesViewed,
      initialNote: values.initialNote,
      lead_id: leadId,
    };

    // Create optimistic lead object for immediate display
    const optimisticLead = {
      lead_id: leadId,
      name: `${values.firstName} ${values.lastName}`,
      temperature: 'Warm' as const,
      stage: 'New Lead' as const,
      lead_stage: 'New Lead' as const,
      lead_type: values.leadType as 'Buyer' | 'Seller',
      next_follow_up: {
        status: 'Not set',
        date: undefined,
      },
      contact: {
        phone: completePhoneNumber,
        email: values.email || undefined,
      },
    };

    // IMMEDIATE: Add lead to localStorage (optimistic update)
    addLead(optimisticLead);

    // IMMEDIATE: Navigate to leads page
    router.push('/leads');

    // IMMEDIATE: Show optimistic success toast
    toast({
      title: "Lead Added!",
      description: "Creating lead in background...",
    });

    // Clear form data from sessionStorage
    sessionStorage.removeItem('leadFormData');

    // BACKGROUND: Send webhook request
    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch("https://eurekagathr.app.n8n.cloud/webhook/New-Lead", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      // Check for session expiry (401 Unauthorized)
      if (response.status === 401) {
        // Session expired - logout immediately
        localStorage.removeItem('auth_token');
        localStorage.removeItem('agent_data');
        localStorageManager.clearAppData();

        toast({
          variant: "destructive",
          title: "Session Expired",
          description: "Please log in again.",
        });

        router.push('/');
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to create lead. Please try again.";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();

      // Process comprehensive server response (extracts lead, notes, tasks, communication history)
      console.log('📥 Processing comprehensive new lead response...');
      const processed = processNewLeadResponse(responseData);

      console.log('✅ Extracted from server response:', {
        lead_id: processed.lead.lead_id,
        lead_type: processed.lead.lead_type,
        notes: processed.metadata.notesCount,
        tasks: processed.metadata.tasksCount,
        history: processed.metadata.historyCount,
      });

      // Store ALL components in a single atomic transaction
      localStorageManager.processNewLeadData(
        leadId,
        processed.lead,
        processed.notes,
        processed.tasks,
        processed.communicationHistory
      );

      console.log(`✅ New lead ${leadId} created with lead_type: ${processed.lead.lead_type}`);

      // Update dashboard stats
      const currentDashboard = localStorageManager.getDashboard();
      const updatedDashboard = {
        success: true,
        counts: {
          ...currentDashboard.counts,
          all: currentDashboard.counts.all + 1,
          new_this_week: currentDashboard.counts.new_this_week + 1,
          hot: currentDashboard.counts.hot + (processed.lead.temperature === 'Hot' ? 1 : 0),
        },
        conversion_rate: currentDashboard.conversion_rate,
      };
      localStorageManager.updateDashboard(updatedDashboard);

      // Add enhanced success notification with metadata
      const notifications = localStorageManager.getNotifications();
      const successNotification: Notification = {
        id: `notif-success-${Date.now()}`,
        type: 'new_lead',
        title: 'Lead Created Successfully',
        message: `${processed.lead.name} added with ${processed.metadata.notesCount} notes and ${processed.metadata.tasksCount} tasks`,
        timestamp: Date.now(),
        priority: 'medium',
        read: false,
        lead_id: leadId,
        metadata: {
          lead_type: processed.lead.lead_type,
          temperature: processed.lead.temperature,
          stage: processed.lead.lead_stage,
        },
      };
      updateNotifications([successNotification, ...notifications]);

      // Show success toast
      toast({
        title: "Lead Created!",
        description: "Successfully synced with server.",
      });

      // Clear remaining sessionStorage
      sessionStorage.removeItem('lead_id');
      sessionStorage.removeItem('lead_creation_session_id');

    } catch (error: any) {
      console.error('Lead creation error:', error);

      // ROLLBACK: Remove optimistic lead from localStorage
      deleteLead(leadId);

      // Add error notification with retry action
      const notifications = localStorageManager.getNotifications();
      const errorNotification: Notification = {
        id: `notif-error-${Date.now()}`,
        type: 'system_error',
        title: 'Lead Creation Failed',
        message: `Could not create lead for ${optimisticLead.name}. Tap to retry.`,
        timestamp: Date.now(),
        priority: 'high',
        read: false,
        action_type: 'retry_create_lead',
        action_target: '/leads/new',
        action_data: {
          ...values, // Store failed form data for retry
          lead_id: leadId, // Store the original lead_id for reuse
        },
      };
      updateNotifications([errorNotification, ...notifications]);

      // Show error toast
      toast({
        variant: "destructive",
        title: "Lead Creation Failed",
        description: "Check notifications to retry.",
      });
    }
  };

  const handleCancel = () => {
    // Optionally clear sessionStorage
    sessionStorage.removeItem('leadFormData');
    sessionStorage.removeItem('lead_id');
    sessionStorage.removeItem('lead_creation_session_id');
    router.push('/leads');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white p-4 border-b">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">{t.newLead.addNewLead}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.newLead.fillInformation}</p>
        </div>
      </div>

      {/* Main Form */}
      <main className="flex-1 overflow-y-auto pb-32">
        <div className="p-4 max-w-2xl mx-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

              {/* SECTION 1: Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>{t.newLead.contactInformation}</CardTitle>
                  <CardDescription>{t.newLead.contactInformationDescription}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Lead Type Selection */}
                  <FormField
                    control={form.control}
                    name="leadType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-base font-semibold">{t.newLead.leadType} <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-2 gap-4"
                          >
                            <FormItem>
                              <FormLabel className="cursor-pointer">
                                <div className={cn(
                                  "flex items-center justify-center p-4 rounded-lg border-2 transition-all",
                                  field.value === "Buyer"
                                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                    : "border-gray-200 hover:border-gray-300"
                                )}>
                                  <FormControl>
                                    <RadioGroupItem value="Buyer" className="sr-only" />
                                  </FormControl>
                                  <span className={cn(
                                    "text-lg font-semibold",
                                    field.value === "Buyer" ? "text-green-700 dark:text-green-300" : "text-gray-700"
                                  )}>
                                    {t.newLead.buyer}
                                  </span>
                                </div>
                              </FormLabel>
                            </FormItem>
                            <FormItem>
                              <FormLabel className="cursor-pointer">
                                <div className={cn(
                                  "flex items-center justify-center p-4 rounded-lg border-2 transition-all",
                                  field.value === "Seller"
                                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                    : "border-gray-200 hover:border-gray-300"
                                )}>
                                  <FormControl>
                                    <RadioGroupItem value="Seller" className="sr-only" />
                                  </FormControl>
                                  <span className={cn(
                                    "text-lg font-semibold",
                                    field.value === "Seller" ? "text-purple-700 dark:text-purple-300" : "text-gray-700"
                                  )}>
                                    {t.newLead.seller}
                                  </span>
                                </div>
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

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
                </CardContent>
              </Card>

              {/* SECTION 2: Property Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle>{t.newLead.propertyRequirements}</CardTitle>
                  <CardDescription>{t.newLead.propertyRequirementsDescription}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.newLead.propertyType}</FormLabel>
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
                                <span>{t.newLead.propertyTypes[type.nameKey as keyof typeof t.newLead.propertyTypes]}</span>
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
                      <FormItem>
                        <FormLabel className="transition-all duration-300">
                          {isBuyer
                            ? t.newLead.desiredLocations
                            : t.newLead.propertyLocation}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={isBuyer ? t.newLead.placeholders.desiredLocation : t.newLead.placeholders.propertyLocation}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormItem>
                    <FormLabel className="transition-all duration-300">
                      {isBuyer
                        ? t.newLead.budget
                        : t.newLead.askingPrice}
                    </FormLabel>
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
                              placeholder={t.newLead.enterBudget}
                              {...field}
                              onChange={e => field.onChange(Number(e.target.value))}
                              onFocus={(e) => {
                                if (field.value === 0) {
                                  e.target.select();
                                }
                              }}
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
                        <FormLabel>{t.newLead.numberOfBedrooms}</FormLabel>
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
                </CardContent>
              </Card>

              {/* SECTION 3: Qualification */}
              <Card>
                <CardHeader>
                  <CardTitle>{t.newLead.qualificationDetails}</CardTitle>
                  <CardDescription>
                    {isBuyer ? t.newLead.qualificationDetailsBuyer : t.newLead.qualificationDetailsSeller}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Financing Type - Buyer Only */}
                  {isBuyer && (
                    <div className="transition-all duration-300 ease-in-out">
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
                                <span>{t.newLead.financingTypes[type.nameKey as keyof typeof t.newLead.financingTypes]}</span>
                              </Button>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Credit Pre-Approval - Buyer Only */}
                  {isBuyer && (
                    <div className="transition-all duration-300 ease-in-out">
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
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="purchaseTimeframe"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="transition-all duration-300">
                          {isBuyer
                            ? t.newLead.whenPlanning
                            : t.newLead.whenPlanningSell}
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            {purchaseTimeframes.map((item) => (
                              <FormItem key={item.key} className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value={item.nameKey} />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {t.newLead.purchaseTimeframes[item.nameKey as keyof typeof t.newLead.purchaseTimeframes]}
                                </FormLabel>
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
                        <FormLabel className="transition-all duration-300">
                          {isBuyer
                            ? t.newLead.howLongLooking
                            : t.newLead.howLongInMarket}
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            {searchDurations.map((item) => (
                              <FormItem key={item.key} className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value={item.nameKey} />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {t.newLead.searchDurations[item.nameKey as keyof typeof t.newLead.searchDurations]}
                                </FormLabel>
                              </FormItem>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Properties Viewed - Buyer Only */}
                  {isBuyer && (
                    <div className="transition-all duration-300 ease-in-out">
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
                              <FormItem key={item.key} className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value={item.nameKey} />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {t.newLead.propertiesViewed[item.nameKey as keyof typeof t.newLead.propertiesViewed]}
                                </FormLabel>
                              </FormItem>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SECTION 4: Initial Note */}
              <Card>
                <CardHeader>
                  <CardTitle>{t.newLead.initialNote}</CardTitle>
                  <CardDescription>{t.newLead.initialNoteDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="initialNote"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.newLead.note}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={isBuyer ? t.newLead.noteExamples.buyer : t.newLead.noteExamples.seller}
                            className="min-h-[200px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="pt-6 pb-8">
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <Button
                    variant="outline"
                    type="button"
                    size="lg"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    {t.common.cancel || "Cancel"}
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="bg-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t.newLead.createNewLead || "Add Lead"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
