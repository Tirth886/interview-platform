import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui";
import { teamRoleOptions } from "../../../constants/settings";
import type { TeamMember, TeamRole } from "../../../types/settings";

type TeamSectionProps = {
  canEdit: boolean;
  teamMembers: TeamMember[];
  teamInviteEmail: string;
  setTeamInviteEmail: (email: string) => void;
  teamInviteRole: TeamRole;
  setTeamInviteRole: (role: TeamRole) => void;
  teamError: string | null;
  onInvite: () => void;
  onUpdateRole: (memberId: string, role: TeamRole) => void;
  onRemove: (memberId: string) => void;
};

export const TeamSection = ({
  canEdit,
  teamMembers,
  teamInviteEmail,
  setTeamInviteEmail,
  teamInviteRole,
  setTeamInviteRole,
  teamError,
  onInvite,
  onUpdateRole,
  onRemove,
}: TeamSectionProps): JSX.Element => (
  <Card>
    <CardHeader>
      <CardTitle>Team Management</CardTitle>
      <CardDescription>
        Invite members and assign access levels for your hiring team.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
        <Input
          value={teamInviteEmail}
          onChange={(event) => setTeamInviteEmail(event.target.value)}
          placeholder="member@company.com"
          disabled={!canEdit}
        />
        <Select
          value={teamInviteRole}
          onValueChange={(value: TeamRole) => setTeamInviteRole(value)}
          disabled={!canEdit}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {teamRoleOptions.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button disabled={!canEdit} onClick={onInvite}>
          Send Invite
        </Button>
      </div>

      {teamError && <p className="text-sm text-destructive">{teamError}</p>}

      {teamMembers.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-4 py-7 text-center text-sm text-muted-foreground">
          No team members yet.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.email}</TableCell>
                <TableCell>
                  <Select
                    value={member.role}
                    onValueChange={(value: TeamRole) => onUpdateRole(member.id, value)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {teamRoleOptions.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge variant={member.status === "active" ? "success" : "warning"}>
                    {member.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={!canEdit}
                    onClick={() => onRemove(member.id)}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
);
