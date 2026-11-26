// Lista de servicios activos, compartida por la portada y la pagina de reserva.
// El resultado se guarda en cache unos minutos (ver cacheLife).
import { cacheLife, cacheTag } from 'next/cache';
import { supabase } from './supabase';

export async function obtenerServicios() {
    'use cache';
    cacheLife('minutes');
    cacheTag('servicios');

    const { data, error } = await supabase
    .from('servicios')
    .select('id, nombre, categoria, precio, duracion_minutos')
    .order('nombre');

    if (error) throw new Error(error.message);
    return data;
}