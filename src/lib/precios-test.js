import { test } from 'node:test';
import assert from 'node:assert/strict';
import { precioConOferta } from './precios.js';

const cejas = { id: 1, categoria: 'cejas', precio: '290.00' };
const pestanas = { id: 8, categoria: 'pestanas', precio: 750 };

test('sin ofertas se cobra el precio de lista', () => {
    assert.deepEqual(precioConOferta(cejas, []), {
    precioOriginal: 290,
    precioReserva: 290,
    ofertaId: null,
    });
});

test('descuento en porcentaje sobre un servicio concreto', () => {
    const ofertas = [
    { id: 5, servicio_id: 1, categoria: null, tipo_descuento: 'porcentaje', valor_descuento: 20 },
    ];
    const r = precioConOferta(cejas, ofertas);
    assert.equal(r.precioReserva, 232);
    assert.equal(r.ofertaId, 5);
    assert.equal(r.precioOriginal, 290);
});

test('descuento de monto fijo', () => {
    const ofertas = [
    { id: 6, servicio_id: 1, categoria: null, tipo_descuento: 'fijo', valor_descuento: 40 },
    ];
    assert.equal(precioConOferta(cejas, ofertas).precioReserva, 250);
});

test('una oferta de categoria aplica a todos sus servicios y a ningun otro', () => {
    const ofertas = [
    { id: 7, servicio_id: null, categoria: 'cejas', tipo_descuento: 'porcentaje', valor_descuento: 10 },
    ];
    assert.equal(precioConOferta(cejas, ofertas).precioReserva, 261);
    assert.equal(precioConOferta(pestanas, ofertas).precioReserva, 750);
});

test('una oferta de otro servicio no aplica', () => {
    const ofertas = [
    { id: 8, servicio_id: 99, categoria: null, tipo_descuento: 'porcentaje', valor_descuento: 50 },
    ];
    assert.equal(precioConOferta(cejas, ofertas).precioReserva, 290);
});

test('con varias ofertas gana la que mas descuenta, sin acumular', () => {
    const ofertas = [
    { id: 1, servicio_id: 1, categoria: null, tipo_descuento: 'porcentaje', valor_descuento: 10 }, // 29
    { id: 2, servicio_id: 1, categoria: null, tipo_descuento: 'fijo', valor_descuento: 50 }, // 50
    { id: 3, servicio_id: null, categoria: 'cejas', tipo_descuento: 'porcentaje', valor_descuento: 5 }, // 14,5
    ];
    const r = precioConOferta(cejas, ofertas);
    assert.equal(r.precioReserva, 240);
    assert.equal(r.ofertaId, 2);
});

test('el descuento nunca deja el precio en negativo', () => {
    const ofertas = [
    { id: 9, servicio_id: 1, categoria: null, tipo_descuento: 'fijo', valor_descuento: 1000 },
    ];
    assert.equal(precioConOferta(cejas, ofertas).precioReserva, 0);
});