import { MedicationBatch, BranchInfo, CommissionMember } from '../types';

export const CURRENT_REF_DATE = new Date().toISOString().slice(0, 10);

export const BRANCHES_LIST: BranchInfo[] = [
  { id: 'b1', nameTajik: 'Центральный склад (г. Душанбе)', nameRussian: 'Центральный склад (г. Душанбе)', city: 'Душанбе', address: 'ул. Борбад 48' },
];

export const INITIAL_COMMISSION_MEMBERS: CommissionMember[] = [
  {
    roleTajik: 'Раиси Комиссия',
    roleRussian: 'Председатель Комиссии',
    name: 'Зам. директора по качеству',
    titleTajik: 'Муовини директор оид ба сифат',
    titleRussian: 'Зам. директора по качеству',
  },
  {
    roleTajik: 'Аъзои Комиссия (Мудири анбор)',
    roleRussian: 'Член Комиссии (Зав. складом)',
    name: 'Заведующий центральным складом',
    titleTajik: 'Мудири анбор',
    titleRussian: 'Заведующий центральным складом',
  },
  {
    roleTajik: 'Аъзои Комиссия (Сармуҳосиб)',
    roleRussian: 'Член Комиссии (Бухгалтер)',
    name: 'Главный бухгалтер',
    titleTajik: 'Сармуҳосиб',
    titleRussian: 'Главный бухгалтер',
  },
  {
    roleTajik: 'Аъзои Комиссия (Провизор)',
    roleRussian: 'Член Комиссии (Провизор)',
    name: 'Ведущий провизор-инспектор',
    titleTajik: 'Провизор-инспектор',
    titleRussian: 'Ведущий провизор-инспектор',
  },
];

// Production Clean Database State (Empty array for zero fake/demo items)
export const INITIAL_BATCHES: MedicationBatch[] = [];
