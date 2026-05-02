# BookMyTicket Unified Ecosystem 🌐📱

This repository contains both the **Next.js Web Portal** and the **Expo Mobile Application** (`/mobile`), both connected to a single Supabase backend for seamless data synchronization and unified management.

## 🔗 Single Backend Connection
Both applications connect to the same Supabase instance:
- **Web Portal:** Configured via `.env.local`
- **Mobile App:** Configured via `mobile/.env` using `EXPO_PUBLIC_*` variables

## 📊 Features
- **Real-time Sync:** Data added in the Admin Panel (Web) appears instantly in the Mobile App via PostgreSQL Realtime listeners.
- **Unified Auth:** Users can log in across both platforms with the same credentials.
- **Shared Storage:** All images and assets are stored in a centralized Supabase bucket.
- **Responsive Design:** The web portal is optimized for all screen sizes, while the mobile app provides a native experience.

## 🚀 Quick Start (Local Development)

To run both applications locally:

```bash
# Install root dependencies
npm install

# Run both Web (localhost:3000) and Mobile (Expo)
npm run dev:all
```

## 📂 Project Structure
- `/app`: Next.js pages and layouts (Web Portal).
- `/components`: Shared React components for the Web Portal.
- `/mobile`: Expo React Native application.
- `/supabase`: Supabase configuration and migrations.

---
Developed for a seamless, cross-platform ticketing experience.
