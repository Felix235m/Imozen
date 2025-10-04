import { Plus, Search, ChevronDown, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const agents = [
  {
    name: 'Ethan Carter',
    id: '12345',
    avatar: 'https://i.pravatar.cc/150?u=ethan',
  },
  {
    name: 'Sophia Ramirez',
    id: '67890',
    avatar: 'https://i.pravatar.cc/150?u=sophia',
  },
  {
    name: 'Liam O\'Connell',
    id: '24680',
    avatar: 'https://i.pravatar.cc/150?u=liam',
  },
  {
    name: 'Isabella Rossi',
    id: '13579',
    avatar: 'https://i.pravatar.cc/150?u=isabella',
  },
  {
    name: 'Noah Dubois',
    id: '97531',
    avatar: 'https://i.pravatar.cc/150?u=noah',
  },
];

export default function AgentsPage() {
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
        <Input placeholder="Search agents" className="pl-10" />
      </div>
      <div className="mb-6 flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-white"
            >
              Status <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Active</DropdownMenuItem>
            <DropdownMenuItem>Inactive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-white"
            >
              Location <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>New York</DropdownMenuItem>
            <DropdownMenuItem>Los Angeles</DropdownMenuItem>
            <DropdownMenuItem>Chicago</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="space-y-3">
        {agents.map((agent) => (
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
