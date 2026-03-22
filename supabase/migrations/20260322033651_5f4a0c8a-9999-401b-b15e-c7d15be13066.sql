
DROP POLICY "Pricing estimates insert" ON public.pricing_estimates;
CREATE POLICY "Pricing estimates insert" ON public.pricing_estimates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
