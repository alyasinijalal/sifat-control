import React, { useState, useMemo } from 'react';
import { 
  Type, 
  X, 
  Check, 
  Sparkles, 
  Sliders, 
  Eye, 
  Search, 
  RotateCcw,
  Layers,
  Hash,
  Smile
} from 'lucide-react';
import { AVAILABLE_FONTS, NUMBER_FONT_PRESETS, FontPreset, FontWeightLevel } from '../utils/fontPresets';

interface FontSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFontId: string;
  onSelectFont: (fontId: string) => void;
  currentNumberFontId: string;
  onSelectNumberFont: (fontId: string) => void;
  currentWeight: FontWeightLevel;
  onSelectWeight: (weight: FontWeightLevel) => void;
}

export const FontSwitcherModal: React.FC<FontSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentFontId,
  onSelectFont,
  currentNumberFontId,
  onSelectNumberFont,
  currentWeight,
  onSelectWeight,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewCustomText, setPreviewCustomText] = useState<string>('');

  const categories = [
    { id: 'ALL', label: 'Все шрифты', count: AVAILABLE_FONTS.length },
    { id: 'Геометрические', label: 'Геометрические' },
    { id: 'Интерфейсные', label: 'Интерфейсные' },
    { id: 'Мягкие и скругленные', label: 'Мягкие и скругленные' },
    { id: 'Классические и деловые', label: 'Классические и деловые' },
  ];

  const filteredFonts = useMemo(() => {
    return AVAILABLE_FONTS.filter(f => {
      const matchCat = selectedCategory === 'ALL' || f.category === selectedCategory;
      const matchQuery = !searchQuery.trim() || 
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.popularFor.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const currentFont = AVAILABLE_FONTS.find(f => f.id === currentFontId) || AVAILABLE_FONTS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400 text-slate-950">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Каталог типографики и шрифтов</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {AVAILABLE_FONTS.length} лучших веб-шрифтов
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-normal">
                Выберите комфортный шрифт и мягкость начертания для работы без усталости глаз
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Bar: Search & Category Chips */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          {/* Top Row: Search and Quick Weight Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск шрифта по названию или стилю..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Weight Switcher (Soft, Normal, Medium, Bold) */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
              <span className="text-[10px] text-slate-500 font-semibold px-2 flex items-center gap-1">
                <Sliders className="w-3 h-3 text-slate-400" />
                <span>Жирность:</span>
              </span>
              <button
                onClick={() => onSelectWeight('light')}
                className={`px-2 py-1 rounded-lg text-xs font-normal transition-all cursor-pointer ${
                  currentWeight === 'light' 
                    ? 'bg-white text-slate-900 shadow-xs font-semibold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Легкая / Утонченная (Light 300)"
              >
                Тонкий
              </button>
              <button
                onClick={() => onSelectWeight('normal')}
                className={`px-2 py-1 rounded-lg text-xs font-normal transition-all cursor-pointer ${
                  currentWeight === 'normal' 
                    ? 'bg-amber-400 text-slate-950 shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Сбалансированная / Мягкая (Regular 400 — рекомендуемая)"
              >
                Мягкий
              </button>
              <button
                onClick={() => onSelectWeight('medium')}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  currentWeight === 'medium' 
                    ? 'bg-white text-slate-900 shadow-xs font-semibold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Средняя контрастность (Medium 500)"
              >
                Средний
              </button>
              <button
                onClick={() => onSelectWeight('bold')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentWeight === 'bold' 
                    ? 'bg-white text-slate-900 shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Акцентная (Bold 600-700)"
              >
                Плотный
              </button>
            </div>
          </div>

          {/* Categories Tab Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Font Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredFonts.map(font => {
              const isSelected = font.id === currentFontId;

              return (
                <div
                  key={font.id}
                  onClick={() => onSelectFont(font.id)}
                  style={{ fontFamily: font.fontFamily }}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative group ${
                    isSelected 
                      ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/40 shadow-sm' 
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{font.name}</h3>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-normal">
                          {font.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {font.description}
                      </p>
                    </div>

                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'bg-amber-500 text-white' : 'border border-slate-300 text-transparent group-hover:border-slate-400'
                    }`}>
                      <Check className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Sample Preview Text */}
                  <div className="mt-2.5 p-2 rounded-lg bg-slate-50/80 border border-slate-100 text-slate-800 text-xs">
                    <div className="font-semibold text-slate-900">
                      {previewCustomText || font.sample}
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal mt-1 flex items-center justify-between">
                      <span>Автор: {font.author}</span>
                      <span className="text-amber-700 font-medium">{font.popularFor}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredFonts.length === 0 && (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <Type className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs">Шрифтов по вашему запросу не найдено</p>
            </div>
          )}
        </div>

        {/* Number Font & Reset Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              <span>Шрифт для цифр и таблиц:</span>
            </span>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              {NUMBER_FONT_PRESETS.map(nfp => (
                <button
                  key={nfp.id}
                  onClick={() => onSelectNumberFont(nfp.id)}
                  className={`px-2 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                    currentNumberFontId === nfp.id
                      ? 'bg-white font-bold text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 font-normal'
                  }`}
                >
                  {nfp.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => {
                onSelectFont('montserrat');
                onSelectNumberFont('outfit');
                onSelectWeight('normal');
              }}
              className="px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Сброс (Montserrat + Outfit)</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              Применить и закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
