// Pagina /reservar. Corre en el SERVIDOR: trae los servicios (con cache) y se los
// pasa al componente interactivo, que corre en el navegador.
import { Suspense } from 'react';
import { obtenerServicios } from '@/lib/servicios';
import Reservar from '@/components/reservar';

async function FormularioDeReserva() {
    const servicios = await obtenerServicios();
    return <Reservar servicios={servicios} />;
}

export const metadata = {
    title: 'Reservar turno | Ariadna Beauty Studio',
};

export default function PaginaReservar() {
    return (
    <main className="mx-auto max-w-2xl p-6">
        <h1 className="mb-6 text-3xl font-semibold">Reservar turno</h1>
        <Suspense fallback={<p>Cargando servicios…</p>}>
        <FormularioDeReserva />
        </Suspense>
    </main>
    );
}