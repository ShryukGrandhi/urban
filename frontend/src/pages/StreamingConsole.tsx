import { useWebSocket } from '../hooks/useWebSocket';
import { Terminal, ArrowLeft, Phone } from 'lucide-react';
import { VerticalSidebar } from '../components/VerticalSidebar';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import MakeCallModal from '../components/MakeCallModal';

export function StreamingConsole() {
  const { messages, isConnected, clearMessages } = useWebSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [agentInfo, setAgentInfo] = useState<any>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [fullOutput, setFullOutput] = useState<string>('');

  useEffect(() => {
    // Get agent info from navigation state
    if (location.state) {
      setAgentInfo(location.state);
    }
  }, [location.state]);

  useEffect(() => {
    // Collect all message data into full output
    const output = messages
      .filter(msg => msg.type === 'stream')
      .map(msg => msg.data)
      .join('');
    setFullOutput(output);
  }, [messages]);

  useEffect(() => {
    // Auto-trigger call when Media Calling agent completes
    const completionMsg = messages.find(msg => 
      msg.type === 'complete' && 
      msg.agent_type === 'MEDIA_CALLING'
    );
    
    if (completionMsg && fullOutput && agentInfo?.agentName) {
      // Check if we already auto-called
      const alreadyCalled = messages.some(msg => 
        msg.type === 'progress' && 
        msg.data && 
        msg.data.includes('AUTO-CALLING')
      );
      
      if (!alreadyCalled) {
        // Auto-trigger the call after a brief delay
        const timer = setTimeout(() => {
          console.log('🔥 Auto-triggering phone call for Media Calling agent...');
          handleAutoCall();
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [messages, fullOutput, agentInfo]);

  const handleAutoCall = async () => {
    if (!fullOutput) return;
    
    try {
      // Extract key message from output
      let message = fullOutput;
      if (message.includes('PHONE CALL SUMMARY')) {
        const parts = message.split('PHONE CALL SUMMARY');
        if (parts.length > 1) {
          const summary = parts[1].split('\n\n')[0];
          message = summary.trim();
        }
      }
      
      // Limit message length
      if (message.length > 500) {
        message = message.substring(0, 500) + '...';
      }

      console.log('📞 Making automatic call...');
      
      const response = await fetch('http://localhost:8000/api/calls/make', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: '+18582108648',
          message: message,
          agent_name: agentInfo?.agentName || 'Policy Agent',
          call_type: 'media_outreach',
          policy_name: 'Urban Development Initiative'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Call initiated!', result);
        // Show success notification in console
        alert(`📞 CALL INITIATED!\n\nYour phone is ringing from +1 (858) 251-5889!\n\nCall ID: ${result.call_id}`);
      } else {
        console.error('Call failed:', result);
      }
    } catch (error) {
      console.error('Error making auto-call:', error);
    }
  };

  const formatTimestamp = (timestamp: string | number) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { hour12: false });
    } catch {
      return '--:--:--';
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Vertical Sidebar */}
      <VerticalSidebar />

      {/* Particles Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}></div>
      </div>

      {/* Gradient Overlays */}
      <div className="fixed top-0 left-0 w-1/3 h-1/3 bg-green-600/10 blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-1/3 h-1/3 bg-cyan-600/10 blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-cyan-600 to-blue-600 shadow-2xl">
        <div className="max-w-[1600px] mx-auto px-16 py-8">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/agents')}
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-3"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Agents
              </button>
              <h1 className="text-4xl font-bold text-white tracking-tight uppercase flex items-center gap-3">
                <Terminal className="w-10 h-10" />
                {agentInfo?.agentName ? `${agentInfo.agentName} - Live Output` : 'Live Console'}
              </h1>
              <p className="text-white/80 mt-2 text-lg tracking-wide">
                {agentInfo?.taskId ? `Execution ID: ${agentInfo.taskId}` : 'Real-time streaming from all active AI agents'}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full ${
                    isConnected ? 'bg-green-400 shadow-lg shadow-green-400/50 animate-pulse' : 'bg-red-500'
                  }`}
                />
                <span className="text-white font-medium uppercase tracking-wide text-sm">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              {/* Make Real Call Button */}
              {fullOutput && (
                <button
                  onClick={() => setShowCallModal(true)}
                  className="group relative"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl opacity-50 group-hover:opacity-100 blur transition duration-300"></div>
                  <div className="relative px-6 py-3 bg-black border border-green-500/30 rounded-xl hover:border-green-500/60 transition-all flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-400" />
                    <span className="text-white font-semibold">Make Real Call</span>
                  </div>
                </button>
              )}
              
              <button
                onClick={clearMessages}
                className="group relative"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl opacity-50 group-hover:opacity-100 blur transition duration-300"></div>
                <div className="relative px-6 py-3 bg-black border border-white/20 rounded-xl hover:border-white/40 transition-all">
                  <span className="text-white font-semibold">Clear</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Console Output */}
      <div className="flex-1 overflow-auto p-8 space-y-1 max-w-[1600px] mx-auto w-full">
        {messages.map((msg, i) => (
          <div key={i} className="text-sm font-mono bg-gray-900/50 p-3 rounded border border-cyan-500/20">
            <span className="text-gray-500">
              [{formatTimestamp(msg.timestamp)}]
            </span>
            {' '}
            <span className={`font-semibold ${
              msg.type === 'error' ? 'text-red-400' :
              msg.type === 'progress' ? 'text-blue-400' :
              msg.type === 'complete' ? 'text-green-400' :
              msg.type === 'stream' ? 'text-cyan-400' :
              'text-yellow-400'
            }`}>
              [{msg.type.toUpperCase()}]
            </span>
            {' '}
            {msg.channel && (
              <span className="text-purple-400">[{msg.channel}]</span>
            )}
            {' '}
            <div className="text-white mt-2 whitespace-pre-wrap">
              {typeof msg.data === 'string' ? msg.data : JSON.stringify(msg.data, null, 2)}
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-xl font-semibold">Waiting for agent output...</p>
              <p className="text-sm mt-2">
                {agentInfo?.agentName || 'Agent'} is processing your request
              </p>
              <p className="text-xs mt-2 text-gray-600">
                This may take a few moments. Results will stream here in real-time.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-white/10 p-4 bg-black/50 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between text-xs text-white/50 tracking-wide">
          <span>{messages.length} MESSAGES</span>
          <span className="uppercase">WebSocket: {isConnected ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
      </div>
      </div>

      {/* Make Call Modal */}
      <MakeCallModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        agentOutput={fullOutput}
      />
    </div>
  );
}


