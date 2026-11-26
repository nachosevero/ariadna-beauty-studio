// Trae de Supabase lo que necesita calcularHorariosLibres para UN dia.
// Corre solo en el servidor, porque 'turnos' y 'dias_libres' son tablas privadas.
import 'server-only';
import { supabaseAdmin } from './supabase-admin';

const DIA_MS = 24 * 60 * 60 * 1000;

export async function obtenerDatosDelDia(fecha) {
  // Limites del dia en hora de Uruguay (UTC-3), como instantes ISO
    const inicioDia = new Date(`${fecha}T00:00:00-03:00`);
    const finDia = new Date(inicioDia.getTime() + DIA_MS);

  // Los tres pedidos son independientes: se hacen en paralelo
    const [horarios, turnos, libres] = await Promise.all([
    supabaseAdmin
        .from('horarios_trabajo')
        .select('dia_semanal, horario_inicio, horario_fin'),

    // Solo turnos activos que se superponen con el dia consultado
    supabaseAdmin
        .from('turnos')
        .select('inicio, fin')
        .in('estado', ['pendiente', 'confirmado'])
        .lt('inicio', finDia.toISOString())
        .gt('fin', inicioDia.toISOString()),

    supabaseAdmin
        .from('dias_libres')
        .select('inicio, fin')
        .lt('inicio', finDia.toISOString())
        .gt('fin', inicioDia.toISOString()),
    ]);

    for (const respuesta of [horarios, turnos, libres]) {
    if (respuesta.error) throw new Error(respuesta.error.message);
    }

    return {
    horariosTrabajo: horarios.data,
    turnos: turnos.data,
    diasLibres: libres.data,
    };
}