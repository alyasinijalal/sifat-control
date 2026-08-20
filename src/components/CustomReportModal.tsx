import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  FileCode, 
  Download, 
  Printer, 
  Filter, 
  Check, 
  Building2, 
  Tag, 
  ShieldAlert, 
  Search, 
  Truck,
  Layers,
  Sparkles,
  Info,
  CheckSquare,
  Square,
  RotateCcw
} from 'lucide-react';
import { MedicationBatch, CommissionMember, BranchInfo, CategoryType, SalesVelocityRank } from '../types';
import { 
  exportBatchesToExcelXLSX, 
  exportParacelsus1CXmlReprice, 
  exportParacelsus1CXmlQuarantine, 
  exportParacelsusRepriceCSV, 
  exportActToExcelXLSX,
  exportParacelsusRepriceXLSX
} from '../utils/exportUtils';
import { formatCurrencyTJS, CATEGORIES_CONFIG, getSalesVelocityInfo, isDisposalBranch } from '../utils/categoryUtils';

interface CustomReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: MedicationBatch[];
  branches?: BranchInfo[];
  commissionMembers?: CommissionMember[];
  initialCategory?: string;
  initialBranch?: string;
}

export const CustomReportModal: React.FC<CustomReportModalProps> = ({
  isOpen,
  onClose,
  batches = [],
  branches = [],
  commissionMembers = [],
  initialCategory = 'ALL',
  initialBranch = 'ALL',
}) => {
  // Extract unique suppliers from batches
  const availableSuppliers = useMemo(() => {
    const set = new Set<string>();
    batches.forEach(b => {
      if (b && b.supplier) set.add(b.supplier.trim());
    });
    return Array.from(set).filter(Boolean).sort();
  }, [batches]);

  // Extract unique branches from batches + branches prop
  const availableBranches = useMemo(() => {
    const set = new Set<string>();
    branches.forEach(br => {
      if (!br) return;
      if (br.nameRussian) set.add(br.nameRussian.trim());
      if (br.nameTajik) set.add(br.nameTajik.trim());
    });
    batches.forEach(b => {
      if (b && b.branch) set.add(b.branch.trim());
    });
    return Array.from(set).filter(Boolean).sort();
  }, [batches, branches]);

  // Multi-Select Filter States
  const [selectedCategories, setSelectedCategories] = useState<CategoryType[]>(
    initialCategory !== 'ALL' && ['A', 'B', 'C', 'D', 'E'].includes(initialCategory)
      ? [initialCategory as CategoryType]
      : ['A', 'B', 'C', 'D', 'E']
  );

  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [branchSearch, setBranchSearch] = useState<string>('');

  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    'ACTIVE', 'DISCOUNTED', 'PENDING', 'QUARANTINED', 'OVERDUE'
  ]);

  const [selectedVelocityRanks, setSelectedVelocityRanks] = useState<SalesVelocityRank[]>([
    'FAST', 'MEDIUM', 'SLOW', 'DEAD_STOCK'
  ]);

  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [supplierSearch, setSupplierSearch] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [reportTitle, setReportTitle] = useState<string>('Отчет по запасам и срокам FEFO');
  const [exportOnlyDiscounted, setExportOnlyDiscounted] = useState<boolean>(false);

  // Sync initial branches & suppliers when modal opens or lists change
  useEffect(() => {
    if (availableBranches.length > 0 && selectedBranches.length === 0) {
      if (initialBranch && initialBranch !== 'ALL' && availableBranches.includes(initialBranch)) {
        setSelectedBranches([initialBranch]);
      } else {
        // Operational branches by default, excluding disposal
        const defaultOps = availableBranches.filter(b => !isDisposalBranch(b));
        setSelectedBranches(defaultOps.length > 0 ? defaultOps : [...availableBranches]);
      }
    }
  }, [availableBranches, isOpen, initialBranch]);

  useEffect(() => {
    if (availableSuppliers.length > 0 && selectedSuppliers.length === 0) {
      setSelectedSuppliers([...availableSuppliers]);
    }
  }, [availableSuppliers, isOpen]);

  // Handler helpers for Category
  const toggleCategory = (cat: CategoryType) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };
  const selectAllCategories = () => setSelectedCategories(['A', 'B', 'C', 'D', 'E']);
  const deselectAllCategories = () => setSelectedCategories([]);

  // Handler helpers for Branch
  const toggleBranch = (br: string) => {
    if (selectedBranches.includes(br)) {
      setSelectedBranches(selectedBranches.filter(b => b !== br));
    } else {
      setSelectedBranches([...selectedBranches, br]);
    }
  };
  const selectAllBranches = () => setSelectedBranches([...availableBranches]);
  const deselectAllBranches = () => setSelectedBranches([]);

  // Handler helpers for Status
  const toggleStatus = (st: string) => {
    if (selectedStatuses.includes(st)) {
      setSelectedStatuses(selectedStatuses.filter(s => s !== st));
    } else {
      setSelectedStatuses([...selectedStatuses, st]);
    }
  };
  const selectAllStatuses = () => setSelectedStatuses(['ACTIVE', 'DISCOUNTED', 'PENDING', 'QUARANTINED', 'OVERDUE']);
  const deselectAllStatuses = () => setSelectedStatuses([]);

  // Handler helpers for Sales Velocity
  const toggleVelocityRank = (rank: SalesVelocityRank) => {
    if (selectedVelocityRanks.includes(rank)) {
      setSelectedVelocityRanks(selectedVelocityRanks.filter(r => r !== rank));
    } else {
      setSelectedVelocityRanks([...selectedVelocityRanks, rank]);
    }
  };
  const selectAllVelocityRanks = () => setSelectedVelocityRanks(['FAST', 'MEDIUM', 'SLOW', 'DEAD_STOCK']);
  const deselectAllVelocityRanks = () => setSelectedVelocityRanks([]);

  // Handler helpers for Supplier
  const toggleSupplier = (sup: string) => {
    if (selectedSuppliers.includes(sup)) {
      setSelectedSuppliers(selectedSuppliers.filter(s => s !== sup));
    } else {
      setSelectedSuppliers([...selectedSuppliers, sup]);
    }
  };
  const selectAllSuppliers = () => setSelectedSuppliers([...availableSuppliers]);
  const deselectAllSuppliers = () => setSelectedSuppliers([]);

  // Global Select All / Reset All
  const handleSelectAllGlobal = () => {
    setSelectedCategories(['A', 'B', 'C', 'D', 'E']);
    setSelectedBranches([...availableBranches]);
    setSelectedStatuses(['ACTIVE', 'DISCOUNTED', 'PENDING', 'QUARANTINED', 'OVERDUE']);
    setSelectedVelocityRanks(['FAST', 'MEDIUM', 'SLOW', 'DEAD_STOCK']);
    setSelectedSuppliers([...availableSuppliers]);
    setSearchQuery('');
  };

  const handleResetAllGlobal = () => {
    setSelectedCategories([]);
    setSelectedBranches([]);
    setSelectedStatuses([]);
    setSelectedVelocityRanks([]);
    setSelectedSuppliers([]);
    setSearchQuery('');
  };

  // Filtered Batches Logic
  const filteredBatches = useMemo(() => {
    return batches.filter(b => {
      if (!b) return false;

      // 1. Category Filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(b.category)) {
        return false;
      }
      if (selectedCategories.length === 0) return false;

      // 2. Branch Filter
      if (selectedBranches.length > 0 && !selectedBranches.includes(b.branch)) {
        return false;
      }
      if (selectedBranches.length === 0) return false;

      // 3. Supplier Filter
      if (selectedSuppliers.length > 0 && !selectedSuppliers.includes(b.supplier)) {
        return false;
      }
      if (selectedSuppliers.length === 0) return false;

      // 4. Status Filter
      if (selectedStatuses.length > 0) {
        const disc = b.currentDiscount || 0;
        const days = b.daysRemaining || 0;
        const isQuar = b.isQuarantined || b.category === 'E';
        const isDisc = disc > 0 && !isQuar;
        const isPend = b.discountApprovalStatus === 'PENDING' && (b.proposedDiscount || 0) > 0 && !isQuar;
        const isOver = days <= 0 || isQuar;
        const isActive = !isQuar && !isDisc && !isPend && days > 0;

        let statusMatch = false;
        if (selectedStatuses.includes('ACTIVE') && isActive) statusMatch = true;
        if (selectedStatuses.includes('DISCOUNTED') && isDisc) statusMatch = true;
        if (selectedStatuses.includes('PENDING') && isPend) statusMatch = true;
        if (selectedStatuses.includes('QUARANTINED') && isQuar) statusMatch = true;
        if (selectedStatuses.includes('OVERDUE') && isOver) statusMatch = true;

        if (!statusMatch) return false;
      }
      if (selectedStatuses.length === 0) return false;

      // 5. Sales Velocity Filter
      if (selectedVelocityRanks.length > 0) {
        const velInfo = getSalesVelocityInfo(b);
        if (!selectedVelocityRanks.includes(velInfo.rank)) return false;
      }
      if (selectedVelocityRanks.length === 0) return false;

      // 6. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (b.productName || '').toLowerCase().includes(q);
        const matchesLot = (b.lotNumber || '').toLowerCase().includes(q);
        const matchesSupplier = (b.supplier || '').toLowerCase().includes(q);
        const matchesCode = (b.code1C || '').toLowerCase().includes(q);
        if (!matchesName && !matchesLot && !matchesSupplier && !matchesCode) return false;
      }

      return true;
    });
  }, [
    batches, 
    selectedCategories, 
    selectedBranches, 
    selectedSuppliers, 
    selectedStatuses, 
    selectedVelocityRanks,
    searchQuery
  ]);

  // Early return if modal is closed (MUST be placed after ALL React hooks)
  if (!isOpen) return null;

  // Aggregate Metrics
  const totalItems = filteredBatches.length;
  const totalPackages = filteredBatches.reduce((acc, b) => acc + (b.quantity || 0), 0);
  const totalRetailSum = filteredBatches.reduce((acc, b) => acc + ((b.discountedPrice || b.retailPrice || 0) * (b.quantity || 0)), 0);
  const totalPurchaseSum = filteredBatches.reduce((acc, b) => acc + ((b.purchasePrice || 0) * (b.quantity || 0)), 0);
  const totalDiscountSaved = filteredBatches.reduce((acc, b) => acc + (((b.retailPrice || 0) - (b.discountedPrice || b.retailPrice || 0)) * (b.quantity || 0)), 0);

  // Filtered branch list for search inside box
  const filteredAvailableBranches = availableBranches.filter(br => 
    br.toLowerCase().includes(branchSearch.toLowerCase().trim())
  );

  // Filtered supplier list for search inside box
  const filteredAvailableSuppliers = availableSuppliers.filter(sup => 
    sup.toLowerCase().includes(supplierSearch.toLowerCase().trim())
  );

  // Handle Export Actions
  const handleExportXLSX = () => {
    const filename = reportTitle.trim().replace(/\s+/g, '_') || 'FEFO_Custom_Report';
    exportBatchesToExcelXLSX(filteredBatches, filename);
  };

  const handleExport1CRepriceXLSX = () => {
    exportParacelsusRepriceXLSX(filteredBatches, exportOnlyDiscounted);
  };

  const handleExport1CRepriceXML = () => {
    exportParacelsus1CXmlReprice(filteredBatches, exportOnlyDiscounted);
  };

  const handleExport1CQuarantineXML = () => {
    exportParacelsus1CXmlQuarantine(filteredBatches);
  };

  const handleExportCSV = () => {
    exportParacelsusRepriceCSV(filteredBatches, exportOnlyDiscounted);
  };

  const handleExportPrintAct = () => {
    const actNumber = `FLT-${Date.now().toString().slice(-4)}`;
    const dateStr = new Date().toISOString().slice(0, 10);
    exportActToExcelXLSX(reportTitle, actNumber, dateStr, filteredBatches, commissionMembers);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Генератор отчетов и мульти-выгрузок FEFO</h2>
              <p className="text-xs text-slate-400 font-medium">Фильтрация с поддержкой галочек, выгрузка в 1С:Парацельс, Excel и ISO 9001</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAllGlobal}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              title="Поставить галочки на всех фильтрах"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Выделить всё</span>
            </button>
            <button
              onClick={handleResetAllGlobal}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Снять все галочки"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Сбросить всё</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto bg-slate-50/50">
          
          {/* Custom Report Title Input */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-2 shadow-2xs">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Название выгружаемого отчета / документа</span>
            </label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="Введите заголовок отчета..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* 1. Category FEFO Multi-Select */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-500" />
                    <span>1. Категории FEFO</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={selectAllCategories}
                      className="text-[11px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                    >
                      Все
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={deselectAllCategories}
                      className="text-[11px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Снять
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {(['A', 'B', 'C', 'D', 'E'] as CategoryType[]).map(cat => {
                    const isSelected = selectedCategories.includes(cat);
                    const cfg = CATEGORIES_CONFIG[cat];
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`w-full p-2.5 rounded-xl text-xs transition-all flex items-center justify-between border cursor-pointer ${
                          isSelected 
                            ? 'bg-amber-50/90 border-amber-300 shadow-2xs' 
                            : 'bg-slate-50/60 border-slate-200 opacity-60 hover:opacity-100 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
                          />
                          <span className={`px-2 py-0.5 rounded-md font-black text-[11px] ${cfg.badgeBg} ${cfg.badgeText}`}>
                            Cat {cat}
                          </span>
                          <span className={`text-xs ${isSelected ? 'font-black text-slate-900' : 'font-medium text-slate-500'}`}>
                            {cfg.monthHint}
                          </span>
                        </div>
                        <span className={`text-[10px] ${isSelected ? 'font-bold text-slate-700' : 'text-slate-400 font-medium'}`}>
                          {cat === 'A' ? 'Норма' : cat === 'E' ? 'Карантин' : `Скидка ${cfg.defaultDiscount}%`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. Branch / Warehouse Multi-Select */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>2. Склады и филиалы ({selectedBranches.length}/{availableBranches.length})</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={selectAllBranches}
                      className="text-[11px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                    >
                      Все
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={deselectAllBranches}
                      className="text-[11px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Снять
                    </button>
                  </div>
                </div>

                {/* Search branch */}
                {availableBranches.length > 4 && (
                  <input
                    type="text"
                    value={branchSearch}
                    onChange={(e) => setBranchSearch(e.target.value)}
                    placeholder="Поиск склада..."
                    className="w-full mb-2 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                )}

                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {filteredAvailableBranches.map(br => {
                    const isSelected = selectedBranches.includes(br);
                    return (
                      <label
                        key={br}
                        className={`w-full p-2 rounded-xl text-xs transition-all flex items-center gap-2 border cursor-pointer ${
                          isSelected 
                            ? 'bg-amber-50/80 border-amber-300 text-slate-950 font-black shadow-2xs' 
                            : 'bg-slate-50/60 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleBranch(br)}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
                        />
                        <span className="truncate text-[11px]">{br}</span>
                      </label>
                    );
                  })}
                  {filteredAvailableBranches.length === 0 && (
                    <div className="text-[11px] text-slate-400 p-2 text-center">Склад не найден</div>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Product Status Multi-Select */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                    <span>3. Статус товара</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={selectAllStatuses}
                      className="text-[11px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                    >
                      Все
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={deselectAllStatuses}
                      className="text-[11px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Снять
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {[
                    { key: 'ACTIVE', label: 'Активные (Обычная продажа)', dot: 'bg-emerald-500' },
                    { key: 'DISCOUNTED', label: 'Уцененные FEFO (>0%)', dot: 'bg-amber-500' },
                    { key: 'PENDING', label: 'Ожидают скидки (Pending)', dot: 'bg-blue-500' },
                    { key: 'QUARANTINED', label: 'Карантин (Списание / Cat E)', dot: 'bg-rose-500' },
                    { key: 'OVERDUE', label: 'Просроченные (<0 дней)', dot: 'bg-slate-700' },
                  ].map(st => {
                    const isSelected = selectedStatuses.includes(st.key);
                    return (
                      <label
                        key={st.key}
                        className={`w-full p-2 rounded-xl text-xs transition-all flex items-center gap-2 border cursor-pointer ${
                          isSelected 
                            ? 'bg-slate-100 border-slate-300 shadow-2xs' 
                            : 'bg-slate-50/60 border-slate-200 opacity-60 hover:opacity-100 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleStatus(st.key)}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
                        />
                        <span className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
                        <span className={`text-[11px] truncate ${isSelected ? 'text-slate-950 font-black' : 'text-slate-500 font-medium'}`}>
                          {st.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. Sales Velocity / Demand Rating Multi-Select */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>4. Продаваемость (Ходовость)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={selectAllVelocityRanks}
                      className="text-[11px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                    >
                      Все
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={deselectAllVelocityRanks}
                      className="text-[11px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Снять
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {[
                    { rank: 'FAST' as SalesVelocityRank, label: '⚡ Ходовые (>60% реализации)', badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
                    { rank: 'MEDIUM' as SalesVelocityRank, label: '⚖️ Средние (25–60% реализации)', badgeBg: 'bg-amber-100 text-amber-900 border-amber-300' },
                    { rank: 'SLOW' as SalesVelocityRank, label: '🐢 Низкая (1–25% реализации)', badgeBg: 'bg-orange-100 text-orange-900 border-orange-300' },
                    { rank: 'DEAD_STOCK' as SalesVelocityRank, label: '🛑 Неликвид (0% реализации)', badgeBg: 'bg-rose-100 text-rose-900 border-rose-300' },
                  ].map(v => {
                    const isSelected = selectedVelocityRanks.includes(v.rank);
                    return (
                      <label
                        key={v.rank}
                        className={`w-full p-2.5 rounded-xl text-xs transition-all flex items-center gap-2 border cursor-pointer ${
                          isSelected 
                            ? 'bg-amber-50/90 border-amber-300 shadow-2xs' 
                            : 'bg-slate-50/60 border-slate-200 opacity-60 hover:opacity-100 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleVelocityRank(v.rank)}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
                        />
                        <span className={`text-[11px] truncate ${isSelected ? 'text-slate-950 font-black' : 'text-slate-500 font-medium'}`}>
                          {v.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 5. Supplier Multi-Select */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-slate-500" />
                    <span>5. Поставщик ({selectedSuppliers.length}/{availableSuppliers.length})</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={selectAllSuppliers}
                      className="text-[11px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                    >
                      Все
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={deselectAllSuppliers}
                      className="text-[11px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Снять
                    </button>
                  </div>
                </div>

                {/* Search supplier */}
                {availableSuppliers.length > 4 && (
                  <input
                    type="text"
                    value={supplierSearch}
                    onChange={(e) => setSupplierSearch(e.target.value)}
                    placeholder="Поиск поставщика..."
                    className="w-full mb-2 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                )}

                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {filteredAvailableSuppliers.map(sup => {
                    const isSelected = selectedSuppliers.includes(sup);
                    return (
                      <label
                        key={sup}
                        className={`w-full p-2 rounded-xl text-xs transition-all flex items-center gap-2 border cursor-pointer ${
                          isSelected 
                            ? 'bg-amber-50/80 border-amber-300 text-slate-950 font-black shadow-2xs' 
                            : 'bg-slate-50/60 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSupplier(sup)}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
                        />
                        <span className="truncate text-[11px]">{sup}</span>
                      </label>
                    );
                  })}
                  {filteredAvailableSuppliers.length === 0 && (
                    <div className="text-[11px] text-slate-400 p-2 text-center">Поставщик не найден</div>
                  )}
                </div>
              </div>
            </div>

            {/* 6. Text Search Filter */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-2xs">
              <div>
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-500" />
                  <span>6. Текстовый поиск по реестру</span>
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Фильтрация по названию медикамента, серии LOT, коду 1С или поставщику
                </p>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Введите название или серию..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-rose-600 font-bold hover:underline self-start cursor-pointer"
                >
                  Очистить текстовый поиск
                </button>
              )}
            </div>

          </div>

          {/* Live Preview Summary Box */}
          <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>Результат фильтрации: Найдено {totalItems} позиций</span>
              </span>
              <span className="text-xs font-bold bg-amber-200 text-amber-950 px-3 py-1 rounded-full border border-amber-300">
                {totalPackages} упаковок всего
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-1">
              <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                <span className="text-slate-500 text-[11px] block font-medium">Позиций в отчете:</span>
                <span className="text-sm font-black text-slate-900 font-mono">{totalItems} шт.</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                <span className="text-slate-500 text-[11px] block font-medium">Общий объем:</span>
                <span className="text-sm font-black text-slate-900 font-mono">{totalPackages} уп.</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                <span className="text-slate-500 text-[11px] block font-medium">Сумма в рознице:</span>
                <span className="text-sm font-black text-emerald-600 font-mono">{formatCurrencyTJS(totalRetailSum)}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                <span className="text-slate-500 text-[11px] block font-medium">Себестоимость:</span>
                <span className="text-sm font-black text-slate-800 font-mono">{formatCurrencyTJS(totalPurchaseSum)}</span>
              </div>
            </div>

            {totalDiscountSaved > 0 && (
              <p className="text-xs text-emerald-800 bg-emerald-100 border border-emerald-300 p-2 rounded-xl font-bold flex items-center gap-1.5">
                <span>💡 В выбранные позиции входит уценка на общую сумму {formatCurrencyTJS(totalDiscountSaved)}</span>
              </p>
            )}
          </div>

          {/* Action Export Buttons */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 bg-slate-100 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Режим выгрузки файлов переоценки 1С:
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {exportOnlyDiscounted 
                    ? 'В файл попадут только товары с активной скидкой FEFO (>0%)' 
                    : `В файл попадут ВСЕ отфильтрованные остатки (${totalItems} позиций)`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExportOnlyDiscounted(false)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    !exportOnlyDiscounted
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  Все {totalItems} позиций
                </button>
                <button
                  type="button"
                  onClick={() => setExportOnlyDiscounted(true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    exportOnlyDiscounted
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  Только уцененные FEFO
                </button>
              </div>
            </div>

            {totalItems === 0 ? (
              <div className="p-4 bg-slate-100 rounded-xl text-center text-slate-500 text-xs font-medium border border-dashed border-slate-300">
                ⚠️ По выбранным галочкам фильтрации не найдено ни одной партии. Отметьте варианты галочками выше.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Excel Full */}
                <button
                  onClick={handleExportXLSX}
                  className="p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-sm transition-all cursor-pointer flex items-center gap-3 active:scale-98"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-black">Отчет Excel (.XLSX)</div>
                    <div className="text-[10px] text-emerald-100 font-medium">Закрепленная шапка + автофильтры</div>
                  </div>
                </button>

                {/* Excel 1C Reprice */}
                <button
                  onClick={handleExport1CRepriceXLSX}
                  className="p-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-2xl shadow-sm transition-all cursor-pointer flex items-center gap-3 active:scale-98"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5 text-amber-300" />
                  </div>
                  <div className="text-left">
                    <div className="font-black">1С Переоценка (.XLSX)</div>
                    <div className="text-[10px] text-emerald-100 font-medium">Таблица цен и уценки</div>
                  </div>
                </button>

                {/* 1C Reprice XML */}
                <button
                  onClick={handleExport1CRepriceXML}
                  className="p-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl shadow-sm transition-all cursor-pointer flex items-center gap-3 active:scale-98"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-950/10 flex items-center justify-center shrink-0">
                    <FileCode className="w-5 h-5 text-slate-950" />
                  </div>
                  <div className="text-left">
                    <div className="font-black">1С Переоценка (.XML)</div>
                    <div className="text-[10px] text-amber-950 font-medium">Формат 1С:Парацельс</div>
                  </div>
                </button>

                {/* 1C Quarantine XML */}
                <button
                  onClick={handleExport1CQuarantineXML}
                  className="p-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-2xl shadow-sm transition-all cursor-pointer flex items-center gap-3 active:scale-98"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-black">1С Списание / Карантин (.XML)</div>
                    <div className="text-[10px] text-rose-100 font-medium">Акт изъятия просрочки</div>
                  </div>
                </button>

                {/* CSV Table */}
                <button
                  onClick={handleExportCSV}
                  className="p-3.5 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs rounded-2xl shadow-sm transition-all cursor-pointer flex items-center gap-3 active:scale-98"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-black">Таблица CSV для 1С</div>
                    <div className="text-[10px] text-slate-300 font-medium">Разделитель ; + UTF-8 BOM</div>
                  </div>
                </button>

                {/* Official Printable Act */}
                <button
                  onClick={handleExportPrintAct}
                  className="p-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl shadow-sm transition-all cursor-pointer flex items-center gap-3 active:scale-98 sm:col-span-2 lg:col-span-1"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-black">Акт комиссии ISO 9001 (.XLSX)</div>
                    <div className="text-[10px] text-indigo-100 font-medium">С шапкой и подписями</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Info className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Экспортируется строго {totalItems} отфильтрованных партий</span>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
};
