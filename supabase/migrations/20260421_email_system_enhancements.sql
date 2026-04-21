-- Add category to email_templates
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS category TEXT;

-- Update existing templates with categories
UPDATE public.email_templates SET category = 'Notification' WHERE identifier = 'booking';
UPDATE public.email_templates SET category = 'Notification' WHERE identifier = 'canceled';
UPDATE public.email_templates SET category = 'Welcome' WHERE identifier = 'registration';
UPDATE public.email_templates SET category = 'Password Reset' WHERE identifier = 'otp';

-- Insert additional required templates if they don't exist
INSERT INTO public.email_templates (identifier, name, subject, body, category, auto_send)
VALUES 
('welcome_registration', 'Welcome Email', 'Welcome to BookMyTicket!', 'Hello {{name}},\n\nWelcome to BookMyTicket! We are thrilled to have you with us.\n\nBest Regards,\nTeam BookMyTicket', 'Welcome', true),
('password_reset', 'Password Reset', 'Reset Your Password', 'Hello {{name}},\n\nYou requested a password reset. Click here to reset: {{reset_link}}\n\nIf you didn''t request this, please ignore this email.', 'Password Reset', true),
('new_event', 'New Event Notification', 'New Event: {{event_title}}', 'Hello {{name}},\n\nA new event "{{event_title}}" has been posted in {{city}}!\n\nCheck it out here: {{event_url}}', 'Notification', false),
('service_update', 'Professional Service Update', 'Update on {{service_name}}', 'Hello {{name}},\n\nWe have updates regarding {{service_name}} in the {{category}} category.\n\nView details: {{service_url}}', 'Service Update', false),
('promotional', 'Promotional Announcement', 'Special Offer Just for You!', 'Hello {{name}},\n\nWe have a special announcement: {{message}}\n\nDon''t miss out!', 'Promotional', false)
ON CONFLICT (identifier) DO NOTHING;
