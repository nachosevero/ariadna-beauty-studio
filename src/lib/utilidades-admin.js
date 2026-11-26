// fechas en hora de Uruguay y enlace de WhatsApp. Se prueban con node --test.

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