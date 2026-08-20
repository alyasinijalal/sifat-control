import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Trash2, 
  RotateCcw, 
  FileSpreadsheet, 
  Printer, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  Clock,
  Calendar,
  User,
  FileCode,
  Search,
  Building2,
  HelpCircle,
  Truck,
  PackageX
} from 'lucide-react';
import { MedicationBatch, CommissionMember, UserProfile } from '../types';
import { 
  formatCurrencyTJS, 
  formatDateDDMMYYYY, 
  getTwoTierReturnPricing, 
  getBatchFinancialMetrics, 
  getBatchReturnPolicy,
  isWarehouseBranch, 
  isPharmacyBranch 
} from '../utils/categoryUtils';
import { exportActToExcelXLSX, exportParacelsus1CXmlQuarantine } from '../utils/exportUtils';
import { CompactTooltip } from './transfers/CompactTooltip';

interface QuarantineViewProps {
  batches: MedicationBatch[];
  commissionMembers: CommissionMember[];
  onWriteOffBatch: (batchId: string) => void;
  onReturnToSupplier: (batchId: string) => void;
  userProfile?: UserProfile;
}

export const QuarantineView: React.FC<QuarantineViewProps> = ({
  batches,
  commissionMembers,
  onWriteOffBatch,
  onReturnToSupplier,
  userProfile,
}) => {
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [showActModal, setShowActModal] = useState<boolean>(false);

  // Search & Branch / Location filters
  const [searchTerm, setSearchTerm] = useState('');
  const [facilityTypeFilter, setFacilityTypeFilter] = useState<'ALL' | 'WAREHOUSES' | 'PHARMACIES'>('ALL');
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'productName' | 'expiryDate' | 'quantity' | 'totalValue' | 'totalPurchaseValue' | 'branch'>('expiryDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Quarantined batches (Category E or isQuarantined)
  const allQuarantinedBatches = React.useMemo(() => {
    return batches.filter(b => b.category === 'E' || b.isQuarantined);
  }, [batches]);

  // Pagination State for instant responsiveness
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Segment statistics
  const warehouseBatches = React.useMemo(() => {
    return allQuarantinedBatches.filter(b => isWarehouseBranch(b.branch));
  }, [allQuarantinedBatches]);

  const pharmacyBatches = React.useMemo(() => {
    return allQuarantinedBatches.filter(b => isPharmacyBranch(b.branch));
  }, [allQuarantinedBatches]);

  // Extract available branch names
  const availableBranches = React.useMemo(() => {
    return Array.from(new Set(allQuarantinedBatches.map(b => b.branch).filter(Boolean)));
  }, [allQuarantinedBatches]);

  const toggleBranchFilter = (branchName: string) => {
    setSelectedBranches(prev => 
      prev.includes(branchName) ? prev.filter(b => b !== branchName) : [...prev, branchName]
    );
  };

  // Filter & sort quarantined list
  const filteredQuarantinedBatches = React.useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    const filtered = allQuarantinedBatches.filter(b => {
      const matchesSearch = !q || 
        b.productName.toLowerCase().includes(q) ||
        b.lotNumber.toLowerCase().includes(q) ||
        b.supplier.toLowerCase().includes(q);

      const matchesFacilityType = 
        facilityTypeFilter === 'ALL' ||
        (facilityTypeFilter === 'WAREHOUSES' && isWarehouseBranch(b.branch)) ||
        (facilityTypeFilter === 'PHARMACIES' && isPharmacyBranch(b.branch));

      const matchesBranch = selectedBranches.length === 0 || selectedBranches.includes(b.branch);
      return matchesSearch && matchesFacilityType && matchesBranch;
    });

    return [...filtered].sort((a, b) => {
      let comp = 0;
      const finA = getBatchFinancialMetrics(a);
      const finB = getBatchFinancialMetrics(b);

      switch (sortField) {
        case 'productName':
          comp = a.productName.localeCompare(b.productName, 'ru');
          break;
        case 'expiryDate':
          comp = a.daysRemaining - b.daysRemaining;
          break;
        case 'quantity':
          comp = a.quantity - b.quantity;
          break;
        case 'totalValue':
          comp = finA.totalRetailValue - finB.totalRetailValue;
          break;
        case 'totalPurchaseValue':
          comp = finA.totalPurchaseValue - finB.totalPurchaseValue;
          break;
        case 'branch':
          comp = a.branch.localeCompare(b.branch, 'ru');
          break;
        default:
          comp = 0;
      }
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [allQuarantinedBatches, searchTerm, facilityTypeFilter, selectedBranches, sortField, sortOrder]);

  // Aggregate dual-pricing calculations
  const totalRetailQuarantineValue = filteredQuarantinedBatches.reduce((acc, b) => {
    return acc + getBatchFinancialMetrics(b).totalRetailValue;
  }, 0);

  const totalPurchaseQuarantineValue = filteredQuarantinedBatches.reduce((acc, b) => {
    return acc + getBatchFinancialMetrics(b).totalPurchaseValue;
  }, 0);

  // Reset to page 1 on filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, facilityTypeFilter, selectedBranches, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredQuarantinedBatches.length / pageSize));
  const paginatedQuarantinedBatches = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuarantinedBatches.slice(start, start + pageSize);
  }, [filteredQuarantinedBatches, currentPage, pageSize]);

  const toggleSelectAll = () => {
    if (selectedBatchIds.length === filteredQuarantinedBatches.length) {
      setSelectedBatchIds([]);
    } else {
      setSelectedBatchIds(filteredQuarantinedBatches.map(b => b.id));
    }
  };

  const toggleSelectBatch = (id: string) => {
    if (selectedBatchIds.includes(id)) {
      setSelectedBatchIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedBatchIds(prev => [...prev, id]);
    }
  };

  const handleExportActExcel = () => {
    const selectedBatches = allQuarantinedBatches.filter(b => selectedBatchIds.includes(b.id));
    const targetList = selectedBatches.length > 0 ? selectedBatches : allQuarantinedBatches;
    exportActToExcelXLSX(
      'Акт списания и передачи в карантин',
      `QF-${Date.now().toString().slice(-4)}`,
      new Date().toISOString().slice(0, 10),
      targetList,
      commissionMembers,
      userProfile?.directorName
    );
  };

  return (
    <div className="space-y-6 w-full font-sans text-slate-800">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span>Зона карантина и утилизации (Категория E)</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 uppercase tracking-wider">
              GDP Блокировка
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Изолированные партии с истекшим сроком годности • Учет возвратов по регламенту сети
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportParacelsus1CXmlQuarantine(allQuarantinedBatches)}
            className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all border border-amber-500"
            title="Выгрузить документ Списания просрочки для 1С:Парацельс"
          >
            <FileCode className="w-4 h-4 text-slate-950" />
            <span>1С Акт Списания (.XML)</span>
          </button>

          <button
            onClick={handleExportActExcel}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Скачать Акт в Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Two-Tier Returns Policy Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 text-white rounded-2xl p-4 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[11px]">
              РЕГЛАМЕНТ ВОЗВРАТОВ
            </span>
            <h2 className="text-sm font-black text-white">
              Раздельный учет движения карантинных препаратов: Аптеки ↔ Центральный склад ↔ Поставщики
            </h2>
          </div>
          <CompactTooltip 
            title="Финансовый регламент возвратов"
            content="1. Из аптек возврат осуществляется исключительно на Центральный склад по РОЗНИЧНЫМ ценам (для корректного закрытия материальной ответственности зав. аптекой). 2. С Центрального склада возврат поставщику или списание в утиль проводится по ЗАКУПОЧНЫМ ценам (для отражения прямого ущерба баланса)."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs">
          <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700 space-y-1">
            <div className="font-extrabold text-amber-400 flex items-center gap-1.5 text-xs">
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>1. Возврат из аптеки на склад — по РОЗНИЧНОЙ цене</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Аптека не взаимодействует напрямую с поставщиками. Товар списывается с подотчета зав. аптекой по розничной стоимости и передается на склад.
            </p>
          </div>

          <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700 space-y-1">
            <div className="font-extrabold text-emerald-400 flex items-center gap-1.5 text-xs">
              <PackageX className="w-3.5 h-3.5 text-emerald-400" />
              <span>2. Возврат со склада / Списание — по ЗАКУПОЧНОЙ цене</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Центральный склад оформляет рекламацию поставщику или акт утилизации по себестоимости закупки для корректного бухгалтерского учета прямого ущерба.
            </p>
          </div>
        </div>
      </div>

      {/* Facility Type Segmentation Pills */}
      <div className="flex items-center gap-2 flex-wrap bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
        <span className="text-xs font-black text-slate-500 uppercase tracking-wider pl-2 shrink-0">
          Локация:
        </span>
        <button
          type="button"
          onClick={() => setFacilityTypeFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            facilityTypeFilter === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <span>🌐 Все объекты</span>
          <span className="px-1.5 py-0.2 rounded bg-white/20 text-[10px] font-mono">
            {allQuarantinedBatches.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFacilityTypeFilter('WAREHOUSES')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            facilityTypeFilter === 'WAREHOUSES'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>🏢 Центральные склады</span>
          <span className="px-1.5 py-0.2 rounded bg-amber-800 text-white text-[10px] font-mono">
            {warehouseBatches.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFacilityTypeFilter('PHARMACIES')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            facilityTypeFilter === 'PHARMACIES'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200'
          }`}
        >
          <span>🏥 Розничные аптеки</span>
          <span className="px-1.5 py-0.2 rounded bg-blue-800 text-white text-[10px] font-mono">
            {pharmacyBatches.length}
          </span>
        </button>
      </div>

      {/* Metric Cards Summary with Dual-Pricing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Count */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-2xs space-y-1.5">
          <div className="text-xs text-slate-500 font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1 text-rose-900 font-bold">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Партий в карантине</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-black">
              Cat E
            </span>
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono">
            {filteredQuarantinedBatches.length} шт.
          </div>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex justify-between font-medium">
            <span>Склады: <strong>{warehouseBatches.length}</strong></span>
            <span>Аптеки: <strong>{pharmacyBatches.length}</strong></span>
          </div>
        </div>

        {/* Metric 2: Retail Value to Write-off */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
          <div className="text-xs text-slate-500 font-semibold flex items-center justify-between">
            <span className="font-bold text-slate-800">Снятие с реализации</span>
            <CompactTooltip 
              title="Розничная оценка"
              content="Сумма снятия с розничной продажи и списания с материально ответственных лиц аптек."
            />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatCurrencyTJS(totalRetailQuarantineValue)}
          </div>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 font-medium">
            По ценам розничного прейскуранта
          </div>
        </div>

        {/* Metric 3: Direct Purchase Loss */}
        <div className="bg-white p-4 rounded-2xl border border-rose-300 bg-rose-50/20 shadow-2xs space-y-1.5">
          <div className="text-xs text-rose-900 font-bold flex items-center justify-between">
            <span>Прямой финансовый убыток</span>
            <CompactTooltip 
              title="Закупочная себестоимость"
              content="Фактический ущерб компании по себестоимости закупки (без учета розничной торговой наценки)."
            />
          </div>
          <div className="text-2xl font-black text-rose-700 font-mono">
            {formatCurrencyTJS(totalPurchaseQuarantineValue)}
          </div>
          <div className="text-[11px] text-rose-800 font-semibold pt-1 border-t border-rose-100 flex justify-between">
            <span>Себестоимость закупки</span>
            <span>{totalRetailQuarantineValue > 0 ? `${((totalPurchaseQuarantineValue / totalRetailQuarantineValue) * 100).toFixed(0)}% от розн.` : ''}</span>
          </div>
        </div>

        {/* Metric 4: Commission Status */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
          <div className="text-xs text-slate-500 font-semibold flex items-center justify-between">
            <span className="font-bold text-slate-800">Комиссия по списанию</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-black text-slate-900 mt-1">
            Комиссия утверждена
          </div>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 font-medium">
            4 эксперта (Приказ №{new Date().getFullYear()}/QF)
          </div>
        </div>
      </div>

      {/* Quarantine Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-4">
        {/* Controls & Filter Toolbar */}
        <div className="space-y-3 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedBatchIds.length > 0 && selectedBatchIds.length === filteredQuarantinedBatches.length}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
                <span>Выбрать все ({filteredQuarantinedBatches.length})</span>
              </button>
              {selectedBatchIds.length > 0 && (
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Выбрано: {selectedBatchIds.length}
                </span>
              )}
            </div>

        {/* Bulk Action Controls */}
        {selectedBatchIds.length > 0 && (() => {
          const selectedBatches = allQuarantinedBatches.filter(b => selectedBatchIds.includes(b.id));
          const selectedPharmacyBatches = selectedBatches.filter(b => !isWarehouseBranch(b.branch));
          const selectedWarehouseBatches = selectedBatches.filter(b => isWarehouseBranch(b.branch));
          
          const pharmacyRetailSum = selectedPharmacyBatches.reduce((acc, b) => acc + getBatchFinancialMetrics(b).totalRetailValue, 0);
          const warehousePurchaseSum = selectedWarehouseBatches.reduce((acc, b) => acc + getBatchFinancialMetrics(b).totalPurchaseValue, 0);

          return (
            <div className="p-3 bg-slate-900 text-white rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-xs font-black">
                  Выбрано: {selectedBatchIds.length}
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {selectedPharmacyBatches.length > 0 && `Аптеки: ${selectedPharmacyBatches.length} шт. (${formatCurrencyTJS(pharmacyRetailSum)} розн.) `}
                  {selectedWarehouseBatches.length > 0 && `• Склады: ${selectedWarehouseBatches.length} шт. (${formatCurrencyTJS(warehousePurchaseSum)} закуп.)`}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {selectedPharmacyBatches.length > 0 && (
                  <button
                    onClick={() => {
                      selectedPharmacyBatches.forEach(b => onReturnToSupplier(b.id));
                      setSelectedBatchIds([]);
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    title="Переместить выбранные аптечные партии на Центральный склад по розничной стоимости"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Возврат на склад из аптек ({selectedPharmacyBatches.length})</span>
                  </button>
                )}

                {selectedWarehouseBatches.length > 0 && (
                  <>
                    <button
                      onClick={() => {
                        selectedWarehouseBatches.forEach(b => onReturnToSupplier(b.id));
                        setSelectedBatchIds([]);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                      title="Оформить рекламацию поставщику со склада по закупочной стоимости"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Возврат поставщикам ({selectedWarehouseBatches.length})</span>
                    </button>

                    <button
                      onClick={() => {
                        selectedWarehouseBatches.forEach(b => onWriteOffBatch(b.id));
                        setSelectedBatchIds([]);
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                      title="Акт утилизации со склада по закупочной себестоимости"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Списать со склада ({selectedWarehouseBatches.length})</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })()}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск по названию, серии, поставщику..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-400 text-slate-900"
              />
            </div>

            {/* Sorting controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-600 shrink-0">Сортировка:</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as any)}
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs rounded-xl p-2 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="expiryDate">Срок годности</option>
                <option value="productName">Наименование препарата</option>
                <option value="quantity">Количество</option>
                <option value="totalValue">Розничная сумма (TJS)</option>
                <option value="totalPurchaseValue">Себестоимость ущерба (TJS)</option>
                <option value="branch">Филиал / Склад</option>
              </select>
              <button
                type="button"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold text-xs rounded-xl border border-slate-200 cursor-pointer shrink-0"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>

            {/* Branch Multi-Select Badges */}
            {availableBranches.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 sm:col-span-2 lg:col-span-1">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider shrink-0">
                  Филиалы:
                </span>
                {availableBranches.map(bName => {
                  const active = selectedBranches.includes(bName);
                  const isWh = isWarehouseBranch(bName);
                  return (
                    <button
                      key={bName}
                      type="button"
                      onClick={() => toggleBranchFilter(bName)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer border shrink-0 whitespace-nowrap ${
                        active 
                          ? 'bg-rose-600 text-white border-rose-700 font-black' 
                          : isWh
                          ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {isWh ? '🏢 ' : '🏥 '}{bName.split(' ')[0]}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quarantined List */}
        {filteredQuarantinedBatches.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <div className="text-base font-black text-slate-900">
              Зона карантина пуста или нет результатов по заданным фильтрам!
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Все партии находятся в норме или проверьте установленные параметры поиска.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-8"></th>
                  <th className="py-2.5 px-3">Наименование препарата / Серия</th>
                  <th className="py-2.5 px-3">Локация / Тип</th>
                  <th className="py-2.5 px-3">Срок годности</th>
                  <th className="py-2.5 px-3 text-right">Остаток</th>
                  <th className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span>Розница (TJS)</span>
                      <CompactTooltip 
                        title="Розничная цена" 
                        content="Цена за 1 уп. и общая розничная сумма для списания с подотчета аптеки"
                      />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span>Себестоимость / Убыток</span>
                      <CompactTooltip 
                        title="Закупочная себестоимость" 
                        content="Закупочная цена и прямой финансовый ущерб компании для возврата поставщику со склада"
                      />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center">Режим возврата / Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                {paginatedQuarantinedBatches.map((batch) => {
                  const isSelected = selectedBatchIds.includes(batch.id);
                  const fin = getBatchFinancialMetrics(batch);
                  const returnRules = getBatchReturnPolicy(batch);
                  const isWh = isWarehouseBranch(batch.branch);

                  return (
                    <tr key={batch.id} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-amber-50/60' : ''}`}>
                      <td className="py-2.5 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectBatch(batch.id)}
                          className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                        />
                      </td>

                      {/* Product Name & Lot */}
                      <td className="py-2.5 px-3">
                        <div className="font-black text-slate-900">{batch.productName}</div>
                        <div className="text-[11px] font-mono font-bold text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>Серия: {batch.lotNumber}</span>
                          <span className="text-slate-300">•</span>
                          <span>{batch.supplier}</span>
                        </div>
                      </td>

                      {/* Location Badge */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          {isWh ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-amber-700" />
                              <span>Склад (Хаб)</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-900 border border-blue-200 flex items-center gap-1">
                              <span>🏥 Аптека</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600 font-medium truncate max-w-[150px] mt-0.5" title={batch.branch}>
                          {batch.branch}
                        </div>
                      </td>

                      {/* Expiry */}
                      <td className="py-2.5 px-3 font-bold text-rose-600 font-mono whitespace-nowrap">
                        <div>{formatDateDDMMYYYY(batch.expiryDate)}</div>
                        <div className="text-[10px] text-rose-800 font-semibold">Истек ({Math.abs(batch.daysRemaining)} дн. назад)</div>
                      </td>

                      {/* Quantity */}
                      <td className="py-2.5 px-3 text-right font-black whitespace-nowrap">
                        {batch.quantity} {batch.unit}
                      </td>

                      {/* Retail Price & Total */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="font-black text-slate-900 font-mono">{formatCurrencyTJS(fin.totalRetailValue)}</div>
                        <div className="text-[10px] text-slate-500 font-semibold">{fin.retailUnitPrice.toFixed(2)} TJS/ед.</div>
                      </td>

                      {/* Purchase Cost & Direct Loss */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap bg-rose-50/30">
                        <div className="font-black text-rose-700 font-mono">{formatCurrencyTJS(fin.totalPurchaseValue)}</div>
                        <div className="text-[10px] text-rose-800 font-semibold">закуп: {fin.purchaseUnitPrice.toFixed(2)} TJS</div>
                      </td>

                      {/* Return Action Buttons according to Two-Tier Policy */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {returnRules.canReturnToWarehouse && (
                            <button
                              onClick={() => onReturnToSupplier(batch.id)}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                              title={`Возврат из аптеки на Центральный склад по розничной стоимости (${formatCurrencyTJS(fin.totalRetailValue)}) для передачи матответственности`}
                            >
                              <Truck className="w-3.5 h-3.5 text-slate-950" />
                              <span>На склад (розн)</span>
                            </button>
                          )}

                          {returnRules.canReturnToSupplier && (
                            <button
                              onClick={() => onReturnToSupplier(batch.id)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                              title={`Возврат поставщику «${batch.supplier}» со склада по закупочной цене (${formatCurrencyTJS(fin.totalPurchaseValue)})`}
                            >
                              <RotateCcw className="w-3 h-3 text-white" />
                              <span>Поставщику (закуп)</span>
                            </button>
                          )}

                          {returnRules.canWriteOffFromBranch && (
                            <button
                              onClick={() => onWriteOffBatch(batch.id)}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                              title={`Акт списания и утилизации комиссии со склада по закупочной себестоимости (${formatCurrencyTJS(fin.totalPurchaseValue)})`}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Списать в утиль</span>
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
        )}

        {/* Pagination Toolbar */}
        {filteredQuarantinedBatches.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <span>Показано:</span>
              <span className="font-bold text-slate-900">
                {Math.min(filteredQuarantinedBatches.length, (currentPage - 1) * pageSize + 1)} - {Math.min(filteredQuarantinedBatches.length, currentPage * pageSize)}
              </span>
              <span>из</span>
              <span className="font-bold text-slate-900">{filteredQuarantinedBatches.length}</span>
              <span>позиций</span>

              <div className="ml-3 flex items-center gap-1">
                <span>Строк:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-lg px-2 py-1 text-xs cursor-pointer focus:outline-none"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                  <option value={500}>500</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
              >
                ««
              </button>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
              >
                Назад
              </button>
              <span className="px-3 py-1 font-black text-slate-900 bg-slate-100 rounded-lg">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
              >
                Вперед
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
              >
                »»
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

