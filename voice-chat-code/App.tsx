import React, { Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import MainLayout from './components/common/MainLayout'
import { useAuthStore } from './store/authStore'

const LoginPage = React.lazy(() => import('./pages/LoginPage'))
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'))
const HomePage = React.lazy(() => import('./pages/HomePage'))
const ChatPage = React.lazy(() => import('./pages/ChatPage'))
const FriendPage = React.lazy(() => import('./pages/FriendPage'))

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  const location = useLocation()
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}

function Loading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Spin size="large" tip="Loading..." />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route index element={<HomePage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="chat/:conversationId" element={<ChatPage />} />
          <Route path="friends" element={<FriendPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
