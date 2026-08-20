import React, { useState, useEffect } from 'react';
import { ShieldAlert, KeyRound, Copy, Check, Lock, Cpu, Sparkles } from 'lucide-react';
import { fetchSystemHWID, generateKeyForHWID, isLicenseValid, saveLicense } from '../utils/licenseUtils';

interface LicenseModalProps {
  onActivated: () => void;
}

export function LicenseModal({ onActivated }: LicenseModalProps) {
  const [hwid, setHwid] = useState<string>('ЗАГРУЗКА...');
  const [enteredKey, setEnteredKey] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchSystemHWID().then((id) => setHwid(id));
  }, []);

  const handleCopyHWID = () => {
    navigator.clipboard.writeText(hwid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    setTimeout(() => {
      if (!enteredKey.trim()) {
        setError('Пожалуйста, введите ключ активации.');
        setIsSubmitting(false);
        return;
      }

      if (isLicenseValid(hwid, enteredKey)) {
        saveLicense(enteredKey);
        onActivated();
      } else {
        setError('Неверный ключ активации. Ключ не подходит к текущему оборудованию компьютера.');
        setIsSubmitting(false);
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 p-6 md:p-8 space-y-6">
        
        {/* Top Decorative Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-3 relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 mb-1 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Активация Sifat Control
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            Приложение привязано к аппаратному оборудованию этого компьютера. Для использования требуется лицензионный ключ.
          </p>
        </div>

        {/* HWID Card */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-2 relative z-10">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Cpu className="w-4 h-4" />
              Код вашего компьютера (HWID):
            </span>
          </div>
          
          <div className="flex items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3">
            <code className="font-mono text-base font-bold text-amber-300 tracking-wider select-all">
              {hwid}
            </code>
            <button
              type="button"
              onClick={handleCopyHWID}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg transition-colors border border-slate-700 shrink-0"
              title="Скопировать HWID"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Скопировать</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 italic">
            Скопируйте этот код и отправьте его администратору для получения ключа.
          </p>
        </div>

        {/* Activation Form */}
        <form onSubmit={handleActivate} className="space-y-4 relative z-10">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Ключ активации:
            </label>
            <div className="relative">
              <KeyRound className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={enteredKey}
                onChange={(e) => {
                  setEnteredKey(e.target.value);
                  setError(null);
                }}
                placeholder="например: KEY-RLBG-QJFY-0RSU-11VK"
                className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-white font-mono placeholder:text-slate-600 text-sm tracking-wider uppercase outline-none transition-all"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs leading-relaxed animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:from-emerald-600 active:to-teal-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSubmitting ? 'Проверка ключа...' : 'Активировать программу'}</span>
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-400 border-t border-slate-800/80 pt-3 relative z-10">
          Sifat Control v1.0.0 — Защищенная лицензионная сборка
        </div>
      </div>
    </div>
  );
}
