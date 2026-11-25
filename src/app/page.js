import { cacheLife, cacheTag } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { CATEGORIAS, ORDEN_CATEGORIAS } from '@/lib/categorias';

async function obtenerServicios() {
  'use cache';
  cacheLife('minutes');
  cacheTag('servicios');

  const { data, error } = await supabase
    .from('servicios')
    .select('id, nombre, categoria, precio')
    .order('nombre');

    if (error) throw new Error(error.message);
    return data;
}

export default async function Home() {
  let servicios;
  try {
    servicios = await obtenerServicios();
  } catch (e) {
    return <p className="p-6">Error al cargar los servicios: {e.message}</p>;
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-3xl font-semibold">Ariadna Beauty Studio</h1>

      {ORDEN_CATEGORIAS.map((cat) => {
        const items = servicios.filter((s) => s.categoria === cat);
        if (items.length === 0) return null;

        return (
          <section key={cat} className="mb-8">
            <h2 className="mb-3 text-xl font-medium">{CATEGORIAS[cat]}</h2>
            <ul className="divide-y">
              {items.map((s) => (
                <li key={s.id} className="flex justify-between py-2">
                  <span>{s.nombre}</span>
                  <span>${s.precio}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}