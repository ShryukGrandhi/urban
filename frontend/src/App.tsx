import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { SimulationsPage } from './pages/SimulationsPage';
import { AgentsDashboard } from './pages/AgentsDashboard';
import { WorkflowRunner } from './pages/WorkflowRunner';
import { EnhancedSimulationView } from './pages/EnhancedSimulationView';
import { StreamingConsole } from './pages/StreamingConsole';
import { InteractiveMapDemo } from './pages/InteractiveMapDemo';
import { SimulationProvider } from './context/SimulationContext';
import TestPage from './pages/TestPage';

function App() {
  return (
    <SimulationProvider>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/simulations" element={<SimulationsPage />} />
        <Route path="/simulation-view" element={<EnhancedSimulationView />} />
        <Route path="/agents" element={<AgentsDashboard />} />
        <Route path="/workflow" element={<WorkflowRunner />} />
        <Route path="/streaming-console" element={<StreamingConsole />} />
        <Route path="/interactive-map" element={<InteractiveMapDemo />} />
        <Route path="/test" element={<TestPage />} />
      </Routes>
    </BrowserRouter>
    </SimulationProvider>
  );
}

export default App;


