# OTP Verification — Setup & Configuration Guide

> **Bhopal Real Estate** uses a **dual OTP verification** system to protect owner contact details.  
> Before a user can view an owner's phone number, they must verify both their **mobile number** (via SMS) and their **email address** (via Gmail).

---

## 📋 Table of Contents

1. [How the OTP Flow Works](#how-the-otp-flow-works)
2. [MongoDB Setup](#mongodb-setup)
3. [Twilio Setup (SMS OTP + WhatsApp)](#twilio-setup)
4. [Gmail Setup (Email OTP)](#gmail-setup)
5. [Environment Variables Reference](#environment-variables-reference)
6. [Starting the Server](#starting-the-server)
7. [Testing the OTP Flow](#testing-the-otp-flow)
8. [Troubleshooting](#troubleshooting)

---

## How the OTP Flow Works

When a user clicks **"Get Owner Details"** on a property page, the following 4-step flow is triggered:

```
Step 1 — User Details Form
  └─ User enters: Name, Phone Number, Email
  └─ Data is saved to MongoDB (ownerRequests collection)
  └─ Owner is notified via WhatsApp (Twilio)

Step 2 — Mobile OTP Verification
  └─ A 6-digit OTP is generated and sent via Twilio SMS to the user's phone
  └─ OTP is valid for 5 minutes
  └─ User enters the 6-digit code in the UI

Step 3 — Email OTP Verification
  └─ A separate 6-digit OTP is generated and sent via Gmail to the user's email
  └─ OTP is valid for 5 minutes
  └─ User enters the 6-digit code in the UI

Step 4 — Owner Details Revealed
  └─ Both OTPs verified → owner name and phone are shown
  └─ User can tap "Chat on WhatsApp" to message the owner directly
```

> **Security**: OTPs are stored in server memory with a 5-minute TTL and deleted immediately after successful verification. They are never stored in the database.

---

## MongoDB Setup

### Step 1 — Download MongoDB Community Server

Visit: https://www.mongodb.com/try/download/community

- Select **Version**: 7.x (latest)
- Select **Platform**: Windows
- Select **Package**: MSI
- Click **Download**

### Step 2 — Install

Run the downloaded `.msi` installer:
- Choose **Complete** installation
- ✅ Check **"Install MongoDB as a Service"** (recommended)
- ✅ Check **"Install MongoDB Compass"** (optional, for GUI)

### Step 3 — Verify MongoDB is Running

Open PowerShell and run:
```powershell
mongosh
```
You should see the MongoDB shell prompt. Type `exit` to quit.

### Step 4 — Database & Collection

The server **automatically creates** the database and collection on first run:
- **Database**: `realestateDB`
- **Collection**: `ownerRequests`

To verify manually in MongoDB Compass:
1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. Navigate to `realestateDB` → `ownerRequests`

---

## Twilio Setup

Twilio is used for:
- Sending **SMS OTP** to the user's phone
- Sending **WhatsApp notification** to the property owner

### Step 1 — Create a Twilio Account

1. Go to: https://www.twilio.com/try-twilio
2. Sign up for a free account
3. Verify your own phone number during signup

### Step 2 — Get Credentials

From the **Twilio Console** (https://console.twilio.com):
- Copy your **Account SID**
- Copy your **Auth Token**
- Go to **Phone Numbers** → **Manage** → **Buy a Number**
  - Select a number with SMS capability
  - For WhatsApp: Enable the **Twilio Sandbox for WhatsApp** under Messaging

### Step 3 — WhatsApp Sandbox Setup (for testing)

1. In Twilio Console → **Messaging** → **Try it out** → **Send a WhatsApp message**
2. The owner must first send a join message to the sandbox number (one-time setup)
3. For production, apply for WhatsApp Business API approval

### Step 4 — Add to .env

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE=+1XXXXXXXXXX
```

> **Note for India**: When sending SMS to Indian numbers, Twilio requires your number to be in **E.164 format** (e.g., `+919876543210`). The server automatically prepends `+91` if not included.

---

## Gmail Setup

Gmail is used for sending the **Email OTP**.

### Method: Gmail App Password (Recommended — No OAuth needed)

### Step 1 — Enable 2-Step Verification

1. Go to: https://myaccount.google.com/security
2. Under **"How you sign in to Google"**, click **2-Step Verification**
3. Follow the setup steps

### Step 2 — Generate an App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Select app: **Mail**
3. Select device: **Windows Computer**
4. Click **Generate**
5. Copy the **16-character password** (shown once — save it!)

### Step 3 — Add to .env

```env
GMAIL_USER=giri14nishant@gmail.com
GMAIL_APP_PASSWORD=fsdq rwlr otua qtip
```

> **Security Tip**: Never commit your `.env` file to Git. It is already listed in `.gitignore`.

---

## Environment Variables Reference

File location: `server/.env`

| Variable | Description | Example |
|---|---|---|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/realestateDB` |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | `ACxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | `xxxxxxxxxxxxxxxx` |
| `TWILIO_PHONE` | Your Twilio phone number | `+1XXXXXXXXXX` |
| `GMAIL_USER` | Gmail address to send OTPs from | `yourname@gmail.com` |
| `GMAIL_APP_PASSWORD` | Gmail App Password (16 chars) | `abcd efgh ijkl mnop` |
| `PORT` | Server port (default: 5000) | `5000` |

---

## Starting the Server

### 1. Ensure MongoDB is running

```powershell
# Check if mongod is running as a Windows service
Get-Service -Name MongoDB
```

If not running:
```powershell
net start MongoDB
```

Or manually:
```powershell
mongod --dbpath "C:\data\db"
```

### 2. Start the backend server

```powershell
cd server
node index.js
```

You should see:
```
✅ Connected to MongoDB (realestateDB)
✅ Twilio client initialized
✅ Gmail transporter initialized
🚀 Bhopal Estates Server running on http://localhost:5000
```

### 3. Start the frontend

```powershell
npm run dev
```

---

## Testing the OTP Flow

### Development / Mock Mode

If Twilio or Gmail credentials are **not configured**, the server runs in **mock mode**:
- The OTP is returned in the API response and **displayed on-screen** in a yellow dev banner
- No actual SMS or email is sent
- This allows full end-to-end testing without paid credentials

### API Endpoints (for manual testing with Postman/curl)

```
POST /api/owner-request          — Save lead to MongoDB
POST /api/notify-owner           — Send WhatsApp to owner
POST /api/send-otp/sms           — Send SMS OTP to user
POST /api/verify-otp/sms         — Verify SMS OTP
POST /api/send-otp/email         — Send Email OTP to user
POST /api/verify-otp/email       — Verify Email OTP
```

### Example: Test SMS OTP via curl

```bash
# Send OTP
curl -X POST http://localhost:5000/api/send-otp/sms \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"9876543210\"}"

# Verify OTP
curl -X POST http://localhost:5000/api/verify-otp/sms \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"9876543210\", \"otp\": \"123456\"}"
```

### Verify MongoDB Data

After a user submits the form:
1. Open **MongoDB Compass**
2. Connect to `mongodb://localhost:27017`
3. Navigate to `realestateDB` → `ownerRequests`
4. You should see a new document with the user's Name, Phone, Email, and the Property ID

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `MongoDB connection error` | Ensure `mongod` is running. Run `mongosh` to check. |
| `SMS OTP not received` | Check Twilio credentials in `.env`. Check Twilio Console for error logs. Ensure phone number is in E.164 format. |
| `Email OTP not received` | Verify Gmail App Password. Check spam folder. Ensure 2-Step Verification is enabled. |
| `WhatsApp message not delivered` | For sandbox: owner must have joined the Twilio Sandbox first. |
| `OTP expired` | OTPs expire after **5 minutes**. Click **Resend OTP** (available after 60s cooldown). |
| `Port 5000 already in use` | Change `PORT=5001` in `.env` and update the frontend API URL in `PropertyDetail.jsx`. |

---

*Generated for Bhopal Real Estate — Property Interest & OTP Verification System*
