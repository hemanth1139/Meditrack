# MediTrack � Credentials

> **Password for all accounts:** `Admin123!`

---

## ??? System Admin

| Name | Email | Password | Notes |
|---|---|---|---|
| System Administrator | `admin@meditrack.com` | `Admin123!` | Full system access, Django admin panel |

---

## ?? Hospitals & Hospital Admins

| Hospital | City | Hospital Admin Email | Password |
|---|---|---|---|
| City General Hospital | New York | `admin@citygeneral.com` | `Admin123!` |
| Metro Health Center | Chicago | `admin@metrohealth.com` | `Admin123!` |
| Westside Clinic | Los Angeles | `admin@westside.com` | `Admin123!` |

---

## ?? Doctors

> Doctors self-register at `http://localhost:3000/register` ? select **Doctor**.
> They appear in **Hospital Admin ? Doctor Approvals** as **Pending** until approved.

_No doctors exist yet. Add them after deployment via the registration page._

---

## ????? Staff

> Staff are **created by the Hospital Admin** from inside the dashboard.
> Go to **Hospital Admin Dashboard ? Staff** ? click **"Add Staff"**.
> No self-registration needed � the Hospital Admin sets their credentials directly.

_No staff exist yet. Hospital Admins can add them from their dashboard._

---

## ?? Patients

> Patients self-register at `http://localhost:3000/register` ? select **Patient**.
> Staff can also register walk-in patients from **Staff Dashboard ? Patients ? Register New Patient**.

_No patients exist yet._

---

## ?? Quick Links

| | URL |
|---|---|
| App Login | `http://localhost:3000/login` |
| Register | `http://localhost:3000/register` |
| Django Admin Panel | `http://localhost:8000/admin/` |

---

> [!NOTE]
> Database was fully reset. Only the System Admin and 3 hospitals (with their hospital admins) exist.
> All doctors, staff, and patients must be created fresh after deployment.
