import React, { useState } from 'react';
import { 
  Settings, 
  UserCheck, 
  Building2, 
  Sliders, 
  FileCode, 
  Monitor, 
  Database, 
  Save, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Download, 
  Upload, 
  RotateCcw, 
  ShieldCheck, 
  BadgeCheck, 
  Sparkles, 
  Tag, 
  AlertTriangle,
  Info,
  ChevronRight,
  Type,
  Users,
  MapPin,
  Phone
} from 'lucide-react';
import { UserProfile, CommissionMember, BranchInfo, MedicationBatch, AuditLogItem } from '../types';
import { UiScaleType } from './Header';
import { formatCurrencyTJS } from '../utils/categoryUtils';
import { AVAILABLE_FONTS, NUMBER_FONT_PRESETS, FontWeightLevel } from '../utils/fontPresets';

export interface FefoSettings {
  catBDays: number;
  catCDays: number;
  catDDays: number;
  catBDiscount: number;
  catCDiscount: number;
  catDDiscount: number;
  requireOperatorApproval: boolean;
  paracelsusPrefix: string;
  currencySymbol: string;
}

interface SettingsViewProps {
  userProfile: UserProfile;
  commissionMembers: CommissionMember[];
  branches: BranchInfo[];
  batches: MedicationBatch[];
  auditLogs: AuditLogItem[];
  uiScale: UiScaleType;
  fefoSettings: FefoSettings;
  currentFontId?: string;
  onSelectFont?: (id: string) => void;
  currentNumberFontId?: string;
  onSelectNumberFont?: (id: string) => void;
  currentWeight?: FontWeightLevel;
  onSelectWeight?: (weight: FontWeightLevel) => void;
  onOpenFontModal?: () => void;
  onSaveProfile: (profile: UserProfile) => void;
  onSaveCommission: (members: CommissionMember[]) => void;
  onAddBranch: (branch: BranchInfo) => void;
  onUpdateBranch: (branch: BranchInfo) => void;
  onDeleteBranch: (branchId: string) => void;
  onReassignAllBatchesBranch: (targetBranchName: string) => void;
  onUpdateUiScale: (scale: UiScaleType) => void;
  onSaveFefoSettings: (settings: FefoSettings) => void;
  onResetData: () => void;
  onImportBackup: (importedData: { batches?: MedicationBatch[]; branches?: BranchInfo[]; auditLogs?: AuditLogItem[] }) => void;
}

