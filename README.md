# MediTrack Local Setup Guide

Welcome to MediTrack! This guide will help you set up and run the application locally on your machine. The project is structured with a **Django backend** and a **Next.js frontend**.

## 📌 Prerequisites

Ensure you have the following installed on your machine:
- **[Python 3.8+](https://www.python.org/downloads/)**
- **[Node.js (v18+ recommended)](https://nodejs.org/)**
- **Git**

---

## 🛠️ 1. Environment Configurations

Before starting the servers, you need to set up your environment variables.

### Backend (`.env`)
1. In the root folder of the project, you will find a `.env.example` file.
2. Duplicate it and rename it to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and configure any required database or third-party service credentials. *(By default, local development can use SQLite and console email backend, but Cloudinary credentials are required for image uploads)*.

### Frontend (`frontend/.env.local`)
1. Navigate to the `frontend` folder.
2. Duplicate the `.env.local.example` file and rename it to `.env.local`:
   ```bash
   cd frontend
   cp .env.local.example .env.local
   ```

---

## ⚙️ 2. Backend Setup (Django)

1. **Open a terminal** and ensure you are in the root directory of the project.
2. **Activate the virtual environment**:
   - **Windows:**
     ```bash
     .venv\Scripts\activate
     ```
   - **Mac/Linux:**
     ```bash
     source .venv/bin/activate
     ```
   *(If the `.venv` folder is missing, create it first using: `python -m venv .venv`)*
3. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```
4. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
5. **Apply database migrations**:
   ```bash
   python manage.py migrate
   ```
6. **Seed the database with sample demo data** (Highly Recommended):
   ```bash
   python manage.py seed_demo --clear
   ```
7. **Start the backend development server**:
   ```bash
   python manage.py runserver
   ```
   *The Django API will now be accessible at `http://localhost:8000`.*

---

## 💻 3. Frontend Setup (Next.js)

1. **Open a new terminal session** and ensure you are in the root directory.
2. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```
3. **Install Node dependencies**:
   ```bash
   npm install
   ```
4. **Start the frontend development server**:
   ```bash
   npm run dev
   ```
   *The React/Next.js frontend will now be accessible at `http://localhost:3000`.*

---

## 🌐 4. Accessing the Platform

With both the backend and frontend servers running simultaneously:

- Open your browser and navigate to the application: **[http://localhost:3000](http://localhost:3000)**
- To test the application's different features, refer to the **`CREDENTIALS.md`** file located in the root directory. It contains a list of demo accounts for every role (Admin, Doctors, Patients, Staff, etc.). The universal default password for seeded accounts is `MediTrack@123`.
- The Django Admin panel is located at: **[http://localhost:8000/admin/](http://localhost:8000/admin/)**

---

## 🐛 Troubleshooting

- **Cannot Upload Files / QR Codes failing?** You must set valid `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in your root `.env` file.
- **Missing Module or Database Error?** Ensure you have activated the virtual environment and ran `python manage.py migrate`. Use `python manage.py seed_demo --clear` to fix uninitialized patient/user relations.
- **Frontend Running Out of Memory?** The frontend's `dev` script is pre-configured to allocate memory to Next.js (`--max-old-space-size`), so use `npm run dev` rather than invoking `next dev` directly.
