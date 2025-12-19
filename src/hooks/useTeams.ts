import { useState, useEffect } from 'react';
import { Team, TeamMember, TeamsConfig } from '@/types/teams';
import { teamManager } from '@/lib/team-manager';

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTeams = () => {
      try {
        setLoading(true);
        const allTeams = teamManager.getAllTeams();
        setTeams(allTeams);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load teams');
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, []);

  const refreshTeams = () => {
    const allTeams = teamManager.getAllTeams();
    setTeams(allTeams);
  };

  const getTeamById = (id: string): Team | undefined => {
    return teamManager.getTeamById(id);
  };

  const getTeamByName = (name: string): Team | undefined => {
    return teamManager.getTeamByName(name);
  };

  const addTeam = (teamData: Omit<Team, 'created_at'>): Team | null => {
    try {
      const newTeam = teamManager.addTeam(teamData);
      refreshTeams();
      return newTeam;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add team');
      return null;
    }
  };

  const updateTeam = (id: string, updates: Partial<Team>): Team | null => {
    try {
      const updatedTeam = teamManager.updateTeam(id, updates);
      refreshTeams();
      return updatedTeam;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team');
      return null;
    }
  };

  const deleteTeam = (id: string): boolean => {
    try {
      const success = teamManager.deleteTeam(id);
      if (success) {
        refreshTeams();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete team');
      return false;
    }
  };

  const addMemberToTeam = (teamId: string, member: TeamMember): boolean => {
    try {
      const success = teamManager.addMemberToTeam(teamId, member);
      if (success) {
        refreshTeams();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member to team');
      return false;
    }
  };

  const removeMemberFromTeam = (teamId: string, memberId: string): boolean => {
    try {
      const success = teamManager.removeMemberFromTeam(teamId, memberId);
      if (success) {
        refreshTeams();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member from team');
      return false;
    }
  };

  const searchTeams = (query: string): Team[] => {
    return teamManager.searchTeams(query);
  };

  const getActiveTeams = (): Team[] => {
    return teamManager.getActiveTeams();
  };

  const getTeamsForMember = (memberId: string): Team[] => {
    return teamManager.getTeamsForMember(memberId);
  };

  const getMemberById = (teamId: string, memberId: string): TeamMember | undefined => {
    return teamManager.getMemberById(teamId, memberId);
  };

  const updateMember = (teamId: string, memberId: string, updates: Partial<TeamMember>): boolean => {
    try {
      const success = teamManager.updateMember(teamId, memberId, updates);
      if (success) {
        refreshTeams();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member');
      return false;
    }
  };

  return {
    teams,
    loading,
    error,
    getTeamById,
    getTeamByName,
    addTeam,
    updateTeam,
    deleteTeam,
    addMemberToTeam,
    removeMemberFromTeam,
    searchTeams,
    getActiveTeams,
    getTeamsForMember,
    getMemberById,
    updateMember,
    refreshTeams
  };
}

// Specific hook for the plan-implementation team
export function usePlanImplementationTeam() {
  const { getTeamByName } = useTeams();

  const getTeam = (): Team | undefined => {
    return getTeamByName('plan-implementation');
  };

  return {
    getTeam
  };
}