import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import ReactDiffViewer from 'react-diff-viewer';
import {
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

const statusColors = {
  pending: 'bg-red-100 text-red-800',
  approved: 'bg-green-600 text-white',
  rejected: 'bg-red-600 text-white',
  applied: 'bg-blue-600 text-white'
};

const errorTypeColors = {
  spelling: 'bg-yellow-100 text-yellow-800',
  grammar: 'bg-orange-200 text-orange-800',
  style: 'bg-purple-100 text-purple-800',
  punctuation: 'bg-blue-100 text-blue-800'
};

export default function SuggestionReview() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    errorType: '',
    minConfidence: 0
  });

  useEffect(() => {
    fetchSuggestions();
  }, [filters]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.errorType) params.append('error_type', filters.errorType);
      if (filters.minConfidence > 0) params.append('min_confidence', filters.minConfidence);
      
      const response = await api.get(`/suggestions/?${params}`);
      setSuggestions(response.data);
    } catch (error) {
      toast.error('Failed to fetch suggestions');
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (suggestionId) => {
    try {
      await api.put(`/suggestions/${suggestionId}/approve`);
      toast.success('Suggestion approved');
      fetchSuggestions();
    } catch (error) {
      toast.error('Failed to approve suggestion');
    }
  };

  const handleReject = async (suggestionId) => {
    try {
      await api.put(`/suggestions/${suggestionId}/reject`);
      toast.success('Suggestion rejected');
      fetchSuggestions();
    } catch (error) {
      toast.error('Failed to reject suggestion');
    }
  };

  const handleApply = async (suggestionId) => {
    try {
      await api.post('/suggestions/apply', {
        suggestion_id: suggestionId,
        user_id: 'current_user' // In real app, get from auth context
      });
      toast.success('Suggestion applied');
      fetchSuggestions();
    } catch (error) {
      toast.error('Failed to apply suggestion');
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Suggestion Review</h1>
          <p className="mt-2 text-sm text-gray-700">
            Review and manage content suggestions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="applied">Applied</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Error Type</label>
            <select
              value={filters.errorType}
              onChange={(e) => setFilters({...filters, errorType: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">All Types</option>
              <option value="spelling">Spelling</option>
              <option value="grammar">Grammar</option>
              <option value="style">Style</option>
              <option value="punctuation">Punctuation</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Min Confidence</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={filters.minConfidence}
              onChange={(e) => setFilters({...filters, minConfidence: parseFloat(e.target.value)})}
              className="mt-1 block w-full"
            />
            <span className="text-sm text-gray-500">{filters.minConfidence.toFixed(1)}</span>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => setFilters({status: '', errorType: '', minConfidence: 0})}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${errorTypeColors[suggestion.error_type] || 'bg-gray-100 text-gray-800'}`}>
                      {suggestion.error_type}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[suggestion.status]}`}>
                      {suggestion.status}
                    </span>
                    <span className={`text-sm font-medium ${getConfidenceColor(suggestion.confidence_score)}`}>
                      {(suggestion.confidence_score * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                  
                  {suggestion.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApprove(suggestion.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleApply(suggestion.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => handleReject(suggestion.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                      >
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="mt-2">
                  <p className="text-sm text-gray-600">{suggestion.explanation}</p>
                </div>
                
                <div className="mt-4">
                  <button
                    onClick={() => setSelectedSuggestion(selectedSuggestion === suggestion.id ? null : suggestion.id)}
                    className="text-sm text-primary-600 hover:text-primary-500"
                  >
                    {selectedSuggestion === suggestion.id ? 'Hide' : 'Show'} Diff
                  </button>
                </div>
                
                {selectedSuggestion === suggestion.id && (
                  <div className="mt-4 border rounded-lg overflow-hidden">
                    <ReactDiffViewer
                      oldValue={suggestion.original_text}
                      newValue={suggestion.suggested_text}
                      splitView={false}
                      hideLineNumbers={true}
                      showDiffOnly={false}
                    />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
        
        {suggestions.length === 0 && (
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No suggestions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
