"use client";

import { useState, useEffect } from 'react';
import { Plus, Search, ChevronDown, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const allAgents = [
  {
    name: 'Ethan Carter',
    id: '12345',
    avatar: 'https://i.pravatar.cc/150?u=ethan',
    status: 'Active',
    location: 'New York',
  },
  {
    name: 'Sophia Ramirez',
    id: '67890',
    avatar: 'https://i.pravatar.cc/150?u=sophia',
    status: 'Active',
    location: 'Los Angeles',
  },
  {
    name: 'Liam O\'Connell',
    id: '24680',
    avatar: 'https://i.pravatar.cc/150?u=liam',
    status: 'Inactive',
    location: 'Chicago',
  },
  {
    name: 'Isabella Rossi',
    id: '13579',
    avatar: 'https://i.pravatar.cc/150?u=isabella',
    status: 'Active',
    location: 'New York',
  },
  {
    name: 'Noah Dubois',
    id: '97531',
    avatar: 'https://i.pravatar.cc/150?u=noah',
    status: 'Inactive',
    location: 'Los Angeles',
  },
];

export default function AgentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAgents, setFilteredAgents] = useState(allAgents);
  const [statusFilter, setStatusFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');

  useEffect(() => {
    let results = allAgents.filter(agent =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== 'All') {
      results = results.filter(agent => agent.status === statusFilter);
    }

    if (locationFilter !== 'All') {
      results = results.filter(agent => agent.location === locationFilter);
    }
    
    setFilteredAgents(results);
  }, [searchTerm, statusFilter, locationFilter]);

  return (
    <div className="p-4 pb-20">
      <header className="flex items-center justify-between py-4">
        <h1 className="text-2xl font-bold">Agents</h1>
        <Button variant="ghost" size="icon">
          <Plus className="h-6 w-6" />
        </Button>
      </header>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Input 
          placeholder="Search agents" 
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="mb-6 flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-white"
            >
              Status: {statusFilter} <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioItem value="All">All</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Active">Active</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Inactive">Inactive</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-white"
            >
              Location: {locationFilter} <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value={locationFilter} onValueChange={setLocationFilter}>
              <DropdownMenuLabel>Filter by Location</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioItem value="All">All</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="New York">New York</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Los Angeles">Los Angeles</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Chicago">Chicago</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="space-y-3">
        {filteredAgents.map((agent) => (
          <Card key={agent.id} className="shadow-md">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={agent.avatar} alt={agent.name} />
                  <AvatarFallback>
                    {agent.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{agent.name}</p>
                  <p className="text-sm text-gray-500">Agent ID: {agent.id}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
