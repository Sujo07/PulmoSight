import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Upload from './pages/Upload'
import Results from './pages/Results'
import PatientHistory from './pages/PatientHistory'
import Reports from './pages/Reports'
import Layout from './components/Layout'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/upload" replace />} />
            <Route path="upload" element={<Upload />} />
            <Route path="results/:scanId" element={<Results />} />
            <Route path="history" element={<PatientHistory />} />
            <Route path="reports" element={<Reports />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
