// POST /api/reservar
// Cuerpo JSON: { fecha, hora, servicios: [ids], nombre, telefono, email? }
//
// El navegador solo manda QUE quiere reservar. Todo lo demas (duracion,
// precios, si el horario sigue libre) lo decide el servidor, porque el
// navegador no es de fiar: cualquiera puede armar este pedido a mano.
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { obtenerDatosDelDia } from '@/lib/datos-agenda';
import { calcularHorariosLibres } from '@/lib/disponibilidad';
import { ANTICIPACION_MIN, calcularDuracion } from '@/lib/reglas-reserva';
import { precioConOferta } from '@/lib/precios';

const respuesta = (error, status) => NextResponse.json({ error }, { status });

export async function POST(request) {
    let cuerpo;
    try {
    cuerpo = await request.json();
    } catch {
    return respuesta('Pedido inválido', 400);
    }

  // ---------- 1. Validar lo que mando el navegador ----------
    const fecha = String(cuerpo.fecha ?? '');
    const hora = String(cuerpo.hora ?? '');
    const nombre = String(cuerpo.nombre ?? '').trim();
    const telefono = String(cuerpo.telefono ?? '').trim();
    const email = String(cuerpo.email ?? '').trim();

    const ids = Array.isArray(cuerpo.servicios)
    ? [...new Set(cuerpo.servicios.map(Number))]
    : [];

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^\d{2}:\d{2}$/.test(hora)) {
    return respuesta('Fecha u hora inválida', 400);
    }
    if (ids.length === 0 || ids.length > 10 || !ids.every(Number.isInteger)) {
    return respuesta('Servicios inválidos', 400);
    }
    if (nombre.length < 2 || nombre.length > 100) {
    return respuesta('Escribí tu nombre', 400);
    }
    if (!/^[0-9+()\-\s]{7,20}$/.test(telefono)) {
    return respuesta('Teléfono inválido', 400);
    }
    if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return respuesta('Email inválido', 400);
    }

  // ---------- 2. Servicios reales desde la base ----------
    const { data: servicios, error: errServicios } = await supabaseAdmin
    .from('servicios')
    .select('id, categoria, precio, duracion_minutos, preparacion_minutos')
    .in('id', ids)
    .eq('activo', true);

    if (errServicios) {
    console.error('reservar: servicios', errServicios);
    return respuesta('No se pudo completar la reserva', 500);
    }
    if (servicios.length !== ids.length) {
    return respuesta('Servicio no encontrado', 400);
    }

    const { duracionMin, preparacionMin } = calcularDuracion(servicios);

  // ---------- 3. Revalidar que el horario SIGUE libre ----------
  // Pudo haberse ocupado mientras la clienta completaba el formulario.
    const datos = await obtenerDatosDelDia(fecha);
    const horarios = calcularHorariosLibres({
    fecha,
    duracionMin,
    preparacionMin,
    anticipacionMin: ANTICIPACION_MIN,
    ...datos,
    });
    const horario = horarios.find((h) => h.hora === hora);

    if (!horario) {
    return respuesta('Ese horario ya no está disponible. Elegí otro.', 409);
    }

  // ---------- 4. Precios con ofertas vigentes ahora ----------
    const ahora = new Date().toISOString();
    const { data: ofertas, error: errOfertas } = await supabaseAdmin
    .from('ofertas')
    .select('id, servicio_id, categoria, tipo_descuento, valor_descuento')
    .eq('activo', true)
    .lte('inicio_descuento', ahora)
    .gte('fin_descuento', ahora);

    if (errOfertas) {
    console.error('reservar: ofertas', errOfertas);
    return respuesta('No se pudo completar la reserva', 500);
    }

    const items = servicios.map((s) => {
    const p = precioConOferta(s, ofertas);
    return {
        servicio_id: s.id,
        precio_original: p.precioOriginal,
        precio_reserva: p.precioReserva,
        oferta_id: p.ofertaId,
    };
    });
    const total = items.reduce((suma, i) => suma + i.precio_reserva, 0);

  // ---------- 5. Guardar todo en una transaccion ----------
    const { data: turnoId, error: errReserva } = await supabaseAdmin.rpc('crear_reserva', {
    p_nombre: nombre,
    p_telefono: telefono,
    p_email: email,
    p_inicio: horario.inicio.toISOString(),
    p_fin: horario.fin.toISOString(),
    p_items: items,
    });

    if (errReserva) {
    // 23P01 = la restriccion anti-superposicion rechazo el turno: otra persona
    // reservo ese horario en el mismo instante (despues de nuestro paso 3).
    if (errReserva.code === '23P01') {
        return respuesta('Ese horario ya no está disponible. Elegí otro.', 409);
    }
    console.error('reservar: crear_reserva', errReserva);
    return respuesta('No se pudo completar la reserva', 500);
    }

    return NextResponse.json({ id: turnoId, fecha, hora, total }, { status: 201 });
}