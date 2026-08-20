import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  ShieldAlert, 
  Pill, 
  Info, 
  ArrowUpRight, 
  Tag, 
  CheckCircle2,
  ChevronRight,
  Clock,
  PieChart as PieIcon,
  BarChart3,
  CalendarDays,
  Building2,
  Check,
  X,
  Filter,
  Search,
  ChevronDown,
  Trash2,
  Sparkles,
  Zap,
  Flame,
  Gauge,
  Award,
  Trophy,
  ShieldCheck,
  ArrowUpDown,
  HelpCircle,
  ExternalLink,
  Eye,
  ArrowRight,
  FileText,
  Layers,
  Activity,
  SlidersHorizontal,
  Store,
  Truck
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { MedicationBatch, CategoryType, BranchInfo, SalesVelocityRank } from '../types';
import { 
  formatCurrencyTJS, 
  formatDateDDMMYYYY, 
  isWrittenOffBatch, 
  getSalesVelocityInfo, 
  getDeterministicSellThrough,
  isWarehouseBranch,
  isPharmacyBranch,
  isStoreBranch,
  isDisposalBranch,
  getBatchFinancialMetrics
} from '../utils/categoryUtils';
import { CompactTooltip } from './transfers/CompactTooltip';

interface DashboardViewProps {
  batches: MedicationBatch[];
  branches?: BranchInfo[];
  selectedBranches?: string[];
  setSelectedBranches?: (branches: string[]) => void;
  selectedBranch?: string;
  setSelectedBranch?: (branch: string) => void;
  onNavigateTab: (tab: string, catFilter?: CategoryType) => void;
}

