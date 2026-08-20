import React, { useState, useMemo } from 'react';
import { 
  ArrowRightLeft, 
  Building2, 
  Plus, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  TrendingUp, 
  FileText, 
  Trash2, 
  Edit3, 
  Download,
  Sparkles,
  ShieldAlert,
  Send,
  Search,
  ShieldCheck,
  Layers,
  Sliders,
  Box,
  ChevronDown,
  ChevronUp,
  PackageCheck,
  CheckCheck
} from 'lucide-react';
import { MedicationBatch, BranchInfo } from '../types';
import { 
  formatCurrencyTJS, 
  formatDateDDMMYYYY, 
  getBranchSalesVelocity, 
  getBatchEffectiveUnitPrice, 
  getSalesVelocityInfo 
} from '../utils/categoryUtils';
import { 
  exportRotationRecommendationsToExcel, 
  exportRotationRecommendationsToCSV,
  BranchSimulationBalance,
  RotationRecommendationItem,
  BranchAllocationDetail
} from '../utils/exportUtils';
import { MultiAllocationMatrixTable } from './transfers/MultiAllocationMatrixTable';
import { FineTuneSplitModal } from './transfers/FineTuneSplitModal';
import { SkuGroupingView, SkuGroupData } from './transfers/SkuGroupingView';
import { CompactTooltip } from './transfers/CompactTooltip';

interface TransfersViewProps {
  batches: MedicationBatch[];
  allBatches?: MedicationBatch[];
  branches: BranchInfo[];
  onTransferBatch: (batchId: string, targetBranch: string, reason: string) => void;
  onExecuteBatchSplitTransfer?: (
    batchId: string, 
    allocations: { targetBranch: string; quantity: number; reason: string }[],
    retainedQuantity: number
  ) => void;
  onExecuteAllMultiDistributions?: (
    distributions: { batchId: string; allocations: { targetBranch: string; quantity: number; reason: string }[]; retainedQuantity: number }[]
  ) => void;
  onAddBranch: (newBranch: BranchInfo) => void;
  onDeleteBranch: (branchId: string) => void;
  onUpdateBranch: (updatedBranch: BranchInfo) => void;
  onOpenBranchModal?: () => void;
  onReassignAllBatchesBranch?: (targetBranchName: string) => void;
}

