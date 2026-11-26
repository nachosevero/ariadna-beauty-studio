'use server';

// Server Actions del panel: se ejecutan en el servidor aunque se llamen desde
// un formulario del navegador.
import { redirect } from 'next/navigation';
import { crearClienteServidor, esAdmin } from '@/lib/auth-admin';

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