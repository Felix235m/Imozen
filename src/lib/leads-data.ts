
export type LeadData = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatar: string;
    status: 'Hot' | 'Warm' | 'Cold';
    activeStatus: 'Active' | 'Inactive';
    createdAt: string;
    propertyType: string;
    budget: number;
    bedrooms: number;
    source: string;
};

export const allLeadsData: LeadData[] = [
  {
    id: 'd2c5e5f3-a2f2-4f9c-9b0d-7d5b4a3a3c21',
    firstName: 'Sophia',
    lastName: 'Carter',
    email: 'sophia.carter@example.com',
    phone: '123-456-7890',
    avatar: 'https://i.pravatar.cc/150?u=sophia',
    status: 'Hot',
    activeStatus: 'Active',
    createdAt: '2024-01-15',
    propertyType: 'Condo',
    budget: 550000,
    bedrooms: 2,
    source: 'Website',
  },
  {
    id: 'olivia-bennett-2',
    firstName: 'Olivia',
    lastName: 'Bennett',
    email: 'olivia.bennett@example.com',
    phone: '234-567-8901',
    avatar: 'https://i.pravatar.cc/150?u=olivia',
    status: 'Warm',
    activeStatus: 'Active',
    createdAt: '2024-02-10',
    propertyType: 'House',
    budget: 750000,
    bedrooms: 4,
    source: 'Referral',
  },
  {
    id: 'noah-thompson-3',
    firstName: 'Noah',
    lastName: 'Thompson',
    email: 'noah.thompson@example.com',
    phone: '345-678-9012',
    avatar: 'https://i.pravatar.cc/150?u=noah',
    status: 'Cold',
    activeStatus: 'Active',
    createdAt: '2024-03-05',
    propertyType: 'Apartment',
    budget: 300000,
    bedrooms: 1,
    source: 'Zillow',
  },
   {
    id: 'ava-rodriguez-4',
    firstName: 'Ava',
    lastName: 'Rodriguez',
    email: 'ava.rodriguez@example.com',
    phone: '456-789-0123',
    avatar: 'https://i.pravatar.cc/150?u=ava',
    status: 'Hot',
    activeStatus: 'Inactive',
    createdAt: '2024-03-20',
    propertyType: 'Commercial',
    budget: 1200000,
    bedrooms: 0,
    source: 'Website',
  },
  {
    id: 'liam-harper-5',
    firstName: 'Liam',
    lastName: 'Harper',
    email: 'liam.harper@example.com',
    phone: '567-890-1234',
    avatar: 'https://i.pravatar.cc/150?u=liam',
    status: 'Warm',
    activeStatus: 'Active',
    createdAt: '2024-04-01',
    propertyType: 'Land',
    budget: 250000,
    bedrooms: 0,
    source: 'Referral',
  },
   {
    id: 'isabella-hayes-6',
    firstName: 'Isabella',
    lastName: 'Hayes',
    email: 'isabella.hayes@example.com',
    phone: '678-901-2345',
    avatar: 'https://i.pravatar.cc/150?u=isabella',
    status: 'Cold',
    activeStatus: 'Active',
    createdAt: '2024-05-15',
    propertyType: 'Condo',
    budget: 450000,
    bedrooms: 2,
    source: 'Zillow',
  },
  {
    id: 'lucas-foster-7',
    firstName: 'Lucas',
    lastName: 'Foster',
    email: 'lucas.foster@example.com',
    phone: '789-012-3456',
    avatar: 'https://i.pravatar.cc/150?u=lucas',
    status: 'Hot',
    activeStatus: 'Active',
    createdAt: '2024-06-01',
    propertyType: 'House',
    budget: 950000,
    bedrooms: 5,
    source: 'Website',
  },
  {
    id: 'mia-coleman-8',
    firstName: 'Mia',
    lastName: 'Coleman',
    email: 'mia.coleman@example.com',
    phone: '890-123-4567',
    avatar: 'https://i.pravatar.cc/150?u=mia',
    status: 'Warm',
    activeStatus: 'Inactive',
    createdAt: '2024-06-12',
    propertyType: 'Apartment',
    budget: 320000,
    bedrooms: 1,
    source: 'Referral',
  },
];
