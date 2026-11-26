// Lectura de la agenda para el panel. Solo corre en el servidor.
import 'server-only';
import { supabaseAdmin } from './supabase-admin';
import { requerirAdmin } from './auth-admin';

const DIA_MS = 24 * 60 * 60 * 1000;

// Turnos que EMPIEZAN en el dia pedido ('YYYY-MM-DD', hora de Uruguay),
// ordenados por hora, con los datos de la clienta y sus servicios.
export async function obtenerAgendaDelDia(fecha) {
  // Esta funcion lee datos privados con la clave secreta, asi que verifica
  // el permiso ella misma, sin importar desde donde la llamen.
    await requerirAdmin();

    const inicioDia = new Date(`${fecha}T00:00:00-03:00`);
    const finDia = new Date(inicioDia.getTime() + DIA_MS);

    const { data, error } = await supabaseAdmin
    .from('turnos')
    .select(
        `id, inicio, fin, estado, notas,
        clientes ( nombre_completo, telefono, email ),
        servicios_turno ( precio_reserva, servicios ( nombre ) )`
    )
    .gte('inicio', inicioDia.toISOString())
    .lt('inicio', finDia.toISOString())
    .order('inicio');

    if (error) throw new Error(error.message);
    return data;
}