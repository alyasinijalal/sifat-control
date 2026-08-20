import React, { useState, useMemo } from 'react';
import { History, ShieldCheck, User, Calendar, Search } from 'lucide-react';
import { AuditLogItem } from '../types';

interface AuditLogViewProps {
  logs: AuditLogItem[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'timestamp' | 'productName' | 'performedBy'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Available unique action types
  const availableActions = useMemo(() => {
    return Array.from(new Set(logs.map(l => l.action).filter(Boolean)));
  }, [logs]);

  const toggleActionFilter = (action: string) => {
    setSelectedActions(prev => 
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    );
  };

  const filteredLogs = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    const filtered = logs.filter(log => {
      const matchesSearch = !q || 
        log.productName.toLowerCase().includes(q) ||
        log.lotNumber.toLowerCase().includes(q) ||
        log.performedBy.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q);

      const matchesAction = selectedActions.length === 0 || selectedActions.includes(log.action);
      return matchesSearch && matchesAction;
    });

    return [...filtered].sort((a, b) => {
      let comp = 0;
      switch (sortField) {
        case 'timestamp':
          comp = a.timestamp.localeCompare(b.timestamp);
          break;
        case 'productName':
          comp = a.productName.localeCompare(b.productName, 'ru');
          break;
        case 'performedBy':
          comp = a.performedBy.localeCompare(b.performedBy, 'ru');
          break;
        default:
          comp = 0;
      }
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [logs, searchTerm, selectedActions, sortField, sortOrder]);

  return (
    <div className="space-y-6 w-full">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <History className="w-5 h-5 text-amber-500" />
              <span>Журнал аудита операций СМК ISO 9001 / GDP</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Неизменяемый хронологический реестр действий по уценке, карантину и списанию
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search Box */}
            <div className="relative md:col-span-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск по событию, препарату, серии, исполнителю..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-400 text-slate-900"
              />
            </div>

            {/* Sorting controls */}
            <div className="flex items-center gap-2 md:col-span-2">
              <span className="text-xs font-extrabold text-slate-700 shrink-0">Сортировка:</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as any)}
                className="flex-1 bg-white border border-slate-200 text-slate-900 font-bold text-xs rounded-xl p-2 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="timestamp">Дата и время события</option>
                <option value="productName">Наименование товара</option>
                <option value="performedBy">Исполнитель / Оператор</option>
              </select>

              <button
                type="button"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs rounded-xl border border-slate-200 shadow-2xs cursor-pointer flex items-center gap-1 shrink-0"
              >
                <span>{sortOrder === 'asc' ? '↑ Сначала старые' : '↓ Сначала новые'}</span>
              </button>
            </div>
          </div>

          {/* Action Multi-Select Badges */}
          {availableActions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
                Тип события (Мультивыбор):
              </span>
              {availableActions.map(act => {
                const active = selectedActions.includes(act);
                return (
                  <button
                    key={act}
                    type="button"
                    onClick={() => toggleActionFilter(act)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                      active
                        ? 'bg-slate-900 text-amber-400 border-slate-900 font-black shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => {}}
                      className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-amber-400 accent-amber-400 cursor-pointer"
                    />
                    <span>{act}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="p-3">Время и Дата</th>
                <th className="p-3">Действие</th>
                <th className="p-3">Препарат / Партия</th>
                <th className="p-3">Исполнитель</th>
                <th className="p-3">Подробности / Основание</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredLogs.map((log) => {
                let actionBadge = 'bg-slate-100 text-slate-800';
                if (log.action === 'QUARANTINE') actionBadge = 'bg-rose-600 text-white font-bold';
                if (log.action === 'DISCOUNT') actionBadge = 'bg-amber-400 text-slate-950 font-black';
                if (log.action === 'WRITE_OFF' || log.action === 'DESTROY') actionBadge = 'bg-slate-900 text-white font-bold';
                if (log.action === 'IMPORT') actionBadge = 'bg-emerald-600 text-white font-bold';

                return (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {log.timestamp}
                    </td>

                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${actionBadge}`}>
                        {log.action}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-slate-900">{log.productName}</div>
                      <div className="text-[10px] font-mono text-slate-500">{log.lotNumber}</div>
                    </td>

                    <td className="p-3 font-bold text-slate-800">
                      {log.performedBy}
                    </td>

                    <td className="p-3 text-slate-600 text-[11px]">
                      {log.details}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
