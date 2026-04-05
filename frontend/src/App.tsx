import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Preorders } from './pages/Preorders';
import { Analytics } from './pages/Analytics';
import { AddModel } from './pages/AddModel';
import { SeriesManagement } from './pages/SeriesManagement';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/preorders" element={<Preorders />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/add" element={<AddModel />} />
          <Route path="/series" element={<SeriesManagement />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
