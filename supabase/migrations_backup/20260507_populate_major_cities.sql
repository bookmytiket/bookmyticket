-- Add major cities to the hierarchical system
DO $$
DECLARE
    india_id UUID;
    tn_id UUID;
    ka_id UUID;
    mh_id UUID;
    dl_id UUID;
    pb_id UUID;
    cbe_dist_id UUID;
    che_dist_id UUID;
    blr_dist_id UUID;
    mum_dist_id UUID;
    del_dist_id UUID;
    abo_dist_id UUID;
BEGIN
    SELECT id INTO india_id FROM public.countries WHERE name = 'India';
    
    -- Ensure States
    INSERT INTO public.states (country_id, name) VALUES (india_id, 'Tamil Nadu') ON CONFLICT DO NOTHING;
    INSERT INTO public.states (country_id, name) VALUES (india_id, 'Karnataka') ON CONFLICT DO NOTHING;
    INSERT INTO public.states (country_id, name) VALUES (india_id, 'Maharashtra') ON CONFLICT DO NOTHING;
    INSERT INTO public.states (country_id, name) VALUES (india_id, 'Delhi') ON CONFLICT DO NOTHING;
    INSERT INTO public.states (country_id, name) VALUES (india_id, 'Punjab') ON CONFLICT DO NOTHING;

    SELECT id INTO tn_id FROM public.states WHERE name = 'Tamil Nadu' AND country_id = india_id;
    SELECT id INTO ka_id FROM public.states WHERE name = 'Karnataka' AND country_id = india_id;
    SELECT id INTO mh_id FROM public.states WHERE name = 'Maharashtra' AND country_id = india_id;
    SELECT id INTO dl_id FROM public.states WHERE name = 'Delhi' AND country_id = india_id;
    SELECT id INTO pb_id FROM public.states WHERE name = 'Punjab' AND country_id = india_id;

    -- Districts
    INSERT INTO public.districts (state_id, name) VALUES (tn_id, 'Coimbatore') ON CONFLICT DO NOTHING;
    INSERT INTO public.districts (state_id, name) VALUES (tn_id, 'Chennai') ON CONFLICT DO NOTHING;
    INSERT INTO public.districts (state_id, name) VALUES (ka_id, 'Bangalore') ON CONFLICT DO NOTHING;
    INSERT INTO public.districts (state_id, name) VALUES (mh_id, 'Mumbai') ON CONFLICT DO NOTHING;
    INSERT INTO public.districts (state_id, name) VALUES (dl_id, 'New Delhi') ON CONFLICT DO NOTHING;
    INSERT INTO public.districts (state_id, name) VALUES (pb_id, 'Fazilka') ON CONFLICT DO NOTHING;

    SELECT id INTO cbe_dist_id FROM public.districts WHERE name = 'Coimbatore' AND state_id = tn_id;
    SELECT id INTO che_dist_id FROM public.districts WHERE name = 'Chennai' AND state_id = tn_id;
    SELECT id INTO blr_dist_id FROM public.districts WHERE name = 'Bangalore' AND state_id = ka_id;
    SELECT id INTO mum_dist_id FROM public.districts WHERE name = 'Mumbai' AND state_id = mh_id;
    SELECT id INTO del_dist_id FROM public.districts WHERE name = 'New Delhi' AND state_id = dl_id;
    SELECT id INTO abo_dist_id FROM public.districts WHERE name = 'Fazilka' AND state_id = pb_id;

    -- Cities (Main entries)
    INSERT INTO public.cities (district_id, name, pincode) VALUES (cbe_dist_id, 'Coimbatore', '641001') ON CONFLICT DO NOTHING;
    INSERT INTO public.cities (district_id, name, pincode) VALUES (cbe_dist_id, 'Pollachi', '642001') ON CONFLICT DO NOTHING;
    INSERT INTO public.cities (district_id, name, pincode) VALUES (che_dist_id, 'Chennai', '600001') ON CONFLICT DO NOTHING;
    INSERT INTO public.cities (district_id, name, pincode) VALUES (blr_dist_id, 'Bengaluru', '560001') ON CONFLICT DO NOTHING;
    INSERT INTO public.cities (district_id, name, pincode) VALUES (mum_dist_id, 'Mumbai', '400001') ON CONFLICT DO NOTHING;
    INSERT INTO public.cities (district_id, name, pincode) VALUES (del_dist_id, 'New Delhi', '110001') ON CONFLICT DO NOTHING;
    INSERT INTO public.cities (district_id, name, pincode) VALUES (abo_dist_id, 'Abohar', '152116') ON CONFLICT DO NOTHING;
END $$;
