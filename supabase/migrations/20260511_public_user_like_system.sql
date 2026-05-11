-- Public User Like System for Events & Professional Services
-- Implementation of Event and Service Likes with Real-time synchronization

-- 1. Create event_likes table
CREATE TABLE IF NOT EXISTS public.event_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- 2. Create service_likes table
CREATE TABLE IF NOT EXISTS public.service_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, service_id)
);

-- 3. Create event_like_counts table (for caching)
CREATE TABLE IF NOT EXISTS public.event_like_counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE UNIQUE,
    total_likes INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create service_like_counts table (for caching)
CREATE TABLE IF NOT EXISTS public.service_like_counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE UNIQUE,
    total_likes INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create user_activity_logs table
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL, -- 'like_event', 'like_service', 'view_event', etc.
    reference_id UUID, -- event_id or service_id
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable RLS
ALTER TABLE public.event_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_like_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_like_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
-- Event Likes: Users can view all, but only manage their own
CREATE POLICY "Public can view event likes" ON public.event_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own event likes" ON public.event_likes 
    FOR ALL USING (auth.uid() = user_id);

-- Service Likes: Users can view all, but only manage their own
CREATE POLICY "Public can view service likes" ON public.service_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own service likes" ON public.service_likes 
    FOR ALL USING (auth.uid() = user_id);

-- Like Counts: Everyone can read
CREATE POLICY "Public can view event like counts" ON public.event_like_counts FOR SELECT USING (true);
CREATE POLICY "Public can view service like counts" ON public.service_like_counts FOR SELECT USING (true);

-- Activity Logs: Users can view their own, Admins can view all
CREATE POLICY "Users can view their own activity logs" ON public.user_activity_logs 
    FOR SELECT USING (auth.uid() = user_id);

-- 8. Real-time setup
ALTER TABLE public.event_likes REPLICA IDENTITY FULL;
ALTER TABLE public.service_likes REPLICA IDENTITY FULL;
ALTER TABLE public.event_like_counts REPLICA IDENTITY FULL;
ALTER TABLE public.service_like_counts REPLICA IDENTITY FULL;

-- 9. Triggers to update counts and log activity
-- Function for Event Likes
CREATE OR REPLACE FUNCTION handle_event_like_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.event_like_counts (event_id, total_likes)
        VALUES (NEW.event_id, 1)
        ON CONFLICT (event_id) DO UPDATE 
        SET total_likes = event_like_counts.total_likes + 1, updated_at = NOW();
        
        INSERT INTO public.user_activity_logs (user_id, activity_type, reference_id)
        VALUES (NEW.user_id, 'like_event', NEW.event_id);
        
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.event_like_counts 
        SET total_likes = GREATEST(0, total_likes - 1), updated_at = NOW()
        WHERE event_id = OLD.event_id;
        
        INSERT INTO public.user_activity_logs (user_id, activity_type, reference_id)
        VALUES (OLD.user_id, 'unlike_event', OLD.event_id);
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_event_like_change
AFTER INSERT OR DELETE ON public.event_likes
FOR EACH ROW EXECUTE FUNCTION handle_event_like_change();

-- Function for Service Likes
CREATE OR REPLACE FUNCTION handle_service_like_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.service_like_counts (service_id, total_likes)
        VALUES (NEW.service_id, 1)
        ON CONFLICT (service_id) DO UPDATE 
        SET total_likes = service_like_counts.total_likes + 1, updated_at = NOW();
        
        INSERT INTO public.user_activity_logs (user_id, activity_type, reference_id)
        VALUES (NEW.user_id, 'like_service', NEW.service_id);
        
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.service_like_counts 
        SET total_likes = GREATEST(0, total_likes - 1), updated_at = NOW()
        WHERE service_id = OLD.service_id;
        
        INSERT INTO public.user_activity_logs (user_id, activity_type, reference_id)
        VALUES (OLD.user_id, 'unlike_service', OLD.service_id);
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_service_like_change
AFTER INSERT OR DELETE ON public.service_likes
FOR EACH ROW EXECUTE FUNCTION handle_service_like_change();
