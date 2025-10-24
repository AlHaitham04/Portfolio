import { Dashboard } from './Pages/Dashboard/dashboard';
import { Stats } from './Pages/Stats/stats';
import { Account } from './Pages/Account/account';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/Portfolio/" element={<Account />} />

        <Route
          path="/Portfolio/Dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/Portfolio/Stats"
          element={
            <ProtectedRoute>
              <Stats />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
