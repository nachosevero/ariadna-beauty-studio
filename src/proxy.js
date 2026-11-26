// Proxy de Next.js 16 (antes se llamaba "middleware"). Corre ANTES de cada
// pedido a /admin. Hace dos cosas:
//   1. Refresca la sesion de Supabase (el token dura ~1 hora; sin esto la
//      administradora quedaria deslogueada en medio de la agenda).
//   2. Manda a /admin/login a quien no inició sesion.
//
// Es solo la primera barrera y comodidad: la seguridad real esta en
// requerirAdmin(), que se llama en cada pagina y accion.
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request) {
    let respuesta = NextResponse.next({ request });

    const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
        cookies: {
        getAll() {
            return request.cookies.getAll();
        },
        // "headers" trae Cache-Control & co: evitan que un CDN guarde esta
        // respuesta (con cookies de sesion) y se la muestre a otra persona.
        setAll(aGuardar, headers) {
            aGuardar.forEach(({ name, value }) => request.cookies.set(name, value));
            respuesta = NextResponse.next({ request });
            aGuardar.forEach(({ name, value, options }) =>
            respuesta.cookies.set(name, value, options)
            );
            Object.entries(headers ?? {}).forEach(([clave, valor]) =>
            respuesta.headers.set(clave, valor)
            );
        },
        },
    }
    );

  // No poner codigo entre createServerClient y getClaims: puede dejar la
  // sesion sin refrescar de forma dificil de depurar.
    const { data } = await supabase.auth.getClaims();
    const conSesion = Boolean(data?.claims);
    const enLogin = request.nextUrl.pathname === '/admin/login';

    if (!conSesion && !enLogin) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = '';
    return NextResponse.redirect(url);
    }

    return respuesta;
}

export const config = {
    matcher: ['/admin/:path*'],
};