const TAJIKISTAN_CITIES = [
  'Душанбе',
  'Худжанд',
  'Бохтар',
  'Куляб',
  'Турсунзаде',
  'Истаравшан',
  'Дангара',
  'Вахдат',
  'Канибадам',
  'Исфара',
  'Хорог',
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  commissionMembers,
  branches,
  batches,
  auditLogs,
  uiScale,
  fefoSettings,
  currentFontId,
  onSelectFont,
  currentNumberFontId,
  onSelectNumberFont,
  currentWeight,
  onSelectWeight,
  onOpenFontModal,
  onSaveProfile,
  onSaveCommission,
  onAddBranch,
  onUpdateBranch,
  onDeleteBranch,
  onReassignAllBatchesBranch,
  onUpdateUiScale,
  onSaveFefoSettings,
  onResetData,
  onImportBackup,
}) => {
  const [activeSection, setActiveSection] = useState<'profile' | 'fefo' | 'branches' | '1c' | 'ui' | 'backup'>('profile');

  // Form States
  const [formProfile, setFormProfile] = useState<UserProfile>(userProfile);
  const [formCommission, setFormCommission] = useState<CommissionMember[]>(commissionMembers);
  const [formFefo, setFormFefo] = useState<FefoSettings>(fefoSettings);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Branch Editing State inside Settings
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editBranchName, setEditBranchName] = useState('');
  const [editBranchCity, setEditBranchCity] = useState('');
  const [editBranchAddress, setEditBranchAddress] = useState('');
  const [editBranchPhone, setEditBranchPhone] = useState('');
  const [editBranchManager, setEditBranchManager] = useState('');

  // New Branch Form
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCity, setNewBranchCity] = useState('Душанбе');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');
  const [newBranchManager, setNewBranchManager] = useState('');

  // Delete Branch confirmation state
  const [deletingBranch, setDeletingBranch] = useState<BranchInfo | null>(null);
  const [reassignTargetBranch, setReassignTargetBranch] = useState<string>('');

  const triggerSaveNotification = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 2500);
  };

  // Save Profile & Commission
  const handleSaveProfileAndCommission = () => {
    onSaveProfile(formProfile);
    onSaveCommission(formCommission);
    triggerSaveNotification('Профиль инспектора и состав комиссии ISO 9001 успешно сохранены!');
  };

  // Save FEFO Settings
  const handleSaveFefo = () => {
    onSaveFefoSettings(formFefo);
    triggerSaveNotification('Параметры и пороги уценки FEFO успешно обновлены!');
  };

  // Branch handlers
  const handleStartEditBranch = (branch: BranchInfo) => {
    setEditingBranchId(branch.id);
    setEditBranchName(branch.nameRussian);
    setEditBranchCity(branch.city || 'Душанбе');
    setEditBranchAddress(branch.address || '');
    setEditBranchPhone(branch.phone || '');
    setEditBranchManager(branch.manager || '');
  };

  const handleSaveEditBranch = (branch: BranchInfo) => {
    const updated: BranchInfo = {
      ...branch,
      nameRussian: editBranchName.trim() || branch.nameRussian,
      nameTajik: editBranchName.trim() || branch.nameTajik,
      city: editBranchCity,
      address: editBranchAddress.trim(),
      phone: editBranchPhone.trim(),
      manager: editBranchManager.trim(),
    };
    onUpdateBranch(updated);
    setEditingBranchId(null);
    triggerSaveNotification(`Филиал «${updated.nameRussian}» успешно обновлен`);
  };

  const handleCreateBranch = () => {
    if (!newBranchName.trim()) return;
    const newBr: BranchInfo = {
      id: `br-${Date.now()}`,
      nameTajik: newBranchName.trim(),
      nameRussian: newBranchName.trim(),
      city: newBranchCity,
      address: newBranchAddress.trim() || 'Ул. Центральная',
      phone: newBranchPhone.trim() || '+992 44 600-00-00',
      manager: newBranchManager.trim() || 'Заведующий аптекой',
      activeStatus: true,
      batchesCount: 0,
      totalRetailSum: 0,
    };
    onAddBranch(newBr);
    setNewBranchName('');
    setNewBranchAddress('');
    setNewBranchPhone('');
    setNewBranchManager('');
    setIsAddingBranch(false);
    triggerSaveNotification(`Новый филиал «${newBr.nameRussian}» успешно добавлен`);
  };

  const handleConfirmDeleteBranch = () => {
    if (!deletingBranch) return;
    const target = reassignTargetBranch || branches.find(b => b.id !== deletingBranch.id)?.nameRussian || 'Центральный склад (г. Душанбе)';
    
    // Reassign batches
    onReassignAllBatchesBranch(target);
    onDeleteBranch(deletingBranch.id);
    setDeletingBranch(null);
    triggerSaveNotification(`Филиал «${deletingBranch.nameRussian}» удален. Товары перенаправлены в «${target}»`);
  };

  // Export Full Backup JSON
  const handleExportBackupJSON = () => {
    const data = {
      app: 'Sifat Control (FEFO & Reprice)',
      version: '3.0.0',
      organization: 'ҶДММ «Сифат Фарма»',
      exportDate: new Date().toISOString(),
      userProfile,
      commissionMembers,
      fefoSettings,
      branches,
      batches,
      auditLogs,
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sifat_Control_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerSaveNotification('Резервная копия системы успешно выгружена в .JSON');
  };

  // Import Backup JSON
  const handleImportBackupJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && (parsed.batches || parsed.branches)) {
          onImportBackup(parsed);
          triggerSaveNotification('Резервная копия системы успешно загружена!');
        } else {
          alert('Некорректный файл резервной копии');
        }
      } catch (err) {
        alert('Ошибка при чтении файла резервной копии');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 w-full">
      
      {/* Toast Save Notification */}
      {saveSuccessMsg && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white font-black text-xs px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-200 border border-emerald-400">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-md shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight">Параметры и Настройки Системы СМК</h1>
              <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full uppercase">
                ISO 9001 / GDP
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Управление реквизитами организации, комиссией, порогами уценки FEFO, аптечной сетью и интеграцией с 1С
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveProfileAndCommission}
          className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>Сохранить изменения</span>
        </button>
      </div>

      {/* Main Settings Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs space-y-1 h-fit">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 py-2">
            РАЗДЕЛЫ НАСТРОЕК
          </div>

          {[
            { id: 'profile', label: '1. Организация и Инспекторы', icon: UserCheck, desc: 'Профиль и Комиссия ISO 9001' },
            { id: 'fefo', label: '2. Пороги и Регламент FEFO', icon: Sliders, desc: 'Уценка и Категории A-E' },
            { id: 'branches', label: '3. Сеть аптек и Склады', icon: Building2, desc: `${branches.length} филиалов в системе` },
            { id: '1c', label: '4. Интеграция с 1С', icon: FileCode, desc: '1С:Парацельс и Префиксы' },
            { id: 'ui', label: '5. Типографика и Интерфейс', icon: Type, desc: 'Выбор шрифта (Montserrat) и масштаб' },
            { id: 'backup', label: '6. Резервные копии и Сброс', icon: Database, desc: 'Экспорт/Импорт JSON и Сброс' },
          ].map(sec => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id as any)}
                className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-start gap-3 border ${
                  isActive 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm font-bold' 
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-transparent'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-600'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-xs font-black truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                    {sec.label}
                  </div>
                  <div className={`text-[10px] truncate ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                    {sec.desc}
                  </div>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-amber-400 shrink-0 self-center" />}
              </button>
            );
          })}
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Section 1: Profile & Commission */}
          {activeSection === 'profile' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">1. Реквизиты организации и Инспекторы СМК</h2>
                    <p className="text-xs text-slate-500">Указанные Ф.И.О. попадают во все акты комиссии (Приложения 1-15) и документы 1С</p>
                  </div>
                </div>
                <button
                  onClick={handleSaveProfileAndCommission}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Сохранить</span>
                </button>
              </div>

              {/* Organization Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-500" />
                  <span>Информация об организации</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Наименование фармацевтической компании:</label>
                    <input
                      type="text"
                      value={formProfile.organization || ''}
                      onChange={(e) => setFormProfile({ ...formProfile, organization: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Номер сертификата ISO 9001 / GDP:</label>
                    <input
                      type="text"
                      value={formProfile.gdpCertificate || ''}
                      onChange={(e) => setFormProfile({ ...formProfile, gdpCertificate: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Ф.И.О. Генерального директора:</label>
                    <input
                      type="text"
                      value={formProfile.directorName || ''}
                      onChange={(e) => setFormProfile({ ...formProfile, directorName: e.target.value })}
                      placeholder="например: Рахимов А.А."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Ф.И.О. Ответственного провизора-инспектора:</label>
                    <input
                      type="text"
                      value={formProfile.fullName || ''}
                      onChange={(e) => setFormProfile({ ...formProfile, fullName: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Commission Members */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span>Состав инвентаризационной комиссии (Приложения 1-15)</span>
                  </h3>
                </div>

                <div className="space-y-3">
                  {formCommission.map((member, idx) => (
                    <div key={member.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Роль в комиссии:</span>
                        <span className="text-xs font-black text-indigo-900">{member.role}</span>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">Ф.И.О. Сотрудника:</label>
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => {
                            const updated = [...formCommission];
                            updated[idx] = { ...updated[idx], name: e.target.value };
                            setFormCommission(updated);
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">Должность:</label>
                        <input
                          type="text"
                          value={member.position}
                          onChange={(e) => {
                            const updated = [...formCommission];
                            updated[idx] = { ...updated[idx], position: e.target.value };
                            setFormCommission(updated);
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section 2: FEFO Thresholds */}
          {activeSection === 'fefo' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">2. Пороги и Регламент уценки FEFO</h2>
                    <p className="text-xs text-slate-500">Граница остаточного срока годности по категориям A, B, C, D, E</p>
                  </div>
                </div>
                <button
                  onClick={handleSaveFefo}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Сохранить пороги</span>
                </button>
              </div>

              {/* Operator Approval Toggle */}
              <div className="p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 max-w-xl">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0 shadow-2xs">
                    ⚡
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900">Правило обязательного утверждения уценки оператором</div>
                    <p className="text-[11px] text-slate-600 font-medium">
                      По регламенту ISO/GDP скидка не применяется автоматически до личного подтверждения оператором СМК в реестре.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formFefo.requireOperatorApproval}
                    onChange={(e) => setFormFefo({ ...formFefo, requireOperatorApproval: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Category Threshold Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Пороги категорий и процент уценки:
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Cat A */}
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-emerald-950">Категория A (Зеленая зона)</span>
                      <span className="px-2 py-0.5 bg-emerald-600 text-white font-black text-[10px] rounded">Скидка 0%</span>
                    </div>
                    <p className="text-[11px] text-emerald-800">Нормальный остаточный срок годности более 180 дней.</p>
                  </div>

                  {/* Cat B */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-blue-950">Категория B (Синяя зона)</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-blue-800 font-bold">Скидка:</span>
                        <input
                          type="number"
                          value={formFefo.catBDiscount}
                          onChange={(e) => setFormFefo({ ...formFefo, catBDiscount: Number(e.target.value) })}
                          className="w-16 px-2 py-0.5 bg-white border border-blue-300 rounded font-black text-xs text-blue-950 text-center"
                        />
                        <span className="text-xs font-black text-blue-950">%</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-blue-800 flex items-center justify-between">
                      <span>Порог остатка (121–180 дней):</span>
                      <input
                        type="number"
                        value={formFefo.catBDays}
                        onChange={(e) => setFormFefo({ ...formFefo, catBDays: Number(e.target.value) })}
                        className="w-20 px-2 py-0.5 bg-white border border-blue-300 rounded font-bold text-xs text-blue-950 text-center"
                      />
                    </div>
                  </div>

                  {/* Cat C */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-amber-950">Категория C (Желтая зона)</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-amber-800 font-bold">Скидка:</span>
                        <input
                          type="number"
                          value={formFefo.catCDiscount}
                          onChange={(e) => setFormFefo({ ...formFefo, catCDiscount: Number(e.target.value) })}
                          className="w-16 px-2 py-0.5 bg-white border border-amber-300 rounded font-black text-xs text-amber-950 text-center"
                        />
                        <span className="text-xs font-black text-amber-950">%</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-amber-800 flex items-center justify-between">
                      <span>Порог остатка (61–120 дней):</span>
                      <input
                        type="number"
                        value={formFefo.catCDays}
                        onChange={(e) => setFormFefo({ ...formFefo, catCDays: Number(e.target.value) })}
                        className="w-20 px-2 py-0.5 bg-white border border-amber-300 rounded font-bold text-xs text-amber-950 text-center"
                      />
                    </div>
                  </div>

                  {/* Cat D */}
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-orange-950">Категория D (Оранжевая зона)</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-orange-800 font-bold">Скидка:</span>
                        <input
                          type="number"
                          value={formFefo.catDDiscount}
                          onChange={(e) => setFormFefo({ ...formFefo, catDDiscount: Number(e.target.value) })}
                          className="w-16 px-2 py-0.5 bg-white border border-orange-300 rounded font-black text-xs text-orange-950 text-center"
                        />
                        <span className="text-xs font-black text-orange-950">%</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-orange-800 flex items-center justify-between">
                      <span>Порог остатка (1–60 дней):</span>
                      <input
                        type="number"
                        value={formFefo.catDDays}
                        onChange={(e) => setFormFefo({ ...formFefo, catDDays: Number(e.target.value) })}
                        className="w-20 px-2 py-0.5 bg-white border border-orange-300 rounded font-bold text-xs text-orange-950 text-center"
                      />
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* Section 3: Branches & Warehouses */}
          {activeSection === 'branches' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">3. Управление сетью аптек и складов ({branches.length})</h2>
                    <p className="text-xs text-slate-500">Добавление, редактирование адресов и закрепелние ответственных лиц</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAddingBranch(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить филиал</span>
                </button>
              </div>

              {/* Add New Branch Form */}
              {isAddingBranch && (
                <div className="p-4 bg-slate-50 border-2 border-amber-400 rounded-2xl space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Новый филиал / склад аптечной сети</span>
                    </span>
                    <button onClick={() => setIsAddingBranch(false)} className="p-1 text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Название филиала:</label>
                      <input
                        type="text"
                        placeholder="например: Аптека №7 (г. Душанбе)"
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Город:</label>
                      <select
                        value={newBranchCity}
                        onChange={(e) => setNewBranchCity(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                      >
                        {TAJIKISTAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Адрес:</label>
                      <input
                        type="text"
                        placeholder="ул. Сомони, 45"
                        value={newBranchAddress}
                        onChange={(e) => setNewBranchAddress(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Телефон:</label>
                      <input
                        type="text"
                        placeholder="+992 900 00-00-00"
                        value={newBranchPhone}
                        onChange={(e) => setNewBranchPhone(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Заведующий / Зам:</label>
                      <input
                        type="text"
                        placeholder="Ф.И.О. заведующего"
                        value={newBranchManager}
                        onChange={(e) => setNewBranchManager(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setIsAddingBranch(false)}
                      className="px-4 py-1.5 bg-slate-200 text-slate-700 font-bold text-xs rounded-lg"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleCreateBranch}
                      className="px-4 py-1.5 bg-emerald-600 text-white font-black text-xs rounded-lg"
                    >
                      Сохранить филиал
                    </button>
                  </div>
                </div>
              )}

              {/* Branch List Table */}
              <div className="space-y-3">
                {branches.map(br => {
                  const isEditing = editingBranchId === br.id;
                  const branchBatchesCount = batches.filter(b => b.branch === br.nameRussian).length;

                  return (
                    <div key={br.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                            <div>
                              <label className="font-bold text-slate-500 block">Название:</label>
                              <input
                                type="text"
                                value={editBranchName}
                                onChange={(e) => setEditBranchName(e.target.value)}
                                className="w-full px-3 py-1 bg-white border border-amber-400 rounded-lg font-bold text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="font-bold text-slate-500 block">Город:</label>
                              <select
                                value={editBranchCity}
                                onChange={(e) => setEditBranchCity(e.target.value)}
                                className="w-full px-3 py-1 bg-white border border-amber-400 rounded-lg font-bold text-slate-900"
                              >
                                {TAJIKISTAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="font-bold text-slate-500 block">Адрес:</label>
                              <input
                                type="text"
                                value={editBranchAddress}
                                onChange={(e) => setEditBranchAddress(e.target.value)}
                                className="w-full px-3 py-1 bg-white border border-amber-400 rounded-lg font-bold text-slate-900"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingBranchId(null)} className="px-3 py-1 bg-slate-200 text-xs rounded-lg font-bold">
                              Отмена
                            </button>
                            <button onClick={() => handleSaveEditBranch(br)} className="px-3 py-1 bg-emerald-600 text-white text-xs rounded-lg font-black">
                              Сохранить
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900 text-sm">{br.nameRussian}</span>
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded border border-amber-200">
                                {br.city || 'Душанбе'}
                              </span>
                              <span className="text-[11px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                {branchBatchesCount} партий на хранении
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span>{br.address || 'ул. Сомони'}</span>
                              </span>
                              {br.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{br.phone}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStartEditBranch(br)}
                              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-all"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Редактировать</span>
                            </button>

                            {branches.length > 1 && (
                              <button
                                onClick={() => setDeletingBranch(br)}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Удалить</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Confirm Delete Branch Modal */}
              {deletingBranch && (
                <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-2xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl">
                    <div className="flex items-center gap-3 text-rose-600 font-black">
                      <AlertTriangle className="w-6 h-6 shrink-0" />
                      <span>Удаление филиала «{deletingBranch.nameRussian}»</span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Вы действительно хотите удалить этот филиал? Если на нем числятся товары, выберите склад для их автоматической перепривязки:
                    </p>

                    <select
                      value={reassignTargetBranch}
                      onChange={(e) => setReassignTargetBranch(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                    >
                      {branches.filter(b => b.id !== deletingBranch.id).map(b => (
                        <option key={b.id} value={b.nameRussian}>{b.nameRussian}</option>
                      ))}
                    </select>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setDeletingBranch(null)}
                        className="px-4 py-2 bg-slate-200 text-slate-800 font-bold text-xs rounded-xl"
                      >
                        Отмена
                      </button>
                      <button
                        onClick={handleConfirmDeleteBranch}
                        className="px-4 py-2 bg-rose-600 text-white font-black text-xs rounded-xl shadow-xs"
                      >
                        Подтвердить удаление
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 4: 1C Integration */}
          {activeSection === '1c' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">4. Параметры интеграции с 1С:Парацельс</h2>
                    <p className="text-xs text-slate-500">Префиксы кодов, форматы CSV/XML и правила синхронизации номенклатуры</p>
                  </div>
                </div>
                <button
                  onClick={handleSaveFefo}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Сохранить настройки 1С</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Префикс артикулов номенклатуры 1С:</label>
                  <input
                    type="text"
                    value={formFefo.paracelsusPrefix}
                    onChange={(e) => setFormFefo({ ...formFefo, paracelsusPrefix: e.target.value })}
                    placeholder="например: 100"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                  <p className="text-[10px] text-slate-500">Удаляет лишние символы вроде `p-` при выгрузке для корректного чтения сканерами штрихкодов.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Кодировка и Разделитель CSV:</label>
                  <input
                    type="text"
                    disabled
                    value="UTF-8 BOM (Разделитель точка с запятой ;)"
                    className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
                  />
                  <p className="text-[10px] text-slate-500">Гарантирует правильное отображение кириллицы в 1С:Парацельс и Excel.</p>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: UI & Typography */}
          {activeSection === 'ui' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                    <Type className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">5. Типографика, Шрифты и Масштаб UI</h2>
                    <p className="text-xs text-slate-500">Настройка шрифтов, мягкости начертания и масштабирования для комфорта глаз</p>
                  </div>
                </div>

                {onOpenFontModal && (
                  <button
                    onClick={onOpenFontModal}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Открыть каталог шрифтов</span>
                  </button>
                )}
              </div>

              {/* Typography Font Picker Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Основной шрифт интерфейса:
                  </label>
                  <span className="text-xs text-slate-500 font-normal">
                    Текущий: <strong className="text-amber-800">{AVAILABLE_FONTS.find(f => f.id === currentFontId)?.name || 'Montserrat'}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {AVAILABLE_FONTS.map(font => {
                    const isSelected = font.id === currentFontId;
                    return (
                      <button
                        key={font.id}
                        onClick={() => onSelectFont && onSelectFont(font.id)}
                        style={{ fontFamily: font.fontFamily }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/40 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{font.name}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{font.popularFor}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Weight Softening Control */}
              {onSelectWeight && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Мягкость и жирность начертания</span>
                      <p className="text-[11px] text-slate-500">Устраняет резкие «жирные» блоки текста для мягкого восприятия</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'light' as const, label: '🪶 Тонкий (Light)', desc: 'Легкий и утонченный' },
                      { id: 'normal' as const, label: '⚖️ Мягкий (Regular)', desc: 'Рекомендуемый комфорт' },
                      { id: 'medium' as const, label: '💎 Средний (Medium)', desc: 'Четкие контуры' },
                      { id: 'bold' as const, label: '🔲 Плотный (Bold)', desc: 'Выразительный' },
                    ].map(w => {
                      const isSelected = currentWeight === w.id;
                      return (
                        <button
                          key={w.id}
                          onClick={() => onSelectWeight(w.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white border-amber-500 shadow-xs ring-1 ring-amber-500 font-bold'
                              : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
                          }`}
                        >
                          <div className="text-xs font-bold text-slate-900">{w.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{w.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Number Font Selector */}
              {onSelectNumberFont && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-slate-900 block">Шрифт для цифр и таблиц (Цены, Суммы, Партии)</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {NUMBER_FONT_PRESETS.map(nfp => {
                      const isSelected = currentNumberFontId === nfp.id;
                      return (
                        <button
                          key={nfp.id}
                          onClick={() => onSelectNumberFont(nfp.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white border-amber-500 shadow-xs ring-1 ring-amber-500 font-bold'
                              : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
                          }`}
                        >
                          <div className="text-xs font-bold text-slate-900">{nfp.name}</div>
                          <div className="text-[11px] text-amber-700 font-mono mt-1 font-bold">14 850,50 с.</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* UI Scale */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Масштаб интерфейса:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { code: 'compact' as const, label: 'Компактный (87.5%)', desc: 'Для плотных экранов и опытных пользователей' },
                    { code: 'normal' as const, label: 'Стандартный (100%)', desc: 'Базовый интерфейс системы' },
                    { code: 'large' as const, label: 'Увеличенный (118%)', desc: 'Комфортный крупный шрифт' },
                    { code: 'xlarge' as const, label: 'Крупный (137.5%)', desc: 'Максимальный размер для пожилых сотрудников' },
                  ].map(s => {
                    const isSelected = uiScale === s.code;
                    return (
                      <button
                        key={s.code}
                        onClick={() => onUpdateUiScale(s.code)}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-amber-500/10 border-2 border-amber-500 shadow-2xs' 
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-900">{s.label}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 font-medium">{s.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Section 6: Backup & Reset */}
          {activeSection === 'backup' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">6. Резервное копирование и База данных</h2>
                    <p className="text-xs text-slate-500">Экспорт полного дампа БД в JSON, импорт копии и полная очистка перед загрузкой 1С</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Export Backup */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-slate-900 block">Выгрузка резервной копии (.JSON)</span>
                    <p className="text-[11px] text-slate-500 font-medium">Сохраняет все партии, аудит-логи, филиалы и профиль инспектора в один файл.</p>
                  </div>
                  <button
                    onClick={handleExportBackupJSON}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>Скачать резервную копию</span>
                  </button>
                </div>

                {/* Import Backup */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-slate-900 block">Загрузка резервной копии (.JSON)</span>
                    <p className="text-[11px] text-slate-500 font-medium">Восстановление полного состояния базы данных из ранее сохраненного файла.</p>
                  </div>
                  <label className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>Выбрать .JSON файл</span>
                    <input type="file" accept=".json" onChange={handleImportBackupJSON} className="hidden" />
                  </label>
                </div>

                {/* Reset Data */}
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-rose-950 block">Очистить базу данных</span>
                    <p className="text-[11px] text-rose-800 font-medium">Полная очистка базы данных перед вводом в эксплуатацию и импортом отчетов 1С.</p>
                  </div>
                  <button
                    onClick={onResetData}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Очистить базу (0 партий)...</span>
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
