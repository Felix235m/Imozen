
export type LeadData = {
    lead_id: string;
    name: string;
    temperature: 'Hot' | 'Warm' | 'Cold';
    stage: string;
    lead_stage?: string;
    next_follow_up: {
        date: string | null;
        status: string;
        color: string;
        days_until: number | null;
    };
    contact: {
        email: string;
        phone: number;
        language: string;
    };
    property: {
        type: string;
        locations: string[];
        bedrooms: number;
        budget: number;
        budget_formatted: string;
    };
    purchase: {
        timeframe: string;
        financing_type: string;
        credit_pre_approved: boolean;
        search_duration: string;
        has_seen_properties: string;
    };
    management: {
        source: string;
        initial_message: string;
        agent_notes: string;
        follow_up_task: string;
        lead_score: number;
        ai_message: string;
    };
    created_at: string;
    created_at_formatted: string;
    image_url: string;
    communication_history: any[];
    row_number: number;
};

// This is now just a fallback and might not be used if the API is always available.
export const allLeadsData: LeadData[] = [];

    