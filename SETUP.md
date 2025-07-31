# 🚀 Quick Setup Guide

## Step 1: Create Environment File

Create a `.env` file in the root directory with the following content:

```env
# Required Environment Variables
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/job-portal?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Optional Environment Variables (for advanced features)
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

## Step 2: Get MongoDB Atlas Connection String

### Option A: Use MongoDB Atlas (Recommended)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free account
3. Create a new cluster (free tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `username`, `password`, and `cluster` with your actual values

### Option B: Use Local MongoDB
If you have MongoDB installed locally:
```env
MONGODB_URI=mongodb://localhost:27017/job-portal
```

## Step 3: Generate JWT Secret

Generate a random JWT secret (you can use any of these methods):

### Method 1: Online Generator
Go to: https://generate-secret.vercel.app/32

### Method 2: Node.js Command
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Method 3: Use a Simple String (for development only)
```env
JWT_SECRET=my-super-secret-key-for-development-only
```

## Step 4: Run the Application

### Windows:
```bash
start.bat
```

### Unix/Linux/Mac:
```bash
chmod +x start.sh
./start.sh
```

### Manual:
```bash
npm install
cd client && npm install && cd ..
npm run dev
```

## Step 5: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 🔧 Optional Setup (Advanced Features)

### LinkedIn Integration
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Get Client ID and Client Secret
4. Add to `.env` file

### Cloudinary (File Uploads)
1. Go to [Cloudinary](https://cloudinary.com/)
2. Create a free account
3. Get Cloud Name, API Key, and API Secret
4. Add to `.env` file

### Email Notifications (Gmail)
1. Enable 2-factor authentication on your Gmail
2. Generate an App Password
3. Add to `.env` file

## 🐛 Troubleshooting

### Common Issues:

1. **MongoDB Connection Error**
   - Check your connection string
   - Make sure your IP is whitelisted in MongoDB Atlas
   - Verify username/password are correct

2. **Port Already in Use**
   - Kill processes on ports 3000 and 5000
   - Or change ports in package.json

3. **Module Not Found Errors**
   - Run `npm install` in both root and client directories
   - Delete node_modules and package-lock.json, then reinstall

4. **Environment Variables Not Loading**
   - Make sure `.env` file is in the root directory
   - Restart the development server

## 📝 Minimum Required Setup

For basic functionality, you only need:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_random_secret_key
```

Everything else is optional and will work with default/fallback values. 