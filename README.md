📄 README.md
# BiteSpeed Identity Reconciliation Service

## 🚀 Overview

This project implements an identity reconciliation service for BiteSpeed.

The goal is to identify and link multiple contact records belonging to the same customer based on shared email addresses or phone numbers.

The service exposes a single endpoint:



POST /identify


It accepts contact information and returns a consolidated identity view.

---

## 🧠 Problem Statement

Customers may place orders using different emails and phone numbers.

If any two contacts share either:
- the same email
- the same phone number

they belong to the same identity cluster.

Each identity cluster:
- Has exactly one **primary** contact (oldest record)
- Other contacts are marked as **secondary**
- All secondary contacts directly reference the primary

---

## 🏗 Tech Stack

- **Node.js**
- **TypeScript**
- **Express**
- **PostgreSQL (Supabase)**
- **Prisma ORM**

---

## 📦 Project Structure



src/
├── controllers/
│ identify.controller.ts
├── services/
│ identify.service.ts
├── routes/
│ identify.route.ts
├── prisma.ts
├── app.ts
└── server.ts


---

## 📘 Database Schema

```prisma
model Contact {
  id             Int      @id @default(autoincrement())
  phoneNumber    String?
  email          String?
  linkedId       Int?
  linkPrecedence String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  deletedAt      DateTime?
}

🔗 API Endpoint
POST /identify
Request Body (JSON)
{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}


At least one of email or phoneNumber must be provided.

Response Format
{
  "contact": {
    "primaryContactId": number,
    "emails": string[],
    "phoneNumbers": string[],
    "secondaryContactIds": number[]
  }
}

🧪 Identity Resolution Logic

The service handles the following cases:

✅ New Customer

Creates a new primary contact.

✅ Partial Match

If email OR phone matches an existing contact:

Links new information as a secondary contact.

✅ Secondary Match

If a secondary matches:

The new contact links to the cluster’s primary.

✅ Merging Two Primaries

If a request connects two independent primary clusters:

The oldest primary remains primary.

The other primary becomes secondary.

✅ Exact Duplicate

If the same email and phone already exist:

No new row is created.

Existing consolidated identity is returned.

🏃‍♂️ Running Locally
1. Clone the Repository
git clone <your-repo-url>
cd BiteSpeed-Identity

2. Install Dependencies
npm install

3. Configure Environment Variables

Create a .env file:

DATABASE_URL="your_postgresql_connection_string"


If using Supabase:

postgresql://username:password@host:5432/postgres?sslmode=require

4. Run Prisma Migration
npx prisma migrate dev --name init

5. Start Server
npm run dev


Server runs on:

http://localhost:3000

🌍 Hosted Endpoint
https://your-deployed-url/identify


(Replace with actual deployed URL)

🧩 Key Design Decisions

Always maintain a single primary per identity cluster.

Always link secondary contacts directly to primary (no chaining).

Preserve historical records instead of overwriting.

Deterministically choose oldest contact as primary.

🛠 Submission Checklist

 SQL database used

 /identify endpoint implemented

 Identity merging logic handled

 Hosted endpoint exposed

 GitHub repository published

👨‍💻 Author

Md Amir