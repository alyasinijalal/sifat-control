import { CategoryInfo, CategoryType, MedicationBatch, SalesVelocityInfo, SalesVelocityRank } from '../types';

export const CATEGORIES_CONFIG: Record<CategoryType, CategoryInfo> = {
  A: {
    code: 'A',
    labelTajik: 'Категорияи A (>6 моҳ)',
    labelRussian: 'Категория A (>6 мес)',
    monthHint: '> 6 мес. (> 180 дней)',
    daysRangeTajik: 'Зиёда аз 180 рӯз',
    daysRangeRussian: 'Более 180 дней',
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-white',
    bannerBg: 'bg-emerald-500',
    containerBg: 'bg-emerald-50/70',
    borderColor: 'border-emerald-200',
    defaultDiscount: 0,
    recommendedActionTajik: 'Гардиши муқаррарӣ, назорати оддӣ',
    recommendedActionRussian: 'Обычный оборот, плановый контроль',
  },
  B: {
    code: 'B',
    labelTajik: 'Категорияи B (3–6 моҳ)',
    labelRussian: 'Категория B (3–6 мес)',
    monthHint: '3–6 мес. (90–180 дней)',
    daysRangeTajik: 'Аз 90 то 180 рӯз',
    daysRangeRussian: 'От 90 до 180 дней',
    badgeBg: 'bg-amber-500',
    badgeText: 'text-slate-900 font-bold',
    bannerBg: 'bg-amber-500',
    containerBg: 'bg-amber-50/80',
    borderColor: 'border-amber-200',
    defaultDiscount: 10,
    recommendedActionTajik: 'Афзалияти фурӯш, огоҳинома ба менеҷерон',
    recommendedActionRussian: 'Приоритет продаж, уведомление менеджерам',
  },
  C: {
    code: 'C',
    labelTajik: 'Категорияи C (1–3 моҳ)',
    labelRussian: 'Категория C (1–3 мес)',
    monthHint: '1–3 мес. (30–90 дней)',
    daysRangeTajik: 'Аз 30 то 90 рӯз',
    daysRangeRussian: 'От 30 до 90 дней',
    badgeBg: 'bg-orange-500',
    badgeText: 'text-white',
    bannerBg: 'bg-orange-500',
    containerBg: 'bg-orange-50/80',
    borderColor: 'border-orange-200',
    defaultDiscount: 20,
    recommendedActionTajik: 'Тахфифи фаъол 15-30%, интиқол байни нуқтаҳо',
    recommendedActionRussian: 'Активная скидка 15-30%, перемещение в Аптеку 1',
  },
  D: {
    code: 'D',
    labelTajik: 'Категорияи D (то 1 моҳ)',
    labelRussian: 'Категория D (до 1 мес)',
    monthHint: '< 1 мес. (1–30 дней)',
    daysRangeTajik: 'Камтар аз 30 рӯз',
    daysRangeRussian: 'Менее 30 дней',
    badgeBg: 'bg-rose-600',
    badgeText: 'text-white',
    bannerBg: 'bg-rose-600',
    containerBg: 'bg-rose-50/90',
    borderColor: 'border-rose-300',
    defaultDiscount: 50,
    recommendedActionTajik: 'Тахфифи максималӣ (50%) ё баргардонидан',
    recommendedActionRussian: 'Максимальная скидка (50%) или возврат',
  },
  E: {
    code: 'E',
    labelTajik: 'Категорияи E (Муҳлат гузашта)',
    labelRussian: 'Категория E (Просрочено)',
    monthHint: '< 0 дней (Просрочено)',
    daysRangeTajik: 'Муҳлат ба итмом расид',
    daysRangeRussian: 'Срок истек',
    badgeBg: 'bg-slate-900',
    badgeText: 'text-amber-400 font-extrabold tracking-wider',
    bannerBg: 'bg-slate-950',
    containerBg: 'bg-slate-900 text-slate-100',
    borderColor: 'border-slate-800',
    defaultDiscount: 100,
    recommendedActionTajik: 'КАРАНТИН ҲАТМӢ! Манъи фурӯш, хориҷкунӣ',
    recommendedActionRussian: 'СТРОГИЙ КАРАНТИН! Продажа запрещена',
  },
};

/**
 * Calculates days passed since delivery date vs reference date
 */
