import React from 'react';
import { usePlanImplementationTeam } from '@/hooks/useTeams';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function TeamDisplay() {
  const { getTeam } = usePlanImplementationTeam();
  const team = getTeam();

  if (!team) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The plan-implementation team was not found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{team.name}</span>
          <span className={`px-2 py-1 rounded text-xs ${
            team.status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {team.status}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-sm text-gray-700 mb-1">Description</h4>
          <p className="text-sm text-gray-600">{team.description}</p>
        </div>

        <div>
          <h4 className="font-semibold text-sm text-gray-700 mb-2">Team Members</h4>
          {team.members.length === 0 ? (
            <p className="text-sm text-gray-600">No members assigned yet</p>
          ) : (
            <div className="space-y-2">
              {team.members.map((member) => (
                <div key={member.id} className="bg-gray-50 p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="font-medium text-sm text-gray-900">{member.name}</h5>
                    <span className={`px-2 py-1 rounded text-xs ${
                      member.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div><strong>Agent Type:</strong> {member.agent_type}</div>
                    <div><strong>Role:</strong> {member.role}</div>
                    <div><strong>Description:</strong> {member.description}</div>
                    <div><strong>Joined:</strong> {new Date(member.joined_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="font-semibold text-sm text-gray-700 mb-1">Permissions</h4>
          <div className="space-y-1">
            {team.permissions.can_manage_webhooks && (
              <div className="text-sm text-green-600">✓ Can manage webhooks</div>
            )}
            {team.permissions.can_view_operations && (
              <div className="text-sm text-green-600">✓ Can view operations</div>
            )}
            {team.permissions.can_implementation_plan && (
              <div className="text-sm text-green-600">✓ Can implement plan</div>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-sm text-gray-700 mb-1">Created</h4>
          <p className="text-sm text-gray-600">
            {new Date(team.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default TeamDisplay;