import { Team, TeamMember, TeamsConfig } from '@/types/teams';

const TEAMS_CONFIG_PATH = '/teams.json';

class TeamManager {
  private teams: Team[] = [];
  private config: TeamsConfig | null = null;

  constructor() {
    this.loadTeams();
  }

  private async loadTeams(): Promise<void> {
    try {
      const response = await fetch(TEAMS_CONFIG_PATH);
      if (response.ok) {
        this.config = await response.json();
        this.teams = this.config.teams;
      }
    } catch (error) {
      console.warn('Failed to load teams configuration:', error);
      // Initialize with empty config if loading fails
      this.config = {
        teams: [],
        metadata: {
          version: '1.0.0',
          last_updated: new Date().toISOString(),
          created_by: 'system'
        }
      };
      this.teams = [];
    }
  }

  getAllTeams(): Team[] {
    return this.teams;
  }

  getTeamById(id: string): Team | undefined {
    return this.teams.find(team => team.id === id);
  }

  getTeamByName(name: string): Team | undefined {
    return this.teams.find(team => team.name === name);
  }

  addTeam(team: Omit<Team, 'created_at'>): Team {
    const newTeam: Team = {
      ...team,
      created_at: new Date().toISOString()
    };

    this.teams.push(newTeam);
    this.updateConfig();

    return newTeam;
  }

  updateTeam(id: string, updates: Partial<Team>): Team | null {
    const teamIndex = this.teams.findIndex(team => team.id === id);

    if (teamIndex === -1) {
      return null;
    }

    this.teams[teamIndex] = {
      ...this.teams[teamIndex],
      ...updates
    };

    this.updateConfig();
    return this.teams[teamIndex];
  }

  deleteTeam(id: string): boolean {
    const initialLength = this.teams.length;
    this.teams = this.teams.filter(team => team.id !== id);

    if (this.teams.length < initialLength) {
      this.updateConfig();
      return true;
    }

    return false;
  }

  private updateConfig(): void {
    if (this.config) {
      this.config.teams = this.teams;
      this.config.metadata.last_updated = new Date().toISOString();
    }
  }

  // Team member management
  addMemberToTeam(teamId: string, member: TeamMember): boolean {
    const team = this.getTeamById(teamId);

    if (!team) {
      return false;
    }

    // Check if member already exists by ID
    const existingMemberIndex = team.members.findIndex(m => m.id === member.id);
    if (existingMemberIndex === -1) {
      team.members.push(member);
      this.updateConfig();
      return true;
    }

    return false;
  }

  removeMemberFromTeam(teamId: string, memberId: string): boolean {
    const team = this.getTeamById(teamId);

    if (!team) {
      return false;
    }

    const memberIndex = team.members.findIndex(m => m.id === memberId);
    if (memberIndex > -1) {
      team.members.splice(memberIndex, 1);
      this.updateConfig();
      return true;
    }

    return false;
  }

  // Get teams for a specific member
  getTeamsForMember(memberId: string): Team[] {
    return this.teams.filter(team =>
      team.members.some(member => member.id === memberId)
    );
  }

  // Get member by ID from a team
  getMemberById(teamId: string, memberId: string): TeamMember | undefined {
    const team = this.getTeamById(teamId);
    if (!team) {
      return undefined;
    }

    return team.members.find(member => member.id === memberId);
  }

  // Update member information
  updateMember(teamId: string, memberId: string, updates: Partial<TeamMember>): boolean {
    const team = this.getTeamById(teamId);
    if (!team) {
      return false;
    }

    const memberIndex = team.members.findIndex(m => m.id === memberId);
    if (memberIndex === -1) {
      return false;
    }

    team.members[memberIndex] = {
      ...team.members[memberIndex],
      ...updates
    };

    this.updateConfig();
    return true;
  }

  // Search teams by name or description
  searchTeams(query: string): Team[] {
    const lowercaseQuery = query.toLowerCase();
    return this.teams.filter(team =>
      team.name.toLowerCase().includes(lowercaseQuery) ||
      team.description.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Get active teams
  getActiveTeams(): Team[] {
    return this.teams.filter(team => team.status === 'active');
  }

  // Export configuration
  exportConfig(): TeamsConfig | null {
    return this.config;
  }
}

// Singleton instance
export const teamManager = new TeamManager();

// Export types for use in components
export type { Team, TeamMember, TeamsConfig };