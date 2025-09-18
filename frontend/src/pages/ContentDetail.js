import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import ReactDiffViewer from 'react-diff-viewer';
import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import {
  ArrowLeftIcon,
  PlayIcon,
  CheckIcon,
  XMarkIcon,
  DocumentArrowDownIcon
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

export default function ContentDetail() {
  const { id } = useParams();
  const [content, setContent] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [filters, setFilters] = useState({
    errorType: 'all',
    status: 'all'
  });

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

  // Clear filters function
  const clearFilters = () => {
    setFilters({ errorType: 'all', status: 'all' });
  };

  // Filter suggestions based on selected filters
  const filteredSuggestions = suggestions.filter(suggestion => {
    const errorTypeMatch = filters.errorType === 'all' || 
                          suggestion.error_type === filters.errorType;
    const statusMatch = filters.status === 'all' || 
                       suggestion.status === filters.status;
    return errorTypeMatch && statusMatch;
  });

  // Prepare CSV data (using filtered suggestions)
  const csvData = filteredSuggestions.map(suggestion => ({
    'Error Type': suggestion.error_type,
    'Status': suggestion.status,
    'Confidence': `${(suggestion.confidence_score * 100).toFixed(0)}%`,
    'Explanation': suggestion.explanation,
    'Original Text': suggestion.original_text,
    'Suggested Text': suggestion.suggested_text,
    'Created At': suggestion.created_at ? new Date(suggestion.created_at).toLocaleDateString() : 'N/A'
  }));

  // PDF export function
  const handlePDFExport = () => {
    if (filteredSuggestions.length === 0) {
      toast.error('No suggestions to export');
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(16);
      doc.text('Content Proof Suggestions Report', 15, 15);
      
      // Content info
      doc.setFontSize(12);
      doc.text(`Content: ${content.title}`, 15, 25);
      doc.text(`URL: ${content.url}`, 15, 32);
      doc.text(`Total Suggestions: ${filteredSuggestions.length}`, 15, 39);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 15, 46);
      
      let yPos = 60;
      
      filteredSuggestions.forEach((suggestion, index) => {
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(12);
        doc.text(`${index + 1}. ${suggestion.error_type.toUpperCase()}`, 15, yPos);
        yPos += 7;
        
        doc.setFontSize(10);
        doc.text(`Status: ${suggestion.status}`, 20, yPos);
        yPos += 5;
        doc.text(`Confidence: ${(suggestion.confidence_score * 100).toFixed(0)}%`, 20, yPos);
        yPos += 5;
        
        // Explanation (wrap text)
        const explanationLines = doc.splitTextToSize(`Explanation: ${suggestion.explanation}`, 170);
        doc.text(explanationLines, 20, yPos);
        yPos += explanationLines.length * 5;
        
        // Original text (wrap text)
        const originalLines = doc.splitTextToSize(`Original: ${suggestion.original_text}`, 170);
        doc.text(originalLines, 20, yPos);
        yPos += originalLines.length * 5;
        
        // Suggested text (wrap text)
        const suggestedLines = doc.splitTextToSize(`Suggested: ${suggestion.suggested_text}`, 170);
        doc.text(suggestedLines, 20, yPos);
        yPos += suggestedLines.length * 5 + 5;
      });

      doc.save(`suggestions-report-${content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
      toast.success('PDF exported successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error('PDF export error:', error);
    }
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
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Suggestions ({suggestions.length})
            </h2>
            
            {/* Filters and Export Controls */}
            {suggestions.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                {/* Filter Controls */}
                <div className="flex flex-wrap gap-2 items-center">
                  <select 
                    value={filters.errorType}
                    onChange={(e) => setFilters(prev => ({...prev, errorType: e.target.value}))}
                    className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Error Types</option>
                    {Object.keys(errorTypeColors).map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({...prev, status: e.target.value}))}
                    className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Statuses</option>
                    {Object.keys(statusColors).map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>

                  {(filters.errorType !== 'all' || filters.status !== 'all') && (
                    <button
                      onClick={clearFilters}
                      className="px-3 py-1.5 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 flex items-center gap-1 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      Clear
                    </button>
                  )}
                </div>

                {/* Export Controls */}
                <div className="flex gap-2">
                  <CSVLink 
                    data={csvData} 
                    filename={`suggestions-${content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`}
                    className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-1 transition-colors ${
                      filteredSuggestions.length > 0 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                    onClick={filteredSuggestions.length === 0 ? (e) => e.preventDefault() : undefined}
                  >
                    <DocumentArrowDownIcon className="h-4 w-4" />
                    CSV
                  </CSVLink>
                  <button
                    onClick={handlePDFExport}
                    disabled={filteredSuggestions.length === 0}
                    className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-1 transition-colors ${
                      filteredSuggestions.length > 0 
                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <DocumentArrowDownIcon className="h-4 w-4" />
                    PDF
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {suggestions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">
                {content.status === 'pending' 
                  ? 'Run analysis to generate suggestions'
                  : 'No suggestions found for this content'
                }
              </p>
            </div>
          ) : filteredSuggestions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">
                No suggestions match the current filters
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSuggestions.map((suggestion) => (
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
