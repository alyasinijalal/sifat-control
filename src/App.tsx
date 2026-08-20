import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header, UiScaleType } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { QuarantineView } from './components/QuarantineView';
import { ImportView } from './components/ImportView';
import { AnnexesView } from './components/AnnexesView';
import { AuditLogView } from './components/AuditLogView';
import { TransfersView } from './components/TransfersView';
import { BatchModal } from './components/BatchModal';
import { DataResetModal } from './components/DataResetModal';
import { BranchManagementModal } from './components/BranchManagementModal';
import { FontSwitcherModal } from './components/FontSwitcherModal';
import { SettingsView, FefoSettings } from './components/SettingsView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LicenseModal } from './components/LicenseModal';
import { fetchSystemHWID, getSavedLicense, isLicenseValid } from './utils/licenseUtils';
import { AVAILABLE_FONTS, NUMBER_FONT_PRESETS, FontWeightLevel } from './utils/fontPresets';

import { 
  INITIAL_BATCHES, 
  INITIAL_COMMISSION_MEMBERS, 
  BRANCHES_LIST,
  CURRENT_REF_DATE 
} from './data/initialData';
import { MedicationBatch, CategoryType, AuditLogItem, BranchInfo, UserProfile, CommissionMember } from './types';
import { processBatch, isDisposalBranch } from './utils/categoryUtils';
import { saveBatchesToDB, loadBatchesFromDB, clearAllBatchesFromDB, saveMetaToDB, loadMetaFromDB } from './utils/dbStorage';

export interface HistoryItem {
  id: string;
  description: string;
  batches: MedicationBatch[];
  auditLogs: AuditLogItem[];
  branches: BranchInfo[];
  timestamp: string;
}

