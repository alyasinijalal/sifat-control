import React, { useState } from 'react';
import { MedicationBatch, BranchInfo } from '../../types';
import { RotationRecommendationItem } from '../../utils/exportUtils';
import { MultiAllocationMatrixTable } from './MultiAllocationMatrixTable';
import { FineTuneSplitModal } from './FineTuneSplitModal';
import { CompactTooltip } from './CompactTooltip';
import { 
  Building2, 
  Layers, 
  ArrowRight, 
  Send, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Package
} from 'lucide-react';
import { 
  formatCurrencyTJS, 
  formatDateDDMMYYYY, 
  getBranchSalesVelocity, 
  getBatchEffectiveUnitPrice 
} from '../../utils/categoryUtils';

export interface SkuGroupData {
  productName: string;
  totalNetworkQty: number;
  totalNetworkValue: number;
  riskBatchesCount: number;
  riskQty: number;
  riskValue: number;
  holdingBranches: {
    branchName: string;
    city: string;
    quantity: number;
    riskCategory?: string;
    isWarehouse: boolean;
    batches: MedicationBatch[];
  }[];
  recommendations: RotationRecommendationItem[];
}

interface SkuGroupingViewProps {
  skuGroups: SkuGroupData[];
  branches: BranchInfo[];
  onExecuteBatchSplitTransfer?: (
    batchId: string,
    allocations: { targetBranch: string; quantity: number; reason: string }[],
    retainedQuantity: number
  ) => void;
  onTransferBatch: (batchId: string, targetBranch: string, reason: string) => void;
}

