import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  MapPin,
  Boxes,
  Phone,
  Layers,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { BranchInfo, MedicationBatch } from '../types';
import { formatCurrencyTJS } from '../utils/categoryUtils';

interface BranchManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: BranchInfo[];
  batches?: MedicationBatch[];
  onAddBranch: (branch: BranchInfo) => void;
  onUpdateBranch: (branch: BranchInfo) => void;
  onDeleteBranch: (branchId: string) => void;
  onReassignAllBatchesBranch: (targetBranchName: string) => void;
  totalBatchesCount: number;
}

const TAJIKISTAN_CITIES = [
  'Душанбе',
  'Худжанд',
  'Бохтар',
  'Куляб',
  'Турсунзаде',
  'Истаравшан',
  'Дангара',
  'Вахдат',
  'Канибадам',
  'Исфара',
  'Хорог',
];

export const BranchManagementModal: React.FC<BranchManagementModalProps> = ({
  isOpen,
  onClose,
  branches,
  batches = [],
  onAddBranch,
  onUpdateBranch,
  onDeleteBranch,
  onReassignAllBatchesBranch,
  totalBatchesCount,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');

  // Bulk selection state
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);

  // Delete confirmation modal state for branch with batches
  const [deletingBranchObj, setDeletingBranchObj] = useState<{ branch: BranchInfo; count: number } | null>(null);
  const [reassignTargetForDelete, setReassignTargetForDelete] = useState<string>('');
  const [inlineConfirmDeleteId, setInlineConfirmDeleteId] = useState<string | null>(null);

  // Toggle single branch selection
  const toggleSelectBranch = (id: string) => {
    setSelectedBranchIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Toggle select all branches
  const toggleSelectAllBranches = () => {
    if (selectedBranchIds.length === branches.length) {
      setSelectedBranchIds([]);
    } else {
      setSelectedBranchIds(branches.map(b => b.id));
    }
  };

  // Bulk delete selected branches
  const handleBulkDeleteBranches = () => {
    if (selectedBranchIds.length === 0) return;
    const branchesToDelete = branches.filter(b => selectedBranchIds.includes(b.id));
    
    // Check if remaining branches exist
    const remainingBranches = branches.filter(b => !selectedBranchIds.includes(b.id));
    const fallbackTarget = remainingBranches[0]?.nameRussian || 'Центральный склад (г. Душанбе)';

    // Reassign all batches belonging to deleted branches to the fallbackTarget
    branchesToDelete.forEach(b => {
      batches.forEach(batch => {
        if (batch.branch === b.nameRussian) {
          batch.branch = fallbackTarget;
        }
      });
      onDeleteBranch(b.id);
    });

    setSelectedBranchIds([]);
    setBulkSuccessMsg(`Удалено филиалов: ${branchesToDelete.length}. Все партии перепривязаны к «${fallbackTarget}».`);
    setTimeout(() => setBulkSuccessMsg(null), 4000);
  };


  // New branch form state
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('Душанбе');
  const [newAddress, setNewAddress] = useState('');
  const [branchType, setBranchType] = useState<'warehouse' | 'pharmacy' | 'regional'>('pharmacy');

  // Bulk Reassign state
  const [bulkTargetBranch, setBulkTargetBranch] = useState<string>(
    branches[0]?.nameRussian || 'Центральный склад (г. Душанбе)'
  );
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate statistics per branch
  const getBranchStats = (branchName: string) => {
    const branchBatches = batches.filter(b => b.branch === branchName);
    const count = branchBatches.length;
    const totalValue = branchBatches.reduce((acc, b) => acc + (b.retailPrice * b.quantity), 0);
    return { count, totalValue };
  };

  const handleStartEdit = (b: BranchInfo) => {
    setEditingId(b.id);
    setEditName(b.nameRussian);
    setEditCity(b.city);
    setEditAddress(b.address);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    onUpdateBranch({
      id,
      nameTajik: editName,
      nameRussian: editName,
      city: editCity || 'Душанбе',
      address: editAddress || '',
    });
    setEditingId(null);
  };

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const newB: BranchInfo = {
      id: `b-${Date.now()}`,
      nameTajik: newName.trim(),
      nameRussian: newName.trim(),
      city: newCity.trim() || 'Душанбе',
      address: newAddress.trim() || 'Адрес не указан',
    };
    onAddBranch(newB);
    setNewName('');
    setNewAddress('');
    setIsAdding(false);
  };

  const handlePromptDelete = (b: BranchInfo) => {
    const stats = getBranchStats(b.nameRussian);
    if (stats.count > 0) {
      // Find a default target branch different from the deleting one
      const fallback = branches.find(item => item.id !== b.id)?.nameRussian || '';
      setReassignTargetForDelete(fallback);
      setDeletingBranchObj({ branch: b, count: stats.count });
    } else {
      setInlineConfirmDeleteId(b.id);
    }
  };

  const handleConfirmDeleteWithReassign = () => {
    if (!deletingBranchObj) return;
    if (reassignTargetForDelete) {
      // Reassign batches of deleted branch to reassignTargetForDelete
      const targetName = reassignTargetForDelete;
      // We can use bulk reassign or update
      // Reassigning all batches of this specific branch
      batches.forEach(batch => {
        if (batch.branch === deletingBranchObj.branch.nameRussian) {
          batch.branch = targetName;
        }
      });
    }
    onDeleteBranch(deletingBranchObj.branch.id);
    setDeletingBranchObj(null);
  };

  const handleBulkReassign = () => {
    if (!bulkTargetBranch) return;
    onReassignAllBatchesBranch(bulkTargetBranch);
    setBulkSuccessMsg(`Все ${totalBatchesCount} товаров в системе успешно переведены на «${bulkTargetBranch}».`);
    setTimeout(() => setBulkSuccessMsg(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden text-slate-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white tracking-tight flex items-center gap-2">
                <span>Администрирование филиалов и складов</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-md border border-amber-500/30">
                  ООО «Сифат Фарма»
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Управление аптечной сетью, складами хранения и автоматическая стандартизация наименований
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl font-bold p-1 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">

          {/* Delete & Reassign Warning Dialog overlay if triggered */}
          {deletingBranchObj && (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl space-y-3 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 text-rose-900 font-black text-xs uppercase tracking-wider">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>Перепривязка товаров перед удалением филиала</span>
              </div>
              <p className="text-xs text-rose-950 font-medium leading-relaxed">
                На филиале <strong>«{deletingBranchObj.branch.nameRussian}»</strong> сейчас числится <strong>{deletingBranchObj.count} партий медикаментов</strong>. Укажите, на какой другой склад перенести эти товары:
              </p>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <select
                  value={reassignTargetForDelete}
                  onChange={(e) => setReassignTargetForDelete(e.target.value)}
                  className="flex-1 bg-white border border-rose-300 font-bold text-xs rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-rose-400"
                >
                  {branches
                    .filter(b => b.id !== deletingBranchObj.branch.id)
                    .map(b => (
                      <option key={b.id} value={b.nameRussian}>
                        {b.nameRussian} ({b.city})
                      </option>
                    ))}
                </select>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setDeletingBranchObj(null)}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleConfirmDeleteWithReassign}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    Перенести товары и удалить филиал
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Top Tools & One-Click Consolidation */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200/80 p-4 rounded-xl space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Быстрая стандартизация и привязка остатков</span>
              </div>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full">
                Всего партий в базе: {totalBatchesCount}
              </span>
            </div>

            <p className="text-xs text-amber-950 leading-relaxed font-medium">
              При импорте из сторонних систем 1С могут возникать разрозненные названия складов. С помощью этой функции вы можете мгновенно закрепить <strong>все {totalBatchesCount} партий</strong> за единым выбранным подразделением:
            </p>

            {bulkSuccessMsg && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs rounded-lg flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{bulkSuccessMsg}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <select
                value={bulkTargetBranch}
                onChange={(e) => setBulkTargetBranch(e.target.value)}
                className="flex-1 bg-white border border-amber-300 text-slate-900 font-bold text-xs rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer shadow-2xs"
              >
                {branches.map(b => (
                  <option key={b.id} value={b.nameRussian}>
                    {b.nameRussian} ({b.city})
                  </option>
                ))}
              </select>

              <button
                onClick={handleBulkReassign}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0 transition-all active:scale-95 border border-amber-500"
              >
                <span>Привязать все {totalBatchesCount} товаров</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Section 2: Branch Management List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-600" />
                  <span>Активные подразделения и склады ({branches.length})</span>
                </h4>
              </div>

              {!isAdding && (
                <button
                  onClick={() => setIsAdding(true)}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить новое подразделение</span>
                </button>
              )}
            </div>

            {/* Form: Add New Branch */}
            {isAdding && (
              <form onSubmit={handleCreateBranch} className="p-4 bg-slate-50 border-2 border-amber-300 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="font-black text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Регистрация нового филиала / аптечного склада</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                  >
                    Закрыть
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Официальное название
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Например: Аптека №4 (г. Куляб) или Центральный склад №2"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Город расположения
                    </label>
                    <select
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {TAJIKISTAN_CITIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Фактический адрес
                  </label>
                  <input
                    type="text"
                    placeholder="Например: ул. И. Сомони 42, ориентер: Главная больница"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3.5 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    Сохранить и зарегистрировать
                  </button>
                </div>
              </form>
            )}

            {/* Bulk Toolbar & Select All */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 p-2.5 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 select-none">
                <input
                  type="checkbox"
                  checked={branches.length > 0 && selectedBranchIds.length === branches.length}
                  onChange={toggleSelectAllBranches}
                  className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
                <span>Выделить все ({branches.length})</span>
              </label>

              {selectedBranchIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-amber-900 bg-amber-100 px-2 py-1 rounded-lg border border-amber-300">
                    Выбрано: {selectedBranchIds.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleBulkDeleteBranches}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Удалить выбранные ({selectedBranchIds.length})</span>
                  </button>
                </div>
              )}
            </div>

            {/* Branches List */}
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {branches.map((b) => {
                const isEditing = editingId === b.id;
                const stats = getBranchStats(b.nameRussian);
                const isSelected = selectedBranchIds.includes(b.id);

                return (
                  <div key={b.id} className={`p-3.5 bg-white border rounded-xl flex items-center justify-between gap-3 shadow-2xs transition-all ${isSelected ? 'border-amber-400 bg-amber-50/40 ring-1 ring-amber-300' : 'border-slate-200 hover:border-slate-300'}`}>
                    {/* Row Checkbox */}
                    <div className="flex items-center shrink-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectBranch(b.id)}
                        className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                      />
                    </div>

                    {isEditing ? (
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Название</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full p-1.5 border border-slate-300 rounded text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Город</label>
                          <input
                            type="text"
                            value={editCity}
                            onChange={(e) => setEditCity(e.target.value)}
                            className="w-full p-1.5 border border-slate-300 rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Адрес</label>
                          <input
                            type="text"
                            value={editAddress}
                            onChange={(e) => setEditAddress(e.target.value)}
                            className="w-full p-1.5 border border-slate-300 rounded text-xs"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900 truncate">
                            {b.nameRussian}
                          </span>

                          <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-[10px] shrink-0">
                            {stats.count} партий
                          </span>

                          {stats.totalValue > 0 && (
                            <span className="text-[10px] text-emerald-700 font-black bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 hidden sm:inline-block">
                              ~{formatCurrencyTJS(stats.totalValue)} TJS
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{b.city}</span>
                          <span>•</span>
                          <span className="truncate">{b.address}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(b.id)}
                            className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg cursor-pointer"
                            title="Сохранить"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                            title="Отмена"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEdit(b)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg cursor-pointer transition-colors"
                            title="Редактировать параметры"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {inlineConfirmDeleteId === b.id ? (
                            <div className="flex items-center gap-1.5 bg-rose-50 px-2 py-1 rounded-lg border border-rose-300 animate-in fade-in">
                              <span className="text-[10px] font-black text-rose-900">Удалить?</span>
                              <button
                                onClick={() => {
                                  onDeleteBranch(b.id);
                                  setInlineConfirmDeleteId(null);
                                }}
                                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] rounded cursor-pointer shadow-2xs"
                              >
                                Да
                              </button>
                              <button
                                onClick={() => setInlineConfirmDeleteId(null)}
                                className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[10px] rounded cursor-pointer"
                              >
                                Отмена
                              </button>
                            </div>
                          ) : (
                            branches.length > 1 && (
                              <button
                                onClick={() => handlePromptDelete(b)}
                                className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer transition-colors"
                                title="Удалить филиал"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 font-semibold">
            Зарегистрировано подразделений: <strong className="text-slate-900">{branches.length}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-2xs transition-colors"
          >
            Закрыть окно
          </button>
        </div>

      </div>
    </div>
  );
};
