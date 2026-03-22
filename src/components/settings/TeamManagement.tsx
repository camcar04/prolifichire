import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "sonner";
import { Users, UserPlus, Mail, Trash2, Clock, Check, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/format";

const FARM_ROLES = [
  { value: "owner", label: "Owner" },
  { value: "farm_manager", label: "Farm Manager" },
  { value: "agronomist", label: "Agronomist" },
  { value: "admin", label: "Admin" },
  { value: "accountant", label: "Accountant" },
  { value: "member", label: "Member" },
];

const OPERATOR_ROLES = [
  { value: "owner", label: "Owner" },
  { value: "dispatcher", label: "Dispatcher" },
  { value: "crew_member", label: "Crew Member" },
  { value: "office_manager", label: "Office Manager" },
  { value: "accountant", label: "Accountant" },
  { value: "member", label: "Member" },
];

export function TeamManagement() {
  const { user, profile, activeMode } = useAuth();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const orgId = profile?.organizationId;
  const roles = activeMode === "operator" ? OPERATOR_ROLES : FARM_ROLES;

  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ["org-members", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from("organization_members")
        .select("*")
        .eq("organization_id", orgId);
      if (!data?.length) return [];
      const userIds = data.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email")
        .in("user_id", userIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      return data.map(m => ({ ...m, profile: profileMap.get(m.user_id) }));
    },
    enabled: !!orgId,
  });

  const { data: invites = [] } = useQuery({
    queryKey: ["org-invites", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from("organization_invites")
        .select("*")
        .eq("organization_id", orgId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!orgId,
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!orgId || !user) throw new Error("No organization");
      if (!inviteEmail.trim()) throw new Error("Enter an email");
      const { error } = await supabase.from("organization_invites").insert({
        organization_id: orgId,
        email: inviteEmail.trim().toLowerCase(),
        org_role: inviteRole,
        invited_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invite sent");
      setInviteEmail("");
      setInviteRole("member");
      queryClient.invalidateQueries({ queryKey: ["org-invites", orgId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from("organization_members").delete().eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member removed");
      queryClient.invalidateQueries({ queryKey: ["org-members", orgId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!orgId) {
    return (
      <EmptyState
        icon={<Users size={18} />}
        title="No organization"
        description="Complete onboarding to set up your organization and invite team members."
      />
    );
  }

  const currentMember = members.find(m => m.user_id === user?.id);
  const isOwnerOrAdmin = currentMember?.org_role === "owner" || currentMember?.org_role === "admin";

  return (
    <div className="space-y-5">
      {/* Members list */}
      <div className="rounded-lg bg-card border">
        <div className="px-4 py-2.5 border-b flex items-center justify-between">
          <h3 className="text-[13px] font-semibold flex items-center gap-1.5">
            <Users size={13} /> Team Members ({members.length})
          </h3>
        </div>
        {members.length === 0 && !loadingMembers ? (
          <div className="p-4 text-center text-[13px] text-muted-foreground">No members yet. You may need to add yourself first.</div>
        ) : (
          <div className="divide-y">
            {members.map(m => (
              <div key={m.id} className="px-4 py-2.5 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium truncate">
                    {m.profile?.first_name} {m.profile?.last_name}
                    {m.user_id === user?.id && <span className="text-[10px] text-muted-foreground ml-1">(you)</span>}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{m.profile?.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded",
                    m.org_role === "owner" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {roles.find(r => r.value === m.org_role)?.label || m.org_role}
                  </span>
                  {isOwnerOrAdmin && m.user_id !== user?.id && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeMutation.mutate(m.id)} disabled={removeMutation.isPending}>
                      <Trash2 size={12} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="rounded-lg bg-card border">
          <div className="px-4 py-2.5 border-b">
            <h3 className="text-[13px] font-semibold flex items-center gap-1.5">
              <Clock size={13} /> Pending Invites ({invites.length})
            </h3>
          </div>
          <div className="divide-y">
            {invites.map(inv => (
              <div key={inv.id} className="px-4 py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium">{inv.email}</p>
                  <p className="text-[10px] text-muted-foreground">Invited {formatRelative(inv.created_at)}</p>
                </div>
                <span className="text-[10px] font-medium bg-warning/10 text-warning px-1.5 py-0.5 rounded">
                  {roles.find(r => r.value === inv.org_role)?.label || inv.org_role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite form */}
      {isOwnerOrAdmin && (
        <div className="rounded-lg bg-card border p-4">
          <h3 className="text-[13px] font-semibold flex items-center gap-1.5 mb-3">
            <UserPlus size={13} /> Invite Team Member
          </h3>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                placeholder="teammate@example.com" className="h-8 text-sm"
              />
            </div>
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {roles.filter(r => r.value !== "owner").map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="h-8 text-xs gap-1" onClick={() => inviteMutation.mutate()} disabled={inviteMutation.isPending || !inviteEmail.trim()}>
              <Mail size={12} /> Invite
            </Button>
          </div>
        </div>
      )}

      {/* Permissions summary */}
      <div className="rounded-lg bg-card border p-4">
        <h3 className="text-[13px] font-semibold flex items-center gap-1.5 mb-3">
          <Shield size={13} /> Role Permissions
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Role</th>
                <th className="pb-2 px-2 font-medium text-center">Fields</th>
                <th className="pb-2 px-2 font-medium text-center">Jobs</th>
                <th className="pb-2 px-2 font-medium text-center">Quotes</th>
                <th className="pb-2 px-2 font-medium text-center">Financials</th>
                <th className="pb-2 px-2 font-medium text-center">Contracts</th>
                <th className="pb-2 px-2 font-medium text-center">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {roles.map(role => {
                const perms = getDefaultPermissions(role.value, activeMode);
                return (
                  <tr key={role.value}>
                    <td className="py-1.5 pr-4 font-medium">{role.label}</td>
                    {["fields", "jobs", "quotes", "financials", "contracts", "settings"].map(res => (
                      <td key={res} className="py-1.5 px-2 text-center">
                        {perms[res] ? <Check size={10} className="inline text-success" /> : <span className="text-muted-foreground">—</span>}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getDefaultPermissions(role: string, mode: string): Record<string, boolean> {
  const all = { fields: true, jobs: true, quotes: true, financials: true, contracts: true, settings: true };
  const none = { fields: false, jobs: false, quotes: false, financials: false, contracts: false, settings: false };
  switch (role) {
    case "owner": return all;
    case "admin": return all;
    case "farm_manager": return { ...all, settings: false };
    case "dispatcher": return { ...all, financials: false, settings: false };
    case "agronomist": return { fields: true, jobs: true, quotes: false, financials: false, contracts: false, settings: false };
    case "crew_member": return { fields: false, jobs: true, quotes: false, financials: false, contracts: false, settings: false };
    case "office_manager": return { ...all, fields: false };
    case "accountant": return { fields: false, jobs: true, quotes: true, financials: true, contracts: true, settings: false };
    case "member": return { fields: true, jobs: true, quotes: false, financials: false, contracts: false, settings: false };
    default: return none;
  }
}
