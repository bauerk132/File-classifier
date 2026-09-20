import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Key, 
  Globe, 
  Zap, 
  ShieldCheck, 
  Terminal,
  ExternalLink
} from 'lucide-react';
import { AIProviderStatus } from '../types';

interface AzureAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: AIProviderStatus | null;
  onRefreshStatus: () => void;
}

export const AzureAIModal: React.FC<AzureAIModalProps> = ({
  isOpen,
  onClose,
  status,
  onRefreshStatus
}) => {
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    error?: string;
    deployment?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/ai-test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || 'Network request failed'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const isConfigured = status?.azureConfigured ?? false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl rounded-3xl bg-[#0B0F19] border border-cyan-500/40 shadow-2xl shadow-cyan-950/60 overflow-hidden text-slate-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Colorful Bold Azure Header Banner */}
        <div className="relative p-6 bg-gradient-to-r from-blue-900 via-indigo-950 to-cyan-950 border-b border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/30 flex items-center justify-center text-white">
                <Cloud className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white tracking-tight">
                    Azure AI Provider
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black border ${
                    isConfigured 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {isConfigured ? 'CONNECTED' : 'AWAITING KEY'}
                  </span>
                </div>
                <p className="text-xs text-cyan-200/80 mt-0.5">
                  Semantic File Classification & Ambiguity Resolution Engine
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Active Provider Card */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Current Configuration
              </span>
              <button
                onClick={onRefreshStatus}
                className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors text-[11px] cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Status</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                <div className="text-[10px] uppercase font-mono text-slate-500">Service</div>
                <div className="font-bold text-white text-xs mt-1 flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-cyan-400" />
                  Azure OpenAI / AI
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                <div className="text-[10px] uppercase font-mono text-slate-500">Deployment / Model</div>
                <div className="font-mono font-bold text-cyan-300 text-xs mt-1 truncate" title={status?.azureDeployment}>
                  {status?.azureDeployment || 'gpt-4o-mini'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                <div className="text-[10px] uppercase font-mono text-slate-500">Endpoint Host</div>
                <div className="font-mono text-slate-300 text-xs mt-1 truncate" title={status?.azureEndpoint}>
                  {status?.azureEndpoint || 'Pending configuration'}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs text-slate-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold text-white">Zero File-Content Transmission Policy:</span> Only metadata, file names, and extensions are passed to Azure AI for semantic taxonomy grouping. File bodies and system internals are never transmitted.
              </div>
            </div>
          </div>

          {/* Connection State & Test Action */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0E1526] to-[#0A0D18] border border-cyan-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  Provider Health & Connectivity
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Ping your Azure endpoint to verify API key authorization and latency.
                </p>
              </div>

              <button
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
              >
                {testingConnection ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Test Connection</span>
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <div className={`p-3.5 rounded-xl border text-xs font-mono ${
                testResult.success 
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' 
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  {testResult.success ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Connected Successfully to Azure AI ({testResult.deployment})</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <span>Connection Check Failed</span>
                    </>
                  )}
                </div>
                {testResult.latencyMs && (
                  <div className="text-[11px] text-slate-300">
                    Latency: <span className="font-bold text-white">{testResult.latencyMs} ms</span>
                  </div>
                )}
                {testResult.error && (
                  <div className="text-[11px] text-rose-300 mt-1 break-all">
                    {testResult.error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Setup Guide Card */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Key className="w-4 h-4 text-amber-400" />
              <span>How to Provide Your Azure AI Credentials</span>
            </div>
            
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Because you have your own Azure AI resource, you can provide the credentials securely through your environment configuration or the AI Studio Settings menu:
            </p>

            <div className="p-3 rounded-xl bg-black/60 border border-slate-800 font-mono text-[11px] space-y-1.5 text-cyan-300">
              <div><span className="text-slate-500"># 1. Your Azure Key:</span> AZURE_AI_API_KEY="your-32-char-key"</div>
              <div><span className="text-slate-500"># 2. Your Azure Endpoint:</span> AZURE_AI_ENDPOINT="https://your-resource.openai.azure.com/"</div>
              <div><span className="text-slate-500"># 3. Model Deployment:</span> AZURE_AI_DEPLOYMENT_NAME="gpt-4o-mini"</div>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              Note: Until your Azure key is active, Sorter's high-speed local deterministic 4-tier rules engine remains 100% active so scanning, categorization, and duplicate detection never pause.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
