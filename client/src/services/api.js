import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (currentPassword, newPassword) => 
    api.put('/auth/password', { currentPassword, newPassword }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => 
    api.post('/auth/reset-password', { token, newPassword }),
};

// Jobs API
export const jobsAPI = {
  getAll: (params) => api.get('/jobs', { params }),
  getById: (id) => api.get(`/jobs/${id}`),
  create: (jobData) => api.post('/jobs', jobData),
  update: (id, jobData) => api.put(`/jobs/${id}`, jobData),
  delete: (id) => api.delete(`/jobs/${id}`),
  getMyJobs: (params) => api.get('/jobs/employer/my-jobs', { params }),
  getRecommended: (params) => api.get('/jobs/recommended', { params }),
  approve: (id) => api.post(`/jobs/${id}/approve`),
  reject: (id, reason) => api.post(`/jobs/${id}/reject`, { reason }),
};

// Applications API
export const applicationsAPI = {
  create: (applicationData) => api.post('/applications', applicationData),
  getAll: (params) => api.get('/applications', { params }),
  getById: (id) => api.get(`/applications/${id}`),
  updateStatus: (id, status, notes) => 
    api.put(`/applications/${id}/status`, { status, notes }),
  scheduleInterview: (id, interviewData) => 
    api.post(`/applications/${id}/interview`, interviewData),
  evaluate: (id, evaluationData) => 
    api.post(`/applications/${id}/evaluate`, evaluationData),
  makeOffer: (id, offerData) => 
    api.post(`/applications/${id}/offer`, offerData),
  acceptOffer: (id) => api.post(`/applications/${id}/accept-offer`),
  withdraw: (id) => api.post(`/applications/${id}/withdraw`),
  getStats: () => api.get('/applications/stats/dashboard'),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  updateCandidateProfile: (profileData) => 
    api.put('/users/candidate-profile', profileData),
  addExperience: (experienceData) => 
    api.post('/users/candidate-profile/experience', experienceData),
  updateExperience: (id, experienceData) => 
    api.put(`/users/candidate-profile/experience/${id}`, experienceData),
  deleteExperience: (id) => 
    api.delete(`/users/candidate-profile/experience/${id}`),
  addEducation: (educationData) => 
    api.post('/users/candidate-profile/education', educationData),
  updateEducation: (id, educationData) => 
    api.put(`/users/candidate-profile/education/${id}`, educationData),
  deleteEducation: (id) => 
    api.delete(`/users/candidate-profile/education/${id}`),
  updateEmployerProfile: (profileData) => 
    api.put('/users/employer-profile', profileData),
  uploadResume: (resumeData) => api.post('/users/resume', resumeData),
  deleteResume: () => api.delete('/users/resume'),
};

// LinkedIn API
export const linkedinAPI = {
  getAuthUrl: () => api.get('/linkedin/auth-url'),
  importProfile: (accessToken) => 
    api.post('/linkedin/import', { accessToken }),
  getProfile: () => api.get('/linkedin/profile'),
  disconnect: () => api.post('/linkedin/disconnect'),
  sync: (accessToken) => api.post('/linkedin/sync', { accessToken }),
};

// Upload API
export const uploadAPI = {
  uploadResume: (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post('/upload/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadLogo: (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post('/upload/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadDocument: (file) => {
    const formData = new FormData();
    formData.append('document', file);
    return api.post('/upload/document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteFile: (publicId) => api.delete(`/upload/${publicId}`),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, isActive) => 
    api.put(`/admin/users/${id}/status`, { isActive }),
  updateUserRole: (id, role) => 
    api.put(`/admin/users/${id}/role`, { role }),
  getJobs: (params) => api.get('/admin/jobs', { params }),
  approveJob: (id) => api.post(`/admin/jobs/${id}/approve`),
  rejectJob: (id, reason) => api.post(`/admin/jobs/${id}/reject`, { reason }),
  getApplications: (params) => api.get('/admin/applications', { params }),
  getAnalytics: () => api.get('/admin/analytics'),
  verifyEmployer: (id) => api.post(`/admin/employers/${id}/verify`),
};

// Utility functions
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatCurrency = (amount, currency = 'USD') => {
  if (!amount) return 'Not specified';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const getStatusColor = (status) => {
  const statusColors = {
    applied: 'blue',
    reviewing: 'yellow',
    shortlisted: 'purple',
    'interview-scheduled': 'indigo',
    interviewed: 'orange',
    offered: 'green',
    hired: 'emerald',
    rejected: 'red',
    withdrawn: 'gray',
  };
  return statusColors[status] || 'gray';
};

export const getJobTypeColor = (jobType) => {
  const jobTypeColors = {
    'full-time': 'green',
    'part-time': 'blue',
    contract: 'purple',
    internship: 'yellow',
    freelance: 'orange',
  };
  return jobTypeColors[jobType] || 'gray';
};

export const getLevelColor = (level) => {
  const levelColors = {
    entry: 'green',
    junior: 'blue',
    mid: 'yellow',
    senior: 'orange',
    lead: 'purple',
    executive: 'red',
  };
  return levelColors[level] || 'gray';
};

export default api; 