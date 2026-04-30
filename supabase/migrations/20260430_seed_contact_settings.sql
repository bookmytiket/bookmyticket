-- Seed contact_page_settings in system_config
INSERT INTO public.system_config (key, value)
VALUES ('contact_page_settings', '{
  "header": {
    "title": "Get in Support",
    "description": "Have a general question for us? We''re here to help with any inquiries about our services."
  },
  "general_support": {
    "email": "support@bookmyticket.net",
    "phone": "+91 90420 29927"
  },
  "sales_team": {
    "india": "+91 97907 62727",
    "uae": "+971 55 747 2927",
    "singapore": "+60 14-210 7199"
  },
  "address": {
    "line1": "4th Floor, Ramani''s West Gate,",
    "line2": "No: 402C, Viswanathapuram,",
    "line3": "Thudiyalur, Coimbatore, Tamil Nadu",
    "pincode": "641034"
  },
  "hours": {
    "mon_fri": "9:30 AM - 6:30 PM IST",
    "sat": "9:30 AM - 1:30 PM IST",
    "sun": "We''re offline ( Day Off )"
  },
  "social": {
    "linkedin": "#",
    "instagram": "#",
    "facebook": "#",
    "twitter": "#"
  }
}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
