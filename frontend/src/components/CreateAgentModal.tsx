import { useState } from 'react';
import { X } from 'lucide-react';

interface CreateAgentModalProps {
  onClose: () => void;
  onSuccess: (agentData: any) => void;
}

const AGENT_TYPES = [
  { value: 'CONSULTING', label: '💡 Consulting (Supervisor)', description: 'Determines goals and acts as supervisor', color: 'from-cyan-600 to-blue-600' },
  { value: 'SIMULATION', label: '🔬 Simulation', description: 'Run policy impact simulations with Mapbox', color: 'from-green-600 to-emerald-600' },
  { value: 'MAPBOX_AGENT', label: '🗺️ Mapbox Visualization', description: 'Intelligent map visualization using MCP tools', color: 'from-sky-500 to-blue-600' },
  { value: 'DEBATE', label: '💬 Debate', description: 'Generate pro/con arguments and reports', color: 'from-orange-600 to-red-600' },
  { value: 'AGGREGATOR', label: '📄 Aggregator', description: 'Compile comprehensive PDF reports', color: 'from-purple-600 to-pink-600' },
  { value: 'REPORT', label: '📊 Report Writer', description: 'Generate detailed analytical reports', color: 'from-indigo-600 to-purple-600' },
  { value: 'MEDIA_CALLING', label: '📞 Media Calling', description: 'Contact and coordinate with media', color: 'from-yellow-600 to-orange-600' },
  { value: 'PLANNING', label: '📋 Strategic Planning', description: 'Create action plans for initiatives', color: 'from-teal-600 to-green-600' },
  { value: 'PITCH_DECK', label: '🎨 Pitch Deck Creator', description: 'Create slide decks and presentations', color: 'from-pink-600 to-rose-600' },
  { value: 'NEWS_AGENT', label: '📰 News Agent', description: 'Generate news articles and press releases', color: 'from-red-600 to-pink-600' },
  { value: 'DATA_ANALYST', label: '📈 Data Analyst', description: 'Deep dive data analysis', color: 'from-blue-600 to-indigo-600' },
  { value: 'SOCIAL_MEDIA', label: '📱 Social Media', description: 'Manage social media campaigns', color: 'from-fuchsia-600 to-purple-600' },
  { value: 'STAKEHOLDER', label: '👥 Stakeholder', description: 'Simulate stakeholder perspectives', color: 'from-amber-600 to-yellow-600' },
  { value: 'POLICY_WRITER', label: '✍️ Policy Writer', description: 'Draft formal policy documents', color: 'from-slate-600 to-gray-600' },
];

export function CreateAgentModal({ onClose, onSuccess }: CreateAgentModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState('CONSULTING');
  const [scope, setScope] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSuccess({
      name,
      role: description,
      type: selectedType,
      scope: scope || undefined,
      sources: [],
    });
  };

  const selectedTypeInfo = AGENT_TYPES.find(t => t.value === selectedType);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl border border-white/10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10">
          <h2 className="text-2xl font-bold text-white">Create New Agent</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Agent Type Selection */}
          <div>
            <label className="block text-sm font-bold text-white mb-3">
              Agent Type *
            </label>
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {AGENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelectedType(type.value)}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    selectedType === type.value
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`text-2xl ${selectedType === type.value ? 'scale-110' : ''} transition-transform`}>
                      {type.label.split(' ')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-sm mb-1">
                        {type.label.substring(type.label.indexOf(' ') + 1)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {type.description}
                      </div>
                    </div>
                  </div>
                  {selectedType === type.value && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-cyan-500 rounded-full opacity-75" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Type Info Banner */}
          {selectedTypeInfo && (
            <div className={`p-4 rounded-xl bg-gradient-to-r ${selectedTypeInfo.color} bg-opacity-10 border border-white/20`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedTypeInfo.label.split(' ')[0]}</span>
                <div>
                  <div className="font-bold text-white">{selectedTypeInfo.label.substring(selectedTypeInfo.label.indexOf(' ') + 1)}</div>
                  <div className="text-sm text-gray-300">{selectedTypeInfo.description}</div>
                </div>
              </div>
            </div>
          )}

          {/* Agent Name */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Agent Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
              placeholder="e.g., SF Policy Consultant"
              required
            />
          </div>

          {/* Role/Description */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Role & Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition resize-none"
              rows={4}
              placeholder="Describe what this agent will do and its specific responsibilities..."
              required
            />
          </div>

          {/* Scope (Optional) */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Specialized Scope (Optional)
            </label>
            <input
              type="text"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
              placeholder="e.g., Transportation, Housing, Environmental..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/5 transition font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name || !description}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition font-bold shadow-lg shadow-cyan-500/30"
            >
              Create Agent
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


