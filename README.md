<div align="center">

# 🏥 MediTrack

### Multi-Hospital Patient Health Record Management System

[![Django](https://img.shields.io/badge/Django-6.0.1-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://upstash.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

**A unified, cloud-native Electronic Health Record (EHR) platform where medical history follows the patient — not the institution.**

[Features](#-key-features) · [Tech Stack](#-technology-stack) · [Architecture](#-system-architecture) · [Getting Started](#-getting-started) · [API Reference](#-api-endpoints) · [Deployment](#-deployment)

</div>

---

## 📖 About the Project

**MediTrack** is a full-stack healthcare platform designed to solve the critical problem of fragmented patient data across hospitals. Unlike traditional hospital management systems that operate in silos, MediTrack provides a centralized repository for electronic health records with a unique **QR-Code based Identity System** that instantly links patients with their records across any registered hospital.

Whether a patient visits a primary clinic or a major tertiary hospital, the attending physician gets immediate access to their complete clinical history — previous diagnoses, lab results, vitals trends, and active prescriptions — all through a simple QR scan.

### The Problem It Solves

| Challenge | How MediTrack Addresses It |
|:---|:---|
| **Data Fragmentation** — Records scattered across hospitals | Centralized multi-hospital EHR with universal QR-based patient identity |
| **Manual Record Keeping** — Paper files prone to loss/damage | Fully digital records with cloud-backed PDF generation & storage |
| **Inefficient Emergency Care** — No access to allergies/medications | Instant QR scan reveals full medical history including allergies & active prescriptions |
| **Security & Privacy Risks** — Outdated systems lack encryption | Zero-trust security: field-level encryption, HttpOnly JWT, 2FA, audit logging |
| **Administrative Overhead** — Time-consuming vitals entry | Streamlined staff workflow with automated vitals graphing & pending-record queues |

---

## ✨ Key Features

### 🔐 Authentication & Security
- **JWT Authentication** via secure `HttpOnly` cookies (XSS-proof)
- **Two-Factor Authentication (2FA)** with SMS OTPs via Twilio
- **Brute-force Protection** — IP lockout after 5 failed attempts (`django-axes`)
- **Field-level Encryption** — Sensitive data (Aadhaar, allergies) encrypted at rest with Fernet
- **Immutable Audit Logging** — Every action tracked with user role, IP, and timestamp
- **Type-to-Confirm Safeguards** — Destructive admin actions require explicit confirmation

### 📱 QR-Code Identity System
- Automatic **10-digit Health ID** generation with collision-resistant algorithm
- Dynamic QR code generation for every registered patient
- Built-in **camera-based scanner** for instant patient lookup by doctors/staff

### 📋 Clinical Record Management
- **Consultation Records** — Full diagnostic suite with symptoms, diagnosis, and digital billing
- **Lab & Diagnostics** — Order and document lab results with PDF attachments
- **Digital Prescriptions** — On-the-fly PDF prescription generation (`ReportLab`)
- **Vitals Tracking** — Automated graphing of BP, SpO2, temperature, pulse trends over time
- **Hash-Chain Integrity** — SHA-256 blockchain-inspired chain detects any record tampering

### 📊 Role-Based Analytics Dashboards
- **Site Admin** — System-wide growth metrics and hospital management
- **Hospital Admin** — Staff management, doctor approvals, hospital-level analytics
- **Doctor** — Patient load, monthly diagnosis breakdown, pending record queues
- **Patient** — Health trends (vitals history), active treatment plans, prescription downloads

### 👥 Role-Based Access Control (RBAC)

| Role | Permissions |
|:---|:---|
| **Site Admin** | Manage hospitals, system-wide stats, global configuration |
| **Hospital Admin** | Register staff, approve/reject doctors, hospital analytics |
| **Doctor** | Create/approve records, view full patient history via QR, manage prescriptions |
| **Staff / Lab Tech** | Register patients, record vitals, initiate pending records for doctor review |
| **Patient** | View own records/vitals, download prescriptions, manage QR identity card |

---

## 🛠 Technology Stack

### Backend — Python / Django

| Technology | Version | Purpose |
|:---|:---:|:---|
| **Django** | 6.0.1 | Core framework — business logic, ORM, security middleware |
| **Django REST Framework** | 3.16.1 | RESTful API serialization and endpoint management |
| **SimpleJWT** | 5.5.1 | Stateless JWT auth with HttpOnly cookie delivery |
| **PostgreSQL (Neon)** | — | Primary relational database with serverless scaling |
| **Psycopg** | 3.2+ | PostgreSQL adapter for Python |
| **Redis** | 5.0+ | In-memory cache for dashboard analytics (5-min TTL) |
| **Django Axes** | 6.5.0 | Brute-force login protection & IP lockout |
| **Django Encrypted Fields** | 0.6.5 | Fernet encryption for sensitive patient data at rest |
| **Cloudinary** | 1.41.0 | Cloud storage for medical certificates, QR images, documents |
| **QRCode** | 7.4.2 | Programmatic QR code generation for patient Health IDs |
| **ReportLab** | 4.1.0 | Dynamic PDF generation for prescriptions & clinical summaries |
| **Twilio** | 9.10.5 | SMS-based OTP delivery for Two-Factor Authentication |
| **PyOTP** | 2.9.0 | TOTP/HOTP one-time password generation |
| **Gunicorn** | — | Production WSGI HTTP server |
| **WhiteNoise** | — | Efficient static file serving in production |
| **Python Decouple** | 3.8 | Secure `.env`-based configuration management |

### Frontend — Next.js / React

| Technology | Version | Purpose |
|:---|:---:|:---|
| **Next.js** | 16.2 | App Router, SSR, client-side routing, middleware |
| **React** | 19.2 | UI component library with latest concurrent features |
| **TanStack React Query** | 5.91 | Server-state synchronization, caching & optimistic updates |
| **Axios** | 1.13 | HTTP client with interceptor-based silent token refresh |
| **Tailwind CSS** | 3.4 | Utility-first CSS framework for responsive design |
| **Zod** | 4.3 | Schema validation for all medical form inputs |
| **React Hook Form** | 7.71 | Performant form state management with Zod integration |
| **Radix UI** | 1.4 | Accessible, unstyled UI primitives (labels, dialogs, etc.) |
| **Lucide React** | 0.577 | Premium icon library for medical & admin interfaces |
| **ZXing Browser** | 0.1.5 | Camera-based QR code scanning engine |
| **React Hot Toast** | 2.6 | Non-blocking success/error notification system |
| **JS-Cookie** | 3.0 | Client-side session context for role-based UI rendering |
| **NextJS TopLoader** | 3.9 | Visual loading indicator during page navigation |
| **QRCode.react** | 4.2 | React component for rendering QR codes in the UI |

### Infrastructure & Services

| Service | Purpose |
|:---|:---|
| **Vercel** | Frontend hosting with global Edge Network & optimized Next.js builds |
| **Render** | Backend hosting with Gunicorn production server |
| **Neon** | Serverless PostgreSQL with connection pooling & scale-to-zero |
| **Upstash Redis** | Serverless Redis for low-latency analytics caching |
| **Cloudinary** | Media storage & transformation (images, PDFs, QR codes) |
| **Twilio** | SMS gateway for OTP-based two-factor authentication |

---

## 🏗 System Architecture

MediTrack follows a **Decoupled Three-Tier Architecture**:

```
┌──────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
│              Next.js 16 (App Router + SSR)                      │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│    │  Admin   │  │  Doctor  │  │  Staff   │  │ Patient  │      │
│    │Dashboard │  │Dashboard │  │Dashboard │  │Dashboard │      │
│    └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
└───────────────────────────┬──────────────────────────────────────┘
                            │  REST API (JSON / Axios)
┌───────────────────────────▼──────────────────────────────────────┐
│                     APPLICATION LAYER                            │
│              Django 6.0 + DRF (Stateless API)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │ Accounts │ │Hospitals │ │ Patients │ │ Records + Hashing│    │
│  │  + Auth  │ │  Module  │ │+ Vitals  │ │   + Integrity    │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘    │
└──────┬──────────────┬──────────────┬────────────────────────────┘
       │              │              │
┌──────▼──────┐ ┌─────▼─────┐ ┌─────▼──────┐
│ PostgreSQL  │ │   Redis   │ │ Cloudinary │
│   (Neon)    │ │ (Upstash) │ │  (Media)   │
│ Relational  │ │  Cache &  │ │  Images,   │
│   Data      │ │ Analytics │ │ PDFs, QRs  │
└─────────────┘ └───────────┘ └────────────┘
```

**Data Flow:**
1. User requests are intercepted by **Next.js Middleware** for session validation
2. Valid requests reach **Django Viewsets** via the REST API
3. Data is retrieved/persisted via the **Django ORM** with PostgreSQL
4. Sensitive records pass through the **Hash-Chain Service** for integrity verification
5. Dashboard analytics are served from **Redis cache** (5-min TTL) to minimize DB load

---

## 📂 Project Structure

```
MediTrack/
├── backend/
│   ├── accounts/          # User models, JWT auth, login/register views
│   ├── hospitals/         # Hospital registration and management
│   ├── patients/          # Patient profiles, vitals, QR generation
│   ├── records/           # Medical records, prescriptions, hash-chaining
│   ├── dashboard/         # Role-based analytics views
│   ├── meditrack/         # Django project settings, WSGI config
│   ├── manage.py          # Django CLI entry point
│   └── requirements.txt   # Python dependencies
│
├── frontend/
│   ├── app/               # Next.js App Router
│   │   ├── dashboard/     # Role-based dashboard sub-routes
│   │   ├── login/         # Authentication pages
│   │   └── layout.js      # Global providers and theme
│   ├── components/
│   │   ├── ui/            # Atomic components (Buttons, Cards, Inputs)
│   │   ├── shared/        # Complex components (Sidebar, Navbar)
│   │   └── interactable/  # Logic-heavy (QR Scanner, Charts)
│   ├── hooks/             # Custom React hooks (useAuth, usePatients)
│   ├── lib/
│   │   ├── api.js         # Axios instance with interceptors
│   │   └── schemas.js     # Zod validation schemas
│   └── tailwind.config.js # Design system tokens
│
├── .env.example           # Environment variable template
├── CREDENTIALS.md         # Demo account credentials
├── PROJECT_REPORT.md      # Comprehensive technical report
└── README.md              # ← You are here
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- **[Python 3.8+](https://www.python.org/downloads/)**
- **[Node.js v18+](https://nodejs.org/)**
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/hemanth1139/Meditrack.git
cd Meditrack
```

### 2. Environment Configuration

#### Backend (`.env`)

```bash
cp .env.example .env
```

Open `.env` and configure:
- **Database** — Neon PostgreSQL credentials (`DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`)
- **Cloudinary** — Required for media uploads (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)
- **Encryption Key** — Generate with: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`
- **Django Secret Key** — A long random string for `SECRET_KEY`

#### Frontend (`frontend/.env.local`)

```bash
cd frontend
cp .env.local.example .env.local
```

### 3. Backend Setup (Django)

```bash
# Create and activate virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate
# Mac/Linux
source .venv/bin/activate

# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Seed demo data (recommended)
python manage.py seed_demo --clear

# Start the development server
python manage.py runserver
```

> The Django API will be available at **http://localhost:8000**

### 4. Frontend Setup (Next.js)

Open a **new terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

> The Next.js frontend will be available at **http://localhost:3000**

### 5. Access the Platform

With both servers running:
- 🌐 **Application**: [http://localhost:3000](http://localhost:3000)
- ⚙️ **Django Admin**: [http://localhost:8000/admin/](http://localhost:8000/admin/)
- 🔑 **Demo Credentials**: See [`CREDENTIALS.md`](./CREDENTIALS.md) for accounts across all roles. Default password: `MediTrack@123`

---

## 📡 API Endpoints

| Endpoint | Method | Description | Access |
|:---|:---:|:---|:---|
| `/api/auth/login/` | POST | Authenticate user & set HttpOnly cookies | Public |
| `/api/auth/me/` | GET | Get logged-in user profile | Authenticated |
| `/api/hospitals/` | GET/POST | List or register hospitals | Admin / Public |
| `/api/patients/qr/<id>/` | GET | Fetch patient details via QR scan | Doctor / Staff |
| `/api/records/` | POST | Create a medical record | Doctor / Staff |
| `/api/records/<id>/approve/` | POST | Approve a pending record | Doctor |
| `/api/dashboard/stats/` | GET | Role-specific dashboard metrics (cached) | All Roles |

---

## ☁️ Deployment

MediTrack uses a multi-service cloud deployment strategy:

| Layer | Service | Details |
|:---|:---|:---|
| **Frontend** | Vercel | Global Edge Network, optimized Next.js builds, auto-deploy via GitHub |
| **Backend** | Render | Gunicorn WSGI server, auto-deploy via GitHub |
| **Database** | Neon | Serverless PostgreSQL with connection pooling & scale-to-zero |
| **Cache** | Upstash Redis | Serverless Redis for global low-latency analytics |
| **Media** | Cloudinary | Image/PDF storage and on-the-fly transformation |
| **SMS** | Twilio | OTP delivery for two-factor authentication |
| **CI/CD** | GitHub | Automatic deployments via push hooks with lint/build checks |

---

## ⚡ Performance Optimizations

- **Redis Caching** — Dashboard stats cached with 5-minute TTL to avoid expensive DB aggregations
- **GZip Compression** — All API responses compressed, reducing payload by ~70%
- **Lazy Loading** — Frontend routes/components lazy-loaded via `next/dynamic` for smaller initial bundles
- **Connection Pooling** — Neon pooler handles high concurrent database connections
- **Rate Throttling** — DRF `ScopedRateThrottle` on login/register endpoints to prevent abuse

---

## 🔒 Security Highlights

| Layer | Implementation |
|:---|:---|
| **Authentication** | JWT tokens in `HttpOnly`, `Secure`, `SameSite=None` cookies |
| **2FA** | SMS OTP via Twilio with E.164 phone normalization |
| **Encryption at Rest** | Fernet symmetric encryption on sensitive patient fields |
| **Brute Force** | `django-axes` locks IPs after 5 failed login attempts (30-min cooldown) |
| **Token Refresh** | Silent refresh middleware retries requests on 401 without user interruption |
| **Audit Trail** | Immutable `AuditLog` table with user role, action, IP, and timestamp |
| **CSRF** | Django CSRF middleware enabled for all state-changing requests |
| **Data Integrity** | SHA-256 hash chain links every medical record to detect tampering |

---

## 🐛 Troubleshooting

| Issue | Solution |
|:---|:---|
| **Cannot upload files / QR codes failing** | Set valid `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `.env` |
| **Missing module or database error** | Activate the virtual environment and run `python manage.py migrate`. Use `python manage.py seed_demo --clear` to fix uninitialized relations |
| **Frontend out of memory** | Use `npm run dev` (pre-configured with `--max-old-space-size=4096`) instead of `next dev` directly |
| **Cold start delays (15-30s)** | Expected on free-tier Render/Neon — first request wakes the serverless instance |

---

## 🔮 Future Roadmap

- [ ] **HIPAA/HDS Compliance** — Formal certification for international healthcare data handling
- [ ] **Mobile App** — React Native port for smoother camera & notification experience on iOS/Android
- [ ] **AI Diagnostics** — LLM integration to scan reports and summarize key patient risks
- [ ] **Payment Gateway** — Stripe/Razorpay integration for billing and insurance claims
- [ ] **Wearable Integration** — Sync vitals from Apple Health, Fitbit, and other devices
- [ ] **Real-time Notifications** — WebSocket-based updates via Django Channels
- [ ] **Offline Support** — PWA caching for offline record entry

---

## 📄 License

This project is developed as an academic/portfolio project.

---

<div align="center">

**Built with ❤️ using Django & Next.js**

</div>
