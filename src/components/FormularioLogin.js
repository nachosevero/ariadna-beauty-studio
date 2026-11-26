'use client';

// Formulario de login. Es un componente del navegador solo para poder usar
// useActionState (mostrar el error y deshabilitar el boton mientras envia).
// El login en si ocurre en el servidor, en la accion iniciarSesion.
import { useActionState } from 'react';
import { iniciarSesion } from '@/app/admin/actions';

export default function FormularioLogin() {
    const [estado, accion, enviando] = useActionState(iniciarSesion, null);

    return (
    <form action={accion} className="space-y-3">
        <label className="block">
        <span className="mb-1 block text-sm">Email</span>
        <input
            type="email"
            name="email"
            required
            autoComplete="username"
            className="w-full rounded border p-2"
        />
        </label>

        <label className="block">
        <span className="mb-1 block text-sm">Contraseña</span>
        <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="w-full rounded border p-2"
        />
        </label>

        {estado?.error && (
        <p role="alert" className="text-sm text-red-600">
            {estado.error}
        </p>
        )}

        <button
        type="submit"
        disabled={enviando}
        className="rounded bg-pink-600 px-4 py-2 text-white disabled:opacity-60"
        >
        {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
    </form>
    );
}