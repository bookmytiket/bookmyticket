-- Seed Coupons for Testing
INSERT INTO public.coupons (code, type, value, min_tickets, usage_limit_per_user, global_usage_limit, is_active)
VALUES 
('BULK10', 'percent', 10, 1, 5, 100, true),
('FLAT50', 'fixed', 50, 1, 1, 500, true),
('SAVE20', 'percent', 20, 2, 1, 200, true)
ON CONFLICT (code) DO UPDATE SET 
    type = EXCLUDED.type,
    value = EXCLUDED.value,
    min_tickets = EXCLUDED.min_tickets,
    usage_limit_per_user = EXCLUDED.usage_limit_per_user,
    global_usage_limit = EXCLUDED.global_usage_limit,
    is_active = EXCLUDED.is_active;
