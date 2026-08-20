#!/usr/bin/env node

const MASTER_SECRET = "SIFAT_CONTROL_MASTER_KEY_2026_SECURE_AUTH_@#$!";

function generateKeyForHWID(hwid) {
  if (!hwid) return null;
  const cleanHwid = hwid.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const combined = `${cleanHwid}:${MASTER_SECRET}`;
  
  let h1 = 0x811c9dc5;
  let h2 = 5381;
  for (let i = 0; i < combined.length; i++) {
    const code = combined.charCodeAt(i);
    h1 = (h1 ^ code) * 16777619;
    h2 = ((h2 << 5) + h2) ^ code;
  }
  
  const b1 = Math.abs(h1).toString(36).slice(-4).padStart(4, 'X').toUpperCase();
  const b2 = Math.abs(h2).toString(36).slice(-4).padStart(4, 'Y').toUpperCase();
  const b3 = Math.abs(h1 ^ h2).toString(36).slice(-4).padStart(4, 'Z').toUpperCase();
  const b4 = Math.abs(h1 + h2).toString(36).slice(-4).padStart(4, 'K').toUpperCase();
  
  return `KEY-${b1}-${b2}-${b3}-${b4}`;
}

const inputHwid = process.argv[2];

if (!inputHwid) {
  console.log('\n======================================================');
  console.log('   Sifat Control - Генератор Лицензионных Ключей');
  console.log('======================================================');
  console.log('\nИспользование: node keygen.js <КОД_ПК>');
  console.log('Пример:        node keygen.js 4F8A-99B2-C11D-890E\n');
  process.exit(0);
}

const key = generateKeyForHWID(inputHwid);

console.log('\n======================================================');
console.log('   Sifat Control - Лицензионный Ключ Сгенерирован!');
console.log('======================================================');
console.log(`\nКод компьютера (HWID): ${inputHwid.toUpperCase()}`);
console.log(`КЛЮЧ АКТИВАЦИИ:         ${key}\n`);
console.log('Отправьте этот КЛЮЧ АКТИВАЦИИ пользователю.\n');
