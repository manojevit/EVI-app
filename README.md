# EVI-app — EVIT EV Charging App (Prototype)

A React Native + Expo prototype of the EVIT (EVI Technologies) EV-charging app.
**Design prototype only:** all data is sample data and there is no backend.

- **Framework:** Expo SDK 58 + Expo Router (file-based navigation)
- **Maps:** `react-native-maps` with Google Maps
- **Camera:** `expo-camera` for scanning charger QR codes
- **Delivery:** Android APK via EAS Build

---

## Screens

The app opens on **Login**. Screenshots of every screen are in [`screenshots/`](screenshots).

| Area | Screen | How to reach it |
|------|--------|-----------------|
| Sign in | **Login** (mobile number + consent) → **Verify OTP** | app launch |
| Map | **Map** with charger pins, search, filters, wallet | Map tab |
| Map | **Station list** | list button on the Map tab |
| Map | **Station detail**: chargers → connectors, distance + Navigate, "fits your car" | tap a pin or a station |
| Map | **Filters** sheet, **Notifications** | filter / bell buttons |
| Map | **Scan to charge**: camera QR scanner + enter charger ID | QR button |
| Charging | **Live session**: charge ring, power, energy, cost, time, Stop | Charging tab |
| Charging | **History** with month filter, Completed / Cancelled | receipt button |
| Account | Profile, wallet, menu, Log out | Account tab |
| Account | **My vehicles**, **Add a vehicle** (type → make → model, connectors auto-filled) | Account → My vehicles |
| Account | **Plans**, **Support**, **Profile** | Account menu |

---

## 1. Set up and run

```bash
npm install
cp .env.example .env.local      # then put your Google Maps key in .env.local
npx expo start
```

Scan the QR with **Expo Go** (Android) or the Camera app (iOS).

> **About the map in Expo Go:** `react-native-maps` isn't included in Expo Go, so the
> Map tab shows a placeholder there. Use the list button to browse stations. The real
> Google map appears in a development build or the APK.

---

## 2. Google Maps API key

The key is **not** stored in this repo. `app.config.js` reads `GOOGLE_MAPS_API_KEY` from
the environment and adds it to the iOS and Android config at build time.

- **Locally:** put it in `.env.local` (git-ignored). Expo loads it automatically.
- **EAS builds:** store it once as a sensitive EAS environment variable:

  ```bash
  eas env:create --name GOOGLE_MAPS_API_KEY --value <your-key> --environment preview --visibility sensitive
  ```

**Recommended:** in Google Cloud Console, restrict the key to the Android package
`com.evit.app` (and the iOS bundle ID) so it can't be used by other apps.

---

## 3. Build the APK (EAS)

```bash
npm install -g eas-cli
eas login
eas init                                   # first time only, links the project
eas build -p android --profile preview
```

EAS prints a link to download the `.apk`. Install it on any Android phone
(allow "Install unknown apps").

---

## Data and assets

| What | Where | Source |
|------|-------|--------|
| 7 connector types + icons | `src/data/connectors.ts`, `assets/images/connectors/` | EV_Connector_Data |
| 121 vehicle models → supported connectors | `src/data/vehicles.ts` (generated) | `1_Vehicle_Connector_List.txt` |
| Car photos (18 models) | `src/data/vehicle-images.ts`, `assets/images/vehicles/` | EVIT EV vehicle pack |
| Stations, sessions, wallet, tickets | `src/data/mock.ts` | sample data |
| Logo | `assets/images/logo-mark.png` | official EVIT logo |
| Login background | `assets/images/login-bg.jpg` | login page design |

Stations follow the real structure **station → chargers → connectors**. Distances are
straight-line from a sample point in central Delhi, since the prototype has no GPS.

---

## Design system

`src/constants/theme.ts` holds the palette, type and spacing. The palette is built on the
logo green `#20944C`: light green-tinted neutrals, one brand-green accent, amber only for
"in use", red only for stop/errors. Type is **Sora** (headings, numbers) and **Inter** (UI).

## Project structure

```
src/
  app/                 Expo Router screens
    (tabs)/            Map · Charging · Account (custom floating tab bar)
    station/[id].tsx   station detail
    login.tsx, otp.tsx, scan.tsx, history.tsx, vehicles.tsx, add-vehicle.tsx, ...
  components/          shared UI (charge ring, buttons, map, connector icon, ...)
  constants/theme.ts   design tokens
  data/                sample data, connectors, vehicles, vehicle photos
```
