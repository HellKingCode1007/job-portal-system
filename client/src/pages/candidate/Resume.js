import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const CandidateResume = () => {
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [parsedData, setParsedData] = useState(null);

  useEffect(() => {
    fetchResume();
  }, []);

  const fetchResume = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/resume');
      setResume(response.data.resume);
      setParsedData(response.data.parsedData);
    } catch (err) {
      console.error('Error fetching resume:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, DOC, or DOCX file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(false);

      const formData = new FormData();
      formData.append('resume', file);

      const response = await api.post('/upload/resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResume(response.data.resume);
      setParsedData(response.data.parsedData);
      setSuccess('Resume uploaded successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to upload resume');
      console.error('Error uploading resume:', err);
    } finally {
      setUploading(false);
    }
  };

  const deleteResume = async () => {
    if (!window.confirm('Are you sure you want to delete your resume?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete('/users/resume');
      setResume(null);
      setParsedData(null);
      setSuccess('Resume deleted successfully!');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to delete resume');
      console.error('Error deleting resume:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume Management</h1>
          <p className="text-gray-600">Upload and manage your resume for job applications</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload Resume</h2>
            
            {!resume ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No resume uploaded</h3>
                <p className="text-gray-600 mb-4">
                  Upload your resume to make it easier to apply for jobs
                </p>
                <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Choose File
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Accepted formats: PDF, DOC, DOCX (Max 5MB)
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <h3 className="font-medium text-gray-900">{resume.originalName}</h3>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(resume.size)} • Uploaded {formatDate(resume.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <a
                        href={resume.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                      >
                        View
                      </a>
                      <button
                        onClick={deleteResume}
                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <label className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 cursor-pointer transition-colors">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Replace Resume
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
            )}

            {uploading && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-blue-700">Uploading resume...</span>
                </div>
              </div>
            )}
          </div>

          {/* Parsed Data Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Resume Analysis</h2>
            
            {!parsedData ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-600">Upload a resume to see the analysis</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Contact Information */}
                {parsedData.contact && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
                    <div className="space-y-2">
                      {parsedData.contact.name && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Name:</span>
                          <span className="font-medium">{parsedData.contact.name}</span>
                        </div>
                      )}
                      {parsedData.contact.email && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium">{parsedData.contact.email}</span>
                        </div>
                      )}
                      {parsedData.contact.phone && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span className="font-medium">{parsedData.contact.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {parsedData.skills && parsedData.skills.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Skills Detected</h3>
                    <div className="flex flex-wrap gap-2">
                      {parsedData.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {parsedData.experience && parsedData.experience.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Work Experience</h3>
                    <div className="space-y-3">
                      {parsedData.experience.slice(0, 3).map((exp, index) => (
                        <div key={index} className="border-l-2 border-blue-200 pl-3">
                          <div className="font-medium text-gray-900">{exp.title}</div>
                          <div className="text-sm text-gray-600">{exp.company}</div>
                          {exp.duration && (
                            <div className="text-xs text-gray-500">{exp.duration}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {parsedData.education && parsedData.education.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Education</h3>
                    <div className="space-y-3">
                      {parsedData.education.slice(0, 3).map((edu, index) => (
                        <div key={index} className="border-l-2 border-green-200 pl-3">
                          <div className="font-medium text-gray-900">{edu.degree}</div>
                          <div className="text-sm text-gray-600">{edu.institution}</div>
                          {edu.year && (
                            <div className="text-xs text-gray-500">{edu.year}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confidence Score */}
                {parsedData.confidence && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Parsing Confidence:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {Math.round(parsedData.confidence * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${parsedData.confidence * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Resume Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">Format Guidelines</h4>
              <ul className="space-y-1">
                <li>• Use PDF format for best compatibility</li>
                <li>• Keep file size under 5MB</li>
                <li>• Use clear, readable fonts</li>
                <li>• Include your contact information</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Content Tips</h4>
              <ul className="space-y-1">
                <li>• Highlight relevant skills and experience</li>
                <li>• Use action verbs to describe achievements</li>
                <li>• Include quantifiable results when possible</li>
                <li>• Keep it concise and well-organized</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateResume; 