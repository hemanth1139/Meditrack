# MediTrack — Credentials

> Last updated: 2026-04-12 after full database reset.

---

## System Admin (Superadmin)

| Field    | Value                 |
|----------|-----------------------|
| Email    | `admin@meditrack.com` |
| Password | `Admin123!`           |
| Role     | ADMIN — full system access, Django admin panel |

---

## Hospital Admins

| Hospital               | City        | Email                      | Password     |
|------------------------|-------------|----------------------------|--------------|
| City General Hospital  | New York    | `admin@citygeneral.com`    | `HAdmin@123` |
| Metro Health Center    | Chicago     | `admin@metrohealth.com`    | `HAdmin@123` |
| Westside Clinic        | Los Angeles | `admin@westside.com`       | `HAdmin@123` |

> Hospital Admins can manage their hospital's doctors, staff, and patients from the dashboard.

---

## Doctors

> Doctors self-register at `/register` → select **Doctor**.
> They appear in **Hospital Admin → Doctor Approvals** as Pending until approved.

_No doctors exist yet. Add via the registration page._

---

## Staff

> Staff are **created by the Hospital Admin** from inside the dashboard.
> Go to **Hospital Admin Dashboard → Staff → Add Staff**.

_No staff exist yet._

---

## Patients

> Patients self-register at `/register` → select **Patient**.
> Staff can also register walk-in patients from **Staff Dashboard → Patients → Register New Patient**.

_No patients exist yet._

---

## Quick Links (Production)

| Page           | URL                                                |
|----------------|----------------------------------------------------|
| App Login      | https://meditrack-pi.vercel.app/login              |
| Register       | https://meditrack-pi.vercel.app/register           |
| Django Admin   | https://meditrack-backend.up.railway.app/admin/    |

---

> [!NOTE]
> Database was fully reset on 2026-04-12. Only the superadmin, 3 hospital admins,
> and 3 hospitals exist. All doctors, staff, patients, and medical records must
> be created fresh via the dashboard or registration page.
