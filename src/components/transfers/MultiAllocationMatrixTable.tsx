import React from 'react';
import { Building2, TrendingUp, ShieldCheck, CheckCircle2, Info, ArrowRight, HelpCircle } from 'lucide-react';
import { BranchAllocationDetail } from '../../utils/exportUtils';
import { formatCurrencyTJS, getBranchSalesVelocity } from '../../utils/categoryUtils';
import { CompactTooltip } from './CompactTooltip';

interface MultiAllocationMatrixTableProps {
  allocations: BranchAllocationDetail[];
  retainedInDonor: number;
  totalQuantity: number;
  unitPrice?: number;
  purchaseUnitPrice?: number;
  totalValue?: number;
  totalPurchaseValue?: number;
  unit?: string;
  sourceBranch: string;
  productName?: string;
}

export const MultiAllocationMatrixTable: React.FC<MultiAllocationMatrixTableProps> = ({
  allocations,
  retainedInDonor,
  totalQuantity,
  unitPrice = 0,
  purchaseUnitPrice = 0,
  totalValue = 0,
  totalPurchaseValue = 0,
  unit = 'уп.',
  sourceBranch,
  productName = '',
}) => {
  const effectivePurchasePrice = purchaseUnitPrice > 0 
    ? purchaseUnitPrice 
    : unitPrice > 0 ? +(unitPrice * 0.72).toFixed(2) : 0;
  const effectiveTotalPurchaseVal = totalPurchaseValue > 0 
    ? totalPurchaseValue 
    : +(totalQuantity * effectivePurchasePrice).toFixed(2);

  const donorAlloc = allocations.find(a => a.role === 'DONOR');
  const recipientAllocs = allocations.filter(a => a.role === 'RECIPIENT');

  return (
    <div className="bg-white text-slate-800 rounded-xl p-3 text-xs border border-slate-200 shadow-2xs space-y-2.5 overflow-hidden">
      {/* Table Summary Header with Dual Price Indicators */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] pb-2 border-b border-slate-100 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/70">
        <div className="flex items-center gap-1.5 font-black text-slate-900">
          <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Матрица распределения (Наличие ДО и ПОСЛЕ):</span>
        </div>

        <div className="flex items-center gap-2 text-slate-700 font-bold flex-wrap">
          {unitPrice > 0 && (
            <>
              <div className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-extrabold flex items-center gap-1">
                <span>Розница: <strong className="text-amber-800">{formatCurrencyTJS(unitPrice)}</strong></span>
                <span className="text-slate-400 text-[10px]">| Закуп: <strong className="text-slate-700">{formatCurrencyTJS(effectivePurchasePrice)}</strong></span>
              </div>
              <span className="text-slate-300">|</span>
            </>
          )}

          <div className="flex items-center gap-1">
            <span>Объем: <strong className="text-slate-950 font-black">{totalQuantity} {unit}</strong></span>
            {unitPrice > 0 && totalValue > 0 && (
              <span className="text-slate-500 font-semibold text-[10px]">
                ({formatCurrencyTJS(totalValue)} розн / {formatCurrencyTJS(effectiveTotalPurchaseVal)} закуп)
              </span>
            )}
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Остаток донора: <strong>{retainedInDonor} {unit}</strong>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-[10px] uppercase tracking-wider font-black border-y border-slate-200">
              <th className="py-2 px-2.5">Филиал / Город</th>
              <th className="py-2 px-2 text-center">Роль</th>
              <th className="py-2 px-2 text-right">
                <div className="flex items-center justify-end gap-1">
                  <span>Розница / Закуп</span>
                  <CompactTooltip 
                    title="Стоимость препарата (Двойная оценка)" 
                    content="Верхняя строка: Розничная цена и сумма реализации. Нижняя строка: Закупочная себестоимость для расчета маржинальности и передачи на склад."
                  />
                </div>
              </th>
              <th className="py-2 px-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <span>Коэф. сбыта (k_прод)</span>
                  <CompactTooltip 
                    title="Коэффициент продаваемости" 
                    content="Отношение скорости выбытия товара в данном филиале к средней по сети. Рассчитано на основе чекового трафика и оборачиваемости."
                  />
                </div>
              </th>
              <th className="py-2 px-2 text-right">Наличие ДО</th>
              <th className="py-2 px-2 text-right">Перемещение</th>
              <th className="py-2 px-2 text-right">Остаток ПОСЛЕ</th>
              <th className="py-2 pl-2.5">Обоснование</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {/* Donor Branch Row */}
            {donorAlloc && (() => {
              const donorVel = getBranchSalesVelocity(donorAlloc.branchName, productName);
              const rowUnitPrice = donorAlloc.unitPrice ?? unitPrice;
              const rowTotalVal = rowUnitPrice * Math.abs(donorAlloc.allocatedDelta);
              const rowPurchVal = effectivePurchasePrice * Math.abs(donorAlloc.allocatedDelta);

              return (
                <tr className="bg-amber-50/40 hover:bg-amber-50/70 transition-colors">
                  <td className="py-2 px-2.5 font-bold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate max-w-[180px]" title={donorAlloc.branchName}>
                        {donorAlloc.branchName}
                      </span>
                      <span className="text-[9px] text-slate-500 shrink-0">г. {donorAlloc.city}</span>
                    </div>
                  </td>

                  <td className="py-2 px-2 text-center">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-200">
                      Отправитель
                    </span>
                  </td>

                  {/* Dual Price & Value */}
                  <td className="py-2 px-2 text-right">
                    {rowUnitPrice > 0 ? (
                      <div className="leading-tight">
                        <span className="font-bold text-slate-900 block">{formatCurrencyTJS(rowUnitPrice)} ({formatCurrencyTJS(rowTotalVal)})</span>
                        <span className="text-[9.5px] text-slate-500 font-semibold block">закуп: {formatCurrencyTJS(effectivePurchasePrice)} ({formatCurrencyTJS(rowPurchVal)})</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Velocity Coefficient Badge */}
                  <td className="py-2 px-2 text-center">
                    <div className="inline-flex items-center gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${donorVel.badgeBg} ${donorVel.badgeText}`}>
                        k: {donorVel.formatted}
                      </span>
                      <CompactTooltip 
                        title={`Скорость сбыта: ${donorAlloc.branchName}`}
                        content={donorVel.tooltipText}
                      />
                    </div>
                  </td>

                  <td className="py-2 px-2 text-right font-bold text-slate-700">
                    {donorAlloc.currentStock} {unit}
                  </td>
                  <td className="py-2 px-2 text-right font-black text-rose-600">
                    {donorAlloc.allocatedDelta} {unit}
                  </td>
                  <td className="py-2 px-2 text-right font-black text-emerald-700">
                    {donorAlloc.projectedStock} {unit}
                  </td>

                  {/* Compact Reason Badge with Tooltip */}
                  <td className="py-2 pl-2.5 text-slate-700 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      {retainedInDonor > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-100/80 text-emerald-900 border border-emerald-200 font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Буфер {retainedInDonor} {unit}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                          Складской сплит
                        </span>
                      )}

                      <CompactTooltip 
                        title="Обоснование донора"
                        content={retainedInDonor > 0 
                          ? `Защитный буфер (${retainedInDonor} ${unit}) сохранен на витрине филиала для обслуживания местных покупателей без потери ассортимента.`
                          : 'Полная плановая передача со склада в розничную сеть для реализации.'}
                      />
                    </div>
                  </td>
                </tr>
              );
            })()}

            {/* Recipient Branches Rows */}
            {recipientAllocs.map((rec, idx) => {
              const recVel = getBranchSalesVelocity(rec.branchName, productName);
              const rowUnitPrice = rec.unitPrice ?? unitPrice;
              const rowTotalVal = rowUnitPrice * rec.allocatedDelta;

              return (
                <tr key={rec.branchName} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50 hover:bg-slate-50 transition-colors'}>
                  <td className="py-2 px-2.5 font-bold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate max-w-[180px]" title={rec.branchName}>
                        {rec.branchName}
                      </span>
                      <span className="text-[9px] text-slate-500 shrink-0">г. {rec.city}</span>
                    </div>
                  </td>

                  <td className="py-2 px-2 text-center">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-200">
                      Получатель #{idx + 1}
                    </span>
                  </td>

                  {/* Price & Value */}
                  <td className="py-2 px-2 text-right">
                    {rowUnitPrice > 0 ? (
                      <div className="leading-tight">
                        <span className="font-bold text-slate-900 block">{formatCurrencyTJS(rowUnitPrice)} (+{formatCurrencyTJS(rowTotalVal)})</span>
                        <span className="text-[9.5px] text-slate-500 font-semibold block">закуп: {formatCurrencyTJS(effectivePurchasePrice)} ({formatCurrencyTJS(effectivePurchasePrice * rec.allocatedDelta)})</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Velocity Coefficient Badge */}
                  <td className="py-2 px-2 text-center">
                    <div className="inline-flex items-center gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${recVel.badgeBg} ${recVel.badgeText}`}>
                        k: {recVel.formatted}
                      </span>
                      <CompactTooltip 
                        title={`Скорость сбыта: ${rec.branchName}`}
                        content={recVel.tooltipText}
                      />
                    </div>
                  </td>

                  <td className="py-2 px-2 text-right font-bold">
                    {rec.currentStock === 0 ? (
                      <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 font-black">
                        0 {unit} (Дефицит)
                      </span>
                    ) : (
                      <span className="text-slate-700">{rec.currentStock} {unit}</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right font-black text-emerald-700">
                    +{rec.allocatedDelta} {unit}
                  </td>
                  <td className="py-2 px-2 text-right font-black text-slate-900">
                    {rec.projectedStock} {unit}
                  </td>

                  {/* Compact Reason Badge with Tooltip */}
                  <td className="py-2 pl-2.5 text-slate-700 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      {rec.isZeroDeficitResolved ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Дефицит закрыт</span>
                        </span>
                      ) : recVel.trafficLevel === 'Флагман' ? (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 font-bold">
                          Флагман
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                          Сплит-прием
                        </span>
                      )}

                      <CompactTooltip 
                        title={`Обоснование для ${rec.branchName}`}
                        content={rec.reason || `Направлено +${rec.allocatedDelta} ${unit} для быстрого сбыта по системе FEFO.`}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
