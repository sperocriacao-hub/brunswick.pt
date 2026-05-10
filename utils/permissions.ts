export function hasEditPermission(permissoesModulos: string[] | undefined | null, modulePath: string, nivelPermissao?: string): boolean {
    if (nivelPermissao === "Admin") return true;
    if (!permissoesModulos) return false;
    
    // Se tiver o caminho exato na array (sem sufixos), tem permissão total (Edição)
    return permissoesModulos.includes(modulePath);
}

export function hasReadonlyPermission(permissoesModulos: string[] | undefined | null, modulePath: string): boolean {
    if (!permissoesModulos) return false;
    
    // Se tiver apenas o caminho com a tag :readonly
    return permissoesModulos.includes(`${modulePath}:readonly`);
}

export function canAccessModule(permissoesModulos: string[] | undefined | null, modulePath: string, nivelPermissao?: string): boolean {
    if (nivelPermissao === "Admin") return true;
    if (modulePath === "/admin" || modulePath === "/admin/melhoria-continua") return true;
    if (!permissoesModulos) return false;
    
    // Tem acesso se tiver o módulo com ou sem readonly
    return permissoesModulos.some(p => p === modulePath || p.startsWith(modulePath + ':'));
}
