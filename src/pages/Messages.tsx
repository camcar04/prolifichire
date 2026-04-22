import AppShell from "@/components/layout/AppShell";
import { EmptyState } from "@/components/shared/EmptyState";
import { MessageSquare } from "lucide-react";

export default function Messages() {
  return (
    <AppShell title="Messages">
      <EmptyState
        icon={<MessageSquare className="h-6 w-6" />}
        title="Direct Messaging Coming Soon"
        description="In-platform messaging between growers and operators is being built. For now, use contact details from the job detail page to communicate directly."
      />
    </AppShell>
  );
}