export default function App() {
  const [isLicensed, setIsLicensed] = useState<boolean>(false);
  const [checkingLicense, setCheckingLicense] = useState<boolean>(true);

  useEffect(() => {
    async function verifyDeviceLicense() {
      try {
        const hwid = await fetchSystemHWID();
        const savedKey = getSavedLicense();
        if (savedKey && isLicenseValid(hwid, savedKey)) {
          setIsLicensed(true);
        } else {
          setIsLicensed(false);
        }
      } catch {
        setIsLicensed(false);
      } finally {
        setCheckingLicense(false);
      }
    }
    verifyDeviceLicense();
  }, []);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<CategoryType | 'ALL'>('ALL');

  // Accessibility UI Scale State (for young vs elderly users)
  const [uiScale, setUiScale] = useState<UiScaleType>(() => {
    const saved = localStorage.getItem('sifat_farma_ui_scale');
    if (saved === 'compact' || saved === 'normal' || saved === 'large' || saved === 'xlarge') {
      return saved as UiScaleType;
    }
    return 'normal';
  });

  // Typography Font & Weight Customization State
  const [currentFontId, setCurrentFontId] = useState<string>(() => {
    return localStorage.getItem('sifat_farma_font_family_id') || 'montserrat';
  });

  const [currentNumberFontId, setCurrentNumberFontId] = useState<string>(() => {
    return localStorage.getItem('sifat_farma_num_font_id') || 'outfit';
  });

  const [currentWeight, setCurrentWeight] = useState<FontWeightLevel>(() => {
    const saved = localStorage.getItem('sifat_farma_font_weight');
    if (saved === 'light' || saved === 'normal' || saved === 'medium' || saved === 'bold') {
      return saved as FontWeightLevel;
    }
    return 'normal';
  });

  const [isFontModalOpen, setIsFontModalOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('sifat_farma_font_family_id', currentFontId);
    const foundFont = AVAILABLE_FONTS.find(f => f.id === currentFontId) || AVAILABLE_FONTS[0];
    if (foundFont) {
      document.documentElement.style.setProperty('--app-font-family', foundFont.fontFamily);
    }
  }, [currentFontId]);

  useEffect(() => {
    localStorage.setItem('sifat_farma_num_font_id', currentNumberFontId);
    const foundNum = NUMBER_FONT_PRESETS.find(f => f.id === currentNumberFontId) || NUMBER_FONT_PRESETS[0];
    if (foundNum) {
      document.documentElement.style.setProperty('--app-font-mono', foundNum.family);
    }
  }, [currentNumberFontId]);

  useEffect(() => {
    localStorage.setItem('sifat_farma_font_weight', currentWeight);
    document.documentElement.classList.remove('weight-light', 'weight-normal', 'weight-medium', 'weight-bold');
    document.documentElement.classList.add(`weight-${currentWeight}`);
  }, [currentWeight]);

  useEffect(() => {
    localStorage.setItem('sifat_farma_ui_scale', uiScale);
    
    // Set root HTML font size to dynamically scale ALL rem-based typography and Tailwind UI elements
    const root = document.documentElement;
    switch (uiScale) {
      case 'compact':
        root.style.fontSize = '14px'; // 87.5% - compact layout
        break;
      case 'normal':
        root.style.fontSize = '16px'; // 100% - standard baseline
        break;
      case 'large':
        root.style.fontSize = '19px'; // 118.75% - enlarged text & buttons
        break;
      case 'xlarge':
        root.style.fontSize = '22px'; // 137.5% - extra large for elderly/visually impaired
        break;
    }
  }, [uiScale]);

  // History & Undo Stack State
  const [historyStack, setHistoryStack] = useState<HistoryItem[]>([]);
  const [undoToast, setUndoToast] = useState<string | null>(null);

  const pushHistory = (description: string) => {
    const timeStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const snapshot: HistoryItem = {
      id: `hist-${Date.now()}`,
      description,
      batches: [...batches],
      auditLogs: [...auditLogs],
      branches: [...branches],
      timestamp: timeStr,
    };
    const maxHistory = batches.length > 5000 ? 2 : 10;
    setHistoryStack(prev => [snapshot, ...prev].slice(0, maxHistory));
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const [lastItem, ...restHistory] = historyStack;
    setBatches(lastItem.batches);
    setAuditLogs(lastItem.auditLogs);
    setBranches(lastItem.branches);
    setHistoryStack(restHistory);

    setUndoToast(`Действие отменено: «${lastItem.description}»`);
    setTimeout(() => {
      setUndoToast(null);
    }, 3500);
  };

  // Persistent User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('sifat_farma_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse user profile:', e);
      }
    }
    return {
      fullName: '',
      position: 'Провизор-Инспектор СМК ISO 9001 / GDP',
      organization: 'ООО «Сифат Фарма»',
      gdpCertificate: 'TAJ-GDP-2026-9001',
      directorName: '',
    };
  });

  // Persistent Commission Members State
  const [commissionMembers, setCommissionMembers] = useState<CommissionMember[]>(() => {
    const saved = localStorage.getItem('sifat_farma_commission_members');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse commission members:', e);
      }
    }
    return INITIAL_COMMISSION_MEMBERS;
  });

  const DUMMY_UNWANTED_BRANCHES = [
    'Аптека №1 (г. Душанбе)',
    'Аптека №2 (г. Худжанд)',
    'Аптека №3 (г. Худжанд)',
    'Аптека №5 (г. Бохтар)',
    'Косметический магазин (г. Душанбе)'
  ];

  const cleanBranchesList = (list: BranchInfo[]): BranchInfo[] => {
    const filtered = list.filter(b => !DUMMY_UNWANTED_BRANCHES.includes(b.nameRussian));
    return filtered.length > 0 ? filtered : BRANCHES_LIST;
  };

  // Helper to sanitize obsolete branch names
  const sanitizeBranchName = (name: string): string => {
    if (!name || DUMMY_UNWANTED_BRANCHES.includes(name)) {
      return 'Центральный склад (г. Душанбе)';
    }
    return name;
  };

  // Persistent Branches State
  const [branches, setBranches] = useState<BranchInfo[]>(() => {
    const saved = localStorage.getItem('sifat_farma_branches');
    if (saved) {
      try {
        const parsed: BranchInfo[] = JSON.parse(saved);
        const cleaned = cleanBranchesList(parsed);
        if (cleaned.length > 0) return cleaned;
      } catch (e) {
        console.error('Failed to parse saved branches:', e);
      }
    }
    return BRANCHES_LIST;
  });

  // Helper to identify legacy demo batches
  const isLegacyDemoBatch = (b: any) => {
    if (!b) return false;
    const id = String(b.id || '');
    const lot = String(b.lotNumber || '');
    return id === 'p-101' || id === 'p-102' || id === 'p-201' || id === 'p-202' || 
           id === 'p-301' || id === 'p-302' || id === 'p-401' || id === 'p-402' || 
           id === 'p-501' || id === 'p-502' || id === 'p-503' ||
           lot.startsWith('LOT-2024-AMX') || lot.startsWith('LOT-2024-NZV') || 
           lot.startsWith('LOT-2024-CFT') || lot.startsWith('LOT-2025-VCH') ||
           lot.startsWith('LOT-2025-PCM') || lot.startsWith('LOT-2025-KTN');
  };

  // Persistent Batches State
  const [batches, setBatches] = useState<MedicationBatch[]>(() => {
    const saved = localStorage.getItem('sifat_farma_batches');
    if (saved) {
      try {
        const parsed: MedicationBatch[] = JSON.parse(saved);
        const filtered = parsed.filter(b => !isLegacyDemoBatch(b));
        return filtered.map(b => ({
          ...b,
          branch: sanitizeBranchName(b.branch),
        }));
      } catch (e) {
        console.error('Failed to parse saved batches:', e);
      }
    }
    return [];
  });

  // Modal State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [editingBatch, setEditingBatch] = useState<MedicationBatch | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState<boolean>(false);

  // Sidebar mobile drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // SMK Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => {
    const saved = localStorage.getItem('sifat_farma_audit_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved audit logs:', e);
      }
    }
    return [];
  });

  // One-time auto-wipe of old demo data for clean production release
  useEffect(() => {
    const isCleaned = localStorage.getItem('sifat_farma_clean_prod_v2');
    if (!isCleaned) {
      localStorage.removeItem('sifat_farma_batches');
      clearAllBatchesFromDB();
      setBatches([]);
      localStorage.setItem('sifat_farma_clean_prod_v2', 'true');
    }
  }, []);

  // Async load from IndexedDB on app startup
  useEffect(() => {
    const isCleaned = localStorage.getItem('sifat_farma_clean_prod_v2');
    if (!isCleaned) return;

    loadBatchesFromDB().then(dbBatches => {
      if (dbBatches && Array.isArray(dbBatches)) {
        const filtered = dbBatches.filter((b: any) => !isLegacyDemoBatch(b));
        setBatches(filtered.map((b: any) => ({
          ...b,
          branch: sanitizeBranchName(b.branch),
        })));
      }
    });
    loadMetaFromDB('sifat_farma_branches').then(dbBranches => {
      if (dbBranches && Array.isArray(dbBranches) && dbBranches.length > 0) {
        setBranches(cleanBranchesList(dbBranches));
      }
    });
  }, []);

  // Save to IndexedDB & LocalStorage on updates
  useEffect(() => {
    saveBatchesToDB(batches);
  }, [batches]);

  useEffect(() => {
    try {
      localStorage.setItem('sifat_farma_audit_logs', JSON.stringify(auditLogs.slice(0, 500)));
    } catch (e) {
      console.warn('LocalStorage audit logs quota exceeded');
    }
  }, [auditLogs]);

  useEffect(() => {
    saveMetaToDB('sifat_farma_branches', branches);
    try {
      localStorage.setItem('sifat_farma_branches', JSON.stringify(branches));
    } catch (e) {
      console.warn('LocalStorage branches quota exceeded');
    }
  }, [branches]);

  useEffect(() => {
    localStorage.setItem('sifat_farma_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('sifat_farma_commission_members', JSON.stringify(commissionMembers));
  }, [commissionMembers]);

  // Persistent FEFO System Settings State
  const [fefoSettings, setFefoSettings] = useState<FefoSettings>(() => {
    const saved = localStorage.getItem('sifat_farma_fefo_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse fefo settings:', e);
      }
    }
    return {
      catBDays: 180,
      catCDays: 120,
      catDDays: 60,
      catBDiscount: 10,
      catCDiscount: 20,
      catDDiscount: 50,
      requireOperatorApproval: true,
      paracelsusPrefix: '100',
      currencySymbol: 'TJS',
    };
  });

  const handleSaveFefoSettings = (newSettings: FefoSettings) => {
    setFefoSettings(newSettings);
    localStorage.setItem('sifat_farma_fefo_settings', JSON.stringify(newSettings));
  };

  const handleImportBackup = (importedData: { batches?: MedicationBatch[]; branches?: BranchInfo[]; auditLogs?: AuditLogItem[] }) => {
    pushHistory('Импорт резервной копии БД');
    if (importedData.batches) {
      setBatches(importedData.batches);
    }
    if (importedData.branches) {
      setBranches(importedData.branches);
    }
    if (importedData.auditLogs) {
      setAuditLogs(importedData.auditLogs);
    }
  };

  // Branch CRUD handlers
  const handleAddBranch = (newBranch: BranchInfo) => {
    setBranches(prev => [...prev, newBranch]);
  };

  const handleDeleteBranch = (branchId: string) => {
    setBranches(prev => prev.filter(b => b.id !== branchId));
  };

  const handleUpdateBranch = (updatedBranch: BranchInfo) => {
    setBranches(prev => prev.map(b => b.id === updatedBranch.id ? updatedBranch : b));
  };

  const handleReassignAllBatchesBranch = (targetBranchName: string) => {
    pushHistory(`Привязка всех товаров к «${targetBranchName}»`);
    setBatches(prev => prev.map(b => ({
      ...b,
      branch: targetBranchName,
    })));
    const nowTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const log: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: nowTime,
      batchId: 'REASSIGN_BRANCH',
      productName: 'Массовая привязка всех товаров',
      lotNumber: `${batches.length} партий`,
      action: 'UPDATE',
      performedBy: 'Провизор-Инспектор (Каримов Р. Н.)',
      details: `Массовая перепривязка всех ${batches.length} товаров на единый филиал/склад: «${targetBranchName}»`,
      newValue: targetBranchName,
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  // Inter-branch Transfer Handler
  const handleTransferBatch = (batchId: string, targetBranch: string, reason: string) => {
    const target = batches.find(b => b.id === batchId);
    pushHistory(`Перемещение «${target?.productName || 'партия'}»`);
    const nowTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
    let targetBatchName = '';
    let targetLot = '';
    let oldBranch = '';

    setBatches(prev => prev.map(b => {
      if (b.id === batchId) {
        targetBatchName = b.productName;
        targetLot = b.lotNumber;
        oldBranch = b.branch;
        return {
          ...b,
          branch: targetBranch,
          lastModifiedDate: nowTime,
          modifiedBy: 'Провизор-Инспектор (Каримов Р. Н.)',
          notes: b.notes ? `${b.notes} | Перемещено из ${oldBranch} в ${targetBranch}` : `Перемещено из ${oldBranch} в ${targetBranch}`,
        };
      }
      return b;
    }));

    const newLog: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: nowTime,
      batchId,
      productName: targetBatchName,
      lotNumber: targetLot,
      action: 'TRANSFER',
      performedBy: 'Заведующий складом (Каримов Р. Н.)',
      details: `Внутреннее перемещение FEFO: из «${oldBranch}» в «${targetBranch}». Причина: ${reason}`,
      oldValue: oldBranch,
      newValue: targetBranch,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Smart Multi-Destination Split Transfer Handler
  const handleExecuteBatchSplitTransfer = (
    batchId: string,
    allocations: { targetBranch: string; quantity: number; reason: string }[],
    retainedQuantity: number
  ) => {
    const originalBatch = batches.find(b => b.id === batchId);
    if (!originalBatch) return;

    pushHistory(`Умное распределение «${originalBatch.productName}» по аптекам`);
    const nowTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const donorBranch = originalBatch.branch;

    const newBatchesToAdd: MedicationBatch[] = [];
    const newLogsToAdd: AuditLogItem[] = [];

    allocations.forEach((alloc, idx) => {
      if (alloc.quantity <= 0 || alloc.targetBranch === donorBranch) return;

      const childBatchId = `batch-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`;
      const childBatch: MedicationBatch = {
        ...originalBatch,
        id: childBatchId,
        branch: alloc.targetBranch,
        quantity: alloc.quantity,
        initialQuantity: alloc.quantity,
        lastModifiedDate: nowTime,
        modifiedBy: 'Провизор-Инспектор (Каримов Р. Н.)',
        notes: originalBatch.notes
          ? `${originalBatch.notes} | Ротация из ${donorBranch} (+${alloc.quantity} уп.)`
          : `Ротация из ${donorBranch} (+${alloc.quantity} уп.)`,
      };
      newBatchesToAdd.push(childBatch);

      newLogsToAdd.push({
        id: `log-${Date.now()}-${idx}`,
        timestamp: nowTime,
        batchId: childBatchId,
        productName: originalBatch.productName,
        lotNumber: originalBatch.lotNumber,
        action: 'TRANSFER',
        performedBy: 'Заведующий складом / Провизор-Инспектор',
        details: `Умная ротация FEFO: распределено ${alloc.quantity} уп. из «${donorBranch}» в «${alloc.targetBranch}». Причина: ${alloc.reason}`,
        oldValue: `${donorBranch} (${originalBatch.quantity} уп.)`,
        newValue: `${alloc.targetBranch} (${alloc.quantity} уп.)`,
      });
    });

    setBatches(prev => {
      const updated = prev.map(b => {
        if (b.id === batchId) {
          return {
            ...b,
            quantity: retainedQuantity,
            lastModifiedDate: nowTime,
            modifiedBy: 'Провизор-Инспектор (Каримов Р. Н.)',
            notes: b.notes
              ? `${b.notes} | Частичное распределение: оставлено ${retainedQuantity} уп.`
              : `Частичное распределение: оставлено ${retainedQuantity} уп.`,
          };
        }
        return b;
      }).filter(b => b.quantity > 0);

      return [...updated, ...newBatchesToAdd];
    });

    if (newLogsToAdd.length > 0) {
      setAuditLogs(prev => [...newLogsToAdd, ...prev]);
    }
  };

  // Bulk Multi-Distribution Handler
  const handleExecuteAllMultiDistributions = (
    distributions: { batchId: string; allocations: { targetBranch: string; quantity: number; reason: string }[]; retainedQuantity: number }[]
  ) => {
    if (!distributions || distributions.length === 0) return;

    pushHistory(`Массовое распределение FEFO (${distributions.length} партий)`);
    const nowTime = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const newBatchesToAdd: MedicationBatch[] = [];
    const newLogsToAdd: AuditLogItem[] = [];
    const batchUpdatesMap = new Map<string, number>();

    distributions.forEach((dist, distIdx) => {
      const originalBatch = batches.find(b => b.id === dist.batchId);
      if (!originalBatch) return;

      batchUpdatesMap.set(dist.batchId, dist.retainedQuantity);
      const donorBranch = originalBatch.branch;

      dist.allocations.forEach((alloc, allocIdx) => {
        if (alloc.quantity <= 0 || alloc.targetBranch === donorBranch) return;

        const childBatchId = `batch-${Date.now()}-${distIdx}-${allocIdx}-${Math.random().toString(36).substr(2, 4)}`;
        const childBatch: MedicationBatch = {
          ...originalBatch,
          id: childBatchId,
          branch: alloc.targetBranch,
          quantity: alloc.quantity,
          initialQuantity: alloc.quantity,
          lastModifiedDate: nowTime,
          modifiedBy: 'Провизор-Инспектор (Каримов Р. Н.)',
          notes: originalBatch.notes
            ? `${originalBatch.notes} | Ротация из ${donorBranch} (+${alloc.quantity} уп.)`
            : `Ротация из ${donorBranch} (+${alloc.quantity} уп.)`,
        };
        newBatchesToAdd.push(childBatch);

        newLogsToAdd.push({
          id: `log-${Date.now()}-${distIdx}-${allocIdx}`,
          timestamp: nowTime,
          batchId: childBatchId,
          productName: originalBatch.productName,
          lotNumber: originalBatch.lotNumber,
          action: 'TRANSFER',
          performedBy: 'Заведующий складом / Провизор-Инспектор',
          details: `Массовая ротация FEFO: ${alloc.quantity} уп. из «${donorBranch}» в «${alloc.targetBranch}». Причина: ${alloc.reason}`,
          oldValue: `${donorBranch} (${originalBatch.quantity} уп.)`,
          newValue: `${alloc.targetBranch} (${alloc.quantity} уп.)`,
        });
      });
    });

    setBatches(prev => {
      const updated = prev.map(b => {
        if (batchUpdatesMap.has(b.id)) {
          const retained = batchUpdatesMap.get(b.id)!;
          return {
            ...b,
            quantity: retained,
            lastModifiedDate: nowTime,
            modifiedBy: 'Провизор-Инспектор (Каримов Р. Н.)',
            notes: b.notes
              ? `${b.notes} | Частичное распределение: оставлено ${retained} уп.`
              : `Частичное распределение: оставлено ${retained} уп.`,
          };
        }
        return b;
      }).filter(b => b.quantity > 0);

      return [...updated, ...newBatchesToAdd];
    });

    if (newLogsToAdd.length > 0) {
      setAuditLogs(prev => [...newLogsToAdd, ...prev]);
    }
  };

  // Clear Database completely
  const handleClearAllData = () => {
    pushHistory(`Очистка базы данных (${batches.length} партий)`);
    setBatches([]);
    localStorage.removeItem('sifat_farma_batches');
    saveBatchesToDB([]);
    const nowTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const log: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: nowTime,
      batchId: 'RESET',
      productName: 'Полная очистка базы данных',
      lotNumber: '0 партий',
      action: 'WRITE_OFF',
      performedBy: 'Администратор системы (Каримов Р. Н.)',
      details: 'Полная очистка базы данных перед вводом в эксплуатацию',
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  // Branch Filtered Batches
  const displayedBatches = useMemo(() => {
    if (selectedBranches.includes('__NONE__')) {
      return [];
    }
    if (selectedBranches.length === 0) {
      if (selectedBranch && selectedBranch !== 'ALL') {
        return batches.filter(b => b.branch === selectedBranch);
      }
      // By default, exclude disposal branch items unless explicitly selected
      return batches.filter(b => !isDisposalBranch(b.branch));
    }
    return batches.filter(b => selectedBranches.includes(b.branch));
  }, [batches, selectedBranches, selectedBranch]);

  // Counts
  const quarantineCount = displayedBatches.filter(b => b.category === 'E' || b.isQuarantined).length;
  const atRiskCount = displayedBatches.filter(b => b.category === 'C' || b.category === 'D').length;

  const handleNavigateTab = (tab: string, catFilter?: CategoryType) => {
    setActiveTab(tab);
    if (catFilter) {
      setCategoryFilter(catFilter);
    } else {
      setCategoryFilter('ALL');
    }
  };

  // Batch Discount Action
  const handleUpdateBatchDiscount = (batchId: string, newDiscount: number) => {
    const target = batches.find(b => b.id === batchId);
    pushHistory(`Скидка ${newDiscount}% для «${target?.productName || 'препарат'}»`);
    const nowTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setBatches(prev => prev.map(b => {
      if (b.id === batchId) {
        const updated = processBatch({
          ...b,
          currentDiscount: newDiscount,
          discountApprovalStatus: newDiscount > 0 ? 'APPROVED' : 'REJECTED',
          discountApprovedBy: userProfile.fullName || 'Оператор СМК',
          discountApprovedDate: nowTime,
          lastModifiedDate: nowTime,
          modifiedBy: userProfile.fullName || 'Оператор СМК',
        }, CURRENT_REF_DATE);

        // Add audit log
        const log: AuditLogItem = {
          id: `log-${Date.now()}`,
          timestamp: nowTime,
          batchId: b.id,
          productName: b.productName,
          lotNumber: b.lotNumber,
          action: 'DISCOUNT',
          performedBy: userProfile.fullName || 'Оператор СМК',
          details: `Утверждена скидка ${newDiscount}% (Приложение 6)`,
        };
        setAuditLogs(logs => [log, ...logs]);

        return updated;
      }
      return b;
    }));
  };

  // Approve Single Discount Action
  const handleApproveDiscount = (batchId: string, customDiscount?: number) => {
    const target = batches.find(b => b.id === batchId);
    if (!target) return;

    const discountToApply = customDiscount ?? target.proposedDiscount ?? 20;
    pushHistory(`Утверждение скидки ${discountToApply}% для «${target.productName}»`);
    const nowTime = new Date().toISOString().replace('T', ' ').slice(0, 16);

    setBatches(prev => prev.map(b => {
      if (b.id === batchId) {
        const discountedPrice = Math.max(0, +(b.retailPrice * (1 - discountToApply / 100)).toFixed(2));
        return {
          ...b,
          currentDiscount: discountToApply,
          discountedPrice,
          discountApprovalStatus: 'APPROVED',
          discountApprovedBy: userProfile.fullName || 'Оператор СМК',
          discountApprovedDate: nowTime,
          lastModifiedDate: nowTime,
          modifiedBy: userProfile.fullName || 'Оператор СМК',
        };
      }
      return b;
    }));

    const discountedPrice = Math.max(0, +(target.retailPrice * (1 - discountToApply / 100)).toFixed(2));
    const log: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: nowTime,
      batchId: target.id,
      productName: target.productName,
      lotNumber: target.lotNumber,
      action: 'DISCOUNT',
      performedBy: userProfile.fullName || 'Оператор СМК',
      details: `Утверждение уценки ${discountToApply}% оператором (Старая цена: ${target.retailPrice} TJS, Новая: ${discountedPrice} TJS)`,
      oldValue: `${target.retailPrice} TJS`,
      newValue: `${discountedPrice} TJS (-${discountToApply}%)`,
    };
    setAuditLogs(logs => [log, ...logs]);
  };

  // Mass Approve Discounts Action
  const handleApproveAllDiscounts = () => {
    const nowTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
    let approvedCount = 0;

    pushHistory(`Массовое утверждение всех предложенных скидок FEFO`);

    setBatches(prev => prev.map(b => {
      if (b.discountApprovalStatus === 'PENDING' && (b.proposedDiscount || 0) > 0) {
        approvedCount++;
        const discountToApply = b.proposedDiscount || 20;
        const discountedPrice = Math.max(0, +(b.retailPrice * (1 - discountToApply / 100)).toFixed(2));
        return {
          ...b,
          currentDiscount: discountToApply,
          discountedPrice,
          discountApprovalStatus: 'APPROVED',
          discountApprovedBy: userProfile.fullName || 'Оператор СМК',
          discountApprovedDate: nowTime,
          lastModifiedDate: nowTime,
          modifiedBy: userProfile.fullName || 'Оператор СМК',
        };
      }
      return b;
    }));

    if (approvedCount > 0) {
      const log: AuditLogItem = {
        id: `log-${Date.now()}`,
        timestamp: nowTime,
        batchId: 'MASS_APPROVAL',
        productName: 'Утверждение уценок оператором',
        lotNumber: `${approvedCount} партий`,
        action: 'DISCOUNT',
        performedBy: userProfile.fullName || 'Оператор СМК',
        details: `Оператор массово утвердил предложенные уценки FEFO для ${approvedCount} партий медикаментов`,
      };
      setAuditLogs(logs => [log, ...logs]);
    }
  };

  // Reject Discount Action
  const handleRejectDiscount = (batchId: string) => {
    const target = batches.find(b => b.id === batchId);
    if (!target) return;

    pushHistory(`Отклонение скидки для «${target.productName}»`);
    const nowTime = new Date().toISOString().replace('T', ' ').slice(0, 16);

    setBatches(prev => prev.map(b => {
      if (b.id === batchId) {
        return {
          ...b,
          currentDiscount: 0,
          discountedPrice: b.retailPrice,
          discountApprovalStatus: 'REJECTED',
          lastModifiedDate: nowTime,
          modifiedBy: userProfile.fullName || 'Оператор СМК',
        };
      }
      return b;
    }));

    const log: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: nowTime,
      batchId: target.id,
      productName: target.productName,
      lotNumber: target.lotNumber,
      action: 'UPDATE',
      performedBy: userProfile.fullName || 'Оператор СМК',
      details: `Оператор отклонил предложенную уценку FEFO (-${target.proposedDiscount}%). Сохранена полная розничная цена ${target.retailPrice} TJS.`,
    };
    setAuditLogs(logs => [log, ...logs]);
  };

  // Move Batch to Quarantine Action
  const handleMoveToQuarantine = (batchId: string) => {
    const target = batches.find(b => b.id === batchId);
    pushHistory(`Карантин для «${target?.productName || 'препарат'}»`);
    const nowTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setBatches(prev => prev.map(b => {
      if (b.id === batchId) {
        const updated = processBatch({
          ...b,
          isQuarantined: true,
          category: 'E',
          quarantineDate: CURRENT_REF_DATE,
          lastModifiedDate: nowTime,
          modifiedBy: 'Заведующий складом (Каримов Р. Н.)',
        }, CURRENT_REF_DATE);

        const log: AuditLogItem = {
          id: `log-${Date.now()}`,
          timestamp: nowTime,
          batchId: b.id,
          productName: b.productName,
          lotNumber: b.lotNumber,
          action: 'QUARANTINE',
          performedBy: 'Заведующий складом',
          details: 'Перемещение в изолированную зону карантина (Приложение 5)',
        };
        setAuditLogs(logs => [log, ...logs]);

        return updated;
      }
      return b;
    }));
  };

  // Write off Batch Action
  const handleWriteOffBatch = (batchId: string) => {
    const target = batches.find(b => b.id === batchId);
    if (!target) return;

    pushHistory(`Списание партии «${target.productName}»`);
    setBatches(prev => prev.filter(b => b.id !== batchId));

    const log: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      batchId,
      productName: target.productName,
      lotNumber: target.lotNumber,
      action: 'WRITE_OFF',
      performedBy: 'Председатель Комиссии по списанию',
      details: 'Официальное списание и передача на уничтожение (Приложение 2 и 15)',
    };
    setAuditLogs(logs => [log, ...logs]);
  };

  // Return to Supplier Action
  const handleReturnToSupplier = (batchId: string) => {
    const target = batches.find(b => b.id === batchId);
    if (!target) return;

    pushHistory(`Возврат поставщику «${target.productName}»`);
    setBatches(prev => prev.filter(b => b.id !== batchId));

    const log: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      batchId,
      productName: target.productName,
      lotNumber: target.lotNumber,
      action: 'RETURN',
      performedBy: 'Коммерческий директор',
      details: `Возврат критической партии поставщику (${target.supplier}) - Приложение 11`,
    };
    setAuditLogs(logs => [log, ...logs]);
  };

  // Import New Batches
  const handleImportBatches = (newBatches: Partial<MedicationBatch>[], replaceExisting: boolean = true) => {
    pushHistory(replaceExisting ? `Импорт из 1С (${newBatches.length} партий)` : `Добавление из 1С (${newBatches.length} партий)`);
    const nowTime = new Date().toISOString().replace('T', ' ').slice(0, 16);

    // Auto-discover unique branch names from imported dataset
    const uniqueBranchNames = Array.from(new Set(newBatches.map(b => b.branch).filter(Boolean))) as string[];

    if (uniqueBranchNames.length > 0) {
      setBranches(prevBranches => {
        const existingNames = new Set(prevBranches.map(b => b.nameRussian));
        const newlyDiscovered: BranchInfo[] = [];

        uniqueBranchNames.forEach((bName, idx) => {
          if (!existingNames.has(bName)) {
            let city = 'г. Душанбе';
            if (bName.toLowerCase().includes('худжанд')) city = 'г. Худжанд';
            else if (bName.toLowerCase().includes('бохтар')) city = 'г. Бохтар';
            else if (bName.toLowerCase().includes('куляб') || bName.toLowerCase().includes('кулоб')) city = 'г. Куляб';
            else if (!bName.toLowerCase().includes('душанбе')) city = 'Республика Таджикистан';

            newlyDiscovered.push({
              id: `branch-auto-${Date.now()}-${idx}`,
              nameTajik: bName,
              nameRussian: bName,
              city,
              address: 'Обнаружен при импорте из 1С',
            });
          }
        });

        if (newlyDiscovered.length > 0) {
          const updated = [...prevBranches, ...newlyDiscovered];
          saveMetaToDB('sifat_farma_branches', updated);
          return updated;
        }
        return prevBranches;
      });
    }

    const processed = newBatches.map(b => processBatch({
      ...b,
      createdDate: nowTime,
      lastModifiedDate: nowTime,
      modifiedBy: 'Оператор IT / 1С Импорт',
    }, CURRENT_REF_DATE));

    const finalBatches = replaceExisting ? processed : [...processed, ...batches];
    setBatches(finalBatches);
    saveBatchesToDB(finalBatches);

    const log: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: nowTime,
      batchId: 'IMPORT',
      productName: replaceExisting ? 'Полный импорт 1С' : 'Групповой импорт',
      lotNumber: `${newBatches.length} партий`,
      action: 'IMPORT',
      performedBy: 'Отдел IT',
      details: replaceExisting 
        ? `Импорт ${newBatches.length} партий из отчета 1С:Парацельс (авто-обнаружено филиалов: ${uniqueBranchNames.length})`
        : `Добавлено ${newBatches.length} партий из отчета 1С:Парацельс`,
    };
    setAuditLogs(logs => [log, ...logs]);
  };

  // Save/Edit Batch from Modal
  const handleSaveBatchFromModal = (batchData: Partial<MedicationBatch>) => {
    const isEdit = !!batchData.id;
    pushHistory(isEdit ? `Изменение партии «${batchData.productName || 'препарат'}»` : `Ввод новой партии «${batchData.productName || 'препарат'}»`);
    const nowTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const existing = isEdit ? batches.find(b => b.id === batchData.id) : null;

    const processed = processBatch({
      ...batchData,
      createdDate: existing?.createdDate || nowTime,
      lastModifiedDate: nowTime,
      modifiedBy: 'Оператор IT / Складской сотрудник',
    }, CURRENT_REF_DATE);

    if (batchData.id) {
      // Edit existing
      setBatches(prev => prev.map(b => b.id === batchData.id ? processed : b));
    } else {
      // Add new
      setBatches(prev => [processed, ...prev]);
    }

    const log: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: nowTime,
      batchId: processed.id,
      productName: processed.productName,
      lotNumber: processed.lotNumber,
      action: 'TRANSFER',
      performedBy: 'Оператор IT / Складской сотрудник',
      details: isEdit ? 'Редактирование параметров партии' : 'Ввод новой партии в систему FEFO',
    };
    setAuditLogs(logs => [log, ...logs]);
  };

  if (checkingLicense) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center text-white z-[99999]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <span className="text-xs text-slate-400 font-medium tracking-wide">Проверка оборудования и лицензии...</span>
        </div>
      </div>
    );
  }

  if (!isLicensed) {
    return <LicenseModal onActivated={() => setIsLicensed(true)} />;
  }

  return (
    <div 
      className={`flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden transition-all ${
        uiScale === 'xlarge' ? 'contrast-105' : ''
      }`}
      data-ui-scale={uiScale}
    >
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        quarantineCount={quarantineCount}
        atRiskCount={atRiskCount}
        totalBatchesCount={displayedBatches.length}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        userProfile={userProfile}
        commissionMembers={commissionMembers}
        onSaveProfile={setUserProfile}
        onSaveCommission={setCommissionMembers}
        onImportBatches={handleImportBatches}
        onImportBackup={handleImportBackup}
        defaultBranchName={branches[0]?.nameRussian || 'Центральный склад (г. Душанбе)'}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Header */}
        <Header
          selectedBranches={selectedBranches}
          setSelectedBranches={setSelectedBranches}
          selectedBranch={selectedBranch}
          setSelectedBranch={setSelectedBranch}
          branches={branches}
          batches={batches}
          onOpenNewBatchModal={() => {
            setEditingBatch(null);
            setIsBatchModalOpen(true);
          }}
          onOpenResetModal={() => setIsResetModalOpen(true)}
          onOpenBranchModal={() => setIsBranchModalOpen(true)}
          referenceDate={CURRENT_REF_DATE}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          lastHistoryAction={historyStack.length > 0 ? { description: historyStack[0].description, timestamp: historyStack[0].timestamp } : null}
          onUndo={handleUndo}
          uiScale={uiScale}
          setUiScale={setUiScale}
        />

        {/* Dynamic Tab Body */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 w-full max-w-[1920px] mx-auto">
          <ErrorBoundary>
            {activeTab === 'dashboard' && (
              <DashboardView
                batches={displayedBatches}
                branches={branches}
                selectedBranches={selectedBranches}
                setSelectedBranches={setSelectedBranches}
                selectedBranch={selectedBranch}
                setSelectedBranch={setSelectedBranch}
                onNavigateTab={handleNavigateTab}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryView
                batches={displayedBatches}
                branches={branches}
                commissionMembers={commissionMembers}
                initialCategoryFilter={categoryFilter}
                onUpdateBatchDiscount={handleUpdateBatchDiscount}
                onApproveDiscount={handleApproveDiscount}
                onApproveAllDiscounts={handleApproveAllDiscounts}
                onRejectDiscount={handleRejectDiscount}
                onMoveToQuarantine={handleMoveToQuarantine}
                onEditBatch={(batch) => {
                  setEditingBatch(batch);
                  setIsBatchModalOpen(true);
                }}
              />
            )}

            {activeTab === 'quarantine' && (
              <QuarantineView
                batches={displayedBatches}
                commissionMembers={commissionMembers}
                onWriteOffBatch={handleWriteOffBatch}
                onReturnToSupplier={handleReturnToSupplier}
                userProfile={userProfile}
              />
            )}

            {activeTab === 'transfers' && (
              <TransfersView
                batches={displayedBatches.length > 0 ? displayedBatches : batches}
                allBatches={batches}
                branches={branches}
                onTransferBatch={handleTransferBatch}
                onExecuteBatchSplitTransfer={handleExecuteBatchSplitTransfer}
                onExecuteAllMultiDistributions={handleExecuteAllMultiDistributions}
                onAddBranch={handleAddBranch}
                onDeleteBranch={handleDeleteBranch}
                onUpdateBranch={handleUpdateBranch}
                onOpenBranchModal={() => setIsBranchModalOpen(true)}
                onReassignAllBatchesBranch={handleReassignAllBatchesBranch}
              />
            )}

            {activeTab === 'import' && (
              <ImportView
                batches={displayedBatches}
                commissionMembers={commissionMembers}
                branches={branches}
                onApproveAllDiscounts={handleApproveAllDiscounts}
                onImportBatches={handleImportBatches}
                onReassignAllBatchesBranch={handleReassignAllBatchesBranch}
              />
            )}

            {activeTab === 'annexes' && (
              <AnnexesView
                commissionMembers={commissionMembers}
                batches={displayedBatches}
                userProfile={userProfile}
              />
            )}

            {activeTab === 'audit' && (
              <AuditLogView
                logs={auditLogs}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                userProfile={userProfile}
                commissionMembers={commissionMembers}
                branches={branches}
                batches={batches}
                auditLogs={auditLogs}
                uiScale={uiScale}
                fefoSettings={fefoSettings}
                currentFontId={currentFontId}
                onSelectFont={setCurrentFontId}
                currentNumberFontId={currentNumberFontId}
                onSelectNumberFont={setCurrentNumberFontId}
                currentWeight={currentWeight}
                onSelectWeight={setCurrentWeight}
                onOpenFontModal={() => setIsFontModalOpen(true)}
                onSaveProfile={(prof) => setUserProfile(prof)}
                onSaveCommission={(members) => setCommissionMembers(members)}
                onAddBranch={handleAddBranch}
                onUpdateBranch={handleUpdateBranch}
                onDeleteBranch={handleDeleteBranch}
                onReassignAllBatchesBranch={handleReassignAllBatchesBranch}
                onUpdateUiScale={setUiScale}
                onSaveFefoSettings={handleSaveFefoSettings}
                onResetData={() => setIsResetModalOpen(true)}
                onImportBackup={handleImportBackup}
              />
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Font & Typography Selector Modal */}
      <FontSwitcherModal
        isOpen={isFontModalOpen}
        onClose={() => setIsFontModalOpen(false)}
        currentFontId={currentFontId}
        onSelectFont={setCurrentFontId}
        currentNumberFontId={currentNumberFontId}
        onSelectNumberFont={setCurrentNumberFontId}
        currentWeight={currentWeight}
        onSelectWeight={setCurrentWeight}
      />

      {/* Add / Edit Batch Modal */}
      <BatchModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onSaveBatch={handleSaveBatchFromModal}
        initialBatch={editingBatch}
        branches={branches}
      />

      {/* Data Clear / Reset Modal */}
      <DataResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onClearAllData={handleClearAllData}
        totalBatchesCount={batches.length}
      />

      {/* Branch & Warehouse Management Modal */}
      <BranchManagementModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        branches={branches}
        batches={batches}
        onAddBranch={handleAddBranch}
        onUpdateBranch={handleUpdateBranch}
        onDeleteBranch={handleDeleteBranch}
        onReassignAllBatchesBranch={handleReassignAllBatchesBranch}
        totalBatchesCount={batches.length}
      />

      {/* Undo Confirmation Toast */}
      {undoToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold border border-slate-700/80 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span>{undoToast}</span>
        </div>
      )}
    </div>
  );
}
