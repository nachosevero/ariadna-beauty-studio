// Pagina /admin/login
import FormularioLogin from '@/components/FormularioLogin';

export const metadata = {
    title: 'Ingresar | Ariadna Beauty Studio',
  robots: { index: false }, // que Google no la indexe
};

export default function PaginaLogin() {
    return (
    <main className="mx-auto max-w-sm p-6">
        <h1 className="mb-6 text-2xl font-semibold">Panel de Ariadna</h1>
        <FormularioLogin />
    </main>
    );
}