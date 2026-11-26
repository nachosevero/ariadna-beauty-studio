// Autenticacion del panel de administracion. Solo corre en el servidor.
//
// Modelo de seguridad (dos llaves, las dos tienen que coincidir):
//   1. Tener una sesion valida de Supabase Auth (login con email y contraseña).
//   2. Que ese email sea el de la administradora (variable ADMIN_EMAIL).
// Si ADMIN_EMAIL no esta definida, NADIE puede entrar: falla cerrado.
//
// Los datos del panel se leen con la clave secreta (supabaseAdmin) desde el
// servidor, asi que no hace falta abrir las tablas privadas al rol
// "authenticated" ni escribir politicas RLS para ellas.
import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';

// Un cliente nuevo por pedido (no se comparte entre usuarios).
export async function crearClienteServidor() {
    const almacen = await cookies();

    return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
        cookies: {
        getAll() {
            return almacen.getAll();
        },
        setAll(aGuardar) {
            try {
            aGuardar.forEach(({ name, value, options }) =>
                almacen.set(name, value, options)
            );
            } catch {
            // Desde un Server Component no se pueden escribir cookies.
            // No pasa nada: src/proxy.js es quien refresca la sesion.
            }
        },
        },
    }
    );
}

export function esAdmin(email) {
    const admin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    return Boolean(admin) && email?.trim().toLowerCase() === admin;
}

// Llamar al principio de CADA pagina, accion o funcion de datos del panel.
// El proxy ya redirige a quien no inició sesión, pero no hay que depender
// solo de el: un Server Action puede quedar fuera del alcance del proxy si
// alguien cambia su matcher o mueve el archivo.
export async function requerirAdmin() {
    const supabase = await crearClienteServidor();
  // getClaims() verifica la firma del token; getSession() NO es seguro aca.
    const { data } = await supabase.auth.getClaims();

    if (!esAdmin(data?.claims?.email)) {
    redirect('/admin/login');
    }
}