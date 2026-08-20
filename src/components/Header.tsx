import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Calendar, 
  FileSpreadsheet,
  Download,
  Menu,
  HelpCircle,
  Database,
  RotateCcw,
  ChevronDown,
  Eye,
  Type,
  Search,
  Filter,
  Check,
  X
} from 'lucide-react';
import { BranchInfo, MedicationBatch } from '../types';
import { exportParacelsusRepriceCSV, exportParacelsusRepriceXLSX } from '../utils/exportUtils';
import { formatDateDDMMYYYY, getBranchTypeInfo, isWarehouseBranch, isPharmacyBranch, isStoreBranch, isDisposalBranch } from '../utils/categoryUtils';
import { Help1CModal } from './Help1CModal';

export type UiScaleType = 'compact' | 'normal' | 'large' | 'xlarge';

interface HeaderProps {
  selectedBranches: string[];
  setSelectedBranches: (branches: string[]) => void;
  selectedBranch?: string;
  setSelectedBranch?: (branch: string) => void;
  branches: BranchInfo[];
  batches: MedicationBatch[];
  onOpenNewBatchModal: () => void;
  onOpenResetModal: () => void;
  onOpenBranchModal?: () => void;
  referenceDate: string;
  onToggleMobileSidebar: () => void;
  lastHistoryAction?: { description: string; timestamp: string } | null;
  onUndo?: () => void;
  uiScale: UiScaleType;
  setUiScale: (scale: UiScaleType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedBranches,
  setSelectedBranches,
  selectedBranch,
  setSelectedBranch,
  branches,
  batches,
  onOpenNewBatchModal,
  onOpenResetModal,
  onOpenBranchModal,
  referenceDate,
  onToggleMobileSidebar,
  lastHistoryAction,
  onUndo,
  uiScale,
  setUiScale,
}) => {
  const [isHelp1COpen, setIsHelp1COpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isScaleMenuOpen, setIsScaleMenuOpen] = useState(false);

  // Branch Popover Dropdown state
  const [isBranchPopoverOpen, setIsBranchPopoverOpen] = useState(false);
  const [branchSearch, setBranchSearch] = useState('');
  const [branchCategoryFilter, setBranchCategoryFilter] = useState<'ALL' | 'WAREHOUSES' | 'PHARMACIES' | 'STORES' | 'DISPOSAL'>('ALL');

  // Extract all unique branch names and count batches per branch
  const branchStats = useMemo(() => {
    const countsMap = new Map<string, number>();
    batches.forEach(b => {
      if (b.branch) {
        countsMap.set(b.branch, (countsMap.get(b.branch) || 0) + 1);
      }
    });

    const set = new Set<string>();
    branches.forEach(b => set.add(b.nameRussian));
    batches.forEach(b => { if (b.branch) set.add(b.branch); });

    const allNames = Array.from(set);
    return allNames.map(name => {
      const typeInfo = getBranchTypeInfo(name);
      return {
        name,
        count: countsMap.get(name) || 0,
        city: branches.find(b => b.nameRussian === name)?.city || '',
        typeInfo,
      };
    });
  }, [branches, batches]);

  const warehousesList = useMemo(() => branchStats.filter(b => b.typeInfo.type === 'WAREHOUSE'), [branchStats]);
  const pharmaciesList = useMemo(() => branchStats.filter(b => b.typeInfo.type === 'PHARMACY'), [branchStats]);
  const storesList = useMemo(() => branchStats.filter(b => b.typeInfo.type === 'STORE'), [branchStats]);
  const disposalList = useMemo(() => branchStats.filter(b => b.typeInfo.type === 'DISPOSAL'), [branchStats]);

  const filteredBranchList = useMemo(() => {
    let list = branchStats;
    if (branchCategoryFilter === 'WAREHOUSES') list = warehousesList;
    else if (branchCategoryFilter === 'PHARMACIES') list = pharmaciesList;
    else if (branchCategoryFilter === 'STORES') list = storesList;
    else if (branchCategoryFilter === 'DISPOSAL') list = disposalList;

    if (!branchSearch.trim()) return list;
    const q = branchSearch.toLowerCase();
    return list.filter(b => b.name.toLowerCase().includes(q) || b.city.toLowerCase().includes(q));
  }, [branchStats, warehousesList, pharmaciesList, storesList, disposalList, branchCategoryFilter, branchSearch]);

  // Operational branch names (Warehouses, Pharmacies, Stores - excluding Disposal)
  const operationalBranchNames = useMemo(() => {
    return branchStats.filter(b => b.typeInfo.type !== 'DISPOSAL').map(b => b.name);
  }, [branchStats]);

  const disposalBranchNames = useMemo(() => {
    return branchStats.filter(b => b.typeInfo.type === 'DISPOSAL').map(b => b.name);
  }, [branchStats]);

  // Current checked branches list
  const currentCheckedBranches = useMemo(() => {
    if (selectedBranches.includes('__NONE__')) return [];
    if (selectedBranches.length === 0) {
      // By default: all operational branches are checked, disposal is NOT checked!
      return operationalBranchNames;
    }
    return selectedBranches;
  }, [selectedBranches, operationalBranchNames]);

  const isBranchChecked = (branchName: string) => {
    return currentCheckedBranches.includes(branchName);
  };

  const selectedWarehousesCount = useMemo(() => warehousesList.filter(b => isBranchChecked(b.name)).length, [warehousesList, currentCheckedBranches]);
  const selectedPharmaciesCount = useMemo(() => pharmaciesList.filter(b => isBranchChecked(b.name)).length, [pharmaciesList, currentCheckedBranches]);
  const selectedStoresCount = useMemo(() => storesList.filter(b => isBranchChecked(b.name)).length, [storesList, currentCheckedBranches]);
  const selectedDisposalCount = useMemo(() => disposalList.filter(b => isBranchChecked(b.name)).length, [disposalList, currentCheckedBranches]);

  const hasNoneSelected = selectedBranches.includes('__NONE__') || currentCheckedBranches.length === 0;
  const isDefaultOperationalSelection = useMemo(() => {
    if (selectedBranches.length === 0) return true;
    if (selectedBranches.includes('__NONE__')) return false;
    const hasAllOps = operationalBranchNames.length > 0 && operationalBranchNames.every(n => selectedBranches.includes(n));
    const hasNoDisposal = !disposalBranchNames.some(n => selectedBranches.includes(n));
    return hasAllOps && hasNoDisposal && selectedBranches.length === operationalBranchNames.length;
  }, [selectedBranches, operationalBranchNames, disposalBranchNames]);

  const isAllNetworkSelected = currentCheckedBranches.length === branchStats.length && branchStats.length > 0;

  // Scoped Select All handler (operates ONLY on current category view)
  const handleScopedSelectAll = () => {
    let targetNames: string[] = [];
    if (branchCategoryFilter === 'ALL') {
      // Select all operational branches (disposal remains unchecked by default)
      targetNames = operationalBranchNames;
      setSelectedBranches(targetNames);
      if (setSelectedBranch) setSelectedBranch('ALL');
      return;
    } else if (branchCategoryFilter === 'WAREHOUSES') {
      targetNames = warehousesList.map(b => b.name);
    } else if (branchCategoryFilter === 'PHARMACIES') {
      targetNames = pharmaciesList.map(b => b.name);
    } else if (branchCategoryFilter === 'STORES') {
      targetNames = storesList.map(b => b.name);
    } else if (branchCategoryFilter === 'DISPOSAL') {
      targetNames = disposalList.map(b => b.name);
    }

    const set = new Set([...currentCheckedBranches, ...targetNames]);
    const next = Array.from(set);
    setSelectedBranches(next);
    if (setSelectedBranch) {
      setSelectedBranch(next.length === 1 ? next[0] : 'ALL');
    }
  };

  // Scoped Deselect All handler (operates ONLY on current category view)
  const handleScopedDeselectAll = () => {
    if (branchCategoryFilter === 'ALL') {
      setSelectedBranches(['__NONE__']);
      if (setSelectedBranch) setSelectedBranch('NONE');
      return;
    }

    let targetNamesToRemove: string[] = [];
    if (branchCategoryFilter === 'WAREHOUSES') {
      targetNamesToRemove = warehousesList.map(b => b.name);
    } else if (branchCategoryFilter === 'PHARMACIES') {
      targetNamesToRemove = pharmaciesList.map(b => b.name);
    } else if (branchCategoryFilter === 'STORES') {
      targetNamesToRemove = storesList.map(b => b.name);
    } else if (branchCategoryFilter === 'DISPOSAL') {
      targetNamesToRemove = disposalList.map(b => b.name);
    }

    const next = currentCheckedBranches.filter(b => !targetNamesToRemove.includes(b));
    if (next.length === 0) {
      setSelectedBranches(['__NONE__']);
      if (setSelectedBranch) setSelectedBranch('NONE');
    } else {
      setSelectedBranches(next);
      if (next.length === 1 && setSelectedBranch) setSelectedBranch(next[0]);
    }
  };

  // Toggle entire category on/off with 1 click
  const handleToggleWholeCategory = (type: 'WAREHOUSE' | 'PHARMACY' | 'STORE' | 'DISPOSAL') => {
    let catBranchNames: string[] = [];
    if (type === 'WAREHOUSE') catBranchNames = warehousesList.map(b => b.name);
    else if (type === 'PHARMACY') catBranchNames = pharmaciesList.map(b => b.name);
    else if (type === 'STORE') catBranchNames = storesList.map(b => b.name);
    else if (type === 'DISPOSAL') catBranchNames = disposalList.map(b => b.name);

    if (catBranchNames.length === 0) return;

    const allCatSelected = catBranchNames.every(n => currentCheckedBranches.includes(n));
    let next: string[];
    if (allCatSelected) {
      // Turn off this category
      next = currentCheckedBranches.filter(n => !catBranchNames.includes(n));
    } else {
      // Turn on this whole category
      const set = new Set([...currentCheckedBranches, ...catBranchNames]);
      next = Array.from(set);
    }

    if (next.length === 0) {
      setSelectedBranches(['__NONE__']);
      if (setSelectedBranch) setSelectedBranch('NONE');
    } else {
      setSelectedBranches(next);
      if (next.length === 1 && setSelectedBranch) setSelectedBranch(next[0]);
    }
  };

  // Toggle individual branch
  const handleToggleBranch = (branchName: string) => {
    let next: string[];
    if (currentCheckedBranches.includes(branchName)) {
      next = currentCheckedBranches.filter(b => b !== branchName);
    } else {
      next = [...currentCheckedBranches, branchName];
    }

    if (next.length === 0) {
      setSelectedBranches(['__NONE__']);
      if (setSelectedBranch) setSelectedBranch('NONE');
    } else {
      setSelectedBranches(next);
      if (next.length === 1 && setSelectedBranch) setSelectedBranch(next[0]);
      else if (next.length === branchStats.length && setSelectedBranch) setSelectedBranch('ALL');
    }
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 px-3 sm:px-5 py-2.5 sticky top-0 z-30 shadow-2xs no-print transition-all w-full">
        <div className="w-full max-w-[1920px] mx-auto flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
          {/* Left Section: Mobile Toggle + Audit Date & Unified Branch Selector */}
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {/* Mobile Sidebar Hamburger Toggle */}
            <button
              onClick={onToggleMobileSidebar}
              className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer shrink-0"
              title="Открыть меню"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* FEFO Audit Date Badge in DD.MM.YYYY */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-100/90 px-3 py-1.5 rounded-xl border border-slate-200/80 shrink-0">
              <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="text-xs whitespace-nowrap">
                <span className="text-slate-500 font-medium mr-1">FEFO:</span>
                <span className="font-black text-slate-900 font-mono">
                  {formatDateDDMMYYYY(referenceDate || '2026-08-10')}
                </span>
              </div>
            </div>

            {/* Unified Expanded Branch Selector Button & Popover */}
            <div className="relative">
              <button
                onClick={() => setIsBranchPopoverOpen(!isBranchPopoverOpen)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs border active:scale-95 ${
                  !isDefaultOperationalSelection && !isAllNetworkSelected
                    ? 'bg-amber-400 text-slate-950 border-amber-500 font-black ring-2 ring-amber-300' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                }`}
                title="Выбор филиала или группы филиалов для всей системы"
              >
                <Building2 className={`w-4 h-4 shrink-0 ${!isDefaultOperationalSelection && !isAllNetworkSelected ? 'text-slate-950' : 'text-amber-600'}`} />
                <span className="max-w-[140px] sm:max-w-[220px] md:max-w-[280px] truncate">
                  {hasNoneSelected
                    ? `Ничего не выбрано (0 из ${branchStats.length})`
                    : isDefaultOperationalSelection
                    ? `Вся рабочая сеть (${operationalBranchNames.length})`
                    : isAllNetworkSelected
                    ? `Все подразделения (${branchStats.length})`
                    : currentCheckedBranches.length === 1
                    ? currentCheckedBranches[0]
                    : `Филиалы: ${currentCheckedBranches.length} из ${branchStats.length}`}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
              </button>

              {/* Popover Dropdown */}
              {isBranchPopoverOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsBranchPopoverOpen(false)} 
                  />
                  <div 
                    className="absolute left-0 top-full mt-2 w-84 sm:w-[420px] bg-slate-900 border border-slate-700 text-white rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 space-y-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                          Фильтр сети подразделений
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">
                          {selectedDisposalCount === 0 ? (
                            <span className="text-slate-400 font-medium bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                              Списание выкл.
                            </span>
                          ) : (
                            <span className="text-rose-300 font-medium bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/80">
                              Списание вкл. ({selectedDisposalCount})
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsBranchPopoverOpen(false)}
                          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
                          title="Закрыть окно"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Facility Category Filter Tabs */}
                    <div className="grid grid-cols-5 gap-1 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setBranchCategoryFilter('ALL')}
                        className={`py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                          branchCategoryFilter === 'ALL'
                            ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Показать все подразделения"
                      >
                        Все ({branchStats.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setBranchCategoryFilter('WAREHOUSES')}
                        className={`py-1.5 rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-0.5 ${
                          branchCategoryFilter === 'WAREHOUSES'
                            ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                            : 'text-amber-400/90 hover:text-amber-300'
                        }`}
                        title="Фильтр: Центральные склады"
                      >
                        <span>🏢</span>
                        <span className="font-mono">({selectedWarehousesCount}/{warehousesList.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBranchCategoryFilter('PHARMACIES')}
                        className={`py-1.5 rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-0.5 ${
                          branchCategoryFilter === 'PHARMACIES'
                            ? 'bg-blue-500 text-white font-black shadow-xs'
                            : 'text-blue-400/90 hover:text-blue-300'
                        }`}
                        title="Фильтр: Аптеки сети"
                      >
                        <span>🏥</span>
                        <span className="font-mono">({selectedPharmaciesCount}/{pharmaciesList.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBranchCategoryFilter('STORES')}
                        className={`py-1.5 rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-0.5 ${
                          branchCategoryFilter === 'STORES'
                            ? 'bg-purple-500 text-white font-black shadow-xs'
                            : 'text-purple-400/90 hover:text-purple-300'
                        }`}
                        title="Фильтр: Магазины"
                      >
                        <span>🛍️</span>
                        <span className="font-mono">({selectedStoresCount}/{storesList.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBranchCategoryFilter('DISPOSAL')}
                        className={`py-1.5 rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-0.5 ${
                          branchCategoryFilter === 'DISPOSAL'
                            ? 'bg-rose-500 text-white font-black shadow-xs'
                            : 'text-rose-400/90 hover:text-rose-300'
                        }`}
                        title="Фильтр: Отдел списания и утилизации"
                      >
                        <span>🗑️</span>
                        <span className="font-mono">({selectedDisposalCount}/{disposalList.length})</span>
                      </button>
                    </div>

                    {/* Scoped Actions Bar: Select/Deselect Scoped To Active Category + Category Toggles */}
                    <div className="space-y-1.5 bg-slate-950/40 p-2 rounded-xl border border-slate-800/80">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={handleScopedSelectAll}
                          className="flex-1 py-1.5 px-2 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                          title="Выбрать все объекты в текущей категории"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>
                            {branchCategoryFilter === 'ALL'
                              ? `Выбрать всю рабочую сеть (${operationalBranchNames.length})`
                              : branchCategoryFilter === 'WAREHOUSES'
                              ? `Выбрать все склады (${warehousesList.length})`
                              : branchCategoryFilter === 'PHARMACIES'
                              ? `Выбрать все аптеки (${pharmaciesList.length})`
                              : branchCategoryFilter === 'STORES'
                              ? `Выбрать все магазины (${storesList.length})`
                              : `Выбрать списание (${disposalList.length})`}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={handleScopedDeselectAll}
                          className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                          title="Снять выбор с объектов текущей категории"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>
                            {branchCategoryFilter === 'ALL'
                              ? 'Снять всё'
                              : 'Снять'}
                          </span>
                        </button>
                      </div>

                      {/* Quick Category Multi-Toggle Chips (Select/Deselect whole category in 1 click) */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] text-slate-400 font-semibold mr-1">Категории:</span>
                        {warehousesList.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleToggleWholeCategory('WAREHOUSE')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                              selectedWarehousesCount === warehousesList.length
                                ? 'bg-amber-500/30 text-amber-200 border-amber-500/60 font-black'
                                : selectedWarehousesCount > 0
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-300'
                            }`}
                            title="Включить/выключить все склады целиком"
                          >
                            <span>🏢 Склады</span>
                            <span className="font-mono text-[9px] opacity-80">({selectedWarehousesCount}/{warehousesList.length})</span>
                          </button>
                        )}

                        {pharmaciesList.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleToggleWholeCategory('PHARMACY')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                              selectedPharmaciesCount === pharmaciesList.length
                                ? 'bg-blue-500/30 text-blue-200 border-blue-500/60 font-black'
                                : selectedPharmaciesCount > 0
                                ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-300'
                            }`}
                            title="Включить/выключить все аптеки целиком"
                          >
                            <span>🏥 Аптеки</span>
                            <span className="font-mono text-[9px] opacity-80">({selectedPharmaciesCount}/{pharmaciesList.length})</span>
                          </button>
                        )}

                        {storesList.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleToggleWholeCategory('STORE')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                              selectedStoresCount === storesList.length
                                ? 'bg-purple-500/30 text-purple-200 border-purple-500/60 font-black'
                                : selectedStoresCount > 0
                                ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-300'
                            }`}
                            title="Включить/выключить все магазины целиком"
                          >
                            <span>🛍️ Магазины</span>
                            <span className="font-mono text-[9px] opacity-80">({selectedStoresCount}/{storesList.length})</span>
                          </button>
                        )}

                        {disposalList.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleToggleWholeCategory('DISPOSAL')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                              selectedDisposalCount === disposalList.length
                                ? 'bg-rose-500/30 text-rose-200 border-rose-500/60 font-black ring-1 ring-rose-400'
                                : selectedDisposalCount > 0
                                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-300'
                            }`}
                            title="Включить/выключить списание (по умолчанию отключено)"
                          >
                            <span>🗑️ Списание</span>
                            <span className="font-mono text-[9px] opacity-80">({selectedDisposalCount}/{disposalList.length})</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Search Box */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Поиск подразделения по названию или городу..."
                        value={branchSearch}
                        onChange={(e) => setBranchSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Scrollable Branch List */}
                    <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {filteredBranchList.map((branch) => {
                        const isChecked = isBranchChecked(branch.name);
                        const isWh = branch.typeInfo.type === 'WAREHOUSE';
                        const isStore = branch.typeInfo.type === 'STORE';
                        const isDisp = branch.typeInfo.type === 'DISPOSAL';

                        return (
                          <div
                            key={branch.name}
                            className={`p-2 rounded-xl border text-xs transition-colors flex items-center justify-between gap-2 group cursor-pointer ${
                              isChecked 
                                ? 'bg-amber-400/20 text-white border-amber-400/40 font-bold' 
                                : 'bg-slate-800/40 hover:bg-slate-800 border-transparent text-slate-300'
                            }`}
                            onClick={() => handleToggleBranch(branch.name)}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleToggleBranch(branch.name);
                                }}
                                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer accent-amber-400 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="shrink-0">{branch.typeInfo.iconText}</span>
                                  <span className="truncate font-semibold text-slate-100 group-hover:text-amber-300 transition-colors">
                                    {branch.name}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-normal flex items-center gap-2 mt-0.5">
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${
                                    isWh 
                                      ? 'bg-amber-900/60 text-amber-300 border border-amber-700/60' 
                                      : isStore 
                                      ? 'bg-purple-900/60 text-purple-300 border border-purple-700/60' 
                                      : isDisp
                                      ? 'bg-rose-900/60 text-rose-300 border border-rose-700/60'
                                      : 'bg-blue-900/60 text-blue-300 border border-blue-700/60'
                                  }`}>
                                    {branch.typeInfo.shortLabel}
                                  </span>
                                  {branch.city && <span>г. {branch.city}</span>}
                                </div>
                              </div>
                            </div>

                            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded shrink-0 border border-slate-700/60">
                              {branch.count} тов.
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer Status - Changes Apply Instantly, No 'Применить' Button Needed */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-300 font-medium">
                        Выбрано: <strong className="text-amber-400 font-mono">{currentCheckedBranches.length}</strong> из {branchStats.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsBranchPopoverOpen(false)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl cursor-pointer transition-colors border border-slate-700"
                      >
                        Закрыть
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Section: Compact Consolidated Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0 ml-auto">
            {/* Discreet Undo Button */}
            {lastHistoryAction && onUndo && (
              <button
                onClick={onUndo}
                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/90 text-amber-900 border border-amber-300/90 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 group shrink-0"
                title={`Нажмите, чтобы отменить: ${lastHistoryAction.description}`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600 group-hover:-rotate-90 transition-transform shrink-0" />
                <span className="hidden md:inline text-slate-700">Отмена:</span>
                <span className="max-w-[80px] sm:max-w-[120px] truncate font-semibold text-amber-800">
                  {lastHistoryAction.description}
                </span>
              </button>
            )}

            {/* Consolidated 1C Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200 shrink-0" />
                <span className="hidden sm:inline">1С Переоценка</span>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-200" />
              </button>

              {isExportMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 text-white rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95"
                  onMouseLeave={() => setIsExportMenuOpen(false)}
                >
                  <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Экспорт переоценки 1С
                  </div>
                  <button
                    onClick={() => {
                      exportParacelsusRepriceXLSX(batches);
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 text-xs font-bold text-emerald-400 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Скачать Excel (.XLSX)</span>
                  </button>
                  <button
                    onClick={() => {
                      exportParacelsusRepriceCSV(batches);
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>Скачать 1С Парацельс (CSV)</span>
                  </button>
                  <div className="border-t border-slate-800 my-1" />
                  <button
                    onClick={() => {
                      setIsHelp1COpen(true);
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 text-[11px] font-semibold text-slate-400 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Инструкция по загрузке в 1С</span>
                  </button>
                </div>
              )}
            </div>

            {/* Accessibility UI Scale Controller */}
            <div className="relative">
              <button
                onClick={() => setIsScaleMenuOpen(!isScaleMenuOpen)}
                className={`px-2.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer border shadow-2xs shrink-0 ${
                  uiScale === 'xlarge' 
                    ? 'bg-amber-400 text-slate-950 border-amber-500 font-black ring-2 ring-amber-300' 
                    : uiScale === 'large'
                    ? 'bg-amber-100 text-amber-950 border-amber-300 font-extrabold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title="Регулировка размера шрифта и интерфейса (для разных возрастов и зрения)"
              >
                <Type className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="hidden lg:inline text-[11px]">
                  {uiScale === 'compact' && 'Шрифт: 90%'}
                  {uiScale === 'normal' && 'Шрифт: 100%'}
                  {uiScale === 'large' && 'Шрифт: 115%'}
                  {uiScale === 'xlarge' && 'Шрифт: 130%'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {isScaleMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 text-white rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1"
                  onMouseLeave={() => setIsScaleMenuOpen(false)}
                >
                  <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>Размер интерфейса и шрифта</span>
                  </div>

                  <button
                    onClick={() => { setUiScale('compact'); setIsScaleMenuOpen(false); }}
                    className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                      uiScale === 'compact' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-[11px]">🔍 Компактный (90%)</div>
                      <div className="text-[10px] opacity-80 font-normal">Для молодых, больше информации</div>
                    </div>
                    {uiScale === 'compact' && <span className="text-xs">✓</span>}
                  </button>

                  <button
                    onClick={() => { setUiScale('normal'); setIsScaleMenuOpen(false); }}
                    className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                      uiScale === 'normal' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-xs">📱 Стандартный (100%)</div>
                      <div className="text-[10px] opacity-80 font-normal">Оптимальный для большинства</div>
                    </div>
                    {uiScale === 'normal' && <span className="text-xs">✓</span>}
                  </button>

                  <button
                    onClick={() => { setUiScale('large'); setIsScaleMenuOpen(false); }}
                    className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                      uiScale === 'large' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-black text-xs">👁️ Крупный (115%)</div>
                      <div className="text-[10px] opacity-80 font-normal">Повышенная читаемость</div>
                    </div>
                    {uiScale === 'large' && <span className="text-xs">✓</span>}
                  </button>

                  <button
                    onClick={() => { setUiScale('xlarge'); setIsScaleMenuOpen(false); }}
                    className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                      uiScale === 'xlarge' ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300' : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-black text-xs text-amber-300">👓 Максимальный (130%)</div>
                      <div className="text-[10px] opacity-80 font-normal">Для слабовидящих людей</div>
                    </div>
                    {uiScale === 'xlarge' && <span className="text-xs">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Database Reset Button */}
            <button
              onClick={onOpenResetModal}
              className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="База данных и сброс"
            >
              <Database className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="hidden xl:inline">База данных</span>
            </button>

            {/* Add New Batch Primary Button */}
            <button
              onClick={onOpenNewBatchModal}
              className="px-3 sm:px-4 py-2 rounded-xl bg-[#FFC107] hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3] shrink-0" />
              <span className="hidden sm:inline">Добавить партию</span>
              <span className="sm:hidden">Партия</span>
            </button>
          </div>
        </div>
      </header>

      {/* 1C Explanation Modal */}
      <Help1CModal
        isOpen={isHelp1COpen}
        onClose={() => setIsHelp1COpen(false)}
      />
    </>
  );
};


