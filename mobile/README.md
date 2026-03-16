# BookMyTicket Mobile

Native React Native (Expo) mobile app for BookMyTicket — event discovery, booking, and organiser ticket scanning.

## Features

- **Event Discovery**: Browse featured, trending, and all events from Convex
- **Event Details**: View event info, venue, pricing
- **Checkout & Payment**: Create bookings and proceed to payment
- **Authentication**: Sign in as user, organiser, or staff
- **QR Ticket Scanning**: Organisers/staff can scan tickets for check-in
- **Profile**: Account management and sign out

## Tech Stack

- **Expo SDK 55** with React Native
- **Convex** for backend (shared with web app)
- **React Navigation** (bottom tabs + stack)
- **expo-camera** for QR scanning

## Setup

1. **Install dependencies** (already done if you cloned):

   ```bash
   cd mobile && npm install
   ```

2. **Environment**: Set your Convex URL in `.env`:

   ```
   EXPO_PUBLIC_CONVEX_URL=https://tangible-possum-27.convex.cloud
   ```

3. **Run Convex** (from project root): Ensure Convex backend is running:

   ```bash
   cd .. && npx convex dev
   ```

4. **Start the app**:

   ```bash
   npm start
   ```

   Then press `a` for Android or `i` for iOS simulator.

## Android Build (AAB for Play Store)

1. **Install EAS CLI**:

   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Configure project** (first time):

   ```bash
   eas build:configure
   ```

3. **Build AAB** for production:

   ```bash
   eas build --platform android --profile production
   ```

   The AAB will be generated in the cloud. Download it for Play Console upload.

4. **Submit to Play Store**:

   - Create a [Google Play Console](https://play.google.com/console) app
   - Add `google-service-account.json` for automated submit (optional)
   - Run: `eas submit --platform android --profile production`

## Project Structure

```
mobile/
├── App.js                 # Entry with providers
├── app.json               # Expo config (name, slug, Android package)
├── eas.json               # EAS Build profiles
├── src/
│   ├── context/           # AuthContext, ConvexProvider
│   ├── navigation/        # AppNavigator, TabNavigator
│   ├── screens/           # Home, Events, EventDetail, Checkout, Payment, SignIn, Profile, OrganiserScanner
│   ├── components/        # EventCard
│   ├── utils/             # feeBreakdown, categoryMatch
│   └── data/              # homeEvents (static fallback)
└── convex/                # Shared with web (import from ../../convex)
```

## Convex Backend

The mobile app uses the same Convex deployment as the web app. The Convex API (`convex/_generated/`) is copied into the mobile project for EAS builds.

**When you update Convex schema or functions** (in the parent `convex/` folder), refresh the mobile copy:
```bash
cd .. && npx convex codegen
cp -r convex/_generated/* mobile/convex/_generated/
```
