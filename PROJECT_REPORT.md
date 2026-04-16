# MediTrack: Comprehensive Technical Project Report
## Multi-Hospital Patient Health Record Management System

---

### Table of Contents
1. [Project Overview & Description](#1-project-overview--description)
2. [Problem Statement](#2-problem-statement)
3. [The Proposed Solution](#3-the-proposed-solution)
4. [System Requirements (Functional & Non-Functional)](#4-system-requirements-functional--non-functional)
5. [Core Technology Stack](#5-core-technology-stack)
6. [System Architecture](#6-system-architecture)
7. [Database Design & Schema](#7-database-design--schema)
8. [User Roles & Permissions (RBAC)](#8-user-roles--permissions-rbac)
9. [Core Modules & Features](#9-core-modules--features)
10. [API Documentation (Backend Endpoints)](#10-api-documentation-backend-endpoints)
11. [System Workflows (Step-by-Step)](#11-system-workflows-step-by-step)
12. [Security & Authentication Implementation](#12-security--authentication-implementation)
13. [Performance Optimizations & Best Practices](#13-performance-optimizations--best-practices)
14. [Frontend Project Structure & Logic](#14-frontend-project-structure--logic)
15. [Backend Project Structure & Logic](#15-backend-project-structure--logic)
16. [Deployment Architecture](#16-deployment-architecture)
17. [Testing & Quality Assurance](#17-testing--quality-assurance)
18. [Known Limitations](#18-known-limitations)
19. [Future Scope & Enhancements](#19-future-scope--enhancements)
20. [Conclusion](#20-conclusion)

---

### 1. Project Overview & Description

**MediTrack** is a sophisticated, full-stack healthcare platform designed to solve the critical issue of fragmented patient data in the modern healthcare ecosystem. Unlike traditional hospital management systems that operate in silos, MediTrack provides a unified, multi-hospital environment where medical history follows the patient, not the institution.

At its core, the platform acts as a centralized repository for electronic health records (EHR). It utilizes a unique **QR-Code based Identity System** to instantly link patients with their records across different hospitals. The system ensures that whether a patient visits a primary clinic or a major tertiary hospital, the attending physician has immediate access to their complete clinical history, including previous diagnoses, lab results, vitals trends, and active prescriptions.

The application is built using a modern decoupled architecture, combining the robustness of **Django** (Python) for the backend API and the high-performance capabilities of **Next.js** (React) for the frontend interface.

---

### 2. Problem Statement

Modern healthcare delivery faces several systemic challenges that MediTrack aims to address:

1.  **Data Fragmentation**: Patient records are often scattered across multiple hospitals, clinics, and labs. This lack of data interoperability leads to incomplete medical histories.
2.  **Manual Record Keeping**: Patients are frequently required to carry physical files (paper reports, X-rays) for every consultation, which are prone to damage or loss.
3.  **Inefficient Emergency Care**: In critical situations, medical staff often lack immediate access to a patient's allergies, chronic conditions, or current medications, potentially leading to medical errors.
4.  **Security & Privacy Risks**: Traditional physical records are difficult to audit. Furthermore, digital records in outdated systems often lack modern encryption and granular access controls.
5.  **Administrative Overhead**: Manual entry of vitals and record management consumes significant time for both doctors and nursing staff.

---

### 3. The Proposed Solution

MediTrack addresses the aforementioned challenges through a multi-faceted digital approach:

*   **Centralized Patient Identity**: Every patient is assigned a permanent 10-digit ID and a corresponding QR code which serves as their universal "Health Key."
*   **Role-Based Access Control (RBAC)**: The system implements a strict 5-tier permission model (Site Admin, Hospital Admin, Doctor, Staff, Patient) to ensure data is only accessed by authorized personnel.
*   **Digital Prescription & Record Management**: Doctors can digitally create consultations, order lab tests, and document procedures. These records are instantly available for patient viewing and cross-hospital consultation.
*   **Automated Vitals Tracking**: Staff members can record vitals (BP, SpO2, Temperature, etc.) which are automatically graphed for doctors to see trends over time.
*   **Immutable Integrity**: The system utilizes a cryptographically linked "Hash Chain" (Blockchain-inspired) to ensure that once a medical record is finalized, it cannot be tampered with undetected.

---

### 4. System Requirements (Functional & Non-Functional)

#### 4.1 Functional Requirements
*   **User Management**: Secure registration for Patients and Doctors (with certificate verification); Hospital Admin dashboard for staff management.
*   **Record Lifecycle**: Entry of medical data, pending record queue for staff, and final approval by doctors.
*   **QR Integration**: Generation of dynamic QR codes for patients and a built-in scanner for medical staff.
*   **Audit Logging**: Automatic tracking of every sensitive action (login, record view, record update) with user ID and timestamp.
*   **Analytics**: Visual dashboards for all users showing key metrics relevant to their roles.

#### 4.2 Non-Functional Requirements
*   **Security**: Implement JWT-based authentication using HttpOnly cookies to prevent XSS/CSRF. Encrypt sensitive fields (like Aadhaar/Allergies) at rest in the database.
*   **Scalability**: Stateless backend design allowing horizontal scaling; Redis-based caching for high-traffic dashboard stats.
*   **Availability**: Deployment on resilient cloud infrastructure (Vercel/Render) with a 99.9% uptime target.
*   **Responsiveness**: A mobile-first UI for staff on tablets and a performance-optimized dashboard for intensive clinical use.

---

### 5. Core Technology Stack

The project leverages a robust and modern stack designed for high security, data integrity, and extreme performance. Below is a detailed breakdown of every tool used and its specific purpose in the MediTrack ecosystem.

#### 5.1 Backend Infrastructure (Python/Django)
The backend is built as a stateless REST API, prioritizing security and relational integrity.

| Tool | Purpose in MediTrack |
| :--- | :--- |
| **Django (v6.0.1)** | The central "brain" of the application; manages business logic, DB interactions, and security middleware. |
| **Django REST Framework (DRF)** | Handles the serialization of complex clinical data and exposes secure API endpoints. |
| **SimpleJWT** | Implements stateless JWT authentication, with tokens delivered via secure HttpOnly cookies. |
| **Psycopg (Binary)** | Acts as the bridge (adapter) between Python and the Neon PostgreSQL database. |
| **Django Axes** | Security monitor that prevents Brute-Force attacks by tracking failed logins and locking suspicious IPs. |
| **Django Encrypted Fields** | Ensures "Encryption at Rest" by encrypting sensitive patient metadata before storage. |
| **Cloudinary SDK** | Manages the high-speed storage and transformation of medical certificates and QR images. |
| **QRCode Library** | Programmatically generates unique Health-ID tokens into scannable QR images for patients. |
| **ReportLab** | A core utility used to generate on-the-fly PDF prescriptions and clinical summaries. |
| **Redis & Django-Redis** | A high-speed cache layer used to store real-time dashboard analytics, minimizing database load. |
| **Python Decouple** | Separates configuration (secrets) from the codebase using `.env` files for production security. |
| **Gunicorn & WhiteNoise** | Gunicorn acts as the production server, while WhiteNoise allows it to serve static assets efficiently. |

#### 5.2 Frontend & UI Logic (Next.js/React)
The frontend is built for speed and responsiveness, utilizing the latest React 19 features.

| Tool | Purpose in MediTrack |
| :--- | :--- |
| **Next.js 16 (App Router)** | Provides the core architecture, handle server-side rendering (SSR), and manages fast client-side routing. |
| **TanStack React Query** | The "Synchronization Engine"; it caches medical data and ensures the UI stays updated without manual refreshes. |
| **Axios** | The primary client for making secure API calls to the Django backend with interceptor-based error handling. |
| **Tailwind CSS** | Used for rapid, utility-first UI development, ensuring a consistent design system across all roles. |
| **Lucide React** | Provides a premium set of medical and administrative icons used throughout the dashboard. |
| **Zod** | A schema-validation library used to define and enforce strict data rules for all medical forms. |
| **React Hook Form** | Manages complex form states (like multi-step registration) with performance and Zod integration. |
| **React Hot Toast** | Handles real-time feedback (success/error popups) for user actions without blocking the flow. |
| **ZXing Browser** | The underlying technology that enables high-speed QR code scanning via the user's laptop or mobile camera. |
| **JS-Cookie** | Managed client-side session context (like user role) to facilitate role-based UI rendering. |
| **NextJS TopLoader** | Improves perceived performance by providing a visual loading indicator during navigation. |

#### 5.3 Auxiliary Services

| Tool | Purpose in MediTrack |
| :--- | :--- |
| **Twilio API** | Dispatches SMS-based OTPs for Two-Factor Authentication during secure logins. |

---

### 6. System Architecture

MediTrack follows a **Decoupled Three-Tier Architecture**, ensuring high cohesion and low coupling between components.

1.  **Presentation Layer (Frontend)**: A Next.js 16 application that handles server-side rendering (SSR) and client-side interactivity. It communicates with the backend via a RESTful JSON API using Axios.
2.  **Application Layer (Backend)**: A Django 6.0 REST API that manages business logic, authentication, input validation, and secure communication with third-party services (Cloudinary, Redis).
3.  **Data Layer (Storage)**:
    *   **PostgreSQL**: Stores relational data such as user profiles, medical records, and hospital info.
    *   **Redis**: High-speed in-memory store for dashboard analytics and rate limiting.
    *   **Cloudinary**: Object storage for images and PDFs.

**System Data Flow:**
- User requests are intercepted by **Next.js Middleware** for session validation.
- Valid requests reach the **Django Viewsets** via an API Gateway.
- Data is retrieved/persisted via the **Django ORM**.
- Sensitive records are passed through a **Hash-Chaining Service** to maintain integrity.

---

### 7. Database Design & Schema

The database is designed with strict relational integrity. Below are the core entities:

#### 7.1 Accounts Module
- **User**: Custom model extending `AbstractUser`. Fields: `email`, `role`, `hospital`, `phone`, `profile_photo`, `status` (for doctors).
- **AuditLog**: Immutable logs of sensitive actions. Fields: `user`, `action`, `ip_address`, `timestamp`, `details`.
- **Notification**: Real-time alerts. Fields: `recipient`, `message`, `is_read`, `created_at`.

#### 7.2 Hospitals Module
- **Hospital**: Central entity for institutions. Fields: `name`, `license_number`, `address`, `city`, `pincode`, `is_active`.

#### 7.3 Patients Module
- **Patient**: Core clinical entity. Fields: `patient_id` (10-digit), `user`, `qr_code`, `date_of_birth`, `gender`, `blood_group`, `aadhaar_hash` (encrypted), `emergency_contact`.
- **Vitals**: Periodic health measurements. Fields: `patient`, `recorded_by`, `weight`, `blood_pressure`, `pulse`, `spo2`, `temperature`.

#### 7.4 Records Module
- **MedicalRecord**: The primary clinical document. Fields: `patient`, `hospital`, `created_by`, `visit_type` (Consultation/Lab/Procedure), `diagnosis`, `doctor_notes`, `previous_hash`, `current_hash`, `status` (Pending/Approved/Flagged).
- **Prescription**: Linked to Consultation. Fields: `record`, `medicine_name`, `dosage`, `frequency`, `duration`.
- **MedicalDocument**: File attachments for records. Fields: `record`, `file`, `file_type`, `uploaded_at`.

---

### 8. User Roles & Permissions (RBAC)

The system enforces granular access control to ensure HIPAA-level data privacy:

| Role | Permissions |
| :--- | :--- |
| **Site Admin** | Manage hospitals, verify top-level system stats, and handle global configuration. |
| **Hospital Admin** | Register staff, approve/reject doctor applications within their hospital, and view hospital analytics. |
| **Doctor** | Create medical records, approve pending records, view full patient history via QR, and manage prescriptions. |
| **Staff/Lab Tech** | Register walk-in patients, record vitals, and initiate "Pending" medical records for doctor review. |
| **Patient** | View own medical records/vitals, download prescriptions, and manage their unique QR identity card. |

---

### 9. Core Modules & Features

#### 9.1 Authentication & Authorization
- Email/Username login with Brute-force protection (`django-axes`).
- **Two-Factor Authentication (2FA):** SMS OTP delivery via Twilio with robust E.164 phone number normalization.
- JWT logic using HttpOnly cookies to prevent token theft, seamlessly persisted across all auth steps including 2FA.
- Role-specific dashboard redirection logic.
- **Type-to-Confirm Safeguards:** Mandatory confirmation constraints for destructive administrative actions (e.g., deleting hospitals, rejecting doctors).

#### 9.2 QR-Identity Management
- Automatic 10-digit ID generation using a unique collision-resistant algorithm.
- Real-time QR generation for every patient.
- Built-in camera-based scanner for doctors to instantly fetch patient profiles.

#### 9.3 Clinical Record System
- **Consultation**: Full diagnostic suite with symptomatic analysis and digital billing.
- **Lab & Diagnostics**: Ordering and documenting lab results with PDF attachments.
- **Integrity Verification**: A logic that recalculates the SHA-256 hash of all previous records for a patient to detect data tampering.

#### 9.4 Analytics Engine
- **Admin**: System-wide growth metrics.
- **Doctor**: Patient load, monthly diagnosis breakdown, and pending queue.
- **Patient**: Health trends (vitals history) and active treatment plans.

#### 9.5 Data Integrity & Maintenance
- **Systematic Cleanup**: Bundled Django management commands (e.g., `check_data_integrity.py`) to detect and purge corrupted user profiles, duplicate names, and missing patient identifiers.
- **Deterministic Endpoints**: API list views are uniformly equipped with strict default `ordering` to ensure completely deterministic, stable UI renders on the frontend.
- **Flexible Data Boundaries**: Intelligent handling of null or blank optional fields (such as `known_allergies`) to eliminate strict database constraint violations without losing data integrity.

---

### 10. API Documentation (Backend Endpoints)

The API is fully REST-compliant. Below are the primary endpoints:

| Endpoint | Method | Description | Role Required |
| :--- | :--- | :--- | :--- |
| `/api/auth/login/` | POST | Authenticates user & sets HttpOnly cookies. | Anonymous |
| `/api/auth/me/` | GET | Returns profile info for the logged-in user. | Authenticated |
| `/api/hospitals/` | GET/POST | List hospitals or register a new one. | Admin/Public |
| `/api/patients/qr/<id>/`| GET | Fetches patient details via QR scan. | Doctor/Staff |
| `/api/records/` | POST | Creates a new medical record (Consultation/Lab). | Doctor/Staff |
| `/api/records/<id>/approve/`| POST | Approves a pending record. | Doctor |
| `/api/dashboard/stats/`| GET | Role-specific dashboard metrics (Cached). | All Roles |

---

### 11. System Workflows (Step-by-Step)

#### 11.1 Hospital & Staff Onboarding
1. **Admin** registers a new Hospital entity via the Site Admin panel.
2. **Hospital Admin** signs up, selecting their specific hospital.
3. Once the **Site Admin** approves the hospital, the **Hospital Admin** can log in.
4. **Doctors** register by uploading their medical certificate. The **Hospital Admin** reviews and approves them.
5. **Staff** members are registered by the Hospital Admin to assist in patient intake.

#### 11.2 Patient Record Lifecycle
1. **Intake**: A patient presents their QR code or registers as a new user.
2. **Vitals**: Staff scans the QR, enters the "Patients" profile, and records current vitals (BP, SpO2).
3. **Consultation**: The Doctor scans the QR, views vitals trends, and creates a new Consultation record.
4. **Approval**: If a staff member creates a record, it remains "Pending" until the Doctor reviews and clicks "Approve."
5. **Persistence**: The record is hashed, linked to the previous record's hash, and stored in PostgreSQL.

#### 11.3 QR Scanning Workflow
1. Doctor logs into the mobile/desktop dashboard.
2. Clicks "Scan QR" to open the device camera.
3. Upon a successful scan, the frontend extracts the 10-digit ID.
4. A request is sent to `/api/patients/qr/<id>/`.
5. The system returns the full medical dashboard for that specific patient.

---

### 12. Security & Authentication Implementation

Security is the cornerstone of MediTrack. We implement a **Zero-Trust** inspired approach:

- **HttpOnly JWT Auth**: Access and Refresh tokens are stored in `HttpOnly`, `Secure`, and `SameSite=None` cookies. This makes them inaccessible to JavaScript, effectively neutralizing XSS attacks.
- **Two-Factor Authentication (2FA)**: High-privilege access and secure logins are backed by SMS OTPs via Twilio, ensuring compromised passwords alone are insufficient for unauthorized access.
- **Administrative Constraints**: Critical dashboard actions (e.g., deactivating a user, deleting a hospital) require explicit "Type-to-Confirm" visual challenges to prevent accidental or malicious data modification.
- **Silent Refresh**: A middleware intercepts 401 errors, uses the refresh token to get a new access token, and retries the original request without user interruption.
- **Data Encryption**: Sensitive fields like `known_allergies` and `aadhaar_hash` are encrypted at the database level using `django-cryptography` (Fernet symmetric encryption).
- **Brute Force Protection**: `django-axes` tracks login attempts per IP. After 5 failures, the IP is locked for 30 minutes.
- **CSRF Protection**: Standard Django CSRF middleware is enabled for all state-changing requests.
- **Audit Logging**: Every create/update/delete action is logged in an immutable `AuditLog` table with the user's role and IP address.

---

### 13. Performance Optimizations & Best Practices

To ensure a smooth experience even on low-bandwidth hospital networks:

- **Redis Caching**: Dashboard statistics (counts of patients, records, etc.) are cached in Redis with a 5-minute TTL to prevent expensive database aggregations on every page load.
- **GZip Compression**: All JSON responses from the Django API are GZipped, reducing payload size by up to 70%.
- **Lazy Loading**: Frontend components and routes are lazy-loaded via Next.js `dynamic()` to reduce initial bundle size.
- **Connection Pooling**: Database connections are managed via **Neon Connection Pooling** to handle high concurrent user traffic.
- **Throttling**: DRF's `ScopedRateThrottle` is applied to sensitive endpoints (Login, Register) to prevent abuse.

---

### 14. Frontend Project Structure & Logic

The frontend is a modular Next.js 16 application:

```text
frontend/
├── app/                  # Next.js App Router
│   ├── dashboard/        # Role-based sub-folders (Admin, Doctor, etc.)
│   ├── login/            # Authentication pages
│   └── layout.js         # Global providers and theme
├── components/           # Reusable UI components
│   ├── ui/               # Atomic components (Buttons, Cards)
│   ├── shared/           # Complex components (Sidebar, Navbar)
│   └── interactable/     # Logic-heavy (QRScanner, Charts)
├── hooks/                # Custom React hooks (useAuth, usePatients)
├── lib/                  # Utility functions and API config
│   ├── api.js            # Axios instance with interceptors
│   └── schemas.js        # Zod validation schemas
└── tailwind.config.js    # Design system tokens
```

**Key Logic**:
- **Client-First Component Migrations**: Core dashboard logic is built utilizing `use client` directives to solve complicated cross-domain cookie accessibility, ensuring stable session management in production deployments.
- **Zod & Flexible State**: Robust client-side form validation, intentionally designed to gracefully handle optional parameters (preventing DB constraint crashes).
- **TanStack Query**: Handles caching and optimistic UI updates for medical records.
- **Async Route Parameters**: Built for Next.js 15 strict mode, ensuring that dynamic route mappings (like QR scanning endpoints) resolve their `params` asynchronously to eliminate 404 redirection bugs.

---

### 15. Backend Project Structure & Logic

The backend uses a scalable Django app structure:

```text
backend/
├── meditrack/           # Project configuration (settings, wsgi)
├── accounts/            # User models, JWT logic, and Auth views
├── hospitals/           # Hospital registration and management
├── patients/            # Patient profiles, Vitals, and QR generation
├── records/             # Medical records, Prescriptions, and Hashing
├── dashboard/           # Analytics views for all roles
├── manage.py            # CLI entry point
└── requirements.txt     # Python dependencies
```

**Key Logic**:
- **Signals**: Django signals are used to automatically generate QR codes and 10-digit IDs upon user registration.
- **Robust Custom Permissions**: Every viewset is protected by `BaseRolePermission`, which now seamlessly integrates automatic access fallbacks for root `is_superuser` accounts.

---

### 16. Deployment Architecture

MediTrack is designed for cloud-native deployment using a multi-service vendor strategy:

- **Frontend Deployment**: Hosted on **Vercel** to take advantage of their global Edge Network and optimized Next.js builds.
- **Backend Deployment**: Hosted on **Render** using a Gunicorn server for the Django API.
- **Database**: Managed **PostgreSQL** on **Neon**, which offers serverless branching and scale-to-zero capabilities.
- **Cache Layer**: **Upstash Redis** (Serverless Redis) for global low-latency access to analytics data.
- **CI/CD**: Automatic deployments triggered via GitHub hooks upon successful build and lint checks.

---

### 17. Testing & Quality Assurance

To maintain system reliability, several testing layers are implemented:

- **API Testing**: Endpoints are extensively tested using **Postman** and **Insomnia** collections to verify status codes, payload structures, and permission boundaries.
- **Input Validation**: `DRF Serializers` and `Zod Schemas` ensure that malformed data never reaches the database.
- **Manual Clinical Validation**:
    - Scenario: Register a patient -> Record vitals (Staff) -> Create consultation (Doctor) -> Download PDF (Patient).
    - Scenario: Brute-force login test to verify `axes` IP-lockout logic.
- **Linting**: Core codebase adherence to **ESLint** (Frontend) and **PEP8** (Backend) standards.

---

### 18. Known Limitations

While robust, the current version of MediTrack has the following known constraints:

- **Cold Starts**: Since the system uses free/low-tier serverless platforms (Render/Neon), the first request after an idle period may take 15-30 seconds to wake up the server.
- **Offline Support**: The application requires an active internet connection; there is currently no local PWA caching for offline record entry.
- **Real-time Notifications**: Notifications are currently polling-based rather than utilizing WebSockets (Django Channels).
- **Video Consultations**: Telemedicine features are planned but not yet implemented in the core EHR module.

---

### 19. Future Scope & Enhancements

MediTrack aims to evolve into a complete healthcare OS:

- **HIPAA/HDS Compliance**: Pursue formal certification for healthcare data handling in international markets.
- **Mobile Application**: Port the frontend to **React Native** for a smoother camera and notification experience on iOS and Android.
- **AI-Powered Diagnostics**: Integrate Large Language Models (LLMs) to scan medical reports and summarize key patient risks for doctors.
- **Payment Gateway**: Integration with Stripe/Razorpay for instant billing and insurance claim processing.
- **Integrations**: Connect with wearable devices (Apple Health, Fitbit) to sync patient vitals automatically.

---

### 20. Conclusion

**MediTrack** represents a significant step forward in digitized healthcare management. By focusing on data mobility through QR technology and ensuring record integrity through hash-chaining, the platform effectively bridges the gap between different healthcare providers. 

The project demonstrates a successful integration of a robust Python/Django backend with a modern, high-performance React/Next.js frontend. It stands as a production-ready template for any organization looking to implement a secure, scalable, and user-centric Electronic Health Record system.

---
