# MERN Stack Task Management System

A full-stack application built with the MERN stack (MongoDB, Express.js, React.js, Node.js) for managing agents and distributing tasks.

## Features

- Admin User Authentication
- Agent Management
- CSV File Upload and Task Distribution
- Responsive Dashboard Interface

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Project Structure

```
├── backend/           # Express.js backend
├── frontend/         # React.js frontend
└── README.md
```

## Setup Instructions


### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/task-management
   JWT_SECRET=your_jwt_secret
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

### Admin Setup

Create Admin Account
Run the following command to seed an admin user:
   ```bash
   node backend/seedAdmin.js
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory:
   ```
   REACT_APP_API_URL=http://localhost:5000
   ```

4. Start the frontend development server:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- POST /api/auth/login - Admin login

### Agents
- POST /api/agents - Create new agent
- GET /api/agents - Get all agents
- PUT /api/agents/:id - Update agent
- DELETE /api/agents/:id - Delete agent

### Tasks
- POST /api/tasks/upload - Upload CSV file
- GET /api/tasks/distribution - Get task distribution
- GET /api/tasks/agent/:agentId - Get tasks for specific agent
- PUT /api/tasks/:id - Update task details (e.g., status, notes)

## Technologies Used

- **Frontend**: React.js, Material-UI, Axios
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **File Processing**: multer, csv-parser

## Security Features

- JWT Authentication
- Password Hashing
- Input Validation
- File Type Validation
- Error Handling

## License

MIT 
