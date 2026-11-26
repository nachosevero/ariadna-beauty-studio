// Pagina /admin/bloqueos: vacaciones, feriados y horarios en los que no atiende.
import { Suspense } from 'react';
import Link from 'next/link';
import { connection } from 'next/server';
import { eliminarBloqueo } from '../actions';
import { obtenerBloqueosFuturos } from '@/lib/datos-admin';
import { describirBloqueo } from '@/lib/utilidades-admin';
import FormularioBloqueo from '@/components/FormularioBloqueo';
import BotonAccion from '@/components/BotonAccion';

export const metadata = {
    title: 'Bloqueos | Ariadna Beauty Studio',
    robots: { index: false },
};

// Lee la hora actual (para ocultar los bloqueos que ya pasaron): se calcula en
// cada pedido, igual que la agenda.
async function ListaBloqueos() {
    await connection();
    const bloqueos = await obtenerBloqueosFuturos();

    if (bloqueos.length === 0) {
    return <p className="text-sm">No hay bloqueos próximos.</p>;
    }

    return (
    <ul className="space-y-3">
        {bloqueos.map((b) => (
        <li
            key={b.id}
            className="flex items-start justify-between gap-3 rounded border p-4"
        >
            <div>
            <p className="font-medium capitalize">{describirBloqueo(b.inicio, b.fin)}</p>
            {b.razon && <p className="text-sm">{b.razon}</p>}
            </div>

            <form action={eliminarBloqueo}>
            <input type="hidden" name="id" value={b.id} />
            <BotonAccion
                mensaje="¿Quitar este bloqueo? Esos horarios volverán a estar disponibles para reservar."
                className="rounded border px-3 py-1 text-sm"
            >
                Quitar
            </BotonAccion>
            </form>
        </li>
        ))}
    </ul>
    );
}

export default function PaginaBloqueos() {
    return (
    <main className="mx-auto max-w-2xl p-6">
        <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bloquear días y horarios</h1>
        <Link href="/admin" className="text-sm underline">
            ← Agenda
        </Link>
        </header>

        <section className="mb-8">
        <FormularioBloqueo />
        </section>

        <section>
        <h2 className="mb-3 text-xl font-medium">Próximos bloqueos</h2>
        <Suspense fallback={<p>Cargando…</p>}>
            <ListaBloqueos />
        </Suspense>
        </section>
    </main>
    );
}