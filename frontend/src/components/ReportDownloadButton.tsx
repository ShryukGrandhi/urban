/**
 * Report Download Button - Download reports in various formats
 */

import { useState } from 'react';
import { Download, FileText, File, Code } from 'lucide-react';
import axios from 'axios';

interface ReportDownloadButtonProps {
  content: string;
  filename?: string;
  availableFormats?: ('markdown' | 'html' | 'pdf' | 'txt')[];
}

export function ReportDownloadButton({
  content,
  filename = 'policy_report',
  availableFormats = ['markdown', 'html', 'txt'],
}: ReportDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showFormats, setShowFormats] = useState(false);

  const formatIcons = {
    markdown: <FileText className="w-4 h-4" />,
    html: <Code className="w-4 h-4" />,
    pdf: <File className="w-4 h-4" />,
    txt: <FileText className="w-4 h-4" />,
  };

  const formatLabels = {
    markdown: 'Markdown (.md)',
    html: 'HTML (.html)',
    pdf: 'PDF (.pdf)',
    txt: 'Text (.txt)',
  };

  const downloadReport = async (format: string) => {
    setIsDownloading(true);
    setShowFormats(false);

    try {
      const response = await axios.post(
        'http://localhost:8000/api/reports/download',
        {
          content,
          format,
          filename,
        },
        {
          responseType: 'blob',
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}.${format === 'markdown' ? 'md' : format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download report');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowFormats(!showFormats)}
        disabled={isDownloading || !content}
        className="group relative"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition"></div>
        <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-bold text-white">
          <Download className="w-5 h-5" />
          {isDownloading ? 'Downloading...' : 'Download Report'}
        </div>
      </button>

      {/* Format Selection Dropdown */}
      {showFormats && (
        <div className="absolute top-full mt-2 right-0 bg-gray-900 border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50 min-w-[200px]">
          {availableFormats.map((format) => (
            <button
              key={format}
              onClick={() => downloadReport(format)}
              className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition flex items-center gap-3 border-b border-white/10 last:border-b-0"
            >
              {formatIcons[format]}
              <span>{formatLabels[format]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}



