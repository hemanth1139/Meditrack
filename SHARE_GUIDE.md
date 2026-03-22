# MediTrack Sharing Guide

When sharing this project with your friends, team, or instructor, you **must not** share the entire raw folder. Certain folders belong *only* to your specific computer and will either break on another computer or make your ZIP file hundreds of megabytes too large!

Here is the exact breakdown of what to share and what to delete:

---

## ❌ FOLDERS YOU MUST EXCLUDE (DO NOT SHARE)
Delete these folders from your copy before you zip it up:

### Backend Exclusions
- `H:\project\.venv\` *(Your main virtual environment)*
- `H:\project\meditrack\venv\` *(Your secondary virtual environment)*
- `Any folder named __pycache__` *(e.g., inside `meditrack/`, `accounts/`, etc. These are compiled python files tied to your machine)*

### Frontend Exclusions
- `H:\project\meditrack-frontend\node_modules\` *(This contains thousands of JS packages tailored to your OS)*
- `H:\project\meditrack-frontend\.next\` *(This is Next.js's compiled build cache)*

### Secret Exclusions
- `.env` or `.env.local` files *(You shouldn't share your actual database passwords or secret keys. They should copy the `.env.example` to make their own).*

---

## ✅ WHAT YOU MUST INCLUDE (THE CODE TO SHARE)
Everything else is the actual source code. Your ZIP file should contain:

### Root Files
- `README.md` *(Contains all the startup instructions for your friend!)*
- `requirements.txt` *(Extremely important! They need this to install Python dependencies)*
- `manage.py`
- `CREDENTIALS.md`
- `.env.example`

### Backend Django Folders
- `accounts/`
- `analytics/`
- `audit/`
- `common/`
- `hospitals/`
- `integrity/`
- `management/`
- `meditrack/` *(Make sure `venv` and `__pycache__` inside are deleted!)*
- `notifications/`
- `patients/`
- `records/`

### Frontend Next.js Folder
- `meditrack-frontend/` *(Make sure `node_modules` and `.next` inside are deleted!)*

---

## How your friend will run it
Once you zip up the files listed in the ✅ section and send it to your friend, they will simply open the `README.md` file you provided. 

The `README.md` will tell them exactly how to regenerate their own `venv`, `node_modules`, and `.next` folders using standard commands like `npm install` and `pip install -r requirements.txt`.
