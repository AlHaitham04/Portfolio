import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }) {
    const userId = localStorage.getItem('user_id');

    return userId ? children : <Navigate to="/" replace />;
}