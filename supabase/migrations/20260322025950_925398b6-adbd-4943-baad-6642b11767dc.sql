
-- Fix overly permissive INSERT policies
DROP POLICY IF EXISTS "Threads insert" ON public.message_threads;
CREATE POLICY "Threads insert" ON public.message_threads FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.thread_participants tp WHERE tp.thread_id = id AND tp.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Participants insert" ON public.thread_participants;
CREATE POLICY "Participants insert" ON public.thread_participants FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Audit insert" ON public.audit_logs;
CREATE POLICY "Audit insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Notifications insert" ON public.notifications;
CREATE POLICY "Notifications insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR user_id = auth.uid()
);
