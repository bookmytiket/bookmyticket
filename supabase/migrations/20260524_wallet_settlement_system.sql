-- Payment Settlement and Wallet Modules Schema

-- 1. Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_type TEXT NOT NULL CHECK (wallet_type IN ('admin', 'organizer')),
    balance NUMERIC(10, 2) DEFAULT 0.00,
    pending_balance NUMERIC(10, 2) DEFAULT 0.00,
    currency TEXT DEFAULT 'INR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, wallet_type)
);

-- 2. Wallet Transactions Table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit', 'refund', 'settlement', 'withdrawal')),
    amount NUMERIC(10, 2) NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Booking Financials Table
CREATE TABLE IF NOT EXISTS public.booking_financials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE,
    ticket_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discounted_ticket_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    platform_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    gst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    gateway_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    final_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
    organizer_credit NUMERIC(10, 2) NOT NULL DEFAULT 0,
    admin_credit NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Payout Requests Table
CREATE TABLE IF NOT EXISTS public.payout_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organizer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    bank_details JSONB,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT
);

-- 5. Organizer Revenue Ledger Table
CREATE TABLE IF NOT EXISTS public.organizer_revenue_ledger (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organizer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE,
    gross_ticket_revenue NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    net_organizer_revenue NUMERIC(10, 2) NOT NULL DEFAULT 0,
    settlement_credit_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    settlement_status TEXT DEFAULT 'pending' CHECK (settlement_status IN ('pending', 'credited', 'settled', 'reversed', 'failed')),
    wallet_transaction_id UUID REFERENCES public.wallet_transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Settlement Reconciliation Logs Table
CREATE TABLE IF NOT EXISTS public.settlement_reconciliation_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE,
    customer_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
    organizer_expected NUMERIC(10, 2) NOT NULL DEFAULT 0,
    organizer_actual NUMERIC(10, 2) NOT NULL DEFAULT 0,
    admin_expected NUMERIC(10, 2) NOT NULL DEFAULT 0,
    admin_actual NUMERIC(10, 2) NOT NULL DEFAULT 0,
    variance_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('matched', 'mismatch', 'manual_review', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_wallets_modtime ON public.wallets;
CREATE TRIGGER update_wallets_modtime BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

DROP TRIGGER IF EXISTS update_orl_modtime ON public.organizer_revenue_ledger;
CREATE TRIGGER update_orl_modtime BEFORE UPDATE ON public.organizer_revenue_ledger FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

DROP TRIGGER IF EXISTS update_srl_modtime ON public.settlement_reconciliation_logs;
CREATE TRIGGER update_srl_modtime BEFORE UPDATE ON public.settlement_reconciliation_logs FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

-- RLS Policies
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_revenue_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_reconciliation_logs ENABLE ROW LEVEL SECURITY;

-- Allow reading own wallet
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
-- Allow reading own wallet transactions
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions FOR SELECT USING (wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid()));
-- Allow reading own payout requests
CREATE POLICY "Users can view own payouts" ON public.payout_requests FOR SELECT USING (auth.uid() = organizer_id);
-- Allow creating own payout requests
CREATE POLICY "Users can request payouts" ON public.payout_requests FOR INSERT WITH CHECK (auth.uid() = organizer_id);
-- Allow reading own organizer revenue ledger
CREATE POLICY "Users can view own revenue ledger" ON public.organizer_revenue_ledger FOR SELECT USING (auth.uid() = organizer_id);

-- Wait, Admin access needs to be full access for all these tables. We can create an RPC to execute logic, but since it's an admin dashboard we can bypass RLS via Service Role API.
