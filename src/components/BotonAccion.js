'use client';

// Boton para formularios con Server Action. Hace dos cosas que un <button>
// normal no hace:
//   - se deshabilita mientras el formulario se esta enviando (evita doble clic)
//   - si se le pasa "mensaje", pide confirmacion antes de enviar
import { useFormStatus } from 'react-dom';

export default function BotonAccion({ children, mensaje, className = '', ...resto }) {
    const { pending } = useFormStatus();

    return (
    <button
        type="submit"
        disabled={pending}
        className={`${className} disabled:opacity-60`}
        onClick={(e) => {
        if (mensaje && !window.confirm(mensaje)) e.preventDefault();
        }}
        {...resto}
    >
        {children}
    </button>
    );
}