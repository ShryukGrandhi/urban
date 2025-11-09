import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { SimulationsPage } from './pages/SimulationsPage';
import { AgentsDashboard } from './pages/AgentsDashboard';
import TestPage from './pages/TestPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/simulations" element={<SimulationsPage />} />
        <Route path="/agents" element={<AgentsDashboard />} />
        <Route path="/test" element={<TestPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