export function calculateDaysInStock(deliveryDateStr?: string, referenceDateStr: string = '2026-08-12'): number {
  if (!deliveryDateStr) return 0;
  const delivery = new Date(deliveryDateStr);
  const ref = new Date(referenceDateStr);
  if (isNaN(delivery.getTime())) return 0;
  const diffTime = ref.getTime() - delivery.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
}

/**
 * Calculates sell-through percentage: ((initialQuantity - quantity) / initialQuantity) * 100
 */
export function calculateSellThrough(quantity: number, initialQuantity?: number): number {
  if (!initialQuantity || initialQuantity <= 0) return 0;
  if (quantity >= initialQuantity) return 0;
  const sold = initialQuantity - quantity;
  return Math.min(100, Math.round((sold / initialQuantity) * 100));
}

/**
 * Calculates remaining days from target date vs current reference date
 */
export function calculateDaysRemaining(expiryDateStr: string, referenceDateStr: string = '2026-08-12'): number {
  if (!expiryDateStr) return 0;
  const expiry = new Date(expiryDateStr);
  const ref = new Date(referenceDateStr);
  const diffTime = expiry.getTime() - ref.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determines category according to Sifat Farma regulation
 */
export function determineCategory(daysRemaining: number, isQuarantined: boolean = false): CategoryType {
  if (isQuarantined || daysRemaining <= 0) return 'E';
  if (daysRemaining <= 30) return 'D';
  if (daysRemaining <= 90) return 'C';
  if (daysRemaining <= 180) return 'B';
  return 'A';
}

/**
 * Recalculate batch category, days, and price
 */
export function processBatch(
  batch: Partial<MedicationBatch>, 
  referenceDateStr: string = '2026-08-12',
  autoApplyDiscounts: boolean = false
): MedicationBatch {
  const expiryDate = batch.expiryDate || '2026-08-12';
  const days = calculateDaysRemaining(expiryDate, referenceDateStr);
  const isWrittenOff = isWrittenOffBatch(batch as MedicationBatch);
  const isQuarantined = batch.isQuarantined || days <= 0 || isWrittenOff;
  const category = determineCategory(days, isQuarantined);
  
  const retailPrice = batch.retailPrice || 0;
  const defaultCatDiscount = CATEGORIES_CONFIG[category].defaultDiscount; // e.g. A:0, B:10, C:20, D:50, E:100

  let proposedDiscount = batch.proposedDiscount ?? defaultCatDiscount;
  let currentDiscount = 0;
  let approvalStatus = batch.discountApprovalStatus;

  if (category === 'A') {
    proposedDiscount = 0;
    currentDiscount = 0;
    approvalStatus = undefined;
  } else if (category === 'E' || isQuarantined) {
    proposedDiscount = 100;
    currentDiscount = 100;
    approvalStatus = 'APPROVED';
  } else {
    // Cat B, C, D
    if (autoApplyDiscounts) {
      currentDiscount = batch.currentDiscount ?? proposedDiscount;
      approvalStatus = 'APPROVED';
    } else {
      // RULE: Discounts require operator approval by default!
      if (batch.discountApprovalStatus === 'APPROVED' && typeof batch.currentDiscount === 'number') {
        currentDiscount = batch.currentDiscount;
        approvalStatus = 'APPROVED';
      } else if (batch.discountApprovalStatus === 'REJECTED') {
        currentDiscount = 0;
        approvalStatus = 'REJECTED';
      } else {
        // PENDING
        if (typeof batch.currentDiscount === 'number' && batch.currentDiscount > 0) {
          currentDiscount = batch.currentDiscount;
          approvalStatus = 'APPROVED';
        } else {
          currentDiscount = 0; // Discount NOT applied until operator confirms!
          approvalStatus = 'PENDING';
        }
      }
    }
  }

  const discountedPrice = Math.max(0, +(retailPrice * (1 - currentDiscount / 100)).toFixed(2));

  const nowFormatted = '2026-08-12 10:00';

  const qty = batch.quantity ?? 1;
  const { sellThrough: calculatedSellThrough, initQty: calculatedInitQty } = getDeterministicSellThrough(batch, qty);
  
  const initQty = batch.initialQuantity && batch.initialQuantity > qty ? batch.initialQuantity : calculatedInitQty;
  const sellThroughRate = batch.sellThroughRate ?? calculatedSellThrough;

  const deliveryDate = batch.deliveryDate || '';
  const daysInStock = batch.daysInStock ?? calculateDaysInStock(deliveryDate, referenceDateStr);
  
  const velocityInfo = getSalesVelocityInfo({ ...batch, quantity: qty, initialQuantity: initQty, sellThroughRate });

  return {
    id: batch.id || `batch-${Math.random().toString(36).substr(2, 9)}`,
    productName: batch.productName || 'Маводи доруворӣ',
    barcode: batch.barcode || '',
    lotNumber: batch.lotNumber ? batch.lotNumber.trim() : '',
    manufactureDate: batch.manufactureDate || '',
    expiryDate,
    quantity: qty,
    unit: batch.unit || 'уп.',
    purchasePrice: batch.purchasePrice || 0,
    retailPrice,
    proposedDiscount,
    currentDiscount,
    discountApprovalStatus: approvalStatus,
    discountApprovedBy: batch.discountApprovedBy,
    discountApprovedDate: batch.discountApprovedDate,
    discountedPrice,
    branch: batch.branch || 'Центральный склад (г. Душанбе)',
    supplier: batch.supplier || 'ООО «Сифат Фарма»',
    isQuarantined,
    quarantineDate: isQuarantined ? (batch.quarantineDate || referenceDateStr) : undefined,
    createdDate: batch.createdDate || '2026-08-01 09:00',
    lastModifiedDate: batch.lastModifiedDate || nowFormatted,
    modifiedBy: batch.modifiedBy || 'Ответственный сотрудник',
    category,
    daysRemaining: days,
    isCosmetic: batch.isCosmetic || false,
    paoMonths: batch.paoMonths,
    notes: batch.notes || '',
    deliveryDate,
    initialQuantity: initQty,
    manufacturer: batch.manufacturer || 'не определен',
    daysInStock,
    sellThroughRate,
    salesVelocityRank: velocityInfo.rank,
  };
}

export function formatCurrencyTJS(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' с.';
}

/**
 * Universal date formatter to strictly DD.MM.YYYY format (e.g. 01.10.2025)
 */
export function formatDateDDMMYYYY(dateStr?: string): string {
  if (!dateStr || !dateStr.trim()) return '—';
  const trimmed = dateStr.trim();

  // Already DD.MM.YYYY
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(trimmed)) return trimmed;

  const cleanStr = trimmed.split(' ')[0].split('T')[0];

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    const [y, m, d] = cleanStr.split('-');
    return `${d.padStart(2, '0')}.${m.padStart(2, '0')}.${y}`;
  }

  // YYYY.MM.DD
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(cleanStr)) {
    const [y, m, d] = cleanStr.split('.');
    return `${d.padStart(2, '0')}.${m.padStart(2, '0')}.${y}`;
  }

  // DD/MM/YYYY or MM/DD/YYYY
  if (cleanStr.includes('/')) {
    const parts = cleanStr.split('/');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[2].padStart(2, '0')}.${parts[1].padStart(2, '0')}.${parts[0]}`;
      } else {
        return `${parts[0].padStart(2, '0')}.${parts[1].padStart(2, '0')}.${parts[2]}`;
      }
    }
  }

  // DD.MM.YY
  if (/^\d{2}\.\d{2}\.\d{2}$/.test(cleanStr)) {
    const [d, m, y] = cleanStr.split('.');
    return `${d}.${m}.20${y}`;
  }

  const dateObj = new Date(dateStr);
  if (!isNaN(dateObj.getTime())) {
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    return `${d}.${m}.${y}`;
  }

  return dateStr;
}

/**
 * Calculates deterministic sales velocity info (Fast-moving, Medium, Slow-moving, Dead Stock)
 */
export function getDeterministicSellThrough(batch: Partial<MedicationBatch>, currentQty: number): { sellThrough: number; initQty: number } {
  // If sellThroughRate explicitly provided, use it
  if (typeof batch.sellThroughRate === 'number' && !isNaN(batch.sellThroughRate)) {
    const init = batch.initialQuantity && batch.initialQuantity > currentQty 
      ? batch.initialQuantity 
      : Math.round(currentQty / Math.max(0.01, (1 - batch.sellThroughRate / 100)));
    return { sellThrough: Math.min(100, Math.max(0, batch.sellThroughRate)), initQty: Math.max(currentQty, init) };
  }

  // If initialQuantity is provided and strictly greater than currentQty
  if (batch.initialQuantity && batch.initialQuantity > currentQty) {
    const st = Math.round(((batch.initialQuantity - currentQty) / batch.initialQuantity) * 100);
    return { sellThrough: Math.min(100, Math.max(0, st)), initQty: batch.initialQuantity };
  }

  // Generate deterministic sellThrough based on batch properties
  const str = (batch.id || '') + (batch.productName || '') + (batch.lotNumber || '') + (batch.branch || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  // Map hash to realistic pharmacy sales velocity distribution:
  // ~25% FAST (>60%), ~35% MEDIUM (25-60%), ~25% SLOW (1-25%), ~15% DEAD_STOCK (0%)
  const mod = absHash % 100;
  let sellThrough = 0;

  if (batch.isQuarantined) {
    // Quarantined/expired items are often slow or dead stock
    sellThrough = mod % 2 === 0 ? 0 : (mod % 20);
  } else if (mod < 15) {
    sellThrough = 0; // Dead stock (0% realized)
  } else if (mod < 40) {
    sellThrough = 5 + (absHash % 20); // 5% - 24% (Slow)
  } else if (mod < 75) {
    sellThrough = 25 + (absHash % 35); // 25% - 59% (Medium)
  } else {
    sellThrough = 60 + (absHash % 33); // 60% - 92% (Fast)
  }

  // Calculate realistic initialQuantity from currentQty and sellThrough
  let initQty = currentQty;
  if (sellThrough > 0 && sellThrough < 100) {
    initQty = Math.max(currentQty + 5, Math.round(currentQty / (1 - sellThrough / 100)));
  } else if (sellThrough === 0) {
    initQty = currentQty;
  } else {
    initQty = Math.max(currentQty, currentQty + 50);
  }

  return { sellThrough, initQty };
}

/**
 * Calculates sales velocity info (Fast-moving, Medium, Slow-moving, Dead Stock)
 */
export function getSalesVelocityInfo(batch: Partial<MedicationBatch>): SalesVelocityInfo {
  const currentQty = batch.quantity ?? 0;
  
  let { sellThrough, initQty } = getDeterministicSellThrough(batch, currentQty);

  let rank = batch.salesVelocityRank;
  if (!rank) {
    if (sellThrough >= 60) rank = 'FAST';
    else if (sellThrough >= 25) rank = 'MEDIUM';
    else if (sellThrough > 0) rank = 'SLOW';
    else rank = 'DEAD_STOCK';
  }

  switch (rank) {
    case 'FAST':
      return {
        rank: 'FAST',
        label: 'Ходовой (Высокий спрос / >60% реализации)',
        shortLabel: '⚡ Ходовой',
        badgeBg: 'bg-emerald-100 border-emerald-300',
        badgeText: 'text-emerald-900 font-extrabold',
        sellThrough,
      };
    case 'MEDIUM':
      return {
        rank: 'MEDIUM',
        label: 'Средняя оборачиваемость (25–60% реализации)',
        shortLabel: '⚖️ Средняя',
        badgeBg: 'bg-amber-100 border-amber-300',
        badgeText: 'text-amber-900 font-bold',
        sellThrough,
      };
    case 'SLOW':
      return {
        rank: 'SLOW',
        label: 'Медленно реализуемый (1–25% реализации)',
        shortLabel: '🐢 Низкая',
        badgeBg: 'bg-orange-100 border-orange-300',
        badgeText: 'text-orange-900 font-bold',
        sellThrough,
      };
    case 'DEAD_STOCK':
    default:
      return {
        rank: 'DEAD_STOCK',
        label: 'Неликвид / Без движения (0% реализации)',
        shortLabel: '🛑 Неликвид',
        badgeBg: 'bg-rose-100 border-rose-300',
        badgeText: 'text-rose-900 font-black',
        sellThrough,
      };
  }
}

/**
 * Checks if a batch belongs to the written-off section or is marked written-off
 */
export function isWrittenOffBatch(b: MedicationBatch): boolean {
  if (b.notes && (b.notes.toLowerCase().includes('списан') || b.notes.toLowerCase().includes('списание'))) {
    return true;
  }
  if (!b.branch) return false;
  const br = b.branch.toLowerCase();
  return br.includes('списан') || br.includes('списание') || br.includes('отдел списани') || br.includes('утилизац');
}

/**
 * Calculates effective unit retail price taking into account approved discounts
 */
export function getBatchEffectiveUnitPrice(batch: Partial<MedicationBatch>): number {
  const retail = Number(batch.retailPrice) || 0;
  const disc = Number(batch.currentDiscount) || 0;
  if (disc > 0) {
    return Number(batch.discountedPrice) || +(retail * (1 - disc / 100)).toFixed(2);
  }
  return retail;
}

export interface BranchSalesVelocityResult {
  coefficient: number;        // e.g. 1.45
  formatted: string;          // e.g. "1.5x"
  percent: number;            // e.g. 78%
  rank: SalesVelocityRank;    // 'FAST' | 'MEDIUM' | 'SLOW' | 'DEAD_STOCK'
  badgeBg: string;
  badgeText: string;
  shortLabel: string;
  trafficLevel: 'Флагман' | 'Высокий' | 'Стандарт' | 'Низкий' | 'Склад';
  tooltipText: string;
}

/**
 * Calculates deterministic sales velocity coefficient (k_прод) and sell-through rate
 * for a specific medicine in a specific pharmacy branch.
 */
export function getBranchSalesVelocity(
  branchName: string = '',
  productName: string = '',
  batch?: Partial<MedicationBatch>
): BranchSalesVelocityResult {
  const bNameLower = (branchName || '').toLowerCase();
  const isWarehouse = bNameLower.includes('склад');
  const isAnchor = ['маркази', 'роддом', 'истиклол', 'клинич', 'ориёнбонк', 'центральн', 'главная', '№1'].some(kw => bNameLower.includes(kw));
  const isHighTraffic = ['сомони', 'сино', 'фирдавси', 'рудаки', 'айни', 'худжанд', 'бохтар', 'куляб'].some(kw => bNameLower.includes(kw));

  // Base network sell-through for this item
  const baseVel = batch ? getSalesVelocityInfo(batch) : { sellThrough: 50, rank: 'MEDIUM' as SalesVelocityRank };
  const baseRate = baseVel.sellThrough;

  // Generate deterministic branch-specific variation based on hash
  const str = `${branchName}___${productName}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const varianceMod = (Math.abs(hash) % 25) - 10; // -10% to +14%

  let branchRate = baseRate;
  let trafficLevel: 'Флагман' | 'Высокий' | 'Стандарт' | 'Низкий' | 'Склад' = 'Стандарт';
  let trafficMultiplier = 1.0;

  if (isWarehouse) {
    trafficLevel = 'Склад';
    trafficMultiplier = 0.2;
    branchRate = Math.min(20, Math.max(0, Math.round(baseRate * 0.2)));
  } else if (isAnchor) {
    trafficLevel = 'Флагман';
    trafficMultiplier = 1.45 + (Math.abs(hash) % 30) / 100; // 1.45 - 1.74x
    branchRate = Math.min(98, Math.max(45, Math.round(baseRate * 1.35 + varianceMod)));
  } else if (isHighTraffic) {
    trafficLevel = 'Высокий';
    trafficMultiplier = 1.15 + (Math.abs(hash) % 25) / 100; // 1.15 - 1.39x
    branchRate = Math.min(92, Math.max(30, Math.round(baseRate * 1.15 + varianceMod)));
  } else {
    trafficLevel = 'Стандарт';
    trafficMultiplier = 0.85 + (Math.abs(hash) % 25) / 100; // 0.85 - 1.09x
    branchRate = Math.min(85, Math.max(10, Math.round(baseRate * 0.95 + varianceMod)));
  }

  // Calculate final coefficient k_прод (network average = 1.0x)
  const coeff = +(trafficMultiplier * Math.max(0.2, branchRate / 50)).toFixed(2);
  const formatted = `${coeff.toFixed(1)}x`;

  let rank: SalesVelocityRank = 'MEDIUM';
  let badgeBg = 'bg-amber-50 border-amber-200';
  let badgeText = 'text-amber-800';
  let shortLabel = 'Средний сбыт';

  if (isWarehouse || coeff < 0.4) {
    rank = 'DEAD_STOCK';
    badgeBg = 'bg-slate-100 border-slate-200';
    badgeText = 'text-slate-700';
    shortLabel = 'Склад / Без розницы';
  } else if (coeff >= 1.3) {
    rank = 'FAST';
    badgeBg = 'bg-emerald-50 border-emerald-200';
    badgeText = 'text-emerald-800';
    shortLabel = 'Высокая скорость';
  } else if (coeff >= 0.8) {
    rank = 'MEDIUM';
    badgeBg = 'bg-amber-50 border-amber-200';
    badgeText = 'text-amber-800';
    shortLabel = 'Стабильный спрос';
  } else {
    rank = 'SLOW';
    badgeBg = 'bg-orange-50 border-orange-200';
    badgeText = 'text-orange-800';
    shortLabel = 'Умеренный спрос';
  }

  const tooltipText = isWarehouse
    ? `Центральный склад: Коэф. сбыта ${formatted}. Склад осуществляет распределение, прямые розничные чековые продажи отсутствуют.`
    : `Аптека «${branchName}» (Трафик: ${trafficLevel}): Коэффициент продаваемости k_прод = ${formatted} (${branchRate}% реализации). Скорость выбытия данного SKU в ${formatted} раза выше среднего по сети благодаря высокой проходимости и чековому потоку.`;

  return {
    coefficient: coeff,
    formatted,
    percent: branchRate,
    rank,
    badgeBg,
    badgeText,
    shortLabel,
    trafficLevel,
    tooltipText,
  };
}

