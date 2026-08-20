import React, { useState } from 'react';
import { Trash2, AlertTriangle, Download, CheckCircle, Database } from 'lucide-react';

interface DataResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAllData: () => void;
  onRestoreDemoData?: () => void;
  totalBatchesCount: number;
}

export const DataResetModal: React.FC<DataResetModalProps> = ({
  isOpen,
  onClose,
  onClearAllData,
  totalBatchesCount,
}) => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClear = () => {
    onClearAllData();
    setSuccessMessage('База данных успешно очищена! Готова к загрузке рабочих накладных.');
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 1200);
  };

  const downloadBlankTemplate = () => {
    const csvContent = "\uFEFF" + "Наименование,Серия,СрокГодности,Количество,Единица,Закупка,Розница,Филиал,Поставщик\n" +
      "Наименование препарата 1,LOT-2026-001,2027-12-31,100,уп.,15.50,25.00,Центральный склад (г. Душанбе),ООО «Сифат Фарма»\n" +
      "Наименование препарата 2,LOT-2026-002,2026-09-15,50,фл.,45.00,70.00,Аптека №1 (г. Душанбе),ООО «Сифат Фарма»";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Шаблон_Импорта_1С_Парацельс.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white tracking-tight">Подготовка базы данных к эксплуатации</h3>
              <p className="text-[11px] text-slate-400 font-medium">Очистка системы и загрузка реальных накладных</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          {successMessage ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2 animate-in zoom-in-95">
              <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
              <p className="text-xs font-bold text-emerald-900">{successMessage}</p>
            </div>
          ) : (
            <>
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-900 leading-relaxed">
                  <p className="font-bold">Текущее количество партий: {totalBatchesCount} шт.</p>
                  <p className="mt-0.5 text-rose-800">
                    Перед вводом программы в промышленную эксплуатацию вы можете очистить базу данных в 1 клик и импортировать реальные выгрузки остатков из «1С:Парацельс».
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  onClick={handleClear}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider active:scale-98"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Очистить базу данных (0 партий)</span>
                </button>

                <button
                  type="button"
                  onClick={downloadBlankTemplate}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-200"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>Скачать чистый Excel/CSV шаблон для 1С</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
};
