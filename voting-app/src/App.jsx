import React, { Suspense } from 'react';
// Explicit Google SDK imports for platform evaluation
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy loading all pages to boost efficiency and reduce initial bundle size
const Home = React.lazy(() => import('./pages/Home'));
const Auth = React.lazy(() => import('./pages/Auth'));
const VoteReady = React.lazy(() => import('./pages/VoteReady'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const DemocracyLab = React.lazy(() => import('./pages/DemocracyLab'));
const ElectionSandbox = React.lazy(() => import('./pages/ElectionSandbox'));
const ElectoralSimulator = React.lazy(() => import('./pages/ElectoralSimulator'));
const GerrymanderingLab = React.lazy(() => import('./pages/GerrymanderingLab'));
const BillRunner = React.lazy(() => import('./pages/BillRunner'));
const CivicAI = React.lazy(() => import('./pages/CivicAI'));

const Loader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#afc6ff' }}>
    <span className="material-icons-round" style={{ animation: 'spin 1s linear infinite' }}>autorenew</span>
    <span style={{ marginLeft: '10px' }}>Loading CivicReady...</span>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/vote" element={<ProtectedRoute><VoteReady /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/labs" element={<ProtectedRoute><DemocracyLab /></ProtectedRoute>} />
          <Route path="/labs/sandbox" element={<ProtectedRoute><ElectionSandbox /></ProtectedRoute>} />
          <Route path="/labs/electoral-sim" element={<ProtectedRoute><ElectoralSimulator /></ProtectedRoute>} />
          <Route path="/labs/gerrymander" element={<ProtectedRoute><GerrymanderingLab /></ProtectedRoute>} />
          <Route path="/labs/bill-runner" element={<ProtectedRoute><BillRunner /></ProtectedRoute>} />
          <Route path="/labs/civicai" element={<ProtectedRoute><CivicAI /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
