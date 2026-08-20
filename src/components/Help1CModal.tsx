import React from 'react';
import { HelpCircle, Download, FileSpreadsheet, CheckCircle2, ArrowRight, Layers, Sparkles, X } from 'lucide-react';

interface Help1CModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Help1CModal: React.FC<Help1CModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
              <Download className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Как работает интеграция и кнопка «1С Парацельс (CSV)»</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Автоматическая переоценка аптечного товара без ручного ввода
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Explanation */}
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          {/* Main summary badge */}
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
            <div className="font-black text-amber-900 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Зачем нужна эта функция?</span>
            </div>
            <p className="text-amber-900/90 font-medium">
              В учетной системе <strong>«1С: Управление аптекой / Парацельс»</strong> ручная переоценка сотен медикаментов с истекающими сроками годности занимает у провизора 2–3 часа в день. Данная кнопка за <strong>1 секунду</strong> создает официальный выгрузочный файл переоценки FEFO.
            </p>
          </div>

          {/* How it works 3-step diagram */}
          <div className="space-y-2">
            <div className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
              Пошаговый алгоритм работы:
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="w-6 h-6 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                  1
                </div>
                <div className="font-bold text-slate-900 text-xs">Расчет скидок в веб-системе</div>
                <p className="text-slate-500 text-[11px]">
                  Алгоритм FEFO автоматически присваивает скидки 15%, 30% или 50% партиям Cat C и Cat D.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                  2
                </div>
                <div className="font-bold text-slate-900 text-xs">Выгрузка файла CSV</div>
                <p className="text-slate-500 text-[11px]">
                  Формируется спец-файл с кодировкой UTF-8 BOM и разделителем «;» (стандарт 1С).
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  3
                </div>
                <div className="font-bold text-slate-900 text-xs">Загрузка в 1С Парацельс</div>
                <p className="text-slate-500 text-[11px]">
                  В 1С нажимается «Загрузить из файла» в документе «Переоценка товаров» — цены обновляются мгновенно.
                </p>
              </div>
            </div>
          </div>

          {/* Technical Specs & Format */}
          <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl space-y-2 font-mono text-[11px]">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              <span>Структура колонок выгрузки (1C Reprice Standard):</span>
            </div>
            <p className="text-slate-400 text-[10px] leading-tight">
              КодПрепарата ; Наименование ; Серия_LOT ; СтараяРозничнаяЦена ; ПроцентСкидки ; НоваяРозничнаяЦена ; КодФилиала
            </p>
            <div className="p-2 bg-slate-950 rounded border border-slate-800 text-emerald-400 text-[10px]">
              Пример: P-101; "Амоксициллин 500мг"; "LOT-2024-X"; 25.00; 15; 21.25; "Филиал №1"
            </div>
          </div>

          {/* Key Advantages */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Исключает человеческий фактор</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Совместимо с 1С 8.3 / Парацельс</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Без кракозябр в кириллице</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Точный учет партий и серий</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end border-t border-slate-100 pt-3">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-2xs"
          >
            Понятно, закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
