# Kustard Employee Attendance

A location-based employee check-in/check-out web app built with Laravel, backed by a Google Sheet for live attendance tracking, with real-time weather effects and day/night theming.

## Screenshot

<img width="1920" height="1055" alt="image" src="https://github.com/user-attachments/assets/a35b95c2-6c31-4da8-bbb1-f747d562b0c0" />



*Employee attendance screen showing the shimmering header divider, weather-aware gradient banner, and geolocation-gated check-in/check-out form.*


## Features

- **Geolocation-gated check-in/check-out** — employees must be within a configurable radius (default 150m) of the office to mark attendance.
- **Google Sheets sync** — every check-in/check-out is appended/updated in a live Google Sheet alongside the local database, so HR can view attendance without opening the app.
- **Automatic retry + backfill** — failed Google Sheet writes (e.g. during account/billing suspensions) are retried automatically, with an Artisan command to backfill any records that still failed.
- **Live weather badge** — fetches real-time temperature and conditions (via Open-Meteo) for the employee's current location and displays it in the header.
- **Rain visual effects** — an animated canvas overlay automatically shows light rain, rain, or a thunderstorm (with lightning flashes) based on real weather conditions at the detected location.
- **Day/night theme** — automatically switches the UI palette after 6 PM based on the device clock, no manual toggle needed.
- **Holiday calendar** — recognizes a configurable list of holidays and Sundays, disabling attendance and showing a celebratory popup.
- **Working-hours tracker** — calculates and displays remaining working hours before check-out is allowed without a warning prompt.
- **Mobile-first UI** — built for phones/tablets used as an office kiosk, with touch-safe button handling and responsive layout.

## Tech Stack

- **Backend:** PHP / Laravel (Eloquent, Artisan commands)
- **Frontend:** Blade templates, vanilla JavaScript, SweetAlert2
- **Data storage:** MySQL/Postgres (via Eloquent) + Google Sheets (via Google Sheets API)
- **Weather data:** [Open-Meteo](https://open-meteo.com/) (free, no API key required)
- **Geolocation:** Browser Geolocation API + [Nominatim](https://nominatim.openstreetmap.org/) for reverse geocoding
- **Fonts:** Google Fonts (Poppins, Goldman)

## Project Structure

```
app/
  Http/Controllers/
    AttendanceController.php     # Check-in/out logic, DB + Sheet sync
  Console/Commands/
    BackfillAttendanceSheet.php  # Backfills records missing from the Sheet
  Services/
    GoogleSheetService.php       # Wraps Google Sheets API calls
  Models/
    Attendance.php
    Employees.php

resources/views/
  welcome.blade.php              # Main attendance page

public/
  Files/
    welcome.js                   # Frontend logic (geolocation, weather, UI state)
    kustard-logo.png
  welcome.css                    # Styling, themes, animations
```

## Setup

### Requirements
- PHP 8.1+
- Composer
- MySQL or PostgreSQL
- A Google Cloud service account with access to Google Sheets API
- A Google Sheet shared with that service account (Editor access)

### Installation

```bash
git clone <repo-url>
cd kustard-attendance
composer install
cp .env.example .env
php artisan key:generate
```

Configure your `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=kustard_attendance
DB_USERNAME=root
DB_PASSWORD=

GOOGLE_SHEET_ID=your_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_JSON=storage/app/google-service-account.json
```

Run migrations:

```bash
php artisan migrate
```

Place your Google service account JSON key at the path referenced in `.env`, and make sure that service account's email is shared as an **Editor** on the target Google Sheet.

### Running locally

```bash
php artisan serve
```

Visit `http://localhost:8000`. Location detection works over plain HTTP on `localhost`/`127.0.0.1` only — any other host requires HTTPS.

## Key Configuration

| Setting | Location | Purpose |
|---|---|---|
| `OFFICE_LAT` / `OFFICE_LON` | `welcome.js` | Office coordinates for the geofence check |
| `MAX_DISTANCE_METERS` | `welcome.js` | Allowed radius (meters) for marking attendance |
| `HOLIDAYS` | `welcome.js` | Array of holiday dates, names, messages, images |
| `WEATHER_REFRESH_MS` | `welcome.js` | How often the weather badge/rain effect refreshes |
| Required working hours | `AttendanceController@calculateRemainingTime` | Currently 9 hours; adjust `requiredSeconds` |

## Attendance Sync & Recovery

Each check-in appends a row to the Google Sheet and stores the resulting row number (`sheet_row`) against the attendance record. Check-out updates that same row's out-time/location columns.

If the Google Sheet append fails (e.g. Google Workspace billing suspension, permission revoked, network issue), the failure is logged and the `sheet_row` remains `null` — the attendance is still saved to the database, just not yet reflected in the Sheet.

To backfill any attendance records that never made it into the Sheet:

```bash
php artisan attendance:backfill-sheet --date=2026-07-06
```

Omit `--date` to default to yesterday. Safe to re-run — it only processes records still missing a `sheet_row`.

## Weather & Rain Effects

Weather is fetched from Open-Meteo using the employee's live GPS coordinates. The returned WMO weather code is mapped to:

| Condition | Badge | Visual effect |
|---|---|---|
| Clear / Cloudy / Fog | Icon + temperature | None |
| Drizzle | 🌦️ + temperature | Light rain overlay |
| Rain | 🌧️ + temperature | Medium rain overlay |
| Thunderstorm / heavy rain | ⛈️ + temperature | Heavy rain overlay + lightning flashes |

The rain effect renders on a full-screen `<canvas>` created dynamically by `welcome.js` — no markup changes required beyond adding the `#weather-badge` element to the page.

## Known Limitations

- Weather data source (Open-Meteo) typically updates hourly upstream; frequent polling keeps the UI feeling live but won't produce sub-hourly precision.
- Reverse geocoding (Nominatim) is a free, rate-limited public service — avoid excessive request volume.
- If the Google Workspace account or service account is suspended (e.g. billing issue), Sheet writes will fail silently until access is restored; use the backfill command afterward.

## License

Internal project — not licensed for external distribution.
