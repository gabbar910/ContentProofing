import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ContentList from './pages/ContentList';
import ContentDetail from './pages/ContentDetail';
import SuggestionReview from './pages/SuggestionReview';
import CrawlJobs from './pages/CrawlJobs';
import './index.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/content" element={<ContentList />} />
            <Route path="/content/:id" element={<ContentDetail />} />
            <Route path="/suggestions" element={<SuggestionReview />} />
            <Route path="/crawl" element={<CrawlJobs />} />
          </Routes>
        </Layout>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              theme: {
                primary: '#4aed88',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;
