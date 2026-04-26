"use client";

import Link from "next/link";
import { User, Users, Briefcase, CalendarClock, Lock, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../utils/supabase/client";
import { createUserProfile } from "../../../../actions/auth";

const roleMap = {
  padre:        { dbRole: "tutor",        route: "/tutor" },
  paciente:     { dbRole: "paciente",     route: "/paciente" },
  especialista: { dbRole: "especialista", route: "/especialista" },
} as const;

export default function RegisterPage() {
  const [role, setRole] = useState<"padre" | "paciente" | "especialista">("padre");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!terms) {
      setError("Debes aceptar los Términos de Servicio para continuar.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

      if (signUpError) throw signUpError;

      const user = data.user;
      if (!user) throw new Error("No se pudo crear la cuenta.");

      const { dbRole, route } = roleMap[role];

      await createUserProfile(
        user.id,
        email,
        `${nombre} ${apellido}`.trim(),
        dbRole
      );

      if (data.session) {
        router.push(route);
      } else {
        setSuccessMsg("Cuenta creada. Revisa tu correo para confirmar y luego inicia sesión.");
      }
    } catch (err: any) {
      const knownErrors: Record<string, string> = {
        "User already registered": "Este correo ya está registrado.",
        "Password should be at least 6 characters.": "La contraseña debe tener al menos 6 caracteres.",
        "email rate limit exceeded": "Demasiados intentos. Espera unos minutos.",
      };
      setError(knownErrors[err.message] ?? `Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

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
          <form onSubmit={handleRegister} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm font-medium border border-red-100 dark:border-red-900/50">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            {successMsg && (
              <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-xl flex items-center gap-3 text-sm font-medium border border-green-100 dark:border-green-900/50">
                <p>{successMsg}</p>
              </div>
            )}
            <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Información Personal</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Juan" required className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2432] p-3 text-sm focus:border-[#136dec] focus:ring-[#136dec]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Apellido</label>
                <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} placeholder="Ej. Pérez" required className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2432] p-3 text-sm focus:border-[#136dec] focus:ring-[#136dec]" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@ejemplo.com" required className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2432] p-3 text-sm focus:border-[#136dec] focus:ring-[#136dec]" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a2432] py-3 pl-10 pr-3 text-sm focus:border-[#136dec] focus:ring-[#136dec]" />
              </div>
            </div>

            <div className="flex items-start gap-3 pt-4">
              <input type="checkbox" id="terms" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-[#136dec] focus:ring-[#136dec]" />
              <label htmlFor="terms" className="text-sm text-slate-600 dark:text-slate-400">
                Acepto los <Link href="#" className="font-semibold text-[#136dec]">Términos de Servicio</Link> y la <Link href="#" className="font-semibold text-[#136dec]">Política de Privacidad</Link> de MentaLabs.
              </label>
            </div>

            <div className="flex gap-4 pt-6">
                <Link href="/" className="flex-1 flex justify-center items-center text-center py-3 rounded-lg font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Atrás
                </Link>
                <button type="submit" disabled={isLoading} className="flex-[2] flex justify-center items-center py-3 rounded-lg font-semibold bg-[#136dec] text-white hover:bg-blue-600 transition-colors shadow-md shadow-[#136dec]/20 disabled:opacity-70 disabled:cursor-not-allowed">
                  {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
                </button>
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