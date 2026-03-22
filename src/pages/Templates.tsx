import AppShell from "@/components/layout/AppShell";
import JobTemplatesManager from "@/components/templates/JobTemplatesManager";

export default function Templates() {
  return (
    <AppShell title="Templates">
      <JobTemplatesManager />
    </AppShell>
  );
}
