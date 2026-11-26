import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    hoyEnUruguay,
    esFechaValida,
    sumarDias,
    horaUruguay,
    fechaLarga,
    enlaceWhatsApp,
    estadosSiguientes,
    transicionValida,
    armarBloqueo,
    describirBloqueo,
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

test('las transiciones de estado permitidas', () => {
    assert.deepEqual(estadosSiguientes('pendiente'), ['confirmado', 'cancelado']);
    assert.deepEqual(estadosSiguientes('confirmado'), ['completado', 'no_mostrar', 'cancelado']);
    assert.equal(transicionValida('confirmado', 'completado'), true);
    assert.equal(transicionValida('pendiente', 'completado'), false);
});

test('los estados finales no se pueden cambiar', () => {
    for (const final of ['completado', 'no_mostrar', 'cancelado']) {
    assert.deepEqual(estadosSiguientes(final), []);
    assert.equal(transicionValida(final, 'confirmado'), false);
    }
    assert.deepEqual(estadosSiguientes('inventado'), []);
});

test('armarBloqueo: un dia completo va de 00:00 a 00:00 del dia siguiente', () => {
    assert.deepEqual(armarBloqueo({ desde: '2026-12-08' }), {
    inicio: '2026-12-08T03:00:00.000Z',
    fin: '2026-12-09T03:00:00.000Z',
    });
});

test('armarBloqueo: "hasta" es inclusivo en un rango de dias', () => {
    assert.deepEqual(armarBloqueo({ desde: '2026-12-08', hasta: '2026-12-10' }), {
    inicio: '2026-12-08T03:00:00.000Z',
    fin: '2026-12-11T03:00:00.000Z',
    });
});

test('armarBloqueo: con horas bloquea solo ese tramo', () => {
    assert.deepEqual(
    armarBloqueo({ desde: '2026-12-08', horaDesde: '10:00', horaHasta: '12:00' }),
    { inicio: '2026-12-08T13:00:00.000Z', fin: '2026-12-08T15:00:00.000Z' }
    );
});

test('armarBloqueo rechaza datos invalidos', () => {
    assert.ok(armarBloqueo({ desde: '' }).error, 'sin fecha');
    assert.ok(armarBloqueo({ desde: '2026-02-30' }).error, 'fecha inexistente');
    assert.ok(armarBloqueo({ desde: '2026-12-10', hasta: '2026-12-08' }).error, 'hasta antes que desde');
    assert.ok(armarBloqueo({ desde: '2026-12-08', horaDesde: '10:00' }).error, 'solo una hora');
    assert.ok(
    armarBloqueo({ desde: '2026-12-08', horaDesde: '12:00', horaHasta: '10:00' }).error,
    'hora final anterior a la inicial'
    );
    assert.ok(armarBloqueo({ desde: '2026-12-08', hasta: '2028-12-08' }).error, 'mas de un año');
});

test('describirBloqueo escribe dias completos y tramos con hora', () => {
    const unDia = describirBloqueo('2026-12-08T03:00:00.000Z', '2026-12-09T03:00:00.000Z');
    assert.equal(unDia, fechaLarga('2026-12-08'));

    const varios = describirBloqueo('2026-12-08T03:00:00.000Z', '2026-12-11T03:00:00.000Z');
    assert.equal(varios, `${fechaLarga('2026-12-08')} al ${fechaLarga('2026-12-10')}`);

    const tramo = describirBloqueo('2026-12-08T13:00:00.000Z', '2026-12-08T15:00:00.000Z');
    assert.ok(tramo.includes('de 10:00 a 12:00'));
});