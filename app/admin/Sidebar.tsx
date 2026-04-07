"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  GitBranch,
  Layers,
  Settings,
  CalendarDays,
  Activity,
  Menu,
  X,
  AlertTriangle,
  Lightbulb,
  Footprints,
  Crosshair,
  ListTodo,
  ShieldCheck,
  ShieldAlert,
  History,
  Award,
  Monitor,
  Tv,
  Briefcase,
  Users,
  Wifi,
  FlaskConical,
  UserCheck,
  Search,
  Frown,
  Meh,
  Smile,
  Heart,
  ThumbsDown,
  Star,
  GraduationCap
} from "lucide-react";

export function Sidebar({
  userEmail,
  nivelPermissao = "",
  permissoesModulos = [],
}: {
  userEmail: string | undefined;
  nivelPermissao?: string;
  permissoesModulos?: string[];
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Core Access Control Logic
  const hasAccess = (modulePath: string) => {
    // 1. Master Admins bypass granular permissions, seeing everything.
    if (nivelPermissao === "Admin") return true;

    // 2. Dashboard is implicitly open to anyone who has access to the Backoffice.
    if (modulePath === "/admin" || modulePath === "/admin/dashboard/eficiencia") return true;

    // 3. Otherwise, check if the exact path exists in their permitted modules array.
    return permissoesModulos.includes(modulePath);
  };

  const navLinks = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="9"></rect>
          <rect x="14" y="3" width="7" height="5"></rect>
          <rect x="14" y="12" width="7" height="9"></rect>
          <rect x="3" y="16" width="7" height="5"></rect>
        </svg>
      ),
    },
    {
      name: "Eficiência H/H",
      href: "/admin/dashboard/eficiencia",
      icon: <Award size={24} />,
    },
    {
      name: "Desperdício OEE",
      href: "/admin/engenharia/oee",
      icon: <Activity size={24} />,
    },
    {
      name: "OEE Ledger (Finanças)",
      href: "/admin/producao/financeiro",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Mobile Touch Header (Visível apenas em Mobile) */}
      <div className="md:hidden flex items-center justify-between bg-blue-900 text-white p-4 shadow-md shrink-0 sticky top-0 z-30">
        <div className="font-bold tracking-tight text-white flex items-center gap-2">
          <Layers className="text-white" size={24} /> Brunswick.pt
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-md hover:bg-blue-800 transition-colors"
        >
          {isOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Overlay Escurecimento */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* A Barra Lateral do M.E.S */}
      <aside
        className={`fixed md:relative top-0 left-0 w-64 bg-blue-900 text-white flex flex-col justify-between h-full overflow-y-auto nasa-scrollbar shadow-xl z-50 transform transition-transform duration-300 md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-6 flex flex-col flex-1 whitespace-nowrap">
          {/* O Logo é Oculto no Mobile Side (Porque já está no Mobile Header Supremo) */}
          <div className="hidden md:flex text-2xl font-bold tracking-tight text-white mb-8 px-2 items-center gap-2">
            <Layers className="text-white" /> Brunswick.pt
          </div>
          <div className="flex flex-col gap-1">
            {navLinks
              .filter((link) => hasAccess(link.href))
              .map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${isActive
                      ? "bg-blue-800 text-white shadow-sm border border-transparent"
                      : "text-blue-100 hover:bg-blue-800/50 hover:text-white"
                      }`}
                  >
                    <span
                      className={`${isActive ? "text-white" : "text-blue-300"} w-5 h-5 flex items-center justify-center`}
                    >
                      {link.icon}
                    </span>
                    <span className="text-sm">{link.name}</span>
                  </Link>
                );
              })}

            {(hasAccess("/admin/producao/ordens") ||
              hasAccess("/admin/producao/aps") ||
              hasAccess("/admin/producao/live")) && (
                <div className="mt-8">
                  <p className="px-3 text-[10px] font-extrabold text-blue-400 uppercase tracking-widest mb-2">
                    Planeamento
                  </p>
                  <nav className="flex flex-col gap-1 mb-6">
                    {hasAccess("/admin/producao/ordens") && (
                      <Link
                        onClick={() => setIsOpen(false)}
                        href="/admin/producao/ordens"
                        className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/producao/ordens") ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={
                            pathname.includes("/admin/producao/ordens")
                              ? "text-white"
                              : "text-blue-300"
                          }
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        <span className="text-sm border-transparent">
                          Ordens de Produção
                        </span>
                      </Link>
                    )}
                    {hasAccess("/admin/producao/aps") && (
                      <Link
                        onClick={() => setIsOpen(false)}
                        href="/admin/producao/aps"
                        className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/producao/aps") ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                      >
                        <CalendarDays
                          size={18}
                          className={
                            pathname.includes("/admin/producao/aps")
                              ? "text-white"
                              : "text-blue-300"
                          }
                        />
                        <span className="text-sm border-transparent">
                          Control Tower (APS)
                        </span>
                      </Link>
                    )}
                    {hasAccess("/admin/producao/live") && (
                      <Link
                        onClick={() => setIsOpen(false)}
                        href="/admin/producao/live"
                        className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/producao/live") ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                      >
                        <Box
                          size={18}
                          className={
                            pathname.includes("/admin/producao/live")
                              ? "text-white"
                              : "text-blue-300"
                          }
                        />
                        <span className="text-sm border-transparent">
                          Monitorização Live
                        </span>
                      </Link>
                    )}
                  </nav>
                </div>
              )}

            {(hasAccess("/operador") || hasAccess("/admin/producao/andon")) && (
              <>
                <p className="px-3 text-[10px] font-extrabold text-blue-400 uppercase tracking-widest mb-2">
                  Produção
                </p>
                <nav className="flex flex-col gap-1 mb-6">
                  <Link
                    onClick={() => setIsOpen(false)}
                    href="/operador"
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/operador") ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={
                        pathname.includes("/operador")
                          ? "text-white"
                          : "text-blue-300"
                      }
                    >
                      <rect
                        x="4"
                        y="4"
                        width="16"
                        height="16"
                        rx="2"
                        ry="2"
                      ></rect>
                      <rect x="9" y="9" width="6" height="6"></rect>
                      <line x1="9" y1="1" x2="9" y2="4"></line>
                      <line x1="15" y1="1" x2="15" y2="4"></line>
                      <line x1="9" y1="20" x2="9" y2="23"></line>
                      <line x1="15" y1="20" x2="15" y2="23"></line>
                      <line x1="20" y1="9" x2="23" y2="9"></line>
                      <line x1="20" y1="14" x2="23" y2="14"></line>
                      <line x1="1" y1="9" x2="4" y2="9"></line>
                      <line x1="1" y1="14" x2="4" y2="14"></line>
                    </svg>
                    <span className="text-sm border-transparent">
                      Terminal HMI (Operador)
                    </span>
                  </Link>
                  <Link
                    onClick={() => setIsOpen(false)}
                    href="/admin/producao/andon"
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/producao/andon") ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                  >
                    <AlertTriangle
                      size={18}
                      className={
                        pathname.includes("/admin/producao/andon")
                          ? "text-white"
                          : "text-blue-300"
                      }
                    />
                    <span className="text-sm border-transparent">
                      Saúde OEE do Andon
                    </span>
                  </Link>
                </nav>

                <p className="px-3 text-[10px] font-extrabold text-blue-400 uppercase tracking-widest mb-2">
                  Equipa e Talento
                </p>
                <nav className="flex flex-col gap-1 mb-6">
                  <Link
                    onClick={() => setIsOpen(false)}
                    href="/admin/rh/produtividade"
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname === "/admin/rh/produtividade" ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                  >
                    <Activity
                      size={18}
                      className={
                        pathname === "/admin/rh/produtividade"
                          ? "text-white"
                          : "text-blue-300"
                      }
                    />
                    <span className="text-sm border-transparent">
                      Feedback Produtividade
                    </span>
                  </Link>
                  <Link
                    onClick={() => setIsOpen(false)}
                    href="/admin/rh"
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname === "/admin/rh" || pathname.startsWith("/admin/rh/cadastro") ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                  >
                    <Settings
                      size={18}
                      className={
                        pathname === "/admin/rh" ||
                          pathname.startsWith("/admin/rh/cadastro")
                          ? "text-white"
                          : "text-blue-300"
                      }
                    />
                    <span className="text-sm border-transparent">
                      Gerir Operadores
                    </span>
                  </Link>
                  <Link
                    onClick={() => setIsOpen(false)}
                    href="/admin/rh/iluo"
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname === "/admin/rh/iluo" ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                  >
                    <Layers
                      size={18}
                      className={
                        pathname === "/admin/rh/iluo"
                          ? "text-white"
                          : "text-blue-300"
                      }
                    />
                    <span className="text-sm border-transparent">
                      Matriz ILUO (Skills)
                    </span>
                  </Link>
                  <Link
                    onClick={() => setIsOpen(false)}
                    href="/admin/rh/avaliacoes"
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname === "/admin/rh/avaliacoes" ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                  >
                    <CalendarDays
                      size={18}
                      className={
                        pathname === "/admin/rh/avaliacoes"
                          ? "text-white"
                          : "text-blue-300"
                      }
                    />
                    <span className="text-sm border-transparent">
                      Avaliações Diárias
                    </span>
                  </Link>
                  {hasAccess("/admin/rh/avaliacoes-lideranca") && (
                    <Link
                      onClick={() => setIsOpen(false)}
                      href="/admin/rh/avaliacoes-lideranca"
                      prefetch={true}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname === "/admin/rh/avaliacoes-lideranca" ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                    >
                      <Briefcase
                        size={18}
                        className={
                          pathname === "/admin/rh/avaliacoes-lideranca"
                            ? "text-white"
                            : "text-blue-300"
                        }
                      />
                      <span className="text-sm border-transparent">
                        Avaliações Liderança
                      </span>
                    </Link>
                  )}
                  {hasAccess("/admin/rh/avaliacoes-lideranca") && (
                     <Link
                      onClick={() => setIsOpen(false)}
                      href="/admin/rh/produtividade-lideranca"
                      className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname === "/admin/rh/produtividade-lideranca" ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                    >
                      <Activity
                        size={18}
                        className={
                          pathname === "/admin/rh/produtividade-lideranca"
                            ? "text-white"
                            : "text-blue-300"
                        }
                      />
                      <span className="text-sm border-transparent">
                        Feedback Liderança
                      </span>
                    </Link>
                  )}
                  <Link
                    onClick={() => setIsOpen(false)}
                    href="/admin/rh/assiduidade"
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/rh/assiduidade") ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                  >
                    <CalendarDays
                      size={18}
                      className={
                        pathname.includes("/admin/rh/assiduidade")
                          ? "text-white"
                          : "text-blue-300"
                      }
                    />
                    <span className="text-sm border-transparent">
                      Assiduidade Ativa
                    </span>
                  </Link>
                </nav>

                {/* MODULO 3: CLIMA E ACADEMIA */}
                <p className="px-3 text-[10px] font-extrabold text-blue-400 uppercase tracking-widest mb-2 mt-4">
                  Clima & Academia
                </p>
                <nav className="flex flex-col gap-1 mb-6">
                  
                  {hasAccess("/admin/rh/formacoes") && (
                    <Link
                      onClick={() => setIsOpen(false)}
                      href="/admin/rh/formacoes"
                      className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname === "/admin/rh/formacoes" ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                    >
                      <GraduationCap
                        size={18}
                        className={
                          pathname === "/admin/rh/formacoes"
                            ? "text-white"
                            : "text-blue-300"
                        }
                      />
                      <span className="text-sm border-transparent">
                        Academia Fabril
                      </span>
                    </Link>
                  )}

                  {hasAccess("/admin/rh/gestao-quizzes") && (
                    <Link
                      onClick={() => setIsOpen(false)}
                      href="/admin/rh/gestao-quizzes"
                      className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname === "/admin/rh/gestao-quizzes" ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                    >
                      <ListTodo
                        size={18}
                        className={
                          pathname === "/admin/rh/gestao-quizzes"
                            ? "text-white"
                            : "text-blue-300"
                        }
                      />
                      <span className="text-sm border-transparent">
                        Gestão de Quizzes (360)
                      </span>
                    </Link>
                  )}

                  {hasAccess("/operador/quiz") && (
                    <Link
                      onClick={() => setIsOpen(false)}
                      href="/operador/quiz"
                      target="_blank"
                      className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium text-blue-100 hover:bg-blue-800/50 hover:text-white`}
                    >
                      <Crosshair
                        size={18}
                        className="text-emerald-400"
                      />
                      <span className="text-sm border-transparent text-emerald-100">
                        Lançar Quiosque RH
                      </span>
                    </Link>
                  )}
                </nav>

                <p className="px-3 text-[10px] font-extrabold text-blue-400 uppercase tracking-widest mb-2">
                  Warehouse
                </p>
                <nav className="flex flex-col gap-1 mb-6">
                  <Link
                    onClick={() => setIsOpen(false)}
                    href="/logistica/picking"
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/logistica/picking") ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                  >
                    <Box
                      size={18}
                      className={
                        pathname.includes("/logistica/picking")
                          ? "text-white"
                          : "text-blue-300"
                      }
                    />
                    <span className="text-sm border-transparent">
                      Tablet Armazém (picking)
                    </span>
                  </Link>
                  <Link
                    onClick={() => setIsOpen(false)}
                    href="/admin/engenharia/genealogia"
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/engenharia/genealogia") ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                  >
                    <Layers
                      size={18}
                      className={
                        pathname.includes("/admin/engenharia/genealogia")
                          ? "text-white"
                          : "text-blue-300"
                      }
                    />
                    <span className="text-sm border-transparent">
                      Rastreabilidade B.O.M
                    </span>
                  </Link>
                </nav>

                {(hasAccess("/admin/modelos") ||
                  hasAccess("/admin/engenharia/regras") ||
                  hasAccess("/admin/engenharia/roteiros") ||
                  hasAccess("/admin/engenharia/moldes") ||
                  hasAccess("/admin/fabrica")) && (
                    <>
                      <p className="px-3 text-[10px] font-extrabold text-blue-400 uppercase tracking-widest mb-2">
                        Engenharia
                      </p>
                      <nav className="flex flex-col gap-1 mb-6">
                        {hasAccess("/admin/modelos") && (
                          <Link
                            onClick={() => setIsOpen(false)}
                            href="/admin/modelos"
                            className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/modelos") ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                          >
                            <Box
                              size={18}
                              className={
                                pathname.includes("/admin/modelos")
                                  ? "text-white"
                                  : "text-blue-300"
                              }
                            />
                            <span className="text-sm border-transparent">
                              Modelos & Produtos
                            </span>
                          </Link>
                        )}
                        {hasAccess("/admin/engenharia/regras") && (
                          <Link
                            onClick={() => setIsOpen(false)}
                            href="/admin/engenharia/regras"
                            className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/engenharia/regras") ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                          >
                            <GitBranch
                              size={18}
                              className={
                                pathname.includes("/admin/engenharia/regras")
                                  ? "text-white"
                                  : "text-blue-300"
                              }
                            />
                            <span className="text-sm border-transparent">
                              Regras Sequenciais
                            </span>
                          </Link>
                        )}
                        {hasAccess("/admin/engenharia/roteiros") && (
                          <Link
                            onClick={() => setIsOpen(false)}
                            href="/admin/engenharia/roteiros"
                            className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/engenharia/roteiros") ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                          >
                            <Layers
                              size={18}
                              className={
                                pathname.includes("/admin/engenharia/roteiros")
                                  ? "text-white"
                                  : "text-blue-300"
                              }
                            />
                            <span className="text-sm border-transparent">
                              Tempos Roteiro OEE
                            </span>
                          </Link>
                        )}
                        {hasAccess("/admin/engenharia/moldes") && (
                          <Link
                            onClick={() => setIsOpen(false)}
                            href="/admin/engenharia/moldes"
                            className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/engenharia/moldes") ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                          >
                            <Box
                              size={18}
                              className={
                                pathname.includes("/admin/engenharia/moldes")
                                  ? "text-white"
                                  : "text-blue-300"
                              }
                            />
                            <span className="text-sm border-transparent">
                              Cadastro de Moldes
                            </span>
                          </Link>
                        )}
                        {hasAccess("/admin/fabrica") && (
                          <Link
                            onClick={() => setIsOpen(false)}
                            href="/admin/fabrica"
                            className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/fabrica") ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                          >
                            <Settings
                              size={18}
                              className={
                                pathname.includes("/admin/fabrica")
                                  ? "text-white"
                                  : "text-blue-300"
                              }
                            />
                            <span className="text-sm border-transparent">
                              Fábrica & Estações
                            </span>
                          </Link>
                        )}
                      </nav>
                    </>
                  )}

                {hasAccess("/admin/manutencao/moldes") && (
                  <>
                    <p className="px-3 text-[10px] font-extrabold text-blue-400 uppercase tracking-widest mb-2">
                      Manutenção
                    </p>
                    <nav className="flex flex-col gap-1 mb-6">
                      <Link
                        onClick={() => setIsOpen(false)}
                        href="/admin/manutencao/moldes"
                        className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/manutencao/moldes") ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                      >
                        <Settings
                          size={18}
                          className={
                            pathname.includes("/admin/manutencao/moldes")
                              ? "text-white"
                              : "text-blue-300"
                          }
                        />
                        <span className="text-sm border-transparent">
                          Preventiva Moldes (TPM)
                        </span>
                      </Link>
                    </nav>
                  </>
                )}

                <p className="px-3 text-[10px] font-extrabold text-blue-400 uppercase tracking-widest mb-2">
                  Qualidade
                </p>
                <nav className="flex flex-col gap-1 mb-6">
                  <Link
                    onClick={() => setIsOpen(false)}
                    href="/admin/qualidade/rnc"
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname === "/admin/qualidade/rnc" || pathname.startsWith("/admin/qualidade/rnc/nova") ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                  >
                    <AlertTriangle
                      size={18}
                      className={
                        pathname === "/admin/qualidade/rnc" || pathname.startsWith("/admin/qualidade/rnc/nova")
                          ? "text-white"
                          : "text-blue-300"
                      }
                    />
                    <span className="text-sm border-transparent">
                      Lista (8D / A3)
                    </span>
                  </Link>
                  <Link
                    onClick={() => setIsOpen(false)}
                    href="/admin/qualidade/rnc/quadro"
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/qualidade/rnc/quadro") ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                  >
                    <ListTodo
                      size={18}
                      className={
                        pathname.includes("/admin/qualidade/rnc/quadro")
                          ? "text-white"
                          : "text-blue-300"
                      }
                    />
                    <span className="text-sm border-transparent">
                      Scrum Board (RNC)
                    </span>
                  </Link>
                  <Link
                    onClick={() => setIsOpen(false)}
                    href="/admin/qualidade/templates"
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/qualidade/templates") ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                  >
                    <Settings
                      size={18}
                      className={
                        pathname.includes("/admin/qualidade/templates")
                          ? "text-white"
                          : "text-blue-300"
                      }
                    />
                    <span className="text-sm border-transparent">
                      Checklists Qualidade
                    </span>
                  </Link>
                  <Link
                    onClick={() => setIsOpen(false)}
                    href="/admin/qualidade/qcis"
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/qualidade/qcis") ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                  >
                    <Activity
                      size={18}
                      className={
                        pathname.includes("/admin/qualidade/qcis")
                          ? "text-white"
                          : "text-blue-300"
                      }
                    />
                    <span className="text-sm border-transparent">
                      QCIS Analytics
                    </span>
                  </Link>
                </nav>

                <p className="px-3 text-[10px] font-extrabold text-[#f59e0b] uppercase tracking-widest mb-2">
                  Lean & Manufacture lean
                </p>
                <nav className="flex flex-col gap-1 mb-6">
                  <Link
                    onClick={() => setIsOpen(false)}
                    href="/admin/lean/kaizen"
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/lean/kaizen") ? "bg-amber-600 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                  >
                    <Lightbulb
                      size={18}
                      className={
                        pathname.includes("/admin/lean/kaizen")
                          ? "text-white"
                          : "text-amber-400"
                      }
                    />
                    <span className="text-sm border-transparent">
                      Ideias Kaizen
                    </span>
                  </Link>
                  <Link
                    onClick={() => setIsOpen(false)}
                    href="/admin/lean/gemba"
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/lean/gemba") ? "bg-amber-600 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                  >
                    <Footprints
                      size={18}
                      className={
                        pathname.includes("/admin/lean/gemba")
                          ? "text-white"
                          : "text-amber-400"
                      }
                    />
                    <span className="text-sm border-transparent">
                      Gemba Walking
                    </span>
                  </Link>
                  <Link
                    onClick={() => setIsOpen(false)}
                    href="/admin/lean/acoes"
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/lean/acoes") ? "bg-amber-600 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                  >
                    <ListTodo
                      size={18}
                      className={
                        pathname.includes("/admin/lean/acoes")
                          ? "text-white"
                          : "text-amber-400"
                      }
                    />
                    <span className="text-sm border-transparent">
                      Scrum Board (Ações)
                    </span>
                  </Link>
                </nav>

                <p className="px-3 text-[10px] font-extrabold text-[#f43f5e] uppercase tracking-widest mb-2">
                  Saúde, Seg e Ambiente
                </p>
                <nav className="flex flex-col gap-1 mb-6">
                  <Link
                    onClick={() => setIsOpen(false)}
                    href="/admin/hst/ocorrencias"
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/hst/ocorrencias") ? "bg-rose-600 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                  >
                    <Crosshair
                      size={18}
                      className={
                        pathname.includes("/admin/hst/ocorrencias")
                          ? "text-white"
                          : "text-rose-400"
                      }
                    />
                    <span className="text-sm border-transparent">
                      Registrar Ocorrência
                    </span>
                  </Link>
                  <Link
                    onClick={() => setIsOpen(false)}
                    href="/admin/hst/epis"
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/hst/epis") ? "bg-rose-600 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                  >
                    <ShieldCheck
                      size={18}
                      className={
                        pathname.includes("/admin/hst/epis")
                          ? "text-white"
                          : "text-rose-400"
                      }
                    />
                    <span className="text-sm border-transparent">
                      Matriz Ocupacional
                    </span>
                  </Link>
                  <Link
                    onClick={() => setIsOpen(false)}
                    href="/admin/hst/certificacoes"
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/hst/certificacoes") ? "bg-rose-600 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                  >
                    <Award
                      size={18}
                      className={
                        pathname.includes("/admin/hst/certificacoes")
                          ? "text-white"
                          : "text-rose-400"
                      }
                    />
                    <span className="text-sm border-transparent">
                      Certificações
                    </span>
                  </Link>
                  <Link
                    onClick={() => setIsOpen(false)}
                    href="/admin/hst/auditorias"
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/hst/auditorias") ? "bg-rose-600 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                  >
                    <ShieldCheck
                      size={18}
                      className={
                        pathname.includes("/admin/hst/auditorias")
                          ? "text-white"
                          : "text-rose-400"
                      }
                    />
                    <span className="text-sm border-transparent">
                      Auditorias Seg.
                    </span>
                  </Link>
                  <Link
                    onClick={() => setIsOpen(false)}
                    href="/admin/hst/dashboard"
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname === "/admin/hst/dashboard" ? "bg-rose-600 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                  >
                    <ShieldAlert
                      size={18}
                      className={
                        pathname === "/admin/hst/dashboard"
                          ? "text-white"
                          : "text-rose-400"
                      }
                    />
                    <span className="text-sm border-transparent">
                      Cruz de Segurança
                    </span>
                  </Link>
                  <Link
                    onClick={() => setIsOpen(false)}
                    href="/admin/hst/8d/historico"
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/hst/8d") ? "bg-rose-600 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                  >
                    <History
                      size={18}
                      className={
                        pathname.includes("/admin/hst/8d")
                          ? "text-white"
                          : "text-rose-400"
                      }
                    />
                    <span className="text-sm border-transparent">
                      Investigações 8D
                    </span>
                  </Link>
                  <Link
                    onClick={() => setIsOpen(false)}
                    href="/admin/hst/acoes"
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname === "/admin/hst/acoes" ? "bg-rose-600 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                  >
                    <ListTodo
                      size={18}
                      className={
                        pathname === "/admin/hst/acoes"
                          ? "text-white"
                          : "text-rose-400"
                      }
                    />
                    <span className="text-sm border-transparent">
                      Scrum Board (Ações)
                    </span>
                  </Link>
                </nav>
              </>
            )}

            {(hasAccess("/admin/producao/logs") ||
              hasAccess("/admin/diagnostico") ||
              hasAccess("/admin/configuracoes") ||
              hasAccess("/admin/configuracoes/tvs")) && (
                <>
                  <p className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 mt-6">
                    Sistema
                  </p>
                  <nav className="flex flex-col gap-1 mb-6">
                    {hasAccess("/admin/producao/logs") && (
                      <Link
                        onClick={() => setIsOpen(false)}
                        href="/admin/producao/logs"
                        className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/producao/logs") ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                      >
                        <History
                          size={18}
                          className={
                            pathname.includes("/admin/producao/logs")
                              ? "text-white"
                              : "text-slate-400"
                          }
                        />
                        <span className="text-sm border-transparent">
                          Auditoria Telemetria
                        </span>
                      </Link>
                    )}
                    {hasAccess("/admin/diagnostico") && (
                      <Link
                        onClick={() => setIsOpen(false)}
                        href="/admin/diagnostico"
                        className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/diagnostico") ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                      >
                        <Activity
                          size={18}
                          className={
                            pathname.includes("/admin/diagnostico")
                              ? "text-white"
                              : "text-slate-400"
                          }
                        />
                        <span className="text-sm border-transparent">
                          Central Dispositivos
                        </span>
                      </Link>
                    )}
                    {hasAccess("/admin/configuracoes") && (
                      <Link
                        onClick={() => setIsOpen(false)}
                        href="/admin/configuracoes"
                        className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/configuracoes") ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                      >
                        <Settings
                          size={18}
                          className={
                            pathname.includes("/admin/configuracoes")
                              ? "text-white"
                              : "text-slate-400"
                          }
                        />
                        <span className="text-sm border-transparent">
                          Configurações Globais
                        </span>
                      </Link>
                    )}
                    {hasAccess("/admin/configuracoes/notificacoes") && (
                      <Link
                        onClick={() => setIsOpen(false)}
                        href="/admin/configuracoes/notificacoes"
                        className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/configuracoes/notificacoes") ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                      >
                        <Settings
                          size={18}
                          className={
                            pathname.includes("/admin/configuracoes/notificacoes")
                              ? "text-white"
                              : "text-slate-400"
                          }
                        />
                        <span className="text-sm border-transparent">
                          Motor Notificações
                        </span>
                      </Link>
                    )}
                    {hasAccess("/admin/qa") && (
                      <Link
                        onClick={() => setIsOpen(false)}
                        href="/admin/qa"
                        className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/qa") ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                      >
                        <FlaskConical
                          size={18}
                          className={
                            pathname.includes("/admin/qa")
                              ? "text-white"
                              : "text-slate-400"
                          }
                        />
                        <span className="text-sm border-transparent">
                          Laboratório QA (Auto-Tester)
                        </span>
                      </Link>
                    )}
                    {hasAccess("/admin/configuracoes/tvs") && (
                      <Link
                        onClick={() => setIsOpen(false)}
                        href="/admin/configuracoes/tvs"
                        className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/configuracoes/tvs") ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                      >
                        <Monitor
                          size={18}
                          className={
                            pathname.includes("/admin/configuracoes/tvs")
                              ? "text-white"
                              : "text-slate-400"
                          }
                        />
                        <span className="text-sm border-transparent">
                          Hardware & Displays
                        </span>
                      </Link>
                    )}
                    {hasAccess("/admin/sistema/manual") && (
                      <Link
                        onClick={() => setIsOpen(false)}
                        href="/admin/sistema/manual"
                        className={`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium ${pathname.includes("/admin/sistema/manual") ? "bg-blue-800 text-white shadow-sm border border-transparent" : "text-blue-100 hover:bg-blue-800/50 hover:text-white"}`}
                      >
                        <Settings
                          size={18}
                          className={
                            pathname.includes("/admin/sistema/manual")
                              ? "text-white"
                              : "text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.3)]"
                          }
                        />
                        <span className="text-sm border-transparent text-amber-200">
                          Manual da Plataforma
                        </span>
                      </Link>
                    )}
                  </nav>
                </>
              )}
          </div>
        </div>

        {/* Bottom Section - User Profile / Auth */}
        <div className="p-4 border-t border-[rgba(255,255,255,0.05)] bg-[rgba(15,23,42,0.6)] mt-auto flex flex-col gap-2">
          {hasAccess("/admin/sistema/manual") && (
              <Link href="/admin/sistema/manual" className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-amber-300/80 hover:text-amber-200 hover:bg-amber-900/30 rounded-md transition-colors border border-[rgba(251,191,36,0.1)] mb-1 shadow-sm">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                 Guia de Utilizador Interativo
              </Link>
          )}

          <Link href="/admin/perfil" className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-blue-800/50 rounded-lg transition-colors border border-transparent hover:border-[rgba(255,255,255,0.1)] w-full">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm shrink-0">
              {userEmail?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-white truncate">
                {userEmail}
              </span>
              <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider mt-0.5">
                {nivelPermissao || "Utilizador"}
              </span>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
