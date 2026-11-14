import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  Search, 
  Printer, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Eye, 
  ExternalLink 
} from 'lucide-react';
import { useSalesContext } from '../context/SalesContext';
import { cn } from '../../../lib/utils';

export const QuotationsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { quotations, customers, formatCurrency, deleteQuotation, saveQuotation } = useSalesContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredQuotes = useMemo(() => {
    return quotations.filter(q => {
      const customer = customers.find(c => c.id === q.customerId);
      const quoteNum = q.quoteNumber || (q as any).quotationNumber || '';
      const matchesSearch = !searchQuery ||
        quoteNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (customer?.name && customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (customer?.company && customer.company.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || q.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [quotations, customers, searchQuery, statusFilter]);

  const handleUpdateStatus = async (quote: any, newStatus: string) => {
    await saveQuotation({
      ...quote,
      status: newStatus
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      await deleteQuotation(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search quotes by number, client, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Accepted">Accepted</option>
            <option value="Declined">Declined</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => navigate('/sales/quotations/builder')}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Create Quotation</span>
        </button>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Quotation #</th>
                <th className="py-3.5 px-4">Client / Organization</th>
                <th className="py-3.5 px-4">Issue Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Grand Total</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    No quotations found. Click "+ Create Quotation" to generate your first commercial proposal.
                  </td>
                </tr>
              ) : (
                filteredQuotes.map(quote => {
                  const customer = customers.find(c => c.id === quote.customerId);

                  return (
                    <tr key={quote.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900">{quote.quoteNumber || (quote as any).quotationNumber}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{customer?.name || quote.customerName || 'Unknown Client'}</div>
                        {(customer?.company || quote.customerCompany) && (
                          <div className="text-[11px] text-slate-400">{customer?.company || quote.customerCompany}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {(quote.issueDate || (quote as any).date) ? new Date(quote.issueDate || (quote as any).date).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide inline-block",
                          quote.status === 'draft' && "bg-slate-100 text-slate-600",
                          quote.status === 'sent' && "bg-blue-50 text-blue-700 border border-blue-200",
                          (quote.status === 'approved' || quote.status === 'signed') && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                          quote.status === 'rejected' && "bg-rose-50 text-rose-700 border border-rose-200"
                        )}>
                          {quote.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-slate-900">
                        {formatCurrency(quote.grandTotal || (quote as any).total || 0)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/sales/quotations/builder?editId=${quote.id}`)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                            title="Edit / View Proposal"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(quote.id)}
                            className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg transition-colors"
                            title="Delete Quotation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
