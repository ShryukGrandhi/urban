/**
 * Agent Output Card - Clickable card showing agent execution results
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, Loader, XCircle, Clock } from 'lucide-react';

interface AgentOutputCardProps {
  agentName: string;
  agentIcon: string;
  agentColor: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  output: string;
  result?: any;
  error?: string;
  stepNumber: number;
}

export function AgentOutputCard({
  agentName,
  agentIcon,
  agentColor,
  status,
  output,
  result,
  error,
  stepNumber,
}: AgentOutputCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig = {
    pending: {
      icon: <Clock className="w-5 h-5" />,
      bgColor: 'bg-gray-600',
      textColor: 'text-gray-300',
      borderColor: 'border-gray-500/50',
    },
    running: {
      icon: <Loader className="w-5 h-5 animate-spin" />,
      bgColor: 'bg-blue-600',
      textColor: 'text-blue-300',
      borderColor: 'border-blue-500/50',
    },
    completed: {
      icon: <CheckCircle className="w-5 h-5" />,
      bgColor: 'bg-green-600',
      textColor: 'text-green-300',
      borderColor: 'border-green-500/50',
    },
    error: {
      icon: <XCircle className="w-5 h-5" />,
      bgColor: 'bg-red-600',
      textColor: 'text-red-300',
      borderColor: 'border-red-500/50',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`bg-black/40 backdrop-blur-xl border ${config.borderColor} rounded-xl overflow-hidden transition-all ${
        isExpanded ? 'max-h-[600px]' : 'max-h-[80px]'
      }`}
    >
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Step Number */}
          <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center text-white font-bold`}>
            {status === 'completed' ? config.icon : stepNumber}
          </div>

          {/* Agent Info */}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-xl">{agentIcon}</span>
              <span className="text-white font-bold">{agentName}</span>
            </div>
            <div className={`text-sm ${config.textColor}`}>
              {status === 'pending' && 'Waiting...'}
              {status === 'running' && 'Running...'}
              {status === 'completed' && 'Completed ✓'}
              {status === 'error' && 'Error ✗'}
            </div>
          </div>
        </div>

        {/* Expand Icon */}
        <div className="flex items-center gap-2">
          {output && (
            <span className="text-xs text-gray-400">
              {output.length} chars
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-white/10 p-4 max-h-[500px] overflow-y-auto">
          {error ? (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
              <div className="text-red-400 font-semibold mb-2">Error:</div>
              <div className="text-red-300 text-sm">{error}</div>
            </div>
          ) : output ? (
            <div className="space-y-4">
              {/* Main Output */}
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="text-cyan-400 font-semibold mb-2 text-sm">Agent Output:</div>
                <div className="text-gray-300 text-sm whitespace-pre-wrap font-mono leading-relaxed max-h-[300px] overflow-y-auto">
                  {output}
                </div>
              </div>

              {/* Structured Result (if available) */}
              {result && (
                <div className="bg-purple-900/20 border border-purple-500/50 rounded-lg p-4">
                  <div className="text-purple-400 font-semibold mb-2 text-sm">Structured Data:</div>
                  <pre className="text-purple-300 text-xs overflow-x-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-sm italic text-center py-8">
              No output yet. Agent will stream results here...
            </div>
          )}
        </div>
      )}
    </div>
  );
}


