// Pagina /admin: agenda del dia. Se navega con ?fecha=YYYY-MM-DD.
import { Suspense } from 'react';
import Link from 'next/link';
import { connection } from 'next/server';
import { cerrarSesion, cambiarEstadoTurno } from './actions';
import { obtenerAgendaDelDia } from '@/lib/datos-admin';
import {
    hoyEnUruguay,
    esFechaValida,
    sumarDias,
    horaUruguay,
    fechaLarga,
    enlaceWhatsApp,
    estadosSiguientes,
} from '@/lib/utilidades-admin';
import BotonAccion from '@/components/BotonAccion';

export const metadata = {
    title: 'Agenda | Ariadna Beauty Studio',
    robots: { index: false },
};

const formatoPrecio = (n) => `$${Number(n).toLocaleString('es-UY')}`;

const ETIQUETA_ESTADO = {
    pendiente: 'Pendiente',
    confirmado: 'Confirmado',
    cancelado: 'Cancelado',
    completado: 'Completado',
    no_mostrar: 'No vino',
};

// Texto de cada boton segun el estado al que lleva
const TEXTO_BOTON = {
    confirmado: 'Confirmar',
    completado: 'Completado',
    no_mostrar: 'No vino',
    cancelado: 'Cancelar turno',
};

// Esta parte lee cookies y la URL (datos que cambian en cada pedido), por eso
// va dentro de <Suspense>: Next.js muestra el resto de la pagina al instante.
async function Agenda({ searchParams }) {
  // "Hoy" cambia con el reloj, y Next.js no deja usar la hora actual mientras
  // prepara la pagina por adelantado (prerender). connection() avisa que este
  // componente se calcula en cada pedido, y recien despues se puede leer la hora.
    await connection();

    const { fecha: pedida } = await searchParams;
    const fecha = esFechaValida(pedida) ? pedida : hoyEnUruguay();
    const turnos = await obtenerAgendaDelDia(fecha);

    const activos = turnos.filter((t) => t.estado !== 'cancelado').length;

    return (
    <>
        <nav className="mb-4 flex items-center justify-between gap-2">
        <Link
            href={`/admin?fecha=${sumarDias(fecha, -1)}`}
            className="rounded border px-3 py-1"
        >
            ← Anterior
        </Link>
        <Link href="/admin" className="rounded border px-3 py-1">
            Hoy
        </Link>
        <Link
            href={`/admin?fecha=${sumarDias(fecha, 1)}`}
            className="rounded border px-3 py-1"
        >
            Siguiente →
        </Link>
        </nav>

        <h2 className="text-xl font-medium capitalize">{fechaLarga(fecha)}</h2>
        <p className="mb-4 text-sm">
        {activos === 0
            ? 'No hay turnos este día.'
            : `${activos} turno${activos === 1 ? '' : 's'}`}
        </p>

        <ul className="space-y-3">
        {turnos.map((t) => {
            const total = t.servicios_turno.reduce(
            (suma, s) => suma + Number(s.precio_reserva),
            0
            );
            const whatsapp = enlaceWhatsApp(t.clientes.telefono);

            return (
            <li
                key={t.id}
                className={`rounded border p-4 ${t.estado === 'cancelado' ? 'opacity-60' : ''}`}
            >
                <div className="flex items-baseline justify-between gap-3">
                <p className="font-medium">
                    {horaUruguay(t.inicio)} – {horaUruguay(t.fin)}
                </p>
                <span className="text-xs uppercase">
                    {ETIQUETA_ESTADO[t.estado] ?? t.estado}
                </span>
                </div>

                <p className="mt-1">{t.clientes.nombre_completo}</p>
                <p className="text-sm">
                {t.servicios_turno.map((s) => s.servicios.nombre).join(' + ')}
                </p>
                <p className="text-sm">Total {formatoPrecio(total)}</p>

                <p className="mt-1 text-sm">
                {t.clientes.telefono}
                {whatsapp && (
                    <>
                    {' · '}
                    <a
                        href={whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                    >
                        WhatsApp
                    </a>
                    </>
                )}
                </p>

                {t.notas && <p className="mt-1 text-sm">Nota: {t.notas}</p>}

                {estadosSiguientes(t.estado).length > 0 && (
                <form action={cambiarEstadoTurno} className="mt-3 flex flex-wrap gap-2">
                    <input type="hidden" name="id" value={t.id} />
                    {estadosSiguientes(t.estado).map((estado) => (
                    <BotonAccion
                        key={estado}
                        name="estado"
                        value={estado}
                        mensaje={
                        estado === 'cancelado'
                            ? `¿Cancelar el turno de ${t.clientes.nombre_completo}? Esta acción no se puede deshacer.`
                            : undefined
                        }
                        className="rounded border px-3 py-1 text-sm"
                    >
                        {TEXTO_BOTON[estado]}
                    </BotonAccion>
                    ))}
                </form>
                )}
            </li>
            );
        })}
        </ul>
    </>
    );
}

export default function PaginaAdmin({ searchParams }) {
    return (
    <main className="mx-auto max-w-2xl p-6">
        <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agenda</h1>
        <div className="flex items-center gap-4">
            <Link href="/admin/bloqueos" className="text-sm underline">
            Bloquear días
            </Link>
            <form action={cerrarSesion}>
            <button type="submit" className="text-sm underline">
                Cerrar sesión
            </button>
            </form>
        </div>
        </header>

        <Suspense fallback={<p>Cargando agenda…</p>}>
        <Agenda searchParams={searchParams} />
        </Suspense>
    </main>
    );
}