import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  mapAction?: any;
}

interface ChatWithMapProps {
  onMapCommand: (command: any) => void;
  simulationRunning: boolean;
}

export function ChatWithMap({ onMapCommand, simulationRunning }: ChatWithMapProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "👋 Hi! I can help you visualize policy impacts on the map. Try asking:\n\n• \"Show me traffic on King Street\"\n• \"Add 500 housing units in Mission District\"\n• \"Demolish Salesforce Tower\"\n• \"What happens if we remove parking on 16th St?\"\n• \"Highlight the Tenderloin area\""
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Parse command using simple pattern matching (would use Gemini API in production)
      const lowerInput = userMessage.toLowerCase();
      
      let response = '';
      let mapAction: any = null;

      // Traffic commands
      if (lowerInput.includes('traffic') || lowerInput.includes('congestion')) {
        const street = extractStreetName(userMessage);
        response = `🚗 Showing traffic analysis ${street ? `for ${street}` : 'across the city'}.\n\nI'm highlighting major roads and showing congestion patterns. ${street ? `${street} appears to have moderate traffic flow.` : 'Major bottlenecks identified at key intersections.'}`;
        mapAction = {
          type: 'highlight-roads',
          target: street || 'all',
          color: '#fbbf24',
          data: { flow: 'moderate', congestion: '45%' }
        };
      }
      // Housing commands
      else if (lowerInput.includes('housing') || lowerInput.includes('units') || lowerInput.includes('build')) {
        const location = extractLocation(userMessage);
        const units = extractNumber(userMessage) || 500;
        response = `🏗️ Simulating ${units} new housing units ${location ? `in ${location}` : 'across the city'}.\n\nAdding construction markers and projecting impact on affordability. This would improve housing affordability by approximately ${(units / 100).toFixed(1)}%.`;
        mapAction = {
          type: 'add-housing',
          location: location || 'center',
          units: units,
          impact: (units / 100)
        };
      }
      // Highlight area
      else if (lowerInput.includes('highlight') || lowerInput.includes('show') || lowerInput.includes('area')) {
        const location = extractLocation(userMessage);
        response = `📍 Highlighting ${location || 'the selected area'}.\n\nI've added a glowing zone marker. You can see the boundaries and current conditions for this neighborhood.`;
        mapAction = {
          type: 'highlight-area',
          location: location || 'Mission District',
          color: '#8b5cf6'
        };
      }
      // Parking commands
      else if (lowerInput.includes('parking') || lowerInput.includes('remove parking')) {
        const street = extractStreetName(userMessage);
        response = `🅿️ Analyzing parking removal ${street ? `on ${street}` : 'citywide'}.\n\nRemoving parking would:\n• Reduce traffic by ~8%\n• Increase bike lanes\n• Impact local businesses\n• Free up ~2,500 sq ft for development`;
        mapAction = {
          type: 'remove-parking',
          street: street || '16th Street',
          impact: { traffic: -8, business: -15, biking: +45 }
        };
      }
      // Demolition - Salesforce Tower specific
      else if (lowerInput.includes('salesforce')) {
        response = `💥 DEMOLISHING SALESFORCE TOWER!\n\n🎬 Watch the building slowly disappear over 10 seconds:\n• Building opacity fading\n• Progress bar showing demolition\n• Final explosion effect\n• Displacement of 6,000 workers\n\nThis is a DRAMATIC visualization of a major building removal!`;
        mapAction = {
          type: 'demolish-salesforce',
          building: 'Salesforce Tower',
          workers: 6000,
          animationDuration: 10
        };
      }
      // General demolition
      else if (lowerInput.includes('demolish') || lowerInput.includes('remove building')) {
        const location = extractLocation(userMessage);
        response = `💥 Showing demolition impact ${location ? `in ${location}` : 'for the area'}.\n\nRemoving old structures would affect:\n• ~200 current residents\n• Create space for 450 new units\n• 18-month construction timeline`;
        mapAction = {
          type: 'demolition',
          location: location || 'center',
          displaced: 200,
          newUnits: 450
        };
      }
      // Heatmap
      else if (lowerInput.includes('heatmap') || lowerInput.includes('heat map')) {
        response = `🔥 Generating impact heatmap!\n\nThe colored zones show:\n🟢 Green = Strong positive impact\n🟡 Yellow = Moderate impact\n🟠 Orange = Minimal effect\n\nToggle styles with the ⭕/🌊 button!`;
        mapAction = {
          type: 'show-heatmap',
          style: 'gradient'
        };
      }
      // Generic response
      else {
        response = `🤔 I can help you explore policy impacts! Try asking about:\n\n📍 Specific locations: "Show Mission District"\n🚗 Traffic: "What's the traffic on Market Street?"\n🏗️ Development: "Add 300 units near BART"\n🅿️ Parking: "Remove parking on Valencia"\n🔥 Visualization: "Show me a heatmap"`;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response, mapAction }]);
      
      // Execute map command
      if (mapAction) {
        onMapCommand(mapAction);
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Sorry, I encountered an error processing that request. Please try rephrasing!'
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to extract info from natural language
  const extractStreetName = (text: string): string | null => {
    const streets = ['16th street', 'king street', '3rd street', 'market street', 'valencia', 'mission', 'bay bridge'];
    const lower = text.toLowerCase();
    const found = streets.find(s => lower.includes(s));
    return found ? found.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : null;
  };

  const extractLocation = (text: string): string | null => {
    const locations = ['mission district', 'soma', 'tenderloin', 'financial district', 'treasure island', 'castro', 'haight'];
    const lower = text.toLowerCase();
    const found = locations.find(l => lower.includes(l));
    return found ? found.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : null;
  };

  const extractNumber = (text: string): number | null => {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-8 right-8 z-50 group"
          >
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full blur-2xl opacity-75 group-hover:opacity-100 transition animate-pulse"></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-8 bottom-8 z-50 w-[450px] h-[600px]"
          >
            <div className="relative h-full">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl blur-2xl opacity-75"></div>
              <div className="relative h-full bg-black/95 backdrop-blur-3xl border-2 border-white/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-white/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
                    <div>
                      <h3 className="text-white font-bold text-lg">Chat with Map</h3>
                      <p className="text-white/60 text-xs">Ask me to change anything!</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-white/60 hover:text-white transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-auto p-6 space-y-4">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] ${
                        msg.role === 'user' 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                          : 'bg-white/10 border border-white/20 text-white/90'
                      } rounded-2xl px-4 py-3 shadow-lg`}>
                        <p className="text-sm whitespace-pre-line leading-relaxed">{msg.content}</p>
                        {msg.mapAction && (
                          <div className="mt-2 pt-2 border-t border-white/20">
                            <p className="text-xs text-white/60">
                              ✅ Map updated: {msg.mapAction.type}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3">
                        <div className="flex gap-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/20 bg-gradient-to-r from-purple-600/10 to-pink-600/10">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask me to change the map..."
                      disabled={loading}
                      className="flex-1 px-4 py-3 bg-black/60 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || loading}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

