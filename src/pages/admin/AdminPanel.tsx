import { useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatCurrency, formatDate, formatRelative, formatOperationType } from "@/lib/format";
import {
  Users as UsersIcon, Briefcase, DollarSign, LifeBuoy, Settings as SettingsIcon,
  Activity, ShieldAlert, ShieldCheck, Search, ExternalLink, Save, UserX, UserCheck,
  Download, TrendingUp, BarChart3, MapPin, Filter,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const startOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
};

/** Returns the start-of-week date (Mon) for a given date. */
function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // 0 = Mon
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

/** Format a date as MM/DD label for charts. */
function weekLabel(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const PRIORITY_TONE: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-secondary text-secondary-foreground",
  high: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  urgent: "bg-destructive/15 text-destructive",
};

const STATUS_TONE: Record<string, string> = {
  open: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  in_progress: "bg-primary/15 text-primary",
  resolved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  closed: "bg-muted text-muted-foreground",
};

// ─────────────────────────────────────────────────────────────
// Overview Tab
// ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const monthStart = startOfMonth();
      const [
        usersTotal,
        growers,
        operators,
        jobsThisMonth,
        jobsCompletedThisMonth,
        jobsPending,
        unverifiedCreds,
        feeRows,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "grower"),
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "operator"),
        supabase.from("jobs").select("*", { count: "exact", head: true }).gte("created_at", monthStart),
        supabase.from("jobs").select("*", { count: "exact", head: true })
          .gte("created_at", monthStart).in("status", ["completed", "approved", "paid", "closed"]),
        supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("credentials").select("*", { count: "exact", head: true }).eq("is_verified", false),
        supabase.from("jobs").select("platform_fee_cents, stripe_fee_cents").not("platform_fee_cents", "is", null),
      ]);

      const platformRevenue = (feeRows.data || []).reduce(
        (sum, r: any) => sum + ((r.platform_fee_cents || 0) - (r.stripe_fee_cents || 0)),
        0,
      );

      return {
        users: usersTotal.count ?? 0,
        growers: growers.count ?? 0,
        operators: operators.count ?? 0,
        jobsThisMonth: jobsThisMonth.count ?? 0,
        jobsCompletedThisMonth: jobsCompletedThisMonth.count ?? 0,
        jobsPending: jobsPending.count ?? 0,
        unverifiedCreds: unverifiedCreds.count ?? 0,
        platformRevenue: platformRevenue / 100,
      };
    },
  });

  const cards = [
    { label: "Total users", value: data?.users ?? "—", icon: UsersIcon },
    { label: "Active growers", value: data?.growers ?? "—", icon: UsersIcon },
    { label: "Active operators", value: data?.operators ?? "—", icon: UsersIcon },
    { label: "Jobs posted (mo)", value: data?.jobsThisMonth ?? "—", icon: Briefcase },
    { label: "Jobs completed (mo)", value: data?.jobsCompletedThisMonth ?? "—", icon: Activity },
    { label: "Pending approval", value: data?.jobsPending ?? "—", icon: ShieldAlert },
    { label: "Unverified credentials", value: data?.unverifiedCreds ?? "—", icon: ShieldCheck },
    { label: "Platform revenue", value: data ? formatCurrency(data.platformRevenue) : "—", icon: DollarSign },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4 flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{c.label}</div>
              <div className="text-xl font-semibold mt-1">{isLoading ? "…" : c.value}</div>
            </div>
            <c.icon className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Platform Analytics (lives inside the Overview tab)
// ─────────────────────────────────────────────────────────────
function PlatformAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      // 8-week window
      const now = new Date();
      const weekStart = startOfWeek(now);
      const eightWeeksAgo = new Date(weekStart);
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 7 * 7); // include current week
      const fromISO = eightWeeksAgo.toISOString();

      const [
        signups,
        jobs,
        statesRes,
        opTypesRes,
        funnelTotal,
        funnelOnboarded,
        funnelFirstJob,
        funnelFirstQuote,
        funnelFirstPayment,
      ] = await Promise.all([
        supabase.from("profiles").select("created_at").gte("created_at", fromISO).limit(5000),
        supabase.from("jobs").select("created_at, operation_type").gte("created_at", fromISO).limit(5000),
        supabase.from("profiles").select("state").not("state", "is", null).limit(5000),
        supabase.from("jobs").select("operation_type").limit(5000),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("onboarding_completed", true),
        supabase.from("user_events").select("user_id", { count: "exact", head: true }).eq("event_type", "first_job_posted"),
        supabase.from("user_events").select("user_id", { count: "exact", head: true }).eq("event_type", "first_quote_submitted"),
        supabase.from("user_events").select("user_id", { count: "exact", head: true }).eq("event_type", "job_funded"),
      ]);

      // Build 8 week buckets (oldest → newest)
      const buckets: { label: string; weekStart: Date; signups: number; jobs: number }[] = [];
      for (let i = 7; i >= 0; i--) {
        const wkStart = new Date(weekStart);
        wkStart.setDate(wkStart.getDate() - i * 7);
        buckets.push({ label: weekLabel(wkStart), weekStart: wkStart, signups: 0, jobs: 0 });
      }
      const findBucket = (date: Date) => {
        for (let i = buckets.length - 1; i >= 0; i--) {
          if (date >= buckets[i].weekStart) return buckets[i];
        }
        return null;
      };
      (signups.data || []).forEach((r: any) => {
        const b = findBucket(new Date(r.created_at));
        if (b) b.signups += 1;
      });
      (jobs.data || []).forEach((r: any) => {
        const b = findBucket(new Date(r.created_at));
        if (b) b.jobs += 1;
      });

      // Top states
      const stateCounts = new Map<string, number>();
      (statesRes.data || []).forEach((r: any) => {
        if (!r.state) return;
        stateCounts.set(r.state, (stateCounts.get(r.state) || 0) + 1);
      });
      const topStates = Array.from(stateCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([state, count]) => ({ state, count }));

      // Top operation types
      const opCounts = new Map<string, number>();
      (opTypesRes.data || []).forEach((r: any) => {
        if (!r.operation_type) return;
        opCounts.set(r.operation_type, (opCounts.get(r.operation_type) || 0) + 1);
      });
      const topOps = Array.from(opCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([op, count]) => ({ op: formatOperationType(op), count }));

      const funnel = {
        signed_up: funnelTotal.count ?? 0,
        onboarded: funnelOnboarded.count ?? 0,
        first_action: (funnelFirstJob.count ?? 0) + (funnelFirstQuote.count ?? 0),
        first_payment: funnelFirstPayment.count ?? 0,
      };

      return {
        weekly: buckets.map((b) => ({ label: b.label, signups: b.signups, jobs: b.jobs })),
        topStates,
        topOps,
        funnel,
      };
    },
  });

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Platform analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Loading…</CardContent>
      </Card>
    );
  }

  // Funnel drop-offs
  const funnelSteps = [
    { label: "Signed up", count: data.funnel.signed_up },
    { label: "Onboarding complete", count: data.funnel.onboarded },
    { label: "First job / quote", count: data.funnel.first_action },
    { label: "First payment", count: data.funnel.first_payment },
  ];
  const maxFunnel = Math.max(1, ...funnelSteps.map((s) => s.count));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Platform analytics</h2>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* Signups per week */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-1.5">
              <UsersIcon className="h-3 w-3" /> Signups · last 8 weeks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.weekly}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                <Bar dataKey="signups" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Jobs per week */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3" /> Jobs posted · last 8 weeks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data.weekly}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                <Line type="monotone" dataKey="jobs" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {/* Funnel */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-1.5">
              <Filter className="h-3 w-3" /> User funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {funnelSteps.map((s, i) => {
              const prev = i === 0 ? s.count : funnelSteps[i - 1].count;
              const dropPct = i === 0 || prev === 0 ? 0 : Math.round(((prev - s.count) / prev) * 100);
              return (
                <div key={s.label} className="space-y-1">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-medium">{s.label}</span>
                    <span className="tabular-nums">
                      {s.count}
                      {i > 0 && (
                        <span className="text-[10px] text-muted-foreground ml-1.5">
                          {dropPct > 0 ? `−${dropPct}%` : "0%"}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-1.5 rounded bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(s.count / maxFunnel) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Top states */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-1.5">
              <MapPin className="h-3 w-3" /> Top states by users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topStates.length === 0 ? (
              <p className="text-xs text-muted-foreground">No state data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.topStates} layout="vertical" margin={{ left: 8 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis dataKey="state" type="category" tick={{ fontSize: 10 }} width={32} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top operation types */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-1.5">
              <Briefcase className="h-3 w-3" /> Popular operation types
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topOps.length === 0 ? (
              <p className="text-xs text-muted-foreground">No job data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.topOps} layout="vertical" margin={{ left: 8 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis dataKey="op" type="category" tick={{ fontSize: 9 }} width={90} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Users Tab
// ─────────────────────────────────────────────────────────────
function UsersTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email, primary_account_type, onboarding_completed, suspended_at, created_at, phone, state, county, signup_date, utm_source, utm_medium, utm_campaign, referral_source")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;

      const ids = (data || []).map((p) => p.user_id);
      if (ids.length === 0) return [];
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", ids);
      const roleMap = new Map<string, string[]>();
      (roles || []).forEach((r: any) => {
        const list = roleMap.get(r.user_id) || [];
        list.push(r.role);
        roleMap.set(r.user_id, list);
      });
      return (data || []).map((p) => ({ ...p, roles: roleMap.get(p.user_id) || [] }));
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users || [];
    return (users || []).filter((u) =>
      [u.first_name, u.last_name, u.email].filter(Boolean).join(" ").toLowerCase().includes(q),
    );
  }, [users, search]);

  const drawerUser = useMemo(() => filtered.find((u) => u.user_id === drawerUserId), [filtered, drawerUserId]);

  // CSV export — current filtered list
  const exportCsv = () => {
    const escape = (v: any) => {
      if (v == null) return "";
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const header = [
      "email", "first_name", "last_name", "account_type", "state", "county",
      "signup_date", "utm_source", "utm_medium", "utm_campaign", "referral_source",
    ].join(",");
    const rows = filtered.map((u: any) =>
      [
        u.email, u.first_name, u.last_name, u.primary_account_type, u.state, u.county,
        u.signup_date || u.created_at, u.utm_source, u.utm_medium, u.utm_campaign, u.referral_source,
      ].map(escape).join(","),
    );
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prolifichire-users.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const addAdmin = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Admin role granted" });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) =>
      toast({ title: "Could not grant admin role", description: e.message, variant: "destructive" }),
  });

  const toggleSuspend = useMutation({
    mutationFn: async ({ userId, suspend }: { userId: string; suspend: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ suspended_at: suspend ? new Date().toISOString() : null })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      toast({ title: vars.suspend ? "User suspended" : "User reinstated" });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) =>
      toast({ title: "Could not update user", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            className="pl-8 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs text-muted-foreground ml-auto">
          {isLoading ? "Loading…" : `${filtered.length} user${filtered.length === 1 ? "" : "s"}`}
        </span>
        <Button size="sm" variant="outline" className="h-9 gap-1.5" onClick={exportCsv} disabled={!filtered.length}>
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Account type</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Onboarding</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => {
              const isSuspended = !!u.suspended_at;
              const isAdmin = u.roles.includes("admin");
              return (
                <TableRow key={u.user_id} className={isSuspended ? "opacity-60" : ""}>
                  <TableCell className="font-medium">
                    {(u.first_name || "—") + " " + (u.last_name || "")}
                    {isSuspended && <Badge variant="destructive" className="ml-2 text-[10px]">Suspended</Badge>}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{u.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(u.roles.length ? u.roles : ["—"]).map((r) => (
                        <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{u.primary_account_type || "—"}</TableCell>
                  <TableCell className="text-xs">{u.created_at ? formatDate(u.created_at) : "—"}</TableCell>
                  <TableCell>
                    {u.onboarding_completed ? (
                      <Badge variant="outline" className="text-[10px]">Complete</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">In progress</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => setDrawerUserId(u.user_id)}>
                        View
                      </Button>
                      {!isAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => addAdmin.mutate(u.user_id)}
                          disabled={addAdmin.isPending}
                        >
                          + Admin
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={isSuspended ? "outline" : "ghost"}
                        onClick={() => toggleSuspend.mutate({ userId: u.user_id, suspend: !isSuspended })}
                        disabled={toggleSuspend.isPending}
                      >
                        {isSuspended ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={!!drawerUserId} onOpenChange={(o) => !o && setDrawerUserId(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{drawerUser ? `${drawerUser.first_name || ""} ${drawerUser.last_name || ""}`.trim() || "User" : "User"}</SheetTitle>
            <SheetDescription>{drawerUser?.email}</SheetDescription>
          </SheetHeader>
          {drawerUser && (
            <dl className="mt-5 space-y-3 text-sm">
              <Row label="User ID"><code className="text-[11px]">{drawerUser.user_id}</code></Row>
              <Row label="Phone">{drawerUser.phone || "—"}</Row>
              <Row label="Account type">{drawerUser.primary_account_type || "—"}</Row>
              <Row label="Roles">{(drawerUser.roles.length ? drawerUser.roles : ["—"]).join(", ")}</Row>
              <Row label="Onboarding">{drawerUser.onboarding_completed ? "Complete" : "In progress"}</Row>
              <Row label="Joined">{drawerUser.created_at ? formatDate(drawerUser.created_at) : "—"}</Row>
              <Row label="Suspended">{drawerUser.suspended_at ? formatDate(drawerUser.suspended_at) : "No"}</Row>
            </dl>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <dt className="text-xs text-muted-foreground uppercase tracking-wide">{label}</dt>
      <dd className="col-span-2 text-sm">{children}</dd>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Jobs Tab
// ─────────────────────────────────────────────────────────────
function JobsTab() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [opFilter, setOpFilter] = useState<string>("all");

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["admin-jobs", statusFilter, opFilter],
    queryFn: async () => {
      let q = supabase
        .from("jobs")
        .select("id, display_id, title, status, operation_type, total_acres, created_at, requested_by, operator_id, estimated_total")
        .order("created_at", { ascending: false })
        .limit(500);
      if (statusFilter !== "all") q = q.eq("status", statusFilter as any);
      if (opFilter !== "all") q = q.eq("operation_type", opFilter as any);
      const { data, error } = await q;
      if (error) throw error;

      const userIds = Array.from(new Set([
        ...(data || []).map((j) => j.requested_by).filter(Boolean),
        ...(data || []).map((j) => j.operator_id).filter(Boolean),
      ])) as string[];
      let nameMap = new Map<string, string>();
      if (userIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", userIds);
        (profs || []).forEach((p) =>
          nameMap.set(p.user_id, `${p.first_name || ""} ${p.last_name || ""}`.trim() || "—"),
        );
      }
      return (data || []).map((j) => ({
        ...j,
        grower: nameMap.get(j.requested_by) || "—",
        operator: j.operator_id ? nameMap.get(j.operator_id) || "—" : "—",
      }));
    },
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {["draft","requested","quoted","accepted","scheduled","in_progress","completed","approved","paid","closed","cancelled","disputed"].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={opFilter} onValueChange={setOpFilter}>
          <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Operation" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All operations</SelectItem>
            {["spraying","planting","harvest","tillage","hauling","grain_hauling","scouting","soil_sampling","fertilizing","seeding","mowing","baling","drainage","rock_picking","other"].map((o) => (
              <SelectItem key={o} value={o}>{formatOperationType(o)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto self-center">
          {isLoading ? "Loading…" : `${jobs?.length ?? 0} jobs`}
        </span>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job</TableHead>
              <TableHead>Grower</TableHead>
              <TableHead>Operator</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Acres</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(jobs || []).map((j) => (
              <TableRow key={j.id}>
                <TableCell className="font-medium text-xs">
                  <div>{j.display_id}</div>
                  <div className="text-muted-foreground text-[11px] truncate max-w-[180px]">{j.title}</div>
                </TableCell>
                <TableCell className="text-xs">{j.grower}</TableCell>
                <TableCell className="text-xs">{j.operator}</TableCell>
                <TableCell className="text-xs">{formatOperationType(j.operation_type)}</TableCell>
                <TableCell className="text-xs">{Number(j.total_acres || 0).toFixed(1)}</TableCell>
                <TableCell><Badge variant="secondary" className="text-[10px]">{j.status}</Badge></TableCell>
                <TableCell className="text-xs">{formatRelative(j.created_at)}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" asChild>
                    <Link to={`/jobs/${j.id}`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && (jobs?.length ?? 0) === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                  No jobs match filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Payments Tab
// ─────────────────────────────────────────────────────────────
function PaymentsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("id, display_id, total, fees, status, created_at, issued_by, issued_to, job_id")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;

      const jobIds = (invoices || []).map((i) => i.job_id).filter(Boolean);
      let jobMap = new Map<string, any>();
      if (jobIds.length) {
        const { data: jobs } = await supabase
          .from("jobs")
          .select("id, platform_fee_cents, stripe_fee_cents, grower_charge_cents, operator_payout_cents")
          .in("id", jobIds);
        (jobs || []).forEach((j) => jobMap.set(j.id, j));
      }

      const userIds = Array.from(new Set([
        ...(invoices || []).map((i) => i.issued_by),
        ...(invoices || []).map((i) => i.issued_to),
      ])).filter(Boolean) as string[];
      let nameMap = new Map<string, string>();
      if (userIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", userIds);
        (profs || []).forEach((p) =>
          nameMap.set(p.user_id, `${p.first_name || ""} ${p.last_name || ""}`.trim() || "—"),
        );
      }

      const enriched = (invoices || []).map((i) => {
        const j = jobMap.get(i.job_id) || {};
        return {
          ...i,
          grower: nameMap.get(i.issued_to) || "—",
          operator: nameMap.get(i.issued_by) || "—",
          platformFee: (j.platform_fee_cents || 0) / 100,
          stripeFee: (j.stripe_fee_cents || 0) / 100,
        };
      });

      const totals = enriched.reduce(
        (acc, r) => ({
          processed: acc.processed + Number(r.total || 0),
          platformFees: acc.platformFees + r.platformFee,
          stripeFees: acc.stripeFees + r.stripeFee,
        }),
        { processed: 0, platformFees: 0, stripeFees: 0 },
      );

      return { rows: enriched, totals };
    },
  });

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Total processed</div>
            <div className="text-xl font-semibold mt-1">
              {data ? formatCurrency(data.totals.processed) : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Platform fees collected</div>
            <div className="text-xl font-semibold mt-1">
              {data ? formatCurrency(data.totals.platformFees) : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Stripe fees paid</div>
            <div className="text-xl font-semibold mt-1">
              {data ? formatCurrency(data.totals.stripeFees) : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Grower</TableHead>
              <TableHead>Operator</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Platform fee</TableHead>
              <TableHead className="text-right">Stripe fee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.rows || []).map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium text-xs">{r.display_id}</TableCell>
                <TableCell className="text-xs">{r.grower}</TableCell>
                <TableCell className="text-xs">{r.operator}</TableCell>
                <TableCell className="text-right text-xs">{formatCurrency(Number(r.total || 0))}</TableCell>
                <TableCell className="text-right text-xs">{formatCurrency(r.platformFee)}</TableCell>
                <TableCell className="text-right text-xs">{formatCurrency(r.stripeFee)}</TableCell>
                <TableCell><Badge variant="secondary" className="text-[10px]">{r.status}</Badge></TableCell>
                <TableCell className="text-xs">{formatDate(r.created_at)}</TableCell>
              </TableRow>
            ))}
            {!isLoading && (data?.rows.length ?? 0) === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                  No payments yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Support Tickets Tab
// ─────────────────────────────────────────────────────────────
function SupportTab() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["admin-tickets", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data, error } = await q;
      if (error) throw error;

      const userIds = Array.from(new Set((data || []).map((t) => t.user_id))).filter(Boolean);
      let nameMap = new Map<string, { name: string; email: string }>();
      if (userIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, email")
          .in("user_id", userIds);
        (profs || []).forEach((p) =>
          nameMap.set(p.user_id, {
            name: `${p.first_name || ""} ${p.last_name || ""}`.trim() || "—",
            email: p.email || "",
          }),
        );
      }
      return (data || []).map((t) => ({
        ...t,
        userName: nameMap.get(t.user_id)?.name || "—",
        userEmail: nameMap.get(t.user_id)?.email || "",
      }));
    },
  });

  const active = useMemo(() => tickets?.find((t) => t.id === activeId), [tickets, activeId]);

  type TicketPatch = {
    status?: "open" | "in_progress" | "resolved" | "closed";
    priority?: "low" | "normal" | "high" | "urgent";
    resolved_at?: string | null;
    assigned_to?: string | null;
  };
  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: TicketPatch }) => {
      const { error } = await supabase.from("support_tickets").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Ticket updated" });
      qc.invalidateQueries({ queryKey: ["admin-tickets"] });
    },
    onError: (e: any) =>
      toast({ title: "Could not update ticket", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto self-center">
          {isLoading ? "Loading…" : `${tickets?.length ?? 0} tickets`}
        </span>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>From</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(tickets || []).map((t) => (
              <TableRow key={t.id} className="cursor-pointer" onClick={() => setActiveId(t.id)}>
                <TableCell className="font-medium text-xs max-w-[260px] truncate">{t.subject}</TableCell>
                <TableCell className="text-xs">
                  <div>{t.userName}</div>
                  <div className="text-muted-foreground text-[11px]">{t.userEmail}</div>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${PRIORITY_TONE[t.priority] || ""}`}>{t.priority}</span>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${STATUS_TONE[t.status] || ""}`}>{t.status}</span>
                </TableCell>
                <TableCell className="text-xs">{formatRelative(t.created_at)}</TableCell>
              </TableRow>
            ))}
            {!isLoading && (tickets?.length ?? 0) === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                  No tickets
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={!!activeId} onOpenChange={(o) => !o && setActiveId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-base">{active?.subject}</SheetTitle>
            <SheetDescription>
              From {active?.userName} ({active?.userEmail}) ·{" "}
              {active ? formatDate(active.created_at) : ""}
            </SheetDescription>
          </SheetHeader>
          {active && (
            <div className="mt-5 space-y-4">
              <div>
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Description</Label>
                <p className="mt-1 text-sm whitespace-pre-wrap rounded border bg-muted/30 p-3">
                  {active.description}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px]">Status</Label>
                  <Select
                    value={active.status}
                    onValueChange={(v) =>
                      update.mutate({
                        id: active.id,
                        patch: {
                          status: v as TicketPatch["status"],
                          resolved_at: v === "resolved" ? new Date().toISOString() : null,
                        },
                      })
                    }
                  >
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[11px]">Priority</Label>
                  <Select
                    value={active.priority}
                    onValueChange={(v) =>
                      update.mutate({ id: active.id, patch: { priority: v as TicketPatch["priority"] } })
                    }
                  >
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Platform Settings Tab
// ─────────────────────────────────────────────────────────────
function SettingsTab() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .order("key", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const [edits, setEdits] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("platform_settings")
        .update({ value, updated_by: user?.id })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast({ title: `Saved ${vars.key}` });
      setEdits((prev) => {
        const next = { ...prev };
        delete next[vars.key];
        return next;
      });
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (e: any) =>
      toast({ title: "Could not save setting", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Platform settings</CardTitle>
          <p className="text-xs text-muted-foreground">
            Display-only for now — fee values here are documentation. Live payment math is hardcoded in the
            Stripe edge functions.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {(settings || []).map((s) => {
            const dirty = edits[s.key] !== undefined && edits[s.key] !== s.value;
            const value = edits[s.key] ?? s.value ?? "";
            return (
              <div key={s.key} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
                <div>
                  <div className="text-xs font-medium font-mono">{s.key}</div>
                  <div className="text-[11px] text-muted-foreground">{s.description}</div>
                </div>
                <Input
                  value={value}
                  onChange={(e) => setEdits((p) => ({ ...p, [s.key]: e.target.value }))}
                  className="h-9"
                />
                <Button
                  size="sm"
                  variant={dirty ? "default" : "outline"}
                  disabled={!dirty || save.isPending}
                  onClick={() => save.mutate({ key: s.key, value })}
                >
                  <Save className="h-3.5 w-3.5 mr-1" />
                  Save
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page wrapper
// ─────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { roles, loading } = useAuth();
  const [tab, setTab] = useState("overview");

  if (loading) return null;
  if (!roles.includes("admin")) return <Navigate to="/dashboard" replace />;

  return (
    <AppShell title="Admin Panel">
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Admin Panel</h1>
          <p className="text-xs text-muted-foreground">
            Platform oversight, user management, and support.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="overview"><Activity className="h-3.5 w-3.5 mr-1.5" /> Overview</TabsTrigger>
            <TabsTrigger value="users"><UsersIcon className="h-3.5 w-3.5 mr-1.5" /> Users</TabsTrigger>
            <TabsTrigger value="jobs"><Briefcase className="h-3.5 w-3.5 mr-1.5" /> Jobs</TabsTrigger>
            <TabsTrigger value="payments"><DollarSign className="h-3.5 w-3.5 mr-1.5" /> Payments</TabsTrigger>
            <TabsTrigger value="support"><LifeBuoy className="h-3.5 w-3.5 mr-1.5" /> Support</TabsTrigger>
            <TabsTrigger value="settings"><SettingsIcon className="h-3.5 w-3.5 mr-1.5" /> Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-6">
            <OverviewTab />
            <PlatformAnalytics />
          </TabsContent>
          <TabsContent value="users" className="mt-4"><UsersTab /></TabsContent>
          <TabsContent value="jobs" className="mt-4"><JobsTab /></TabsContent>
          <TabsContent value="payments" className="mt-4"><PaymentsTab /></TabsContent>
          <TabsContent value="support" className="mt-4"><SupportTab /></TabsContent>
          <TabsContent value="settings" className="mt-4"><SettingsTab /></TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
