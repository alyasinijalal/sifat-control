import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  ShieldCheck, 
  X,
  Save,
  CheckCircle2,
  Users,
  Building2,
  Award,
  BadgeCheck
} from 'lucide-react';
import { UserProfile, CommissionMember } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  commissionMembers: CommissionMember[];
  onSaveProfile: (profile: UserProfile) => void;
  onSaveCommission: (members: CommissionMember[]) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  commissionMembers,
  onSaveProfile,
  onSaveCommission,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'commission'>('profile');

  // Form State for User Profile
  const [formProfile, setFormProfile] = useState<UserProfile>(userProfile);

  // Form State for Commission Members
  const [formCommission, setFormCommission] = useState<CommissionMember[]>(commissionMembers);

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    setFormProfile(userProfile);
  }, [userProfile, isOpen]);

  useEffect(() => {
    setFormCommission(commissionMembers);
  }, [commissionMembers, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveProfile(formProfile);
    onSaveCommission(formCommission);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleCommissionChange = (index: number, field: keyof CommissionMember, value: string) => {
    const updated = [...formCommission];
    updated[index] = { ...updated[index], [field]: value };
    setFormCommission(updated);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-600 shrink-0 shadow-2xs">
              <UserCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Настройка ответственных лиц и комиссии</span>
                <BadgeCheck className="w-4 h-4 text-emerald-600 fill-emerald-100" />
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Введите реальные Ф.И.О. сотрудников для отображения во всех актах, документах и отчетах 1С
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>1. Личные данные и Руководство</span>
          </button>
          <button
            onClick={() => setActiveTab('commission')}
            className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'commission'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-amber-500" />
            <span>2. Члены комиссии (4 подписи)</span>
          </button>
        </div>

        {/* Tab 1: Profile & Director */}
        {activeTab === 'profile' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-amber-500" />
                <span>Текущий специалист (Вы в системе)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Ф.И.О. сотрудника (Реальная фамилия):
                  </label>
                  <input
                    type="text"
                    value={formProfile.fullName}
                    onChange={(e) => setFormProfile({ ...formProfile, fullName: e.target.value })}
                    placeholder="Например: Рахимов А. Б."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Должность:
                  </label>
                  <input
                    type="text"
                    value={formProfile.position}
                    onChange={(e) => setFormProfile({ ...formProfile, position: e.target.value })}
                    placeholder="Например: Главный провизор-инспектор"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Название компании / Органицации:
                  </label>
                  <input
                    type="text"
                    value={formProfile.organization}
                    onChange={(e) => setFormProfile({ ...formProfile, organization: e.target.value })}
                    placeholder="ООО «Сифат Фарма»"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Сертификат / Лицензия GDP:
                  </label>
                  <input
                    type="text"
                    value={formProfile.gdpCertificate}
                    onChange={(e) => setFormProfile({ ...formProfile, gdpCertificate: e.target.value })}
                    placeholder="TAJ-GDP-2026-9001"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Director Information */}
            <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-3">
              <div className="font-bold text-amber-950 flex items-center gap-2 text-xs uppercase tracking-wider">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Гриф «УТВЕРЖДАЮ» (Генеральный директор)</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">
                  Ф.И.О. Генерального директора (подписывающего акты):
                </label>
                <input
                  type="text"
                  value={formProfile.directorName}
                  onChange={(e) => setFormProfile({ ...formProfile, directorName: e.target.value })}
                  placeholder="Например: Ахмедов С. Х."
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <p className="text-[10px] text-amber-800 mt-1">
                  Указанные Ф.И.О. будут автоматически подставляться под гриф «УТВЕРЖДАЮ» во всех печатных формах Актов списания и выгрузках в Excel.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Commission Members */}
        {activeTab === 'commission' && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] leading-relaxed">
              Укажите реальные Ф.И.О. и должности членов постоянно действующей комиссии предприятия по инвентаризации, списанию и переоценке препаратов:
            </div>

            <div className="space-y-3">
              {formCommission.map((member, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                    <span className="text-amber-600">• Член комиссии №{idx + 1} ({member.roleRussian})</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Ф.И.О. сотрудника:
                      </label>
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => handleCommissionChange(idx, 'name', e.target.value)}
                        placeholder="Например: Каримов Р. Н."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Должность:
                      </label>
                      <input
                        type="text"
                        value={member.titleRussian}
                        onChange={(e) => handleCommissionChange(idx, 'titleRussian', e.target.value)}
                        placeholder="Заведующий складом"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="text-xs text-slate-500">
            {savedSuccess ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1 animate-pulse">
                <CheckCircle2 className="w-4 h-4" />
                Сохранено и применено ко всем документам!
              </span>
            ) : (
              <span>Данные сохраняются локально на этом ПК</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Сохранить реальные Ф.И.О.</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
