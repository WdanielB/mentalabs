"use client";

import Link from "next/link";
import { Brain, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../utils/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        // Obtenemos el perfil para redirigir según el rol
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
        
        const roleRoutes: Record<string, string> = {
          paciente:    "/paciente",
          especialista: "/especialista",
          tutor:       "/tutor",
          admin:       "/admin",
        };
        router.push(roleRoutes[profile?.role ?? ""] ?? "/login");
      }
    } catch (err: any) {
      setError(err.message === "Invalid login credentials" ? "Correo o contraseña incorrectos" : "Ocurrió un error al iniciar sesión.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#111822] flex flex-col md:flex-row font-sans">
      
      {/* Left Side - Brand & Presentation */}
      <div className="hidden md:flex md:w-1/2 lg:w-5/12 bg-gradient-to-br from-[#136dec] to-[#0a4b9c] text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-[#0bda5e]/20 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="bg-white p-2 rounded-xl group-hover:scale-105 transition-transform">
              <Brain className="h-6 w-6 text-[#136dec]" />
            </div>
            <span className="text-2xl font-black tracking-tight">Menta<span className="text-[#0bda5e]">Labs</span></span>
          </Link>
          
          <div className="mt-24 space-y-6">
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight">
              Bienvenido<br />de nuevo
            </h1>
            <p className="text-blue-100 text-lg max-w-md">
              Accede a tu panel de control clínico, gestiona expedientes y evalúa a tus pacientes con herramientas neurocognitivas.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-[#136dec] bg-slate-300"></div>
              <div className="w-10 h-10 rounded-full border-2 border-[#136dec] bg-slate-400"></div>
              <div className="w-10 h-10 rounded-full border-2 border-[#136dec] flex items-center justify-center bg-white text-[#136dec] text-xs font-bold">+1k</div>
            </div>
            <p className="text-sm font-medium text-blue-100">
              Especialistas están gestionando su clínica con nosotros.
            </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 relative">
        <div className="w-full max-w-md space-y-8">
          
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center gap-2 justify-center mb-8">
            <div className="bg-[#136dec] p-2 rounded-xl">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Menta<span className="text-[#0bda5e]">Labs</span>
            </span>
          </div>

          <div className="text-center md:text-left">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">Iniciar Sesión</h2>
            <p className="text-slate-500 mt-2">Ingresa tus credenciales para continuar</p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm font-medium border border-red-100 dark:border-red-900/50">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@clinica.com" 
                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-[#1a2432] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#136dec] focus:border-transparent outline-none transition-all text-slate-900 dark:text-white font-medium placeholder:font-normal placeholder:text-slate-400 shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between mb-1 ml-1 mr-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Contraseña</label>
                  <Link href="#" className="text-xs font-bold text-[#136dec] hover:text-blue-700 transition-colors">¿Olvidaste tu contraseña?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-[#1a2432] border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-[#136dec] focus:border-transparent outline-none transition-all text-slate-900 dark:text-white font-medium placeholder:font-normal placeholder:text-slate-400 shadow-sm"
                    required
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3.5 mt-2 flex justify-center items-center gap-2 rounded-xl font-bold bg-[#136dec] text-white hover:bg-blue-600 transition-all shadow-lg shadow-[#136dec]/20 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isLoading ? "Iniciando sesión..." : (
                <>Ingresar al Panel <ArrowRight className="h-5 w-5" /></>
              )}
            </button>

            <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              ¿No tienes una cuenta aún? <Link href="/registro" className="font-bold text-[#136dec]">Regístrate aquí</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}