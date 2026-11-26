// No se reserva con menos de 1 hora de anticipacion.
export const ANTICIPACION_MIN = 60;

// Suma de duraciones de los servicios, y una sola preparacion (la mayor),
// porque se limpia una vez al terminar la visita y no despues de cada servicio.
export function calcularDuracion(servicios) {
    return {
    duracionMin: servicios.reduce((total, s) => total + s.duracion_minutos, 0),
    preparacionMin: Math.max(...servicios.map((s) => s.preparacion_minutos)),
    };
}