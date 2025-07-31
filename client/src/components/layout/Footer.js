import React from 'react';
import { Link } from 'react-router-dom';
import { FaBriefcase, FaGithub, FaLinkedin, FaTwitter, FaEnvelope } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center">
              <FaBriefcase className="h-8 w-8 text-primary-400" />
              <span className="ml-2 text-xl font-bold">JobPortal</span>
            </div>
            <p className="mt-4 text-gray-300 max-w-md">
              Connect talented professionals with amazing opportunities. 
              Find your dream job or hire the best talent for your organization.
            </p>
            <div className="mt-6 flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white">
                <FaTwitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <FaLinkedin className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <FaGithub className="h-6 w-6" />
              </a>
              <a href="mailto:contact@jobportal.com" className="text-gray-400 hover:text-white">
                <FaEnvelope className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
              For Job Seekers
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link to="/jobs" className="text-base text-gray-300 hover:text-white">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-base text-gray-300 hover:text-white">
                  Create Profile
                </Link>
              </li>
              <li>
                <Link to="/jobs" className="text-base text-gray-300 hover:text-white">
                  Job Alerts
                </Link>
              </li>
              <li>
                <Link to="/jobs" className="text-base text-gray-300 hover:text-white">
                  Career Advice
                </Link>
              </li>
            </ul>
          </div>

          {/* For Employers */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
              For Employers
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link to="/register" className="text-base text-gray-300 hover:text-white">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link to="/jobs" className="text-base text-gray-300 hover:text-white">
                  Search Candidates
                </Link>
              </li>
              <li>
                <Link to="/jobs" className="text-base text-gray-300 hover:text-white">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link to="/jobs" className="text-base text-gray-300 hover:text-white">
                  Employer Resources
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-base text-gray-400">
              © 2024 JobPortal. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <Link to="/privacy" className="text-base text-gray-400 hover:text-white">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-base text-gray-400 hover:text-white">
                Terms of Service
              </Link>
              <Link to="/contact" className="text-base text-gray-400 hover:text-white">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 