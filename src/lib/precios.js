// Calculo del precio de un servicio aplicando ofertas.

/*
 * @param {object} servicio  { id, categoria, precio }
 * @param {Array}  ofertas   Filas de ofertas { id, servicio_id, categoria,
 *                           tipo_descuento, valor_descuento }
 * @returns {{ precioOriginal: number, precioReserva: number, ofertaId: number|null }}
 */
export function precioConOferta(servicio, ofertas = []) {
    const precioOriginal = Number(servicio.precio);
    let mejorDescuento = 0;
    let ofertaId = null;

    for (const o of ofertas) {
    // Una oferta apunta a un servicio concreto o a toda una categoria
    const aplica =
        o.servicio_id != null
        ? o.servicio_id === servicio.id
        : o.categoria === servicio.categoria;
    if (!aplica) continue;

    const valor = Number(o.valor_descuento);
    const descuento =
      o.tipo_descuento === 'porcentaje' ? (precioOriginal * valor) / 100 : valor;

    // Si aplican varias, gana la que mas descuenta (no se acumulan)
    if (descuento > mejorDescuento) {
        mejorDescuento = descuento;
        ofertaId = o.id;
    }
    }

  // El descuento nunca deja el precio en negativo; se redondea a centavos
    const descuentoFinal = Math.min(mejorDescuento, precioOriginal);
  const precioReserva = Math.round((precioOriginal - descuentoFinal) * 100) / 100;

    return { precioOriginal, precioReserva, ofertaId };
}