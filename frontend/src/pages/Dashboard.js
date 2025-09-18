import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [errorTypeStats, setErrorTypeStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, activityResponse, errorTypesResponse] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/recent-activity?limit=10'),
        api.get('/dashboard/error-types')
      ]);
      
      setStats(statsResponse.data);
      setRecentActivity(activityResponse.data);
      setErrorTypeStats(errorTypesResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Content',
      value: stats?.total_content || 0,
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
      link: '/content'
    },
    {
      name: 'Pending Suggestions',
      value: stats?.pending_suggestions || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      link: '/suggestions?status=pending'
    },
    {
      name: 'Applied Suggestions',
      value: stats?.applied_suggestions || 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      link: '/suggestions?status=applied'
    },
    {
      name: 'Active Crawl Jobs',
      value: stats?.active_crawl_jobs || 0,
      icon: ChartBarIcon,
      color: 'bg-purple-500',
      link: '/crawl'
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-700">
          Overview of your content proofreading system
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Link
            key={card.name}
            to={card.link}
            className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            <dt>
              <div className={`absolute ${card.color} rounded-md p-3`}>
                <card.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                {card.name}
              </p>
            </dt>
            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
            </dd>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="flow-root">
              <ul className="-mb-8">
                {recentActivity.map((activity, activityIdx) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {activityIdx !== recentActivity.length - 1 ? (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center ring-8 ring-white">
                            <ExclamationTriangleIcon className="h-5 w-5 text-white" aria-hidden="true" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              {activity.action} - {activity.details}
                            </p>
                            {activity.content_url && (
                              <p className="text-xs text-gray-400 truncate">
                                {activity.content_url}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {recentActivity.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No recent activity
              </p>
            )}
          </div>
        </div>

        {/* Error Type Breakdown */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Error Type Breakdown
            </h3>
            <div className="space-y-4">
              {errorTypeStats.map((errorType) => (
                <div key={errorType.error_type} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="capitalize text-sm font-medium text-gray-900">
                      {errorType.error_type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {errorType.count} issues
                    </span>
                    <span className="text-sm text-gray-500">
                      ({(errorType.avg_confidence * 100).toFixed(0)}% avg confidence)
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {errorTypeStats.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No error statistics available
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/crawl"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Start New Crawl
            </Link>
            <Link
              to="/suggestions?status=pending"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Review Suggestions
            </Link>
            <Link
              to="/content"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Browse Content
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
