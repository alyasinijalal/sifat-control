import React, { useState } from 'react';
import { 
  Search, 
  Pill, 
  ShieldAlert, 
  Tag, 
  FileSpreadsheet, 
  AlertTriangle,
  CheckCircle2,
  Edit,
  Grid,
  List,
  Download,
  Clock,
  Calendar,
  User,
  ArrowRightLeft,
  FileCode,
  Filter
} from 'lucide-react';
import { MedicationBatch, CategoryType, BranchInfo, CommissionMember } from '../types';
import { CATEGORIES_CONFIG, formatCurrencyTJS, formatDateDDMMYYYY, getSalesVelocityInfo } from '../utils/categoryUtils';
import { BRANCHES_LIST } from '../data/initialData';
import { 
  exportParacelsusRepriceCSV, 
  exportParacelsusRepriceXLSX,
  exportBatchesToExcelXLSX,
  exportParacelsus1CXmlReprice 
} from '../utils/exportUtils';
import { CustomReportModal } from './CustomReportModal';

interface InventoryViewProps {
  batches: MedicationBatch[];
  branches?: BranchInfo[];
  commissionMembers?: CommissionMember[];
  initialCategoryFilter?: CategoryType | 'ALL';
  onUpdateBatchDiscount: (batchId: string, newDiscount: number) => void;
  onApproveDiscount?: (batchId: string, customDiscount?: number) => void;
  onApproveAllDiscounts?: () => void;
  onRejectDiscount?: (batchId: string) => void;
  onMoveToQuarantine: (batchId: string) => void;
  onEditBatch: (batch: MedicationBatch) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  batches,
  branches = [],
  commissionMembers = [],
  initialCategoryFilter = 'ALL',
  onUpdateBatchDiscount,
  onApproveDiscount,
  onApproveAllDiscounts,
  onRejectDiscount,
  onMoveToQuarantine,
  onEditBatch,
}) => {
  const [isCustomReportOpen, setIsCustomReportOpen] = useState(false);
  const [searchTerm, setSearchText] = useState('');
  
  // Multi-select filters state
  const [selectedCategories, setSelectedCategories] = useState<CategoryType[]>(
    initialCategoryFilter !== 'ALL' ? [initialCategoryFilter] : []
  );
  const [selectedBranches, setSelectedBranchesFilter] = useState<string[]>([]);
  const [selectedDiscounts, setSelectedDiscounts] = useState<number[]>([]);

  // Sorting state
  const [sortField, setSortField] = useState<
    'productName' | 'expiryDate' | 'daysRemaining' | 'quantity' | 'discountedPrice' | 'retailPrice' | 'category' | 'currentDiscount' | 'lotNumber'
  >('daysRemaining');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showFullColumns, setShowFullColumns] = useState<boolean>(true);

  // Pagination state for handling 40,000+ rows lightning fast
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Discount modal state
  const [selectedBatchForDiscount, setSelectedBatchForDiscount] = useState<MedicationBatch | null>(null);
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Dynamic branch list combining preset list and branches present in batches
  const availableBranchNames = React.useMemo(() => {
    const fromBatches = Array.from(new Set(batches.map(b => b.branch).filter(Boolean)));
    const fromList = BRANCHES_LIST.map(b => b.nameRussian);
    return Array.from(new Set([...fromList, ...fromBatches]));
  }, [batches]);

  // Multi-select toggle helpers
  const toggleCategoryFilter = (cat: CategoryType) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleBranchFilter = (bName: string) => {
    setSelectedBranchesFilter(prev =>
      prev.includes(bName) ? prev.filter(b => b !== bName) : [...prev, bName]
    );
  };

  const toggleDiscountFilter = (disc: number) => {
    setSelectedDiscounts(prev =>
      prev.includes(disc) ? prev.filter(d => d !== disc) : [...prev, disc]
    );
  };

  const resetAllFilters = () => {
    setSelectedCategories([]);
    setSelectedBranchesFilter([]);
    setSelectedDiscounts([]);
    setSearchText('');
  };

  const handleSortColumn = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter & Sort logic with memoization
  const filteredBatches = React.useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();
    const filtered = batches.filter(b => {
      const matchesSearch = !searchLower || 
        b.productName.toLowerCase().includes(searchLower) ||
        b.lotNumber.toLowerCase().includes(searchLower) ||
        b.supplier.toLowerCase().includes(searchLower) ||
        (b.manufacturer && b.manufacturer.toLowerCase().includes(searchLower));

      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(b.category);
      const matchesBranch = selectedBranches.length === 0 || selectedBranches.includes(b.branch);
      const matchesDiscount = selectedDiscounts.length === 0 || selectedDiscounts.includes(b.currentDiscount);

      return matchesSearch && matchesCategory && matchesBranch && matchesDiscount;
    });

    return [...filtered].sort((a, b) => {
      let comp = 0;
      switch (sortField) {
        case 'productName': {
          const pA = a.productName || '';
          const pB = b.productName || '';
          comp = pA > pB ? 1 : pA < pB ? -1 : 0;
          break;
        }
        case 'expiryDate':
        case 'daysRemaining':
          comp = a.daysRemaining - b.daysRemaining;
          break;
        case 'quantity':
          comp = a.quantity - b.quantity;
          break;
        case 'discountedPrice':
          comp = (a.discountedPrice * a.quantity) - (b.discountedPrice * b.quantity);
          break;
        case 'retailPrice':
          comp = (a.retailPrice * a.quantity) - (b.retailPrice * b.quantity);
          break;
        case 'category':
          comp = (a.category > b.category ? 1 : a.category < b.category ? -1 : 0);
          break;
        case 'currentDiscount':
          comp = a.currentDiscount - b.currentDiscount;
          break;
        case 'lotNumber': {
          const lA = a.lotNumber || '';
          const lB = b.lotNumber || '';
          comp = lA > lB ? 1 : lA < lB ? -1 : 0;
          break;
        }
        default:
          comp = 0;
      }
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [batches, searchTerm, selectedCategories, selectedBranches, selectedDiscounts, sortField, sortOrder]);

  // Reset to page 1 on filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategories, selectedBranches, selectedDiscounts, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredBatches.length / pageSize));
  const paginatedBatches = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBatches.slice(start, start + pageSize);
  }, [filteredBatches, currentPage, pageSize]);

  const handleOpenDiscountModal = (batch: MedicationBatch) => {
    setSelectedBatchForDiscount(batch);
    setDiscountValue(batch.currentDiscount);
  };

  const handleApplyDiscount = () => {
    if (selectedBatchForDiscount) {
      onUpdateBatchDiscount(selectedBatchForDiscount.id, discountValue);
      setSelectedBatchForDiscount(null);
    }
  };

  const renderPaginationControls = () => (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs my-2">
      <div className="flex items-center gap-2">
        <span>Показано:</span>
        <span className="font-bold text-slate-900 font-mono">
          {filteredBatches.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} - {Math.min(filteredBatches.length, currentPage * pageSize)}
        </span>
        <span>из <strong className="text-slate-900 font-mono">{filteredBatches.length}</strong> партий</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-slate-500">На страницу:</span>
          <select 
            value={pageSize} 
            onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer text-xs"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
            <option value={500}>500</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="px-3 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 disabled:opacity-40 hover:bg-slate-100 cursor-pointer shadow-2xs transition-all text-xs"
          >
            ← Назад
          </button>
          <span className="font-bold text-slate-900 px-2 font-mono text-xs">
            {currentPage} / {totalPages}
          </span>
          <button 
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="px-3 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 disabled:opacity-40 hover:bg-slate-100 cursor-pointer shadow-2xs transition-all text-xs"
          >
            Вперед →
          </button>
        </div>
      </div>
    </div>
  );

  // Count pending discounts requiring operator approval
  const pendingDiscountsCount = React.useMemo(() => {
    return batches.filter(b => b.discountApprovalStatus === 'PENDING' && (b.proposedDiscount || 0) > 0).length;
  }, [batches]);

  return (
    <div className="space-y-6 w-full">
      {/* Operator Discount Approval Rule Banner */}
      {pendingDiscountsCount > 0 && (
        <div className="p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl flex items-center justify-between gap-4 flex-wrap text-xs shadow-2xs">
          <div className="flex items-center gap-3 font-bold text-amber-950 min-w-[280px] flex-1">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0 shadow-2xs text-lg">
              ⚡
            </div>
            <div>
              <div className="text-sm font-black text-slate-950 flex items-center gap-2">
                <span>Правило Цифрового Реестра: Найдено {pendingDiscountsCount} предложенных скидок FEFO</span>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-950 font-extrabold rounded-md text-[10px] border border-amber-300">
                  ТРЕБУЕТСЯ УТВЕРЖДЕНИЕ ОПЕРАТОРА
                </span>
              </div>
              <p className="text-slate-700 font-medium text-xs mt-0.5">
                Алгоритм FEFO рассчитал скидки для партий Cat B/C/D. Согласно регламенту, скидка автоматически <strong>не применяется</strong> до утверждения оператором.
              </p>
            </div>
          </div>
          {onApproveAllDiscounts && (
            <button
              onClick={() => onApproveAllDiscounts()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-2 shrink-0 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Утвердить все {pendingDiscountsCount} скидок в 1 клик</span>
            </button>
          )}
        </div>
      )}

      {/* Header Controls & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Реестр партий медикаментов</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                {filteredBatches.length} партий
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Партионный учет FEFO и применение скидок в соответствии с Положением
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Table / Cards / Full 11 Columns Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Режим таблицы"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Режим карточек"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setShowFullColumns(!showFullColumns)}
              className={`px-3 py-1.5 font-black text-xs rounded-lg shadow-2xs transition-all cursor-pointer border flex items-center gap-1.5 ${
                showFullColumns 
                  ? 'bg-amber-400 text-slate-950 border-amber-500' 
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
              title="Показать / скрыть все 11 колонок исходного файла 1С:Парацельс"
            >
              <span>{showFullColumns ? '✓ Все 11 колонок 1С' : 'Показать 11 колонок 1С'}</span>
            </button>

            {/* Custom Filtered Export Generator */}
            <button
              onClick={() => setIsCustomReportOpen(true)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer border border-slate-800 transition-all active:scale-95"
              title="Настраиваемая выгрузка отчетов по фильтрам: категориям, складам, срокам и поставщикам"
            >
              <Filter className="w-4 h-4 text-amber-400" />
              <span>Выгрузка по фильтрам</span>
            </button>

            {/* 1C Paracelsus XML Reprice */}
            <button
              onClick={() => exportParacelsus1CXmlReprice(filteredBatches)}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer border border-amber-500"
              title="Выгрузить документ Переоценки со скидками напрямую для 1С:Парацельс"
            >
              <FileCode className="w-4 h-4 text-slate-950" />
              <span>1С Переоценка (.XML)</span>
            </button>

            {/* 1C Paracelsus XLSX */}
            <button
              onClick={() => exportParacelsusRepriceXLSX(filteredBatches)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="Скачать переоценку 1С в Excel (.xlsx) с авто-шириной колонок без '###'"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
              <span>1С Переоценка (.XLSX)</span>
            </button>

            {/* CSV 1C Paracelsus */}
            <button
              onClick={() => exportParacelsusRepriceCSV(filteredBatches)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>1С (CSV)</span>
            </button>

            {/* Native Excel (.xlsx) Download */}
            <button
              onClick={() => exportBatchesToExcelXLSX(filteredBatches, 'Реестр_FEFO')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Filter Inputs & Multi-Select Bar */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search Box */}
            <div className="relative md:col-span-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Поиск по названию, серии LOT, поставщику..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-400 text-slate-900 shadow-2xs"
              />
            </div>

            {/* Sorting Controls */}
            <div className="flex items-center gap-2 md:col-span-2">
              <span className="text-xs font-extrabold text-slate-700 shrink-0">Сортировка:</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as any)}
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs rounded-xl p-2 focus:outline-none focus:border-amber-400 cursor-pointer shadow-2xs"
              >
                <option value="daysRemaining">Срок годности / Оставшиеся дни</option>
                <option value="productName">Наименование препарата (А-Я)</option>
                <option value="quantity">Количество остатка (упак)</option>
                <option value="discountedPrice">Сумма со скидкой (ТJS)</option>
                <option value="retailPrice">Сумма розничная (ТJS)</option>
                <option value="category">Категория риска FEFO (A ➔ E)</option>
                <option value="currentDiscount">Размер скидки (%)</option>
                <option value="lotNumber">Номер серии / Лота</option>
              </select>

              <button
                type="button"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold text-xs rounded-xl border border-slate-200 shadow-2xs cursor-pointer flex items-center gap-1 shrink-0"
                title="Переключить направление сортировки"
              >
                <span>{sortOrder === 'asc' ? '↑ Возрастание' : '↓ Убывание'}</span>
              </button>

              {(selectedCategories.length > 0 || selectedBranches.length > 0 || selectedDiscounts.length > 0 || searchTerm) && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 cursor-pointer shrink-0 transition-all"
                  title="Сбросить все выбранные фильтры"
                >
                  Сбросить фильтры
                </button>
              )}
            </div>
          </div>

          {/* Multi-Select Category Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
              Категории FEFO (Мультивыбор):
            </span>
            {(['A', 'B', 'C', 'D', 'E'] as CategoryType[]).map(cat => {
              const active = selectedCategories.includes(cat);
              const cfg = CATEGORIES_CONFIG[cat];
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                    active 
                      ? `${cfg.badgeBg} ${cfg.badgeText} ring-2 ring-amber-400 font-black shadow-xs` 
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => {}}
                    className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-amber-400 accent-amber-400 cursor-pointer"
                  />
                  <span>Cat {cat}</span>
                  <span className="text-[10px] opacity-80 font-normal hidden sm:inline">({cfg.labelRussian})</span>
                </button>
              );
            })}
          </div>

          {/* Multi-Select Discounts & Branches */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
              Скидки (Мультивыбор):
            </span>
            {[0, 15, 30, 50].map(disc => {
              const active = selectedDiscounts.includes(disc);
              return (
                <button
                  key={disc}
                  type="button"
                  onClick={() => toggleDiscountFilter(disc)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                    active
                      ? 'bg-amber-400 text-slate-950 border-amber-500 font-black shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => {}}
                    className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-amber-400 accent-amber-400 cursor-pointer"
                  />
                  <span>{disc === 0 ? 'Без скидки (0%)' : `Скидка -${disc}%`}</span>
                </button>
              );
            })}

            {availableBranchNames.length > 0 && (
              <div className="flex items-center gap-1.5 ml-auto flex-wrap">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider shrink-0">
                  Филиалы ({selectedBranches.length > 0 ? selectedBranches.length : 'Все'}):
                </span>
                <div className="flex items-center gap-1 overflow-x-auto max-w-md py-1 custom-scrollbar">
                  {availableBranchNames.slice(0, 6).map(bName => {
                    const active = selectedBranches.includes(bName);
                    return (
                      <button
                        key={bName}
                        type="button"
                        onClick={() => toggleBranchFilter(bName)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer border shrink-0 whitespace-nowrap ${
                          active 
                            ? 'bg-slate-900 text-amber-400 border-slate-900 font-black' 
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {bName.split(' ')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Pagination Bar */}
      {filteredBatches.length > 0 && renderPaginationControls()}

      {/* Main Batches List View */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wide border-b border-slate-200">
                <tr>
                  {showFullColumns && <th className="py-2.5 px-2.5 text-center">№</th>}
                  <th className="py-2.5 px-3">Препарат / Инфо</th>
                  <th className="py-2.5 px-3">Серия / LOT</th>
                  <th className="py-2.5 px-3">Срок действия</th>
                  {showFullColumns && <th className="py-2.5 px-3">Дата поставки</th>}
                  {showFullColumns && <th className="py-2.5 px-3 text-right">Цена прихода</th>}
                  <th className="py-2.5 px-3 text-right">Розничная цена</th>
                  {showFullColumns && <th className="py-2.5 px-3 text-center">Наценка %</th>}
                  <th className="py-2.5 px-3 text-center">Скидка % / Нов. цена</th>
                  <th className="py-2.5 px-3 text-right">Наличие (Остаток)</th>
                  {showFullColumns && <th className="py-2.5 px-3 text-right">Ко-во прихода</th>}
                  <th className="py-2.5 px-3">Филиал / Склад</th>
                  {showFullColumns && <th className="py-2.5 px-3">Производитель</th>}
                  {showFullColumns && <th className="py-2.5 px-3">Поставщик</th>}
                  <th className="py-2.5 px-3 text-center">Категория FEFO</th>
                  <th className="py-2.5 px-3 text-center">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                {paginatedBatches.map((batch, rowIdx) => {
                  const catConfig = CATEGORIES_CONFIG[batch.category];
                  const marginPct = batch.retailPrice > 0 
                    ? (((batch.retailPrice - batch.purchasePrice) / batch.retailPrice) * 100).toFixed(1)
                    : '0.0';

                  return (
                    <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                      {showFullColumns && (
                        <td className="py-2.5 px-2.5 text-center font-mono text-[10px] text-slate-400 font-bold">
                          {(currentPage - 1) * pageSize + rowIdx + 1}
                        </td>
                      )}

                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 text-xs leading-snug">
                          {batch.productName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 max-w-[210px] truncate">
                          <span className="truncate font-semibold text-slate-600" title={`Завод: ${batch.manufacturer || 'не определен'}`}>
                            {batch.manufacturer || batch.supplier}
                          </span>
                          {batch.isCosmetic && (
                            <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 font-bold text-[9px] rounded shrink-0">
                              PAO {batch.paoMonths || 12}M
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-mono font-bold text-xs text-slate-700 whitespace-nowrap">
                        <div>{batch.lotNumber}</div>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs font-mono">
                          {formatDateDDMMYYYY(batch.expiryDate)}
                        </div>
                        <div className={`text-[10px] font-bold ${
                          batch.daysRemaining <= 0 ? 'text-rose-600 font-black' : batch.daysRemaining <= 30 ? 'text-rose-500' : 'text-slate-500'
                        }`}>
                          {batch.daysRemaining > 0 
                            ? `Ост: ${batch.daysRemaining} дн.` 
                            : 'Срок истек!'}
                        </div>
                      </td>

                      {showFullColumns && (
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                          {batch.deliveryDate ? formatDateDDMMYYYY(batch.deliveryDate) : '—'}
                        </td>
                      )}

                      {showFullColumns && (
                        <td className="py-2.5 px-3 text-right font-bold text-slate-700 font-mono whitespace-nowrap">
                          {batch.purchasePrice > 0 ? formatCurrencyTJS(batch.purchasePrice) : '—'}
                        </td>
                      )}

                      <td className="py-2.5 px-3 text-right font-semibold text-slate-900 font-mono text-xs whitespace-nowrap">
                        {formatCurrencyTJS(batch.retailPrice)}
                      </td>

                      {showFullColumns && (
                        <td className="py-2.5 px-3 text-center font-mono whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                            Number(marginPct) >= 20 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            +{marginPct}%
                          </span>
                        </td>
                      )}

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {batch.currentDiscount > 0 ? (
                          <div className="space-y-0.5">
                            <span className="px-1.5 py-0.5 bg-emerald-500 text-white font-black rounded text-[10px] inline-flex items-center gap-1 shadow-2xs">
                              ✓ -{batch.currentDiscount}%
                            </span>
                            <div className="font-black text-slate-900 font-mono text-[11px]">
                              {formatCurrencyTJS(batch.discountedPrice)}
                            </div>
                          </div>
                        ) : batch.discountApprovalStatus === 'PENDING' && (batch.proposedDiscount || 0) > 0 ? (
                          <div className="space-y-1 my-0.5">
                            <div className="px-1.5 py-0.5 bg-amber-100 text-amber-950 border border-amber-300 font-black rounded text-[10px] inline-flex items-center gap-1" title="Предложена уценка по алгоритму FEFO. Требуется утверждение оператора!">
                              ⚡ Предложено: -{batch.proposedDiscount}%
                            </div>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => onApproveDiscount ? onApproveDiscount(batch.id, batch.proposedDiscount) : onUpdateBatchDiscount(batch.id, batch.proposedDiscount || 20)}
                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded text-[10px] transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                                title="Утвердить скидку и переоценить товар"
                              >
                                ✓ Утвердить
                              </button>
                              {onRejectDiscount && (
                                <button
                                  onClick={() => onRejectDiscount(batch.id)}
                                  className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded text-[10px] transition-all cursor-pointer"
                                  title="Отклонить скидку (оставить полную розничную цену)"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-mono">0% ({formatCurrencyTJS(batch.retailPrice)})</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right font-black text-slate-900 text-xs whitespace-nowrap font-mono">
                        <div>{batch.quantity} {batch.unit}</div>
                      </td>

                      {showFullColumns && (
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-500 text-xs whitespace-nowrap font-mono">
                          {batch.initialQuantity || batch.quantity} {batch.unit}
                        </td>
                      )}

                      <td className="py-2.5 px-3 text-slate-700 text-[11px] max-w-[150px] truncate" title={batch.branch}>
                        {batch.branch}
                      </td>

                      {showFullColumns && (
                        <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-[140px] truncate" title={batch.manufacturer || 'не определен'}>
                          {batch.manufacturer || '—'}
                        </td>
                      )}

                      {showFullColumns && (
                        <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-[140px] truncate" title={batch.supplier || '—'}>
                          {batch.supplier || '—'}
                        </td>
                      )}

                      <td className="py-2.5 px-3 whitespace-nowrap text-center space-y-1">
                        <div>
                          <span 
                            title={`Категория ${batch.category}: ${catConfig.labelRussian}`}
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide whitespace-nowrap shadow-2xs ${catConfig.badgeBg} ${catConfig.badgeText}`}
                          >
                            Cat {batch.category}
                          </span>
                        </div>
                        {(() => {
                          const velInfo = getSalesVelocityInfo(batch);
                          return (
                            <div title={`Процент реализации со склада: ${velInfo.sellThrough}%`}>
                              <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] border font-bold ${velInfo.badgeBg} ${velInfo.badgeText}`}>
                                {velInfo.shortLabel}
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenDiscountModal(batch)}
                            className="p-1.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold transition-all cursor-pointer"
                            title="Назначить скидку"
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditBatch(batch)}
                            className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                            title="Редактировать"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {batch.category === 'E' || batch.isQuarantined ? (
                            <button
                              onClick={() => onMoveToQuarantine(batch.id)}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-[10px] transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Передать в изолированный карантин"
                            >
                              <ShieldAlert className="w-3 h-3" />
                              <span>В карантин</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => onMoveToQuarantine(batch.id)}
                              className="p-1.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 transition-all cursor-pointer"
                              title="Передать в карантин"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedBatches.map((batch) => {
            const catConfig = CATEGORIES_CONFIG[batch.category];
            return (
              <div key={batch.id} className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm leading-tight">
                      {batch.productName}
                    </h3>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {batch.supplier} • LOT: <span className="font-mono text-slate-800 font-bold">{batch.lotNumber}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${catConfig.badgeBg} ${catConfig.badgeText}`}>
                    Cat {batch.category}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Срок годности:</span>
                    <span className="font-bold text-slate-900">{batch.expiryDate}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Остаток:</span>
                    <span className="font-black text-slate-900">{batch.quantity} {batch.unit}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Цена:</span>
                    <span className="font-black text-slate-900 text-sm">
                      {formatCurrencyTJS(batch.discountedPrice)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenDiscountModal(batch)}
                      className="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded text-xs cursor-pointer"
                    >
                      Скидка {batch.currentDiscount}%
                    </button>
                  </div>
                </div>

                {/* Audit date footer on card */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Добав: {batch.createdDate || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>Изм: {batch.lastModifiedDate || '—'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Pagination Bar */}
      {filteredBatches.length > 0 && renderPaginationControls()}

      {/* Discount Configuration Modal */}
      {selectedBatchForDiscount && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-500" />
                <span>Назначение скидки (FEFO)</span>
              </div>
              <button
                onClick={() => setSelectedBatchForDiscount(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-900 text-sm">
                {selectedBatchForDiscount.productName}
              </div>
              <div className="text-slate-500 font-medium">
                Серия LOT: <span className="font-mono text-slate-800 font-bold">{selectedBatchForDiscount.lotNumber}</span> • Срок: <span className="font-bold text-slate-900">{formatDateDDMMYYYY(selectedBatchForDiscount.expiryDate)}</span>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                Базовая розничная цена: <span className="font-bold text-slate-900">{selectedBatchForDiscount.retailPrice.toFixed(2)} с.</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Выберите процент скидки:
              </label>
              <div className="flex items-center gap-2">
                {[0, 15, 20, 30, 50].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDiscountValue(val)}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      discountValue === val
                        ? 'bg-[#FFC107] text-slate-950 ring-2 ring-amber-400 shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-semibold space-y-2">
              <div className="flex justify-between items-center">
                <span>Новая розничная цена:</span>
                <span className="font-black text-amber-800 text-sm">
                  {(selectedBatchForDiscount.retailPrice * (1 - discountValue / 100)).toFixed(2)} с.
                </span>
              </div>
              <p className="text-[10px] text-slate-600 font-normal border-t border-amber-200/60 pt-1.5 leading-tight">
                <strong>⚡ Интеграция с 1С:</strong> После сохранения нажмите кнопку <strong>«1С Переоценка (.XML)»</strong> вверху реестра и загрузите файл в «1С:Парацельс» (раздел Переоценка) для обновления цен на кассах.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBatchForDiscount(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleApplyDiscount}
                className="px-4 py-2 bg-[#FFC107] hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl cursor-pointer shadow-md uppercase tracking-wider"
              >
                Сохранить скидку
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Filtered Export Generator Modal */}
      <CustomReportModal
        isOpen={isCustomReportOpen}
        onClose={() => setIsCustomReportOpen(false)}
        batches={batches}
        branches={branches}
        commissionMembers={commissionMembers}
      />
    </div>
  );
};