/**
 * Checks if a branch is a written-off / disposal department
 */
export function isDisposalBranch(branchName: string = ''): boolean {
  if (!branchName) return false;
  const b = branchName.toLowerCase();
  return b.includes('списан') || b.includes('утилизац') || b.includes('карантин') || b.includes('брак');
}

/**
 * Checks if a branch is a central warehouse / distribution hub
 */
export function isWarehouseBranch(branchName: string = ''): boolean {
  if (!branchName) return false;
  if (isDisposalBranch(branchName)) return false;
  const b = branchName.toLowerCase();
  return b.includes('склад') || b.includes('анбор') || b.includes('распред') || b.includes('хранилищ');
}

/**
 * Checks if a branch is a retail store (cosmetics, optics, etc.)
 */
export function isStoreBranch(branchName: string = ''): boolean {
  if (!branchName) return false;
  if (isDisposalBranch(branchName)) return false;
  const b = branchName.toLowerCase();
  return b.includes('магазин') || b.includes('маркет') || b.includes('косметик') || b.includes('оптик');
}

/**
 * Checks if a branch is a retail pharmacy
 */
export function isPharmacyBranch(branchName: string = ''): boolean {
  if (!branchName) return false;
  if (isDisposalBranch(branchName)) return false;
  if (isWarehouseBranch(branchName)) return false;
  if (isStoreBranch(branchName)) return false;
  return true;
}

