# EVI-app — EVIT EV Charging App (Prototype)

A React Native + Expo prototype of the EVIT (EVI Technologies) EV-charging app.
**Design prototype only:** all data is sample data and there is no backend.

- **Framework:** Expo SDK 58 + Expo Router (file-based navigation)
- **Maps:** MapLibre GL + OpenFreeMap (OpenStreetMap). Free, no API key, no billing
- **Camera:** `expo-camera` for scanning charger QR codes
- **Delivery:** Android APK via EAS Build

---

## Screens

The app opens with a launch animation, then **Onboarding** (3 slides), then **Login**.

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
npx expo start
```

Scan the QR with **Expo Go** (Android) or the Camera app (iOS).

---

## 2. The map (free, no key)

The Map tab and the first onboarding slide use **MapLibre GL JS** with
**OpenFreeMap** vector tiles (OpenStreetMap data), shown in a WebView
(`src/components/live-map*.ts(x)`). There is no API key, no billing and no usage limit,
and it works the same in Expo Go, the APK and the web build. Station pins are part of the
map page and open the station screen when tapped. The map needs an internet connection.

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

`src/constants/theme.ts` holds the palette, type and spacing. `src/constants/responsive.ts`
scales sizes to the phone's screen width (use `scaledSheet` instead of `StyleSheet.create`). The palette is built on the
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
