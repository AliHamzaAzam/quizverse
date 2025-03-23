# QuizVerse

QuizVerse is a web application that allows users to create, share, and participate in quizzes. The platform features a robust authentication system with both local and Google OAuth login options.

## Technologies Used

### Frontend
- Vue.js
- Vue Router
- Pinia (for state management)

### Backend
- Node.js
- Express
- MongoDB with Mongoose
- bcrypt.js for password hashing
- Cloudinary for profile image storage

## Features

- User authentication
    - Email/password registration and login
    - Google OAuth integration
- User profiles with customization
    - Profile pictures
    - Display names
    - Personal accent colors
- Admin dashboard
- Quiz creation and participation (implied by project name)

## Setup Instructions

### Prerequisites
- Node.js
- npm or yarn
- MongoDB

### Backend Setup
1. Clone the repository
2. Navigate to the backend directory
```bash
cd backend
```
3. Install dependencies
```bash
npm install
```
4. Create a `.env` file with the following variables:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
5. Start the server
```bash
npm start
```

### Frontend Setup
1. Navigate to the frontend-user directory
```bash
cd frontend-user
```
2. Install dependencies
```bash
npm install
```
3. Create a `.env` file with:
```
VITE_BACKEND_URL=http://localhost:5000
```
4. Start the development server
```bash
npm run dev
```

## Creating an Admin User

To create an initial admin user:
```bash
node temp_create_admin.js
```
This will create an admin user with:
- Email: admin@quizverse.com
- Password: TempPass123!

**Note:** For security purposes, change the admin password after the first login.

## Authentication

The application supports:
- Local authentication with email/password
- Google OAuth login
- Role-based access (admin/user)


