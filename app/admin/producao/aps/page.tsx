import { buscarDadosAPS } from './actions';
import ApsBoard from './ApsBoard';
import { AlertCircle } from 'lucide-react';

export const metadata = { title: 'Control Tower (APS) | Brunswick M.E.S' };

export default async function APSPage() {
    const { success, ordens, bottlenecks, moldes, estacoes, activeRfids, error } = await buscarDadosAPS();

    if (!success) {
        return (
            <div className="p-8 text-center text-red-500">
                <AlertCircle className="mx-auto h-12 w-12 mb-4" />
                <h2 className="text-xl font-bold">Erro ao carregar APS</h2>
                <p>{error}</p>
            </div>
        );
    }

    return <ApsBoard inicialOrdens={ordens || []} historicoAps={bottlenecks || []} moldesPlan={moldes || []} estacoes={estacoes || []} activeRfids={activeRfids || []} />;
}
