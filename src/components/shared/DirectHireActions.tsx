import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquare, Send, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Props {
  operatorUserId: string;
  operatorName: string;
  operatorProfileId: string;
}

export function DirectHireActions({ operatorUserId, operatorName, operatorProfileId }: Props) {
  const { user } = useAuth();
  const [msgOpen, setMsgOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  if (!user || user.id === operatorUserId) return null;

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      // Create or find thread
      const { data: existing } = await supabase
        .from("thread_participants")
        .select("thread_id")
        .eq("user_id", user.id);

      const { data: otherThreads } = await supabase
        .from("thread_participants")
        .select("thread_id")
        .eq("user_id", operatorUserId);

      const existingIds = (existing || []).map(t => t.thread_id);
      const otherIds = (otherThreads || []).map(t => t.thread_id);
      const sharedThread = existingIds.find(id => otherIds.includes(id));

      let threadId = sharedThread;

      if (!threadId) {
        const { data: newThread } = await supabase.from("message_threads").insert({ subject: `Direct message to ${operatorName}` }).select("id").single();
        if (!newThread) throw new Error("Failed to create thread");
        threadId = newThread.id;
        await supabase.from("thread_participants").insert([
          { thread_id: threadId, user_id: user.id },
          { thread_id: threadId, user_id: operatorUserId },
        ]);
      }

      await supabase.from("messages").insert({
        thread_id: threadId,
        sender_id: user.id,
        content: message.trim(),
      });

      toast.success("Message sent");
      setMessage("");
      setMsgOpen(false);
    } catch {
      toast.error("Failed to send message");
    }
    setSending(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Dialog open={msgOpen} onOpenChange={setMsgOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="gap-1.5">
            <MessageSquare size={13} /> Message
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Message {operatorName}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Write your message..."
            className="min-h-[100px] text-sm"
          />
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setMsgOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSendMessage} disabled={!message.trim() || sending} className="gap-1">
              <Send size={13} /> {sending ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button size="sm" className="gap-1.5" asChild>
        <a href={`/marketplace`}>
          <Briefcase size={13} /> Send Job
        </a>
      </Button>
    </div>
  );
}
