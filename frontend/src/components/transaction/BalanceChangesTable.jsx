import React from 'react';
import AddressLink from '../common/AddressLink';
import { ArrowRight, Coins } from 'lucide-react';

export default function BalanceChangesTable({ balanceChanges = [], tokenTransfers = [] }) {
  return (
    <div className="space-y-6">
      {/* SOL Balance Changes */}
      <div className="sol-card p-5">
        <h3 className="text-sm font-bold text-white mb-3">
          SOL Balance Changes
        </h3>
        {balanceChanges.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No SOL balance changes recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-sans pb-2">
                  <th className="py-2 px-3">Account</th>
                  <th className="py-2 px-3 text-right">Pre Balance (SOL)</th>
                  <th className="py-2 px-3 text-right">Post Balance (SOL)</th>
                  <th className="py-2 px-3 text-right">Change (SOL)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {balanceChanges.map((change, idx) => {
                  const isPositive = change.changeSol > 0;
                  const isZero = change.changeSol === 0;

                  return (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3">
                        <AddressLink address={change.account} chars={6} />
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400">
                        {Number(change.preBalance).toFixed(6)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-200">
                        {Number(change.postBalance).toFixed(6)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-semibold ${
                          isZero
                            ? 'text-slate-500'
                            : isPositive
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {Number(change.changeSol).toFixed(6)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SPL Token Transfers */}
      {tokenTransfers.length > 0 && (
        <div className="sol-card p-5">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-400" />
            SPL Token Balance Changes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-sans pb-2">
                  <th className="py-2 px-3">Account / Owner</th>
                  <th className="py-2 px-3">Token Mint</th>
                  <th className="py-2 px-3 text-right">Change Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tokenTransfers.map((tf, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <AddressLink address={tf.account || tf.owner} chars={6} />
                    </td>
                    <td className="py-2.5 px-3">
                      <AddressLink address={tf.tokenMint || tf.mint} isToken={true} chars={6} />
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-semibold ${
                        tf.type === 'Receive' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {tf.type === 'Receive' ? '+' : '-'}
                      {tf.amount} {tf.symbol || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
