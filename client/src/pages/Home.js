import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaBriefcase, 
  FaSearch, 
  FaUsers, 
  FaChartLine, 
  FaLinkedin,
  FaFileAlt,
  FaBell,
  FaShieldAlt,
  FaRocket
} from 'react-icons/fa';

const Home = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary-600 to-primary-800 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-gradient-to-r from-primary-600 to-primary-800 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                  <span className="block">Find Your Dream</span>
                  <span className="block text-primary-200">Job Today</span>
                </h1>
                <p className="mt-3 text-base text-primary-100 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Connect with top employers and discover opportunities that match your skills and aspirations. 
                  Our advanced job matching system helps you find the perfect role.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      to="/jobs"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                    >
                      <FaSearch className="mr-2" />
                      Browse Jobs
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link
                      to="/register"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-500 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
                    >
                      <FaBriefcase className="mr-2" />
                      Get Started
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="h-56 w-full bg-gradient-to-r from-primary-400 to-primary-600 sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center">
            <FaBriefcase className="h-32 w-32 text-white opacity-20" />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to succeed
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Our comprehensive platform provides all the tools you need to find your next opportunity or hire the perfect candidate.
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              {/* Smart Job Matching */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                  <FaSearch className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Smart Job Matching</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Our AI-powered algorithm matches your skills and experience with the perfect job opportunities.
                </p>
              </div>

              {/* Resume Parsing */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                  <FaFileAlt className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Resume Parsing</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Automatically extract skills and experience from your resume for better job matching.
                </p>
              </div>

              {/* LinkedIn Integration */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                  <FaLinkedin className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">LinkedIn Integration</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Import your professional profile and network connections seamlessly.
                </p>
              </div>

              {/* Real-time Notifications */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                  <FaBell className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Real-time Notifications</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Get instant updates on job applications, interviews, and new opportunities.
                </p>
              </div>

              {/* Advanced Analytics */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                  <FaChartLine className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Advanced Analytics</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Track your application progress and get insights into your job search performance.
                </p>
              </div>

              {/* Secure Platform */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                  <FaShieldAlt className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Secure Platform</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Your data is protected with enterprise-grade security and privacy controls.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-primary-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:py-16 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
                <FaUsers className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <div className="text-4xl font-extrabold text-white">10,000+</div>
                <div className="mt-1 text-xl text-primary-200">Active Users</div>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
                <FaBriefcase className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <div className="text-4xl font-extrabold text-white">5,000+</div>
                <div className="mt-1 text-xl text-primary-200">Job Postings</div>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
                <FaRocket className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <div className="text-4xl font-extrabold text-white">95%</div>
                <div className="mt-1 text-xl text-primary-200">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block text-primary-600">Join thousands of professionals today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Get started
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link
                to="/jobs"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50"
              >
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 