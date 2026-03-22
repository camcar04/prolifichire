import AppShell from "@/components/layout/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LaborJobList } from "@/components/labor/LaborJobList";
import { CreateLaborJobDialog } from "@/components/labor/CreateLaborJobDialog";
import { WorkerProfileEditor } from "@/components/labor/WorkerProfileEditor";
import { useMyApplications } from "@/hooks/useLaborJobs";
import { useAuth } from "@/contexts/AuthContext";
import { Users, FileText, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LaborMarketplace() {
  const { activeMode } = useAuth();
  const { data: myApps = [] } = useMyApplications();
  const isGrower = activeMode === "grower";

  return (
    <AppShell title="Labor Marketplace">
      <div className="animate-fade-in -mx-3 sm:-mx-5 -mt-2">
        <Tabs defaultValue="browse" className="w-full">
          <div className="sticky top-12 z-20 px-3 sm:px-5 py-2 bg-background/90 backdrop-blur-sm border-b flex items-center justify-between">
            <TabsList className="h-8">
              <TabsTrigger value="browse" className="text-[11px] h-7 gap-1">
                <Users size={11} /> Browse Positions
              </TabsTrigger>
              {!isGrower && (
                <>
                  <TabsTrigger value="applications" className="text-[11px] h-7 gap-1">
                    <FileText size={11} /> My Applications
                    {myApps.length > 0 && <span className="ml-1 text-[9px] bg-primary/20 text-primary px-1 rounded-full">{myApps.length}</span>}
                  </TabsTrigger>
                  <TabsTrigger value="profile" className="text-[11px] h-7 gap-1">
                    <User size={11} /> Worker Profile
                  </TabsTrigger>
                </>
              )}
            </TabsList>
            {isGrower && <CreateLaborJobDialog />}
          </div>

          <TabsContent value="browse" className="mt-0">
            <LaborJobList />
          </TabsContent>

          {!isGrower && (
            <TabsContent value="applications" className="mt-0">
              <div className="p-4 space-y-2">
                {myApps.length === 0 ? (
                  <div className="text-center py-10">
                    <FileText size={24} className="mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-[13px] font-medium">No applications yet</p>
                    <p className="text-[11px] text-muted-foreground">Browse positions and apply to get started.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {myApps.map((app: any) => {
                      const job = app.labor_jobs;
                      const statusColors: Record<string, string> = {
                        applied: "bg-info/10 text-info",
                        reviewing: "bg-chart-3/10 text-chart-3",
                        accepted: "bg-chart-2/10 text-chart-2",
                        rejected: "bg-destructive/10 text-destructive",
                        withdrawn: "bg-muted text-muted-foreground",
                      };
                      return (
                        <div key={app.id} className="py-3 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold truncate">{job?.title || "—"}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                              {job?.location_city && <span>{job.location_city}{job.location_state ? `, ${job.location_state}` : ""}</span>}
                              {job?.compensation_type && (
                                <>
                                  <span>·</span>
                                  <span>{job.compensation_min ? `$${job.compensation_min}` : ""} {job.compensation_type}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <span className={cn("text-[9px] font-semibold px-2 py-0.5 rounded-full", statusColors[app.status] || "bg-muted text-muted-foreground")}>
                            {app.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {!isGrower && (
            <TabsContent value="profile" className="mt-0">
              <div className="p-4">
                <WorkerProfileEditor />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppShell>
  );
}
