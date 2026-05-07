import React from 'react';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface TableProps {
  columns: string[];
  data: any[];
  isLoading?: boolean;
  actions?: (row: any) => React.ReactNode;
  currentPage?: number;
  totalPages?: number;
  totalRecords?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (limit: number) => void;
}

export const Table: React.FC<TableProps> = ({ 
  columns, data, isLoading, actions,
  currentPage = 1, totalPages = 1, totalRecords = 0, itemsPerPage = 10,
  onPageChange, onItemsPerPageChange
}) => {
  const renderCell = (row: any, col: string) => {
    if (col === 'Item Name' && row['Item No']) {
      return (
        <div className="flex items-center gap-2">
          <span className="whitespace-normal break-normal leading-snug">{row[col]}</span>
          <span className="relative inline-flex shrink-0">
            <span
              className="peer inline-flex h-6 w-6 items-center justify-center rounded-full border border-amber-500/25 bg-amber-500/10 text-amber-300 transition-all hover:scale-105 hover:border-amber-400/50 hover:bg-amber-500/20 hover:text-amber-200"
            >
              <Eye className="w-3.5 h-3.5" />
            </span>
            <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-max -translate-x-1/2 scale-95 rounded-lg border border-amber-500/30 bg-slate-950/95 px-2.5 py-1.5 text-[11px] font-bold tracking-wide text-amber-200 opacity-0 shadow-lg shadow-amber-500/10 backdrop-blur-sm transition-all duration-150 peer-hover:scale-100 peer-hover:opacity-100">
              {row['Item No']}
            </span>
          </span>
        </div>
      );
    }
    return row[col] !== undefined ? row[col] : '—';
  };
  // Removed internal pagination state
  if (isLoading) {
    return (
      <div className="card overflow-hidden">
        <div className="p-8 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="h-4 bg-white/5 rounded-lg flex-1" style={{ opacity: 1 - i * 0.15 }} />
              <div className="h-4 bg-white/5 rounded-lg w-1/3" style={{ opacity: 1 - i * 0.15 }} />
              <div className="h-4 bg-white/5 rounded-lg w-1/4" style={{ opacity: 1 - i * 0.15 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card p-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center mx-auto mb-5">
          <span className="text-amber-500 text-2xl">◈</span>
        </div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No records found</p>
      </div>
    );
  }
  const startIndex = (currentPage - 1) * itemsPerPage;
  return (
    <div className="card overflow-hidden">
      <div className="flex-1">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {columns.map(col => (
                <th
                  key={col}
                  className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 first:pl-8"
                >
                  {col}
                </th>
              ))}
              {actions && <th className="px-6 py-4 text-right pr-8 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 min-w-[120px]">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="hover:bg-amber-500/[0.03] transition-colors group"
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={col}
                    className={`px-6 py-4 text-sm ${colIdx === 0 ? 'pl-8 font-bold text-slate-400 min-w-[80px]' : 'text-slate-300 font-medium'}`}
                  >
                    {renderCell(row, col)}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 pr-8">
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {(onPageChange && onItemsPerPageChange) && (
        <div className="p-4 border-t border-white/5 bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rows per page:</span>
            <select 
              value={itemsPerPage} 
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold text-slate-300 focus:outline-none focus:border-amber-500/50 [color-scheme:dark]"
            >
              {[10, 20, 50, 100].map(sz => (
                <option key={sz} value={sz} className="bg-slate-900 text-slate-300">
                  {sz}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Showing <span className="text-slate-300">{totalRecords > 0 ? startIndex + 1 : 0}</span> - <span className="text-slate-300">{Math.min(startIndex + data.length, totalRecords)}</span> of <span className="text-slate-300">{totalRecords}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-slate-300 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-xs font-bold text-slate-400 px-2 min-w-[60px] text-center">
                Page <span className="text-slate-200">{currentPage}</span> / {Math.max(totalPages, 1)}
              </div>
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || totalPages === 0}
                className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-slate-300 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
