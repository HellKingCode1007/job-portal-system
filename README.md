# Job Portal System

A comprehensive job portal system built with the MERN stack (MongoDB, Express.js, React.js, Node.js) featuring advanced job matching, resume parsing, and LinkedIn integration.

## Features

### Core Features
- **Job Listings and Applications**: Browse and apply to job postings
- **Resume Parsing and Job Matching**: AI-powered resume analysis and job recommendations
- **Employer and Candidate Dashboards**: Separate interfaces for different user types
- **Admin Panel for Moderation**: Complete administrative control and moderation tools

### Advanced Add-ons
- **LinkedIn API Integration**: Import profiles and professional data from LinkedIn
- **Resume Upload and Parsing**: PDF resume parsing with skill extraction
- **Smart Job Matching**: Algorithm-based job recommendations
- **Email Notifications**: Automated email alerts for applications and updates
- **Real-time Updates**: Live notifications and status updates

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: React.js with modern UI components
- **Authentication**: JWT-based authentication
- **File Upload**: Multer with Cloudinary integration
- **External APIs**: LinkedIn API v2
- **Email**: Nodemailer for notifications

## Installation

### Quick Start (Windows)
1. Clone the repository:
```bash
git clone <repository-url>
cd job-portal-system
```

2. Run the startup script:
```bash
start.bat
```

### Quick Start (Unix/Linux/Mac)
1. Clone the repository:
```bash
git clone <repository-url>
cd job-portal-system
```

2. Make the script executable and run:
```bash
chmod +x start.sh
./start.sh
```

### Manual Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd job-portal-system
```

2. Install server dependencies:
```bash
npm install
```

3. Install client dependencies:
```bash
cd client
npm install
cd ..
```

4. Create a `.env` file in the root directory:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

5. Start the development server:
```bash
npm run dev
```

### Environment Variables

- **MONGODB_URI**: Your MongoDB connection string (required)
- **JWT_SECRET**: Secret key for JWT token generation (required)
- **LINKEDIN_CLIENT_ID**: LinkedIn API client ID (optional)
- **LINKEDIN_CLIENT_SECRET**: LinkedIn API client secret (optional)
- **CLOUDINARY_CLOUD_NAME**: Cloudinary cloud name for file uploads (optional)
- **CLOUDINARY_API_KEY**: Cloudinary API key (optional)
- **CLOUDINARY_API_SECRET**: Cloudinary API secret (optional)
- **EMAIL_USER**: Gmail address for sending notifications (optional)
- **EMAIL_PASS**: Gmail app password (optional)

## Current Implementation Status

### ✅ Completed Features

#### Backend (Server)
- ✅ User authentication and authorization (JWT)
- ✅ User management (candidates, employers, admins)
- ✅ Job posting and management
- ✅ Application submission and tracking
- ✅ File upload (resumes, documents)
- ✅ LinkedIn API integration
- ✅ Resume parsing and analysis
- ✅ Email notifications
- ✅ Admin panel and moderation
- ✅ Rate limiting and security middleware

#### Frontend (Client)
- ✅ User authentication (login/register)
- ✅ Job listing and search functionality
- ✅ Job detail pages with application forms
- ✅ Candidate dashboard with application tracking
- ✅ Candidate profile management
- ✅ Resume upload and management
- ✅ Employer dashboard
- ✅ Responsive design with Tailwind CSS
- ✅ Protected routes and role-based access

### 🚧 In Progress / To Be Implemented
- 🔄 Employer job creation and management pages
- 🔄 Employer application review system
- 🔄 Admin dashboard and analytics
- 🔄 Real-time notifications
- 🔄 Advanced job matching algorithm
- 🔄 Interview scheduling system

## Usage

### For Job Seekers
1. Register/Login to your account
2. Upload your resume or import from LinkedIn
3. Browse available job listings
4. Apply to jobs with one-click application
5. Track your application status

### For Employers
1. Register/Login as an employer
2. Post job listings with detailed requirements
3. Review applications and candidate profiles
4. Manage interview scheduling
5. Track hiring pipeline

### For Administrators
1. Access admin panel with full system control
2. Moderate job postings and user accounts
3. View system analytics and reports
4. Manage user permissions and roles

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Jobs
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create new job (employers only)
- `GET /api/jobs/:id` - Get specific job
- `PUT /api/jobs/:id` - Update job (employers only)
- `DELETE /api/jobs/:id` - Delete job (employers only)

### Applications
- `POST /api/applications` - Submit job application
- `GET /api/applications` - Get user applications
- `PUT /api/applications/:id` - Update application status

### LinkedIn Integration
- `POST /api/linkedin/import` - Import LinkedIn profile
- `GET /api/linkedin/profile` - Get LinkedIn profile data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License. 