export const SkuGroupingView: React.FC<SkuGroupingViewProps> = ({
  skuGroups,
  branches,
  onExecuteBatchSplitTransfer,
  onTransferBatch,
}) => {
  const [fineTuneBatch, setFineTuneBatch] = useState<RotationRecommendationItem | null>(null);
  const [expandedSku, setExpandedSku] = useState<string | null>(skuGroups[0]?.productName || null);

  const toggleExpand = (name: string) => {
    setExpandedSku(prev => prev === name ? null : name);
  };

  if (skuGroups.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <h3 className="text-base font-black text-slate-800">
          Все препараты сети сбалансированы по филиалам
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          В сети нет медикаментов с рисковыми сроками (Категории C и D), требующих перераспределения.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {skuGroups.map((sku) => {
        const isExpanded = expandedSku === sku.productName;
        const sampleBatch = sku.recommendations[0]?.batch || sku.holdingBranches[0]?.batches[0];
        const unitPrice = sampleBatch ? getBatchEffectiveUnitPrice(sampleBatch) : (sku.totalNetworkQty > 0 ? sku.totalNetworkValue / sku.totalNetworkQty : 0);

        return (
          <div 
            key={sku.productName}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all"
          >
            {/* Header summary row */}
            <div 
              onClick={() => toggleExpand(sku.productName)}
              className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer select-none border-b border-slate-100"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 bg-amber-100 text-amber-900 rounded-xl border border-amber-200 shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                      {sku.productName}
                    </h3>

                    {unitPrice > 0 && (
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                        Цена: {formatCurrencyTJS(unitPrice)}/уп.
                      </span>
                    )}

                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-900 border border-amber-300">
                      В сети: {sku.holdingBranches.length} точек
                    </span>

                    {sku.riskBatchesCount > 0 && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {sku.riskBatchesCount} рисковых партий ({sku.riskQty} уп.)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Общий запас в сети: <strong>{sku.totalNetworkQty} уп.</strong> на сумму <strong>{formatCurrencyTJS(sku.totalNetworkValue)}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end shrink-0">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Выручка под защитой:</span>
                  <span className="text-sm font-black text-emerald-600">
                    {formatCurrencyTJS(sku.riskValue)}
                  </span>
                </div>

                <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>
            </div>

            {/* Expanded Body: Complete Network Map & Allocation Matrix */}
            {isExpanded && (
              <div className="p-4 sm:p-5 space-y-5 bg-white animate-in fade-in duration-150">
                
                {/* 1. All Current Storage Locations Across the Chain */}
                <div className="space-y-2">
                  <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-slate-500" />
                      <span>Наличие и коэффициенты сбыта (k_прод) по филиалам ({sku.holdingBranches.length} точек):</span>
                    </div>
                    <CompactTooltip
                      title="Коэффициенты продаваемости по филиалам"
                      content="Показывает скорость выбытия данного медикамента в конкретной точке сети с учетом чекового трафика и специализации аптеки."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {sku.holdingBranches.map(hb => {
                      const branchVelocity = getBranchSalesVelocity(hb.branchName, sku.productName, sampleBatch);
                      const branchStockValue = unitPrice * hb.quantity;

                      return (
                        <div 
                          key={hb.branchName}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                            hb.isWarehouse 
                              ? 'bg-amber-50/50 border-amber-200 text-slate-900' 
                              : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="min-w-0 pr-2 space-y-1">
                            <span className="font-bold block truncate" title={hb.branchName}>
                              {hb.branchName}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500">г. {hb.city}</span>
                              <span className="text-slate-300">•</span>
                              <div className="inline-flex items-center gap-0.5">
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-black border ${branchVelocity.badgeBg} ${branchVelocity.badgeText}`}>
                                  k: {branchVelocity.formatted}
                                </span>
                                <CompactTooltip
                                  title={`Спрос: ${hb.branchName}`}
                                  content={branchVelocity.tooltipText}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-black text-slate-900 block">
                              {hb.quantity} уп.
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold">
                              {formatCurrencyTJS(branchStockValue)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Recommended Smart Split Distributions for Risk Batches */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    <span>Рекомендации умного распределения по сериям (FEFO):</span>
                  </div>

                  <div className="space-y-4">
                    {sku.recommendations.map(rec => {
                      const recUnitPrice = getBatchEffectiveUnitPrice(rec.batch);
                      const recTotalValue = recUnitPrice * (Number(rec.batch.quantity) || 0);
                      const donorVelocity = getBranchSalesVelocity(rec.currentBranch, rec.batch.productName, rec.batch);

                      return (
                        <div 
                          key={rec.batch.id} 
                          className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 shadow-2xs"
                        >
                          {/* Batch Header */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                rec.batch.category === 'D' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                Категория {rec.batch.category} ({rec.batch.daysRemaining} дн.)
                              </span>
                              
                              <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                                Серия: {rec.batch.lotNumber}
                              </span>

                              {recUnitPrice > 0 && (
                                <div className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-900 font-extrabold text-[11px]">
                                  <span>Цена: {formatCurrencyTJS(recUnitPrice)}/{rec.batch.unit || 'уп.'}</span>
                                </div>
                              )}

                              <div className="inline-flex items-center gap-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${donorVelocity.badgeBg} ${donorVelocity.badgeText}`}>
                                  k_донора: {donorVelocity.formatted}
                                </span>
                                <CompactTooltip
                                  title={`Скорость сбыта в доноре (${rec.currentBranch})`}
                                  content={donorVelocity.tooltipText}
                                />
                              </div>

                              <span className="text-xs text-slate-600 font-medium">
                                Годен до: <strong>{formatDateDDMMYYYY(rec.batch.expiryDate)}</strong>
                              </span>
                              
                              <span className="text-xs font-bold text-slate-900 bg-amber-100/60 px-2 py-0.5 rounded">
                                Объем: {rec.batch.quantity} {rec.batch.unit || 'уп.'} ({formatCurrencyTJS(recTotalValue)})
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setFineTuneBatch(rec)}
                                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                title="Настроить пропорции распределения вручную"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                                <span>Настроить доли</span>
                              </button>

                              {onExecuteBatchSplitTransfer && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const validSplits = (rec.allocations || [])
                                      .filter(a => a.role === 'RECIPIENT' && a.allocatedDelta > 0)
                                      .map(a => ({
                                        targetBranch: a.branchName,
                                        quantity: a.allocatedDelta,
                                        reason: a.reason || 'Умная ротация FEFO'
                                      }));
                                    onExecuteBatchSplitTransfer(rec.batch.id, validSplits, rec.retainedInDonor);
                                  }}
                                  className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Применить</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Multi-Allocation Matrix Table */}
                          <MultiAllocationMatrixTable
                            allocations={rec.allocations}
                            retainedInDonor={rec.retainedInDonor}
                            totalQuantity={Number(rec.batch.quantity) || 0}
                            unitPrice={recUnitPrice}
                            totalValue={recTotalValue}
                            unit={rec.batch.unit}
                            sourceBranch={rec.currentBranch}
                            productName={rec.batch.productName}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}
          </div>
        );
      })}

      {/* Fine-Tune Split Modal */}
      {fineTuneBatch && (
        <FineTuneSplitModal
          batch={fineTuneBatch.batch}
          initialAllocations={fineTuneBatch.allocations}
          initialRetained={fineTuneBatch.retainedInDonor}
          branches={branches}
          onClose={() => setFineTuneBatch(null)}
          onConfirm={(batchId, allocations, retainedQty) => {
            if (onExecuteBatchSplitTransfer) {
              onExecuteBatchSplitTransfer(batchId, allocations, retainedQty);
            }
          }}
        />
      )}
    </div>
  );
};
