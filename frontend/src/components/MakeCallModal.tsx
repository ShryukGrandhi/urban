import React, { useState } from 'react';
import { X, Phone, Loader2 } from 'lucide-react';

interface MakeCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentOutput?: string;
}

const MakeCallModal: React.FC<MakeCallModalProps> = ({
  isOpen,
  onClose,
  agentOutput
}) => {
  const [phoneNumber, setPhoneNumber] = useState('+18582108648');
  const [calling, setCalling] = useState(false);
  const [callResult, setCallResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleMakeCall = async () => {
    setCalling(true);
    setError('');
    setCallResult(null);

    try {
      // Extract key message from agent output
      let message = agentOutput || "I'm calling to discuss an important policy update.";
      
      // If agent output is very long, extract key points
      if (message.length > 500) {
        // Try to extract the key message or summary
        const lines = message.split('\n');
        const keyLines = lines.filter(line => 
          line.includes('Key Message') ||
          line.includes('Summary') ||
          line.includes('**') ||
          (line.length > 50 && line.length < 300)
        );
        if (keyLines.length > 0) {
          message = keyLines.slice(0, 3).join('\n');
        } else {
          message = message.substring(0, 500) + '...';
        }
      }

      const response = await fetch('http://localhost:8000/api/calls/make', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phoneNumber,
          message: message,
          agent_name: "Policy Communications Agent",
          call_type: "media_outreach",
          policy_name: "Urban Development Initiative",
          target_outlet: "local news"
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setCallResult(result);
      } else {
        setError(result.error || 'Failed to initiate call');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setCalling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-cyan-500/30 shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 p-6 border-b border-cyan-500/30 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <Phone className="w-6 h-6 text-cyan-400" />
              Make Real Phone Call
            </h2>
            <p className="text-cyan-300 text-sm">AI agent will call and deliver your message</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Phone Number Input */}
          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-2">
              Phone Number (E.164 format)
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+18582108648"
              className="w-full px-4 py-3 bg-gray-800/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
            <p className="text-gray-500 text-xs mt-1">
              Include country code (e.g., +1 for US)
            </p>
          </div>

          {/* Message Preview */}
          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-2">
              Message Preview
            </label>
            <div className="bg-gray-800/50 border border-cyan-500/20 rounded-lg p-4 max-h-40 overflow-y-auto">
              <p className="text-gray-300 text-sm whitespace-pre-wrap">
                {agentOutput ? 
                  (agentOutput.substring(0, 300) + (agentOutput.length > 300 ? '...' : '')) : 
                  'The AI agent will use the generated content to craft the call message.'}
              </p>
            </div>
          </div>

          {/* Call Result */}
          {callResult && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <h3 className="text-green-400 font-semibold mb-2">✓ Call Initiated!</h3>
              <p className="text-gray-300 text-sm mb-2">
                Call ID: <span className="font-mono text-cyan-400">{callResult.call_id}</span>
              </p>
              <p className="text-gray-300 text-sm">
                Status: <span className="text-green-400">{callResult.status || 'In Progress'}</span>
              </p>
              <p className="text-gray-400 text-xs mt-2">
                The AI agent is now calling {phoneNumber}. You should receive the call shortly!
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <h3 className="text-red-400 font-semibold mb-2">Error</h3>
              <p className="text-gray-300 text-sm">{error}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-blue-400 font-semibold mb-2 text-sm">How it works:</h4>
            <ul className="text-gray-300 text-xs space-y-1 list-disc list-inside">
              <li>AI agent calls your phone number</li>
              <li>Speaks the generated message professionally</li>
              <li>Can answer questions and have a conversation</li>
              <li>Powered by VAPI Voice AI technology</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-cyan-500/30 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all"
            disabled={calling}
          >
            Close
          </button>
          <button
            onClick={handleMakeCall}
            disabled={calling || !phoneNumber}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {calling ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Calling...
              </>
            ) : (
              <>
                <Phone className="w-4 h-4" />
                Make Call Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MakeCallModal;



