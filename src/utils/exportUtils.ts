import * as XLSX from 'xlsx';
import { MedicationBatch, CommissionMember } from '../types';
import { formatDateDDMMYYYY, getSalesVelocityInfo } from './categoryUtils';

/**
 * Helper to get a clean numeric or alphanumeric 1C Code for export
 */
export function format1CCode(batch: MedicationBatch | Partial<MedicationBatch> | string | undefined, index: number): string {
  if (!batch) return (100100 + index).toString();
  
  if (typeof batch === 'object') {
    if (batch.code1C && String(batch.code1C).trim()) {
      return String(batch.code1C).trim();
    }
    if (batch.barcode && String(batch.barcode).trim()) {
      return String(batch.barcode).trim();
    }
    return format1CCode(batch.id, index);
  }

  const id = String(batch).trim();
  if (!id) return (100100 + index).toString();

  if (id.startsWith('p-')) {
    const numPart = id.replace('p-', '');
    if (!isNaN(Number(numPart))) {
      return (100000 + Number(numPart)).toString();
    }
    return numPart;
  }
  if (id.startsWith('imp-')) {
    const parts = id.split('-');
    if (parts.length >= 3 && !isNaN(Number(parts[2]))) {
      return (100000 + Number(parts[2])).toString();
    }
    const numsOnly = id.replace(/\D/g, '');
    if (numsOnly && numsOnly.length >= 3) {
      return numsOnly.slice(-6);
    }
    return (100100 + index).toString();
  }
  return id;
}

/**
 * Safely escape XML characters
 */
