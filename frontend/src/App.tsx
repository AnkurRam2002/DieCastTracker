import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Preorders } from './pages/Preorders';
import { Analytics } from './pages/Analytics';
import { AddModel } from './pages/AddModel';
import { SeriesManagement } from './pages/SeriesManagement';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/preorders" element={<Preorders />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/add" element={<AddModel />} />
            <Route path="/manage/:type" element={<SeriesManagement />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
