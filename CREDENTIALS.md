# MediTrack — Demo Credentials

> **Universal Password for ALL accounts:** `MediTrack@123`

---

## 🛡️ System Admin

| Name | Email | Password | Notes |
|---|---|---|---|
| System Administrator | `admin@meditrack.com` | `MediTrack@123` | Full system access, Django admin panel |

---

## 🏥 Hospital Admins

| Name | Email | Password | Hospital |
|---|---|---|---|
| Rajesh Kumar | `admin.apollo@meditrack.com` | `MediTrack@123` | Apollo Hospitals Chennai |
| Priya Sharma | `admin.fortis@meditrack.com` | `MediTrack@123` | Fortis Hospital Bangalore |

---

## 🩺 Doctors

| Name | Email | Password | Hospital | Specialization | Reg No |
|---|---|---|---|---|---|
| Dr. Arun Venkatesh | `dr.arun.venkatesh@meditrack.com` | `MediTrack@123` | Apollo Hospitals Chennai | Cardiology | REG10000 |
| Dr. Meena Raghavan | `dr.meena.raghavan@meditrack.com` | `MediTrack@123` | Apollo Hospitals Chennai | Neurology | REG10001 |
| Dr. Suresh Gowda | `dr.suresh.gowda@meditrack.com` | `MediTrack@123` | Fortis Hospital Bangalore | Orthopedics | REG10002 |
| Dr. Kavya Nair | `dr.kavya.nair@meditrack.com` | `MediTrack@123` | Fortis Hospital Bangalore | Dermatology | REG10003 |
| Dr. Arjun Pillai | `dr.arjun.solo@meditrack.com` | `MediTrack@123` | MediCare Clinic (Solo Practice) | General Medicine | REG20000 |

---

## 👩‍⚕️ Staff

| Name | Email | Password | Hospital | Role Title |
|---|---|---|---|---|
| Sunita Devi | `staff_sunita_apollo@meditrack.com` | `MediTrack@123` | Apollo Hospitals Chennai | Head Nurse |
| Mohan Das | `staff_mohan_apollo@meditrack.com` | `MediTrack@123` | Apollo Hospitals Chennai | Lab Technician |
| Anitha Rao | `staff_anitha_fortis@meditrack.com` | `MediTrack@123` | Fortis Hospital Bangalore | Receptionist |
| Ramesh Babu | `staff_ramesh_fortis@meditrack.com` | `MediTrack@123` | Fortis Hospital Bangalore | Nursing Assistant |

---

## 👤 Patients

> All patients have a **10-digit unique Patient ID** and a **QR code** generated for them.

| Name | Email | Password | Patient ID | Blood Group | Hospital |
|---|---|---|---|---|---|
| Hemanth Rajan | `hemanth.rajan@patient.meditrack.com` | `MediTrack@123` | `9632530854` | B+ | Apollo Hospitals Chennai |
| Deepika Mohan | `deepika.mohan@patient.meditrack.com` | `MediTrack@123` | `3512095764` | A+ | Apollo Hospitals Chennai |
| Suresh Patel | `suresh.patel@patient.meditrack.com` | `MediTrack@123` | `1318028520` | O+ | Apollo Hospitals Chennai |
| Lalitha Krishnamurthy | `lalitha.km@patient.meditrack.com` | `MediTrack@123` | `0050975943` | AB+ | Apollo Hospitals Chennai |
| Arjun Singh | `arjun.singh@patient.meditrack.com` | `MediTrack@123` | `3930519847` | B- | Apollo Hospitals Chennai |
| Nithya Sundaram | `nithya.sundaram@patient.meditrack.com` | `MediTrack@123` | `3213355238` | A- | Fortis Hospital Bangalore |
| Karan Mehta | `karan.mehta@patient.meditrack.com` | `MediTrack@123` | `3473293587` | O- | Fortis Hospital Bangalore |
| Pooja Agarwal | `pooja.agarwal@patient.meditrack.com` | `MediTrack@123` | `1357060483` | AB- | Fortis Hospital Bangalore |
| Vijay Bhat | `vijay.bhat@patient.meditrack.com` | `MediTrack@123` | `0892191704` | B+ | Fortis Hospital Bangalore |
| Shalini Nair | `shalini.nair@patient.meditrack.com` | `MediTrack@123` | `7993425275` | O+ | MediCare Clinic (Solo Practice) |

---

## 🏥 Hospitals Reference

| Hospital Name | City | State | Email |
|---|---|---|---|
| Apollo Hospitals Chennai | Chennai | Tamil Nadu | `info.chennai@apollohospitals.com` |
| Fortis Hospital Bangalore | Bangalore | Karnataka | `corporate.bangalore@fortishealthcare.com` |
| MediCare Clinic (Solo Practice) | Chennai | Tamil Nadu | `info@medicareclinic.in` |

---

## 🔗 Quick Login Links

| Role | URL |
|---|---|
| All Roles | `http://localhost:3000/login` |
| Django Admin | `http://localhost:8000/admin/` |

> [!TIP]
> To re-seed the database fresh at any time, run:
> ```bash
> python manage.py seed_demo --clear
> ```
