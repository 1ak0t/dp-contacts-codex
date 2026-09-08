import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseEmployeesCsv, importEmployees } from '../dist/importEmployees.js';

const header = 'fio,op,orgUnit,jobTitle,phoneNumber,persEmail,jobType,email\r\n';
const row = '"Тест, Имя","ОП ""Тест""","Отдел\n1",Должность,+70000000000,,Основное,\r\n';
const parse = text => parseEmployeesCsv(Buffer.from(text));

test('UTF-8 BOM, quoted commas, quotes, line breaks and empty strings', () => {
  const [employee] = parse('\ufeff' + header + row);
  assert.equal(employee.fio, 'Тест, Имя');
  assert.equal(employee.op, 'ОП "Тест"');
  assert.equal(employee.orgUnit, 'Отдел\n1');
  assert.equal(employee.phoneNumber, '+70000000000');
  assert.equal(employee.email, '');
  assert.equal(employee.innerPhone, '');
});

test('invalid files fail before import', () => {
  for (const text of ['', header, 'fio,fio\nA,B', header + 'A,B', header + row + '"unfinished', header + ',,,,,,,\n']) {
    assert.throws(() => parse(text));
  }
  assert.throws(() => parseEmployeesCsv(new Uint8Array([255])));
});

test('repeated imports preserve existing documents and skip exact duplicates', async () => {
  const [employee] = parse(header + row);
  const stored = [{ ...employee, fio: 'Другой сотрудник' }];
  const collection = {
    async bulkWrite(operations, options) {
      assert.equal(options.ordered, true);
      let matchedCount = 0, upsertedCount = 0;
      for (const { updateOne: op } of operations) {
        assert.equal(op.upsert, true);
        assert.equal(op.update.$setOnInsert.innerPhone, employee.innerPhone);
        if (stored.some(doc => Object.entries(op.filter).every(([key, value]) => key === '$or' ? doc.innerPhone === '' || !Object.hasOwn(doc, 'innerPhone') : doc[key] === value))) matchedCount++;
        else { stored.push({ ...op.update.$setOnInsert }); upsertedCount++; }
      }
      return { matchedCount, upsertedCount };
    },
  };
  assert.deepEqual(await importEmployees(collection, [employee, employee]), { inserted: 1, skipped: 1 });
  assert.deepEqual(await importEmployees(collection, [employee]), { inserted: 0, skipped: 1 });
  assert.equal(stored.length, 2);
  assert.equal(stored[0].fio, 'Другой сотрудник');
  delete stored[1].innerPhone;
  assert.deepEqual(await importEmployees(collection, [employee]), { inserted: 0, skipped: 1 });
});

test('optional innerPhone preserves leading zeros', () => {
  const [employee] = parse(header.trimEnd() + ',innerPhone\n' + row.trimEnd() + ',0012\n');
  assert.equal(employee.innerPhone, '0012');
});
