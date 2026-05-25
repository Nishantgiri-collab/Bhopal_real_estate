# SQLite Database Check Guide

This app uses SQLite from the backend server.

## Database File

The SQLite database is here:

```text
server/data/realestate.db
```

The frontend does not connect to SQLite directly. It calls the backend API:

```text
http://localhost:5000/api
```

So if property submit fails with:

```text
Property could not be saved. Please make sure the backend server is running on port 5000.
```

it means the React app cannot reach the backend server.

## Start The Backend

Open a terminal in the project root and run:

```powershell
cd server
npm.cmd start
```

Or:

```powershell
cd server
node.exe index.js
```

Expected output includes:

```text
Bhopal Estates Server running on http://localhost:5000
Connected to SQLite database: ...\server\data\realestate.db
SQLite properties table ready
SQLite owner_requests table ready
```

Keep this terminal open while using the frontend.

## Start The Frontend

In another terminal from the project root:

```powershell
npm.cmd run dev
```

Open:

```text
http://localhost:5173
```

## Check API Connection

Run this from PowerShell:

```powershell
Invoke-WebRequest -UseBasicParsing -Uri http://localhost:5000/api/properties
```

Good result:

```text
StatusCode: 200
```

If it says `Unable to connect to the remote server`, the backend is not running.

## Check Port 5000

```powershell
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
```

If there is no output, nothing is running on port `5000`.

## Check SQLite Tables

From the project root:

```powershell
node.exe -e "const sqlite3=require('./server/node_modules/sqlite3').verbose(); const db=new sqlite3.Database('./server/data/realestate.db'); db.all('select count(*) as total, sum(case when isApproved=0 then 1 else 0 end) as pending from properties', (e,r)=>{ if(e) throw e; console.table(r); db.close(); });"
```

This shows total properties and pending approval count.

## Add Property Approval Flow

1. Start backend on `5000`.
2. Start frontend on `5173`.
3. Submit property from `/add-property`.
4. Login as admin.
5. Open `/admin-dashboard`.
6. The new property should appear as `Pending`.
7. Click `Approve`.
8. It becomes visible on `/properties`.

## Email OTP

Check `server/.env`:

```text
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
```

Email OTP requires a real Gmail App Password. If `GMAIL_APP_PASSWORD` is still a placeholder, the API returns an error and the UI will not show a simulated OTP.

After changing Gmail settings, restart the backend.

To test email OTP API:

```powershell
$send = Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/send-otp/email -ContentType 'application/json' -Body (@{ email='test@example.com' } | ConvertTo-Json)
$send
```

Check your email inbox for the 6-digit OTP, then verify it:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/verify-otp/email -ContentType 'application/json' -Body (@{ email='test@example.com'; otp='123456' } | ConvertTo-Json)
```

Replace `123456` with the code received by email.

## Common Fixes

- Use `npm.cmd`, not `npm`, if PowerShell blocks scripts.
- Start backend from the `server` folder, not the root folder.
- Keep backend running while submitting properties.
- If port `5000` is busy, stop the old process or update the frontend API URL.
- After changing `server/.env`, restart the backend.
