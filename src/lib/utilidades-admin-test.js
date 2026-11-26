import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    hoyEnUruguay,
    esFechaValida,
    sumarDias,
    horaUruguay,
    enlaceWhatsApp,
} from './utilidades-admin.js';

test('hoyEnUruguay usa la hora de Uruguay y no la de UTC', () => {
  // 01:00 UTC del 1/12 son las 22:00 del 30/11 en Montevideo
    assert.equal(hoyEnUruguay(new Date('2026-12-01T01:00:00Z')), '2026-11-30');
    assert.equal(hoyEnUruguay(new Date('2026-12-01T12:00:00Z')), '2026-12-01');
});

test('esFechaValida acepta solo fechas reales en formato YYYY-MM-DD', () => {
    assert.equal(esFechaValida('2026-12-07'), true);
    assert.equal(esFechaValida('2026-02-30'), false);
    assert.equal(esFechaValida('07/12/2026'), false);
    assert.equal(esFechaValida(undefined), false);
    assert.equal(esFechaValida(['2026-12-07']), false);
});

test('sumarDias cruza meses y años', () => {
    assert.equal(sumarDias('2026-12-31', 1), '2027-01-01');
    assert.equal(sumarDias('2026-03-01', -1), '2026-02-28');
    assert.equal(sumarDias('2026-12-07', 0), '2026-12-07');
});

test('horaUruguay convierte un instante a hora de Uruguay', () => {
    assert.equal(horaUruguay('2026-12-07T13:00:00Z'), '10:00');
    assert.equal(horaUruguay('2026-12-07T21:35:00-03:00'), '21:35');
});

test('enlaceWhatsApp normaliza telefonos uruguayos', () => {
    assert.equal(enlaceWhatsApp('099 123 456'), 'https://wa.me/59899123456');
    assert.equal(enlaceWhatsApp('+598 99 123 456'), 'https://wa.me/59899123456');
    assert.equal(enlaceWhatsApp('99123456'), 'https://wa.me/59899123456');
});

test('enlaceWhatsApp devuelve null si no parece un telefono', () => {
    assert.equal(enlaceWhatsApp('abc'), null);
    assert.equal(enlaceWhatsApp(''), null);
    assert.equal(enlaceWhatsApp(null), null);
});