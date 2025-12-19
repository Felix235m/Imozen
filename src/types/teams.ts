export interface TeamPermissions {
  can_manage_webhooks: boolean;
  can_view_operations: boolean;
  can_implementation_plan: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  agent_type: string;
  role: string;
  description: string;
  joined_at: string;
  status: 'active' | 'inactive';
}

export interface Team {
  id: string;
  name: string;
  description: string;
  created_at: string;
  members: TeamMember[];
  status: 'active' | 'inactive' | 'archived';
  permissions: TeamPermissions;
}

export interface TeamsMetadata {
  version: string;
  last_updated: string;
  created_by: string;
}

export interface TeamsConfig {
  teams: Team[];
  metadata: TeamsMetadata;
}