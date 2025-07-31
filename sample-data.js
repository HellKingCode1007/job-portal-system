const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./server/models/User');
const Job = require('./server/models/Job');

// Sample data
const sampleUsers = [
  {
    firstName: 'John',
    lastName: 'Candidate',
    email: 'candidate@test.com',
    password: 'password123',
    role: 'candidate',
    phone: '+1-555-0123',
    location: 'New York, NY',
    bio: 'Experienced software developer looking for new opportunities',
    skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
    experience: 'Mid',
    education: 'BS Computer Science, University of Technology'
  },
  {
    firstName: 'Sarah',
    lastName: 'Employer',
    email: 'employer@test.com',
    password: 'password123',
    role: 'employer',
    company: 'TechCorp Inc.',
    phone: '+1-555-0456',
    location: 'San Francisco, CA',
    bio: 'HR Manager at TechCorp Inc.'
  },
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin'
  }
];

const sampleJobs = [
  {
    title: 'Senior React Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    type: 'Full-time',
    experienceLevel: 'Senior',
    salaryMin: 120000,
    salaryMax: 180000,
    description: 'We are looking for a talented Senior React Developer to join our growing team. You will be responsible for building and maintaining high-quality web applications using React and modern JavaScript frameworks.',
    requirements: '5+ years of experience with React, TypeScript, Redux, and modern JavaScript. Experience with Node.js and MongoDB is a plus. Strong problem-solving skills and ability to work in a team environment.',
    benefits: 'Competitive salary, health insurance, 401k matching, flexible work hours, remote work options, professional development budget',
    category: 'Technology',
    isRemote: true,
    employer: null // Will be set after user creation
  },
  {
    title: 'Marketing Manager',
    company: 'Digital Solutions Ltd.',
    location: 'New York, NY',
    type: 'Full-time',
    experienceLevel: 'Mid',
    salaryMin: 80000,
    salaryMax: 120000,
    description: 'Join our marketing team as a Marketing Manager. You will develop and execute marketing strategies to drive brand awareness and customer acquisition.',
    requirements: '3+ years of marketing experience, strong analytical skills, experience with digital marketing tools, excellent communication skills',
    benefits: 'Health benefits, paid time off, performance bonuses, career growth opportunities',
    category: 'Marketing',
    isRemote: false,
    employer: null
  },
  {
    title: 'Data Scientist',
    company: 'AI Innovations',
    location: 'Austin, TX',
    type: 'Full-time',
    experienceLevel: 'Senior',
    salaryMin: 130000,
    salaryMax: 200000,
    description: 'We are seeking a Data Scientist to help us build innovative AI solutions. You will work with large datasets and develop machine learning models.',
    requirements: 'PhD in Computer Science or related field, 5+ years experience with Python, TensorFlow, PyTorch, strong statistical background',
    benefits: 'Competitive salary, equity options, health insurance, flexible work arrangements, conference attendance',
    category: 'Technology',
    isRemote: true,
    employer: null
  }
];

async function createSampleData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Job.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`Created user: ${userData.email}`);
    }

    // Get employer user for job creation
    const employerUser = createdUsers.find(user => user.role === 'employer');

    // Create jobs
    for (const jobData of sampleJobs) {
      const job = new Job({
        ...jobData,
        employer: employerUser._id
      });
      await job.save();
      console.log(`Created job: ${jobData.title}`);
    }

    console.log('\n✅ Sample data created successfully!');
    console.log('\n📋 Test Accounts:');
    console.log('Candidate: candidate@test.com / password123');
    console.log('Employer: employer@test.com / password123');
    console.log('Admin: admin@test.com / password123');
    console.log('\n🌐 Access your app at: http://localhost:3000');

  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createSampleData(); 