-- Create the vendorReviews table as requested
CREATE TABLE IF NOT EXISTS public."vendorReviews" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for vendorReviews
ALTER TABLE public."vendorReviews" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vendor reviews"
ON public."vendorReviews"
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can add reviews"
ON public."vendorReviews"
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create vendorBookings if it doesn't exist (relational version)
CREATE TABLE IF NOT EXISTS public."vendorBookings" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    service_type TEXT,
    booking_date DATE NOT NULL,
    total_amount INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Pending',
    customer_details JSONB DEFAULT '{}',
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for vendorBookings
ALTER TABLE public."vendorBookings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own bookings"
ON public."vendorBookings"
FOR ALL
USING (auth.uid() = user_id OR auth.uid() = vendor_id);

CREATE POLICY "Admins can view all bookings"
ON public."vendorBookings"
FOR SELECT
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
