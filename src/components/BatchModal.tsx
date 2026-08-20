import React, { useState } from 'react';
import { Pill, Save } from 'lucide-react';
import { MedicationBatch, BranchInfo } from '../types';
import { BRANCHES_LIST } from '../data/initialData';

interface BatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBatch: (batchData: Partial<MedicationBatch>) => void;
  initialBatch?: MedicationBatch | null;
  branches?: BranchInfo[];
}

export const BatchModal: React.FC<BatchModalProps> = ({
  isOpen,
  onClose,
  onSaveBatch,
  initialBatch,
  branches = BRANCHES_LIST,
}) => {
  if (!isOpen) return null;

  const [productName, setProductName] = useState(initialBatch?.productName || '');
  const [lotNumber, setLotNumber] = useState(initialBatch?.lotNumber || '');
  const [expiryDate, setExpiryDate] = useState(initialBatch?.expiryDate || '2026-12-31');
  const [quantity, setQuantity] = useState(initialBatch?.quantity || 100);
  const [initialQuantity, setInitialQuantity] = useState(initialBatch?.initialQuantity || initialBatch?.quantity || 100);
  const [unit, setUnit] = useState(initialBatch?.unit || 'уп.');
  const [purchasePrice, setPurchasePrice] = useState(initialBatch?.purchasePrice || 10.0);
  const [retailPrice, setRetailPrice] = useState(initialBatch?.retailPrice || 15.0);
  const [branch, setBranch] = useState(initialBatch?.branch || BRANCHES_LIST[0].nameRussian);
  const [supplier, setSupplier] = useState(initialBatch?.supplier || 'ООО «Сифат Фарма»');
  const [manufacturer, setManufacturer] = useState(initialBatch?.manufacturer || '');
  const [deliveryDate, setDeliveryDate] = useState(initialBatch?.deliveryDate || '');
  const [isCosmetic, setIsCosmetic] = useState(initialBatch?.isCosmetic || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !expiryDate) return;

    onSaveBatch({
      id: initialBatch?.id,
      productName,
      lotNumber,
      expiryDate,
      deliveryDate,
      quantity: Number(quantity),
      initialQuantity: Number(initialQuantity),
      unit,
      purchasePrice: Number(purchasePrice),
      retailPrice: Number(retailPrice),
      branch,
      supplier,
      manufacturer,
      isCosmetic,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Pill className="w-5 h-5 text-amber-500" />
            <span>
              {initialBatch ? 'Редактировать партию' : 'Добавить новую партию'}
            </span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Наименование препарата:
            </label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Амоксициллин 500мг №20"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">LOT / Серия:</label>
              <input
                type="text"
                required
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                placeholder="LOT-2026-99"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Срок годности (Expiry):
              </label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Наличие (Текущий остаток):</label>
              <input
                type="number"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Ко-во прихода (Приход):</label>
              <input
                type="number"
                min="0"
                required
                value={initialQuantity}
                onChange={(e) => setInitialQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Цена прихода (TJS):</label>
              <input
                type="number"
                step="0.01"
                required
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Розн. цена (TJS):</label>
              <input
                type="number"
                step="0.01"
                required
                value={retailPrice}
                onChange={(e) => setRetailPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Ед. изм.:</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Филиал / Склад:</label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.nameRussian}>
                    {b.nameRussian}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Поставщик:</label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Производитель (Завод):</label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="Фармасинтез АО, Россия"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Дата поставки:</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="cosmetic-check"
              checked={isCosmetic}
              onChange={(e) => setIsCosmetic(e.target.checked)}
              className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 w-4 h-4"
            />
            <label htmlFor="cosmetic-check" className="text-slate-700 font-semibold cursor-pointer">
              Косметический продукт (Приложение 14 - PAO)
            </label>
          </div>

          {initialBatch && (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-0.5 font-medium">
              <div className="flex justify-between">
                <span>Дата первоначального ввода:</span>
                <span className="font-bold text-slate-800">{initialBatch.createdDate || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Последнее обновление:</span>
                <span className="font-bold text-amber-700">{initialBatch.lastModifiedDate || '—'}</span>
              </div>
              {initialBatch.modifiedBy && (
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Ответственный оператор:</span>
                  <span className="italic">{initialBatch.modifiedBy}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#FFC107] hover:bg-amber-400 text-slate-950 font-black shadow-xs cursor-pointer flex items-center gap-1.5 uppercase tracking-wide"
            >
              <Save className="w-4 h-4" />
              <span>Сохранить</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
