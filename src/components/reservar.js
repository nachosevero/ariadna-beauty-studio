'use client';

// Componente del NAVEGADOR: tiene estado (useState) e interactividad.
// Recibe la lista de servicios desde la pagina (que corre en el servidor) y
// consulta los horarios libres llamando a /api/disponibilidad.
// No importa nada de supabase-admin: la clave secreta nunca llega aca.

import { useEffect, useRef, useState } from 'react';
import { CATEGORIAS, ORDEN_CATEGORIAS } from '@/lib/categorias';

const formatoPrecio = (n) => `$${Number(n).toLocaleString('es-UY')}`;

export default function Reservar({ servicios }) {
    const [elegidos, setElegidos] = useState([]); // ids de los servicios elegidos
    const [fecha, setFecha] = useState(''); // 'YYYY-MM-DD'
    const [horarios, setHorarios] = useState([]); // ['09:00', '09:30', ...]
    const [horaElegida, setHoraElegida] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
  const [hoy, setHoy] = useState(''); // fecha de hoy en Uruguay, 'YYYY-MM-DD'

  // La fecha de hoy se calcula en el navegador, ya montado el componente.
  // El locale 'sv-SE' da el formato YYYY-MM-DD, y la zona horaria fija evita
  // que alguien con el reloj en otro pais vea un "hoy" distinto al del estudio.
    useEffect(() => {
    setHoy(
        new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Montevideo' })
    );
    }, []);

  // Cuenta las consultas. Si el usuario cambia de servicio o de fecha rapido,
  // pueden llegar respuestas fuera de orden: solo se usa la de la ultima.
    const ultimaConsulta = useRef(0);

    async function cargarHorarios(ids, dia) {
    setHoraElegida(null);
    setError('');

    if (ids.length === 0 || !dia) {
      ultimaConsulta.current += 1; // descarta cualquier respuesta pendiente
        setHorarios([]);
        setCargando(false);
        return;
    }

    const consulta = ++ultimaConsulta.current;
    setCargando(true);

    try {
        const res = await fetch(
        `/api/disponibilidad?fecha=${dia}&servicios=${ids.join(',')}`
        );
        const datos = await res.json();
      if (consulta !== ultimaConsulta.current) return; // llego una respuesta vieja
        if (!res.ok) throw new Error(datos.error);
        setHorarios(datos.horarios);
    } catch {
        if (consulta !== ultimaConsulta.current) return;
        setHorarios([]);
        setError('No se pudieron cargar los horarios. Probá de nuevo.');
    } finally {
        if (consulta === ultimaConsulta.current) setCargando(false);
    }
    }

    function alternarServicio(id) {
    const nuevos = elegidos.includes(id)
        ? elegidos.filter((x) => x !== id)
        : [...elegidos, id];
    setElegidos(nuevos);
    cargarHorarios(nuevos, fecha);
    }

    function cambiarFecha(nuevaFecha) {
    // El atributo min solo bloquea el calendario desplegable: si la persona
    // escribe una fecha pasada a mano, el onChange igual se dispara.
    // Por eso tambien se valida aca.
    if (nuevaFecha && hoy && nuevaFecha < hoy) {
        setFecha('');
        cargarHorarios(elegidos, '');
        return;
    }
    setFecha(nuevaFecha);
    cargarHorarios(elegidos, nuevaFecha);
    }

    const seleccionados = servicios.filter((s) => elegidos.includes(s.id));
    const total = seleccionados.reduce((suma, s) => suma + Number(s.precio), 0);
    const minutos = seleccionados.reduce((suma, s) => suma + s.duracion_minutos, 0);

    return (
    <div className="space-y-8">
      {/* 1. Servicios */}
        <section>
        <h2 className="mb-3 text-xl font-medium">1. Elegí tus servicios</h2>

        {ORDEN_CATEGORIAS.map((cat) => {
            const items = servicios.filter((s) => s.categoria === cat);
            if (items.length === 0) return null;

            return (
            <fieldset key={cat} className="mb-4">
                <legend className="mb-1 font-medium">{CATEGORIAS[cat]}</legend>
                {items.map((s) => (
                <label
                    key={s.id}
                    className="flex cursor-pointer items-center justify-between gap-3 py-1"
                >
                    <span className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={elegidos.includes(s.id)}
                        onChange={() => alternarServicio(s.id)}
                    />
                    {s.nombre}
                    </span>
                    <span className="whitespace-nowrap text-sm">
                    {s.duracion_minutos} min · {formatoPrecio(s.precio)}
                    </span>
                </label>
                ))}
            </fieldset>
            );
        })}

        {seleccionados.length > 0 && (
            <p className="mt-2 text-sm">
            {seleccionados.length} servicio(s) · {minutos} min · Total{' '}
            {formatoPrecio(total)}
            </p>
        )}
        </section>

      {/* 2. Fecha */}
        <section>
        <h2 className="mb-3 text-xl font-medium">2. Elegí la fecha</h2>
        <input
            type="date"
            value={fecha}
            min={hoy}
            onChange={(e) => cambiarFecha(e.target.value)}
            className="rounded border p-2"
        />
        </section>

      {/* 3. Horarios */}
        <section>
        <h2 className="mb-3 text-xl font-medium">3. Elegí el horario</h2>

        {elegidos.length === 0 || !fecha ? (
            <p className="text-sm">
            Elegí al menos un servicio y una fecha para ver los horarios.
            </p>
        ) : cargando ? (
            <p className="text-sm">Buscando horarios…</p>
        ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
        ) : horarios.length === 0 ? (
            <p className="text-sm">
            No hay horarios disponibles ese día. Probá con otra fecha.
            </p>
        ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {horarios.map((hora) => (
                <button
                key={hora}
                type="button"
                aria-pressed={hora === horaElegida}
                onClick={() => setHoraElegida(hora)}
                className={`rounded border px-3 py-2 ${
                    hora === horaElegida
                    ? 'border-pink-600 bg-pink-600 text-white'
                    : 'hover:border-pink-600'
                }`}
                >
                {hora}
                </button>
            ))}
            </div>
        )}
        </section>

      {/* Resumen (el siguiente paso sera confirmar la reserva) */}
        {horaElegida && (
        <section className="rounded border p-4">
            <h2 className="mb-2 font-medium">Tu turno</h2>
            <p className="text-sm">
            {new Date(`${fecha}T12:00:00-03:00`).toLocaleDateString('es-UY', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
            })}{' '}
            a las {horaElegida} · Total {formatoPrecio(total)}
            </p>
        </section>
        )}
    </div>
    );
}