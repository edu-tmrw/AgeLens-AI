import React from 'react';
import { ArrowRight, Sparkles, Shield, Zap, Clock, User, Star } from 'lucide-react';
import { Button } from './Button';
import { ViewState } from '../types';

interface LandingPageProps {
  onNavigate: (view: ViewState) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col w-full bg-white text-slate-900 font-sans">
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-white to-white z-0"></div>
        
        <div className="container mx-auto px-4 relative z-10 text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="w-4 h-4" />
            <span>IA de Nova Geração</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            Encontre sua versão <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">do futuro hoje.</span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Utilize o poder da inteligência artificial NanoBanana para simular o envelhecimento com realismo impressionante. Uma jornada no tempo em segundos.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <Button 
              onClick={() => onNavigate('register')}
              className="px-8 py-4 text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/30 w-full sm:w-auto"
            >
              Experimentar Agora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-sm text-slate-500 mt-4 sm:mt-0">
              Não é necessário cartão de crédito.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Por que usar o AgeLens AI?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Nossa tecnologia vai além de simples filtros. Criamos uma reconstrução biológica baseada nos seus traços únicos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Processamento Instantâneo</h3>
              <p className="text-slate-600 leading-relaxed">
                Nossos modelos Gemini Flash processam sua imagem em segundos, entregando resultados de alta resolução sem espera.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Privacidade em Primeiro Lugar</h3>
              <p className="text-slate-600 leading-relaxed">
                Suas fotos são suas. Utilizamos armazenamento seguro e criptografado. Você tem controle total para excluir seus dados.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Preservação de Identidade</h3>
              <p className="text-slate-600 leading-relaxed">
                Diferente de apps comuns, o AgeLens mantém a essência do seu rosto, aplicando o envelhecimento de forma anatômica e natural.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-100">
            <div>
              <div className="text-4xl font-bold text-indigo-600 mb-2">+50k</div>
              <div className="text-slate-500 font-medium">Fotos Geradas</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600 mb-2">98%</div>
              <div className="text-slate-500 font-medium">Precisão Anatômica</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600 mb-2">3</div>
              <div className="text-slate-500 font-medium">Estilos Exclusivos</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600 mb-2">4.9/5</div>
              <div className="text-slate-500 font-medium">Avaliação dos Usuários</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
         {/* Decorative background elements */}
         <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

         <div className="container mx-auto px-4 text-center relative z-10">
           <h2 className="text-4xl md:text-5xl font-bold mb-6">Pronto para viajar no tempo?</h2>
           <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
             Junte-se a milhares de usuários que já descobriram suas versões do futuro. É rápido, fácil e surpreendente.
           </p>
           <Button 
              onClick={() => onNavigate('register')}
              className="px-10 py-5 text-lg bg-white text-indigo-900 hover:bg-slate-100 shadow-xl shadow-white/10 font-bold"
            >
              Criar Minha Conta Grátis
           </Button>
           <p className="mt-6 text-sm text-slate-400 flex items-center justify-center gap-2">
             <Clock className="w-4 h-4" />
             Leva menos de 1 minuto
           </p>
         </div>
      </section>
    </div>
  );
};