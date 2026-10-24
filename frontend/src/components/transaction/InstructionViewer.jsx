import React, { useState } from 'react';
import { Cpu, ChevronDown, ChevronRight, Terminal, ArrowRight } from 'lucide-react';
import AddressLink from '../common/AddressLink';

export default function InstructionViewer({ instructions = [], logs = [] }) {
  const [activeTab, setActiveTab] = useState('instructions');
  const [expandedIndex, setExpandedIndex] = useState(0);

  return (
    <div className="sol-card overflow-hidden">
      {/* Tabs */}
      <div className="flex items-center gap-4 px-5 pt-4 border-b border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('instructions')}
          className={`pb-3 font-semibold transition-colors relative cursor-pointer ${
            activeTab === 'instructions'
              ? 'text-white border-b-2 border-purple-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Program Instructions ({instructions.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 font-semibold transition-colors relative cursor-pointer ${
            activeTab === 'logs'
              ? 'text-white border-b-2 border-purple-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Program Logs ({logs.length})
        </button>
      </div>

      {/* Instructions Tab Content */}
      {activeTab === 'instructions' && (
        <div className="p-5 space-y-4">
          {instructions.length === 0 ? (
            <p className="text-slate-500 text-xs italic">No instructions available</p>
          ) : (
            instructions.map((ix, idx) => {
              const isExpanded = expandedIndex === idx;
              return (
                <div
                  key={idx}
                  className="border border-slate-800 rounded-xl overflow-hidden bg-[#090d18]"
                >
                  {/* Instruction Header */}
                  <div
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 font-mono text-xs flex items-center justify-center font-bold">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-100">
                            {ix.programName || 'Program Call'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                            {ix.type || 'Instruction'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <span className="text-slate-500">Program ID:</span>
                          <AddressLink address={ix.programId} chars={6} />
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  {/* Expanded Instruction Body */}
                  {isExpanded && (
                    <div className="p-4 border-t border-slate-800/80 bg-[#060912] text-xs space-y-3 font-mono">
                      {/* Parsed info if available */}
                      {ix.parsed?.info && (
                        <div>
                          <p className="text-slate-400 font-sans text-xs font-semibold mb-2">Parsed Arguments:</p>
                          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-slate-300 space-y-1.5 overflow-x-auto">
                            {Object.entries(ix.parsed.info).map(([key, val]) => (
                              <div key={key} className="flex items-baseline gap-2">
                                <span className="text-purple-400 font-semibold">{key}:</span>
                                <span className="text-slate-200 break-all">
                                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Accounts Involved */}
                      {ix.accounts && ix.accounts.length > 0 && (
                        <div>
                          <p className="text-slate-400 font-sans text-xs font-semibold mb-2">
                            Accounts Involved ({ix.accounts.length}):
                          </p>
                          <div className="space-y-1">
                            {ix.accounts.map((acc, aIdx) => (
                              <div
                                key={aIdx}
                                className="flex items-center justify-between p-2 rounded bg-slate-900/50 border border-slate-800/60"
                              >
                                <span className="text-slate-400 text-[11px]">#{aIdx + 1}</span>
                                <AddressLink address={acc} chars={8} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Program Logs Tab Content */}
      {activeTab === 'logs' && (
        <div className="p-5">
          <div className="bg-[#050811] p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300 space-y-1 overflow-x-auto max-h-96">
            {logs.length === 0 ? (
              <p className="text-slate-500 italic">No program logs available for this transaction.</p>
            ) : (
              logs.map((log, lIdx) => {
                const isError = log.includes('failed') || log.includes('Error');
                const isSuccess = log.includes('success');
                const isInvoke = log.includes('invoke');

                return (
                  <div
                    key={lIdx}
                    className={`flex items-start gap-2 ${
                      isError
                        ? 'text-rose-400'
                        : isSuccess
                        ? 'text-emerald-400 font-semibold'
                        : isInvoke
                        ? 'text-purple-300'
                        : 'text-slate-400'
                    }`}
                  >
                    <span className="text-slate-600 select-none w-6 text-right shrink-0">
                      {lIdx + 1}
                    </span>
                    <span className="break-all">{log}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
