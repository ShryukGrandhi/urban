import React, { useState } from 'react';
import { X, Play, FileText, Database, Phone } from 'lucide-react';

interface ExecuteAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: any;
  onExecute: (executionData: any) => void;
}

const ExecuteAgentModal: React.FC<ExecuteAgentModalProps> = ({
  isOpen,
  onClose,
  agent,
  onExecute
}) => {
  const [overview, setOverview] = useState('');
  const [policyFile, setPolicyFile] = useState<File | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('+18582108648');
  const [executing, setExecuting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

  if (!isOpen || !agent) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if it's a PDF
    if (!file.name.endsWith('.pdf')) {
      alert('Please upload a PDF file');
      return;
    }
    
    setPolicyFile(file);
    setParsing(true);
    
    try {
      console.log('📄 Uploading PDF:', file.name, file.size, 'bytes');
      
      // Parse the PDF
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('http://localhost:8000/api/documents/parse', {
        method: 'POST',
        body: formData
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Parse error:', errorText);
        alert('Failed to parse PDF: ' + errorText);
        setParsing(false);
        return;
      }
      
      const result = await response.json();
      console.log('Parse result:', result);
      
      if (result.success) {
        setParsedData(result.data);
        console.log('✅ PDF parsed successfully!');
        console.log('  - Pages:', result.data.page_count);
        console.log('  - Text length:', result.data.full_text?.length);
        console.log('  - Sections:', Object.keys(result.data.sections || {}).length);
      } else {
        console.error('Parse failed:', result.error);
        alert('Failed to parse PDF: ' + (result.error || 'Unknown error'));
        setParsedData(null);
      }
    } catch (error: any) {
      console.error('Error parsing PDF:', error);
      alert('Error uploading PDF: ' + error.message);
      setParsedData(null);
    } finally {
      setParsing(false);
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    
    const executionData: any = {
      description: overview || agent.role,
      stream: true,
      custom_input: {
        phone_number: phoneNumber,
        auto_call: true,
        policy_name: parsedData?.metadata?.title || 'Policy Initiative',
        key_message: overview || 'Important policy update'
      }
    };

    // Add parsed document data as policy context
    if (parsedData) {
      executionData.policy_data = {
        document_text: parsedData.full_text,
        sections: parsedData.sections,
        metrics: parsedData.metrics,
        metadata: parsedData.metadata,
        page_count: parsedData.page_count
      };
    }

    await onExecute(executionData);
    setExecuting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-cyan-500/30 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-cyan-900/50 to-blue-900/50 p-6 border-b border-cyan-500/30 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <Play className="w-6 h-6 text-cyan-400" />
              Execute Agent: {agent.name}
            </h2>
            <p className="text-cyan-300 text-sm">{agent.type}</p>
            <p className="text-gray-400 text-sm mt-1">{agent.role}</p>
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
          {/* Simple Overview */}
          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Quick Overview
            </label>
            <textarea
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              placeholder="E.g., 'Contact journalists about new traffic policy that reduces congestion by 30%'"
              className="w-full px-4 py-3 bg-gray-800/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 min-h-[100px]"
            />
            <p className="text-gray-500 text-xs mt-1">
              Brief summary of what you want to communicate
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-2 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Upload Policy Document (PDF)
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="w-full px-4 py-3 bg-gray-800/50 border border-cyan-500/30 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:text-cyan-400 hover:file:bg-cyan-500/30 cursor-pointer"
              />
              {parsing && (
                <div className="absolute right-3 top-3">
                  <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            {policyFile && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">{policyFile.name}</span>
                {parsedData && (
                  <span className="text-cyan-400">
                    ({parsedData.page_count} pages parsed)
                  </span>
                )}
              </div>
            )}
            <p className="text-gray-500 text-xs mt-1">
              Agent will automatically extract all data from your document
            </p>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-cyan-400 mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number to Call
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+18582108648"
              className="w-full px-4 py-3 bg-gray-800/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
            <p className="text-gray-500 text-xs mt-1">
              Agent will automatically call this number after generating materials
            </p>
          </div>

          {/* Parsed Data Preview */}
          {parsedData && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <h4 className="text-green-400 font-semibold mb-2 text-sm">✓ Document Parsed Successfully!</h4>
              <div className="text-gray-300 text-xs space-y-1">
                <p>📄 Title: {parsedData.metadata?.title || 'N/A'}</p>
                <p>📝 Pages: {parsedData.page_count}</p>
                <p>📊 Metrics found: {parsedData.metrics?.percentages?.length || 0} percentages, {parsedData.metrics?.dollar_amounts?.length || 0} dollar amounts</p>
                <p className="text-green-400 mt-2">Agent will use all this data as context!</p>
              </div>
            </div>
          )}

          {/* Simplified Instructions */}
          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-cyan-500/30 rounded-lg p-4">
            <h4 className="text-cyan-400 font-semibold mb-2 text-sm">✨ How This Works:</h4>
            <ol className="text-gray-300 text-xs space-y-2 list-decimal list-inside">
              <li><strong>Write overview</strong> - What you want to communicate</li>
              <li><strong>Upload PDF</strong> (optional) - Agent extracts ALL data automatically</li>
              <li><strong>Click Execute</strong> - Agent generates materials using full context</li>
              <li><strong>Your phone rings!</strong> - Automatic call with your message</li>
            </ol>
            <p className="text-cyan-400 text-xs mt-3">
              No JSON needed! Just type, upload, and click execute. 🚀
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900/95 p-6 border-t border-cyan-500/30 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all"
            disabled={executing}
          >
            Cancel
          </button>
          <button
            onClick={handleExecute}
            disabled={executing || !overview}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {executing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Executing & Calling...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Execute & Auto-Call
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecuteAgentModal;

