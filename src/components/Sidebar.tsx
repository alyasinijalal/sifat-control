import React, { useState, useRef } from 'react';
import { 
  LayoutDashboard, 
  Pill, 
  FileText, 
  History, 
  ShieldAlert, 
  Upload, 
  CalendarCheck2,
  UserCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
  ArrowRightLeft,
  Settings,
  UploadCloud,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { UserProfile, CommissionMember, MedicationBatch, BranchInfo, AuditLogItem } from '../types';
import { UserProfileModal } from './UserProfileModal';
import { smartParseExcelRows, decodeFileBuffer, parseXml1CToCsv, splitCsvLine } from './ImportView';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  quarantineCount: number;
  atRiskCount: number;
  totalBatchesCount: number;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  userProfile: UserProfile;
  commissionMembers: CommissionMember[];
  onSaveProfile: (profile: UserProfile) => void;
  onSaveCommission: (members: CommissionMember[]) => void;
  onImportBatches?: (imported: Partial<MedicationBatch>[], replaceExisting?: boolean) => void;
  onImportBackup?: (data: { batches?: MedicationBatch[]; branches?: BranchInfo[]; auditLogs?: AuditLogItem[] }) => void;
  defaultBranchName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  quarantineCount,
  atRiskCount,
  totalBatchesCount,
  isMobileOpen,
  setIsMobileOpen,
  userProfile,
  commissionMembers,
  onSaveProfile,
  onSaveCommission,
  onImportBatches,
  onImportBackup,
  defaultBranchName = 'Центральный склад (г. Душанбе)',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Quick Drag & Drop Import State
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importToast, setImportToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processSidebarFile = (file: File) => {
    if (!file) return;
    setIsImporting(true);
    setImportToast(null);

    const fName = file.name.toLowerCase();
    const isExcel = fName.endsWith('.xls') || fName.endsWith('.xlsx');
    const isXml = fName.endsWith('.xml') || fName.endsWith('.rps');
    const isJson = fName.endsWith('.json');

    setTimeout(() => {
      const reader = new FileReader();

      if (isJson) {
        reader.onload = (e) => {
          try {
            const text = e.target?.result as string;
            const parsedData = JSON.parse(text);
            if (onImportBackup && (parsedData.batches || parsedData.branches)) {
              onImportBackup(parsedData);
              setImportToast(`Загружен дамп БД!`);
              setActiveTab('inventory');
            } else if (Array.isArray(parsedData) && onImportBatches) {
              onImportBatches(parsedData, true);
              setImportToast(`Импортировано ${parsedData.length} партий!`);
              setActiveTab('inventory');
            }
          } catch (err) {
            alert('Ошибка чтения JSON файла');
          } finally {
            setIsImporting(false);
            setTimeout(() => setImportToast(null), 3500);
          }
        };
        reader.readAsText(file);
      } else if (isExcel) {
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false }) as any[][];
            const parsed = smartParseExcelRows(rows, defaultBranchName);

            if (parsed.length > 0 && onImportBatches) {
              onImportBatches(parsed, true);
              setImportToast(`Загружено ${parsed.length} партий Excel!`);
              setActiveTab('inventory');
            } else {
              alert('Не удалось извлечь партии из файла Excel');
            }
          } catch (err) {
            alert('Ошибка чтения файла Excel');
          } finally {
            setIsImporting(false);
            setTimeout(() => setImportToast(null), 3500);
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (isXml) {
        reader.onload = (e) => {
          try {
            const buffer = e.target?.result as ArrayBuffer;
            if (buffer) {
              const text = decodeFileBuffer(buffer);
              const parsedCsv = parseXml1CToCsv(text, defaultBranchName);
              const lines = parsedCsv.split('\n').filter(l => l.trim().length > 0);
              const delimiter = lines[0]?.includes(';') ? ';' : (lines[0]?.includes('\t') ? '\t' : ',');
              const rows = lines.map(line => splitCsvLine(line, delimiter));
              const parsed = smartParseExcelRows(rows, defaultBranchName);

              if (parsed.length > 0 && onImportBatches) {
                onImportBatches(parsed, true);
                setImportToast(`Импортировано ${parsed.length} партий 1С!`);
                setActiveTab('inventory');
              } else {
                alert('Не удалось распознать формат XML 1С');
              }
            }
          } catch (err) {
            alert('Ошибка при разборе XML файла 1С');
          } finally {
            setIsImporting(false);
            setTimeout(() => setImportToast(null), 3500);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        // CSV / TXT
        reader.onload = (e) => {
          try {
            const buffer = e.target?.result as ArrayBuffer;
            if (buffer) {
              const text = decodeFileBuffer(buffer).replace(/\t/g, ',');
              const lines = text.split('\n').filter(l => l.trim().length > 0);
              const delimiter = lines[0]?.includes(';') ? ';' : (lines[0]?.includes('\t') ? '\t' : ',');
              const rows = lines.map(line => splitCsvLine(line, delimiter));
              const parsed = smartParseExcelRows(rows, defaultBranchName);

              if (parsed.length > 0 && onImportBatches) {
                onImportBatches(parsed, true);
                setImportToast(`Загружено ${parsed.length} партий!`);
                setActiveTab('inventory');
              } else {
                alert('Не удалось прочитать партии из текстового файла');
              }
            }
          } catch (err) {
            alert('Ошибка формата CSV/TXT');
          } finally {
            setIsImporting(false);
            setTimeout(() => setImportToast(null), 3500);
          }
        };
        reader.readAsArrayBuffer(file);
      }
    }, 50);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSidebarFile(file);
    }
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Аналитика и Дашборд FEFO',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'inventory',
      label: 'Цифровой реестр партий',
      icon: Pill,
      badge: atRiskCount > 0 ? { text: String(atRiskCount), color: 'bg-amber-400 text-slate-950 font-black' } : null,
    },
    {
      id: 'quarantine',
      label: 'Зона карантина (Cat E)',
      icon: ShieldAlert,
      badge: quarantineCount > 0 ? { text: String(quarantineCount), color: 'bg-rose-500 text-white font-black' } : null,
    },
    {
      id: 'transfers',
      label: 'Умная ротация и Филиалы',
      icon: ArrowRightLeft,
      badge: null,
    },
    {
      id: 'import',
      label: '1С Парацельс: Импорт и Выгрузка',
      icon: Upload,
      badge: null,
    },
    {
      id: 'annexes',
      label: 'Документы и Акты (Прил. 1–15)',
      icon: FileText,
      badge: null,
    },
    {
      id: 'audit',
      label: 'Журнал аудита ISO/GDP',
      icon: History,
      badge: null,
    },
    {
      id: 'settings',
      label: 'Параметры и Настройки СМК',
      icon: Settings,
      badge: null,
    },
  ];

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-2xs z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 z-50 md:z-30 h-screen bg-[#111319] text-slate-300 flex flex-col justify-between border-r border-slate-800 shadow-2xl select-none no-print transition-all duration-200 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-slate-800/90 flex items-center justify-between bg-[#151821]">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 bg-[#FFC107] rounded-xl flex items-center justify-center font-black text-slate-950 shadow-md shrink-0">
                <Pill className="w-5 h-5 text-slate-950" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <span className="font-black text-sm text-white block leading-tight tracking-tight truncate">
                    Sifat Control
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold tracking-wider uppercase block truncate">
                    ҶДММ «Сифат Фарма»
                  </span>
                </div>
              )}
            </div>

            {/* Close Mobile Button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-1 text-slate-400 hover:text-white md:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
              title={isCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* FEFO System Status Widget */}
          {!isCollapsed ? (
            <div className="p-3 mx-3 my-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <CalendarCheck2 className="w-3.5 h-3.5" />
                  <span>Контроль FEFO</span>
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono border border-slate-700">
                  10.08.2026
                </span>
              </div>

              <div className="space-y-1 pt-1 border-t border-slate-800 text-[10px] text-slate-400 font-medium">
                <div className="flex justify-between">
                  <span>Всего партий:</span>
                  <span className="font-bold text-white">{totalBatchesCount} шт.</span>
                </div>
                <div className="flex justify-between">
                  <span>Интеграция 1С:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Активна
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="my-2 text-center">
              <span className="text-[10px] font-mono text-amber-400 font-bold bg-slate-900 px-2 py-1 rounded border border-slate-800 inline-block">
                {totalBatchesCount}п
              </span>
            </div>
          )}

          {/* Quick Drag & Drop File Import Box */}
          <div className="px-3 py-1">
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".xml,.xlsx,.xls,.csv,.txt,.json,.rps" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processSidebarFile(file);
              }}
            />

            {!isCollapsed ? (
              <div 
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 rounded-xl border-2 border-dashed transition-all cursor-pointer group relative overflow-hidden ${
                  isDraggingFile 
                    ? 'bg-amber-400/20 border-amber-400 scale-[1.02] shadow-lg shadow-amber-400/20' 
                    : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-700/80 hover:border-amber-400/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
                    isDraggingFile ? 'bg-amber-400 text-slate-950 animate-bounce' : 'bg-slate-800 text-amber-400 border border-slate-700'
                  }`}>
                    {isImporting ? (
                      <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <UploadCloud className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-black text-white block truncate leading-tight group-hover:text-amber-300 transition-colors">
                      {isDraggingFile ? 'Отпустите файл!' : 'Импорт базы (1С/Excel)'}
                    </span>
                    <span className="text-[9px] text-slate-400 block truncate font-medium mt-0.5">
                      Перетащите .XML,.XLSX сюда
                    </span>
                  </div>
                </div>

                {importToast && (
                  <div className="absolute inset-0 bg-emerald-950/95 text-emerald-300 text-[10px] font-black flex items-center justify-center px-2 text-center animate-in fade-in duration-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mr-1 shrink-0" />
                    <span>{importToast}</span>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                title="Перетащите или выберите файл базы (1С XML / Excel)"
                className={`w-full py-2.5 rounded-xl border border-dashed flex items-center justify-center transition-all cursor-pointer ${
                  isDraggingFile ? 'bg-amber-400 text-slate-950 border-amber-400 scale-110' : 'bg-slate-900 text-amber-400 border-slate-700 hover:border-amber-400 hover:bg-slate-800'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="px-2 space-y-1">
            {!isCollapsed && (
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1">
                МЕНЮ УПРАВЛЕНИЯ
              </div>
            )}
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-slate-800/90 text-white border-l-4 border-amber-400 pl-2.5 shadow-xs font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isCollapsed && item.badge && (
                    <span className={`px-2 py-0.5 text-[10px] rounded-full shadow-2xs ${item.badge.color}`}>
                      {item.badge.text}
                    </span>
                  )}
                  {isCollapsed && item.badge && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-2 right-2" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Inspector Personal Profile */}
        <div className="p-3 border-t border-slate-800/80 bg-[#0d0e13]">
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className={`w-full text-left p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer group flex items-center gap-2.5 ${
              isCollapsed ? 'justify-center p-2' : ''
            }`}
            title="Личный кабинет провизора-инспектора"
          >
            <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center font-black text-amber-400 shrink-0 group-hover:border-amber-400 transition-all">
              <UserCheck className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-white font-bold text-xs truncate group-hover:text-amber-300 transition-all">
                  {userProfile.fullName || 'Нажмите для ввода Ф.И.О.'}
                </div>
                <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>{userProfile.position || 'Ответственный специалист'}</span>
                </div>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userProfile={userProfile}
        commissionMembers={commissionMembers}
        onSaveProfile={onSaveProfile}
        onSaveCommission={onSaveCommission}
      />
    </>
  );
};
