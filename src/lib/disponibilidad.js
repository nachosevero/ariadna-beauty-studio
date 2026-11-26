// Calculo de horarios libres para reservar un turno.

// Ofset de hora de Uruguay (UTC-3) y milisegundos en un minuto.
const OFFSET = '-03:00';
const OFFSET_MS = 3 * 60 * 60 * 1000;
const MIN = 60 * 1000;

// '2026-12-07' + '09:00' (o '09:00:00') -> milisegundos
function aMs(fecha, hora) {
    return new Date(`${fecha}T${hora.slice(0, 5)}:00${OFFSET}`).getTime();
}

// milisegundos -> 'HH:MM' en hora de Uruguay
function etiquetaHora(ms) {
    return new Date(ms - OFFSET_MS).toISOString().slice(11, 16);
}

// Dos intervalos [inicio, fin) se superponen si cada uno empieza antes de que
// termine el otro. Que uno termine justo cuando empieza el otro NO es superposicion.
function seSuperpone(inicioA, finA, inicioB, finB) {
    return inicioA < finB && finA > inicioB;
}

/*
 * @param {object} p
 * @param {string} p.fecha            Dia a consultar, 'YYYY-MM-DD'
 * @param {number} p.duracionMin      Duracion de los servicios en minutos
 *                                    (SIN la preparacion)
 * @param {number} [p.preparacionMin] Minutos de preparacion/limpieza al terminar.
 *                                    Pueden pasarse del horario de cierre, pero
 *                                    si bloquean al turno que sigue.
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
    preparacionMin = 0,
    horariosTrabajo,
    turnos = [],
    diasLibres = [],
    pasoMin = 30,
    anticipacionMin = 0,
    ahora = new Date(),
}) {
  // 0 = domingo ... 6 = sabado (igual que dia_semanal en la base de datos)
    const diaSemana = new Date(`${fecha}T12:00:00${OFFSET}`).getUTCDay();

    const ocupados = [...turnos, ...diasLibres].map((o) => ({
    inicio: new Date(o.inicio).getTime(),
    fin: new Date(o.fin).getTime(),
    }));

    const primerPermitido = ahora.getTime() + anticipacionMin * MIN;
    const duracionMs = duracionMin * MIN;
    const preparacionMs = preparacionMin * MIN;
    const libres = [];

    const franjas = horariosTrabajo.filter((h) => h.dia_semanal === diaSemana);

    for (const franja of franjas) {
    const finFranja = aMs(fecha, franja.horario_fin);

    // Probamos un inicio cada pasoMin, mientras el SERVICIO entre en la franja.
    // La preparacion no cuenta aca: puede terminar despues del cierre.
    for (
        let inicio = aMs(fecha, franja.horario_inicio);
        inicio + duracionMs <= finFranja;
      inicio += pasoMin * MIN
    ) {
      // fin incluye la preparacion: es lo que se ocupa en la agenda y lo que
      // se guarda en turnos.fin, igual que la restriccion de la base de datos.
        const fin = inicio + duracionMs + preparacionMs;

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