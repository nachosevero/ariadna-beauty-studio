// Calculo de horarios libres para reservar un turno.

// Offset de la zona horaria de Uruguay (UTC-3)
const OFFSET = '-03:00';
const OFFSET_MS = 3 * 60 * 60 * 1000;
const MIN = 60 * 1000;

// Función para convertir fecha y hora a milisegundos desde epoch
function aMs(fecha, hora) {
    return new Date(`${fecha}T${hora.slice(0, 5)}:00${OFFSET}`).getTime();
}

// milisegundos desde epoch a fecha y hora de Uruguay
function etiquetaHora(ms) {
    return new Date(ms - OFFSET_MS).toISOString().slice(11, 16);
}

function seSuperpone(inicioA, finA, inicioB, finB) {
    return inicioA < finB && finA > inicioB;
}

/*
 * @param {object} p
 * @param {string} p.fecha            Dia a consultar, 'YYYY-MM-DD'
 * @param {number} p.duracionMin      Duracion total del turno en minutos
 *                                    (servicios + preparacion)
 * @param {Array}  p.horariosTrabajo  Filas de horarios_trabajo
 *                                    { dia_semanal, horario_inicio, horario_fin }
 * @param {Array}  [p.turnos]         Turnos activos { inicio, fin }
 * @param {Array}  [p.diasLibres]     Bloqueos { inicio, fin }
 * @param {number} [p.pasoMin]        Cada cuantos minutos se ofrece un horario
 * @param {number} [p.anticipacionMin] Anticipacion minima para reservar
 * @param {Date}   [p.ahora]          Momento actual (se inyecta para poder testear)
 * @returns {Array<{hora: string, inicio: Date, fin: Date}>}
 */

export function calcularHorariosLibres({
    fecha,
    duracionMin,
    horariosTrabajo,
    turnos = [],
    diasLibres = [],
    pasoMin = 30,
    anticipacionMin = 0,
    ahora = new Date(),
}) {
    const diaSemana = new Date(`${fecha}T12:00:00${OFFSET}`).getUTCDay();

    const ocupados = [...turnos, ...diasLibres].map((o) => ({
        inicio: new Date(o.inicio).getTime(),
        fin: new Date(o.fin).getTime(),
    }));

    const primerPermitido = ahora.getTime() + anticipacionMin * MIN;
    const duracionMs = duracionMin * MIN;
    const libres = [];

    const franjas = horariosTrabajo.filter((h) => h.dia_semanal === diaSemana);

    for (const franja of franjas) {
        const finFranja = aMs(fecha, franja.horario_fin);

        // Pruebo un inicio cada pasoMin, mientras el turno entre en la franja
        for (
            let inicio = aMs(fecha, franja.horario_inicio);
            inicio + duracionMs <= finFranja;
            inicio += pasoMin * MIN
        ) {
            const fin = inicio + duracionMs;

            if (inicio < primerPermitido) continue;
            if (ocupados.some((o) => seSuperpone(inicio, fin, o.inicio, o.fin))) continue;

            libres.push({
                hora: etiquetaHora(inicio),
                inicio: new Date(inicio),
                fin: new Date(fin),
            });
        }
    }

    return libres.sort((a, b) => a.inicio - b.inicio);
}