// High-contrast custom Tooltip for Expiry Forecast Chart
const CustomExpiryTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const purchaseVal = data.totalPurchaseVal || (data.totalVal * 0.72);
    const marginVal = data.totalVal - purchaseVal;

    return (
      <div className="bg-white text-slate-900 p-4 rounded-2xl border border-slate-200 shadow-2xl text-xs space-y-2.5 font-sans min-w-[280px] z-50">
        <div className="font-black text-amber-600 border-b border-slate-100 pb-1.5 flex items-center justify-between">
          <span className="text-sm">{label}</span>
          <span className="text-[10px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full font-mono font-bold">
            Партий: {data.count} шт.
          </span>
        </div>

        {/* Dual totals */}
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 space-y-1 text-[11px]">
          <div className="flex justify-between gap-3 text-slate-700">
            <span className="font-bold">Розничная стоимость:</span>
            <span className="font-extrabold text-slate-950 font-mono">{formatCurrencyTJS(data.totalVal)}</span>
          </div>
          <div className="flex justify-between gap-3 text-slate-500">
            <span>Себестоимость (закупка):</span>
            <span className="font-bold text-slate-800 font-mono">{formatCurrencyTJS(purchaseVal)}</span>
          </div>
          <div className="flex justify-between gap-3 text-emerald-700 pt-1 border-t border-slate-200/60">
            <span>Запас торговой маржи:</span>
            <span className="font-bold font-mono">+{formatCurrencyTJS(marginVal)}</span>
          </div>
        </div>

        <div className="space-y-1.5 text-[11px] pt-1">
          <div className="text-[10px] font-extrabold uppercase text-slate-400">По категориям FEFO:</div>
          {data.catD > 0 && (
            <div className="flex justify-between gap-3 text-rose-700">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block shrink-0" />
                Срок &lt;1 мес (Cat D/E):
              </span>
              <span className="font-bold font-mono">{formatCurrencyTJS(data.catD)}</span>
            </div>
          )}
          {data.catC > 0 && (
            <div className="flex justify-between gap-3 text-orange-700">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500 inline-block shrink-0" />
                Риск 1–3 мес (Cat C):
              </span>
              <span className="font-bold font-mono">{formatCurrencyTJS(data.catC)}</span>
            </div>
          )}
          {data.catB > 0 && (
            <div className="flex justify-between gap-3 text-amber-700">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shrink-0" />
                Приоритет 3–6 мес (Cat B):
              </span>
              <span className="font-bold font-mono">{formatCurrencyTJS(data.catB)}</span>
            </div>
          )}
          {data.catA > 0 && (
            <div className="flex justify-between gap-3 text-emerald-700">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
                Норма &gt;6 мес (Cat A):
              </span>
              <span className="font-bold font-mono">{formatCurrencyTJS(data.catA)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// High-contrast custom Tooltip for Branch Risk Chart
const CustomBarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const riskPct = data.totalValue > 0 ? ((data.riskValue / data.totalValue) * 100).toFixed(1) : '0.0';
    const isWh = data.isWarehouse || isWarehouseBranch(data.fullName || data.name);
    const purchaseRisk = data.purchaseRiskValue || (data.riskValue * 0.72);
    const purchaseTotal = data.totalPurchaseValue || data.purchaseTotalValue || (data.totalValue * 0.72);

    return (
      <div className="bg-white text-slate-900 p-4 rounded-2xl border border-slate-200 shadow-2xl text-xs space-y-2.5 font-sans min-w-[320px] z-50">
        <div className="font-black text-amber-700 border-b border-slate-100 pb-2 flex justify-between items-center gap-2">
          <div className="min-w-0">
            <span className="truncate max-w-[200px] font-extrabold text-sm text-slate-900 block">{data.name}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded inline-block mt-0.5 ${
              isWh ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
            }`}>
              {isWh ? '🏢 Распределительный склад' : '🏥 Аптечный филиал'}
            </span>
          </div>
          <span className="text-[10px] bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full font-mono font-bold shrink-0">
            {riskPct}% риска
          </span>
        </div>

        {/* Detailed breakdown by each category FEFO */}
        <div className="space-y-1.5 text-[11px] pt-1">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
            Категории FEFO (Розница / Партий):
          </div>

          <div className="flex justify-between items-center text-emerald-700">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0" />
              <span>Cat A (&gt;6 мес):</span>
            </span>
            <span className="font-mono font-bold">
              {formatCurrencyTJS(data.catAVal || 0)} <span className="text-slate-500 text-[10px]">({data.catACount || 0} шт.)</span>
            </span>
          </div>

          <div className="flex justify-between items-center text-amber-700">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shrink-0" />
              <span>Cat B (3–6 мес):</span>
            </span>
            <span className="font-mono font-bold">
              {formatCurrencyTJS(data.catBVal || 0)} <span className="text-slate-500 text-[10px]">({data.catBCount || 0} шт.)</span>
            </span>
          </div>

          <div className="flex justify-between items-center text-orange-700">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block shrink-0" />
              <span>Cat C (1–3 мес):</span>
            </span>
            <span className="font-mono font-bold">
              {formatCurrencyTJS(data.catCVal || 0)} <span className="text-slate-500 text-[10px]">({data.catCCount || 0} шт.)</span>
            </span>
          </div>

          <div className="flex justify-between items-center text-rose-700">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shrink-0" />
              <span>Cat D (&lt;1 мес):</span>
            </span>
            <span className="font-mono font-bold">
              {formatCurrencyTJS(data.catDVal || 0)} <span className="text-slate-500 text-[10px]">({data.catDCount || 0} шт.)</span>
            </span>
          </div>

          <div className="flex justify-between items-center text-purple-800">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block shrink-0" />
              <span>Cat E (Карантин):</span>
            </span>
            <span className="font-mono font-bold">
              {formatCurrencyTJS(data.catEVal || 0)} <span className="text-slate-500 text-[10px]">({data.catECount || 0} шт.)</span>
            </span>
          </div>
        </div>

        {/* Totals Summary: Retail + Purchase */}
        <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] bg-slate-50 p-2 rounded-xl">
          <div className="flex justify-between gap-3 text-rose-700 font-bold">
            <span>Сумма риска (C+D+E):</span>
            <span className="font-mono font-black">{formatCurrencyTJS(data.riskValue)}</span>
          </div>
          <div className="flex justify-between gap-3 text-slate-600 text-[10px]">
            <span>Себестоимость риска (закупка):</span>
            <span className="font-mono font-bold">{formatCurrencyTJS(purchaseRisk)}</span>
          </div>
          <div className="flex justify-between gap-3 text-slate-800 font-bold pt-1 border-t border-slate-200/60">
            <span>Всего запасов (розница / закупка):</span>
            <span className="font-mono text-slate-900">
              {formatCurrencyTJS(data.totalValue)} / {formatCurrencyTJS(purchaseTotal)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// High-contrast custom Tooltip for Category Donut Chart
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const pct = data.payload.totalVal > 0 ? ((data.value / data.payload.totalVal) * 100).toFixed(1) : '0.0';
    const purchaseVal = data.payload.purchaseVal || (data.value * 0.72);
    const marginVal = data.value - purchaseVal;

    return (
      <div className="bg-white text-slate-900 p-3.5 rounded-xl border border-slate-200 shadow-2xl text-xs space-y-2 font-sans min-w-[240px] z-50">
        <div className="font-black flex items-center justify-between gap-1.5 border-b border-slate-100 pb-1.5" style={{ color: data.payload.color }}>
          <span className="flex items-center gap-1.5 font-extrabold text-sm">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color }} />
            <span>{data.name}</span>
          </span>
          <span className="text-[10px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full font-mono font-bold">
            {pct}%
          </span>
        </div>
        <div className="space-y-1 text-[11px] font-mono">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500 font-sans">Розничная сумма:</span>
            <span className="font-extrabold text-slate-900">{formatCurrencyTJS(data.value)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500 font-sans">Себестоимость закупки:</span>
            <span className="font-bold text-slate-700">{formatCurrencyTJS(purchaseVal)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500 font-sans">Торговая маржа:</span>
            <span className="font-bold text-emerald-700">+{formatCurrencyTJS(marginVal)}</span>
          </div>
          <div className="flex justify-between gap-4 pt-1 border-t border-slate-100">
            <span className="text-slate-500 font-sans">Количество партий:</span>
            <span className="font-bold text-amber-700">{data.payload.count} шт.</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// High-contrast custom Tooltip for Branch Leaderboard / Ranking Chart
const CustomRankingTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isWh = data.isWarehouse || isWarehouseBranch(data.fullName || data.name);

    return (
      <div className="bg-white text-slate-900 p-3.5 rounded-xl border border-slate-200 shadow-2xl text-xs space-y-2 font-sans min-w-[280px] z-50">
        <div className="font-black text-amber-700 border-b border-slate-100 pb-1.5 flex justify-between items-center gap-2">
          <div className="min-w-0">
            <span className="truncate text-sm font-extrabold text-slate-900 block">{data.name}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded inline-block mt-0.5 ${
              isWh ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
            }`}>
              {isWh ? '🏢 Склад' : '🏥 Аптека'}
            </span>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono font-bold shrink-0">
            {data.totalCount} партий
          </span>
        </div>
        <div className="space-y-1.5 text-[11px] font-mono">
          <div className="flex justify-between items-center text-slate-700 pb-1 border-b border-slate-100">
            <span className="text-slate-500 font-sans">Показатель:</span>
            <span className="font-black text-amber-700 text-xs">{data.formattedDisplay}</span>
          </div>
          <div className="flex justify-between items-center text-slate-700">
            <span className="font-sans">Капитал (розн. / зак.):</span>
            <span className="font-bold text-slate-900">
              {formatCurrencyTJS(data.totalValue)} / {formatCurrencyTJS(data.purchaseTotalValue)}
            </span>
          </div>
          <div className="flex justify-between items-center text-emerald-700">
            <span className="font-sans">Оборачиваемость:</span>
            <span className="font-bold">{data.avgTurnover}% реализации</span>
          </div>
          <div className="flex justify-between items-center text-amber-700">
            <span className="font-sans">Индекс FEFO:</span>
            <span className="font-bold">{data.safetyIndex} / 100</span>
          </div>
          <div className="flex justify-between items-center text-rose-700">
            <span className="font-sans">Риск (Cat C/D/E):</span>
            <span className="font-bold">{formatCurrencyTJS(data.riskValue)}</span>
          </div>
          <div className="flex justify-between items-center text-teal-700">
            <span className="font-sans">Свежесть (Cat A+B):</span>
            <span className="font-bold">{data.safeRatio}% портфеля</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export type RankingCriterion = 'TURNOVER_RATE' | 'SAFETY_INDEX' | 'TOTAL_VALUE' | 'SAFE_RATIO' | 'FEFO_RISK';

export const DashboardView: React.FC<DashboardViewProps> = ({
  batches,
  branches = [],
  selectedBranches = [],
  setSelectedBranches,
  selectedBranch = 'ALL',
  setSelectedBranch,
  onNavigateTab,
}) => {
  const [showAllBranchesGrid, setShowAllBranchesGrid] = useState(false);
  const [rankingCriterion, setRankingCriterion] = useState<RankingCriterion>('TURNOVER_RATE');
  const [leaderboardBarsLimit, setLeaderboardBarsLimit] = useState<number | 'ALL'>(10);
  const [selectedBranchForDetails, setSelectedBranchForDetails] = useState<string | null>(null);
  const [showMetricsGuide, setShowMetricsGuide] = useState<boolean>(false);
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');

  // Cross-Branch Product Velocity & Pricing Matrix State
  const [productMatrixSearch, setProductMatrixSearch] = useState<string>('');
  const [productMatrixRankFilter, setProductMatrixRankFilter] = useState<'ALL' | 'FAST' | 'MEDIUM' | 'SLOW' | 'DEAD_STOCK'>('ALL');
  const [productMatrixSort, setProductMatrixSort] = useState<'RETAIL_DESC' | 'VELOCITY_DESC' | 'MARGIN_DESC' | 'NAME_ASC'>('RETAIL_DESC');
  const [productMatrixLimit, setProductMatrixLimit] = useState<number | 'ALL'>(15);

  // Extract all unique branch names from both branches list and batches
  const allUniqueBranches = useMemo(() => {
    const set = new Set<string>();
    if (branches && branches.length > 0) {
      branches.forEach(b => set.add(b.nameRussian));
    }
    batches.forEach(b => {
      if (b.branch) set.add(b.branch);
    });
    return Array.from(set).sort();
  }, [batches, branches]);

  // Separate written-off batches
  const writtenOffBatches = useMemo(() => {
    return batches.filter(b => isWrittenOffBatch(b) || isDisposalBranch(b.branch));
  }, [batches]);

  const writtenOffTotalValue = useMemo(() => {
    return writtenOffBatches.reduce((acc, b) => acc + (b.retailPrice * b.quantity), 0);
  }, [writtenOffBatches]);

  // Facility Type Filter: Warehouses, Pharmacies, Stores, Disposal (Disposal excluded by default)
  const [selectedFacilityCategories, setSelectedFacilityCategories] = useState<('WAREHOUSES' | 'PHARMACIES' | 'STORES' | 'DISPOSAL')[]>([
    'WAREHOUSES',
    'PHARMACIES',
    'STORES'
  ]);

  const totalWarehousesCount = useMemo(() => {
    return allUniqueBranches.filter(b => isWarehouseBranch(b)).length;
  }, [allUniqueBranches]);

  const totalPharmaciesCount = useMemo(() => {
    return allUniqueBranches.filter(b => isPharmacyBranch(b)).length;
  }, [allUniqueBranches]);

  const totalStoresCount = useMemo(() => {
    return allUniqueBranches.filter(b => isStoreBranch(b)).length;
  }, [allUniqueBranches]);

  const totalDisposalCount = useMemo(() => {
    return allUniqueBranches.filter(b => isDisposalBranch(b)).length;
  }, [allUniqueBranches]);

  // Filter batches based on branch selection and facility type multi-categories
  const filteredBatches = useMemo(() => {
    const hasNoneSelected = selectedBranches.includes('__NONE__');
    if (hasNoneSelected || selectedFacilityCategories.length === 0) return [];

    return batches.filter(b => {
      // 1. Facility Category Multi-Select check
      const isWh = isWarehouseBranch(b.branch);
      const isPharm = isPharmacyBranch(b.branch);
      const isStore = isStoreBranch(b.branch);
      const isDisp = isDisposalBranch(b.branch);

      const matchesCat = 
        (isWh && selectedFacilityCategories.includes('WAREHOUSES')) ||
        (isPharm && selectedFacilityCategories.includes('PHARMACIES')) ||
        (isStore && selectedFacilityCategories.includes('STORES')) ||
        (isDisp && selectedFacilityCategories.includes('DISPOSAL'));

      if (!matchesCat) return false;

      // 2. Specific branch filter check
      if (selectedBranches.length > 0 && !selectedBranches.includes('__NONE__') && selectedBranches.length < allUniqueBranches.length) {
        const rawBranch = b.branch || 'Центральный склад (г. Душанбе)';
        const cleanBranch = rawBranch.replace('ООО «Сифат Фарма» - ', '').replace('Филиал ', '');
        const matches = selectedBranches.some(sb => 
          rawBranch === sb || cleanBranch === sb || sb.includes(cleanBranch) || cleanBranch.includes(sb)
        );
        if (!matches) return false;
      }

      return true;
    });
  }, [batches, selectedBranches, allUniqueBranches, selectedFacilityCategories]);

  // Category counts & totals (Dual: Retail Price & Purchase Cost + Physical Box Quantities) - Memoized single pass
  const {
    catA, catB, catC, catD, catE,
    totalBatchesCount, totalUnitsCount, totalValue, totalRetailValue, totalPurchaseValue, totalMarginValue, averageMarkupPct,
    valCatA, purchaseValCatA, unitsCatA,
    valCatB, purchaseValCatB, unitsCatB,
    totalValueCatC, purchaseValueCatC, unitsCatC,
    totalValueCatD, purchaseValueCatD, unitsCatD,
    totalValueRisk, totalPurchaseValueRisk, unitsRisk, recoverableCashRisk, netSavedVsPurchaseCost,
    totalValueQuarantine, totalPurchaseValueQuarantine, unitsCatE,
    totalValueSafe, totalPurchaseValueSafe, unitsSafe,
    pctCatA, pctCatB, pctCatC, pctCatD, pctRiskVal, pctQuarantineVal, pctSafeVal, pctRiskCount, pctQuarantineCount
  } = useMemo(() => {
    let countCatA = 0, countCatB = 0, countCatC = 0, countCatD = 0, countCatE = 0;
    let uCatA = 0, uCatB = 0, uCatC = 0, uCatD = 0, uCatE = 0;
    let vCatA = 0, vCatB = 0, vCatC = 0, vCatD = 0, vCatE = 0;
    let pCatA = 0, pCatB = 0, pCatC = 0, pCatD = 0, pCatE = 0;
    let totRetail = 0, totPurchase = 0;

    const listA: MedicationBatch[] = [];
    const listB: MedicationBatch[] = [];
    const listC: MedicationBatch[] = [];
    const listD: MedicationBatch[] = [];
    const listE: MedicationBatch[] = [];

    const len = filteredBatches.length;
    for (let i = 0; i < len; i++) {
      const b = filteredBatches[i];
      const qty = Number(b.quantity || 0);
      const retVal = b.retailPrice * qty;
      const pPrice = Number(b.purchasePrice) > 0 ? Number(b.purchasePrice) : +(b.retailPrice * 0.72);
      const purVal = pPrice * qty;

      totRetail += retVal;
      totPurchase += purVal;

      if (b.category === 'E' || b.isQuarantined) {
        listE.push(b);
        countCatE++;
        uCatE += qty;
        vCatE += retVal;
        pCatE += purVal;
      } else if (b.category === 'D') {
        listD.push(b);
        countCatD++;
        uCatD += qty;
        vCatD += retVal;
        pCatD += purVal;
      } else if (b.category === 'C') {
        listC.push(b);
        countCatC++;
        uCatC += qty;
        vCatC += retVal;
        pCatC += purVal;
      } else if (b.category === 'B') {
        listB.push(b);
        countCatB++;
        uCatB += qty;
        vCatB += retVal;
        pCatB += purVal;
      } else {
        listA.push(b);
        countCatA++;
        uCatA += qty;
        vCatA += retVal;
        pCatA += purVal;
      }
    }

    const tBatches = len;
    const tUnits = uCatA + uCatB + uCatC + uCatD + uCatE;
    const tMargin = totRetail - totPurchase;
    const avgMarkup = totPurchase > 0 ? ((totRetail - totPurchase) / totPurchase) * 100 : 0;

    const tValRisk = vCatC + vCatD;
    const tPurRisk = pCatC + pCatD;
    const uRisk = uCatC + uCatD;
    const recCash = +(vCatC * 0.80 + vCatD * 0.50).toFixed(2);
    const nSaved = +(recCash - tPurRisk).toFixed(2);

    const tValSafe = vCatA + vCatB;
    const tPurSafe = pCatA + pCatB;
    const uSafe = uCatA + uCatB;

    const divisorVal = totRetail > 0 ? totRetail : 1;
    const divisorCount = tBatches > 0 ? tBatches : 1;

    const pCatA_pct = totRetail > 0 ? ((vCatA / divisorVal) * 100).toFixed(1) : '0.0';
    const pCatB_pct = totRetail > 0 ? ((vCatB / divisorVal) * 100).toFixed(1) : '0.0';
    const pCatC_pct = totRetail > 0 ? ((vCatC / divisorVal) * 100).toFixed(1) : '0.0';
    const pCatD_pct = totRetail > 0 ? ((vCatD / divisorVal) * 100).toFixed(1) : '0.0';
    const pRiskVal_pct = totRetail > 0 ? ((tValRisk / divisorVal) * 100).toFixed(1) : '0.0';
    const pQuarVal_pct = totRetail > 0 ? ((vCatE / divisorVal) * 100).toFixed(1) : '0.0';
    const pSafeVal_pct = totRetail > 0 ? (((vCatA + vCatB) / divisorVal) * 100).toFixed(1) : '0.0';
    const pRiskCnt_pct = tBatches > 0 ? (((countCatC + countCatD) / divisorCount) * 100).toFixed(1) : '0.0';
    const pQuarCnt_pct = tBatches > 0 ? ((countCatE / divisorCount) * 100).toFixed(1) : '0.0';

    return {
      catA: listA, catB: listB, catC: listC, catD: listD, catE: listE,
      totalBatchesCount: tBatches, totalUnitsCount: tUnits, totalValue: totRetail, totalRetailValue: totRetail, totalPurchaseValue: totPurchase, totalMarginValue: tMargin, averageMarkupPct: avgMarkup,
      valCatA: vCatA, purchaseValCatA: pCatA, unitsCatA: uCatA,
      valCatB: vCatB, purchaseValCatB: pCatB, unitsCatB: uCatB,
      totalValueCatC: vCatC, purchaseValueCatC: pCatC, unitsCatC: uCatC,
      totalValueCatD: vCatD, purchaseValueCatD: pCatD, unitsCatD: uCatD,
      totalValueRisk: tValRisk, totalPurchaseValueRisk: tPurRisk, unitsRisk: uRisk, recoverableCashRisk: recCash, netSavedVsPurchaseCost: nSaved,
      totalValueQuarantine: vCatE, totalPurchaseValueQuarantine: pCatE, unitsCatE: uCatE,
      totalValueSafe: tValSafe, totalPurchaseValueSafe: tPurSafe, unitsSafe: uSafe,
      pctCatA: pCatA_pct, pctCatB: pCatB_pct, pctCatC: pCatC_pct, pctCatD: pCatD_pct, pctRiskVal: pRiskVal_pct, pctQuarantineVal: pQuarVal_pct, pctSafeVal: pSafeVal_pct, pctRiskCount: pRiskCnt_pct, pctQuarantineCount: pQuarCnt_pct
    };
  }, [filteredBatches]);

  const [showBusinessGuide, setShowBusinessGuide] = useState(false);

  // Dynamic Expiry Forecast Chart Data calculated in a single fast pass
  const expiryForecastData = useMemo(() => {
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const refDate = new Date('2026-08-11');
    const forecastMonths: { key: string; label: string; catA: number; catB: number; catC: number; catD: number; totalVal: number; count: number }[] = [];
    const monthMap = new Map<string, { catA: number; catB: number; catC: number; catD: number; totalVal: number; count: number }>();

    for (let i = 0; i < 8; i++) {
      const d = new Date(refDate.getFullYear(), refDate.getMonth() + i, 1);
      const year = d.getFullYear();
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${monthNum}`;
      const label = `${monthNames[d.getMonth()]} ${year}`;
      const entry = { key, label, catA: 0, catB: 0, catC: 0, catD: 0, totalVal: 0, count: 0 };
      forecastMonths.push(entry);
      monthMap.set(key, entry);
    }

    const len = filteredBatches.length;
    for (let i = 0; i < len; i++) {
      const b = filteredBatches[i];
      if (!b.expiryDate) continue;
      const key = b.expiryDate.slice(0, 7);
      const mEntry = monthMap.get(key);
      if (mEntry) {
        const val = b.retailPrice * b.quantity;
        mEntry.count++;
        mEntry.totalVal += val;
        if (b.category === 'A') mEntry.catA += val;
        else if (b.category === 'B') mEntry.catB += val;
        else if (b.category === 'C') mEntry.catC += val;
        else mEntry.catD += val;
      }
    }

    return forecastMonths.map(m => ({
      month: m.label,
      catA: m.catA,
      catB: m.catB,
      catC: m.catC,
      catD: m.catD,
      totalVal: m.totalVal,
      count: m.count,
    }));
  }, [filteredBatches]);

  // Scalable Branch Breakdown for 25+ Branches
  const allBranchesData = useMemo(() => {
    const branchMap: Record<string, { 
      fullName: string; 
      riskValue: number; 
      count: number; 
      totalValue: number;
      totalCount: number;
      catAVal: number; catACount: number;
      catBVal: number; catBCount: number;
      catCVal: number; catCCount: number;
      catDVal: number; catDCount: number;
      catEVal: number; catECount: number;
    }> = {};
    
    filteredBatches.forEach(b => {
      const rawBranch = b.branch || 'Центральный склад (г. Душанбе)';
      const cleanBranch = rawBranch
        .replace('ООО «Сифат Фарма» - ', '')
        .replace('Филиал ', '');

      if (!branchMap[cleanBranch]) {
        branchMap[cleanBranch] = { 
          fullName: rawBranch, 
          riskValue: 0, 
          count: 0, 
          totalValue: 0,
          totalCount: 0,
          catAVal: 0, catACount: 0,
          catBVal: 0, catBCount: 0,
          catCVal: 0, catCCount: 0,
          catDVal: 0, catDCount: 0,
          catEVal: 0, catECount: 0,
        };
      }
      const val = b.retailPrice * b.quantity;
      const bm = branchMap[cleanBranch];
      bm.totalValue += val;
      bm.totalCount += 1;

      if (b.category === 'E' || b.isQuarantined) {
        bm.catEVal += val;
        bm.catECount += 1;
        bm.riskValue += val;
        bm.count += 1;
      } else if (b.category === 'D') {
        bm.catDVal += val;
        bm.catDCount += 1;
        bm.riskValue += val;
        bm.count += 1;
      } else if (b.category === 'C') {
        bm.catCVal += val;
        bm.catCCount += 1;
        bm.riskValue += val;
        bm.count += 1;
      } else if (b.category === 'B') {
        bm.catBVal += val;
        bm.catBCount += 1;
      } else {
        bm.catAVal += val;
        bm.catACount += 1;
      }
    });

    return Object.entries(branchMap)
      .map(([name, data]) => ({
        name,
        fullName: data.fullName,
        riskValue: data.riskValue,
        count: data.count,
        totalValue: data.totalValue,
        totalCount: data.totalCount,
        catAVal: data.catAVal, catACount: data.catACount,
        catBVal: data.catBVal, catBCount: data.catBCount,
        catCVal: data.catCVal, catCCount: data.catCCount,
        catDVal: data.catDVal, catDCount: data.catDCount,
        catEVal: data.catEVal, catECount: data.catECount,
      }))
      .sort((a, b) => b.riskValue - a.riskValue);
  }, [filteredBatches]);

  // Top 8 branches for chart
  const branchRiskData = useMemo(() => {
    return allBranchesData.slice(0, 8);
  }, [allBranchesData]);

  // Multi-criteria Branch Ranking & Comparison Leaderboard Data
  const branchRankingsData = useMemo(() => {
    const branchStatsMap: Record<string, { 
      name: string; 
      fullName: string; 
      isWarehouse: boolean;
      totalValue: number; 
      purchaseTotalValue: number;
      totalCount: number; 
      riskValue: number; 
      purchaseRiskValue: number;
      catABValue: number;
      sellThroughSum: number;
      sellThroughCount: number;
    }> = {};

    filteredBatches.forEach(b => {
      const rawBranch = b.branch || 'Центральный склад (г. Душанбе)';
      const cleanBranch = rawBranch
        .replace('ООО «Сифат Фарма» - ', '')
        .replace('Филиал ', '');

      if (!branchStatsMap[cleanBranch]) {
        branchStatsMap[cleanBranch] = { 
          name: cleanBranch, 
          fullName: rawBranch, 
          isWarehouse: isWarehouseBranch(rawBranch),
          totalValue: 0, 
          purchaseTotalValue: 0,
          totalCount: 0, 
          riskValue: 0, 
          purchaseRiskValue: 0,
          catABValue: 0,
          sellThroughSum: 0,
          sellThroughCount: 0,
        };
      }
      const val = b.retailPrice * b.quantity;
      const pPrice = Number(b.purchasePrice) > 0 ? Number(b.purchasePrice) : +(b.retailPrice * 0.72);
      const purchaseVal = pPrice * b.quantity;

      const stat = branchStatsMap[cleanBranch];
      stat.totalValue += val;
      stat.purchaseTotalValue += purchaseVal;
      stat.totalCount += 1;

      if (b.category === 'A' || b.category === 'B') {
        stat.catABValue += val;
      }
      if (b.category === 'C' || b.category === 'D' || b.category === 'E' || b.isQuarantined) {
        stat.riskValue += val;
        stat.purchaseRiskValue += purchaseVal;
      }

      const { sellThrough } = getDeterministicSellThrough(b, b.quantity);
      stat.sellThroughSum += sellThrough;
      stat.sellThroughCount += 1;
    });

    const list = Object.values(branchStatsMap).map(b => {
      const avgTurnover = b.sellThroughCount > 0 ? Math.round(b.sellThroughSum / b.sellThroughCount) : 0;
      const safeRatio = b.totalValue > 0 ? Math.round((b.catABValue / b.totalValue) * 100) : 100;
      const riskRatio = b.totalValue > 0 ? (b.riskValue / b.totalValue) : 0;
      const safetyIndex = Math.max(0, Math.min(100, Math.round(100 - (riskRatio * 100))));

      let metricValue = 0;
      let formattedDisplay = '';

      if (rankingCriterion === 'TURNOVER_RATE') {
        metricValue = avgTurnover;
        formattedDisplay = `${avgTurnover}%`;
      } else if (rankingCriterion === 'SAFETY_INDEX') {
        metricValue = safetyIndex;
        formattedDisplay = `${safetyIndex} / 100`;
      } else if (rankingCriterion === 'TOTAL_VALUE') {
        metricValue = Math.round(b.totalValue);
        formattedDisplay = formatCurrencyTJS(b.totalValue);
      } else if (rankingCriterion === 'FEFO_RISK') {
        metricValue = Math.round(b.riskValue);
        formattedDisplay = formatCurrencyTJS(b.riskValue);
      } else if (rankingCriterion === 'SAFE_RATIO') {
        metricValue = safeRatio;
        formattedDisplay = `${safeRatio}%`;
      }

      return {
        name: b.name,
        fullName: b.fullName,
        isWarehouse: b.isWarehouse,
        totalValue: b.totalValue,
        purchaseTotalValue: b.purchaseTotalValue,
        riskValue: b.riskValue,
        purchaseRiskValue: b.purchaseRiskValue,
        catABValue: b.catABValue,
        avgTurnover,
        safeRatio,
        safetyIndex,
        metricValue,
        formattedDisplay,
        totalCount: b.totalCount,
      };
    });

    // Sort order: for FEFO Risk, lowest risk first (0 risk is #1 best)
    if (rankingCriterion === 'FEFO_RISK') {
      list.sort((a, b) => a.metricValue - b.metricValue);
    } else {
      list.sort((a, b) => b.metricValue - a.metricValue);
    }

    return list;
  }, [filteredBatches, rankingCriterion]);

  const displayedLeaderboardList = useMemo(() => {
    if (leaderboardBarsLimit === 'ALL') {
      return branchRankingsData;
    }
    return branchRankingsData.slice(0, Number(leaderboardBarsLimit));
  }, [branchRankingsData, leaderboardBarsLimit]);

  // Computed details for Modal when a specific branch is selected/clicked
  const selectedBranchDetailsData = useMemo(() => {
    if (!selectedBranchForDetails) return null;

    const summary = branchRankingsData.find(
      b => b.fullName === selectedBranchForDetails || b.name === selectedBranchForDetails
    );
    const rankIndex = branchRankingsData.findIndex(
      b => b.fullName === selectedBranchForDetails || b.name === selectedBranchForDetails
    );
    const rank = rankIndex !== -1 ? rankIndex + 1 : 0;

    const branchBatches = filteredBatches.filter(b => {
      const rawBranch = b.branch || 'Центральный склад (г. Душанбе)';
      return rawBranch === selectedBranchForDetails || 
        rawBranch.replace('ООО «Сифат Фарма» - ', '').replace('Филиал ', '') === selectedBranchForDetails;
    });

    const categoryStats = {
      A: { count: 0, val: 0 },
      B: { count: 0, val: 0 },
      C: { count: 0, val: 0 },
      D: { count: 0, val: 0 },
      E: { count: 0, val: 0 },
    };

    branchBatches.forEach(b => {
      const v = b.retailPrice * b.quantity;
      if (b.isQuarantined || b.category === 'E') {
        categoryStats.E.count += 1;
        categoryStats.E.val += v;
      } else if (b.category === 'D') {
        categoryStats.D.count += 1;
        categoryStats.D.val += v;
      } else if (b.category === 'C') {
        categoryStats.C.count += 1;
        categoryStats.C.val += v;
      } else if (b.category === 'B') {
        categoryStats.B.count += 1;
        categoryStats.B.val += v;
      } else {
        categoryStats.A.count += 1;
        categoryStats.A.val += v;
      }
    });

    const criticalBatches = branchBatches
      .filter(b => b.category === 'C' || b.category === 'D' || b.category === 'E' || b.isQuarantined)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    const topSellingBatches = [...branchBatches]
      .map(b => ({ batch: b, ...getDeterministicSellThrough(b, b.quantity) }))
      .sort((a, b) => b.sellThrough - a.sellThrough)
      .slice(0, 5);

    const filteredModalBatches = modalSearchQuery.trim()
      ? branchBatches.filter(b => 
          b.productName.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
          b.lotNumber.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
          b.activeIngredient.toLowerCase().includes(modalSearchQuery.toLowerCase())
        )
      : branchBatches;

    return {
      summary,
      rank,
      branchBatches,
      categoryStats,
      criticalBatches,
      topSellingBatches,
      filteredModalBatches,
    };
  }, [selectedBranchForDetails, branchRankingsData, filteredBatches, modalSearchQuery]);

  // Sales Velocity / Popularity Analytics Data
  const salesVelocityData = useMemo(() => {
    const list = filteredBatches.map(b => {
      const info = getSalesVelocityInfo(b);
      return { batch: b, info };
    });

    const fast = list.filter(item => item.info.rank === 'FAST');
    const medium = list.filter(item => item.info.rank === 'MEDIUM');
    const slow = list.filter(item => item.info.rank === 'SLOW');
    const deadStock = list.filter(item => item.info.rank === 'DEAD_STOCK');

    const totalVal = filteredBatches.reduce((acc, b) => acc + (b.retailPrice * b.quantity), 0) || 1;

    const fastVal = fast.reduce((acc, i) => acc + (i.batch.retailPrice * i.batch.quantity), 0);
    const mediumVal = medium.reduce((acc, i) => acc + (i.batch.retailPrice * i.batch.quantity), 0);
    const slowVal = slow.reduce((acc, i) => acc + (i.batch.retailPrice * i.batch.quantity), 0);
    const deadVal = deadStock.reduce((acc, i) => acc + (i.batch.retailPrice * i.batch.quantity), 0);

    // Top 5 fast moving items sorted by sell-through rate
    const topFast = [...fast].sort((a, b) => b.info.sellThrough - a.info.sellThrough).slice(0, 5);
    // Top 5 dead stock items sorted by monetary value
    const topDead = [...deadStock].sort((a, b) => (b.batch.retailPrice * b.batch.quantity) - (a.batch.retailPrice * a.batch.quantity)).slice(0, 5);

    return {
      fast,
      medium,
      slow,
      deadStock,
      fastVal,
      mediumVal,
      slowVal,
      deadVal,
      fastPct: ((fastVal / totalVal) * 100).toFixed(1),
      mediumPct: ((mediumVal / totalVal) * 100).toFixed(1),
      slowPct: ((slowVal / totalVal) * 100).toFixed(1),
      deadPct: ((deadVal / totalVal) * 100).toFixed(1),
      topFast,
      topDead
    };
  }, [filteredBatches]);

  // Cross-Branch Product Velocity & Pricing Matrix Computation
  const productCrossBranchMatrix = useMemo(() => {
    const productGroups: Record<string, MedicationBatch[]> = {};

    filteredBatches.forEach(b => {
      const key = `${(b.productName || '').trim().toLowerCase()}_${(b.unit || 'уп.').trim().toLowerCase()}`;
      if (!productGroups[key]) {
        productGroups[key] = [];
      }
      productGroups[key].push(b);
    });

    const items = Object.entries(productGroups).map(([key, batchList]) => {
      const first = batchList[0];
      const productName = first.productName;
      const activeIngredient = first.activeIngredient || '—';
      const manufacturer = first.manufacturer || first.supplier || '—';
      const unit = first.unit || 'уп.';
      const retailPrice = first.retailPrice;
      const purchasePrice = Number(first.purchasePrice) > 0 ? Number(first.purchasePrice) : +(first.retailPrice * 0.72);
      const marginVal = retailPrice - purchasePrice;
      const marginPct = purchasePrice > 0 ? Math.round((marginVal / purchasePrice) * 100) : 0;

      // Group by branch
      const branchMap: Record<string, {
        branchName: string;
        fullName: string;
        isWarehouse: boolean;
        quantity: number;
        retailVal: number;
        purchaseVal: number;
        sellThroughSum: number;
        batchesCount: number;
        worstCategory: string;
        minDays: number;
      }> = {};

      batchList.forEach(b => {
        const rawBranch = b.branch || 'Центральный склад (г. Душанбе)';
        const cleanBranch = rawBranch.replace('ООО «Сифат Фарма» - ', '').replace('Филиал ', '');
        
        if (!branchMap[cleanBranch]) {
          branchMap[cleanBranch] = {
            branchName: cleanBranch,
            fullName: rawBranch,
            isWarehouse: isWarehouseBranch(rawBranch),
            quantity: 0,
            retailVal: 0,
            purchaseVal: 0,
            sellThroughSum: 0,
            batchesCount: 0,
            worstCategory: 'A',
            minDays: 9999,
          };
        }

        const bQty = b.quantity || 0;
        const bRetail = b.retailPrice * bQty;
        const bPurch = (Number(b.purchasePrice) > 0 ? Number(b.purchasePrice) : +(b.retailPrice * 0.72)) * bQty;
        const { sellThrough } = getDeterministicSellThrough(b, bQty);

        const bm = branchMap[cleanBranch];
        bm.quantity += bQty;
        bm.retailVal += bRetail;
        bm.purchaseVal += bPurch;
        bm.sellThroughSum += sellThrough;
        bm.batchesCount += 1;
        if (b.daysRemaining < bm.minDays) bm.minDays = b.daysRemaining;

        // Rank category severity: E > D > C > B > A
        const catRank: Record<string, number> = { 'E': 5, 'D': 4, 'C': 3, 'B': 2, 'A': 1 };
        const curCat = b.isQuarantined ? 'E' : (b.category || 'A');
        if ((catRank[curCat] || 1) > (catRank[bm.worstCategory] || 1)) {
          bm.worstCategory = curCat;
        }
      });

      const branchesList = Object.values(branchMap).map(bm => {
        const avgSellThrough = bm.batchesCount > 0 ? Math.round(bm.sellThroughSum / bm.batchesCount) : 0;
        let rank: SalesVelocityRank = 'DEAD_STOCK';
        if (avgSellThrough > 60) rank = 'FAST';
        else if (avgSellThrough >= 25) rank = 'MEDIUM';
        else if (avgSellThrough > 0) rank = 'SLOW';

        return {
          branchName: bm.branchName,
          fullName: bm.fullName,
          isWarehouse: bm.isWarehouse,
          quantity: bm.quantity,
          retailVal: bm.retailVal,
          purchaseVal: bm.purchaseVal,
          sellThrough: avgSellThrough,
          rank,
          category: bm.worstCategory,
          daysRemaining: bm.minDays,
          batchesCount: bm.batchesCount
        };
      }).sort((a, b) => b.quantity - a.quantity);

      const totalQuantity = branchesList.reduce((acc, br) => acc + br.quantity, 0);
      const totalRetailVal = branchesList.reduce((acc, br) => acc + br.retailVal, 0);
      const totalPurchaseVal = branchesList.reduce((acc, br) => acc + br.purchaseVal, 0);
      const totalMargin = totalRetailVal - totalPurchaseVal;

      const totalSellThroughSum = branchesList.reduce((acc, br) => acc + (br.sellThrough * br.quantity), 0);
      const overallSellThrough = totalQuantity > 0 ? Math.round(totalSellThroughSum / totalQuantity) : 0;

      let overallRank: SalesVelocityRank = 'DEAD_STOCK';
      if (overallSellThrough > 60) overallRank = 'FAST';
      else if (overallSellThrough >= 25) overallRank = 'MEDIUM';
      else if (overallSellThrough > 0) overallRank = 'SLOW';

      return {
        id: key,
        productName,
        activeIngredient,
        manufacturer,
        unit,
        retailPrice,
        purchasePrice,
        marginPct,
        totalQuantity,
        totalRetailVal,
        totalPurchaseVal,
        totalMarginVal: totalMargin,
        overallSellThrough,
        overallRank,
        branches: branchesList,
        activeBranchesCount: branchesList.length,
      };
    });

    // Filter by Search Query
    let filtered = items;
    if (productMatrixSearch.trim()) {
      const q = productMatrixSearch.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.productName.toLowerCase().includes(q) ||
        item.activeIngredient.toLowerCase().includes(q) ||
        item.manufacturer.toLowerCase().includes(q) ||
        item.branches.some(b => b.branchName.toLowerCase().includes(q) || b.fullName.toLowerCase().includes(q))
      );
    }

    // Filter by Rank
    if (productMatrixRankFilter !== 'ALL') {
      filtered = filtered.filter(item => item.overallRank === productMatrixRankFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      if (productMatrixSort === 'RETAIL_DESC') return b.totalRetailVal - a.totalRetailVal;
      if (productMatrixSort === 'VELOCITY_DESC') return b.overallSellThrough - a.overallSellThrough;
      if (productMatrixSort === 'MARGIN_DESC') return b.marginPct - a.marginPct;
      if (productMatrixSort === 'NAME_ASC') return a.productName.localeCompare(b.productName);
      return 0;
    });

    const totalCount = filtered.length;
    const displayedItems = productMatrixLimit === 'ALL' ? filtered : filtered.slice(0, Number(productMatrixLimit));

    return {
      allItems: items,
      filteredCount: totalCount,
      displayedItems,
      fastCount: items.filter(i => i.overallRank === 'FAST').length,
      mediumCount: items.filter(i => i.overallRank === 'MEDIUM').length,
      slowCount: items.filter(i => i.overallRank === 'SLOW').length,
      deadCount: items.filter(i => i.overallRank === 'DEAD_STOCK').length,
    };
  }, [filteredBatches, productMatrixSearch, productMatrixRankFilter, productMatrixSort, productMatrixLimit]);

  // Dynamic Donut Chart Data with Retail + Purchase Values
  const categoryPieData = [
    { name: 'Cat A (>6 мес)', value: valCatA, purchaseVal: purchaseValCatA, count: catA.length, color: '#10B981', totalVal: totalValue },
    { name: 'Cat B (3–6 мес)', value: valCatB, purchaseVal: purchaseValCatB, count: catB.length, color: '#F59E0B', totalVal: totalValue },
    { name: 'Cat C (1–3 мес)', value: totalValueCatC, purchaseVal: purchaseValueCatC, count: catC.length, color: '#F97316', totalVal: totalValue },
    { name: 'Cat D (<1 мес)', value: totalValueCatD, purchaseVal: purchaseValueCatD, count: catD.length, color: '#E11D48', totalVal: totalValue },
    { name: 'Cat E (Карантин)', value: totalValueQuarantine, purchaseVal: totalPurchaseValueQuarantine, count: catE.length, color: '#1E293B', totalVal: totalValue },
  ].filter(item => item.value > 0 || item.count > 0);

  return (
    <div className="space-y-6 w-full font-sans text-slate-800">
      {/* Top Title & Compact Control Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>Аналитика и контроль сроков FEFO</span>
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider shadow-2xs">
                СМК ISO 9001 / GDP
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Sifat Control • Мониторинг сети филиалов ({allUniqueBranches.length} объектов) • ҶДММ «Сифат Фарма»
            </p>
          </div>

          {/* Compact Inline Filter Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Active Branch Selection Indicator Badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs">
              <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {selectedBranches.length === 0
                  ? `Показана вся сеть (${allUniqueBranches.length} объектов)`
                  : selectedBranches.length === 1
                  ? `Филиал: ${selectedBranches[0]}`
                  : `Выбрано филиалов: ${selectedBranches.length} из ${allUniqueBranches.length}`}
              </span>
              {selectedBranches.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (setSelectedBranches) setSelectedBranches([]);
                    if (setSelectedBranch) setSelectedBranch('ALL');
                  }}
                  className="ml-1 text-[10px] bg-slate-200 hover:bg-slate-300 px-1.5 py-0.5 rounded text-slate-700 font-bold cursor-pointer transition-colors"
                  title="Сбросить фильтр филиалов"
                >
                  Сбросить
                </button>
              )}
            </div>

            {/* Written-off items count indicator badge */}
            {writtenOffBatches.length > 0 && (
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200/80 text-rose-900 px-3 py-2 rounded-xl text-xs font-bold shrink-0">
                <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Списано: {formatCurrencyTJS(writtenOffTotalValue)} ({writtenOffBatches.length} парт.)</span>
              </div>
            )}
          </div>
        </div>

        {/* Facility Segmentation Category Switcher (Multi-select Warehouses, Pharmacies, Stores, Disposal) */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80 flex-wrap">
            {/* All Operational Network (Disposal excluded) */}
            <button
              type="button"
              onClick={() => setSelectedFacilityCategories(['WAREHOUSES', 'PHARMACIES', 'STORES'])}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedFacilityCategories.includes('WAREHOUSES') &&
                selectedFacilityCategories.includes('PHARMACIES') &&
                selectedFacilityCategories.includes('STORES') &&
                !selectedFacilityCategories.includes('DISPOSAL')
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title="Вся рабочая сеть (склады, аптеки, магазины без списания)"
            >
              <span>🌐 Вся рабочая сеть</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-200 font-mono">
                {totalWarehousesCount + totalPharmaciesCount + totalStoresCount}
              </span>
            </button>

            {/* Central Warehouses Toggle */}
            <button
              type="button"
              onClick={() => {
                setSelectedFacilityCategories(prev => 
                  prev.includes('WAREHOUSES') 
                    ? prev.filter(c => c !== 'WAREHOUSES') 
                    : [...prev, 'WAREHOUSES']
                );
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedFacilityCategories.includes('WAREHOUSES')
                  ? 'bg-amber-400 text-slate-950 shadow-xs font-black ring-1 ring-amber-500'
                  : 'text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white'
              }`}
              title="Включить/выключить аналитику центральных складов"
            >
              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] ${
                selectedFacilityCategories.includes('WAREHOUSES') ? 'bg-slate-950 text-amber-400 border-slate-950' : 'border-slate-400'
              }`}>
                {selectedFacilityCategories.includes('WAREHOUSES') && '✓'}
              </div>
              <span>🏢 Склады</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-950 font-mono font-bold">
                {totalWarehousesCount}
              </span>
            </button>

            {/* Retail Pharmacies Toggle */}
            <button
              type="button"
              onClick={() => {
                setSelectedFacilityCategories(prev => 
                  prev.includes('PHARMACIES') 
                    ? prev.filter(c => c !== 'PHARMACIES') 
                    : [...prev, 'PHARMACIES']
                );
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedFacilityCategories.includes('PHARMACIES')
                  ? 'bg-blue-600 text-white shadow-xs font-black ring-1 ring-blue-700'
                  : 'text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white'
              }`}
              title="Включить/выключить аналитику аптек сети"
            >
              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] ${
                selectedFacilityCategories.includes('PHARMACIES') ? 'bg-white text-blue-600 border-white' : 'border-slate-400'
              }`}>
                {selectedFacilityCategories.includes('PHARMACIES') && '✓'}
              </div>
              <span>🏥 Аптеки</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-900 font-mono font-bold">
                {totalPharmaciesCount}
              </span>
            </button>

            {/* Retail Stores Toggle */}
            {totalStoresCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedFacilityCategories(prev => 
                    prev.includes('STORES') 
                      ? prev.filter(c => c !== 'STORES') 
                      : [...prev, 'STORES']
                  );
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedFacilityCategories.includes('STORES')
                    ? 'bg-purple-600 text-white shadow-xs font-black ring-1 ring-purple-700'
                    : 'text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white'
                }`}
                title="Включить/выключить аналитику магазинов"
              >
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] ${
                  selectedFacilityCategories.includes('STORES') ? 'bg-white text-purple-600 border-white' : 'border-slate-400'
                }`}>
                  {selectedFacilityCategories.includes('STORES') && '✓'}
                </div>
                <span>🛍️ Магазины</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-900 font-mono font-bold">
                  {totalStoresCount}
                </span>
              </button>
            )}

            {/* Disposal Department Toggle (Disabled by default!) */}
            {totalDisposalCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedFacilityCategories(prev => 
                    prev.includes('DISPOSAL') 
                      ? prev.filter(c => c !== 'DISPOSAL') 
                      : [...prev, 'DISPOSAL']
                  );
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedFacilityCategories.includes('DISPOSAL')
                    ? 'bg-rose-600 text-white shadow-xs font-black ring-1 ring-rose-700'
                    : 'text-slate-500 hover:text-rose-700 bg-white/70 hover:bg-rose-50 border border-transparent hover:border-rose-200'
                }`}
                title="Отдел списания и брака (по умолчанию отключен)"
              >
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] ${
                  selectedFacilityCategories.includes('DISPOSAL') ? 'bg-white text-rose-600 border-white' : 'border-slate-400'
                }`}>
                  {selectedFacilityCategories.includes('DISPOSAL') && '✓'}
                </div>
                <span>🗑️ Списание</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-900 font-mono font-bold">
                  {totalDisposalCount}
                </span>
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-2">
            <span>
              {selectedFacilityCategories.length === 0
                ? 'Все категории отключены'
                : selectedFacilityCategories.includes('DISPOSAL')
                ? '⚠️ В аналитику включен отдел списаний'
                : 'Аналитика формируется в реальном времени'}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Summary Metric Cards (Ultra-Compact with Interactive Tooltips) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Total Stock Value */}
        <CompactTooltip
          position="bottom"
          className="w-full"
          title="Финансовая структура товарных запасов"
          content={
            <div className="space-y-1.5 text-[11px] min-w-[240px]">
              <div className="flex justify-between text-slate-300">
                <span>Себестоимость закупки:</span>
                <span className="font-bold text-white font-mono">{formatCurrencyTJS(totalPurchaseValue)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Торговая наценка (маржа):</span>
                <span className="font-bold font-mono">+{formatCurrencyTJS(totalMarginValue)} (+{averageMarkupPct.toFixed(1)}%)</span>
              </div>
              <div className="pt-1 border-t border-slate-700/80 flex justify-between text-amber-300">
                <span>Физический объем:</span>
                <span className="font-mono">{totalBatchesCount} партий • {totalUnitsCount.toLocaleString()} упаковок</span>
              </div>
            </div>
          }
        >
          <div className="w-full bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:border-slate-300 transition-all text-left">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
              <span className="flex items-center gap-1.5 text-slate-700 font-bold">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Товарные запасы</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                100% портфеля
              </span>
            </div>
            <div className="text-xl font-black text-slate-900 tracking-tight font-mono">
              {formatCurrencyTJS(totalRetailValue)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between mt-1 pt-1 border-t border-slate-100">
              <span className="truncate">{totalBatchesCount.toLocaleString()} парт. • {totalUnitsCount.toLocaleString()} уп.</span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded shrink-0">+{averageMarkupPct.toFixed(0)}% маржа</span>
            </div>
          </div>
        </CompactTooltip>

        {/* Metric 2: Risk Stock Value (Cat C & D) */}
        <CompactTooltip
          position="bottom"
          className="w-full"
          title="Анализ рисковых партий (Cat C + D)"
          content={
            <div className="space-y-1.5 text-[11px] min-w-[250px]">
              <div className="flex justify-between text-rose-300">
                <span>Прямой убыток в закупе:</span>
                <span className="font-bold font-mono">{formatCurrencyTJS(totalPurchaseValueRisk)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Спасаемый капитал (FEFO):</span>
                <span className="font-bold font-mono">~{formatCurrencyTJS(recoverableCashRisk)}</span>
              </div>
              <div className="pt-1 border-t border-slate-700/80 flex justify-between text-amber-300">
                <span>Партий и упаковок:</span>
                <span className="font-mono">{catC.length + catD.length} парт. • {unitsRisk.toLocaleString()} уп.</span>
              </div>
            </div>
          }
        >
          <div 
            onClick={() => onNavigateTab('inventory', 'C')}
            className="w-full bg-white rounded-xl border border-amber-200 p-3.5 shadow-2xs hover:border-amber-400 hover:bg-amber-50/20 transition-all text-left cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="flex items-center gap-1.5 text-amber-900 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Риск истечения (C, D)</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold font-mono">
                {pctRiskVal}% капитала
              </span>
            </div>
            <div className="text-xl font-black text-amber-600 tracking-tight font-mono group-hover:text-amber-700">
              {formatCurrencyTJS(totalValueRisk)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between mt-1 pt-1 border-t border-slate-100">
              <span className="truncate">{catC.length + catD.length} парт. • {unitsRisk.toLocaleString()} уп.</span>
              <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-1.5 py-0.2 rounded shrink-0">~{formatCurrencyTJS(recoverableCashRisk)} спас.</span>
            </div>
          </div>
        </CompactTooltip>

        {/* Metric 3: Quarantine Value (Cat E) */}
        <CompactTooltip
          position="bottom"
          className="w-full"
          title="Списание и карантин (Cat E)"
          content={
            <div className="space-y-1.5 text-[11px] min-w-[240px]">
              <div className="flex justify-between text-rose-300">
                <span>Балансовый ущерб (закуп):</span>
                <span className="font-bold font-mono">{formatCurrencyTJS(totalPurchaseValueQuarantine)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Статус блокировки:</span>
                <span className="font-bold text-rose-400">100% изъято из продаж</span>
              </div>
              <div className="pt-1 border-t border-slate-700/80 flex justify-between text-amber-300">
                <span>Просрочено партий:</span>
                <span className="font-mono">{catE.length} парт. • {unitsCatE.toLocaleString()} уп.</span>
              </div>
            </div>
          }
        >
          <div 
            onClick={() => onNavigateTab('quarantine')}
            className="w-full bg-white rounded-xl border border-rose-200 p-3.5 shadow-2xs hover:border-rose-400 hover:bg-rose-50/20 transition-all text-left cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="flex items-center gap-1.5 text-rose-900 font-bold">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>Убыток в карантине (E)</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold font-mono">
                {pctQuarantineVal}%
              </span>
            </div>
            <div className="text-xl font-black text-rose-600 tracking-tight font-mono group-hover:text-rose-700">
              {formatCurrencyTJS(totalValueQuarantine)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between mt-1 pt-1 border-t border-slate-100">
              <span className="truncate">{catE.length} парт. • {unitsCatE.toLocaleString()} уп.</span>
              <span className="text-[10px] text-rose-800 font-bold bg-rose-50 px-1.5 py-0.2 rounded shrink-0">Блокировано</span>
            </div>
          </div>
        </CompactTooltip>

        {/* Metric 4: Safe Category A & B */}
        <CompactTooltip
          position="bottom"
          className="w-full"
          title="Ликвидные запасы в норме (Cat A + B)"
          content={
            <div className="space-y-1.5 text-[11px] min-w-[240px]">
              <div className="flex justify-between text-slate-300">
                <span>Закупочная стоимость:</span>
                <span className="font-bold text-white font-mono">{formatCurrencyTJS(totalPurchaseValueSafe)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Ожидаемая прибыль (маржа):</span>
                <span className="font-bold font-mono">+{formatCurrencyTJS(totalValueSafe - totalPurchaseValueSafe)}</span>
              </div>
              <div className="pt-1 border-t border-slate-700/80 flex justify-between text-amber-300">
                <span>Объем нормы:</span>
                <span className="font-mono">{catA.length + catB.length} парт. • {unitsSafe.toLocaleString()} уп.</span>
              </div>
            </div>
          }
        >
          <div 
            onClick={() => onNavigateTab('inventory', 'A')}
            className="w-full bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:border-slate-300 transition-all text-left cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
              <span className="flex items-center gap-1.5 text-slate-700 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Норма (Cat A & B)</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold font-mono">
                {pctSafeVal}%
              </span>
            </div>
            <div className="text-xl font-black text-slate-900 tracking-tight font-mono">
              {formatCurrencyTJS(totalValueSafe)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between mt-1 pt-1 border-t border-slate-100">
              <span className="truncate">{catA.length + catB.length} парт. • {unitsSafe.toLocaleString()} уп.</span>
              <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.2 rounded shrink-0">Стабильно</span>
            </div>
          </div>
        </CompactTooltip>
      </div>

      {/* Category FEFO Sleek Ribbon Bar with Interactive Tooltips */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2 text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5 text-slate-900 uppercase text-[11px] tracking-wider">
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span>Категории FEFO (Положение Приложение 3)</span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            Наведите курсор на категорию для подробного финансового отчета
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {/* Cat A */}
          <CompactTooltip
            position="bottom"
            className="w-full"
            title="Категория A: Срок годности более 6 месяцев"
            content={
              <div className="space-y-1 text-[11px] min-w-[220px]">
                <div className="flex justify-between text-slate-300">
                  <span>Закупка:</span>
                  <span className="font-bold text-white font-mono">{formatCurrencyTJS(purchaseValCatA)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Количество:</span>
                  <span className="font-mono">{catA.length} парт. • {unitsCatA.toLocaleString()} уп.</span>
                </div>
                <div className="text-emerald-400 font-bold pt-1 border-t border-slate-700">
                  Нормальный оборот, скидки не требуются.
                </div>
              </div>
            }
          >
            <button 
              onClick={() => onNavigateTab('inventory', 'A')}
              className="w-full p-2.5 rounded-lg bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200 text-left transition-all cursor-pointer flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">Cat A (&gt;6 мес)</span>
                </div>
                <div className="text-xs font-black text-slate-900 font-mono mt-0.5">{formatCurrencyTJS(valCatA)}</div>
              </div>
              <span className="bg-emerald-200/90 text-emerald-950 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0">{pctCatA}%</span>
            </button>
          </CompactTooltip>

          {/* Cat B */}
          <CompactTooltip
            position="bottom"
            className="w-full"
            title="Категория B: Срок годности от 3 до 6 месяцев"
            content={
              <div className="space-y-1 text-[11px] min-w-[220px]">
                <div className="flex justify-between text-slate-300">
                  <span>Закупка:</span>
                  <span className="font-bold text-white font-mono">{formatCurrencyTJS(purchaseValCatB)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Количество:</span>
                  <span className="font-mono">{catB.length} парт. • {unitsCatB.toLocaleString()} уп.</span>
                </div>
                <div className="text-amber-400 font-bold pt-1 border-t border-slate-700">
                  Приоритетная выкладка на первых линиях (FEFO).
                </div>
              </div>
            }
          >
            <button 
              onClick={() => onNavigateTab('inventory', 'B')}
              className="w-full p-2.5 rounded-lg bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200 text-left transition-all cursor-pointer flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="truncate">Cat B (3–6 мес)</span>
                </div>
                <div className="text-xs font-black text-slate-900 font-mono mt-0.5">{formatCurrencyTJS(valCatB)}</div>
              </div>
              <span className="bg-amber-200/90 text-amber-950 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0">{pctCatB}%</span>
            </button>
          </CompactTooltip>

          {/* Cat C */}
          <CompactTooltip
            position="bottom"
            className="w-full"
            title="Категория C: Срок годности от 1 до 3 месяцев"
            content={
              <div className="space-y-1 text-[11px] min-w-[220px]">
                <div className="flex justify-between text-slate-300">
                  <span>Закупка:</span>
                  <span className="font-bold text-white font-mono">{formatCurrencyTJS(purchaseValueCatC)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Количество:</span>
                  <span className="font-mono">{catC.length} парт. • {unitsCatC.toLocaleString()} уп.</span>
                </div>
                <div className="text-orange-400 font-bold pt-1 border-t border-slate-700">
                  Рекомендована уценка 15–30% или перемещение.
                </div>
              </div>
            }
          >
            <button 
              onClick={() => onNavigateTab('inventory', 'C')}
              className="w-full p-2.5 rounded-lg bg-orange-50/70 hover:bg-orange-100/80 border border-orange-200 text-left transition-all cursor-pointer flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-orange-900 font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                  <span className="truncate">Cat C (1–3 мес)</span>
                </div>
                <div className="text-xs font-black text-slate-900 font-mono mt-0.5">{formatCurrencyTJS(totalValueCatC)}</div>
              </div>
              <span className="bg-orange-200/90 text-orange-950 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0">{pctCatC}%</span>
            </button>
          </CompactTooltip>

          {/* Cat D */}
          <CompactTooltip
            position="bottom"
            className="w-full"
            title="Категория D: Срок годности менее 1 месяца"
            content={
              <div className="space-y-1 text-[11px] min-w-[220px]">
                <div className="flex justify-between text-slate-300">
                  <span>Закупка:</span>
                  <span className="font-bold text-white font-mono">{formatCurrencyTJS(purchaseValueCatD)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Количество:</span>
                  <span className="font-mono">{catD.length} парт. • {unitsCatD.toLocaleString()} уп.</span>
                </div>
                <div className="text-rose-400 font-bold pt-1 border-t border-slate-700">
                  Критическая скидка 50% или экстренная ротация.
                </div>
              </div>
            }
          >
            <button 
              onClick={() => onNavigateTab('inventory', 'D')}
              className="w-full p-2.5 rounded-lg bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200 text-left transition-all cursor-pointer flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span className="truncate">Cat D (&lt;1 мес)</span>
                </div>
                <div className="text-xs font-black text-slate-900 font-mono mt-0.5">{formatCurrencyTJS(totalValueCatD)}</div>
              </div>
              <span className="bg-rose-200/90 text-rose-950 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0">{pctCatD}%</span>
            </button>
          </CompactTooltip>

          {/* Cat E (Light Cohesive Styling, No Harsh Black) */}
          <CompactTooltip
            position="bottom"
            className="w-full"
            title="Категория E: Карантин и истекшие сроки"
            content={
              <div className="space-y-1 text-[11px] min-w-[220px]">
                <div className="flex justify-between text-slate-300">
                  <span>Закупка:</span>
                  <span className="font-bold text-white font-mono">{formatCurrencyTJS(totalPurchaseValueQuarantine)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Количество:</span>
                  <span className="font-mono">{catE.length} парт. • {unitsCatE.toLocaleString()} уп.</span>
                </div>
                <div className="text-purple-300 font-bold pt-1 border-t border-slate-700">
                  100% блокировка продаж. Оформление акта списания.
                </div>
              </div>
            }
          >
            <button 
              onClick={() => onNavigateTab('quarantine')}
              className="w-full p-2.5 rounded-lg bg-purple-50/70 hover:bg-purple-100/80 border border-purple-200 text-left transition-all cursor-pointer flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-purple-900 font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                  <span className="truncate">Cat E (Истек)</span>
                </div>
                <div className="text-xs font-black text-purple-900 font-mono mt-0.5">{formatCurrencyTJS(totalValueQuarantine)}</div>
              </div>
              <span className="bg-purple-200 text-purple-950 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0">{pctQuarantineVal}%</span>
            </button>
          </CompactTooltip>
        </div>
      </div>

      {/* CORE ANALYTICS CHARTS (DISPLAYED IMMEDIATELY AT THE TOP UNDER KPIS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart 1: Expiration Schedule Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                <span>Календарный график истечения сроков (TJS)</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Объем финансовых средств в товарах с наступлением срока годности по месяцам
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Cat A (&gt;6 м)
              </span>
              <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Cat B (3–6 м)
              </span>
              <span className="flex items-center gap-1 text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> Cat C (1–3 м)
              </span>
              <span className="flex items-center gap-1 text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Cat D/E (&lt;1 м)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expiryForecastData} margin={{ top: 10, right: 15, left: 5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} 
                  axisLine={{ stroke: '#CBD5E1' }} 
                  tickLine={false} 
                />
                <YAxis 
                  tickFormatter={(val) => val >= 1000 ? `${Math.round(val / 1000)} тыс. с.` : `${val} с.`}
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} 
                  axisLine={false} 
                  tickLine={false} 
                  width={75}
                />
                <Tooltip content={<CustomExpiryTooltip />} />
                <Bar dataKey="catD" name="Карантин / Срок менее 1 мес" stackId="a" fill="#EF4444" radius={[0, 0, 0, 0]} barSize={26} />
                <Bar dataKey="catC" name="Высокий риск (1–3 мес)" stackId="a" fill="#F97316" radius={[0, 0, 0, 0]} barSize={26} />
                <Bar dataKey="catB" name="Умеренный риск (3–6 мес)" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} barSize={26} />
                <Bar dataKey="catA" name="Норма (>6 мес)" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Share Donut Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="border-b border-slate-100 pb-2.5">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-amber-500" />
              <span>Доля категорий в портфеле</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Соотношение объемов в Сомони (TJS)
            </p>
          </div>

          <div className="h-48 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryPieData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Summary Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[9px] uppercase font-bold text-slate-400">Всего</span>
              <span className="text-xs font-black text-slate-900 font-mono">{formatCurrencyTJS(totalValue)}</span>
            </div>
          </div>

          {/* Custom Pie Legend with Percentages */}
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            {categoryPieData.map((item, i) => {
              const itemPct = item.totalVal > 0 ? ((item.value / item.totalVal) * 100).toFixed(1) : '0';
              return (
                <div key={i} className="flex items-center justify-between text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate font-semibold text-[10px]">{item.name}</span>
                  </div>
                  <span className="font-extrabold text-slate-900 font-mono ml-1 text-[10px]">{itemPct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Financial Risk & Capital Recovery Evaluation Panel (Calm Light Theme, Compact) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-amber-600" />
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>Финансовая оценка и спасение капитала (Money at Risk)</span>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 text-[10px] font-bold border border-amber-200">
                  Закупка vs Розница
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Расчет реального балансового ущерба и прогноз возврата денег при своевременных уценках
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[11px]">
              Зона риска (C+D): <span className="text-amber-800 font-mono font-black">{unitsRisk.toLocaleString()} уп.</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Card 1: Direct Purchase Loss */}
          <CompactTooltip
            position="top"
            className="w-full"
            title="Прямой финансовый ущерб (Закупка)"
            content="Сумма чистых денежных средств, которая будет списана в убыток компании в случае непродажи партий категорий C и D."
          >
            <div className="w-full bg-rose-50/60 rounded-xl p-3 border border-rose-200 text-left space-y-1">
              <div className="flex items-center justify-between text-rose-900 font-bold text-[11px]">
                <span>Прямой убыток (закуп)</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-200 font-mono">Себестоимость</span>
              </div>
              <div className="text-lg font-black text-rose-700 font-mono">
                {formatCurrencyTJS(totalPurchaseValueRisk)}
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                Балансовое списание {catC.length + catD.length} рисковых партий.
              </p>
            </div>
          </CompactTooltip>

          {/* Card 2: Lost Retail Revenue */}
          <CompactTooltip
            position="top"
            className="w-full"
            title="Упущенная выручка (Розница)"
            content="Плановый валовый доход по действующему розничному прейскуранту сети при 100% своевременной реализации."
          >
            <div className="w-full bg-amber-50/60 rounded-xl p-3 border border-amber-200 text-left space-y-1">
              <div className="flex items-center justify-between text-amber-900 font-bold text-[11px]">
                <span>Упущенная выручка</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-200 font-mono">Розница</span>
              </div>
              <div className="text-lg font-black text-amber-800 font-mono">
                {formatCurrencyTJS(totalValueRisk)}
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                Потенциальный доход по витринной цене.
              </p>
            </div>
          </CompactTooltip>

          {/* Card 3: Recoverable Cash Flow */}
          <CompactTooltip
            position="top"
            className="w-full"
            title="Спасаемый капитал (Cash Flow)"
            content="Денежные средства, гарантированно возвращаемые в оборот при своевременном применении регламентных скидок 15-30% (Cat C) и 50% (Cat D)."
          >
            <div className="w-full bg-emerald-50/60 rounded-xl p-3 border border-emerald-200 text-left space-y-1">
              <div className="flex items-center justify-between text-emerald-900 font-bold text-[11px]">
                <span>Спасаемый капитал</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 border border-emerald-200 font-mono">FEFO уценка</span>
              </div>
              <div className="text-lg font-black text-emerald-700 font-mono">
                {formatCurrencyTJS(recoverableCashRisk)}
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                Возврат средств на расчетный счет компании.
              </p>
            </div>
          </CompactTooltip>

          {/* Card 4: Physical Box Units */}
          <CompactTooltip
            position="top"
            className="w-full"
            title="Физический объем медикаментов"
            content={`Cat C: ${unitsCatC.toLocaleString()} уп. (${catC.length} парт.) • Cat D: ${unitsCatD.toLocaleString()} уп. (${catD.length} парт.)`}
          >
            <div className="w-full bg-blue-50/60 rounded-xl p-3 border border-blue-200 text-left space-y-1">
              <div className="flex items-center justify-between text-blue-900 font-bold text-[11px]">
                <span>Физический объем</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-900 border border-blue-200 font-mono">Упаковки</span>
              </div>
              <div className="text-lg font-black text-blue-900 font-mono">
                {unitsRisk.toLocaleString()} <span className="text-xs font-normal text-slate-500">уп.</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                Cat C: {unitsCatC.toLocaleString()} уп. • Cat D: {unitsCatD.toLocaleString()} уп.
              </p>
            </div>
          </CompactTooltip>
        </div>
      </div>

      {/* Chart 3: Branch Risk Distribution Bar Chart & 25+ Branch Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-rose-500" />
              <span>Распределение финансового риска по филиалам и складам (Сомони TJS)</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Подробная структура партий риска Cat C, D и E в разрезе всех подразделений ООО «Сифат Фарма»
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
              Показано в топ-чарте: {branchRiskData.length} из {allBranchesData.length}
            </span>
            <button
              onClick={() => setShowAllBranchesGrid(!showAllBranchesGrid)}
              className="px-3 py-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              {showAllBranchesGrid ? 'Свернуть сетку филиалов' : `Показать все филиалы (${allBranchesData.length})`}
            </button>
          </div>
        </div>

        {/* Categories Legend Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px]">
          <span className="font-bold text-slate-700">Структура риска в барах (Stacked):</span>
          <div className="flex flex-wrap items-center gap-3 font-semibold">
            <span className="flex items-center gap-1.5 text-orange-800">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
              Cat C (1–3 мес)
            </span>
            <span className="flex items-center gap-1.5 text-rose-800">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              Cat D (&lt;1 мес)
            </span>
            <span className="flex items-center gap-1.5 text-purple-900">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-700 inline-block" />
              Cat E (Карантин/Истек)
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={branchRiskData} 
              layout="vertical" 
              margin={{ top: 10, right: 30, left: 30, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
              <XAxis 
                type="number" 
                tickFormatter={(val) => `${val} с.`}
                tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} 
                axisLine={{ stroke: '#CBD5E1' }} 
                tickLine={false} 
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fontSize: 11, fill: '#0F172A', fontWeight: 700 }} 
                axisLine={false} 
                tickLine={false} 
                width={160} 
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="catCVal" name="Cat C (1–3 мес)" stackId="risk" fill="#F97316" radius={[0, 0, 0, 0]} barSize={22} />
              <Bar dataKey="catDVal" name="Cat D (<1 мес)" stackId="risk" fill="#EF4444" radius={[0, 0, 0, 0]} barSize={22} />
              <Bar dataKey="catEVal" name="Cat E (Карантин/Истек)" stackId="risk" fill="#7E22CE" radius={[0, 8, 8, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Scalable Grid for 25+ Branches */}
        {showAllBranchesGrid && (
          <div className="pt-4 border-t border-slate-200 animate-in fade-in duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-500" />
                <span>Полный список всех филиалов ({allBranchesData.length})</span>
              </h4>
              <span className="text-[10px] text-slate-500 font-medium">Кликните по филиалу, чтобы отфильтровать</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-96 overflow-y-auto p-1">
              {allBranchesData.map((b) => {
                const riskPct = b.totalValue > 0 ? ((b.riskValue / b.totalValue) * 100).toFixed(1) : '0.0';
                const isFiltered = selectedBranches.includes(b.fullName);

                return (
                  <div 
                    key={b.name}
                    onClick={() => {
                      if (isFiltered) {
                        setSelectedBranches(prev => prev.filter(x => x !== b.fullName));
                      } else {
                        setSelectedBranches([b.fullName]);
                      }
                    }}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${isFiltered ? 'bg-amber-100/80 border-amber-400 ring-2 ring-amber-400' : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white'}`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-extrabold text-slate-900 truncate" title={b.fullName}>{b.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${Number(riskPct) > 30 ? 'bg-rose-100 text-rose-800' : Number(riskPct) > 10 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}>
                        {riskPct}% риска
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] font-mono">
                      <div className="flex justify-between text-slate-600">
                        <span>Запасы:</span>
                        <span className="font-bold text-slate-900">{formatCurrencyTJS(b.totalValue)}</span>
                      </div>
                      <div className="flex justify-between text-rose-600">
                        <span>Риск (Cat C/D/E):</span>
                        <span className="font-black">{formatCurrencyTJS(b.riskValue)}</span>
                      </div>
                      
                      {/* Mini category breakdown badges */}
                      <div className="pt-1 border-t border-slate-200/80 flex flex-wrap gap-1 font-sans text-[9px] font-bold">
                        <span className="bg-emerald-100/80 text-emerald-900 px-1.5 py-0.2 rounded" title={`Cat A: ${formatCurrencyTJS(b.catAVal)}`}>
                          A: {b.catACount}
                        </span>
                        <span className="bg-amber-100/80 text-amber-900 px-1.5 py-0.2 rounded" title={`Cat B: ${formatCurrencyTJS(b.catBVal)}`}>
                          B: {b.catBCount}
                        </span>
                        <span className="bg-orange-100/80 text-orange-900 px-1.5 py-0.2 rounded" title={`Cat C: ${formatCurrencyTJS(b.catCVal)}`}>
                          C: {b.catCCount}
                        </span>
                        <span className="bg-rose-100/80 text-rose-900 px-1.5 py-0.2 rounded" title={`Cat D: ${formatCurrencyTJS(b.catDVal)}`}>
                          D: {b.catDCount}
                        </span>
                        {b.catECount > 0 && (
                          <span className="bg-purple-100 text-purple-900 px-1.5 py-0.2 rounded" title={`Cat E: ${formatCurrencyTJS(b.catEVal)}`}>
                            E: {b.catECount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Chart 4: Multi-Criteria Branch Ranking & Leaderboard (Рейтинг и Сравнение Филиалов) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-5">
        
        {/* Header & Metric Switcher Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Сравнительный Рейтинг Филиалов (Branch Leaderboard)</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Сравнительный анализ, динамическое ранжирование и глубокая аналитика аптек сети
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Metrics Explanation Guide */}
            <button
              onClick={() => setShowMetricsGuide(!showMetricsGuide)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showMetricsGuide 
                  ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300' 
                  : 'bg-slate-100 text-slate-700 hover:bg-amber-100 hover:text-amber-900 border border-slate-200'
              }`}
              title="Открыть методику расчета и расшифровку всех метрик"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{showMetricsGuide ? 'Скрыть методологию' : 'Справочник метрик'}</span>
            </button>
          </div>
        </div>

        {/* Detailed Metrics Methodology Guide (Expandable Panel) */}
        {showMetricsGuide && (
          <div className="bg-amber-50/60 text-slate-900 rounded-2xl p-5 border border-amber-200 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-700" />
                <div>
                  <h4 className="text-sm font-black text-amber-900 uppercase tracking-wide">
                    Методология Расчета и Расшифровка Критериев Оценки
                  </h4>
                  <p className="text-xs text-slate-600">
                    Правила формирования рейтинга и экономический смысл используемых аналитических показателей
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMetricsGuide(false)}
                className="p-1 text-slate-500 hover:text-slate-900 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
              {/* Metric 1 */}
              <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between text-amber-800 font-black">
                  <span className="flex items-center gap-1.5"><Flame className="w-4 h-4 text-amber-600" /> 1. Оборачиваемость (% продаж)</span>
                  <span className="text-[10px] bg-amber-100 px-2 py-0.5 rounded text-amber-900 font-mono font-bold">Сбыт</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  <strong>Что показывает:</strong> Процент фактически проданных или реализованных упаковок от начального прихода.
                </p>
                <div className="p-2 bg-slate-50 rounded-lg font-mono text-[10px] text-amber-900 border border-slate-200 font-bold">
                  Формула: (Продано упаковок / Начальный приход) × 100%
                </div>
                <p className="text-slate-500 text-[10px]">
                  <strong>Смысл:</strong> Высокий % характеризует активный чековый поток и быструю заменяемость товарных запасов.
                </p>
              </div>

              {/* Metric 2 */}
              <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between text-emerald-800 font-black">
                  <span className="flex items-center gap-1.5"><Gauge className="w-4 h-4 text-emerald-600" /> 2. Индекс FEFO (0-100)</span>
                  <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded text-emerald-900 font-mono font-bold">Безопасность</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  <strong>Что показывает:</strong> Комплексный уровень контроля сроков годности и отсутствия рисковых партий.
                </p>
                <div className="p-2 bg-slate-50 rounded-lg font-mono text-[10px] text-emerald-900 border border-slate-200 font-bold">
                  Формула: 100 - (Стоимость партий C/D/E / Общий капитал) × 100
                </div>
                <p className="text-slate-500 text-[10px]">
                  <strong>Смысл:</strong> 100 баллов = идеальный склад. Ниже 60 баллов = высокий объем просрочки или товаров с остатком &lt;90 дней.
                </p>
              </div>

              {/* Metric 3 */}
              <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between text-blue-800 font-black">
                  <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-blue-600" /> 3. Капитализация (TJS)</span>
                  <span className="text-[10px] bg-blue-100 px-2 py-0.5 rounded text-blue-900 font-mono font-bold">Объем</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  <strong>Что показывает:</strong> Суммарную стоимость всех медикаментов в наличии по розничным ценам сети.
                </p>
                <div className="p-2 bg-slate-50 rounded-lg font-mono text-[10px] text-blue-900 border border-slate-200 font-bold">
                  Формула: ∑ (Остаток упаковок × Розничная цена)
                </div>
                <p className="text-slate-500 text-[10px]">
                  <strong>Смысл:</strong> Характеризует объем оборотных средств, закрепленных за материально ответственными лицами филиала.
                </p>
              </div>

              {/* Metric 4 */}
              <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between text-teal-800 font-black">
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-teal-600" /> 4. Свежесть (% Cat A+B)</span>
                  <span className="text-[10px] bg-teal-100 px-2 py-0.5 rounded text-teal-900 font-mono font-bold">Ликвидность</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  <strong>Что показывает:</strong> Долю запасов со сроком годности более 90 дней от общего бюджета аптеки.
                </p>
                <div className="p-2 bg-slate-50 rounded-lg font-mono text-[10px] text-teal-900 border border-slate-200 font-bold">
                  Формула: (Стоимость Cat A+B / Общая стоимость) × 100%
                </div>
                <p className="text-slate-500 text-[10px]">
                  <strong>Смысл:</strong> Чем выше %, тем стабильнее финансовое положение филиала и меньше риск вынужденных уценок.
                </p>
              </div>

              {/* Metric 5 */}
              <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-2xs space-y-1.5 md:col-span-2 lg:col-span-2">
                <div className="flex items-center justify-between text-rose-800 font-black">
                  <span className="flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-rose-600" /> 5. Контроль рисков (Сумма в зоне риска C/D/E)</span>
                  <span className="text-[10px] bg-rose-100 text-rose-900 border border-rose-200 px-2 py-0.5 rounded font-mono font-bold">Обратный рейтинг</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  <strong>Что показывает:</strong> Точную денежную сумму партий со сроком менее 90 дней, подлежащих срочной ротации или уценке.
                </p>
                <div className="p-2 bg-slate-50 rounded-lg font-mono text-[10px] text-rose-900 border border-slate-200 font-bold">
                  Формула: ∑ Стоимость партий (Категория C + Категория D + Категория E + Карантин)
                </div>
                <p className="text-slate-500 text-[10px]">
                  <strong>Смысл:</strong> Чем МЕНЬШЕ эта сумма, тем выше место аптеки в рейтинге (1-е место у филиала с наименьшими рисками списаний).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Ultra-Compact Top 3 Podium Strip (Clickable to open branch details) */}
        {branchRankingsData.length >= 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* #1 Gold */}
            <div 
              onClick={() => {
                setSelectedBranchForDetails(branchRankingsData[0].fullName);
                setModalSearchQuery('');
              }}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-100 to-amber-50 border border-amber-400 shadow-2xs flex items-center justify-between gap-2 cursor-pointer hover:scale-[1.01] hover:shadow-xs transition-all group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm shrink-0">🥇</span>
                <span className="font-extrabold text-slate-900 text-xs truncate group-hover:text-amber-950" title={branchRankingsData[0].fullName}>
                  {branchRankingsData[0].name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-black text-amber-950 font-mono bg-amber-200/80 px-2 py-0.5 rounded border border-amber-300/60">
                  {branchRankingsData[0].formattedDisplay}
                </span>
                <Eye className="w-3 h-3 text-amber-700 opacity-70 group-hover:opacity-100" />
              </div>
            </div>

            {/* #2 Silver */}
            <div 
              onClick={() => {
                setSelectedBranchForDetails(branchRankingsData[1].fullName);
                setModalSearchQuery('');
              }}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-slate-200/80 via-slate-100 to-slate-50 border border-slate-300 shadow-2xs flex items-center justify-between gap-2 cursor-pointer hover:scale-[1.01] hover:shadow-xs transition-all group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm shrink-0">🥈</span>
                <span className="font-extrabold text-slate-900 text-xs truncate group-hover:text-slate-800" title={branchRankingsData[1].fullName}>
                  {branchRankingsData[1].name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-black text-slate-900 font-mono bg-slate-200/90 px-2 py-0.5 rounded border border-slate-300">
                  {branchRankingsData[1].formattedDisplay}
                </span>
                <Eye className="w-3 h-3 text-slate-600 opacity-70 group-hover:opacity-100" />
              </div>
            </div>

            {/* #3 Bronze */}
            <div 
              onClick={() => {
                setSelectedBranchForDetails(branchRankingsData[2].fullName);
                setModalSearchQuery('');
              }}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-800/10 via-orange-100/60 to-orange-50 border border-amber-600/30 shadow-2xs flex items-center justify-between gap-2 cursor-pointer hover:scale-[1.01] hover:shadow-xs transition-all group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm shrink-0">🥉</span>
                <span className="font-extrabold text-slate-900 text-xs truncate group-hover:text-amber-950" title={branchRankingsData[2].fullName}>
                  {branchRankingsData[2].name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-black text-amber-950 font-mono bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                  {branchRankingsData[2].formattedDisplay}
                </span>
                <Eye className="w-3 h-3 text-amber-800 opacity-70 group-hover:opacity-100" />
              </div>
            </div>
          </div>
        )}

        {/* Compact Controls Toolbar Directly Above Chart: Criteria Switcher + Scale/Limit Selector */}
        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          
          {/* Left: Criteria Switcher Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              Метрика:
            </span>
            {[
              { id: 'TURNOVER_RATE' as RankingCriterion, label: 'Оборачиваемость', icon: Flame, badge: '% сбыта' },
              { id: 'SAFETY_INDEX' as RankingCriterion, label: 'Индекс FEFO', icon: Gauge, badge: '0-100' },
              { id: 'TOTAL_VALUE' as RankingCriterion, label: 'Капитализация', icon: Building2, badge: 'TJS' },
              { id: 'SAFE_RATIO' as RankingCriterion, label: 'Свежесть', icon: ShieldCheck, badge: '% A+B' },
              { id: 'FEFO_RISK' as RankingCriterion, label: 'Контроль рисков', icon: AlertTriangle, badge: 'Мин. риска' },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = rankingCriterion === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setRankingCriterion(tab.id)}
                  className={`px-2.5 py-1 rounded-xl font-extrabold text-[11px] flex items-center gap-1 transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-slate-900 text-amber-400 shadow-xs' 
                      : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <TabIcon className={`w-3 h-3 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  <span className={`text-[9px] px-1 py-0.1 rounded font-mono ${isActive ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Scale / Bars Limit Selector */}
          <div className="flex items-center gap-1.5 shrink-0 pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-200">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide mr-1 flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              Масштаб:
            </span>
            {[
              { value: 5, label: 'Топ-5' },
              { value: 10, label: 'Топ-10' },
              { value: 15, label: 'Топ-15' },
              { value: 20, label: 'Топ-20' },
              { value: 'ALL', label: `Все (${branchRankingsData.length})` },
            ].map((opt) => {
              const isActive = leaderboardBarsLimit === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  onClick={() => setLeaderboardBarsLimit(opt.value as number | 'ALL')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 shadow-2xs font-black ring-1 ring-amber-300'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

        </div>

        {/* Dynamic Leaderboard Bar Chart */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
            <span className="text-[11px] text-slate-500">
              {rankingCriterion === 'TURNOVER_RATE' && 'Аптеки ранжированы по проданному проценту партий.'}
              {rankingCriterion === 'SAFETY_INDEX' && 'Индекс от 0 до 100 баллов. 100 баллов — идеальный склад.'}
              {rankingCriterion === 'TOTAL_VALUE' && 'Ранжирование по стоимости медикаментов в наличии.'}
              {rankingCriterion === 'SAFE_RATIO' && 'Процент товара со сроком более 3 месяцев (Cat A+B).'}
              {rankingCriterion === 'FEFO_RISK' && '1-е место — филиал с наименьшей суммой товаров в зоне риска.'}
            </span>
            <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1 shrink-0">
              <Eye className="w-3 h-3 text-amber-700" /> Клик по столбцу откроет отчет
            </span>
          </div>

          <div 
            className="w-full transition-all duration-300"
            style={{
              height: `${Math.max(220, displayedLeaderboardList.length * 32)}px`
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displayedLeaderboardList}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis 
                  type="number"
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11, fill: '#0F172A', fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  width={160}
                />
                <Tooltip content={<CustomRankingTooltip />} />
                <Bar 
                  dataKey="metricValue" 
                  radius={[0, 8, 8, 0]} 
                  barSize={18}
                  onClick={(entry) => {
                    if (entry && entry.fullName) {
                      setSelectedBranchForDetails(entry.fullName);
                      setModalSearchQuery('');
                    }
                  }}
                >
                  {displayedLeaderboardList.map((entry, index) => {
                    const colors = rankingCriterion === 'FEFO_RISK' 
                      ? ['#10B981', '#34D399', '#6EE7B7', '#FBBF24', '#F59E0B', '#EF4444'] 
                      : ['#F59E0B', '#3B82F6', '#10B981', '#14B8A6', '#8B5CF6', '#64748B'];
                    const color = colors[index % colors.length];
                    return <Cell key={`cell-${index}`} fill={color} className="cursor-pointer hover:opacity-80 transition-opacity" />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Full Leaderboard Table Grid */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs font-black text-slate-900 uppercase">
            <span>Полный сводный рейтинг всех филиалов сети ({branchRankingsData.length})</span>
            <span className="text-[10px] text-slate-500 font-normal">Сортировка по текущему критерию</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-1">
            {branchRankingsData.map((b, idx) => {
              const isFiltered = selectedBranches.includes(b.fullName);
              const rankNum = idx + 1;
              return (
                <div
                  key={b.name}
                  onClick={() => {
                    setSelectedBranchForDetails(b.fullName);
                    setModalSearchQuery('');
                  }}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                    isFiltered 
                      ? 'bg-amber-100/90 border-amber-400 ring-2 ring-amber-400 shadow-2xs' 
                      : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-6 h-6 rounded-lg font-black text-[11px] flex items-center justify-center shrink-0 ${
                      rankNum === 1 ? 'bg-amber-400 text-slate-950' : rankNum === 2 ? 'bg-slate-300 text-slate-900' : rankNum === 3 ? 'bg-amber-700/20 text-amber-950 border border-amber-600/30' : 'bg-slate-200 text-slate-700'
                    }`}>
                      #{rankNum}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900 truncate block text-[11px]" title={b.fullName}>
                          {b.name}
                        </span>
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded shrink-0 ${
                          b.isWarehouse 
                            ? 'bg-amber-100 text-amber-900 border border-amber-300/80' 
                            : 'bg-blue-50 text-blue-800 border border-blue-200/80'
                        }`}>
                          {b.isWarehouse ? 'Склад' : 'Аптека'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 truncate">
                        <span>розн. {formatCurrencyTJS(b.totalValue)}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600">зак. {formatCurrencyTJS(b.purchaseTotalValue)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <span className="font-black text-slate-900 font-mono text-xs block">
                      {b.formattedDisplay}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBranchForDetails(b.fullName);
                        setModalSearchQuery('');
                      }}
                      className="text-[9px] text-amber-900 bg-amber-200/80 hover:bg-amber-300 px-1.5 py-0.5 rounded font-black flex items-center gap-0.5 ml-auto cursor-pointer transition-colors"
                    >
                      <Eye className="w-2.5 h-2.5" /> Отчет
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Sales Velocity & Cross-Branch Product Popularity Matrix Block */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Аналитика и Рейтинг Продаваемости Товаров (Ходовость)</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Оценка интенсивности спроса, коэффициента сбыта и матрицы стоимости по каждому препарату в разрезе всей сети аптек и складов
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>ABC / Sales Velocity & Pricing Matrix</span>
            </span>
          </div>
        </div>

        {/* 4 Speed / Velocity Summary Cards with Dual Pricing & Tooltips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Fast Moving */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2 relative group">
            <div className="flex items-center justify-between text-xs font-black text-emerald-900">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>⚡ Ходовые (&gt;60%)</span>
              </span>
              <CompactTooltip
                content={
                  <div className="p-1 space-y-1 text-[11px]">
                    <p className="font-bold text-emerald-950">Высокооборачиваемые медикаменты</p>
                    <p className="text-slate-600">
                      Реализуются быстрее 60% от объёма поставки. Основной драйвер выручки сети. Требуют своевременного пополнения запасов без дефектуры.
                    </p>
                  </div>
                }
              >
                <span className="px-2 py-0.5 rounded-full bg-emerald-200/90 text-emerald-950 text-[10px] font-mono font-black cursor-help">
                  {salesVelocityData.fastPct}% капитала
                </span>
              </CompactTooltip>
            </div>
            <div>
              <div className="text-xl font-black text-emerald-900 font-mono">
                {formatCurrencyTJS(salesVelocityData.fastVal)}
              </div>
              <div className="text-[10px] text-emerald-700 font-mono font-medium">
                Себестоимость: ~{formatCurrencyTJS(salesVelocityData.fastVal * 0.72)}
              </div>
            </div>
            <div className="text-[10px] text-emerald-800 font-bold flex justify-between pt-1.5 border-t border-emerald-200/80">
              <span>Партий с высоким спросом:</span>
              <span className="font-mono">{salesVelocityData.fast.length} шт.</span>
            </div>
          </div>

          {/* Medium Velocity */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2 relative group">
            <div className="flex items-center justify-between text-xs font-black text-amber-900">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-amber-600 shrink-0" />
                <span>⚖️ Средние (25–60%)</span>
              </span>
              <CompactTooltip
                content={
                  <div className="p-1 space-y-1 text-[11px]">
                    <p className="font-bold text-amber-950">Стабильный умеренный спрос</p>
                    <p className="text-slate-600">
                      Реализуются в нормальном плановом темпе (25-60%). Не требуют агрессивных скидок при сроке годности более 3 месяцев.
                    </p>
                  </div>
                }
              >
                <span className="px-2 py-0.5 rounded-full bg-amber-200/90 text-amber-950 text-[10px] font-mono font-black cursor-help">
                  {salesVelocityData.mediumPct}% капитала
                </span>
              </CompactTooltip>
            </div>
            <div>
              <div className="text-xl font-black text-amber-900 font-mono">
                {formatCurrencyTJS(salesVelocityData.mediumVal)}
              </div>
              <div className="text-[10px] text-amber-700 font-mono font-medium">
                Себестоимость: ~{formatCurrencyTJS(salesVelocityData.mediumVal * 0.72)}
              </div>
            </div>
            <div className="text-[10px] text-amber-800 font-bold flex justify-between pt-1.5 border-t border-amber-200/80">
              <span>Умеренная скорость:</span>
              <span className="font-mono">{salesVelocityData.medium.length} шт.</span>
            </div>
          </div>

          {/* Slow Velocity */}
          <div className="p-4 rounded-2xl bg-orange-50/80 border border-orange-200 space-y-2 relative group">
            <div className="flex items-center justify-between text-xs font-black text-orange-900">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-orange-600 shrink-0" />
                <span>🐢 Низкая (1–25%)</span>
              </span>
              <CompactTooltip
                content={
                  <div className="p-1 space-y-1 text-[11px]">
                    <p className="font-bold text-orange-950">Замедленный темп реализации</p>
                    <p className="text-slate-600">
                      Продажи идут медленно (&lt;25%). Рекомендуется перемещение в аптеки с более высокой проходимостью или уценка по правилам FEFO.
                    </p>
                  </div>
                }
              >
                <span className="px-2 py-0.5 rounded-full bg-orange-200/90 text-orange-950 text-[10px] font-mono font-black cursor-help">
                  {salesVelocityData.slowPct}% капитала
                </span>
              </CompactTooltip>
            </div>
            <div>
              <div className="text-xl font-black text-orange-900 font-mono">
                {formatCurrencyTJS(salesVelocityData.slowVal)}
              </div>
              <div className="text-[10px] text-orange-700 font-mono font-medium">
                Себестоимость: ~{formatCurrencyTJS(salesVelocityData.slowVal * 0.72)}
              </div>
            </div>
            <div className="text-[10px] text-orange-800 font-bold flex justify-between pt-1.5 border-t border-orange-200/80">
              <span>Замедленная реализация:</span>
              <span className="font-mono">{salesVelocityData.slow.length} шт.</span>
            </div>
          </div>

          {/* Dead Stock */}
          <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-2 relative group">
            <div className="flex items-center justify-between text-xs font-black text-rose-900">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>🛑 Неликвид (0%)</span>
              </span>
              <CompactTooltip
                content={
                  <div className="p-1 space-y-1 text-[11px]">
                    <p className="font-bold text-rose-950">Замороженные активы без движения</p>
                    <p className="text-slate-600">
                      Товары с нулевым процентом сбыта с момента поступления. Критическая зона риска истечения срока годности и потери оборотных средств.
                    </p>
                  </div>
                }
              >
                <span className="px-2 py-0.5 rounded-full bg-rose-200/90 text-rose-950 text-[10px] font-mono font-black cursor-help">
                  {salesVelocityData.deadPct}% капитала
                </span>
              </CompactTooltip>
            </div>
            <div>
              <div className="text-xl font-black text-rose-900 font-mono">
                {formatCurrencyTJS(salesVelocityData.deadVal)}
              </div>
              <div className="text-[10px] text-rose-700 font-mono font-medium">
                Себестоимость: ~{formatCurrencyTJS(salesVelocityData.deadVal * 0.72)}
              </div>
            </div>
            <div className="text-[10px] text-rose-800 font-bold flex justify-between pt-1.5 border-t border-rose-200/80">
              <span>Без движения / Заморожено:</span>
              <span className="font-mono">{salesVelocityData.deadStock.length} шт.</span>
            </div>
          </div>
        </div>

        {/* Top Movers vs Dead Stock Split Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
          {/* Top 5 Fast Moving Items */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-emerald-600" />
                <span>Топ-5 Ходовых Медикаментов (Лидеры продаж)</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Высокий спрос
              </span>
            </div>

            <div className="space-y-2">
              {salesVelocityData.topFast.length > 0 ? (
                salesVelocityData.topFast.map(({ batch, info }, idx) => {
                  const pPrice = Number(batch.purchasePrice) > 0 ? Number(batch.purchasePrice) : +(batch.retailPrice * 0.72);
                  const marginPct = pPrice > 0 ? Math.round(((batch.retailPrice - pPrice) / pPrice) * 100) : 0;
                  return (
                    <div key={batch.id || idx} className="p-2.5 bg-white rounded-lg border border-slate-200/80 text-xs space-y-1.5 hover:border-emerald-300 transition-colors">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span className="truncate max-w-[210px] font-extrabold">{idx + 1}. {batch.productName}</span>
                        <span className="text-emerald-700 font-mono font-black text-[11px] shrink-0 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          {info.sellThrough}% продано
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        <span className="truncate max-w-[180px]">Филиал: {batch.branch}</span>
                        <span className="font-mono">
                          {batch.retailPrice} с. <span className="text-slate-400">({pPrice} с. зак, +{marginPct}%)</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                        <span>Остаток: {batch.quantity} {batch.unit}</span>
                        <span className="font-bold text-slate-900 font-mono">
                          {formatCurrencyTJS(batch.retailPrice * batch.quantity)}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, info.sellThrough)}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-xs text-slate-400">Нет ходовых товаров по текущему фильтру</div>
              )}
            </div>
          </div>

          {/* Top 5 Dead Stock Items */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-black text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Топ-5 Неликвидных Товаров (Без движения)</span>
              </span>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                Замороженный капитал
              </span>
            </div>

            <div className="space-y-2">
              {salesVelocityData.topDead.length > 0 ? (
                salesVelocityData.topDead.map(({ batch }, idx) => {
                  const pPrice = Number(batch.purchasePrice) > 0 ? Number(batch.purchasePrice) : +(batch.retailPrice * 0.72);
                  return (
                    <div key={batch.id || idx} className="p-2.5 bg-white rounded-lg border border-slate-200/80 text-xs space-y-1.5 hover:border-rose-300 transition-colors">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span className="truncate max-w-[210px] font-extrabold">{idx + 1}. {batch.productName}</span>
                        <span className="text-rose-700 font-mono font-black text-[11px] shrink-0 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                          {formatCurrencyTJS(batch.retailPrice * batch.quantity)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        <span className="truncate max-w-[180px]">Филиал: {batch.branch}</span>
                        <span className="font-mono">
                          Закупка: {formatCurrencyTJS(pPrice * batch.quantity)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                        <span>Остаток: {batch.quantity} {batch.unit}</span>
                        <span className="text-rose-600 font-bold">0% сбыта со дня поставки</span>
                      </div>
                      {/* Zero Progress bar */}
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full" style={{ width: `0%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-xs text-slate-400">Нет неликвидных товаров по текущему фильтру</div>
              )}
            </div>
          </div>
        </div>

        {/* Cross-Branch Product Velocity & Pricing Matrix Table */}
        <div className="pt-3 border-t border-slate-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>Сводная матрица стоимости и продаваемости товаров по филиалам сети</span>
              </h4>
              <p className="text-[10px] text-slate-500">
                Сравнение цен (розница, закупка, маржа) и коэффициента реализации каждого медикамента в разрезе всех точек
              </p>
            </div>

            {/* Filter Pills & Search Controls */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productMatrixSearch}
                  onChange={(e) => setProductMatrixSearch(e.target.value)}
                  placeholder="Поиск препарата, МНН, завода..."
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-400 w-52 sm:w-64 transition-all"
                />
                {productMatrixSearch && (
                  <button
                    onClick={() => setProductMatrixSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Rank Filter Tabs */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-bold">
                <button
                  onClick={() => setProductMatrixRankFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    productMatrixRankFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Все ({productCrossBranchMatrix.allItems.length})
                </button>
                <button
                  onClick={() => setProductMatrixRankFilter('FAST')}
                  className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    productMatrixRankFilter === 'FAST'
                      ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                      : 'text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  <span>⚡ Ходовые</span>
                  <span className="text-[10px] opacity-80">({productCrossBranchMatrix.fastCount})</span>
                </button>
                <button
                  onClick={() => setProductMatrixRankFilter('MEDIUM')}
                  className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    productMatrixRankFilter === 'MEDIUM'
                      ? 'bg-amber-500 text-slate-950 shadow-2xs font-extrabold'
                      : 'text-amber-800 hover:bg-amber-50'
                  }`}
                >
                  <span>⚖️ Средние</span>
                  <span className="text-[10px] opacity-80">({productCrossBranchMatrix.mediumCount})</span>
                </button>
                <button
                  onClick={() => setProductMatrixRankFilter('SLOW')}
                  className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    productMatrixRankFilter === 'SLOW'
                      ? 'bg-orange-600 text-white shadow-2xs font-extrabold'
                      : 'text-orange-800 hover:bg-orange-50'
                  }`}
                >
                  <span>🐢 Низкие</span>
                  <span className="text-[10px] opacity-80">({productCrossBranchMatrix.slowCount})</span>
                </button>
                <button
                  onClick={() => setProductMatrixRankFilter('DEAD_STOCK')}
                  className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    productMatrixRankFilter === 'DEAD_STOCK'
                      ? 'bg-rose-600 text-white shadow-2xs font-extrabold'
                      : 'text-rose-800 hover:bg-rose-50'
                  }`}
                >
                  <span>🛑 Неликвид</span>
                  <span className="text-[10px] opacity-80">({productCrossBranchMatrix.deadCount})</span>
                </button>
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-slate-400">Сорт:</span>
                <select
                  value={productMatrixSort}
                  onChange={(e) => setProductMatrixSort(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2 py-1 text-[11px] font-bold focus:outline-none focus:border-amber-400"
                >
                  <option value="RETAIL_DESC">По сумме розницы</option>
                  <option value="VELOCITY_DESC">По % продаваемости</option>
                  <option value="MARGIN_DESC">По маржинальности</option>
                  <option value="NAME_ASC">По названию А-Я</option>
                </select>
              </div>

              {/* Limit Selector */}
              <div className="flex items-center gap-1 text-[11px]">
                <select
                  value={productMatrixLimit}
                  onChange={(e) => setProductMatrixLimit(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2 py-1 text-[11px] font-bold focus:outline-none focus:border-amber-400"
                >
                  <option value={15}>15 записей</option>
                  <option value={30}>30 записей</option>
                  <option value={60}>60 записей</option>
                  <option value="ALL">Все записи</option>
                </select>
              </div>
            </div>
          </div>

          {/* Matrix Data Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3">Препарат / МНН / Завод</th>
                  <th className="py-2.5 px-3">Стоимость за ед.</th>
                  <th className="py-2.5 px-3">Запас в сети</th>
                  <th className="py-2.5 px-3">Коэффициент продаваемости по филиалам</th>
                  <th className="py-2.5 px-3 text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {productCrossBranchMatrix.displayedItems.length > 0 ? (
                  productCrossBranchMatrix.displayedItems.map((item) => {
                    return (
                      <tr key={item.id} className="hover:bg-amber-50/40 transition-colors">
                        {/* Drug Name & Info */}
                        <td className="py-3 px-3 align-top min-w-[220px]">
                          <div className="font-black text-slate-900 text-xs">{item.productName}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            МНН: {item.activeIngredient}
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5 text-purple-500 shrink-0" />
                            <span className="truncate max-w-[190px]">{item.manufacturer}</span>
                          </div>
                        </td>

                        {/* Pricing and Margins */}
                        <td className="py-3 px-3 align-top whitespace-nowrap min-w-[140px]">
                          <div className="font-bold text-slate-900 font-mono text-xs">
                            {formatCurrencyTJS(item.retailPrice)}
                            <span className="text-[10px] text-slate-500 font-normal ml-1">розн.</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {formatCurrencyTJS(item.purchasePrice)}
                            <span className="text-slate-400 font-normal ml-1">зак.</span>
                          </div>
                          <div className="text-[10px] text-emerald-700 font-bold font-mono mt-0.5">
                            +{item.marginPct}% маржа
                          </div>
                        </td>

                        {/* Network Stock & Total Values */}
                        <td className="py-3 px-3 align-top whitespace-nowrap min-w-[160px]">
                          <div className="font-extrabold text-slate-900 font-mono">
                            {item.totalQuantity} {item.unit}
                          </div>
                          <div className="text-[10px] text-slate-700 font-mono">
                            Розн: <span className="font-bold">{formatCurrencyTJS(item.totalRetailVal)}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Зак: {formatCurrencyTJS(item.totalPurchaseVal)}
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5">
                            В {item.activeBranchesCount} филиалах
                          </div>
                        </td>

                        {/* Cross-Branch Velocity Badges */}
                        <td className="py-3 px-3 align-top min-w-[340px]">
                          <div className="space-y-1.5">
                            {/* Overall network speed */}
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                item.overallRank === 'FAST'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : item.overallRank === 'MEDIUM'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : item.overallRank === 'SLOW'
                                  ? 'bg-orange-100 text-orange-900 border border-orange-300'
                                  : 'bg-rose-100 text-rose-900 border border-rose-300'
                              }`}>
                                {item.overallRank === 'FAST' && '⚡ Ходовой спрос'}
                                {item.overallRank === 'MEDIUM' && '⚖️ Средний спрос'}
                                {item.overallRank === 'SLOW' && '🐢 Низкий спрос'}
                                {item.overallRank === 'DEAD_STOCK' && '🛑 Неликвид'}
                                <span className="font-mono">({item.overallSellThrough}%)</span>
                              </span>
                            </div>

                            {/* Branch Badges Grid */}
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {item.branches.map((br) => {
                                const badgeColor = br.rank === 'FAST'
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                                  : br.rank === 'MEDIUM'
                                  ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                                  : br.rank === 'SLOW'
                                  ? 'bg-orange-50 text-orange-900 border-orange-200 hover:bg-orange-100'
                                  : 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100';

                                return (
                                  <CompactTooltip
                                    key={br.branchName}
                                    content={
                                      <div className="p-1 space-y-1 text-[11px] min-w-[200px]">
                                        <div className="font-extrabold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-1">
                                          <span>{br.fullName}</span>
                                          <span className="text-[9px] bg-slate-100 px-1 rounded">
                                            {br.isWarehouse ? '🏢 Склад' : '🏥 Аптека'}
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-slate-600 font-mono">
                                          <span>Остаток:</span>
                                          <span className="font-bold text-slate-900">{br.quantity} {item.unit}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-600 font-mono">
                                          <span>Сумма розницы:</span>
                                          <span className="font-bold text-slate-900">{formatCurrencyTJS(br.retailVal)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-600 font-mono">
                                          <span>Сбыт со дня поставки:</span>
                                          <span className="font-black text-amber-700">{br.sellThrough}%</span>
                                        </div>
                                        <div className="flex justify-between text-slate-600 font-mono">
                                          <span>Категория FEFO:</span>
                                          <span className="font-bold text-rose-700">Cat {br.category}</span>
                                        </div>
                                      </div>
                                    }
                                  >
                                    <div className={`px-2 py-1 rounded-lg border text-[10px] font-bold cursor-help transition-all flex items-center gap-1.5 ${badgeColor}`}>
                                      <span>{br.isWarehouse ? '🏢' : '🏥'}</span>
                                      <span className="truncate max-w-[120px]">{br.branchName}</span>
                                      <span className="font-mono font-black text-[9px] bg-white/80 px-1 py-0.2 rounded">
                                        {br.sellThrough}%
                                      </span>
                                      <span className="font-mono text-[9px] text-slate-500">
                                        ({br.quantity} {item.unit})
                                      </span>
                                    </div>
                                  </CompactTooltip>
                                );
                              })}
                            </div>
                          </div>
                        </td>

                        {/* Action Column */}
                        <td className="py-3 px-3 align-middle text-right whitespace-nowrap">
                          <button
                            onClick={() => onNavigateTab('transfers')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-[11px] rounded-lg transition-colors cursor-pointer shadow-2xs"
                            title="Переместить избыточный запас в ходовые филиалы"
                          >
                            <span>Перемещение</span>
                            <ChevronRight className="w-3 h-3 text-amber-800" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      По указанным критериям товары не найдены. Попробуйте изменить поисковый запрос или фильтр скорости.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Count */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>
              Показано {productCrossBranchMatrix.displayedItems.length} из {productCrossBranchMatrix.filteredCount} наименований
            </span>
            <span className="font-medium">
              Данные синхронизированы в реальном времени с 25+ точками сети
            </span>
          </div>
        </div>
      </div>

      {/* Manufacturers & Aging Inventory Analytics Block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manufacturer Analysis */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-600" />
                <span>Анализ запасов по Производителям</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Концентрация капитала и уровень риска в разрезе фармацевтических заводов
              </p>
            </div>
            <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-mono font-bold">
              Всего заводов: {new Set(batches.map(b => b.manufacturer || 'не определен')).size}
            </span>
          </div>

          <div className="space-y-2.5">
            {Object.entries(
              batches.reduce((acc, b) => {
                const manuf = b.manufacturer || 'не определен';
                if (!acc[manuf]) acc[manuf] = { totalVal: 0, count: 0, riskVal: 0 };
                const val = b.retailPrice * b.quantity;
                acc[manuf].totalVal += val;
                acc[manuf].count += 1;
                if (b.category === 'C' || b.category === 'D' || b.category === 'E' || b.isQuarantined) {
                  acc[manuf].riskVal += val;
                }
                return acc;
              }, {} as Record<string, { totalVal: number; count: number; riskVal: number }>)
            )
              .sort((a: [string, { totalVal: number; count: number; riskVal: number }], b: [string, { totalVal: number; count: number; riskVal: number }]) => b[1].totalVal - a[1].totalVal)
              .slice(0, 5)
              .map(([manuf, stat]: [string, { totalVal: number; count: number; riskVal: number }], idx) => {
                const pctOfTotal = totalValue > 0 ? ((stat.totalVal / totalValue) * 100).toFixed(1) : '0';
                const riskPct = stat.totalVal > 0 ? ((stat.riskVal / stat.totalVal) * 100).toFixed(1) : '0';

                return (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 truncate">{manuf}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>Партий: {stat.count} шт.</span>
                        <span>•</span>
                        <span>Доля: {pctOfTotal}%</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 font-mono">
                      <div className="font-black text-slate-900">{formatCurrencyTJS(stat.totalVal)}</div>
                      {stat.riskVal > 0 ? (
                        <div className="text-[10px] text-rose-600 font-bold">
                          Риск: {formatCurrencyTJS(stat.riskVal)} ({riskPct}%)
                        </div>
                      ) : (
                        <div className="text-[10px] text-emerald-600 font-bold">Рисков нет</div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Turnover & Days in Stock Analysis */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Анализ длительности хранения и % реализации</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Выявление залежалых товаров со дня поставки на склад
              </p>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-mono font-bold">
              Ср. срок в запасе: {Math.round(batches.reduce((a, b) => a + (b.daysInStock || 0), 0) / (batches.length || 1))} дн.
            </span>
          </div>

          <div className="space-y-2.5">
            {batches
              .filter(b => b.daysInStock !== undefined && b.daysInStock > 30)
              .sort((a, b) => (b.daysInStock || 0) - (a.daysInStock || 0))
              .slice(0, 5)
              .map((b, idx) => {
                const sellThrough = b.sellThroughRate ?? 0;
                return (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span className="truncate max-w-[220px]">{b.productName}</span>
                      <span className="text-blue-700 font-mono text-[11px] shrink-0">
                        {b.daysInStock} дн. на складе
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Поставка: {b.deliveryDate || b.createdDate || '—'}</span>
                      <span>Приход: {b.initialQuantity || b.quantity} {b.unit} → Остаток: {b.quantity} {b.unit}</span>
                    </div>

                    {/* Progress Bar for Sell-Through */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                        <span>Процент реализации:</span>
                        <span className="font-bold text-slate-800 font-mono">{sellThrough}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${sellThrough > 60 ? 'bg-emerald-500' : sellThrough > 30 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${Math.min(100, sellThrough)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Interactive Batch Cards Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Приоритетные партии FEFO к обработке</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Партии с ограниченным сроком годности, требующие установки скидки или передачи в карантин
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('inventory')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Перейти в полный реестр</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Dual-Tone Interactive Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.slice(0, 6).map((batch) => {
            let headerBg = 'bg-emerald-600';
            let bodyBg = 'bg-emerald-50/60 border-emerald-200';
            
            if (batch.category === 'B') {
              headerBg = 'bg-amber-500';
              bodyBg = 'bg-amber-50/60 border-amber-200';
            } else if (batch.category === 'C') {
              headerBg = 'bg-orange-500';
              bodyBg = 'bg-orange-50/70 border-orange-200';
            } else if (batch.category === 'D') {
              headerBg = 'bg-rose-600';
              bodyBg = 'bg-rose-50/70 border-rose-200';
            } else if (batch.category === 'E') {
              headerBg = 'bg-slate-900';
              bodyBg = 'bg-slate-100 border-slate-300';
            }

            return (
              <div 
                key={batch.id}
                className={`rounded-2xl border overflow-hidden shadow-2xs hover:shadow-md transition-all ${bodyBg}`}
              >
                {/* Header Strip */}
                <div className={`${headerBg} text-white px-3.5 py-2 flex items-center justify-between text-xs font-bold`}>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] bg-black/20 px-1.5 py-0.5 rounded">
                      {batch.lotNumber}
                    </span>
                    <span>Cat {batch.category}</span>
                  </div>
                  <span className="text-[11px] font-medium bg-white/20 px-2 py-0.5 rounded-full">
                    {batch.daysRemaining > 0 
                      ? `${batch.daysRemaining} дн.` 
                      : 'Просрочено'}
                  </span>
                </div>

                {/* Body Content */}
                <div className="p-3.5 space-y-2 text-xs">
                  <div>
                    <div className="font-black text-slate-900 text-sm leading-tight">
                      {batch.productName}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5 flex items-center justify-between">
                      <span className="truncate">{batch.branch}</span>
                      <span className="text-slate-500 shrink-0">{batch.supplier}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Кол-во / Цена:</span>
                      <span className="font-black text-slate-900 font-mono">
                        {batch.quantity} {batch.unit} × {formatCurrencyTJS(batch.retailPrice)}
                      </span>
                    </div>

                    {batch.currentDiscount > 0 ? (
                      <span className="px-2 py-1 bg-amber-400 text-slate-950 font-black rounded-lg text-xs shadow-2xs">
                        -{batch.currentDiscount}%
                      </span>
                    ) : (
                      <button
                        onClick={() => onNavigateTab('inventory')}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[11px] cursor-pointer transition-all"
                      >
                        Действие
                      </button>
                    )}
                  </div>

                  <div className="pt-1.5 border-t border-slate-200/40 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span>Добавлено: {batch.createdDate || '—'}</span>
                    <span>Изм: {batch.lastModifiedDate || '—'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Branch Details Modal Window */}
      {selectedBranchForDetails && selectedBranchDetailsData && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-start justify-between gap-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" /> Место #{selectedBranchDetailsData.rank} в сети
                  </span>
                  <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-full font-mono">
                    Критерий: {rankingCriterion === 'TURNOVER_RATE' ? 'Оборачиваемость (% продажи)' : rankingCriterion === 'SAFETY_INDEX' ? 'Индекс FEFO (0-100)' : rankingCriterion === 'TOTAL_VALUE' ? 'Капитализация (TJS)' : rankingCriterion === 'SAFE_RATIO' ? 'Свежесть (% Cat A+B)' : 'Контроль рисков (Мин. рисковых запасов)'}
                  </span>
                </div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-amber-400 shrink-0" />
                  <span>{selectedBranchForDetails}</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Полная аналитическая карточка аптечного филиала • Сводные показатели, распределение категорий FEFO и товарные запасы
                </p>
              </div>

              <button
                onClick={() => setSelectedBranchForDetails(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 md:p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* Top 4 Key Metric Cards for this Branch */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Total Value */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">
                    Капитализация склада
                  </div>
                  <div className="text-xl font-black text-slate-900 font-mono">
                    {formatCurrencyTJS(selectedBranchDetailsData.summary?.totalValue || 0)}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                    <Pill className="w-3 h-3 text-amber-600" /> Партий в наличии: {selectedBranchDetailsData.branchBatches.length} шт.
                  </div>
                </div>

                {/* Avg Turnover */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300/80 space-y-1">
                  <div className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wide flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-600" /> Оборачиваемость (% сбыта)
                  </div>
                  <div className="text-xl font-black text-amber-950 font-mono">
                    {selectedBranchDetailsData.summary?.avgTurnover || 0}%
                  </div>
                  <div className="text-[10px] font-bold text-amber-800">
                    Средний процент проданных товаров
                  </div>
                </div>

                {/* Safety Index */}
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-300/80 space-y-1">
                  <div className="text-[11px] font-extrabold text-emerald-900 uppercase tracking-wide flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-emerald-600" /> Индекс безопасности FEFO
                  </div>
                  <div className="text-xl font-black text-emerald-950 font-mono">
                    {selectedBranchDetailsData.summary?.safetyIndex || 0} / 100
                  </div>
                  <div className="text-[10px] font-bold text-emerald-800">
                    {(selectedBranchDetailsData.summary?.safetyIndex || 0) >= 80 ? '🟢 Высокая безопасность' : '🟡 Требуется ротация'}
                  </div>
                </div>

                {/* Risk Value */}
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-300/80 space-y-1">
                  <div className="text-[11px] font-extrabold text-rose-900 uppercase tracking-wide flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Объем риска (Cat C/D/E)
                  </div>
                  <div className="text-xl font-black text-rose-950 font-mono">
                    {formatCurrencyTJS(selectedBranchDetailsData.summary?.riskValue || 0)}
                  </div>
                  <div className="text-[10px] font-bold text-rose-800">
                    Партий в риске: {selectedBranchDetailsData.criticalBatches.length} шт.
                  </div>
                </div>
              </div>

              {/* FEFO Category Breakdown Bars */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-black text-slate-900 uppercase">
                  <span className="flex items-center gap-1.5"><Layers className="w-4 h-4 text-amber-600" /> Структура запасов по категориям FEFO</span>
                  <span className="text-[10px] text-slate-500 font-normal">Всего товаров: {selectedBranchDetailsData.branchBatches.length} партий</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                  {/* Cat A */}
                  <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between font-extrabold text-emerald-800">
                      <span>Cat A (&gt;180 дн.)</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded">Зеленая</span>
                    </div>
                    <div className="font-mono font-black text-slate-900 text-sm">
                      {formatCurrencyTJS(selectedBranchDetailsData.categoryStats.A.val)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      Партий: {selectedBranchDetailsData.categoryStats.A.count} шт.
                    </div>
                  </div>

                  {/* Cat B */}
                  <div className="p-3 bg-white rounded-xl border border-blue-200 text-xs space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between font-extrabold text-blue-800">
                      <span>Cat B (90-180 дн.)</span>
                      <span className="text-[10px] bg-blue-100 text-blue-900 px-1.5 py-0.2 rounded">Норма</span>
                    </div>
                    <div className="font-mono font-black text-slate-900 text-sm">
                      {formatCurrencyTJS(selectedBranchDetailsData.categoryStats.B.val)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      Партий: {selectedBranchDetailsData.categoryStats.B.count} шт.
                    </div>
                  </div>

                  {/* Cat C */}
                  <div className="p-3 bg-white rounded-xl border border-amber-300 text-xs space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between font-extrabold text-amber-900">
                      <span>Cat C (30-90 дн.)</span>
                      <span className="text-[10px] bg-amber-100 text-amber-950 px-1.5 py-0.2 rounded">Внимание</span>
                    </div>
                    <div className="font-mono font-black text-amber-950 text-sm">
                      {formatCurrencyTJS(selectedBranchDetailsData.categoryStats.C.val)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      Партий: {selectedBranchDetailsData.categoryStats.C.count} шт.
                    </div>
                  </div>

                  {/* Cat D */}
                  <div className="p-3 bg-white rounded-xl border border-rose-300 text-xs space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between font-extrabold text-rose-900">
                      <span>Cat D (&lt;30 дн.)</span>
                      <span className="text-[10px] bg-rose-100 text-rose-950 px-1.5 py-0.2 rounded">Срочно</span>
                    </div>
                    <div className="font-mono font-black text-rose-950 text-sm">
                      {formatCurrencyTJS(selectedBranchDetailsData.categoryStats.D.val)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      Партий: {selectedBranchDetailsData.categoryStats.D.count} шт.
                    </div>
                  </div>

                  {/* Cat E / Quarantine */}
                  <div className="p-3 bg-white rounded-xl border border-purple-300 text-xs space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between font-extrabold text-purple-900">
                      <span>Cat E / Карантин</span>
                      <span className="text-[10px] bg-purple-100 text-purple-950 px-1.5 py-0.2 rounded">Изолировано</span>
                    </div>
                    <div className="font-mono font-black text-purple-950 text-sm">
                      {formatCurrencyTJS(selectedBranchDetailsData.categoryStats.E.val)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      Партий: {selectedBranchDetailsData.categoryStats.E.count} шт.
                    </div>
                  </div>
                </div>
              </div>

              {/* Critical Batches Alert in this Branch */}
              {selectedBranchDetailsData.criticalBatches.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-black text-rose-950 uppercase">
                    <span className="flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-rose-600" /> Критические партии филиала, требующие уценки или ротации ({selectedBranchDetailsData.criticalBatches.length})</span>
                    <span className="text-[10px] text-rose-700 font-bold">Сортировка по минимальному остатку дней</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-0.5">
                    {selectedBranchDetailsData.criticalBatches.slice(0, 6).map(b => (
                      <div key={b.id} className="p-3 bg-white rounded-xl border border-rose-200 flex items-center justify-between gap-2 text-xs shadow-2xs">
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate" title={b.productName}>{b.productName}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Серия: {b.lotNumber} • Ост: {b.quantity} {b.unit}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black block font-mono ${
                            b.category === 'D' ? 'bg-rose-600 text-white' : b.category === 'C' ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-white'
                          }`}>
                            Cat {b.category}: {b.daysRemaining} дн.
                          </span>
                          <span className="text-[10px] font-mono font-extrabold text-slate-800 block mt-0.5">
                            {formatCurrencyTJS(b.retailPrice * b.quantity)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Complete Inventory List for this Branch */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
                      <Pill className="w-4 h-4 text-amber-600" />
                      <span>Полный реестр лекарственных средств филиала ({selectedBranchDetailsData.branchBatches.length})</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Поиск и фильтрация медикаментов на балансе аптеки
                    </p>
                  </div>

                  {/* Search inside modal */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Поиск товара или серии..."
                      value={modalSearchQuery}
                      onChange={(e) => setModalSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                {/* Table of Batches */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs max-h-72 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-black text-[10px] sticky top-0 z-10">
                      <tr>
                        <th className="p-3">Серия / Препарат</th>
                        <th className="p-3">Категория / Срок</th>
                        <th className="p-3 text-right">Остаток</th>
                        <th className="p-3 text-right">Цена (TJS)</th>
                        <th className="p-3 text-right">Сумма (TJS)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {selectedBranchDetailsData.filteredModalBatches.length > 0 ? (
                        selectedBranchDetailsData.filteredModalBatches.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{b.productName}</div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                Серия: {b.lotNumber} • До: {formatDateDDMMYYYY(b.expirationDate)}
                              </div>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black font-mono ${
                                b.category === 'A' ? 'bg-emerald-100 text-emerald-900' : b.category === 'B' ? 'bg-blue-100 text-blue-900' : b.category === 'C' ? 'bg-amber-100 text-amber-950' : b.category === 'D' ? 'bg-rose-100 text-rose-950 font-bold' : 'bg-slate-900 text-white'
                              }`}>
                                Cat {b.category} ({b.daysRemaining} дн.)
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono font-bold">
                              {b.quantity} {b.unit}
                            </td>
                            <td className="p-3 text-right font-mono">
                              {formatCurrencyTJS(b.retailPrice)}
                            </td>
                            <td className="p-3 text-right font-mono font-black text-slate-900">
                              {formatCurrencyTJS(b.retailPrice * b.quantity)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400 font-medium">
                            По запросу «{modalSearchQuery}» ничего не найдено
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (setSelectedBranches && selectedBranchForDetails) {
                      setSelectedBranches([selectedBranchForDetails]);
                    }
                    setSelectedBranchForDetails(null);
                  }}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  <Filter className="w-4 h-4" />
                  <span>Отфильтровать весь Дашборд по этой аптеке</span>
                </button>

                {onNavigateTab && (
                  <button
                    onClick={() => {
                      setSelectedBranchForDetails(null);
                      onNavigateTab('transfers');
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <ArrowUpRight className="w-4 h-4 text-amber-400" />
                    <span>Создать Перемещение / Ротацию</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedBranchForDetails(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Закрыть
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
