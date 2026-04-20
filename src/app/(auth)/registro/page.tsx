"use client";

import Link from "next/link";
import { User, Users, Briefcase, CalendarClock, Lock } from "lucide-react";
import { useState } from "react";

export default function RegisterPage() {
  const [role, setRole] = useState<"padre" | "paciente" | "especialista">("padre");

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#111822]">
      {/* Left Sidebar */}
      <div className="hidden w-1/3 bg-[#136dec] text-white p-12 lg:flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#136dec]">
              {/* Logo placeholder */}
              <div className="font-bold">M</div>
            </div>
            <span className="text-xl font-bold">MentaLabs</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-8">
            Tu camino hacia el bienestar comienza aquí.
          </h1>
          <p className="text-blue-100 mb-12">
            Únete a nuestra comunidad y accede a herramientas diseñadas para tu salud mental y la de tu familia.
          </p>
          
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Diagnóstico Experto</h3>
                <p className="text-sm text-blue-200">Evaluaciones precisas por profesionales certificados.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Apoyo Familiar</h3>
                <p className="text-sm text-blue-200">Recursos para todo el núcleo familiar.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Planes Personalizados</h3>
                <p className="text-sm text-blue-200">Estrategias adaptadas a tus necesidades.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="text-sm text-blue-200">
          © 2024 MentaLabs. Todos los derechos reservados.
        </div>
      </div>

      {/* Right Form Area */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24">
        <div className="w-full max-w-lg mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm font-semibold mb-2">
              <span className="text-[#136dec]">PASO 1 DE 4</span>
              <span className="text-slate-400">25% Completado</span>
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#0bda5e] w-1/4"></div>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Bienvenido a MentaLabs</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">Para comenzar, dinos quién eres para personalizar tu experiencia.</p>

          {/* Role Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-4">Yo soy...</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button 
                onClick={() => setRole("padre")}
                className={`p-4 border rounded-xl flex flex-col items-center gap-3 transition-colors ${role === 'padre' ? 'border-[#136dec] bg-blue-50 dark:bg-[#136dec]/10 text-[#136dec]' : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                <Users className="h-6 w-6" />
                <span className="font-medium text-sm">Padre/Madre</span>
              </button>
              <button 
                onClick={() => setRole("paciente")}
                className={`p-4 border rounded-xl flex flex-col items-center gap-3 transition-colors ${role === 'paciente' ? 'border-[#136dec] bg-blue-50 dark:bg-[#136dec]/10 text-[#136dec]' : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                <User className="h-6 w-6" />
                <span className="font-medium text-sm">Paciente Adulto</span>
              </button>
              <button 
                onClick={() => setRole("especialista")}
                className={`p-4 border rounded-xl flex flex-col items-center gap-3 transition-colors ${role === 'especialista' ? 'border-[#136dec] bg-blue-50 dark:bg-[#136dec]/10 text-[#136dec]' : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                <Briefcase className="h-6 w-6" />
                <span className="font-medium text-sm">Especialista</span>
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <form className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Información Personal</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
                <input type="text" placeholder="Ej. Juan" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2432] p-3 text-sm focus:border-[#136dec] focus:ring-[#136dec]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Apellido</label>
                <input type="text" placeholder="Ej. Pérez" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2432] p-3 text-sm focus:border-[#136dec] focus:ring-[#136dec]" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
              <input type="email" placeholder="nombre@ejemplo.com" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2432] p-3 text-sm focus:border-[#136dec] focus:ring-[#136dec]" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="password" placeholder="Mínimo 8 caracteres" className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2432] py-3 pl-10 pr-3 text-sm focus:border-[#136dec] focus:ring-[#136dec]" />
              </div>
            </div>

            <div className="flex items-start gap-3 pt-4">
              <input type="checkbox" id="terms" className="mt-1 h-4 w-4 rounded border-slate-300 text-[#136dec] focus:ring-[#136dec]" />
              <label htmlFor="terms" className="text-sm text-slate-600 dark:text-slate-400">
                Acepto los <Link href="#" className="font-semibold text-[#136dec]">Términos de Servicio</Link> y la <Link href="#" className="font-semibold text-[#136dec]">Política de Privacidad</Link> de MentaLabs.
              </label>
            </div>

            <div className="flex gap-4 pt-6">
                <Link href="/" className="flex-1 flex justify-center items-center text-center py-3 rounded-lg font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Atrás
                </Link>
                <Link href="/dashboard" className="flex-[2] flex justify-center items-center py-3 rounded-lg font-semibold bg-[#136dec] text-white hover:bg-blue-600 transition-colors shadow-md shadow-[#136dec]/20">
                  Crear Cuenta
                </Link>
            </div>
            
            <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
              ¿Ya tienes una cuenta? <Link href="/login" className="font-semibold text-[#136dec]">Inicia sesión</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}