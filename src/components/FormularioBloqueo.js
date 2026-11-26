'use client';

// Formulario para bloquear dias u horarios. Es un componente del navegador
// para mostrar el resultado (useActionState) y deshabilitar el boton al enviar.
// El guardado ocurre en el servidor, en la accion crearBloqueo.
import { useActionState } from 'react';
import { crearBloqueo } from '@/app/admin/actions';

export default function FormularioBloqueo() {
    const [estado, accion, enviando] = useActionState(crearBloqueo, null);

  // Si hubo error, la accion devuelve lo que se escribio para no perderlo
    const v = estado?.valores ?? {};

    return (
    <form action={accion} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
        <label className="block">
            <span className="mb-1 block text-sm">Desde</span>
            <input
            type="date"
            name="desde"
            required
            defaultValue={v.desde ?? ''}
            className="w-full rounded border p-2"
            />
        </label>
        <label className="block">
            <span className="mb-1 block text-sm">Hasta (opcional)</span>
            <input
            type="date"
            name="hasta"
            defaultValue={v.hasta ?? ''}
            className="w-full rounded border p-2"
            />
        </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
        <label className="block">
            <span className="mb-1 block text-sm">Hora desde (opcional)</span>
            <input
            type="time"
            name="horaDesde"
            defaultValue={v.horaDesde ?? ''}
            className="w-full rounded border p-2"
            />
        </label>
        <label className="block">
            <span className="mb-1 block text-sm">Hora hasta (opcional)</span>
            <input
            type="time"
            name="horaHasta"
            defaultValue={v.horaHasta ?? ''}
            className="w-full rounded border p-2"
            />
        </label>
        </div>

        <p className="text-xs">
        Sin horas se bloquean los días completos. Si dejás &quot;Hasta&quot; vacío,
        es un solo día.
        </p>

        <label className="block">
        <span className="mb-1 block text-sm">Motivo (opcional)</span>
        <input
            type="text"
            name="razon"
            maxLength={200}
            defaultValue={v.razon ?? ''}
            className="w-full rounded border p-2"
        />
        </label>

        {estado?.error && (
        <p role="alert" className="text-sm text-red-600">
            {estado.error}
        </p>
        )}
        {estado?.ok && <p role="status" className="text-sm">{estado.ok}</p>}

        <button
        type="submit"
        disabled={enviando}
        className="rounded bg-pink-600 px-4 py-2 text-white disabled:opacity-60"
        >
        {enviando ? 'Guardando…' : 'Bloquear'}
        </button>
    </form>
    );
}