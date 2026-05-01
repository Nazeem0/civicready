import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Auth from './pages/Auth';
import VoteReady from './pages/VoteReady';
import Dashboard from './pages/Dashboard';
import DemocracyLab from './pages/DemocracyLab';
import ElectionSandbox from './pages/ElectionSandbox';
import ElectoralSimulator from './pages/ElectoralSimulator';
import GerrymanderingLab from './pages/GerrymanderingLab';
import BillRunner from './pages/BillRunner';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
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
      </Routes>
    </BrowserRouter>
  );
}
