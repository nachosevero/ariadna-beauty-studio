import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularHorariosLibres } from './disponibilidad.js';

const LUNES = '2026-12-07';
const DOMINGO = '2026-12-06';

// Reloj fijo en el pasado: los tests no dependen de la fecha real
const AHORA = new Date('2026-01-01T00:00:00-03:00');

const horariosTrabajo = [
  { dia_semanal: 1, horario_inicio: '09:00:00', horario_fin: '13:00:00' },
  { dia_semanal: 1, horario_inicio: '15:00:00', horario_fin: '19:00:00' },
];

const calcular = (extra = {}) =>
  calcularHorariosLibres({
    fecha: LUNES,
    duracionMin: 60,
    horariosTrabajo,
    ahora: AHORA,
    ...extra,
  });

const horas = (resultado) => resultado.map((h) => h.hora);

test('agenda vacia: ofrece horarios en las dos franjas', () => {
  const r = horas(calcular());
  assert.equal(r.length, 14);
  assert.equal(r[0], '09:00');
  assert.ok(r.includes('12:00'), 'el ultimo de la manana (12:00 a 13:00) entra');
  assert.ok(!r.includes('12:30'), '12:30 terminaria despues de las 13:00');
  assert.ok(!r.includes('13:00'), 'no se ofrece durante la pausa');
  assert.equal(r[r.length - 1], '18:00');
});

test('un dia sin horario de trabajo no tiene horarios', () => {
  assert.deepEqual(calcular({ fecha: DOMINGO }), []);
});

test('un turno existente bloquea los horarios que se le superponen', () => {
  const turnos = [
    { inicio: '2026-12-07T10:00:00-03:00', fin: '2026-12-07T11:00:00-03:00' },
  ];
  const r = horas(calcular({ turnos }));

  for (const bloqueado of ['09:30', '10:00', '10:30']) {
    assert.ok(!r.includes(bloqueado), `${bloqueado} deberia estar ocupado`);
  }
  // Turnos pegados (uno termina cuando empieza el otro) estan permitidos
  assert.ok(r.includes('09:00'), '09:00 termina justo cuando empieza el turno');
  assert.ok(r.includes('11:00'), '11:00 empieza justo cuando termina el turno');
});

test('un servicio mas largo que cualquier franja no tiene horarios', () => {
  assert.deepEqual(calcular({ duracionMin: 300 }), []);
});

test('un dia libre que cubre toda la jornada bloquea todo', () => {
  const diasLibres = [
    { inicio: '2026-12-07T00:00:00-03:00', fin: '2026-12-08T00:00:00-03:00' },
  ];
  assert.deepEqual(calcular({ diasLibres }), []);
});

test('respeta la anticipacion minima para reservar', () => {
  const r = horas(
    calcular({
      ahora: new Date('2026-12-07T09:10:00-03:00'),
      anticipacionMin: 60,
    })
  );
  // Primer momento permitido: 10:10, y los horarios salen cada 30 min
  assert.equal(r[0], '10:30');
});