const ZONA = 'America/Montevideo';

// Fecha de hoy en Uruguay, 'YYYY-MM-DD'. El locale 'sv-SE' da ese formato.
// Se calcula con la zona fija: el servidor (Vercel) corre en UTC, y a las
// 22:00 en Montevideo ya seria "mañana" en UTC.
export function hoyEnUruguay(ahora = new Date()) {
    return ahora.toLocaleDateString('sv-SE', { timeZone: ZONA });
}

// Valida que sea un texto 'YYYY-MM-DD' y una fecha que existe (no el 2026-02-30).
export function esFechaValida(texto) {
    if (typeof texto !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
    const d = new Date(`${texto}T12:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === texto;
}

// Suma (o resta) dias a una fecha 'YYYY-MM-DD'. Usa mediodia UTC para que
// ningun cambio de hora pueda correr el dia.
export function sumarDias(fecha, dias) {
    const d = new Date(`${fecha}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + dias);
    return d.toISOString().slice(0, 10);
}

// '2026-12-07T13:00:00Z' -> '10:00' (hora de Uruguay)
export function horaUruguay(iso) {
    return new Date(iso).toLocaleTimeString('sv-SE', {
    timeZone: ZONA,
    hour: '2-digit',
    minute: '2-digit',
    });
}

// '2026-12-07' -> 'lunes, 7 de diciembre'
export function fechaLarga(fecha) {
    return new Date(`${fecha}T12:00:00-03:00`).toLocaleDateString('es-UY', {
    timeZone: ZONA,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    });
}

// Arma el enlace https://wa.me/<numero> a partir de un telefono escrito como
// la clienta quiera ('099 123 456', '+598 99 123 456', '99123456').
// Devuelve null si no parece un telefono.
export function enlaceWhatsApp(telefono) {
    const digitos = String(telefono ?? '').replace(/\D/g, '');
    if (digitos.length < 7) return null;

    let numero = digitos;
    if (digitos.startsWith('0')) {
    numero = `598${digitos.slice(1)}`; // 099 123 456 -> 598 99 123 456
    } else if (digitos.length <= 9) {
    numero = `598${digitos}`; // sin codigo de pais
    }
    return `https://wa.me/${numero}`;
}

// '2026-12-07T13:00:00Z' -> '2026-12-07' (fecha de Uruguay)
export function fechaUruguay(iso) {
    return new Date(iso).toLocaleDateString('sv-SE', { timeZone: ZONA });
}

// ---------- Estados de un turno ----------
// Desde que estado se puede pasar a cual. Los estados finales (completado,
// no_mostrar, cancelado) no tienen salida: no se reabren.
const TRANSICIONES = {
    pendiente: ['confirmado', 'cancelado'],
    confirmado: ['completado', 'no_mostrar', 'cancelado'],
};

export function estadosSiguientes(estado) {
    return TRANSICIONES[estado] ?? [];
}

export function transicionValida(actual, nuevo) {
    return estadosSiguientes(actual).includes(nuevo);
}

// ---------- Bloqueos (dias_libres) ----------
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const DIA_MS = 24 * 60 * 60 * 1000;

// Convierte lo que se completa en el formulario en un intervalo.
//   - Sin horas: dias completos, desde las 00:00 del primer dia hasta las
//     00:00 del dia siguiente al ultimo ("hasta" es inclusivo).
//   - Con horas: de horaDesde en la fecha "desde" a horaHasta en la fecha "hasta".
// Devuelve { inicio, fin } (ISO) o { error }.
export function armarBloqueo({ desde, hasta, horaDesde, horaHasta }) {
    const fechaDesde = desde;
  const fechaHasta = hasta || desde; // si no hay "hasta", es un solo dia

    if (!esFechaValida(fechaDesde) || !esFechaValida(fechaHasta)) {
    return { error: 'Elegí fechas válidas.' };
    }
    if (fechaHasta < fechaDesde) {
    return { error: 'La fecha "hasta" no puede ser anterior a "desde".' };
    }

    let inicio;
    let fin;

    if (horaDesde || horaHasta) {
    if (!HORA.test(horaDesde ?? '') || !HORA.test(horaHasta ?? '')) {
        return {
        error: 'Completá las dos horas, o dejalas vacías para bloquear días completos.',
        };
    }
    inicio = new Date(`${fechaDesde}T${horaDesde}:00-03:00`);
    fin = new Date(`${fechaHasta}T${horaHasta}:00-03:00`);
    } else {
    inicio = new Date(`${fechaDesde}T00:00:00-03:00`);
    fin = new Date(`${sumarDias(fechaHasta, 1)}T00:00:00-03:00`);
    }

    if (!(fin > inicio)) {
    return { error: 'La hora final tiene que ser posterior a la inicial.' };
    }
  if (fin - inicio > 366 * DIA_MS) {
    return { error: 'Un bloqueo no puede durar más de un año.' };
    }

    return { inicio: inicio.toISOString(), fin: fin.toISOString() };
}

// Texto legible de un bloqueo para la lista del panel.
export function describirBloqueo(inicioIso, finIso) {
    const f1 = fechaUruguay(inicioIso);
    const f2 = fechaUruguay(finIso);
    const h1 = horaUruguay(inicioIso);
    const h2 = horaUruguay(finIso);

  // Dias completos: de 00:00 a 00:00 del dia siguiente al ultimo bloqueado
    if (h1 === '00:00' && h2 === '00:00') {
    const ultimo = sumarDias(f2, -1);
    return ultimo === f1
        ? fechaLarga(f1)
        : `${fechaLarga(f1)} al ${fechaLarga(ultimo)}`;
    }

    return f1 === f2
    ? `${fechaLarga(f1)}, de ${h1} a ${h2}`
    : `${fechaLarga(f1)} ${h1} al ${fechaLarga(f2)} ${h2}`;
}