import React, { useState } from 'react';
import { CreditCard, CheckCircle2, ShieldCheck, ExternalLink, X } from 'lucide-react';
import { AccountingPageHeader } from '../components/AccountingPageHeader';

export const OnlinePaymentsPage: React.FC = () => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const gateways = [
    { name: 'Stripe Global Payments', status: 'Connected', desc: 'Accept credit cards, Apple Pay, and Google Pay worldwide.', icon: '💳' },
    { name: 'Paymob / Fawry Egypt', status: 'Connected', desc: 'Accept local Egyptian debit/credit cards, Meeza, and mobile wallets.', icon: '🏦' },
    { name: 'PayPal Commerce', status: 'Available', desc: 'Allow international buyers to settle invoices with their PayPal balance.', icon: '🌐' }
  ];

  const handleConfigure = (gatewayName: string) => {
    setToastMessage(`Configuration dialog opened for ${gatewayName}. API keys & webhook endpoints are synced.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] bg-slate-50/60 dark:bg-slate-950 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <AccountingPageHeader
        breadcrumbs={[
          { label: 'Configuration', href: '/accounting/configuration/settings' },
          { label: 'Online Payments' }
        ]}
        title="Payment Providers & Gateways"
        badge="Invoicing"
      />

      <div className="p-6 max-w-4xl mx-auto w-full flex-1 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {gateways.map((g) => (
            <div 
              key={g.name}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-2xl">{g.icon}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {g.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-3">
                  {g.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {g.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleConfigure(g.name)}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Configure Gateway →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnlinePaymentsPage;
