import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from './Pages/Dashboard/dashboard';
import { Stats } from './Pages/Stats/stats';
import { Account } from './Pages/Account/account';
import { ProtectedRoute } from './ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Account />} />
        <Route path="/Dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/Stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
