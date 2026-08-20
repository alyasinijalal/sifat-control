import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  CheckCircle2, 
  Search, 
  FileSpreadsheet, 
  Building2, 
  ShieldAlert, 
  Users, 
  Download,
  AlertTriangle,
  Info
} from 'lucide-react';
import { CommissionMember, MedicationBatch, UserProfile } from '../types';
import { formatCurrencyTJS } from '../utils/categoryUtils';
import { exportActToExcelXLSX, exportBatchesToExcelXLSX } from '../utils/exportUtils';

interface AnnexesViewProps {
  commissionMembers: CommissionMember[];
  batches: MedicationBatch[];
  userProfile?: UserProfile;
}

export const AnnexesView: React.FC<AnnexesViewProps> = ({
  commissionMembers,
  batches,
  userProfile,
}) => {
  const [selectedAnnexId, setSelectedAnnexId] = useState<number>(2); // Default to Act of Write-off
  const [filterMode, setFilterMode] = useState<'ALL' | 'E' | 'CD'>('E');
  const [docNumber, setDocNumber] = useState<string>('SF-2026/08-01');
  const [docDate, setDocDate] = useState<string>('10.08.2026');

  const annexesList = [
    { id: 1, code: 'Приложение 1', title: 'Ежемесячный сводный отчет по срокам годности товаров' },
    { id: 2, code: 'Приложение 2', title: 'Акт Комиссии по изъятию и списанию препаратов (Cat E)' },
    { id: 3, code: 'Приложение 3', title: 'Регламент и реестр цветовой маркировки FEFO' },
    { id: 4, code: 'Приложение 4', title: 'Чек-лист GDP приемки товара по остаточному сроку' },
    { id: 5, code: 'Приложение 5', title: 'Акт передачи препаратов в зону карантина' },
    { id: 6, code: 'Приложение 6', title: 'Форма решения о назначении уценки и скидки (Cat C & D)' },
    { id: 7, code: 'Приложение 7', title: 'Ежеквартальный отчет об убытках от списания и уценки' },
    { id: 8, code: 'Приложение 8', title: 'План-график обучения персонала стандарту FEFO' },
    { id: 9, code: 'Приложение 9', title: 'Матрица ответственности RACI по контролю сроков' },
    { id: 10, code: 'Приложение 10', title: 'Чек-лист внутреннего аудита СМК ISO 9001 / GDP' },
    { id: 11, code: 'Приложение 11', title: 'Претензионный акт и порядок возврата поставщику' },
    { id: 12, code: 'Приложение 12', title: 'Регламент авто-уведомлений и интеграции 1С Парацельс' },
    { id: 13, code: 'Приложение 13', title: 'Реестр KPI и целевых показателей потерь' },
    { id: 14, code: 'Приложение 14', title: 'Порядок работы с лечебной косметикой и PAO' },
    { id: 15, code: 'Приложение 15', title: 'Акт о физическом уничтожении непригодных лекарств' },
  ];

  // Filter batches to include in current document preview
  const filteredBatches = batches.filter(b => {
    if (filterMode === 'E') return b.category === 'E' || b.isQuarantined;
    if (filterMode === 'CD') return b.category === 'C' || b.category === 'D';
    return true;
  });

  const totalSum = filteredBatches.reduce((acc, b) => acc + (b.discountedPrice * b.quantity), 0);
  const totalRetailValue = filteredBatches.reduce((acc, b) => acc + (b.retailPrice * b.quantity), 0);

  const activeAnnex = annexesList.find(a => a.id === selectedAnnexId);

  const handlePrint = () => {
    window.print();
  };

  const handleExportToExcel = () => {
    if (selectedAnnexId === 2 || selectedAnnexId === 5 || selectedAnnexId === 6 || selectedAnnexId === 15) {
      exportActToExcelXLSX(
        activeAnnex?.title || 'Акт',
        docNumber,
        docDate,
        filteredBatches,
        commissionMembers,
        userProfile?.directorName
      );
    } else {
      exportBatchesToExcelXLSX(filteredBatches, `Документ_${selectedAnnexId}`);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Top Banner / Navigation header */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <span>Официальные Документы и Акты СМК (Приложения 1–15)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            ООО «Сифат Фарма» — Стандарт GDP / ISO 9001 (Душанбе, 2026)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportToExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs cursor-pointer flex items-center gap-2 active:scale-95 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Скачать в Excel (.xlsx)</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#FFC107] hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-xs cursor-pointer flex items-center gap-2 uppercase tracking-wider active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Печать / PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Document Selection Menu */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-2xs p-4 no-print space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-black text-slate-900 text-xs uppercase tracking-wider">
            <span>Реестр Положения (15 Актов)</span>
            <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">GDP 2026</span>
          </div>

          <div className="space-y-1.5 max-h-[620px] overflow-y-auto pr-1">
            {annexesList.map((annex) => {
              const isSelected = selectedAnnexId === annex.id;
              return (
                <button
                  key={annex.id}
                  onClick={() => setSelectedAnnexId(annex.id)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white font-bold shadow-md ring-2 ring-amber-400/50'
                      : 'text-slate-700 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <span className={`px-1.5 py-0.5 text-[10px] rounded font-mono shrink-0 ${
                    isSelected ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-200 text-slate-800 font-bold'
                  }`}>
                    #{annex.id}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-bold leading-tight">{annex.title}</div>
                    <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-amber-300' : 'text-slate-400'}`}>
                      {annex.code}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Document Preview Canvas */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-2xs p-6 sm:p-8 space-y-6 printable-document">
          {/* Document Header Controls (Hidden on print) */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs no-print">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-700">Фильтр партий:</span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setFilterMode('E')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                    filterMode === 'E' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Просрочено (Cat E)
                </button>
                <button
                  onClick={() => setFilterMode('CD')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                    filterMode === 'CD' ? 'bg-amber-500 text-slate-950' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Риск (Cat C & D)
                </button>
                <button
                  onClick={() => setFilterMode('ALL')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                    filterMode === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Все партии ({batches.length})
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500">№ Документа:</span>
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className="w-28 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Formal Official Printable Document Body */}
          <div className="space-y-6 text-xs text-slate-900 leading-relaxed font-sans">
            {/* Official Letterhead */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <h2 className="text-base font-black uppercase text-slate-950 tracking-tight">
                  ООО «СИФАТ ФАРМА»
                </h2>
                <div className="text-[11px] text-slate-600 font-medium">
                  Республика Таджикистан, г. Душанбе, ул. Борбад 48
                </div>
                <div className="text-[10px] text-amber-700 font-bold uppercase tracking-wider mt-0.5">
                  Отдел контроля качества СМК ISO 9001 / GDP
                </div>
              </div>

              <div className="text-right text-[11px] space-y-1">
                <div className="border border-slate-400 p-2 rounded text-left bg-slate-50">
                  <div className="font-bold text-slate-900 uppercase text-[10px]">УТВЕРЖДАЮ:</div>
                  <div className="text-[10px]">Генеральный директор ООО «Сифат Фарма»</div>
                  <div className="font-bold mt-2">_______________ / {userProfile?.directorName || 'Ф.И.О. Руководителя'}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">«{docDate.split('.')[0]}» {docDate.split('.')[1]} 2026 г.</div>
                </div>
              </div>
            </div>

            {/* Document Title Block */}
            <div className="text-center space-y-1 py-2">
              <div className="text-[11px] font-bold text-amber-700 uppercase tracking-widest">
                {activeAnnex?.code}
              </div>
              <h3 className="text-base font-black uppercase text-slate-950 max-w-xl mx-auto leading-snug">
                {activeAnnex?.title}
              </h3>
              <div className="text-xs font-mono font-bold text-slate-700">
                № {docNumber} от {docDate} г.
              </div>
            </div>

            {/* Specific Document Content Renderers */}
            {selectedAnnexId === 2 && (
              <div className="space-y-4">
                <p className="text-justify leading-relaxed">
                  Настоящий Акт составлен Комиссией ООО «Сифат Фарма» в том, что в результате мониторинга системы FEFO были выявлены лекарственные средства и медицинские изделия с истекшим сроком годности (Категория E), подлежащие немедленному изъятию из обращения и списанию:
                </p>

                {/* Commission Members List */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 text-xs">Состав Комиссии:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-700">
                    {commissionMembers.map((m, idx) => (
                      <div key={idx} className="flex gap-1">
                        <span className="font-semibold text-slate-900">• {m.roleRussian}:</span>
                        <span>{m.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Table of Batches */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-300 text-left text-[11px]">
                    <thead className="bg-slate-100 font-bold text-slate-900">
                      <tr>
                        <th className="p-2 border border-slate-300 w-8">№</th>
                        <th className="p-2 border border-slate-300">Наименование препарата</th>
                        <th className="p-2 border border-slate-300">Серия/LOT</th>
                        <th className="p-2 border border-slate-300">Срок</th>
                        <th className="p-2 border border-slate-300 text-right">Кол-во</th>
                        <th className="p-2 border border-slate-300 text-right">Розница</th>
                        <th className="p-2 border border-slate-300 text-right">Сумма (TJS)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBatches.map((b, idx) => (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="p-2 border border-slate-300 font-bold">{idx + 1}</td>
                          <td className="p-2 border border-slate-300 font-bold">{b.productName}</td>
                          <td className="p-2 border border-slate-300 font-mono text-[10px]">{b.lotNumber}</td>
                          <td className="p-2 border border-slate-300 text-rose-700 font-bold">{b.expiryDate}</td>
                          <td className="p-2 border border-slate-300 text-right font-bold">{b.quantity} {b.unit}</td>
                          <td className="p-2 border border-slate-300 text-right">{b.retailPrice.toFixed(2)}</td>
                          <td className="p-2 border border-slate-300 text-right font-black text-rose-700">
                            {(b.retailPrice * b.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-black text-slate-900">
                      <tr>
                        <td colSpan={4} className="p-2 border border-slate-300 text-right uppercase">Итого к списанию:</td>
                        <td className="p-2 border border-slate-300 text-right font-black">
                          {filteredBatches.reduce((a, b) => a + b.quantity, 0)} уп.
                        </td>
                        <td className="p-2 border border-slate-300"></td>
                        <td className="p-2 border border-slate-300 text-right text-rose-700 font-black text-xs">
                          {formatCurrencyTJS(totalRetailValue)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Причина списания:</span>
                  </div>
                  <p>
                    Истечение срока годности. Препараты изъяты из оборота, помещены в изолированную комнату карантина (Зона E) до последующей передаче лицензированной организации для утилизации.
                  </p>
                </div>
              </div>
            )}

            {/* Annex 3 Color Code Standard */}
            {selectedAnnexId === 3 && (
              <div className="space-y-4 pt-2">
                <p className="font-semibold text-slate-800">
                  Правила цветовой маркировки стикерами на упаковках лекарственных средств в аптеках и на складах ООО «Сифат Фарма»:
                </p>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded text-emerald-900 font-medium">
                    <span className="font-black">● ЗЕЛЕНЫЙ СТИКЕР (Категория A):</span> Остаточный срок &gt; 180 дней (&gt; 6 месяцев). Обычный режим хранения и реализации.
                  </div>
                  <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded text-amber-900 font-medium">
                    <span className="font-black">● ЖЕЛТЫЙ СТИКЕР (Категория B):</span> Остаточный срок 90–180 дней (3–6 месяцев). Приоритет выкладки и реализации (FEFO).
                  </div>
                  <div className="p-3 bg-orange-50 border-l-4 border-orange-500 rounded text-orange-900 font-medium">
                    <span className="font-black">● ОРАНЖЕВЫЙ СТИКЕР (Категория C):</span> Остаточный срок 30–90 дней (1–3 месяца). Назначение уценки 15–30%, активная реализация.
                  </div>
                  <div className="p-3 bg-rose-50 border-l-4 border-rose-500 rounded text-rose-900 font-medium">
                    <span className="font-black">● КРАСНЫЙ СТИКЕР (Категория D):</span> Остаточный срок &lt; 30 дней (&lt; 1 месяца). Скидка 50% или экстренный возврат поставщику.
                  </div>
                  <div className="p-3 bg-slate-900 text-white rounded font-medium">
                    <span className="font-black text-amber-400">● ЧЕРНЫЙ СТИКЕР / КРАСНАЯ ЛЕНТА (Категория E):</span> Срок годности истек. СТРОГИЙ КАРАНТИН! Продажа блокируется в 1С.
                  </div>
                </div>
              </div>
            )}

            {/* Annex 6 Discount Decision Form */}
            {selectedAnnexId === 6 && (
              <div className="space-y-4">
                <p>
                  На основании проведенного аудита FEFO, Комиссия коммерческого департамента утверждает назначение скидок и снижения розничных цен на следующие партии медикаментов:
                </p>
                <table className="w-full border-collapse border border-slate-300 text-left text-[11px]">
                  <thead className="bg-slate-100 font-bold">
                    <tr>
                      <th className="p-2 border border-slate-300">Наименование</th>
                      <th className="p-2 border border-slate-300">LOT</th>
                      <th className="p-2 border border-slate-300">Категория</th>
                      <th className="p-2 border border-slate-300 text-right">Старая цена</th>
                      <th className="p-2 border border-slate-300 text-center">Скидка %</th>
                      <th className="p-2 border border-slate-300 text-right">Новая цена</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.filter(b => b.category === 'C' || b.category === 'D').map(b => (
                      <tr key={b.id}>
                        <td className="p-2 border border-slate-300 font-bold">{b.productName}</td>
                        <td className="p-2 border border-slate-300 font-mono">{b.lotNumber}</td>
                        <td className="p-2 border border-slate-300 font-bold text-amber-700">Cat {b.category}</td>
                        <td className="p-2 border border-slate-300 text-right line-through text-slate-400">{b.retailPrice.toFixed(2)}</td>
                        <td className="p-2 border border-slate-300 text-center font-black text-rose-600">-{b.currentDiscount}%</td>
                        <td className="p-2 border border-slate-300 text-right font-black text-emerald-700">{b.discountedPrice.toFixed(2)} с.</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* General Fallback Renderer for Remaining Annexes */}
            {selectedAnnexId !== 2 && selectedAnnexId !== 3 && selectedAnnexId !== 6 && (
              <div className="space-y-4 pt-2">
                <p className="text-justify leading-relaxed font-medium text-slate-800">
                  Документ подготовлен в соответствии с требованиями Положения ООО «Сифат Фарма» по учету и реализации лекарственных средств с ограниченными сроками годности (FEFO/GDP 2026).
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-300 text-left text-[11px]">
                    <thead className="bg-slate-100 font-bold">
                      <tr>
                        <th className="p-2 border border-slate-300">№</th>
                        <th className="p-2 border border-slate-300">Препарат</th>
                        <th className="p-2 border border-slate-300">Серия</th>
                        <th className="p-2 border border-slate-300">Срок годности</th>
                        <th className="p-2 border border-slate-300 text-right">Количество</th>
                        <th className="p-2 border border-slate-300">Категория</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBatches.slice(0, 8).map((b, idx) => (
                        <tr key={b.id}>
                          <td className="p-2 border border-slate-300 font-bold">{idx + 1}</td>
                          <td className="p-2 border border-slate-300 font-bold">{b.productName}</td>
                          <td className="p-2 border border-slate-300 font-mono">{b.lotNumber}</td>
                          <td className="p-2 border border-slate-300">{b.expiryDate}</td>
                          <td className="p-2 border border-slate-300 text-right font-bold">{b.quantity} {b.unit}</td>
                          <td className="p-2 border border-slate-300 font-bold">Cat {b.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Signatures Block */}
            <div className="pt-8 space-y-4 border-t border-slate-300 text-xs">
              <div className="font-bold text-slate-900">ПОДПИСИ ЧЛЕНОВ КОМИССИИ И ОТВЕТСТВЕННЫХ ЛИЦ:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {commissionMembers.map((m, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="text-[10px] text-slate-500 font-semibold">{m.roleRussian}:</div>
                    <div className="flex items-center justify-between border-b border-slate-400 pb-1">
                      <span className="font-bold text-slate-900">{m.name}</span>
                      <span className="text-[10px] text-slate-400 italic">(подпись)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