function escapeXml(unsafe: string | number | undefined | null): string {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Native Excel (.xlsx) Export with formatted columns, auto-width, and summary rows
 */
export function exportBatchesToExcelXLSX(batches: MedicationBatch[], filenamePrefix: string = 'FEFO_Реестр_Партий') {
  const wb = XLSX.utils.book_new();

  // 1. Data rows formatting
  const rowsData = batches.map((b, idx) => {
    const qty = Number(b.quantity) || 0;
    const oldRetail = Number(b.retailPrice) || 0;
    const disc = Number(b.currentDiscount) || 0;
    const newPrice = disc > 0 ? (Number(b.discountedPrice) || (oldRetail * (1 - disc / 100))) : oldRetail;
    const sumTotal = +(newPrice * qty).toFixed(2);
    const sumDiscount = +((oldRetail - newPrice) * qty).toFixed(2);

    let statusText = 'Обычная продажа';
    if (b.isQuarantined || b.category === 'E') {
      statusText = 'КАРАНТИН (Списано / Блокировка продаж в 1С)';
    } else if (disc > 0) {
      statusText = `Уценка FEFO (${disc}%)`;
    }

    const velInfo = getSalesVelocityInfo(b);

    return {
      '№': idx + 1,
      'Код 1С': format1CCode(b, idx),
      'Наименование медикамента': b.productName || '',
      'Серия / LOT': (b.lotNumber || '').trim(),
      'Срок годности': formatDateDDMMYYYY(b.expiryDate),
      'Осталось дней': Number(b.daysRemaining) || 0,
      'Категория FEFO': `Cat ${b.category || 'A'}`,
      'Рейтинг продаваемости': velInfo.shortLabel,
      'Процент реализации %': `${velInfo.sellThrough}%`,
      'Количество': qty,
      'Ед. изм.': b.unit || 'уп.',
      'Закупка (TJS)': Number(b.purchasePrice) || 0,
      'Розница старая (TJS)': oldRetail,
      'Скидка %': disc,
      'Новая цена (TJS)': +newPrice.toFixed(2),
      'Сумма уценки (TJS)': sumDiscount,
      'Стоимость остатка (TJS)': sumTotal,
      'Статус реализации': statusText,
      'Филиал / Склад': b.branch || '',
      'Поставщик': b.supplier || '',
    };
  });

  const ws = XLSX.utils.json_to_sheet(rowsData);

  // Set Auto Column Widths
  ws['!cols'] = [
    { wch: 6 },  // №
    { wch: 12 }, // Код 1С
    { wch: 42 }, // Наименование
    { wch: 18 }, // LOT
    { wch: 14 }, // Срок
    { wch: 14 }, // Дней
    { wch: 15 }, // Категория
    { wch: 20 }, // Рейтинг продаваемости
    { wch: 20 }, // Процент реализации
    { wch: 12 }, // Кол-во
    { wch: 8 },  // Ед
    { wch: 14 }, // Закупка
    { wch: 18 }, // Розница
    { wch: 10 }, // Скидка
    { wch: 16 }, // Новая цена
    { wch: 18 }, // Сумма уценки
    { wch: 22 }, // Стоимость остатка
    { wch: 38 }, // Статус
    { wch: 32 }, // Филиал
    { wch: 25 }, // Поставщик
  ];

  // AutoFilter & Freeze Header Row
  if (ws['!ref']) {
    ws['!autofilter'] = { ref: ws['!ref'] };
  }
  ws['!views'] = [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }];

  XLSX.utils.book_append_sheet(wb, ws, 'Реестр партий FEFO');

  // Summary sheet for Risks & Quarantines
  const riskBatches = batches.filter(b => b.category === 'C' || b.category === 'D' || b.category === 'E' || b.isQuarantined);
  if (riskBatches.length > 0) {
    const riskRows = riskBatches.map((b, idx) => {
      const qty = Number(b.quantity) || 0;
      const oldRetail = Number(b.retailPrice) || 0;
      const disc = Number(b.currentDiscount) || 0;
      const newPrice = disc > 0 ? (Number(b.discountedPrice) || (oldRetail * (1 - disc / 100))) : oldRetail;

      return {
        '№': idx + 1,
        'Код 1С': format1CCode(b, idx),
        'Наименование': b.productName,
        'Серия / LOT': (b.lotNumber || '').trim(),
        'Срок годности': formatDateDDMMYYYY(b.expiryDate),
        'Категория': `Cat ${b.category}`,
        'Количество': qty,
        'Розница старая (TJS)': oldRetail,
        'Скидка %': disc,
        'Сумма риска/уценки (TJS)': +((oldRetail - newPrice) * qty).toFixed(2),
        'Филиал': b.branch,
        'Рекомендуемое действие': b.category === 'E' || b.isQuarantined
          ? 'КАРАНТИН: Списание / Уничтожение' 
          : b.category === 'D' 
          ? 'Скидка 50% или возврат поставщику' 
          : 'Скидка 15-30%, перемещение',
      };
    });
    const wsRisk = XLSX.utils.json_to_sheet(riskRows);
    wsRisk['!cols'] = [
      { wch: 5 }, { wch: 12 }, { wch: 38 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, 
      { wch: 12 }, { wch: 18 }, { wch: 10 }, { wch: 22 }, { wch: 30 }, { wch: 35 }
    ];
    if (wsRisk['!ref']) {
      wsRisk['!autofilter'] = { ref: wsRisk['!ref'] };
    }
    wsRisk['!views'] = [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }];
    XLSX.utils.book_append_sheet(wb, wsRisk, 'Риски C-D-E');
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filenamePrefix}_${dateStr}.xlsx`);
}

/**
 * Native Excel (.xlsx) Export specifically for 1C:Paracelsus Reprice
 * Matches exact 1C Document "Переоценка товаров" table structure
 */
export function exportParacelsusRepriceXLSX(batches: MedicationBatch[], onlyDiscounted: boolean = false) {
  // If onlyDiscounted is true, filter to items with APPROVED discounts (> 0)
  // Otherwise, export all passed non-quarantined batches
  const targetList = onlyDiscounted
    ? batches.filter(b => (b.currentDiscount || 0) > 0 && !b.isQuarantined)
    : batches.filter(b => !b.isQuarantined);

  const wb = XLSX.utils.book_new();

  const rowsData = targetList.map((b, idx) => {
    const qty = Number(b.quantity) || 0;
    const oldRetail = Number(b.retailPrice) || 0;
    const disc = Number(b.currentDiscount) || 0;
    const newPrice = disc > 0 ? (Number(b.discountedPrice) || (oldRetail * (1 - disc / 100))) : oldRetail;
    const sumDiscount = +((oldRetail - newPrice) * qty).toFixed(2);
    const sumNewTotal = +(newPrice * qty).toFixed(2);

    const velInfo = getSalesVelocityInfo(b);

    return {
      'Код 1С': format1CCode(b, idx),
      'Наименование медикамента': b.productName || '',
      'Серия / LOT': (b.lotNumber || '').trim(),
      'Срок годности': formatDateDDMMYYYY(b.expiryDate),
      'Количество': qty,
      'Ед. изм.': b.unit || 'уп.',
      'Старая цена розн. (TJS)': oldRetail,
      'Скидка %': disc,
      'Новая цена розн. (TJS)': +newPrice.toFixed(2),
      'Сумма уценки (TJS)': sumDiscount,
      'Сумма по новой цене (TJS)': sumNewTotal,
      'Категория FEFO': `Cat ${b.category || 'A'}`,
      'Ходовость (Спрос)': velInfo.shortLabel,
      'Статус Переоценки': disc > 0 ? 'Утвержденная уценка FEFO' : 'Без изменения цены',
      'Филиал / Склад': b.branch || '',
      'Поставщик': b.supplier || '',
    };
  });

  const ws = XLSX.utils.json_to_sheet(rowsData);

  ws['!cols'] = [
    { wch: 12 }, // Код 1С
    { wch: 42 }, // Наименование
    { wch: 20 }, // Серия / LOT
    { wch: 15 }, // Срок годности
    { wch: 12 }, // Количество
    { wch: 10 }, // Ед. изм.
    { wch: 22 }, // Старая цена
    { wch: 12 }, // Скидка %
    { wch: 22 }, // Новая цена
    { wch: 20 }, // Сумма уценки
    { wch: 24 }, // Сумма по новой цене
    { wch: 15 }, // Категория
    { wch: 28 }, // Статус
    { wch: 35 }, // Филиал
    { wch: 28 }, // Поставщик
  ];

  // AutoFilter & Freeze Header Row
  if (ws['!ref']) {
    ws['!autofilter'] = { ref: ws['!ref'] };
  }
  ws['!views'] = [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }];

  XLSX.utils.book_append_sheet(wb, ws, 'Переоценка 1С');
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `paracelsus_reprice_1c_${dateStr}.xlsx`);
}

/**
 * Export CSV specifically formatted with ';' delimiter, UTF-8 BOM and escaped quotes for 1C
 */
export function exportParacelsusRepriceCSV(batches: MedicationBatch[], onlyDiscounted: boolean = false) {
  const targetList = onlyDiscounted
    ? batches.filter(b => (b.currentDiscount || 0) > 0 && !b.isQuarantined)
    : batches.filter(b => !b.isQuarantined);

  const headers = [
    'Код_1С',
    'Наименование_медикамента',
    'Серия_LOT',
    'Срок_годности',
    'Количество',
    'Ед_изм',
    'Старая_цена_розница_TJS',
    'Скидка_процент',
    'Новая_цена_розница_TJS',
    'Сумма_уценки_TJS',
    'Сумма_новая_TJS',
    'Категория_FEFO',
    'Статус_Переоценки',
    'Филиал_Склад',
    'Поставщик'
  ];

  const escapeCsvStr = (str: string | number | undefined | null) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = targetList.map((b, idx) => {
    const qty = Number(b.quantity) || 0;
    const oldRetail = Number(b.retailPrice) || 0;
    const disc = Number(b.currentDiscount) || 0;
    const newPrice = disc > 0 ? (Number(b.discountedPrice) || (oldRetail * (1 - disc / 100))) : oldRetail;
    const sumDiscount = ((oldRetail - newPrice) * qty).toFixed(2).replace('.', ',');
    const sumNewTotal = (newPrice * qty).toFixed(2).replace('.', ',');

    const cleanLot = (b.lotNumber || '').trim();
    const code1C = format1CCode(b, idx);
    const dateFormatted = formatDateDDMMYYYY(b.expiryDate);

    return [
      escapeCsvStr(code1C),
      escapeCsvStr(b.productName),
      escapeCsvStr(cleanLot),
      escapeCsvStr(dateFormatted),
      qty,
      escapeCsvStr(b.unit || 'уп.'),
      oldRetail.toFixed(2).replace('.', ','),
      disc,
      newPrice.toFixed(2).replace('.', ','),
      sumDiscount,
      sumNewTotal,
      escapeCsvStr(`Cat ${b.category || 'A'}`),
      escapeCsvStr(disc > 0 ? 'Утвержденная уценка FEFO' : 'Без скидки'),
      escapeCsvStr(b.branch),
      escapeCsvStr(b.supplier)
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `paracelsus_reprice_1c_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export XML document structured for 1C:Парацельс (Переоценка товаров)
 */
export function exportParacelsus1CXmlReprice(batches: MedicationBatch[], onlyDiscounted: boolean = false) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const targetList = onlyDiscounted
    ? batches.filter(b => (b.currentDiscount || 0) > 0 && !b.isQuarantined)
    : batches.filter(b => !b.isQuarantined);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<ПарацельсДокумент Тип="Переоценка" Переоценка="Истина" Организация="ООО «Сифат Фарма»" Дата="${dateStr}">\n`;
  xml += `  <Шапка>\n`;
  xml += `    <Организация>ООО «Сифат Фарма»</Организация>\n`;
  xml += `    <Дата>${dateStr}</Дата>\n`;
  xml += `    <Название>Переоценка и применение уценки FEFO</Название>\n`;
  xml += `    <ВсегоПозиций>${targetList.length}</ВсегоПозиций>\n`;
  xml += `    <СистемаМенеджментаКачества>ISO 9001 / GDP Sifat Pharma</СистемаМенеджментаКачества>\n`;
  xml += `  </Шапка>\n`;
  xml += `  <ТоварныеСтроки>\n`;

  targetList.forEach((b, idx) => {
    const code1C = format1CCode(b, idx);
    const productName = escapeXml(b.productName);
    const lot = escapeXml((b.lotNumber || '').trim());
    const dateFormatted = formatDateDDMMYYYY(b.expiryDate);
    const unit = escapeXml(b.unit || 'уп.');
    const branch = escapeXml(b.branch);

    const qty = Number(b.quantity) || 0;
    const oldRetail = Number(b.retailPrice) || 0;
    const disc = Number(b.currentDiscount) || 0;
    const newPrice = disc > 0 ? (Number(b.discountedPrice) || (oldRetail * (1 - disc / 100))) : oldRetail;
    const sumDiscount = ((oldRetail - newPrice) * qty).toFixed(2);
    const sumNewTotal = (newPrice * qty).toFixed(2);

    xml += `    <Строка N="${idx + 1}" Код1С="${code1C}" Наименование="${productName}" Серия="${lot}" СрокГодности="${dateFormatted}" Количество="${qty}" Единица="${unit}" СтараяЦена="${oldRetail.toFixed(2)}" НоваяЦена="${newPrice.toFixed(2)}" Скидка="${disc}%" СуммаУценки="${sumDiscount}" СуммаНовая="${sumNewTotal}" Категория="Cat_${b.category}" Филиал="${branch}">\n`;
    xml += `      <Код1С>${code1C}</Код1С>\n`;
    xml += `      <Наименование>${productName}</Наименование>\n`;
    xml += `      <Серия>${lot}</Серия>\n`;
    xml += `      <СрокГодности>${dateFormatted}</СрокГодности>\n`;
    xml += `      <Количество>${qty}</Количество>\n`;
    xml += `      <Единица>${unit}</Единица>\n`;
    xml += `      <СтараяЦена>${oldRetail.toFixed(2)}</СтараяЦена>\n`;
    xml += `      <НоваяЦена>${newPrice.toFixed(2)}</НоваяЦена>\n`;
    xml += `      <Скидка>${disc}</Скидка>\n`;
    xml += `      <СуммаУценки>${sumDiscount}</СуммаУценки>\n`;
    xml += `      <СуммаНовая>${sumNewTotal}</СуммаНовая>\n`;
    xml += `      <Категория>Cat_${b.category}</Категория>\n`;
    xml += `      <Филиал>${branch}</Филиал>\n`;
    xml += `    </Строка>\n`;
  });

  xml += `  </ТоварныеСтроки>\n`;
  xml += `</ПарацельсДокумент>`;

  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `1C_Paracelsus_Reprice_Doc_${dateStr}.xml`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export XML document structured for 1C:Парацельс (Акт списания / Изоляция в карантин)
 */
export function exportParacelsus1CXmlQuarantine(batches: MedicationBatch[]) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const quarantined = batches.filter(b => b.isQuarantined || b.category === 'E');
  const targetList = quarantined.length > 0 ? quarantined : batches;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<ПарацельсДокумент Тип="Списание" Списание="Истина" Карантин="Истина" Организация="ООО «Сифат Фарма»" Дата="${dateStr}">\n`;
  xml += `  <Шапка>\n`;
  xml += `    <Организация>ООО «Сифат Фарма»</Организация>\n`;
  xml += `    <Дата>${dateStr}</Дата>\n`;
  xml += `    <Название>Акт изъятия просроченных препаратов в Карантин (Cat E)</Название>\n`;
  xml += `    <ВсегоПозиций>${targetList.length}</ВсегоПозиций>\n`;
  xml += `    <НормативныйАкт>Приложение 5 FEFO / GDP</НормативныйАкт>\n`;
  xml += `  </Шапка>\n`;
  xml += `  <ТоварныеСтроки>\n`;

  targetList.forEach((b, idx) => {
    const code1C = format1CCode(b, idx);
    const productName = escapeXml(b.productName);
    const lot = escapeXml((b.lotNumber || '').trim());
    const dateFormatted = formatDateDDMMYYYY(b.expiryDate);
    const unit = escapeXml(b.unit || 'уп.');
    const branch = escapeXml(b.branch);
    const qty = Number(b.quantity) || 0;
    const purchase = Number(b.purchasePrice) || 0;
    const retail = Number(b.retailPrice) || 0;

    xml += `    <Строка N="${idx + 1}" Код1С="${code1C}" Наименование="${productName}" Серия="${lot}" СрокГодности="${dateFormatted}" Количество="${qty}" Единица="${unit}" Себестоимость="${purchase.toFixed(2)}" СуммаСписания="${(retail * qty).toFixed(2)}" Причина="Истечение срока годности" Филиал="${branch}">\n`;
    xml += `      <Код1С>${code1C}</Код1С>\n`;
    xml += `      <Наименование>${productName}</Наименование>\n`;
    xml += `      <Серия>${lot}</Серия>\n`;
    xml += `      <СрокГодности>${dateFormatted}</СрокГодности>\n`;
    xml += `      <Количество>${qty}</Количество>\n`;
    xml += `      <Единица>${unit}</Единица>\n`;
    xml += `      <Себестоимость>${purchase.toFixed(2)}</Себестоимость>\n`;
    xml += `      <СуммаСписания>${(retail * qty).toFixed(2)}</СуммаСписания>\n`;
    xml += `      <Причина>Истечение срока годности</Причина>\n`;
    xml += `      <Филиал>${branch}</Филиал>\n`;
    xml += `    </Строка>\n`;
  });

  xml += `  </ТоварныеСтроки>\n`;
  xml += `</ПарацельсДокумент>`;

  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `1C_Paracelsus_Quarantine_Doc_${dateStr}.xml`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export Official Acts into styled Excel (.xlsx)
 */
export function exportActToExcelXLSX(
  actTitle: string,
  actNumber: string,
  actDate: string,
  batches: MedicationBatch[],
  commission: CommissionMember[],
  directorName?: string
) {
  const wb = XLSX.utils.book_new();

  const headerRows = [
    ['ООО «СИФАТ ФАРМА» (Республика Таджикистан, г. Душанбе)'],
    ['СИСТЕМА МЕНЕДЖМЕНТА КАЧЕСТВА ISO 9001 / GDP'],
    [''],
    [`${actTitle.toUpperCase()} № ${actNumber}`],
    [`Дата составления: ${actDate}`],
    [''],
    ['СОСТАВ КОМИССИИ:'],
    ...commission.map(c => [`- ${c.roleRussian}: ${c.name} (${c.titleRussian})`]),
    [''],
    ['СПИСОК ЛЕКАРСТВЕННЫХ СРЕДСТВ И МЕДИЦИНСКИХ ИЗДЕЛИЙ:'],
    [''],
  ];

  const tableHeaders = [
    '№ п/п',
    'Код 1С',
    'Наименование медикамента',
    'Серия / LOT',
    'Срок годности',
    'Количество',
    'Ед. изм.',
    'Закупка (TJS)',
    'Розница (TJS)',
    'Скидка %',
    'Новая цена (TJS)',
    'Сумма (TJS)',
    'Причина / Категория',
    'Филиал / Склад'
  ];

  let totalSum = 0;
  const tableRows = batches.map((b, idx) => {
    const qty = Number(b.quantity) || 0;
    const oldRetail = Number(b.retailPrice) || 0;
    const disc = Number(b.currentDiscount) || 0;
    const newPrice = disc > 0 ? (Number(b.discountedPrice) || (oldRetail * (1 - disc / 100))) : oldRetail;
    const sum = +(newPrice * qty).toFixed(2);
    totalSum += sum;

    return [
      idx + 1,
      format1CCode(b, idx),
      b.productName || '',
      (b.lotNumber || '').trim(),
      formatDateDDMMYYYY(b.expiryDate),
      qty,
      b.unit || 'уп.',
      Number(b.purchasePrice) || 0,
      oldRetail,
      disc,
      +newPrice.toFixed(2),
      sum,
      b.category === 'E' || b.isQuarantined ? 'Истечение срока годности (Карантин)' : `Категория ${b.category || 'A'}`,
      b.branch || ''
    ];
  });

  const totalRow = ['', '', 'ИТОГО ПО АК ТУ:', '', '', '', '', '', '', '', '', +totalSum.toFixed(2), '', ''];

  const footerRows = [
    [''],
    [`ИТОГОВАЯ СУММА ПО АК ТУ: ${totalSum.toFixed(2)} сомони (TJS)`],
    [''],
    ['ПОДПИСИ ЧЛЕНОВ КОМИССИИ:'],
    ['Председатель комиссии: ____________________ / ' + (commission[0]?.name || '')],
    ['Члены комиссии:'],
    ...commission.slice(1).map(c => [`____________________ / ${c.name} (${c.titleRussian})`]),
    [''],
    ['УТВЕРЖДАЮ:'],
    ['Генеральный директор ООО «Сифат Фарма»: ____________________ / ' + (directorName || commission[0]?.name || 'Ф.И.О. Руководителя')],
    [`Дата: ${actDate}`]
  ];

  const aoa = [
    ...headerRows,
    tableHeaders,
    ...tableRows,
    totalRow,
    ...footerRows
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },  // №
    { wch: 12 }, // Код 1С
    { wch: 38 }, // Наименование
    { wch: 18 }, // LOT
    { wch: 14 }, // Срок
    { wch: 12 }, // Кол-во
    { wch: 8 },  // Ед
    { wch: 14 }, // Закупка
    { wch: 14 }, // Розница
    { wch: 10 }, // Скидка
    { wch: 16 }, // Новая цена
    { wch: 16 }, // Сумма
    { wch: 32 }, // Причина
    { wch: 30 }  // Филиал
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Акт');
  XLSX.writeFile(wb, `${actTitle.replace(/\s+/g, '_')}_${actNumber}_${actDate}.xlsx`);
}

/**
 * Parse uploaded Excel or CSV file from Paracelsus software
 */
export async function parseParacelsusFile(file: File): Promise<MedicationBatch[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const importedBatches: MedicationBatch[] = json.map((row, index) => {
          const keys = Object.keys(row);
          const getKey = (possibleNames: string[]) => {
            const found = keys.find(k => possibleNames.some(p => k.toLowerCase().trim().includes(p.toLowerCase())));
            return found ? row[found] : undefined;
          };

          const code1CVal = getKey(['код1с', 'код 1с', 'код_1с', 'кодноменклатуры', 'код товара', 'код', 'артикул', 'code']);
          const productName = getKey(['номенклатура', 'товар', 'название', 'нами', 'product', 'имя', 'наименование']) || `Препарат №${index + 1}`;
          const rawLot = getKey(['серия_lot', 'серия', 'серии', 'номерсерии', 'номер_серии', 'серияноменклатуры', 'партия', 'номерпартии', 'лот', 'lot', 'batch', 'series']);
          const lotNumber = rawLot ? String(rawLot).trim() : '';
          let expiryDate = getKey(['срок', 'годен', 'муҳлат', 'expiry', 'exp']) || '2026-12-31';

          if (typeof expiryDate === 'number') {
            const jsDate = new Date((expiryDate - (25567 + 2)) * 86400 * 1000);
            expiryDate = jsDate.toISOString().split('T')[0];
          } else if (typeof expiryDate === 'string') {
            expiryDate = expiryDate.trim().replace(/\//g, '.');
            if (expiryDate.includes('.')) {
              const parts = expiryDate.split('.');
              if (parts.length === 3) {
                if (parts[0].length === 4) expiryDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                else expiryDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              }
            }
          }

          const quantity = Number(getKey(['количество', 'миқдор', 'кол-во', 'qty'])) || 10;
          const retailPrice = Number(getKey(['цена', 'розница', 'нарх', 'price'])) || 25.0;
          const purchasePrice = Number(getKey(['закупка', 'опт', 'purchase'])) || retailPrice * 0.7;
          const branch = getKey(['склад', 'аптека', 'анбор', 'документ', 'филиал']) || 'Центральный склад (г. Душанбе)';
          const supplier = getKey(['поставщик', 'таъминкунанда', 'supplier']) || 'ООО «Сифат Фарма»';

          const processed: MedicationBatch = {
            id: `imp-${Date.now()}-${index}`,
            code1C: code1CVal ? String(code1CVal).trim() : (100100 + index).toString(),
            productName: String(productName),
            lotNumber: String(lotNumber),
            expiryDate: String(expiryDate),
            quantity,
            unit: 'уп.',
            retailPrice,
            purchasePrice,
            currentDiscount: 0,
            discountedPrice: retailPrice,
            branch: String(branch),
            supplier: String(supplier),
            isQuarantined: false,
            category: 'A' as const,
            daysRemaining: 180,
          };

          return processed;
        });

        resolve(importedBatches);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

export interface BranchAllocationDetail {
  branchName: string;
  city: string;
  role: 'DONOR' | 'RECIPIENT' | 'RETAINED';
  isWarehouse?: boolean;
  currentStock: number;      // Наличие ДО перемещения
  allocatedDelta: number;    // -N (для донора), +N (для получателя), 0
  projectedStock: number;    // Наличие ПОСЛЕ перемещения
  reason: string;
  isZeroDeficitResolved?: boolean;
  unitPrice?: number;          // Розничная цена за 1 упаковку (TJS)
  totalValue?: number;         // Стоимость перемещаемого объема (TJS)
  salesVelocityRatio?: string; // Коэффициент сбыта, например "1.5x"
  salesVelocityPercent?: number; // % реализации (например 78%)
  salesVelocityLabel?: string; // Краткая метка (Ходовой / Средний)
  salesVelocityBadge?: string; // Tailwind цвета бейджа
  salesVelocityTooltip?: string; // Полный текст всплывающей подсказки
  compactTag?: string;         // Компактный тег роли / действия
}

export interface RotationRecommendationItem {
  batch: MedicationBatch;
  currentBranch: string;
  suggestedBranch: string; // primary or summary of destinations
  targetCity: string;
  matchScore: number;
  existingStockInTarget: number;
  isSameCity: boolean;
  deadlineFormatted: string;
  daysToAct: number;
  isUrgent: boolean;
  potentialRevenueSaved: number;
  reason: string;
  // Multi-destination split details
  retainedInDonor: number;
  distributedTotal?: number;
  allocations: BranchAllocationDetail[];
  recipientsSummaryText?: string;
  zeroDeficitsCount?: number;
}

export interface BranchSimulationBalance {
  branchName: string;
  city: string;
  isWarehouse: boolean;
  initialUnits: number;
  initialValue: number;
  incomingUnits: number;
  incomingValue: number;
  outgoingUnits: number;
  outgoingValue: number;
  projectedUnits: number;
  projectedValue: number;
  netDeltaUnits: number;
  netDeltaValue: number;
  zeroDeficitsResolved: number;
  safetyStatus: string;
}

/**
 * Native Excel (.xlsx) Export for Inter-Branch Smart FEFO Rotation Recommendations
 * With multi-destination distribution matrix and before/after stock breakdown
 */
export function exportRotationRecommendationsToExcel(
  items: RotationRecommendationItem[],
  filenamePrefix: string = 'Отчет_Ротации_FEFO_Сифат_Фарма',
  branchBalances?: BranchSimulationBalance[]
) {
  const wb = XLSX.utils.book_new();

  // Primary Sheet: Рекомендации Ротации (Multi-destination Split Matrix)
  const rowsData = items.map((item, idx) => {
    const b = item.batch;
    const velInfo = getSalesVelocityInfo(b);
    const qty = Number(b.quantity) || 0;
    const oldRetail = Number(b.retailPrice) || 0;
    const disc = Number(b.currentDiscount) || 0;
    const currentPrice = disc > 0 ? (Number(b.discountedPrice) || (oldRetail * (1 - disc / 100))) : oldRetail;

    // Detailed recipient breakdown text
    const recipientsDetail = (item.allocations || [])
      .filter(a => a.role === 'RECIPIENT' && a.allocatedDelta > 0)
      .map(a => `${a.branchName} (+${a.allocatedDelta} уп. | было: ${a.currentStock}, станет: ${a.projectedStock}${a.isZeroDeficitResolved ? ' [ДЕФИЦИТ ЗАКРЫТ]' : ''})`)
      .join(';\r\n');

    return {
      '№': idx + 1,
      'Код 1С': format1CCode(b, idx),
      'Наименование медикамента': b.productName || '',
      'Серия / LOT': (b.lotNumber || '').trim(),
      'Срок годности': formatDateDDMMYYYY(b.expiryDate),
      'Остаток дней': Number(b.daysRemaining) || 0,
      'Категория FEFO': `Cat ${b.category || 'C'}`,
      'Общий объем партии (упак)': qty,
      'Остается в аптеке-доноре (упак)': item.retainedInDonor ?? 0,
      'Передается в сеть (упак)': item.distributedTotal ?? qty,
      'Ед. изм.': b.unit || 'уп.',
      'Цена (TJS)': +currentPrice.toFixed(2),
      'Защищаемая выручка (TJS)': +item.potentialRevenueSaved.toFixed(2),
      'Откуда (Филиал-донор)': item.currentBranch,
      'Куда (Умное распределение по аптекам)': recipientsDetail || item.suggestedBranch,
      'Закрыто дефицитов (точек)': item.zeroDeficitsCount ?? 0,
      'Анализ продаваемости и обоснование': item.reason,
      'Скорость продаж товара (Сеть)': `${velInfo.shortLabel} (${velInfo.sellThrough}%)`,
      'Совпадение алгоритма %': `${item.matchScore}%`,
      'Срок выполнения (до)': formatDateDDMMYYYY(item.deadlineFormatted),
      'Дней на перевозку': item.daysToAct,
      'Статус срочности': item.isUrgent ? 'СРОЧНО (Категория D)' : 'Плановая ротация (Категория C)'
    };
  });

  const ws = XLSX.utils.json_to_sheet(rowsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },  // №
    { wch: 12 }, // Код 1С
    { wch: 38 }, // Наименование
    { wch: 16 }, // LOT
    { wch: 14 }, // Срок
    { wch: 13 }, // Ост дней
    { wch: 14 }, // Категория
    { wch: 18 }, // Общий объем
    { wch: 22 }, // Остается на полке
    { wch: 20 }, // Передается в сеть
    { wch: 8 },  // Ед
    { wch: 14 }, // Цена
    { wch: 22 }, // Выручка
    { wch: 32 }, // Откуда
    { wch: 55 }, // Куда (Детализация по аптекам)
    { wch: 18 }, // Дефициты
    { wch: 60 }, // Обоснование
    { wch: 28 }, // Продаваемость сеть
    { wch: 18 }, // Совпадение
    { wch: 18 }, // Срок
    { wch: 16 }, // Дней
    { wch: 26 }  // Статус
  ];

  if (ws['!ref']) {
    ws['!autofilter'] = { ref: ws['!ref'] };
  }
  ws['!views'] = [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }];
  XLSX.utils.book_append_sheet(wb, ws, 'Матрица ротации FEFO');

  // Second Sheet: Свод по Аптекам-Получателям (Summary)
  const targetBranchMap: Record<string, {
    branchName: string;
    city: string;
    totalBatches: number;
    totalQty: number;
    totalRevenueSaved: number;
    zeroStockCount: number;
    matchScoreSum: number;
  }> = {};

  items.forEach(item => {
    const key = item.suggestedBranch;
    if (!targetBranchMap[key]) {
      targetBranchMap[key] = {
        branchName: item.suggestedBranch,
        city: item.targetCity,
        totalBatches: 0,
        totalQty: 0,
        totalRevenueSaved: 0,
        zeroStockCount: 0,
        matchScoreSum: 0,
      };
    }
    targetBranchMap[key].totalBatches += 1;
    targetBranchMap[key].totalQty += (Number(item.batch.quantity) || 0);
    targetBranchMap[key].totalRevenueSaved += item.potentialRevenueSaved;
    if (item.existingStockInTarget === 0) {
      targetBranchMap[key].zeroStockCount += 1;
    }
    targetBranchMap[key].matchScoreSum += item.matchScore;
  });

  const summaryRows = Object.values(targetBranchMap).map((tb, idx) => {
    const avgMatch = (tb.matchScoreSum / (tb.totalBatches || 1)).toFixed(1);
    return {
      '№': idx + 1,
      'Аптека-получатель': tb.branchName,
      'Город': tb.city,
      'Принимаемых партий (шт)': tb.totalBatches,
      'Суммарный объем (упак)': tb.totalQty,
      'Позиций с нулевым остатком (Дефицит)': tb.zeroStockCount,
      'Защищаемая выручка аптеки (TJS)': +tb.totalRevenueSaved.toFixed(2),
      'Среднее совпадение FEFO': `${avgMatch}%`,
      'Оценка коммерческой эффективности': tb.zeroStockCount > 0 
        ? `Высокая эффективность: закрывает дефицит по ${tb.zeroStockCount} ключевым позициям.` 
        : 'Равномерный баланс товарного запаса.'
    };
  });

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 5 }, { wch: 35 }, { wch: 18 }, { wch: 22 }, { wch: 22 }, { wch: 32 }, { wch: 28 }, { wch: 22 }, { wch: 55 }
  ];
  if (wsSummary['!ref']) {
    wsSummary['!autofilter'] = { ref: wsSummary['!ref'] };
  }
  wsSummary['!views'] = [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Свод по аптекам-получателям');

  // Third Sheet: Прогноз Баланса Филиалов (ДО и ПОСЛЕ перемещения)
  if (branchBalances && branchBalances.length > 0) {
    const balanceRows = branchBalances.map((b, idx) => ({
      '№': idx + 1,
      'Филиал / Аптека': b.branchName,
      'Город': b.city,
      'Тип объекта': b.isWarehouse ? 'Центральный склад' : 'Розничная аптека',
      'Исходный остаток (упак)': b.initialUnits,
      'Исходная стоимость (TJS)': +b.initialValue.toFixed(2),
      'Входящее поступление (+)': b.incomingUnits,
      'Исходящая разгрузка (-)': b.outgoingUnits,
      'Прогнозный остаток ПОСЛЕ (упак)': b.projectedUnits,
      'Прогнозная стоимость ПОСЛЕ (TJS)': +b.projectedValue.toFixed(2),
      'Чистая дельта (упак)': b.netDeltaUnits > 0 ? `+${b.netDeltaUnits}` : `${b.netDeltaUnits}`,
      'Закрыто дефицитов (SKU)': b.zeroDeficitsResolved,
      'Оценка безопасности сети': b.safetyStatus
    }));

    const wsBalance = XLSX.utils.json_to_sheet(balanceRows);
    wsBalance['!cols'] = [
      { wch: 5 }, { wch: 35 }, { wch: 16 }, { wch: 20 }, { wch: 22 }, { wch: 24 }, { wch: 22 }, { wch: 22 }, { wch: 26 }, { wch: 26 }, { wch: 20 }, { wch: 22 }, { wch: 40 }
    ];
    if (wsBalance['!ref']) {
      wsBalance['!autofilter'] = { ref: wsBalance['!ref'] };
    }
    wsBalance['!views'] = [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }];
    XLSX.utils.book_append_sheet(wb, wsBalance, 'Баланс филиалов ДО и ПОСЛЕ');
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filenamePrefix}_${dateStr}.xlsx`);
}

/**
 * CSV Export for 1C:Парацельс & ERP Systems
 */
export function exportRotationRecommendationsToCSV(
  items: RotationRecommendationItem[],
  filenamePrefix: string = 'paracelsus_rotation_report'
) {
  const headers = [
    'Код 1С',
    'Наименование',
    'Серия_LOT',
    'СрокГодности',
    'КатегорияFEFO',
    'Количество',
    'ЗащищаемаяВыручка_TJS',
    'Филиал_Отправитель',
    'Аптека_Получатель',
    'Город',
    'Остаток_В_Получателе',
    'Анализ_Продаваемости_И_Спроса',
    'Совпадение_Процент',
    'СрокИсполнения'
  ];

  const escapeCsvStr = (str: any) => {
    if (str === null || str === undefined) return '""';
    const clean = String(str).replace(/"/g, '""').replace(/[\r\n]+/g, ' ');
    return `"${clean}"`;
  };

  const rows = items.map((item, idx) => {
    const b = item.batch;
    const code1C = format1CCode(b, idx);
    const cleanLot = (b.lotNumber || '').trim();
    const dateFormatted = formatDateDDMMYYYY(b.expiryDate);

    let salesDemandAnalysis = item.reason;
    if (item.existingStockInTarget === 0) {
      salesDemandAnalysis = `[ВЫСОКИЙ СПРОС] Нулевой остаток в целевой аптеке! ${item.reason}`;
    }

    return [
      escapeCsvStr(code1C),
      escapeCsvStr(b.productName),
      escapeCsvStr(cleanLot),
      escapeCsvStr(dateFormatted),
      escapeCsvStr(`Cat ${b.category || 'C'}`),
      Number(b.quantity) || 0,
      item.potentialRevenueSaved.toFixed(2).replace('.', ','),
      escapeCsvStr(item.currentBranch),
      escapeCsvStr(item.suggestedBranch),
      escapeCsvStr(item.targetCity),
      escapeCsvStr(item.existingStockInTarget === 0 ? '0 упак. (Дефицит)' : `${item.existingStockInTarget} упак.`),
      escapeCsvStr(salesDemandAnalysis),
      item.matchScore,
      escapeCsvStr(formatDateDDMMYYYY(item.deadlineFormatted))
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

