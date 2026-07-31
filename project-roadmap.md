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



    ---
## 5. Complete Database Schema (PostgreSQL DDL for Supabase)
Execute this script in your Supabase SQL Editor:

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. FACILITIES TABLE (Plants & Warehouses)
CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    wifi_ip_whitelist TEXT[], -- Array of allowed factory public IP ranges
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. USERS TABLE (Managers, Technicians, Security Guards)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('manager', 'technician', 'guard')),
    pin_code VARCHAR(4) NOT NULL, -- 4-Digit Worker PIN for anti-spam verification
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. MACHINES TABLE (Equipment Assets)
CREATE TABLE machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    model VARCHAR(255),
    serial_number VARCHAR(255),
    location_bay VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'offline')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TICKETS TABLE (Breakdown & Maintenance Logs)
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    urgency VARCHAR(20) NOT NULL CHECK (urgency IN ('low', 'medium', 'critical')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('electrical', 'mechanical', 'hydraulic', 'other')),
    description TEXT,
    photo_url TEXT,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    reporter_pin VARCHAR(4) NOT NULL,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 5. GATE_ENTRIES TABLE (Phase 3 Truck Management Module)
CREATE TABLE gate_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    truck_license_plate VARCHAR(50) NOT NULL,
    driver_phone VARCHAR(50) NOT NULL,
    carrier_name VARCHAR(255),
    assigned_bay VARCHAR(50),
    status VARCHAR(50) DEFAULT 'in_yard' CHECK (status IN ('waiting', 'in_yard', 'departed')),
    entry_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exit_time TIMESTAMP WITH TIME ZONE
);

-- INDEXES FOR FAST QUERY PERFORMANCE
CREATE INDEX idx_tickets_machine ON tickets(machine_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_machines_facility ON machines(facility_id);
CREATE INDEX idx_gate_entries_facility ON gate_entries(facility_id);

---
## 6. UI & Wireframe Specifications
1) Mobile Operator Reporting Page (/machine/[id])
1.1) Machine Context Header: Read-only banner displaying Machine Name, Model, and Location Bay derived from URL parameters.
1.2) Urgency Selector: 3 large side-by-side pill buttons (🟢 Low, 🟡 Medium, 🔴 CRITICAL).
1.3) Issue Category Grid: 2x2 grid of touch targets (Electrical, Mechanical, Hydraulic, Other).
1.4) Camera Input: Button triggering native smartphone rear camera (<input type="file" accept="image/*" capture="environment">).
1.5) Worker Security Field: Numeric input field for 4-digit Worker PIN.
1.6) Submit Action: Full-width sticky button anchored at the bottom of the screen.

2) Manager Kanban Board (/dashboard/tickets)
2.1) Columns: Open (Red accent), In Progress (Yellow accent), Resolved (Green accent).
2.2) Card Details: Ticket ID, Urgency badge, Category icon, Machine Name, Location, Relative Timestamp (e.g., "5 mins ago"), Technician assignee dropdown, and Image preview thumbnail.
2.3) Action Modal: Click on a ticket to inspect full-size photo, assign technicians, or type resolution notes to close the ticket.