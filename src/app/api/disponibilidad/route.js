import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { obtenerDatosDelDia } from '@/lib/datos-agenda';
import { calcularHorariosLibres } from '@/lib/disponibilidad';
import { ANTICIPACION_MIN, calcularDuracion } from '@/lib/reglas-reserva';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const fecha = searchParams.get('fecha') ?? '';

  // ids sin repetir y solo enteros
  const ids = [
    ...new Set(
      (searchParams.get('servicios') ?? '')
        .split(',')
        .map(Number)
        .filter(Number.isInteger)
    ),
  ];

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || ids.length === 0) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
  }

  // La duracion se calcula en el servidor a partir de la base de datos.
  // Nunca se confia en una duracion enviada por el navegador.
  const { data: servicios, error } = await supabaseAdmin
    .from('servicios')
    .select('duracion_minutos, preparacion_minutos')
    .in('id', ids)
    .eq('activo', true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (servicios.length !== ids.length) {
    return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 400 });
  }

  const { duracionMin, preparacionMin } = calcularDuracion(servicios);

  const datos = await obtenerDatosDelDia(fecha);
  const horarios = calcularHorariosLibres({
    fecha,
    duracionMin,
    preparacionMin,
    anticipacionMin: ANTICIPACION_MIN,
    ...datos,
  });

  return NextResponse.json({
    duracionMin,
    preparacionMin,
    horarios: horarios.map((h) => h.hora),
  });
}