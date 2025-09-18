import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  running: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

const statusIcons = {
  pending: ClockIcon,
  running: ClockIcon,
  completed: CheckCircleIcon,
  failed: XCircleIcon,
  cancelled: XCircleIcon
};

export default function CrawlJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewJobForm, setShowNewJobForm] = useState(false);
  const [newJobUrl, setNewJobUrl] = useState('');
  const [newJobSettings, setNewJobSettings] = useState({
    maxDepth: 3,
    maxPages: 100
  });

  useEffect(() => {
    fetchJobs();
    // Set up polling for job status updates
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/crawl/jobs');
      setJobs(response.data);
    } catch (error) {
      toast.error('Failed to fetch crawl jobs');
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCrawl = async (e) => {
    e.preventDefault();
    
    if (!newJobUrl.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    try {
      await api.post('/crawl/start', {
        url: newJobUrl,
        max_depth: newJobSettings.maxDepth,
        max_pages: newJobSettings.maxPages
      });
      
      toast.success('Crawl job started');
      setNewJobUrl('');
      setShowNewJobForm(false);
      fetchJobs();
    } catch (error) {
      toast.error('Failed to start crawl job');
      console.error('Error starting crawl:', error);
    }
  };

  const handleCancelJob = async (jobId) => {
    try {
      await api.delete(`/crawl/jobs/${jobId}`);
      toast.success('Crawl job cancelled');
      fetchJobs();
    } catch (error) {
      toast.error('Failed to cancel job');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getProgressPercentage = (job) => {
    if (job.total_pages === 0) return 0;
    return Math.round((job.pages_crawled / job.total_pages) * 100);
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crawl Jobs</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage website crawling jobs
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowNewJobForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Crawl Job
          </button>
        </div>
      </div>

      {/* New Job Form */}
      {showNewJobForm && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Start New Crawl Job
            </h3>
            <form onSubmit={handleStartCrawl} className="space-y-4">
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                  Website URL
                </label>
                <input
                  type="url"
                  id="url"
                  value={newJobUrl}
                  onChange={(e) => setNewJobUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="maxDepth" className="block text-sm font-medium text-gray-700">
                    Max Depth
                  </label>
                  <input
                    type="number"
                    id="maxDepth"
                    min="1"
                    max="10"
                    value={newJobSettings.maxDepth}
                    onChange={(e) => setNewJobSettings({...newJobSettings, maxDepth: parseInt(e.target.value)})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="maxPages" className="block text-sm font-medium text-gray-700">
                    Max Pages
                  </label>
                  <input
                    type="number"
                    id="maxPages"
                    min="1"
                    max="1000"
                    value={newJobSettings.maxPages}
                    onChange={(e) => setNewJobSettings({...newJobSettings, maxPages: parseInt(e.target.value)})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewJobForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  Start Crawl
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Jobs List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {jobs.map((job) => {
            const StatusIcon = statusIcons[job.status] || ClockIcon;
            const progress = getProgressPercentage(job);
            
            return (
              <li key={job.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <StatusIcon className="h-6 w-6 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-md">
                          {job.url}
                        </p>
                        <p className="text-sm text-gray-500">
                          Started: {formatDate(job.started_at)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[job.status]}`}>
                        {job.status}
                      </span>
                      
                      {(job.status === 'pending' || job.status === 'running') && (
                        <button
                          onClick={() => handleCancelJob(job.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Progress: {job.pages_crawled} / {job.total_pages || '?'} pages</span>
                      {job.status === 'running' && job.total_pages > 0 && (
                        <span>{progress}%</span>
                      )}
                    </div>
                    
                    {job.status === 'running' && job.total_pages > 0 && (
                      <div className="mt-2">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {job.error_message && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{job.error_message}</p>
                      </div>
                    )}
                    
                    {job.completed_at && (
                      <p className="mt-2 text-sm text-gray-500">
                        Completed: {formatDate(job.completed_at)}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        
        {jobs.length === 0 && (
          <div className="text-center py-12">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No crawl jobs</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start your first crawl job to begin analyzing content.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowNewJobForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Start Crawling
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
