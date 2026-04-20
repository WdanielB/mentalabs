import Link from "next/link";
import { ArrowRight, Check, Activity, Brain, Bolt, Search, Pill, Shield, MessageSquare, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="bg-white dark:bg-[#111822] font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-[#0bda5e] selection:text-white">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-slate-100 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-[#111822]/90">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0bda5e] text-white">
              <Brain className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">MentaLabs</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link className="text-sm font-medium text-slate-600 hover:text-[#136dec] dark:text-slate-300 dark:hover:text-[#0bda5e] transition-colors" href="#solutions">Soluciones</Link>
            <Link className="text-sm font-medium text-slate-600 hover:text-[#136dec] dark:text-slate-300 dark:hover:text-[#0bda5e] transition-colors" href="#how-it-works">Cómo Funciona</Link>
            <Link className="text-sm font-medium text-slate-600 hover:text-[#136dec] dark:text-slate-300 dark:hover:text-[#0bda5e] transition-colors" href="#studio">Studio No-Code</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link className="hidden sm:inline-flex text-sm font-semibold text-slate-900 dark:text-white hover:text-[#136dec] transition-colors" href="/login">Login</Link>
            <Link className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100" href="/registro">
              Registrarse
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#e0fbf0] via-transparent to-transparent dark:from-[#0bda5e]/10"></div>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#0bda5e]/10 px-3 py-1 text-sm font-medium text-[#0bda5e] ring-1 ring-inset ring-[#0bda5e]/20 mb-6">
                <span className="flex h-2 w-2 rounded-full bg-[#0bda5e]"></span>
                Nueva tecnología de diagnóstico
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl dark:text-white mb-6">
                Aceleramos diagnósticos, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0bda5e] to-[#136dec]">transformamos vidas</span>
              </h1>
              <p className="text-lg leading-8 text-slate-600 dark:text-slate-300 mb-8">
                La plataforma completa para diagnóstico y tratamiento de neurodivergencias. Conectamos familias con especialistas mediante herramientas avanzadas y tecnología no-code.
              </p>
              <div className="flex items-center gap-4">
                <Link className="rounded-full bg-[#136dec] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#136dec]/30 transition-all hover:bg-blue-600" href="/registro">
                  Agendar Consulta
                </Link>
                <Link className="text-base font-semibold leading-6 text-slate-900 dark:text-white flex items-center gap-1 group" href="/marketplace">
                  Para Especialistas <ArrowRight className="transition-transform group-hover:translate-x-1 h-5 w-5 ml-1" />
                </Link>
              </div>
            </div>
            
            {/* Right Side UI Graphic */}
            <div className="relative lg:ml-auto">
              <div className="relative rounded-2xl bg-white/50 p-2 ring-1 ring-slate-900/10 backdrop-blur-xl dark:bg-white/5 dark:ring-white/10 lg:w-[32rem]">
                <div className="rounded-xl bg-white shadow-2xl dark:bg-[#111822] overflow-hidden border border-slate-100 dark:border-slate-800">
                  <div className="border-b border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-[#1a2432] flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-400"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                      <div className="h-3 w-3 rounded-full bg-green-400"></div>
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700 mb-2"></div>
                        <div className="h-2 w-20 rounded bg-slate-100 dark:bg-slate-800"></div>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-[#0bda5e]/20 text-[#0bda5e] flex items-center justify-center">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                    {/* Mock Graph */}
                    <div className="h-24 flex items-end justify-between gap-1 mt-4">
                      <div className="w-full bg-[#0bda5e]/20 rounded-t h-[40%]"></div>
                      <div className="w-full bg-[#0bda5e]/40 rounded-t h-[60%]"></div>
                      <div className="w-full bg-[#0bda5e]/30 rounded-t h-[50%]"></div>
                      <div className="w-full bg-[#0bda5e]/60 rounded-t h-[80%]"></div>
                      <div className="w-full bg-[#0bda5e] rounded-t h-[95%]"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-12 -right-12 -z-10 h-[300px] w-[300px] bg-gradient-to-tr from-[#0bda5e] to-[#136dec] opacity-20 blur-3xl rounded-full"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
