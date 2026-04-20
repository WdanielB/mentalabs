"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Flag,
  Brain,
  AlertCircle
} from "lucide-react";

export default function ExamenClasificacionPage() {
  const [currentStep, setCurrentStep] = useState(3);
  const totalSteps = 12;
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#111822] text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Progress Bar & Header */}
      <header className="bg-white dark:bg-[#1a2432] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        {/* Actual Progress logic */}
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800">
          <div 
            className="h-full bg-gradient-to-r from-[#0bda5e] to-[#136dec] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-bold text-sm md:text-base">Módulo A: Atención y Concentración</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Escala de Evaluación TDAH Adultos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Clock className="h-4 w-4" />
              <span>14:22 min</span>
            </div>
            <div className="font-bold text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
              Pregunta {currentStep} de {totalSteps}
            </div>
          </div>
        </div>
      </header>

      {/* Main Questionnaire Area */}
      <main className="flex-1 flex items-center justify-center p-6 pb-24">
        <div className="w-full max-w-3xl">
          
          {/* Question Card */}
          <div className="bg-white dark:bg-[#1a2432] rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 md:p-12 relative overflow-hidden transition-all">
            {/* Visual flair */}
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Brain className="h-32 w-32 text-[#136dec]" />
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-[#136dec] text-xs font-bold uppercase tracking-wider mb-6">
                <AlertCircle className="h-3.5 w-3.5" />
                Situación Específica
              </div>

              <h2 className="text-2xl md:text-4xl font-black leading-tight mb-8">
                ¿Con qué frecuencia tienes dificultad para mantener la atención cuando realizas un trabajo aburrido o repetitivo?
              </h2>

              {/* Options */}
              <div className="space-y-3 mt-8">
                <label className="group flex items-center justify-between p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-[#136dec] dark:hover:border-[#136dec] cursor-pointer transition-all bg-white dark:bg-[#1a2432]">
                  <div className="flex items-center gap-4">
                    <div className="h-6 w-6 rounded-full border-2 border-slate-300 dark:border-slate-600 group-hover:border-[#136dec]"></div>
                    <span className="font-semibold text-lg">Nunca o Rara Vez</span>
                  </div>
                </label>

                <label className="group flex items-center justify-between p-5 rounded-2xl border-2 border-[#136dec] bg-blue-50/50 dark:bg-[#136dec]/10 cursor-pointer transition-all">
                  <div className="flex items-center gap-4">
                    <div className="h-6 w-6 rounded-full border-4 border-[#136dec] bg-white dark:bg-[#1a2432]"></div>
                    <span className="font-semibold text-lg text-[#136dec]">A veces</span>
                  </div>
                </label>

                <label className="group flex items-center justify-between p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-[#136dec] dark:hover:border-[#136dec] cursor-pointer transition-all bg-white dark:bg-[#1a2432]">
                  <div className="flex items-center gap-4">
                    <div className="h-6 w-6 rounded-full border-2 border-slate-300 dark:border-slate-600 group-hover:border-[#136dec]"></div>
                    <span className="font-semibold text-lg">A menudo</span>
                  </div>
                </label>

                <label className="group flex items-center justify-between p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-[#136dec] dark:hover:border-[#136dec] cursor-pointer transition-all bg-white dark:bg-[#1a2432]">
                  <div className="flex items-center gap-4">
                    <div className="h-6 w-6 rounded-full border-2 border-slate-300 dark:border-slate-600 group-hover:border-[#136dec]"></div>
                    <span className="font-semibold text-lg">Casi siempre</span>
                  </div>
                </label>
              </div>

            </div>
          </div>

          <div className="flex items-center justify-between mt-8 px-2">
            <button className="flex items-center gap-2 text-slate-500 font-semibold hover:text-slate-900 dark:hover:text-white transition-colors">
              <Flag className="h-4 w-4" /> Marcar para revisar después
            </button>
          </div>

        </div>
      </main>

      {/* Floating Action Footer */}
      <footer className="fixed bottom-0 w-full bg-white/80 dark:bg-[#111822]/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Anterior
          </button>
          
          <button 
            onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
            className="flex items-center gap-2 px-8 py-3 bg-[#136dec] text-white rounded-xl font-bold shadow-lg shadow-[#136dec]/20 hover:bg-blue-600 transition-transform hover:scale-105 active:scale-95"
          >
            Siguiente <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </footer>
    </div>
  );
}