export type BranchCategoryType = 'WAREHOUSE' | 'PHARMACY' | 'STORE' | 'DISPOSAL';

export interface BranchTypeInfo {
  type: BranchCategoryType;
  label: string;
  shortLabel: string;
  iconText: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export function getBranchTypeInfo(branchName: string = ''): BranchTypeInfo {
  if (isDisposalBranch(branchName)) {
    return {
      type: 'DISPOSAL',
      label: 'Отдел списания / Карантин',
      shortLabel: 'Списание',
      iconText: '🗑️',
      bgClass: 'bg-rose-100',
      textClass: 'text-rose-900',
      borderClass: 'border-rose-300',
    };
  }
  if (isWarehouseBranch(branchName)) {
    return {
      type: 'WAREHOUSE',
      label: 'Центральный склад (Хаб)',
      shortLabel: 'Склад',
      iconText: '🏢',
      bgClass: 'bg-amber-100',
      textClass: 'text-amber-950',
      borderClass: 'border-amber-300',
    };
  }
  if (isStoreBranch(branchName)) {
    return {
      type: 'STORE',
      label: 'Магазин / Торговая точка',
      shortLabel: 'Магазин',
      iconText: '🛍️',
      bgClass: 'bg-purple-100',
      textClass: 'text-purple-950',
      borderClass: 'border-purple-300',
    };
  }
  return {
    type: 'PHARMACY',
    label: 'Аптечный филиал',
    shortLabel: 'Аптека',
    iconText: '🏥',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-950',
    borderClass: 'border-blue-300',
  };
}

export interface BatchFinancialMetrics {
  quantity: number;
  retailUnitPrice: number;
  originalRetailUnitPrice: number;
  purchaseUnitPrice: number;
  unitMargin: number;
  marginPercent: number;
  totalRetailValue: number;
  totalPurchaseValue: number;
  totalMarginValue: number;
  directLossOnWriteOff: number;  // Прямой финансовый ущерб (по себестоимости закупки)
  lostRetailRevenue: number;     // Упущенная розничная выручка
}

/**
 * Calculates complete dual-price financial metrics for a medication batch
 */
export function getBatchFinancialMetrics(batch: Partial<MedicationBatch>): BatchFinancialMetrics {
  const quantity = Number(batch.quantity) || 0;
  const originalRetailUnitPrice = Number(batch.retailPrice) || 0;
  const retailUnitPrice = getBatchEffectiveUnitPrice(batch);
  
  // Ensure purchasePrice is valid; if 0 or undefined, approximate at 72% of retail price
  let purchaseUnitPrice = Number(batch.purchasePrice) || 0;
  if (purchaseUnitPrice <= 0 && originalRetailUnitPrice > 0) {
    purchaseUnitPrice = +(originalRetailUnitPrice * 0.72).toFixed(2);
  }

  const unitMargin = +(retailUnitPrice - purchaseUnitPrice).toFixed(2);
  const marginPercent = purchaseUnitPrice > 0 
    ? +(((retailUnitPrice - purchaseUnitPrice) / purchaseUnitPrice) * 100).toFixed(1) 
    : 0;

  const totalRetailValue = +(quantity * retailUnitPrice).toFixed(2);
  const totalPurchaseValue = +(quantity * purchaseUnitPrice).toFixed(2);
  const totalMarginValue = +(totalRetailValue - totalPurchaseValue).toFixed(2);

  return {
    quantity,
    retailUnitPrice,
    originalRetailUnitPrice,
    purchaseUnitPrice,
    unitMargin,
    marginPercent,
    totalRetailValue,
    totalPurchaseValue,
    totalMarginValue,
    directLossOnWriteOff: totalPurchaseValue,
    lostRetailRevenue: totalRetailValue,
  };
}

export interface BatchReturnPolicy {
  isWarehouse: boolean;
  canReturnToWarehouse: boolean;
  canReturnToSupplier: boolean;
  canWriteOffFromBranch: boolean;
  warehouseReturnPrice: number;
  warehouseReturnTotal: number;
  supplierReturnPrice: number;
  supplierReturnTotal: number;
  ruleLabel: string;
  ruleExplanation: string;
}

/**
 * Returns the exact return policy for a batch based on its location (Pharmacy vs. Central Warehouse)
 * Rule: 
 * - From Pharmacy/Store: ONLY return to Central Warehouse (at Retail Price). No direct supplier returns or write-offs.
 * - From Central Warehouse: Return to Supplier (at Purchase Price) or Write-Off/Disposal (at Purchase Price).
 */
export function getBatchReturnPolicy(batch: Partial<MedicationBatch>): BatchReturnPolicy {
  const isWh = isWarehouseBranch(batch.branch);
  const fin = getBatchFinancialMetrics(batch);

  if (!isWh) {
    // Pharmacy / Retail store: returns to Central Warehouse by RETAIL price
    return {
      isWarehouse: false,
      canReturnToWarehouse: true,
      canReturnToSupplier: false,
      canWriteOffFromBranch: false,
      warehouseReturnPrice: fin.retailUnitPrice,
      warehouseReturnTotal: fin.totalRetailValue,
      supplierReturnPrice: fin.purchaseUnitPrice,
      supplierReturnTotal: fin.totalPurchaseValue,
      ruleLabel: 'Возврат из аптеки на склад (по розничной цене)',
      ruleExplanation: 'Аптека передает неликвид на Центральный склад по розничной стоимости для снятия материальной ответственности с зав. аптекой. Прямое списание из аптеки запрещено регламентом.',
    };
  } else {
    // Central Warehouse: returns to supplier or write-off by PURCHASE price
    return {
      isWarehouse: true,
      canReturnToWarehouse: false,
      canReturnToSupplier: true,
      canWriteOffFromBranch: true,
      warehouseReturnPrice: fin.retailUnitPrice,
      warehouseReturnTotal: fin.totalRetailValue,
      supplierReturnPrice: fin.purchaseUnitPrice,
      supplierReturnTotal: fin.totalPurchaseValue,
      ruleLabel: 'Возврат со склада поставщику (по закупочной цене) / Акт списания',
      ruleExplanation: 'Центральный склад оформляет рекламацию поставщику по закупочной себестоимости либо передает на утилизацию по акту комиссии.',
    };
  }
}

export interface TwoTierReturnPricing {
  targetType: 'PHARMACY_TO_WAREHOUSE' | 'WAREHOUSE_TO_SUPPLIER' | 'WRITE_OFF_DISPOSAL';
  priceType: 'RETAIL' | 'PURCHASE';
  unitPrice: number;
  totalAmount: number;
  purchaseUnitPrice: number;
  totalPurchaseAmount: number;
  retailUnitPrice: number;
  totalRetailAmount: number;
  accountingRule: string;
  shortLabel: string;
  badgeBg: string;
  badgeText: string;
  explanation: string;
}

/**
 * Two-tier return & write-off pricing calculation:
 * 1. Pharmacy -> Warehouse: ONLY RETAIL PRICE (clears retail liability of branch manager)
 * 2. Warehouse -> Supplier: ONLY PURCHASE PRICE (reclamation invoice to vendor)
 * 3. Write-off / Quarantine (Cat E): Evaluated in both purchase cost (direct financial loss) and retail loss
 */
export function getTwoTierReturnPricing(
  batch: Partial<MedicationBatch>,
  targetType: 'PHARMACY_TO_WAREHOUSE' | 'WAREHOUSE_TO_SUPPLIER' | 'WRITE_OFF_DISPOSAL' = 'WRITE_OFF_DISPOSAL'
): TwoTierReturnPricing {
  const fin = getBatchFinancialMetrics(batch);

  if (targetType === 'PHARMACY_TO_WAREHOUSE') {
    return {
      targetType,
      priceType: 'RETAIL',
      unitPrice: fin.retailUnitPrice,
      totalAmount: fin.totalRetailValue,
      purchaseUnitPrice: fin.purchaseUnitPrice,
      totalPurchaseAmount: fin.totalPurchaseValue,
      retailUnitPrice: fin.retailUnitPrice,
      totalRetailAmount: fin.totalRetailValue,
      accountingRule: 'Возврат из аптеки на ЦС (Розничная оценка)',
      shortLabel: 'По розничной цене',
      badgeBg: 'bg-emerald-50 border-emerald-200',
      badgeText: 'text-emerald-800',
      explanation: 'Внутрисетевой возврат из аптеки на Центральный склад проводится строго по розничной учетной цене для снятия материальной ответственности с заведующего аптекой.',
    };
  }

  if (targetType === 'WAREHOUSE_TO_SUPPLIER') {
    return {
      targetType,
      priceType: 'PURCHASE',
      unitPrice: fin.purchaseUnitPrice,
      totalAmount: fin.totalPurchaseValue,
      purchaseUnitPrice: fin.purchaseUnitPrice,
      totalPurchaseAmount: fin.totalPurchaseValue,
      retailUnitPrice: fin.retailUnitPrice,
      totalRetailAmount: fin.totalRetailValue,
      accountingRule: 'Возврат поставщику (Закупочная себестоимость)',
      shortLabel: 'По закупочной цене',
      badgeBg: 'bg-indigo-50 border-indigo-200',
      badgeText: 'text-indigo-800',
      explanation: 'Возврат поставщику по договору/рекламации осуществляется строго по закупочной цене прихода (без торговой наценки розничной сети).',
    };
  }

  // WRITE_OFF_DISPOSAL
  return {
    targetType,
    priceType: 'PURCHASE',
    unitPrice: fin.purchaseUnitPrice,
    totalAmount: fin.totalPurchaseValue,
    purchaseUnitPrice: fin.purchaseUnitPrice,
    totalPurchaseAmount: fin.totalPurchaseValue,
    retailUnitPrice: fin.retailUnitPrice,
    totalRetailAmount: fin.totalRetailValue,
    accountingRule: 'Списание и утилизация (Прямой ущерб по закупке)',
    shortLabel: 'Убыток по себестоимости',
    badgeBg: 'bg-rose-50 border-rose-200',
    badgeText: 'text-rose-800',
    explanation: `Прямой финансовый ущерб компании фиксируется по закупочной стоимости (${formatCurrencyTJS(fin.totalPurchaseValue)}). С розничного баланса списывается ${formatCurrencyTJS(fin.totalRetailValue)}.`,
  };
}


