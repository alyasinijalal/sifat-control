export type CategoryType = 'A' | 'B' | 'C' | 'D' | 'E';

export type SalesVelocityRank = 'FAST' | 'MEDIUM' | 'SLOW' | 'DEAD_STOCK';

export interface SalesVelocityInfo {
  rank: SalesVelocityRank;
  label: string;
  shortLabel: string;
  badgeBg: string;
  badgeText: string;
  sellThrough: number;
}

export interface CategoryInfo {
  code: CategoryType;
  labelTajik: string;
  labelRussian: string;
  monthHint?: string;
  daysRangeTajik: string;
  daysRangeRussian: string;
  badgeBg: string;
  badgeText: string;
  bannerBg: string;
  containerBg: string;
  borderColor: string;
  defaultDiscount: number; // percentage
  recommendedActionTajik: string;
  recommendedActionRussian: string;
}

export interface MedicationBatch {
  id: string;
  code1C?: string; // Код номенклатуры в 1С:Парацельс / 1С:Аптека
  productName: string;
  barcode?: string;
  lotNumber: string;
  activeIngredient?: string; // МНН (Международное непатентованное наименование)
  manufactureDate?: string;
  expiryDate: string; // ISO string YYYY-MM-DD
  quantity: number;
  unit: string;
  purchasePrice: number; // TJS
  retailPrice: number; // TJS
  currentDiscount: number; // percentage (0-50)
  proposedDiscount?: number; // percentage suggested by FEFO rules (10-50%)
  discountApprovalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  discountApprovedBy?: string;
  discountApprovedDate?: string;
  discountedPrice: number; // TJS
  branch: string; // e.g., "Анбори Марказӣ (Душанбе)", "Дорухонаи №1"
  supplier: string;
  isQuarantined: boolean;
  quarantineDate?: string;
  createdDate?: string; // YYYY-MM-DD HH:mm or YYYY-MM-DD
  lastModifiedDate?: string; // YYYY-MM-DD HH:mm
  modifiedBy?: string; // Person who added or changed the record
  category: CategoryType;
  daysRemaining: number;
  isCosmetic?: boolean;
  paoMonths?: number; // Period After Opening
  notes?: string;
  deliveryDate?: string; // YYYY-MM-DD (Дата поставки / прихода)
  initialQuantity?: number; // Начальное количество прихода
  manufacturer?: string; // Производитель / Изготовитель
  salesVelocityRank?: SalesVelocityRank; // Рейтинг продаваемости
  daysInStock?: number; // Дней в запасе на складе
  sellThroughRate?: number; // Процент реализации (0-100%)
}

export interface BranchInfo {
  id: string;
  nameTajik: string;
  nameRussian: string;
  city: string;
  address: string;
  phone?: string;
  manager?: string;
  activeStatus?: boolean;
  batchesCount?: number;
  totalRetailSum?: number;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  batchId: string;
  productName: string;
  lotNumber: string;
  action: 'IMPORT' | 'QUARANTINE' | 'DISCOUNT' | 'TRANSFER' | 'WRITE_OFF' | 'DESTROY' | 'RETURN' | 'UPDATE';
  performedBy: string;
  details: string;
  oldValue?: string;
  newValue?: string;
}

export type Language = 'tj' | 'ru';

export interface CommissionMember {
  roleTajik: string;
  roleRussian: string;
  name: string;
  titleTajik: string;
  titleRussian: string;
}

export interface UserProfile {
  fullName: string;
  position: string;
  organization: string;
  gdpCertificate: string;
  directorName: string;
}

export interface RegulationAnnex {
  id: number;
  titleTajik: string;
  titleRussian: string;
  descriptionTajik: string;
  descriptionRussian: string;
}
