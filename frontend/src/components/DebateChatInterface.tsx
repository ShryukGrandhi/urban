/**
 * Debate Chat Interface - Shows debate agents talking back and forth
 */

import { useState, useEffect, useRef } from 'react';
import { Send, ThumbsUp, ThumbsDown, AlertCircle, CheckCircle } from 'lucide-react';

interface DebateMessage {
  id: string;
  side: 'pro' | 'con';
  round: number;
  content: string;
  timestamp: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface DebateChatInterfaceProps {
  messages: DebateMessage[];
  isStreaming?: boolean;
  onSendMessage?: (message: string) => void;
  onRequestClarification?: (topic: string) => void;
}

export function DebateChatInterface({
  messages,
  isStreaming = false,
  onSendMessage,
  onRequestClarification,
}: DebateChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputMessage.trim() || !onSendMessage) return;
    onSendMessage(inputMessage.trim());
    setInputMessage('');
  };

  const getSideColor = (side: 'pro' | 'con') => {
    return side === 'pro'
      ? 'from-green-600 to-emerald-600'
      : 'from-red-600 to-orange-600';
  };

  const getSideIcon = (side: 'pro' | 'con') => {
    return side === 'pro' ? (
      <ThumbsUp className="w-5 h-5" />
    ) : (
      <ThumbsDown className="w-5 h-5" />
    );
  };

  const getSideName = (side: 'pro' | 'con') => {
    return side === 'pro' ? 'Supporting Argument' : 'Critical Analysis';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Debate Header */}
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-white/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-xl">💬 Policy Debate Analysis</h3>
            <p className="text-white/60 text-sm">AI agents analyzing pros and cons</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">
              <ThumbsUp className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-sm font-semibold">FOR</span>
            </div>
            <div className="text-white/40">VS</div>
            <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-full border border-red-500/30">
              <ThumbsDown className="w-4 h-4 text-red-400" />
              <span className="text-red-300 text-sm font-semibold">AGAINST</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/40">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <p className="text-white/60 text-lg">Debate will begin shortly...</p>
            <p className="text-white/40 text-sm mt-2">Agents will analyze the policy from multiple perspectives</p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <div key={msg.id} className="animate-fadeIn">
                {/* Round Indicator (show when round changes) */}
                {(index === 0 || messages[index - 1].round !== msg.round) && (
                  <div className="flex items-center justify-center my-6">
                    <div className="bg-white/10 border border-white/20 rounded-full px-6 py-2">
                      <span className="text-white/80 font-bold text-sm">
                        Round {msg.round}
                      </span>
                    </div>
                  </div>
                )}

                {/* Message */}
                <div className={`flex ${msg.side === 'pro' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] ${msg.side === 'pro' ? 'mr-auto' : 'ml-auto'}`}>
                    {/* Agent Label */}
                    <div className={`flex items-center gap-2 mb-2 ${msg.side === 'con' ? 'justify-end' : ''}`}>
                      {msg.side === 'pro' && getSideIcon(msg.side)}
                      <span className={`text-sm font-bold ${
                        msg.side === 'pro' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {getSideName(msg.side)}
                      </span>
                      {msg.side === 'con' && getSideIcon(msg.side)}
                    </div>

                    {/* Message Bubble */}
                    <div className={`relative group`}>
                      <div className={`absolute -inset-0.5 bg-gradient-to-r ${getSideColor(msg.side)} rounded-2xl blur opacity-20 group-hover:opacity-40 transition`}></div>
                      <div className={`relative bg-gradient-to-br ${
                        msg.side === 'pro'
                          ? 'from-green-900/40 to-emerald-900/40 border-green-500/30'
                          : 'from-red-900/40 to-orange-900/40 border-red-500/30'
                      } border rounded-2xl px-5 py-4 backdrop-blur-sm`}>
                        <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                          <span className="text-white/40 text-xs">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                          {msg.sentiment && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              msg.sentiment === 'positive'
                                ? 'bg-green-500/20 text-green-300'
                                : msg.sentiment === 'negative'
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-gray-500/20 text-gray-300'
                            }`}>
                              {msg.sentiment}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Streaming Indicator */}
            {isStreaming && (
              <div className="flex justify-center">
                <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-white/60 text-sm">Agents analyzing...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Human-in-the-Loop Controls */}
      <div className="border-t border-white/20 bg-gradient-to-r from-purple-600/10 to-pink-600/10 p-4">
        <div className="flex gap-3 mb-3">
          <button
            onClick={() => onRequestClarification?.('economic impact')}
            className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm hover:bg-white/10 transition"
          >
            Ask about economics
          </button>
          <button
            onClick={() => onRequestClarification?.('social impact')}
            className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm hover:bg-white/10 transition"
          >
            Ask about social impact
          </button>
          <button
            onClick={() => onRequestClarification?.('alternatives')}
            className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm hover:bg-white/10 transition"
          >
            Suggest alternatives
          </button>
        </div>

        {/* Input */}
        <div className="flex gap-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask agents to clarify, analyze specific aspects, or challenge arguments..."
            className="flex-1 px-4 py-3 bg-black/60 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
          />
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim() || isStreaming}
            className="group relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition"></div>
            <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
              <Send className="w-5 h-5 text-white" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}



