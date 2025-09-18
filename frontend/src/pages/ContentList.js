import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

const statusColors = {
  pending: 'bg-red-100 text-red-800',
  analyzed: 'bg-green-100 text-green-800',
  reviewed: 'bg-blue-100 text-blue-800'
};

export default function ContentList() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchContent();
  }, [statusFilter]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await api.get(`/content/?${params}`);
      setContent(response.data);
    } catch (error) {
      toast.error('Failed to fetch content');
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchContent();
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/content/search/?query=${encodeURIComponent(searchQuery)}`);
      setContent(response.data);
    } catch (error) {
      toast.error('Search failed');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (contentId) => {
    try {
      await api.post('/content/analyze', { content_id: contentId });
      toast.success('Analysis started');
      fetchContent();
    } catch (error) {
      toast.error('Failed to start analysis');
    }
  };

  const handleDelete = async (contentId) => {
    if (!window.confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      await api.delete(`/content/${contentId}`);
      toast.success('Content deleted');
      fetchContent();
    } catch (error) {
      toast.error('Failed to delete content');
    }
  };

  const filteredContent = content.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
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
          <h1 className="text-2xl font-bold text-purple-700">Content</h1>
          <p className="mt-2 text-sm text-purple-600">
            Manage and review crawled content
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search content by title or URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="analyzed">Analyzed</option>
              <option value="reviewed">Reviewed</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between">
          <button
            onClick={handleSearch}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-primary-700"
          >
            <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
            Search
          </button>
          
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('');
              fetchContent();
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Content List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredContent.map((item) => (
            <li key={item.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                    <div>
                      <Link
                        to={`/content/${item.id}`}
                        className="text-sm font-medium text-purple-600 hover:text-primary-500"
                      >
                        {item.title}
                      </Link>
                      <p className="text-sm text-gray-500 truncate max-w-md">
                        {item.url}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status] || 'bg-gray-100 text-gray-800'}`}>
                      {item.status}
                    </span>
                    
                    <div className="flex space-x-2">
                      {item.status === 'pending' && (
                        <button
                          onClick={() => handleAnalyze(item.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                          <PlayIcon className="h-4 w-4 mr-1" />
                          Analyze
                        </button>
                      )}
                      
                      <Link
                        to={`/content/${item.id}`}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        View
                      </Link>
                      
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-2">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {item.cleaned_text.substring(0, 200)}...
                  </p>
                </div>
                
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <span>Language: {item.language}</span>
                  <span className="mx-2">•</span>
                  <span>Created: {new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
        
        {filteredContent.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No content found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || statusFilter 
                ? 'Try adjusting your search or filters.'
                : 'Start by crawling some websites to analyze content.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
