
# Hospital Scheduling Management System

**Hospital Scheduling Management System** is a full-stack web application designed to manage patient appointments, doctor schedules, and overall appointment workflows in a hospital or clinic. It provides interfaces for staff to schedule appointments, assign doctors to patients, and monitor scheduling activity via an admin dashboard.

## Features

- **Appointment Scheduling:** Create, view, and manage hospital appointment slots with details like doctor, patient, date/time, and department.
- **User Management & Authentication:** Secure login and registration with JWT-based authentication. Supports role-based access control with Regular Users (scheduling staff) and Admins.
- **Two-Factor Authentication (2FA):** Option to enable 2FA for accounts, providing an extra layer of security for login (using OTP codes).
- **Filtering & Search:** Easily filter and sort the schedule list (e.g., by date, doctor, department) to find appointments.
- **Admin Dashboard:** Admin users can view system logs and a list of monitored users. A background monitoring service flags suspicious activity (e.g. unusually high scheduling rates or potential attacks) and highlights these in the admin dashboard.
- **Audit Logging:** All create, update, or delete actions on schedules are logged for security and auditing purposes.
- **Performance at Scale:** The system is optimized to handle a large volume of appointments (seeded with 100,000+ sample records for testing) with indexing and optimized queries for statistics.
- **Health Monitoring:** Provides a health check endpoint (`/health`) for infrastructure monitoring, and uses real-time notifications (via WebSocket/Socket.io) to detect clients connecting/disconnecting (foundation for real-time updates).

## Technologies Used

- **Frontend:** React (TypeScript) with Vite as the build tool. UI components and styling are done with Tailwind CSS and Radix UI for accessible, pre-built components.
- **Backend:** Node.js with Express.js framework for building a RESTful API. Uses Sequelize (SQL ORM) to interact with a PostgreSQL database.
- **Database:** PostgreSQL for data persistence, with relations set up between Users and Schedules. Includes seed scripts to populate initial data.
- **Authentication & Security:** JSON Web Tokens (JWT) for auth sessions, BCrypt for password hashing (in user model), and Speakeasy for handling 2FA TOTP codes. CORS enabled for API, and input validation is handled via Zod schemas.
- **Real-time & Others:** Socket.io is configured on the backend (prepared for real-time features or future live updates). Logging with Morgan for development, and Docker for containerization.
- **Deployment:** Docker and Docker Compose are used to containerize the application (frontend, backend, and database). The application is deployed on Railway (PaaS) for production.

## Live Demo

A live deployment of the application is available on **Railway**:

- **Frontend Live URL:** https://frontend-production-5fd8.up.railway.app  
_(You can access the web app using the above link. Note that the backend API is also hosted on Railway and the frontend is configured to communicate with it.)_

**Default test credentials:**  
- Admin user – Email: `admin@example.com`, Password: `password`  
- Regular user – Email: `user@example.com`, Password: `password`  

You can use the above accounts to log in and explore the features (Admin accounts can view the admin dashboard).



## Project Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL database

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

4. Start the frontend development server:
   ```
   npm run dev
   ```
   The frontend application will be available at http://localhost:8080

## Using the Application

### Login Credentials
- **Admin User**: 
  - Email: admin@example.com
  - Password: password

- **Regular User**: 
  - Email: user@example.com
  - Password: password

### Main Features
1. **Authentication**: Register new users or login with existing accounts
2. **Add Schedules**: Create new hospital appointments
3. **List Schedules**: View, filter, and sort all hospital appointments
4. **Admin Dashboard**: Monitor system activity and suspicious users (admin only)

## Troubleshooting

### Backend Issues
- Ensure PostgreSQL is running and accessible
- Check that the database credentials in the `.env` file are correct
- Verify that port 5000 is not in use by another application

### Frontend Issues
- If you encounter dependency conflicts, ensure the `.npmrc` file contains `legacy-peer-deps=true`
- Clear browser cache if you experience unexpected behaviors
- Check the browser console for any error messages

## Performance Monitoring

For Silver tier performance testing, JMeter or similar tools can be used to test the API endpoints under load.

## Security Features

The system includes a monitoring thread that detects suspicious activity:
- Tracks users with high activity rates
- Identifies potential attack patterns
- Alerts admins via the dashboard
