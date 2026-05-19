-- Add RLS policies for service_providers to allow auto-initialization and management by vendors
CREATE POLICY "Users can insert their own service_provider record"
ON public.service_providers
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can select their own service_provider record"
ON public.service_providers
FOR SELECT
USING (auth.uid() = id OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Users can update their own service_provider record"
ON public.service_providers
FOR UPDATE
USING (auth.uid() = id OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Also allow public viewing for the service details (needed for landing pages)
CREATE POLICY "Public can view service_providers"
ON public.service_providers
FOR SELECT
USING (status = 'active');
