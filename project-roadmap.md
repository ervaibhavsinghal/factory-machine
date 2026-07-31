# Factory QR Maintenance & Gate SaaS - Master Specification Document

---

## 📋 1. Executive Summary & Vision

### Core Concept
A low-cost, zero-friction micro-SaaS designed for unsexy physical environments (factories, warehouses, and industrial plants). 

The platform consists of two main modules built on a single unified architecture:
1. **Factory QR Maintenance (Phase 1 / MVP):** Machine operators scan physical QR code stickers on equipment using a smartphone web browser (no app download required) to log machine breakdowns with photos in under 30 seconds. Maintenance technicians receive instant alerts via Telegram/WhatsApp and manage tickets via a real-time web Kanban board.
2. **GateCheck Management System (Phase 3 Expansion):** A tablet-based gate entry system for security guards at factory/warehouse gates to digitize incoming freight trucks, issue digital SMS bay passes, and eliminate heavy truck detention penalties.

---

## 🛠️ 2. Technical Stack & Deployment Strategy ($0 Budget Stack)

| Architecture Layer | Technology Choice | Function / Purpose |
| :--- | :--- | :--- |
| **Framework** | **Next.js 14+ (App Router)** | Monolithic full-stack setup handling both frontend pages and serverless API endpoints. |
| **Language** | **TypeScript** | Strict typing across API payloads, DB tables, and UI components. |
| **Styling & UI** | **Tailwind CSS + Shadcn UI** | High-speed component styling, responsive layouts, and accessible modals. |
| **Database & Auth** | **Supabase (PostgreSQL)** | Free relational database, integrated auth, and Row Level Security (RLS). |
| **File Storage** | **Supabase Storage** | Public bucket (`ticket-photos`) for mobile photo uploads. |
| **Hosting & CDN** | **Vercel (Free Tier)** | 1-Click deployment from GitHub with $0 monthly hosting overhead. |
| **Alert Engine** | **Telegram Bot API / WhatsApp Webhook** | Zero-cost instant messaging channel for critical machine alerts. |
| **Image Compression** | **`browser-image-compression`** | Client-side compression shrinking 5MB mobile photos to < 150KB before upload. |
| **QR Generation** | **`qrcode.react` / `react-pdf`** | Client-side generation of printable QR code asset stickers. |

---

## 🔒 3. Anti-Spam & Security Architecture

Since physical QR codes are publicly accessible on factory floors, the system employs a multi-tier security layer to prevent external spam:

1. **4-Digit Worker PIN Verification:** Each worker is assigned a 4-digit PIN. Submitting a ticket requires choosing a worker name and entering the valid PIN.
2. **Factory Wi-Fi IP Whitelisting:** Backend middleware checks the request origin IP against the plant's public IP range (`wifi_ip_whitelist`).
3. **GPS Geofencing (Optional Web Fallback):** Requests are restricted to a 200-meter radius around the factory's GPS coordinates using `navigator.geolocation`.
4. **API Rate Limiting:** Enforces a maximum of 3 submissions per 10 minutes per IP/Session.

---

## 📁 4. Project Directory Structure (Next.js App Router)

```text
factory-qr-app/
├── app/
│   ├── layout.tsx                  # Root layout & Tailwind providers
│   ├── page.tsx                    # Landing page / Redirect to dashboard
│   ├── login/                      # Login page for Managers & Technicians
│   │   └── page.tsx
│   ├── machine/
│   │   └── [id]/                   # Mobile Operator Issue Reporting Page (Public)
│   │       └── page.tsx
│   ├── dashboard/                  # Manager & Technician Portal (Protected)
│   │   ├── layout.tsx
│   │   ├── page.tsx                # High-level plant metrics
│   │   ├── machines/               # Asset management & QR PDF export
│   │   │   └── page.tsx
│   │   ├── tickets/                # Kanban Board & Ticket Queue
│   │   │   └── page.tsx
│   │   └── gate/                   # Phase 3 Gate Management Module
│   │       └── page.tsx
│   └── api/
│       ├── machines/route.ts       # CRUD endpoints for machine assets
│       ├── tickets/route.ts        # Ticket creation, updates, status changes
│       └── alerts/telegram/route.ts# Webhook trigger for instant Telegram alerts
├── components/
│   ├── ui/                         # Shadcn primitives (button, card, dialog, input)
│   ├── operator/                   # Mobile reporting components
│   │   ├── UrgencySelector.tsx     # Color-coded urgency toggles (Low, Med, Critical)
│   │   ├── CategoryGrid.tsx        # 2x2 grid selection (Electrical, Hydraulic, etc.)
│   │   └── CameraInput.tsx         # Direct native camera trigger
│   └── dashboard/
│       ├── KanbanBoard.tsx         # Drag & Drop / Column ticket board
│       ├── MachineCard.tsx         # Machine asset display card
│       └── QRStickerModal.tsx      # Modal to batch export PDF QR stickers
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Supabase browser client helper
│   │   └── server.ts               # Supabase server client helper
│   ├── utils.ts                    # Utility functions & Tailwind merger
│   └── telegram.ts                 # Telegram Bot API notification helper
└── types/
    └── index.ts                    # Global TypeScript interfaces