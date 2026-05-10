'use client';

import { useEffect } from 'react';

export function PermissionHydrator({ permissoes, nivel }: { permissoes: string[], nivel: string }) {
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).__USER_PERMISSIONS__ = permissoes;
            (window as any).__USER_LEVEL__ = nivel;
        }
    }, [permissoes, nivel]);

    return null;
}
