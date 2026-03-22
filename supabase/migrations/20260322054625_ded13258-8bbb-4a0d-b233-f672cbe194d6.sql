-- Allow authenticated users to create their own organization during onboarding
CREATE POLICY "Users can create orgs"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update their own org (via profile link)
CREATE POLICY "Org members can update"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.organization_id = organizations.id AND p.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::user_role)
);

-- Allow authenticated users to insert their own role
CREATE POLICY "Users can insert own role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to add themselves as org members
CREATE POLICY "Users can join org"
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
