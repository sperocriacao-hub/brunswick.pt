'use client';

import React, { useEffect, useState } from 'react';
import { Wifi, Activity, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchIoTEquipments } from '../actions';

type IoTDevice = {
    id: string;
    mac_address: string;
    nome_dispositivo: string;
    ip_local: string;
    versao_firmware: string;
    ultimo_heartbeat: string;
    ativo: boolean;
    estacao_id: string | null;
    estacoes?: {
        nome_estacao: string;
    } | null;
};

export function DeviceStatusTable() {
    const [devices, setDevices] = useState<IoTDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendenteMigration, setPendenteMigration] = useState(false);

    const loadDevices = async () => {
        setLoading(true);
        const res = await fetchIoTEquipments();
        if (res.pendenteMigracao) {
            setPendenteMigration(true);
        } else if (res.success && res.equipamentos) {
            // workaround for any typing issues, safely casting.
            // Ensure estacoes logic is intact
            setDevices(res.equipamentos as unknown as IoTDevice[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadDevices();
        // Polling para refrescar o status a cada 30 segundos
        const timer = setInterval(loadDevices, 30000);
        return () => clearInterval(timer);
    }, []);

    const isOffline = (lastHeartbeat: string | null) => {
        if (!lastHeartbeat) return true;
        const last = new Date(lastHeartbeat).getTime();
        const now = new Date().getTime();
        // Se a diferença for maior que 5 minutos (300.000 ms), consider -se offline
        return (now - last) > 300000;
    };

    if (pendenteMigration) {
        return (
            <div className="glass-panel p-6 text-center border border-amber-500/30">
                <AlertCircle size={32} className="text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-amber-500 mb-2">Migração Ausente</h3>
                <p className="text-sm opacity-80 mb-4 text-white">A tabela SQL <code className="bg-black/50 px-2 py-1 rounded">equipamentos_iot</code> ainda não existe na base de dados.</p>
                <p className="text-xs opacity-60">Por favor, execute o script 0007_shopfloor_equipamentos_iot no seu editor Supabase.</p>
            </div>
        );
    }

    return (
        <section className="glass-panel p-6 w-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="flex items-center gap-2 text-[1.2rem] text-blue-400 font-bold">
                    <Activity size={20} /> Monitorização de Saúde (Heartbeats)
                </h2>
                <button onClick={loadDevices} disabled={loading} className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} style={{ marginRight: '6px' }} />
                    Refrescar
                </button>
            </div>

            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                        <tr>
                            <th className="p-3 border-b border-white/10 text-sm font-semibold opacity-70">Dispositivo (Identidade)</th>
                            <th className="p-3 border-b border-white/10 text-sm font-semibold opacity-70">Rede Local (LAN)</th>
                            <th className="p-3 border-b border-white/10 text-sm font-semibold opacity-70">Alocado a</th>
                            <th className="p-3 border-b border-white/10 text-sm font-semibold opacity-70">Versão Fw.</th>
                            <th className="p-3 border-b border-white/10 text-sm font-semibold opacity-70">Estado LED</th>
                        </tr>
                    </thead>
                    <tbody>
                        {devices.map(dev => {
                            const offline = isOffline(dev.ultimo_heartbeat);
                            return (
                                <tr key={dev.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-3">
                                        <div className="font-bold text-sm tracking-wide">{dev.nome_dispositivo}</div>
                                        <div className="text-xs opacity-50 font-mono mt-1">{dev.mac_address}</div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Wifi size={14} className={offline ? "text-red-400" : "text-emerald-400"} />
                                            {dev.ip_local || 'S/ IP'}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <span className="text-sm bg-white/10 px-2 py-1 rounded">
                                            {dev.estacoes?.nome_estacao || 'Não Alocado'}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <span className="text-xs font-mono bg-blue-900/40 text-blue-300 border border-blue-700/50 px-2 py-1 rounded">
                                            {dev.versao_firmware || 'v--'}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        {offline ? (
                                            <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                                                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] blink-animation"></div>
                                                OFFLINE
                                                <span className="opacity-60 text-[10px] ml-2">Há &gt; 5m</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                                                ONLINE
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {devices.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} className="p-6 text-center opacity-50 text-sm">
                                    Nenhum dispositivo ESP32 registado na base de dados.
                                </td>
                            </tr>
                        )}
                        {loading && devices.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-6 text-center opacity-50 text-sm">
                                    A carregar rede IoT...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <style>{`
                .blink-animation {
                    animation: errBlink 1s infinite alternate;
                }
                @keyframes errBlink {
                    0% { opacity: 0.3; }
                    100% { opacity: 1; transform: scale(1.1); }
                }
            `}</style>
        </section>
    );
}
