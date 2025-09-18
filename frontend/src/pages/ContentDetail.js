import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import ReactDiffViewer from 'react-diff-viewer';
import {
  ArrowLeftIcon,
  PlayIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  applied: 'bg-blue-100 text-blue-800'
};

const errorTypeColors = {
  spelling: 'bg-red-100 text-red-800',
  grammar: 'bg-orange-100 text-orange-800',
  style: 'bg-purple-100 text-purple-800',
  punctuation: 'bg-blue-100 text-blue-800'
};

export default function ContentDetail() {
  const { id } = useParams();
  const [content, setContent] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  useEffect(() => {
    fetchContentDetail();
    fetchSuggestions();
  }, [id]);

  const fetchContentDetail = async () => {
    try {
      const response = await api.get(`/content/${id}`);
      setContent(response.data);
    } catch (error) {
      toast.error('Failed to fetch content details');
      console.error('Error fetching content:', error);
    }
  };

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/suggestions/content/${id}`);
      setSuggestions(response.data);
    } catch (error) {
      toast.error('Failed to fetch suggestions');
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    try {
      await api.post('/content/analyze', { content_id: parseInt(id) });
      toast.success('Analysis started');
      fetchContentDetail();
      // Refresh suggestions after a delay
      setTimeout(fetchSuggestions, 2000);
    } catch (error) {
      toast.error('Failed to start analysis');
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
        user_id: 'current_user'
      });
      toast.success('Suggestion applied');
      fetchContentDetail();
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

  if (loading && !content) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-medium text-gray-900">Content not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The requested content could not be found.
        </p>
        <div className="mt-6">
          <Link
            to="/content"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Back to Content List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/content"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Content
        </Link>
      </div>

      {/* Content Info */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{content.title}</h1>
            {content.status === 'pending' && (
              <button
                onClick={handleAnalyze}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                Analyze Content
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">URL</dt>
              <dd className="mt-1 text-sm text-gray-900 break-all">
                <a href={content.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-500">
                  {content.url}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[content.status] || 'bg-gray-100 text-gray-800'}`}>
                  {content.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Language</dt>
              <dd className="mt-1 text-sm text-gray-900">{content.language}</dd>
            </div>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500 mb-2">Content</dt>
            <dd className="text-sm text-gray-900 bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
              {content.cleaned_text}
            </dd>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Suggestions ({suggestions.length})
          </h2>
          
          {suggestions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">
                {content.status === 'pending' 
                  ? 'Run analysis to generate suggestions'
                  : 'No suggestions found for this content'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
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
                  
                  <p className="text-sm text-gray-600 mb-3">{suggestion.explanation}</p>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedSuggestion(selectedSuggestion === suggestion.id ? null : suggestion.id)}
                      className="text-sm text-primary-600 hover:text-primary-500"
                    >
                      {selectedSuggestion === suggestion.id ? 'Hide' : 'Show'} Diff
                    </button>
                    
                    {selectedSuggestion === suggestion.id && (
                      <div className="border rounded-lg overflow-hidden">
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
