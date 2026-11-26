'use server';

// Server Actions del panel: se ejecutan en el servidor aunque se llamen desde
// un formulario del navegador. Cualquiera puede mandar un POST a mano, asi que
// CADA accion de admin empieza con requerirAdmin() y valida todo lo que recibe.
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { crearClienteServidor, esAdmin, requerirAdmin } from '@/lib/auth-admin';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { transicionValida, armarBloqueo } from '@/lib/utilidades-admin';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------- Sesion ----------

// Se usa con useActionState: recibe el estado anterior y los datos del
// formulario, y devuelve { error } si algo falla.
export async function iniciarSesion(_estadoPrevio, formData) {
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (!email || !password) {
    return { error: 'Completá el email y la contraseña.' };
    }

    const supabase = await crearClienteServidor();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  // Mismo mensaje para "no existe", "contraseña mala" y "no es la admin":
  // no le contamos a un atacante cuál de los tres fue.
    const mensajeGenerico = { error: 'Email o contraseña incorrectos.' };

    if (error || !data.user) return mensajeGenerico;

    if (!esAdmin(data.user.email)) {
    await supabase.auth.signOut();
    return mensajeGenerico;
    }

  // redirect() funciona lanzando una excepcion interna: no va dentro de try/catch
    redirect('/admin');
}

export async function cerrarSesion() {
    const supabase = await crearClienteServidor();
    await supabase.auth.signOut();
    redirect('/admin/login');
}

// ---------- Turnos ----------

// Cambia el estado de un turno (confirmar, completar, no vino, cancelar).
export async function cambiarEstadoTurno(formData) {
    await requerirAdmin();

    const id = String(formData.get('id') ?? '');
    const nuevo = String(formData.get('estado') ?? '');
    if (!UUID.test(id)) return;

    const { data: turno } = await supabaseAdmin
    .from('turnos')
    .select('estado')
    .eq('id', id)
    .single();

  // Solo se permiten las transiciones de utilidades-admin.js
    if (!turno || !transicionValida(turno.estado, nuevo)) return;

  // .eq('estado', turno.estado) evita pisar un cambio que se hizo en otra
  // pestaña entre la lectura y la escritura.
    const { error } = await supabaseAdmin
    .from('turnos')
    .update({ estado: nuevo })
    .eq('id', id)
    .eq('estado', turno.estado);

    if (error) console.error('cambiarEstadoTurno', error);

    revalidatePath('/admin');
}

// ---------- Bloqueos ----------

export async function crearBloqueo(_estadoPrevio, formData) {
    await requerirAdmin();

    const valores = {
    desde: String(formData.get('desde') ?? ''),
    hasta: String(formData.get('hasta') ?? ''),
    horaDesde: String(formData.get('horaDesde') ?? ''),
    horaHasta: String(formData.get('horaHasta') ?? ''),
    razon: String(formData.get('razon') ?? '').trim(),
    };

  // Al terminar una accion React vacia el formulario: devolvemos los valores
  // cuando hay un error, para que no tenga que volver a escribirlos.
    const conError = (error) => ({ error, valores });

    const bloqueo = armarBloqueo(valores);
    if (bloqueo.error) return conError(bloqueo.error);

    if (new Date(bloqueo.fin) <= new Date()) {
    return conError('Ese período ya pasó.');
    }
    if (valores.razon.length > 200) {
    return conError('El motivo es demasiado largo (máximo 200 caracteres).');
    }

    const { error } = await supabaseAdmin.from('dias_libres').insert({
    inicio: bloqueo.inicio,
    fin: bloqueo.fin,
    razon: valores.razon || null,
    });

    if (error) {
    console.error('crearBloqueo', error);
    return conError('No se pudo guardar el bloqueo. Probá de nuevo.');
    }

  // Un bloqueo NO cancela turnos que ya existen: avisamos si hay alguno
    const { count } = await supabaseAdmin
    .from('turnos')
    .select('id', { count: 'exact', head: true })
    .in('estado', ['pendiente', 'confirmado'])
    .lt('inicio', bloqueo.fin)
    .gt('fin', bloqueo.inicio);

    revalidatePath('/admin/bloqueos');

    return {
    ok:
        count > 0
        ? `Bloqueo guardado. Ojo: ya hay ${count} turno${count === 1 ? '' : 's'} en ese período, y el bloqueo no los cancela. Revisalos en la agenda.`
        : 'Bloqueo guardado.',
    };
}

export async function eliminarBloqueo(formData) {
    await requerirAdmin();

    const id = Number(formData.get('id'));
    if (!Number.isInteger(id)) return;

    const { error } = await supabaseAdmin.from('dias_libres').delete().eq('id', id);
    if (error) console.error('eliminarBloqueo', error);

    revalidatePath('/admin/bloqueos');
}