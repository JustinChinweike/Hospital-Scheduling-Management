
# Hospital Scheduler System

This project implements a hospital scheduler system with both frontend and backend components.

## Features

### Bronze Tier Features
- Database relationships between entities (Users, Schedules, Logs, MonitoredUsers)
- Full CRUD operations for schedules
- Filtering and sorting on the schedule list
- ORM (Sequelize) for database operations

### Silver Tier Features
- Database seeding with 100,000+ entries
- Performance optimized database with indices
- Complex query optimization for statistics

### Gold Tier Features
- User authentication (register/login)
- User roles (Regular User and Admin)
- Logging system for all CRUD operations
- Background monitoring thread that detects suspicious activity
- Admin dashboard with monitored users list and activity logs
- Simulated attack scenario

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Node.js, Express, Sequelize ORM
- **Database**: PostgreSQL

## Getting Started

### Prerequisites

1. Node.js (v14+)
2. PostgreSQL database

### Setup Instructions

1. **Setup PostgreSQL database**

   Create a PostgreSQL database named `hospital_scheduler`.

2. **Configure backend environment**

   Update the `.env` file in the `backend` directory with your database credentials.

3. **Install backend dependencies**

   ```
   cd backend
   npm install
   ```

4. **Seed the database**

   ```
   npm run seed
   ```

   This will create:
   - Initial admin user (email: admin@example.com, password: password)
   - Initial regular user (email: user@example.com, password: password)
   - 100,000 sample schedule records

5. **Start the backend server**

   ```
   npm run dev
   ```

   The server will run on http://localhost:5000

6. **Install frontend dependencies**

   ```
   cd ..  # Return to project root
   npm install
   ```

7. **Start the frontend development server**

   ```
   npm run dev
   ```

   The frontend will be available at http://localhost:3000

## Demo Credentials

- **Admin User**: 
  - Email: admin@example.com
  - Password: password

- **Regular User**: 
  - Email: user@example.com
  - Password: password

## Testing the Monitoring System

1. Log in as an admin user
2. Go to the Admin Dashboard
3. Click the "Simulate Suspicious Activity" button
4. Wait a few seconds and the user will appear in the monitored users list

## Performance Testing

For Silver tier performance testing, JMeter can be used to test the endpoints under load.
