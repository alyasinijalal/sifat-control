import React, { useState } from 'react';
import { MedicationBatch, BranchInfo } from '../../types';
import { BranchAllocationDetail } from '../../utils/exportUtils';
import { ArrowRightLeft, Building2, CheckCircle2, ShieldCheck, Plus, Trash2, Sliders, TrendingUp } from 'lucide-react';
import { formatCurrencyTJS, getBranchSalesVelocity, getBatchEffectiveUnitPrice } from '../../utils/categoryUtils';
import { CompactTooltip } from './CompactTooltip';

interface FineTuneSplitModalProps {
  batch: MedicationBatch;
  initialAllocations: BranchAllocationDetail[];
  initialRetained: number;
  branches: BranchInfo[];
  onClose: () => void;
  onConfirm: (
    batchId: string,
    allocations: { targetBranch: string; quantity: number; reason: string }[],
    retainedQuantity: number
  ) => void;
}

export const FineTuneSplitModal: React.FC<FineTuneSplitModalProps> = ({
  batch,
  initialAllocations,
  initialRetained,
  branches,
  onClose,
  onConfirm,
}) => {
  const totalQty = Number(batch.quantity) || 0;
  const isDonorWarehouse = (batch.branch || '').toLowerCase().includes('склад');
  const unitPrice = getBatchEffectiveUnitPrice(batch);
  const totalBatchValue = unitPrice * totalQty;

  const [retainedQty, setRetainedQty] = useState<number>(initialRetained);
  const [recipientSplits, setRecipientSplits] = useState<{
    branchName: string;
    quantity: number;
    reason: string;
  }[]>(() => {
    const recs = initialAllocations.filter(a => a.role === 'RECIPIENT');
    if (recs.length > 0) {
      return recs.map(r => ({
        branchName: r.branchName,
        quantity: r.allocatedDelta,
        reason: r.reason || 'Ротация FEFO для ускорения сбыта'
      }));
    }
    const defaultTarget = branches.find(b => b.nameRussian !== batch.branch)?.nameRussian || branches[0]?.nameRussian || '';
    return [{
      branchName: defaultTarget,
      quantity: Math.max(1, totalQty - initialRetained),
      reason: 'Ликвидация дефицита и балансировка запаса'
    }];
  });

  const sumAllocated = recipientSplits.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
  const totalAccounted = retainedQty + sumAllocated;
  const isBalanceExact = totalAccounted === totalQty;
  const discrepancy = totalQty - totalAccounted;

  const handleAddRecipient = () => {
    const existing = new Set(recipientSplits.map(r => r.branchName));
    const nextBranch = branches.find(b => b.nameRussian !== batch.branch && !existing.has(b.nameRussian));
    if (nextBranch) {
      setRecipientSplits(prev => [
        ...prev,
        {
          branchName: nextBranch.nameRussian,
          quantity: discrepancy > 0 ? discrepancy : 1,
          reason: 'Умная ротация FEFO'
        }
      ]);
    }
  };

  const handleRemoveRecipient = (index: number) => {
    setRecipientSplits(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSplitQtyChange = (index: number, newQty: number) => {
    setRecipientSplits(prev => prev.map((item, idx) => idx === index ? { ...item, quantity: Math.max(0, newQty) } : item));
  };

  const handleBranchChange = (index: number, newBranch: string) => {
    setRecipientSplits(prev => prev.map((item, idx) => idx === index ? { ...item, branchName: newBranch } : item));
  };

  const handleQuickDistributeEvenly = () => {
    if (recipientSplits.length === 0) return;
    const movable = totalQty - retainedQty;
    if (movable <= 0) return;
    const perBranch = Math.floor(movable / recipientSplits.length);
    const remainder = movable % recipientSplits.length;

    setRecipientSplits(prev => prev.map((item, idx) => ({
      ...item,
      quantity: perBranch + (idx === 0 ? remainder : 0)
    })));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanceExact) return;

    const validSplits = recipientSplits.filter(s => s.quantity > 0 && s.branchName !== batch.branch);
    onConfirm(batch.id, validSplits, retainedQty);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
              <Sliders className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">
                Настройка умного распределения по аптекам
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Распределите {totalQty} {batch.unit || 'уп.'} ({formatCurrencyTJS(totalBatchValue)}) между филиалами
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Batch Info Header */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="font-black text-slate-900 text-sm">
              {batch.productName}
            </div>
            {unitPrice > 0 && (
              <span className="font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Цена: {formatCurrencyTJS(unitPrice)}/{batch.unit || 'уп.'}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600 pt-1">
            <div>Серия: <strong className="text-slate-900">{batch.lotNumber}</strong></div>
            <div>Категория: <strong className="text-amber-700">{batch.category} ({batch.daysRemaining} дн.)</strong></div>
            <div>Всего в партии: <strong className="text-slate-900">{totalQty} {batch.unit || 'уп.'}</strong></div>
            <div>Донор: <strong className="text-slate-900 truncate block">{batch.branch}</strong></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Donor Retained Buffer */}
          <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-black text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Оставить на витрине донора («{batch.branch}»):</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={totalQty}
                  value={retainedQty}
                  onChange={(e) => setRetainedQty(Math.max(0, Math.min(totalQty, Number(e.target.value) || 0)))}
                  className="w-20 bg-white border border-amber-300 rounded-lg p-1.5 text-right font-black text-slate-900"
                />
                <span className="text-slate-600 font-bold">{batch.unit || 'уп.'}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {isDonorWarehouse 
                ? 'Для центрального склада можно оставить 0 уп. (полный трансфер в розницу).' 
                : 'Для аптеки рекомендуется сохранять буфер 2–5 уп. для витрины.'}
            </p>
          </div>

          {/* Recipient Branches Distribution List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-800 text-xs">
                Распределение между аптеками-получателями ({recipientSplits.length}):
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleQuickDistributeEvenly}
                  className="text-[11px] text-amber-700 bg-amber-100 hover:bg-amber-200 font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  Поровну
                </button>
                <button
                  type="button"
                  onClick={handleAddRecipient}
                  className="text-[11px] text-slate-900 bg-slate-100 hover:bg-slate-200 font-black px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-slate-300"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-600" />
                  <span>Добавить аптеку</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {recipientSplits.map((split, idx) => {
                const targetVelocity = getBranchSalesVelocity(split.branchName, batch.productName, batch);
                const splitValue = unitPrice * split.quantity;

                return (
                  <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <div className="flex-1 min-w-0 space-y-1">
                      <select
                        value={split.branchName}
                        onChange={(e) => handleBranchChange(idx, e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 text-xs focus:ring-1 focus:ring-amber-400"
                      >
                        {branches.filter(b => b.nameRussian !== batch.branch).map(b => (
                          <option key={b.id} value={b.nameRussian}>
                            {b.nameRussian} ({b.city})
                          </option>
                        ))}
                      </select>
                      
                      {/* Target sales velocity & projected value */}
                      <div className="flex items-center gap-2 text-[10px]">
                        <div className="inline-flex items-center gap-1">
                          <span className={`px-1.5 py-0.2 rounded font-black border ${targetVelocity.badgeBg} ${targetVelocity.badgeText}`}>
                            k: {targetVelocity.formatted}
                          </span>
                          <CompactTooltip
                            title={`Скорость сбыта: ${split.branchName}`}
                            content={targetVelocity.tooltipText}
                          />
                        </div>
                        {splitValue > 0 && (
                          <span className="text-slate-500 font-semibold">
                            Сумма: <strong>{formatCurrencyTJS(splitValue)}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-500 font-bold">Кол-во:</span>
                      <input
                        type="number"
                        min={1}
                        max={totalQty}
                        value={split.quantity}
                        onChange={(e) => handleSplitQtyChange(idx, Number(e.target.value) || 0)}
                        className="w-20 bg-white border border-slate-300 rounded-lg p-1.5 text-right font-black text-slate-900 text-xs"
                      />
                      <span className="text-slate-600 font-bold">{batch.unit || 'уп.'}</span>

                      {recipientSplits.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Удалить направление"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Validation & Balance Status */}
          <div className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
            isBalanceExact 
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 ${isBalanceExact ? 'text-emerald-600' : 'text-rose-500'}`} />
              <span>
                {isBalanceExact ? (
                  'Баланс соблюден: 100% объема распределено.'
                ) : (
                  `Остаток: ${discrepancy} уп. (Учтено: ${totalAccounted} из ${totalQty})`
                )}
              </span>
            </div>
            <span className="font-black text-sm">
              {totalAccounted} / {totalQty}
            </span>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!isBalanceExact || recipientSplits.length === 0}
              className={`px-5 py-2 rounded-xl font-black text-xs cursor-pointer flex items-center gap-1.5 shadow-xs transition-all ${
                isBalanceExact && recipientSplits.length > 0
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Применить распределение</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
