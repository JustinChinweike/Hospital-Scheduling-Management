# Hospital Scheduling Management System

**Hospital Scheduling Management System** is a full-stack web application designed to manage appointments, doctor-patient scheduling, and system monitoring workflows in a hospital or clinic. It provides interfaces for staff to manage appointments, assign doctors, and monitor activities through an admin dashboard.

---

## Features

- **Appointment Scheduling:** Add, view, update, and delete hospital appointment records with assigned doctors, departments, and timestamps.
- **User Authentication & Roles:** JWT-based login system supporting both Admin and Regular User roles.
- **Two-Factor Authentication (2FA):** Optional 2FA via time-based OTP (TOTP) for secure logins.
- **Search & Filters:** Intuitive schedule filtering and sorting by date, doctor, department, etc.
- **Admin Dashboard:** Visual logs of system activity and flagged user behavior via monitoring thread.
- **Audit Logging:** All schedule modifications (create, update, delete) are stored securely.
- **Scalability:** Seeded with over 100,000 schedule entries to test large-scale performance.
- **Health Monitoring:** `/health` endpoint and real-time socket events (connect/disconnect detection) for operational visibility.

---


## Technologies Used

- **Frontend:** React (TypeScript), Vite, Tailwind CSS, Radix UI
- **Backend:** Node.js, Express.js, Socket.IO
- **Database:** PostgreSQL with Sequelize ORM
- **Security:** JWT, Bcrypt (password hashing), Speakeasy (2FA), Zod (validation), CORS
- **DevOps:** Docker, Docker Compose, Railway (PaaS)
- **Tooling:** ESLint, Prettier, Morgan (logging)

---


## Live Demo

The application is deployed on **Railway**:

🔗 **Frontend:** [https://frontend-production-5fd8.up.railway.app](https://frontend-production-5fd8.up.railway.app)

Use the demo credentials below:

- **Admin User:**  
  Email: `admin@example.com`  
  Password: `password`

- **Regular User:**  
  Email: `user@example.com`  
  Password: `password`

---

## Project Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL

---
### Setting Up the Backend

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install the required dependencies:
   ```
   npm install
   ```

3. Set up your PostgreSQL database:
   - Make sure PostgreSQL is installed and running
   - Create a database named `hospital_schedule`
   - Update the `.env` file with your database credentials if needed

4. Seed the database with initial data:
   ```
   npm run seed
   ```
   This will create:
   - Admin user: admin@example.com / password
   - Regular user: user@example.com / password
   - 100,000+ sample schedule records

5. Start the backend server:
   ```
   npm run dev
   ```
   The backend server will run on http://localhost:5000

### Setting Up the Frontend
1. Open a new terminal and navigate to the project root directory

2. Install frontend dependencies:
   ```
   npm install
   ```

3. Create a `.npmrc` file in the root directory with the following content:
   ```
   legacy-peer-deps=true
   ```
4. Create .env for the frontend and set API URL:
   ```
   VITE_API_URL=http://localhost:5000
   ```
5. Start the frontend development server:
   ```
   npm run dev
   ```
   The frontend application will be available at http://localhost:8080

## Using the Application

### Admin View

- **Access Logs:** Admins can view logs of all create, update, and delete operations performed throughout the system.
- **User Monitoring:** Admins can see a list of flagged users identified by the backend's real-time monitoring thread. This helps detect suspicious scheduling activity (e.g., abnormally high frequency of operations).

### Regular User View

- **View Schedules:** Users can log in and access the schedule dashboard to view appointments.
- **Manage Appointments:** Users have permission to add, update, or delete hospital appointments, based on their access level.


## Troubleshooting

### Backend Issues
- Ensure PostgreSQL is running and accessible
- Check that the database credentials in the `.env` file are correct
- Verify that port 5000 is not in use by another application

### Frontend Issues
- If you encounter dependency conflicts, ensure the `.npmrc` file contains `legacy-peer-deps=true`
- Clear browser cache if you experience unexpected behaviors
- Check the browser console for any error messages


## Security Features

The system includes a monitoring thread that detects suspicious activity:
- Tracks users with high activity rates
- Identifies potential attack patterns
- Alerts admins via the dashboard