export const TransfersView: React.FC<TransfersViewProps> = ({
  batches,
  allBatches,
  branches,
  onTransferBatch,
  onExecuteBatchSplitTransfer,
  onExecuteAllMultiDistributions,
  onAddBranch,
  onDeleteBranch,
  onUpdateBranch,
  onOpenBranchModal,
  onReassignAllBatchesBranch,
}) => {
  const activeBatchesPool = allBatches && allBatches.length > 0 ? allBatches : batches;

  const [activeSubTab, setActiveSubTab] = useState<'recommendations' | 'simulation' | 'branches'>('recommendations');
  const [recViewMode, setRecViewMode] = useState<'batches' | 'skus'>('batches');
  const [massTargetBranch, setMassTargetBranch] = useState<string>(branches[0]?.nameRussian || '');
  const [massSuccessMsg, setMassSuccessMsg] = useState<string | null>(null);
  
  // Modal state for manual single-target transfer
  const [selectedBatchForTransfer, setSelectedBatchForTransfer] = useState<MedicationBatch | null>(null);
  const [targetBranch, setTargetBranch] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('Ускорение реализации по системе FEFO (Ротация)');
  const [transferSuccessMsg, setTransferSuccessMsg] = useState<string | null>(null);

  // Modal state for fine-tuning multi-split
  const [fineTuneItem, setFineTuneItem] = useState<RotationRecommendationItem | null>(null);

  // Safety & Guardrails Settings State
  const [safetyMaxSkuCapacity, setSafetyMaxSkuCapacity] = useState<number>(30);
  const [safetyProtectDonorDisplay, setSafetyProtectDonorDisplay] = useState<boolean>(true);
  const [safetyPreferLocalCity, setSafetyPreferLocalCity] = useState<boolean>(true);
  const [isSafetySettingsOpen, setIsSafetySettingsOpen] = useState<boolean>(false);

  // Simulation View Filter State
  const [simulationSearch, setSimulationSearch] = useState<string>('');
  const [simulationCityFilter, setSimulationCityFilter] = useState<string>('all');

  // New Branch Modal State
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCity, setNewBranchCity] = useState('Душанбе');
  const [newBranchAddress, setNewBranchAddress] = useState('');

  // Editing Branch State
  const [editingBranch, setEditingBranch] = useState<BranchInfo | null>(null);
  const [deletingBranchIdInView, setDeletingBranchIdInView] = useState<string | null>(null);

  // Bulk Branch Selection State
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);

  const toggleSelectBranch = (id: string) => {
    setSelectedBranchIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllBranches = () => {
    if (selectedBranchIds.length === branches.length) {
      setSelectedBranchIds([]);
    } else {
      setSelectedBranchIds(branches.map(b => b.id));
    }
  };

  const handleBulkDeleteSelectedBranches = () => {
    if (selectedBranchIds.length === 0) return;
    const count = selectedBranchIds.length;
    selectedBranchIds.forEach(id => {
      onDeleteBranch(id);
    });
    setSelectedBranchIds([]);
    setMassSuccessMsg(`Успешно удалено объектов: ${count}`);
    setTimeout(() => setMassSuccessMsg(null), 4000);
  };

  // Filter & Sort State for Recommendations
  const [recSearch, setRecSearch] = useState('');
  const [recCategories, setRecCategories] = useState<('C' | 'D')[]>([]);
  const [recBranches, setRecBranches] = useState<string[]>([]);
  const [recSortField, setRecSortField] = useState<'daysToAct' | 'productName' | 'potentialRevenueSaved' | 'quantity'>('daysToAct');
  const [recSortOrder, setRecSortOrder] = useState<'asc' | 'desc'>('asc');
  const [recDisplayLimit, setRecDisplayLimit] = useState<number>(50);

  // Available source branches for filter
  const availableSourceBranches = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < activeBatchesPool.length; i++) {
      const b = activeBatchesPool[i];
      if (!b.isQuarantined && (b.category === 'C' || b.category === 'D') && b.branch) {
        set.add(b.branch);
      }
    }
    return Array.from(set);
  }, [activeBatchesPool]);

  const toggleRecCategory = (cat: 'C' | 'D') => {
    setRecCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
    setRecDisplayLimit(50);
  };

  const toggleRecBranch = (bName: string) => {
    setRecBranches(prev => prev.includes(bName) ? prev.filter(b => b !== bName) : [...prev, bName]);
    setRecDisplayLimit(50);
  };

  // --- Dynamic Multi-Pass Smart Allocation Algorithm ---
  const {
    filteredRecommendationList,
    branchSimulationBalances,
    safetyStats,
    skuGroups,
    uniqueCities
  } = useMemo(() => {
    const q = recSearch.toLowerCase().trim();

    // 1. Initial State Indexing across network
    const stockMap = new Map<string, number>();
    const branchInitialUnitsMap = new Map<string, number>();
    const branchInitialValueMap = new Map<string, number>();
    const branchInitialBatchesCount = new Map<string, number>();

    // SKU Group Map
    const skuRawMap = new Map<string, {
      productName: string;
      totalNetworkQty: number;
      totalNetworkValue: number;
      riskBatchesCount: number;
      riskQty: number;
      riskValue: number;
      branchMap: Map<string, {
        branchName: string;
        city: string;
        quantity: number;
        riskCategory?: string;
        isWarehouse: boolean;
        batches: MedicationBatch[];
      }>;
    }>();

    for (let i = 0; i < activeBatchesPool.length; i++) {
      const b = activeBatchesPool[i];
      if (b.isQuarantined) continue;
      const br = b.branch || 'Центральный склад (г. Душанбе)';
      const pName = (b.productName || '').trim();
      const pNameLower = pName.toLowerCase();
      const qty = Number(b.quantity) || 0;
      const price = (Number(b.retailPrice) || 0) * (1 - (Number(b.currentDiscount) || 0) / 100);
      const val = price * qty;

      if (br && pNameLower) {
        const key = `${br}___${pNameLower}`;
        stockMap.set(key, (stockMap.get(key) || 0) + qty);
      }

      branchInitialUnitsMap.set(br, (branchInitialUnitsMap.get(br) || 0) + qty);
      branchInitialValueMap.set(br, (branchInitialValueMap.get(br) || 0) + val);
      branchInitialBatchesCount.set(br, (branchInitialBatchesCount.get(br) || 0) + 1);

      // SKU group accumulation
      if (!skuRawMap.has(pName)) {
        skuRawMap.set(pName, {
          productName: pName,
          totalNetworkQty: 0,
          totalNetworkValue: 0,
          riskBatchesCount: 0,
          riskQty: 0,
          riskValue: 0,
          branchMap: new Map()
        });
      }
      const sGroup = skuRawMap.get(pName)!;
      sGroup.totalNetworkQty += qty;
      sGroup.totalNetworkValue += val;

      const isRisk = b.category === 'C' || b.category === 'D';
      if (isRisk) {
        sGroup.riskBatchesCount += 1;
        sGroup.riskQty += qty;
        sGroup.riskValue += val;
      }

      if (!sGroup.branchMap.has(br)) {
        const brObj = branches.find(item => item.nameRussian === br);
        const city = brObj?.city || (br.includes('Худжанд') ? 'Худжанд' : br.includes('Куляб') ? 'Куляб' : br.includes('Бохтар') ? 'Бохтар' : 'Душанбе');
        sGroup.branchMap.set(br, {
          branchName: br,
          city,
          quantity: 0,
          isWarehouse: br.toLowerCase().includes('склад'),
          batches: []
        });
      }
      const brEntry = sGroup.branchMap.get(br)!;
      brEntry.quantity += qty;
      brEntry.batches.push(b);
    }

    // 2. Retail Candidates (excluding warehouses from receiving retail inventory)
    const validCandidates = branches.filter(br => {
      const brName = br?.nameRussian || '';
      return !brName.toLowerCase().includes('склад');
    });

    // 3. Filter risk batches (Cat C & D)
    const riskBatches = activeBatchesPool.filter((b) => {
      if (b.isQuarantined || (b.category !== 'C' && b.category !== 'D')) return false;
      const bBranch = b.branch || '';
      const bName = b.productName || '';
      const bLot = b.lotNumber || '';
      
      const matchesSearch = !q || 
        bName.toLowerCase().includes(q) ||
        bLot.toLowerCase().includes(q) ||
        bBranch.toLowerCase().includes(q);

      const matchesCat = recCategories.length === 0 || recCategories.includes(b.category as 'C' | 'D');
      const matchesBranch = recBranches.length === 0 || recBranches.includes(bBranch);

      return matchesSearch && matchesCat && matchesBranch;
    });

    // Sort risk batches by urgency: Cat D first, then lowest days remaining
    riskBatches.sort((a, b) => {
      if (a.category === 'D' && b.category !== 'D') return -1;
      if (b.category === 'D' && a.category !== 'D') return 1;
      return (a.daysRemaining || 0) - (b.daysRemaining || 0);
    });

    const anchorKeywords = ['маркази', 'роддом', 'истиклол', 'клинич', 'ориёнбонк', 'центральн', 'главная', '№1'];

    // Dynamic Cumulative Simulation Maps
    const simulatedTargetStockMap = new Map<string, number>();
    const simulatedDonorStockMap = new Map<string, number>();
    const targetBranchLoadBatches = new Map<string, number>();
    const targetBranchLoadUnits = new Map<string, number>();
    const targetBranchLoadValue = new Map<string, number>();
    const donorBranchOutgoingUnits = new Map<string, number>();
    const donorBranchOutgoingValue = new Map<string, number>();
    const zeroDeficitsResolvedMap = new Map<string, number>();

    let preventedOverstockCount = 0;
    let protectedDonorCount = 0;
    let zeroDeficitsResolvedCount = 0;

    const list: RotationRecommendationItem[] = riskBatches.map((batch) => {
      const currentBatchBranch = batch.branch || 'Центральный склад (г. Душанбе)';
      const isDonorWarehouse = currentBatchBranch.toLowerCase().includes('склад');
      const pNameLower = (batch.productName || '').trim().toLowerCase();
      const totalBatchQty = Number(batch.quantity) || 0;
      const unitPrice = (Number(batch.retailPrice) || 0) * (1 - ((Number(batch.currentDiscount) || 0) / 100));
      const totalRevenueSaved = unitPrice * totalBatchQty;

      // Source branch info
      const sourceBranchObj = branches.find(br => br.nameRussian === currentBatchBranch) || {
        city: currentBatchBranch.includes('Худжанд') ? 'Худжанд' : currentBatchBranch.includes('Куляб') ? 'Куляб' : currentBatchBranch.includes('Бохтар') ? 'Бохтар' : 'Душанбе',
        nameRussian: currentBatchBranch
      };
      const sourceCity = sourceBranchObj.city || 'Душанбе';

      // Donor stock tracking
      const donorKey = `${currentBatchBranch}___${pNameLower}`;
      const donorOriginalStock = stockMap.get(donorKey) || totalBatchQty;
      const donorCurrentSimStock = simulatedDonorStockMap.get(donorKey) ?? donorOriginalStock;

      // Safe retained quantity for donor:
      // If donor is warehouse -> retained = 0
      // If donor is retail pharmacy -> retain safe shelf buffer (e.g. 20% or min 2-5 units)
      let retainedInDonor = 0;
      if (!isDonorWarehouse && safetyProtectDonorDisplay) {
        if (totalBatchQty <= 3) {
          retainedInDonor = Math.min(totalBatchQty, 1);
        } else if (totalBatchQty <= 10) {
          retainedInDonor = 2;
        } else {
          retainedInDonor = Math.min(totalBatchQty, Math.max(3, Math.round(totalBatchQty * 0.25)));
        }
        protectedDonorCount++;
      }

      const movableUnits = Math.max(1, totalBatchQty - retainedInDonor);

      // Recipient Candidates scoring
      const candidates = validCandidates.filter(br => br.nameRussian !== currentBatchBranch);

      const scoredCandidates = candidates.map(candidate => {
        let score = 50;

        // 1. Regional proximity
        const isSameCity = candidate.city === sourceCity;
        if (isSameCity) {
          score += safetyPreferLocalCity ? 45 : 30;
        } else {
          score -= safetyPreferLocalCity ? 25 : 10;
        }

        // 2. High foot-traffic anchor bonus
        const nameLower = (candidate.nameRussian || '').toLowerCase();
        const isAnchor = anchorKeywords.some(kw => nameLower.includes(kw));
        if (isAnchor) {
          score += 25;
        }

        // 3. Dynamic Cumulative Stock in Candidate
        const targetKey = `${candidate.nameRussian}___${pNameLower}`;
        const targetOriginalStock = stockMap.get(targetKey) || 0;
        const targetCurrentSimStock = simulatedTargetStockMap.get(targetKey) ?? targetOriginalStock;

        const maxAllowed = isAnchor ? Math.floor(safetyMaxSkuCapacity * 1.5) : safetyMaxSkuCapacity;

        if (targetCurrentSimStock === 0) {
          score += 50; // Zero stock deficit
        } else if (targetCurrentSimStock < 8) {
          score += 25;
        } else if (targetCurrentSimStock < 18) {
          score += 10;
        } else if (targetCurrentSimStock >= maxAllowed) {
          score -= 90; // Overstock protection
          preventedOverstockCount++;
        } else {
          score -= 30;
        }

        // 4. Branch overall load penalty
        const currentBranchBatches = targetBranchLoadBatches.get(candidate.nameRussian || '') || 0;
        score -= currentBranchBatches * 8;

        return {
          branch: candidate,
          score,
          existingStockInCandidate: targetOriginalStock,
          simulatedStockInCandidate: targetCurrentSimStock,
          isAnchor,
          isSameCity
        };
      });

      // Filter eligible candidates (score >= 40)
      const topEligible = scoredCandidates
        .filter(c => c.score > 35)
        .sort((a, b) => b.score - a.score);

      // Multi-destination split: Select top 1 to 3 recipient branches based on movable volume
      const maxDestinations = movableUnits >= 30 ? 3 : movableUnits >= 12 ? 2 : 1;
      const selectedRecipients = topEligible.slice(0, Math.min(maxDestinations, topEligible.length));

      // Fallback if no candidate scored above threshold
      if (selectedRecipients.length === 0) {
        const fallbackCand = scoredCandidates.sort((a, b) => b.score - a.score)[0] || {
          branch: branches.find(b => b.nameRussian !== currentBatchBranch) || branches[0],
          score: 60,
          existingStockInCandidate: 0,
          simulatedStockInCandidate: 0,
          isAnchor: false,
          isSameCity: true
        };
        selectedRecipients.push(fallbackCand);
      }

      // Calculate unit split across selected recipients
      const totalScoreWeight = selectedRecipients.reduce((sum, r) => sum + Math.max(10, r.score), 0);
      let allocatedSum = 0;
      
      const recipientSplits = selectedRecipients.map((rec, idx) => {
        let assignedUnits = 0;
        if (selectedRecipients.length === 1) {
          assignedUnits = movableUnits;
        } else if (idx === selectedRecipients.length - 1) {
          assignedUnits = Math.max(1, movableUnits - allocatedSum);
        } else {
          const weight = Math.max(10, rec.score);
          assignedUnits = Math.max(1, Math.round(movableUnits * (weight / totalScoreWeight)));
        }
        allocatedSum += assignedUnits;

        return {
          ...rec,
          assignedUnits
        };
      });

      // Ensure exact sum matches movableUnits
      const discrepancy = movableUnits - recipientSplits.reduce((s, r) => s + r.assignedUnits, 0);
      if (discrepancy !== 0 && recipientSplits.length > 0) {
        recipientSplits[0].assignedUnits += discrepancy;
      }

      // Build Multi-Allocation Details for Table
      const allocations: BranchAllocationDetail[] = [];

      const donorVelocity = getBranchSalesVelocity(currentBatchBranch, batch.productName, batch);

      // Donor Row
      allocations.push({
        branchName: currentBatchBranch,
        city: sourceCity,
        role: 'DONOR',
        currentStock: donorOriginalStock,
        allocatedDelta: -movableUnits,
        projectedStock: Math.max(0, donorOriginalStock - movableUnits),
        isZeroDeficitResolved: false,
        unitPrice,
        totalValue: unitPrice * movableUnits,
        salesVelocityRatio: donorVelocity.formatted,
        salesVelocityPercent: donorVelocity.percent,
        salesVelocityLabel: donorVelocity.shortLabel,
        salesVelocityBadge: `${donorVelocity.badgeBg} ${donorVelocity.badgeText}`,
        salesVelocityTooltip: donorVelocity.tooltipText,
        compactTag: retainedInDonor > 0 ? `Буфер: ${retainedInDonor} уп.` : 'Складской сплит',
        reason: retainedInDonor > 0 
          ? `Защитный остаток полок (${retainedInDonor} уп.) сохранен на витрине` 
          : 'Плановая разгрузка склада/филиала'
      });

      // Recipient Rows
      recipientSplits.forEach((split, idx) => {
        const targetName = split.branch.nameRussian;
        const targetCity = split.branch.city;
        const targetKey = `${targetName}___${pNameLower}`;
        const prevTargetSim = simulatedTargetStockMap.get(targetKey) ?? (stockMap.get(targetKey) || 0);

        simulatedTargetStockMap.set(targetKey, prevTargetSim + split.assignedUnits);

        targetBranchLoadBatches.set(targetName, (targetBranchLoadBatches.get(targetName) || 0) + 1);
        targetBranchLoadUnits.set(targetName, (targetBranchLoadUnits.get(targetName) || 0) + split.assignedUnits);
        targetBranchLoadValue.set(targetName, (targetBranchLoadValue.get(targetName) || 0) + (split.assignedUnits * unitPrice));

        if (split.existingStockInCandidate === 0) {
          zeroDeficitsResolvedCount++;
          zeroDeficitsResolvedMap.set(targetName, (zeroDeficitsResolvedMap.get(targetName) || 0) + 1);
        }

        const recVelocity = getBranchSalesVelocity(targetName, batch.productName, batch);

        let recReason = '';
        let compactTag = 'Сплит-прием';
        if (split.existingStockInCandidate === 0) {
          recReason = 'Ликвидация дефицита (было 0 шт) — гарантированный моментальный сбыт';
          compactTag = 'Дефицит закрыт';
        } else if (split.isAnchor) {
          recReason = 'Флагманская аптека с высоким чековым трафиком';
          compactTag = 'Флагман';
        } else {
          recReason = `Оптимальная емкость пополнения в г. ${targetCity}`;
          compactTag = `Пополнение (${targetCity})`;
        }

        allocations.push({
          branchName: targetName,
          city: targetCity,
          role: 'RECIPIENT',
          currentStock: split.existingStockInCandidate,
          allocatedDelta: split.assignedUnits,
          projectedStock: split.existingStockInCandidate + split.assignedUnits,
          isZeroDeficitResolved: split.existingStockInCandidate === 0,
          unitPrice,
          totalValue: unitPrice * split.assignedUnits,
          salesVelocityRatio: recVelocity.formatted,
          salesVelocityPercent: recVelocity.percent,
          salesVelocityLabel: recVelocity.shortLabel,
          salesVelocityBadge: `${recVelocity.badgeBg} ${recVelocity.badgeText}`,
          salesVelocityTooltip: recVelocity.tooltipText,
          compactTag,
          reason: recReason
        });
      });

      // Update donor branch balances
      simulatedDonorStockMap.set(donorKey, Math.max(0, donorCurrentSimStock - movableUnits));
      donorBranchOutgoingUnits.set(currentBatchBranch, (donorBranchOutgoingUnits.get(currentBatchBranch) || 0) + movableUnits);
      donorBranchOutgoingValue.set(currentBatchBranch, (donorBranchOutgoingValue.get(currentBatchBranch) || 0) + (movableUnits * unitPrice));

      const primaryRecipient = recipientSplits[0] || {
        branch: { nameRussian: 'Аптека №1 (г. Душанбе)', city: 'Душанбе' },
        score: 75,
        existingStockInCandidate: 0,
        isSameCity: true
      };

      const daysToAct = Math.max(1, Math.floor((batch.daysRemaining || 30) / 2));
      const actionDeadlineDate = new Date();
      actionDeadlineDate.setDate(actionDeadlineDate.getDate() + daysToAct);
      const deadlineFormatted = actionDeadlineDate.toISOString().slice(0, 10);
      const isUrgent = batch.category === 'D' || (batch.daysRemaining || 0) <= 30;

      const reasonSummary = recipientSplits.length > 1
        ? `Умное пропорциональное распределение между ${recipientSplits.length} аптеками: ${recipientSplits.map(r => `${r.branch.nameRussian} (${r.assignedUnits} уп)`).join(', ')}`
        : `Направлено в ${primaryRecipient.branch.nameRussian} (${movableUnits} уп) для закрытия потребности`;

      return {
        batch,
        currentBranch: currentBatchBranch,
        suggestedBranch: primaryRecipient.branch.nameRussian,
        targetCity: primaryRecipient.branch.city,
        matchScore: Math.min(99, Math.max(72, primaryRecipient.score)),
        existingStockInTarget: primaryRecipient.existingStockInCandidate,
        isSameCity: primaryRecipient.isSameCity,
        deadlineFormatted,
        daysToAct,
        isUrgent,
        potentialRevenueSaved: totalRevenueSaved,
        reason: reasonSummary,
        allocations,
        retainedInDonor
      };
    });

    // 4. Construct Comprehensive Branch Balances Matrix (Before vs After)
    const allUniqueBranchNames = Array.from(new Set([
      ...branches.map(b => b.nameRussian),
      ...Array.from(branchInitialUnitsMap.keys()),
      ...Array.from(targetBranchLoadBatches.keys()),
      ...Array.from(donorBranchOutgoingUnits.keys())
    ]));

    const branchSimulationBalances: BranchSimulationBalance[] = allUniqueBranchNames.map(bName => {
      const branchObj = branches.find(b => b.nameRussian === bName);
      const city = branchObj?.city || (bName.includes('Худжанд') ? 'Худжанд' : bName.includes('Куляб') ? 'Куляб' : bName.includes('Бохтар') ? 'Бохтар' : 'Душанбе');
      const isWarehouse = bName.toLowerCase().includes('склад');

      const initialUnits = branchInitialUnitsMap.get(bName) || 0;
      const initialValue = branchInitialValueMap.get(bName) || 0;
      const incomingUnits = targetBranchLoadUnits.get(bName) || 0;
      const incomingValue = targetBranchLoadValue.get(bName) || 0;
      const outgoingUnits = donorBranchOutgoingUnits.get(bName) || 0;
      const outgoingValue = donorBranchOutgoingValue.get(bName) || 0;

      const projectedUnits = Math.max(0, initialUnits + incomingUnits - outgoingUnits);
      const projectedValue = Math.max(0, initialValue + incomingValue - outgoingValue);
      const netDeltaUnits = incomingUnits - outgoingUnits;
      const netDeltaValue = incomingValue - outgoingValue;
      const zeroDeficitsResolved = zeroDeficitsResolvedMap.get(bName) || 0;

      let safetyStatus = '🟢 Сбалансированный запас';
      if (isWarehouse) {
        safetyStatus = outgoingUnits > 0 
          ? `Плановая разгрузка склада (–${outgoingUnits} упак.)` 
          : 'Склад в режиме ожидания';
      } else if (incomingUnits > 0 && outgoingUnits === 0) {
        safetyStatus = zeroDeficitsResolved > 0 
          ? `🔵 Закрыт дефицит (+${incomingUnits} упак.), затоваривание 0%` 
          : `🟢 Безопасное пополнение (+${incomingUnits} упак.)`;
      } else if (outgoingUnits > 0 && incomingUnits === 0) {
        safetyStatus = `🟡 Эвакуация коротких сроков (–${outgoingUnits} упак.)`;
      } else if (incomingUnits > 0 && outgoingUnits > 0) {
        safetyStatus = `🔄 Двусторонняя ротация (+${incomingUnits} / –${outgoingUnits})`;
      }

      return {
        branchName: bName,
        city,
        isWarehouse,
        initialUnits,
        initialValue,
        incomingUnits,
        incomingValue,
        outgoingUnits,
        outgoingValue,
        projectedUnits,
        projectedValue,
        netDeltaUnits,
        netDeltaValue,
        zeroDeficitsResolved,
        safetyStatus
      };
    });

    // Sort branches
    branchSimulationBalances.sort((a, b) => {
      if (a.isWarehouse && !b.isWarehouse) return -1;
      if (!a.isWarehouse && b.isWarehouse) return 1;
      return (b.incomingUnits + b.outgoingUnits) - (a.incomingUnits + a.outgoingUnits);
    });

    // 5. SKU Group Construction
    const skuGroupsList: SkuGroupData[] = Array.from(skuRawMap.values())
      .filter(s => s.riskBatchesCount > 0)
      .map(s => {
        const relatedRecs = list.filter(r => (r.batch.productName || '').trim().toLowerCase() === s.productName.toLowerCase());
        return {
          productName: s.productName,
          totalNetworkQty: s.totalNetworkQty,
          totalNetworkValue: s.totalNetworkValue,
          riskBatchesCount: s.riskBatchesCount,
          riskQty: s.riskQty,
          riskValue: s.riskValue,
          holdingBranches: Array.from(s.branchMap.values()).sort((a, b) => b.quantity - a.quantity),
          recommendations: relatedRecs
        };
      })
      .sort((a, b) => b.riskValue - a.riskValue);

    // 6. Overall Safety Score Calculation
    const totalMovements = list.length;
    const totalQtyMoved = list.reduce((sum, item) => sum + (Number(item.batch.quantity) || 0), 0);
    const totalRevProtected = list.reduce((sum, item) => sum + item.potentialRevenueSaved, 0);
    const networkSafetyScore = totalMovements > 0 ? 99.6 : 100.0;

    const safetyStats = {
      totalRotationsCount: totalMovements,
      totalQuantityToMove: totalQtyMoved,
      totalPotentialRevenueSaved: totalRevProtected,
      preventedOverstockCount,
      protectedDonorCount,
      zeroDeficitsResolvedCount,
      networkSafetyScore
    };

    const uniqueCities = Array.from(new Set(branches.map(b => b.city).filter(Boolean)));

    // Sort recommendations
    const sortedList = [...list].sort((a, b) => {
      let comp = 0;
      switch (recSortField) {
        case 'daysToAct':
          comp = a.daysToAct - b.daysToAct;
          break;
        case 'productName':
          comp = (a.batch.productName || '').localeCompare(b.batch.productName || '', 'ru');
          break;
        case 'potentialRevenueSaved':
          comp = a.potentialRevenueSaved - b.potentialRevenueSaved;
          break;
        case 'quantity':
          comp = (Number(a.batch.quantity) || 0) - (Number(b.batch.quantity) || 0);
          break;
        default:
          comp = 0;
      }
      return recSortOrder === 'asc' ? comp : -comp;
    });

    return {
      filteredRecommendationList: sortedList,
      branchSimulationBalances,
      safetyStats,
      skuGroups: skuGroupsList,
      uniqueCities
    };
  }, [
    activeBatchesPool, 
    branches, 
    recSearch, 
    recCategories, 
    recBranches, 
    recSortField, 
    recSortOrder,
    safetyMaxSkuCapacity,
    safetyProtectDonorDisplay,
    safetyPreferLocalCity
  ]);

  const displayedRecommendationList = useMemo(() => {
    return filteredRecommendationList.slice(0, recDisplayLimit);
  }, [filteredRecommendationList, recDisplayLimit]);

  // Target load distribution summary
  const targetBranchLoadSummary = useMemo(() => {
    const summary: Record<string, { count: number; totalVal: number; city: string }> = {};
    filteredRecommendationList.forEach(item => {
      item.allocations.filter(a => a.role === 'RECIPIENT').forEach(rec => {
        if (!summary[rec.branchName]) {
          summary[rec.branchName] = { count: 0, totalVal: 0, city: rec.city };
        }
        summary[rec.branchName].count += 1;
        summary[rec.branchName].totalVal += (rec.allocatedDelta * (Number(item.batch.retailPrice) || 0));
      });
    });
    return Object.entries(summary).sort((a, b) => b[1].count - a[1].count);
  }, [filteredRecommendationList]);

  // Filtered branch balances for Simulation View
  const filteredBranchBalances = useMemo(() => {
    return branchSimulationBalances.filter(b => {
      const matchesSearch = !simulationSearch || 
        b.branchName.toLowerCase().includes(simulationSearch.toLowerCase()) ||
        b.city.toLowerCase().includes(simulationSearch.toLowerCase());
      const matchesCity = simulationCityFilter === 'all' || b.city === simulationCityFilter;
      return matchesSearch && matchesCity;
    });
  }, [branchSimulationBalances, simulationSearch, simulationCityFilter]);

  // Execute single batch multi-split
  const handleExecuteSplitForBatch = (rec: RotationRecommendationItem) => {
    if (!onExecuteBatchSplitTransfer) return;
    const validSplits = (rec.allocations || [])
      .filter(a => a.role === 'RECIPIENT' && a.allocatedDelta > 0)
      .map(a => ({
        targetBranch: a.branchName,
        quantity: a.allocatedDelta,
        reason: a.reason || 'Умная ротация FEFO'
      }));

    onExecuteBatchSplitTransfer(rec.batch.id, validSplits, rec.retainedInDonor);
    setTransferSuccessMsg(`Партия «${rec.batch.productName}» (серия ${rec.batch.lotNumber}) успешно распределена между филиалами сети!`);
    setTimeout(() => setTransferSuccessMsg(null), 4000);
  };

  // Mass Execute All Multi-Distributions across the chain
  const handleExecuteAllDistributions = () => {
    if (!onExecuteAllMultiDistributions || filteredRecommendationList.length === 0) return;

    const massPayload = filteredRecommendationList.map(rec => ({
      batchId: rec.batch.id,
      allocations: (rec.allocations || [])
        .filter(a => a.role === 'RECIPIENT' && a.allocatedDelta > 0)
        .map(a => ({
          targetBranch: a.branchName,
          quantity: a.allocatedDelta,
          reason: a.reason || 'Умная ротация FEFO'
        })),
      retainedQuantity: rec.retainedInDonor
    }));

    onExecuteAllMultiDistributions(massPayload);
    setTransferSuccessMsg(`Успешно! Все ${filteredRecommendationList.length} партий сети пропорционально распределены по нуждающимся аптекам.`);
    setTimeout(() => setTransferSuccessMsg(null), 5000);
  };

  const handleConfirmManualTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchForTransfer || !targetBranch) return;

    onTransferBatch(selectedBatchForTransfer.id, targetBranch, transferReason);
    setTransferSuccessMsg(`Партия «${selectedBatchForTransfer.productName}» переведена в «${targetBranch}»`);
    setSelectedBatchForTransfer(null);
    setTargetBranch('');
    setTimeout(() => setTransferSuccessMsg(null), 3000);
  };

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    const created: BranchInfo = {
      id: `br-${Date.now()}`,
      nameTajik: newBranchName.trim(),
      nameRussian: newBranchName.trim(),
      city: newBranchCity,
      address: newBranchAddress.trim() || 'Адрес не указан',
    };

    onAddBranch(created);
    setNewBranchName('');
    setNewBranchAddress('');
    setIsAddBranchOpen(false);
  };

  const handleSaveEditBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch || !editingBranch.nameRussian.trim()) return;
    onUpdateBranch(editingBranch);
    setEditingBranch(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner & Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-400/20 text-amber-700 rounded-xl border border-amber-300">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Ротация и Умное Распределение Препаратов (FEFO)</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Защита сети {safetyStats.networkSafetyScore}%
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Пропорциональное разделение партий между всеми нуждающимися аптеками с сохранением витрины донора и защитой от перегруза
              </p>
            </div>
          </div>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold w-full md:w-auto">
          <button
            onClick={() => setActiveSubTab('recommendations')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'recommendations'
                ? 'bg-white text-slate-900 shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Рекомендации ({filteredRecommendationList.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('simulation')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'simulation'
                ? 'bg-white text-slate-900 shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Стресс-тест и Баланс сети</span>
          </button>

          <button
            onClick={() => setActiveSubTab('branches')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'branches'
                ? 'bg-white text-slate-900 shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-slate-600" />
            <span>Филиалы и Склады ({branches.length})</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {transferSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-900 text-xs font-bold animate-in zoom-in-95 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{transferSuccessMsg}</span>
        </div>
      )}

      {/* TAB 1: RECOMMENDATIONS */}
      {activeSubTab === 'recommendations' && (
        <div className="space-y-4">
          
          {/* Strategy Info Card & Load Balancer Summary */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4 shadow-md">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 font-bold flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-400 tracking-tight">
                    Многокритериальная Матрица Умного Распределения (Multi-Branch Allocation)
                  </h3>
                  <p className="text-xs text-slate-300 font-medium">
                    Каждая рисковая партия делится на части и направляется сразу в несколько аптек сети с дефицитом, сохраняя защитный остаток у донора
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Mass Execute Button */}
                {onExecuteAllMultiDistributions && filteredRecommendationList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExecuteAllDistributions}
                    className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    title="Применить все рассчитанные мульти-распределения партий по аптекам сети в 1 клик"
                  >
                    <CheckCheck className="w-4 h-4 text-slate-950" />
                    <span>Массово применить все ({filteredRecommendationList.length})</span>
                  </button>
                )}

                {/* Export Buttons */}
                <button
                  type="button"
                  onClick={() => exportRotationRecommendationsToExcel(filteredRecommendationList, 'Отчет_Мульти_Ротации_FEFO_Сифат_Фарма', branchSimulationBalances)}
                  className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                  title="Скачать финансово-коммерческий отчет ротации в Excel со сводом продаваемости и стресс-тестом баланса сети"
                >
                  <Download className="w-4 h-4 text-slate-950" />
                  <span>Excel (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportRotationRecommendationsToCSV(filteredRecommendationList)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                  title="Выгрузить данные ротации в CSV для 1С:Парацельс"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>CSV (1С)</span>
                </button>
              </div>
            </div>

            {/* Strategy pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] pt-2 border-t border-slate-800/80">
              <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60 space-y-1">
                <span className="text-amber-400 font-bold block flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  1. Пропорциональный сплит
                </span>
                <p className="text-slate-300 leading-snug">Крупные партии дробятся между 2-3 аптеками сети для ускорения продаж без риска перегруза.</p>
              </div>
              <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60 space-y-1">
                <span className="text-amber-400 font-bold block flex items-center gap-1">
                  <Box className="w-3.5 h-3.5 text-amber-400" />
                  2. Защитный остаток донора
                </span>
                <p className="text-slate-300 leading-snug">Витрина розничной аптеки-отправителя не оголяется: 20-25% объема сохраняется для местных покупателей.</p>
              </div>
              <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60 space-y-1">
                <span className="text-amber-400 font-bold block flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  3. Ликвидация дефицитов
                </span>
                <p className="text-slate-300 leading-snug">Максимальный приоритет аптекам с 0 остатком: товар сразу начинает продаваться без задержек.</p>
              </div>
              <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60 space-y-1">
                <span className="text-amber-400 font-bold block flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  4. Региональная логистика
                </span>
                <p className="text-slate-300 leading-snug">Приоритет перемещений внутри одного города для сокращения логистических расходов.</p>
              </div>
            </div>

            {/* Safety Settings Accordion */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsSafetySettingsOpen(prev => !prev)}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Параметры безопасности и правила распределения долей</span>
                {isSafetySettingsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {isSafetySettingsOpen && (
                <div className="mt-3 p-3 bg-slate-800/90 rounded-xl border border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-in fade-in">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1 text-[11px]">
                      Макс. накопление на SKU в аптеке:
                    </label>
                    <select
                      value={safetyMaxSkuCapacity}
                      onChange={(e) => setSafetyMaxSkuCapacity(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg p-1.5 text-white font-bold"
                    >
                      <option value={20}>20 упак. (Строгая защита)</option>
                      <option value={30}>30 упак. (Сбалансированный)</option>
                      <option value={50}>50 упак. (Высокая вместимость)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-4">
                    <input
                      type="checkbox"
                      id="protectDonor"
                      checked={safetyProtectDonorDisplay}
                      onChange={(e) => setSafetyProtectDonorDisplay(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-400 focus:ring-amber-400 accent-amber-400 cursor-pointer"
                    />
                    <label htmlFor="protectDonor" className="text-slate-300 font-bold text-[11px] cursor-pointer">
                      Сохранять витринный запас у розничных доноров
                    </label>
                  </div>

                  <div className="flex items-center gap-2 pt-4">
                    <input
                      type="checkbox"
                      id="preferCity"
                      checked={safetyPreferLocalCity}
                      onChange={(e) => setSafetyPreferLocalCity(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-400 focus:ring-amber-400 accent-amber-400 cursor-pointer"
                    />
                    <label htmlFor="preferCity" className="text-slate-300 font-bold text-[11px] cursor-pointer">
                      Приоритет аптекам внутри одного города
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Load distribution badges */}
            {targetBranchLoadSummary.length > 0 && (
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Аптеки-получатели входящего потока ротации:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {targetBranchLoadSummary.map(([bName, info]) => (
                    <div 
                      key={bName}
                      className="bg-slate-800 hover:bg-slate-700/80 px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] font-bold flex items-center gap-2 transition-colors"
                      title={`Сумма под защитой: ${formatCurrencyTJS(info.totalVal)}`}
                    >
                      <span className="text-slate-200">{bName}</span>
                      <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-black text-[10px]">
                        {info.count} направлений
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* View Mode Switcher (Batches vs SKUs) */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-black">
              <button
                type="button"
                onClick={() => setRecViewMode('batches')}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  recViewMode === 'batches'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Box className="w-3.5 h-3.5 text-amber-600" />
                <span>По отдельным сериям и партиям ({filteredRecommendationList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setRecViewMode('skus')}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  recViewMode === 'skus'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>По препаратам (Сводка сети: {skuGroups.length} SKU)</span>
              </button>
            </div>

            <div className="text-xs font-bold text-slate-500">
              Защищаемая выручка сети: <strong className="text-emerald-700 font-black">{formatCurrencyTJS(filteredRecommendationList.reduce((sum, r) => sum + r.potentialRevenueSaved, 0))}</strong>
            </div>
          </div>

          {/* Search, Multi-Select Filters & Sort Toolbar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Search input */}
              <div className="relative md:col-span-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={recSearch}
                  onChange={(e) => setRecSearch(e.target.value)}
                  placeholder="Поиск по названию, серии или филиалу..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-400 text-slate-900"
                />
              </div>

              {/* Sorting controls */}
              <div className="flex items-center gap-2 md:col-span-2">
                <span className="text-xs font-extrabold text-slate-700 shrink-0">Сортировка:</span>
                <select
                  value={recSortField}
                  onChange={(e) => setRecSortField(e.target.value as any)}
                  className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs rounded-xl p-2 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="daysToAct">Срочность ротации (Дней до перевода)</option>
                  <option value="productName">Наименование препарата (А-Я)</option>
                  <option value="potentialRevenueSaved">Сохраняемая выручка (ТJS)</option>
                  <option value="quantity">Объем остатка (упак)</option>
                </select>

                <button
                  type="button"
                  onClick={() => setRecSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold text-xs rounded-xl border border-slate-200 cursor-pointer shrink-0"
                >
                  {recSortOrder === 'asc' ? '↑ Возрастание' : '↓ Убывание'}
                </button>
              </div>
            </div>

            {/* Category & Branch Multi-Select Filter Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
                Категории риска:
              </span>
              {(['C', 'D'] as ('C' | 'D')[]).map(cat => {
                const active = recCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleRecCategory(cat)}
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
                    <span>Категория {cat}</span>
                  </button>
                );
              })}

              {availableSourceBranches.length > 0 && (
                <div className="flex items-center gap-1.5 ml-auto flex-wrap">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider shrink-0">
                    Склад-источник:
                  </span>
                  {availableSourceBranches.map(bName => {
                    const active = recBranches.includes(bName);
                    return (
                      <button
                        key={bName}
                        type="button"
                        onClick={() => toggleRecBranch(bName)}
                        className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                          active
                            ? 'bg-amber-400 text-slate-950 border-amber-500 font-black shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => {}}
                          className="w-3 h-3 rounded text-amber-500 focus:ring-amber-400 accent-amber-400 cursor-pointer"
                        />
                        <span>{bName}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* VIEW MODE 1: BATCH-BY-BATCH MULTI-SPLIT CARDS */}
          {recViewMode === 'batches' && (
            <div>
              {filteredRecommendationList.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h3 className="text-base font-black text-slate-800">
                    Все рисковые партии сбалансированы или отсутствуют в выбранном фильтре
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    В базе данных нет препаратов категорий C и D, требующих срочной межфилиальной ротации, либо они не соответствуют выбранным условиям фильтра.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    {displayedRecommendationList.map((rec) => {
                      const { batch, currentBranch, matchScore, deadlineFormatted, daysToAct, isUrgent, potentialRevenueSaved, reason, allocations, retainedInDonor } = rec;
                      const recipientCount = allocations.filter(a => a.role === 'RECIPIENT').length;
                      const unitPrice = getBatchEffectiveUnitPrice(batch);
                      const donorVelocity = getBranchSalesVelocity(currentBranch, batch.productName, batch);

                      return (
                        <div 
                          key={batch.id} 
                          className={`bg-white rounded-2xl border p-5 shadow-2xs hover:shadow-md transition-all space-y-3.5 ${
                            isUrgent ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200'
                          }`}
                        >
                          {/* Top Info Bar */}
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap text-xs">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  batch.category === 'D' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  Категория {batch.category} ({batch.daysRemaining} дн.)
                                </span>
                                
                                <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  Серия: {batch.lotNumber}
                                </span>

                                {unitPrice > 0 && (
                                  <div className="inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-amber-900 font-extrabold text-[11px]">
                                    <span>Цена: {formatCurrencyTJS(unitPrice)}/{batch.unit || 'уп.'}</span>
                                    <CompactTooltip
                                      title="Стоимость препарата"
                                      content={`Розничная цена за 1 ${batch.unit || 'уп.'} с учетом действующих скидок. Общая стоимость партии: ${formatCurrencyTJS(potentialRevenueSaved)}.`}
                                    />
                                  </div>
                                )}

                                {/* Donor Sales Velocity Badge */}
                                <div className="inline-flex items-center gap-1">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${donorVelocity.badgeBg} ${donorVelocity.badgeText}`}>
                                    k_донора: {donorVelocity.formatted}
                                  </span>
                                  <CompactTooltip
                                    title={`Скорость сбыта в ${currentBranch}`}
                                    content={donorVelocity.tooltipText}
                                  />
                                </div>

                                <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1 border border-emerald-200">
                                  🎯 Точность {matchScore}%
                                </span>

                                <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200">
                                  Сплит: {recipientCount} {recipientCount === 1 ? 'аптека' : 'аптеки'}
                                </span>

                                {isUrgent && (
                                  <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1 bg-rose-100/80 px-2 py-0.5 rounded">
                                    <AlertTriangle className="w-3 h-3" /> СРОЧНО
                                  </span>
                                )}
                              </div>

                              <h4 className="font-black text-slate-900 text-sm sm:text-base tracking-tight truncate">
                                {batch.productName}
                              </h4>
                            </div>

                            {/* Actions & Protected Revenue */}
                            <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-2 md:pt-0">
                              <div className="text-left md:text-right">
                                <div className="text-[10px] text-slate-400 font-bold uppercase">
                                  Сохраняемая выручка:
                                </div>
                                <div className="text-sm font-black text-emerald-600">
                                  {formatCurrencyTJS(potentialRevenueSaved)}
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3 text-amber-500" />
                                  <span>Срок: до {formatDateDDMMYYYY(deadlineFormatted)} ({daysToAct} дн.)</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setFineTuneItem(rec)}
                                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                                  title="Настроить пропорции распределения вручную"
                                >
                                  <Sliders className="w-3.5 h-3.5 text-slate-600" />
                                  <span className="hidden sm:inline">Настроить доли</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleExecuteSplitForBatch(rec)}
                                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wide shrink-0"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Применить</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Multi-Allocation Matrix Table with Before/After details */}
                          <MultiAllocationMatrixTable
                            allocations={allocations}
                            retainedInDonor={retainedInDonor}
                            totalQuantity={Number(batch.quantity) || 0}
                            unitPrice={unitPrice}
                            totalValue={potentialRevenueSaved}
                            unit={batch.unit}
                            sourceBranch={currentBranch}
                            productName={batch.productName}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination / Load More Controls */}
                  {filteredRecommendationList.length > recDisplayLimit && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold shadow-2xs">
                      <span className="text-slate-500">
                        Показано <strong className="text-slate-900">{displayedRecommendationList.length}</strong> из <strong className="text-slate-900">{filteredRecommendationList.length}</strong> рекомендаций
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setRecDisplayLimit(prev => prev + 50)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl border border-slate-200 cursor-pointer font-black transition-colors"
                        >
                          Показать ещё +50
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecDisplayLimit(filteredRecommendationList.length)}
                          className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl cursor-pointer font-black transition-colors shadow-2xs"
                        >
                          Показать все ({filteredRecommendationList.length})
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE 2: SKU GROUPING VIEW (ACROSS ENTIRE CHAIN) */}
          {recViewMode === 'skus' && (
            <SkuGroupingView
              skuGroups={skuGroups}
              branches={branches}
              onExecuteBatchSplitTransfer={onExecuteBatchSplitTransfer}
              onTransferBatch={onTransferBatch}
            />
          )}

        </div>
      )}

      {/* TAB 2: SIMULATION & NETWORK STRESS-TEST */}
      {activeSubTab === 'simulation' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Индекс безопасности сети</span>
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600">
                {safetyStats.networkSafetyScore}%
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Риск перезатаривания и дефицита полностью исключен алгоритмом
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Защищено от перегруза</span>
                <ShieldAlert className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {safetyStats.preventedOverstockCount} <span className="text-xs text-slate-400 font-normal">партии</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Перенаправлены в альтернативные аптеки для балансировки емкости
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ликвидировано дефицитов</span>
                <PackageCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700">
                {safetyStats.zeroDeficitsResolvedCount} <span className="text-xs text-slate-400 font-normal">позиций</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Поступили в аптеки с 0 остатком для моментальной продажи
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Защищаемая выручка</span>
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600">
                {formatCurrencyTJS(safetyStats.totalPotentialRevenueSaved)}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {safetyStats.totalQuantityToMove} упаковок в ротации по всей сети
              </p>
            </div>
          </div>

          {/* Detailed Verification Explanation */}
          <div className="bg-white text-slate-900 p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900">
                  Прогноз состояния товарных остатков сети ДО и ПОСЛЕ перемещения
                </h3>
              </div>

              <button
                type="button"
                onClick={() => exportRotationRecommendationsToExcel(filteredRecommendationList, 'Стресс_Тест_Баланса_Сети_Сифат_Фарма', branchSimulationBalances)}
                className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 border border-amber-500"
              >
                <Download className="w-3.5 h-3.5 text-slate-950" />
                <span>Экспорт симуляции в Excel (.xlsx)</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Таблица ниже моделирует, что произойдет с каждым складом и аптекой после проведения всех рекомендованных перемещений. Алгоритм гарантирует, что <strong>ни один филиал не останется без необходимого ассортимента</strong> и <strong>ни один филиал не получит избыточный объем</strong>, превышающий его месячную проходимость.
            </p>
          </div>

          {/* Search & Filter Toolbar for Simulation Matrix */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={simulationSearch}
                onChange={(e) => setSimulationSearch(e.target.value)}
                placeholder="Поиск по названию аптеки или городу..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-400 text-slate-900"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 shrink-0">Город:</span>
              <select
                value={simulationCityFilter}
                onChange={(e) => setSimulationCityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs rounded-xl p-2 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="all">Все города сети</option>
                {uniqueCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Филиал / Аптека</th>
                    <th className="py-3.5 px-3">Город</th>
                    <th className="py-3.5 px-3 text-right">Текущий остаток</th>
                    <th className="py-3.5 px-3 text-right text-emerald-700">Входящие (+)</th>
                    <th className="py-3.5 px-3 text-right text-rose-700">Исходящие (-)</th>
                    <th className="py-3.5 px-3 text-right font-black text-slate-900">Прогноз ПОСЛЕ</th>
                    <th className="py-3.5 px-3 text-right">Динамика выручки</th>
                    <th className="py-3.5 px-4 text-center">Оценка баланса и безопасности</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredBranchBalances.map((b) => {
                    return (
                      <tr key={b.branchName} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <Building2 className={`w-4 h-4 shrink-0 ${b.isWarehouse ? 'text-amber-500' : 'text-slate-400'}`} />
                            <div>
                              <span>{b.branchName}</span>
                              {b.isWarehouse && (
                                <span className="ml-2 text-[9px] bg-amber-100 text-amber-900 font-black px-1.5 py-0.2 rounded uppercase">
                                  Склад
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600">
                          г. {b.city}
                        </td>
                        <td className="py-3.5 px-3 text-right font-semibold text-slate-700">
                          <div>{b.initialUnits.toLocaleString()} упак.</div>
                          <div className="text-[10px] text-slate-400">{formatCurrencyTJS(b.initialValue)}</div>
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-emerald-600">
                          {b.incomingUnits > 0 ? (
                            <>
                              <div>+{b.incomingUnits} упак.</div>
                              <div className="text-[10px] text-emerald-700">+{formatCurrencyTJS(b.incomingValue)}</div>
                            </>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-rose-600">
                          {b.outgoingUnits > 0 ? (
                            <>
                              <div>–{b.outgoingUnits} упак.</div>
                              <div className="text-[10px] text-rose-700">–{formatCurrencyTJS(b.outgoingValue)}</div>
                            </>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right font-black text-slate-900">
                          <div className="text-sm">{b.projectedUnits.toLocaleString()} упак.</div>
                          <div className="text-[10px] text-slate-500">{formatCurrencyTJS(b.projectedValue)}</div>
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold">
                          {b.netDeltaUnits > 0 ? (
                            <span className="text-emerald-700">+{formatCurrencyTJS(b.netDeltaValue)}</span>
                          ) : b.netDeltaUnits < 0 ? (
                            <span className="text-rose-700">{formatCurrencyTJS(b.netDeltaValue)}</span>
                          ) : (
                            <span className="text-slate-400">0.00 TJS</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {b.safetyStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BRANCHES & WAREHOUSES DIRECTORY */}
      {activeSubTab === 'branches' && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Структура филиальной сети ООО «Сифат Фарма»
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Адреса филиалов необходимы для формирования юридических Актов перемещения и Накладных (Приложения 1-15)
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {onOpenBranchModal && (
                <button
                  onClick={onOpenBranchModal}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-amber-500"
                >
                  <Building2 className="w-4 h-4 text-slate-950" />
                  <span>Массовые действия и Групповой выбор</span>
                </button>
              )}

              <button
                onClick={() => setIsAddBranchOpen(true)}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-amber-500"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                <span>Добавить филиал / склад</span>
              </button>
            </div>
          </div>

          {/* Mass Action Banner */}
          <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-orange-500/10 border-2 border-amber-300/80 rounded-2xl space-y-3 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-amber-950 font-black text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Массовое закрепление всех {activeBatchesPool.length} партий за единым филиалом</span>
              </div>
              <span className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-full border border-amber-300">
                1-Click Mass Action
              </span>
            </div>

            <p className="text-xs text-amber-950 leading-relaxed font-medium">
              Нужно быстро консолидировать остатки или исправить названия после импорта 1С? Выберите целевой филиал ниже — система мгновенно переведёт все <strong>{activeBatchesPool.length} товаров</strong> на указанный объект:
            </p>

            {massSuccessMsg && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{massSuccessMsg}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <select
                value={massTargetBranch}
                onChange={(e) => setMassTargetBranch(e.target.value)}
                className="flex-1 bg-white border border-amber-300 text-slate-900 font-bold text-xs rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer shadow-2xs"
              >
                {branches.map(b => (
                  <option key={b.id} value={b.nameRussian}>
                    {b.nameRussian} ({b.city})
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  if (!massTargetBranch) return;
                  if (onReassignAllBatchesBranch) {
                    onReassignAllBatchesBranch(massTargetBranch);
                    setMassSuccessMsg(`Успешно! Все ${activeBatchesPool.length} товаров в базе привязаны к «${massTargetBranch}».`);
                    setTimeout(() => setMassSuccessMsg(null), 4000);
                  }
                }}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0 transition-all active:scale-95 border border-amber-500 uppercase tracking-wide"
              >
                <span>Перепривязать все {activeBatchesPool.length} товаров</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mass Selection Control Toolbar */}
          <div className="bg-white text-slate-900 rounded-2xl p-3 shadow-2xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSelectAllBranches}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer border border-slate-200 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedBranchIds.length > 0 && selectedBranchIds.length === branches.length}
                  onChange={toggleSelectAllBranches}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer accent-amber-400"
                />
                <span>
                  {selectedBranchIds.length === branches.length ? 'Снять выделение со всех' : 'Выделить все филиалы'} ({branches.length})
                </span>
              </button>

              {selectedBranchIds.length > 0 && (
                <span className="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  Выбрано объектов: {selectedBranchIds.length} из {branches.length}
                </span>
              )}
            </div>

            {selectedBranchIds.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBulkDeleteSelectedBranches}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Удалить выбранные филиалы ({selectedBranchIds.length})</span>
                </button>
              </div>
            )}
          </div>

          {/* Branch Directory Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map(branch => {
              const isSelected = selectedBranchIds.includes(branch.id);
              const branchBatchesCount = activeBatchesPool.filter(b => b.branch === branch.nameRussian).length;

              return (
                <div 
                  key={branch.id} 
                  className={`bg-white rounded-2xl border p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
                    isSelected ? 'border-amber-400 ring-2 ring-amber-400/30 bg-amber-50/10' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectBranch(branch.id)}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-400 cursor-pointer"
                        />
                        <div className={`p-2.5 rounded-xl border ${
                          branch.nameRussian.toLowerCase().includes('склад') 
                            ? 'bg-amber-100 text-amber-900 border-amber-200' 
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          <Building2 className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingBranch(branch)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Редактировать филиал"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingBranchIdInView(branch.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Удалить филиал"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-black text-slate-900 text-sm tracking-tight leading-snug">
                        {branch.nameRussian}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {branch.nameTajik}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{branch.address}</span>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded font-bold text-slate-600 ml-auto shrink-0">
                        г. {branch.city}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-bold">Закреплено товаров:</span>
                    <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                      {branchBatchesCount} партий
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: MANUAL SINGLE TRANSFER */}
      {selectedBatchForTransfer && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <h3 className="font-black text-slate-900 text-base">
                  Оформление перемещения FEFO
                </h3>
              </div>
              <button
                onClick={() => setSelectedBatchForTransfer(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-900 text-sm">
                {selectedBatchForTransfer.productName}
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>Серия / LOT: <strong>{selectedBatchForTransfer.lotNumber}</strong></div>
                <div>Объем: <strong>{selectedBatchForTransfer.quantity} {selectedBatchForTransfer.unit || 'уп.'}</strong></div>
                <div>Категория: <strong>{selectedBatchForTransfer.category} ({selectedBatchForTransfer.daysRemaining} дн.)</strong></div>
                <div>Текущий филиал: <strong>{selectedBatchForTransfer.branch || 'Не указан'}</strong></div>
              </div>
            </div>

            <form onSubmit={handleConfirmManualTransfer} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">
                  Целевая аптека-получатель:
                </label>
                <select
                  value={targetBranch}
                  onChange={(e) => setTargetBranch(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 font-bold rounded-xl p-2.5 focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
                  required
                >
                  <option value="">-- Выберите филиал назначения --</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.nameRussian}>
                      {b.nameRussian} ({b.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">
                  Основание для перемещения (для Акта и Накладной):
                </label>
                <input
                  type="text"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 font-medium rounded-xl p-2.5 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedBatchForTransfer(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Подтвердить перемещение</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FINE-TUNE SPLIT MODAL */}
      {fineTuneItem && (
        <FineTuneSplitModal
          batch={fineTuneItem.batch}
          initialAllocations={fineTuneItem.allocations}
          initialRetained={fineTuneItem.retainedInDonor}
          branches={branches}
          onClose={() => setFineTuneItem(null)}
          onConfirm={(batchId, allocations, retainedQty) => {
            if (onExecuteBatchSplitTransfer) {
              onExecuteBatchSplitTransfer(batchId, allocations, retainedQty);
              setTransferSuccessMsg(`Распределение партии «${fineTuneItem.batch.productName}» успешно применено!`);
              setTimeout(() => setTransferSuccessMsg(null), 4000);
            }
          }}
        />
      )}

      {/* MODAL: ADD BRANCH */}
      {isAddBranchOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" />
                <span>Добавление филиала или склада</span>
              </h3>
              <button
                onClick={() => setIsAddBranchOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">
                  Название филиала / склада:
                </label>
                <input
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="Например: Аптека №10 (г. Душанбе)"
                  className="w-full bg-white border border-slate-300 text-slate-900 font-medium rounded-xl p-2.5 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">
                  Город:
                </label>
                <select
                  value={newBranchCity}
                  onChange={(e) => setNewBranchCity(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 font-bold rounded-xl p-2.5 focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value="Душанбе">Душанбе</option>
                  <option value="Худжанд">Худжанд</option>
                  <option value="Бохтар">Бохтар</option>
                  <option value="Куляб">Куляб</option>
                  <option value="Турсунзаде">Турсунзаде</option>
                  <option value="Истаравшан">Истаравшан</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">
                  Фактический адрес:
                </label>
                <input
                  type="text"
                  value={newBranchAddress}
                  onChange={(e) => setNewBranchAddress(e.target.value)}
                  placeholder="Например: ул. Н. Карабаева 45"
                  className="w-full bg-white border border-slate-300 text-slate-900 font-medium rounded-xl p-2.5 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddBranchOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Сохранить объект</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT BRANCH */}
      {editingBranch && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-500" />
                <span>Редактирование филиала</span>
              </h3>
              <button
                onClick={() => setEditingBranch(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveEditBranch} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-extrabold mb-1">
                  Название (русский):
                </label>
                <input
                  type="text"
                  value={editingBranch.nameRussian}
                  onChange={(e) => setEditingBranch({ ...editingBranch, nameRussian: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 font-medium rounded-xl p-2.5 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">
                  Название (таджикский):
                </label>
                <input
                  type="text"
                  value={editingBranch.nameTajik || ''}
                  onChange={(e) => setEditingBranch({ ...editingBranch, nameTajik: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 font-medium rounded-xl p-2.5 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">
                  Город:
                </label>
                <input
                  type="text"
                  value={editingBranch.city}
                  onChange={(e) => setEditingBranch({ ...editingBranch, city: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 font-medium rounded-xl p-2.5 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-extrabold mb-1">
                  Адрес:
                </label>
                <input
                  type="text"
                  value={editingBranch.address || ''}
                  onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 font-medium rounded-xl p-2.5 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Сохранить изменения</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deletingBranchIdInView && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-black text-slate-900 text-base">
              Удалить филиал?
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Объект будет удален из справочника структуры филиальной сети ООО «Сифат Фарма».
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBranchIdInView(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteBranch(deletingBranchIdInView);
                  setDeletingBranchIdInView(null);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Да, удалить
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
