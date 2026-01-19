import React from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background-light dark:bg-background-dark">
      <div className="absolute inset-0 opacity-40 pointer-events-none z-0">
        <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              height="40"
              id="grid-pattern"
              patternUnits="userSpaceOnUse"
              width="40"
            >
              <path
                d="M0 40L40 0H20L0 20M40 40V20L20 40"
                fill="none"
                opacity="0.1"
                stroke="#64748b"
                strokeWidth="1"
              ></path>
            </pattern>
          </defs>
          <rect fill="url(#grid-pattern)" height="100%" width="100%"></rect>
        </svg>
      </div>
      <div className="w-full max-w-md px-6 z-10">
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-8 sm:p-10">
          <div className="flex flex-col items-center mb-8">
            <img
              src="/public/logo.jpg"
              alt="Inove AI Zap"
              className="w-[150px] h-auto rounded-2xl shadow-lg object-contain"
            />
          </div>
          <form className="flex flex-col gap-5" onSubmit={handleLogin}>
            <div>
              <label
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                htmlFor="email"
              >
                E-mail
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">
                  mail
                </span>
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-400"
                  id="email"
                  placeholder="seu@email.com"
                  required
                  type="email"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
                  htmlFor="password"
                >
                  Senha
                </label>
                <a
                  className="text-xs font-bold text-primary hover:text-primary-dark transition-colors"
                  href="#"
                >
                  Esqueci minha senha
                </a>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">
                  lock
                </span>
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-400"
                  id="password"
                  placeholder="••••••••"
                  required
                  type="password"
                />
              </div>
            </div>
            <button
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-[#1DA851] text-white font-bold py-3 rounded-lg transition-all shadow-md hover:shadow-lg transform active:scale-[0.98] mt-2"
              type="submit"
            >
              Entrar
            </button>
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white dark:bg-surface-dark text-slate-500 font-medium">
                Ou continue com
              </span>
            </div>
          </div>
          <button
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2.5 rounded-lg transition-colors"
            type="button"
            onClick={handleLogin}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              ></path>
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              ></path>
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              ></path>
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              ></path>
            </svg>
            Entrar com Google
          </button>
        </div>
        <p className="mt-8 text-center text-xs font-medium text-slate-400 dark:text-slate-500">
          © 2024 Inove-AI Inc.{' '}
          <a className="hover:underline hover:text-primary transition-colors" href="#">
            Termos
          </a>{' '}
          •{' '}
          <a className="hover:underline hover:text-primary transition-colors" href="#">
            Privacidade
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;