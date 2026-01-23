
# Regulatory Case Management System (RCMS)

A full-stack web application that simulates a **Regulatory Case Management System** for a fictional **Nurses Licensing Authority**.  
The system allows applicants (nurses) to submit license and renewal applications, while officers review and manage them.

This project demonstrates **frontend–backend integration**, **SQL Server connectivity**, and **XML-driven dynamic forms**.

---

## 📌 Features

### 👩‍⚕️ Applicant
- Login as Applicant
- Submit **New License Application**
- Submit **License Renewal Application**
- View submitted applications and their status
- XML-driven dynamic form rendering

### 🧑‍💼 Officer
- Login as Officer
- View all submitted applications
- Approve or reject applications
- Review application payloads stored in SQL Server

### ⚙️ System
- Node.js REST API
- Microsoft SQL Server (SSMS)
- XML-based form definitions
- Clean UI with vanilla HTML, CSS, JavaScript
- Role-based access (Applicant / Officer)
- Git-ready project structure

---

## 🧱 Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript (ES Modules)
- XML (dynamic forms)

### Backend
- Node.js
- Express.js
- MSSQL (Tedious driver)

### Database
- Microsoft SQL Server
- SQL Server Management Studio (SSMS)

### Tools
- Git & GitHub
- VS Code
- Python HTTP Server (frontend hosting)

---

## 🚀 How to Run the Project

### 1️⃣ Backend Setup
```bash
cd backend
npm install
npm run dev
Backend runs on:
http://localhost:3001
Health check:
http://localhost:3001/api/health

Frontend Setup
cd frontend
python -m http.server 5500


Frontend runs on:
http://localhost:5500

🔑 Test Login Credentials
Officer
Email: officer@rcms.local
Password: any value (temporary)

Applicant
Email: nurse1@rcms.local
Password: any value (temporary)

🗄️ Database
SQL Server (Local)
Tables:
Users
Applications
Licenses

API Endpoints (Sample)
Method	Endpoint	Description
GET	/api/health	Health check
POST	/api/auth/login	Login
GET	/api/applications/me	Applicant applications
POST	/api/applications	Submit new application
PUT	/api/applications/:id/approve	Approve
PUT	/api/applications/:id/reject	Reject

output:
<img width="1920" height="1200" alt="RCMS" src="https://github.com/user-attachments/assets/6346c348-decd-43c8-9240-d268589663dd" />

