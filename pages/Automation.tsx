import React, { useState } from 'react';
import { AutomationRule } from '../types';
import { useUI } from '../hooks/useUI';

const Automation = () => {
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: '1',
      icon: 'chat',
      colorClass: 'blue',
      title: 'Resposta Automática',
      description:
        'Responde instantaneamente a novas mensagens fora do horário comercial com uma saudação predefinida.',
      active: true,
    },
    {
      id: '2',
      icon: 'waving_hand',
      colorClass: 'amber',
      title: 'Boas-vindas',
      description:
        'Envia uma mensagem de boas-vindas com o menu principal para novos leads que entram em contato pela primeira vez.',
      active: true,
    },
    {
      id: '3',
      icon: 'shopping_cart_checkout',
      colorClass: 'purple',
      title: 'Lembrete de Carrinho',
      description:
        'Dispara um lembrete automático após 1 hora de inatividade no checkout com um cupom de 5% de desconto.',
      active: true,
    },
    {
      id: '4',
      icon: 'history',
      colorClass: 'slate',
      title: 'Recuperação de Inativos',
      description:
        'Envia uma mensagem de reengajamento para clientes que não interagem há mais de 30 dias.',
      active: false,
    },
    {
      id: '5',
      icon: 'event_available',
      colorClass: 'rose',
      title: 'Confirmação de Agendamento',
      description:
        'Solicita confirmação 24h antes de uma reunião ou consulta agendada via integração de calendário.',
      active: false,
    },
  ]);

  const toggleRule = (id: string) => {
    setRules(
      rules.map((rule) =>
        rule.id === id ? { ...rule, active: !rule.active } : rule
      )
    );
  };

  const getColorClasses = (color: string, active: boolean) => {
    // Simplification for standard colors found in mockup
    if (color === 'blue') return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
    if (color === 'amber') return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400';
    if (color === 'purple') return 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
    if (color === 'rose') return 'bg-rose-50 text-rose-500 dark:bg-rose-900/20 dark:text-rose-400';
    return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group ${!rule.active ? 'opacity-75 hover:opacity-100' : ''
              }`}
          >
            {/* Border highlight for active */}
            {rule.active && (
              <div className="absolute inset-0 border border-primary/30 dark:border-primary/20 pointer-events-none rounded-xl"></div>
            )}

            <div className="absolute top-0 right-0 p-6">
              <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input
                  type="checkbox"
                  name={`toggle-${rule.id}`}
                  id={`toggle-${rule.id}`}
                  className={`toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-300 ${rule.active ? 'right-0 border-primary' : 'border-slate-300'}`}
                  checked={rule.active}
                  onChange={() => toggleRule(rule.id)}
                />
                <label
                  htmlFor={`toggle-${rule.id}`}
                  className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${rule.active ? 'bg-primary' : 'bg-slate-300'}`}
                ></label>
              </div>
            </div>

            <div className="flex items-start gap-4 mb-4">
              <div
                className={`p-3 rounded-xl ${getColorClasses(
                  rule.colorClass,
                  rule.active
                )}`}
              >
                <span className="material-symbols-outlined text-2xl">
                  {rule.icon}
                </span>
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {rule.title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              {rule.description}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              {rule.active ? (
                <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md">
                  <span className="size-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>{' '}
                  Ativo
                </span>
              ) : (
                <span className="flex items-center text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                  Inativo
                </span>
              )}

              <button className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors flex items-center gap-1">
                Editar{' '}
                <span className="material-symbols-outlined text-[16px]">
                  edit
                </span>
              </button>
            </div>
          </div>
        ))}

        {/* Create New Card */}
        <button className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary hover:bg-slate-50 dark:hover:bg-surface-dark/50 transition-all group h-full min-h-[280px]">
          <div className="size-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-3xl group-hover:text-primary">
              add
            </span>
          </div>
          <span className="font-bold text-slate-600 dark:text-slate-300 text-lg group-hover:text-primary transition-colors">
            Criar Nova Regra
          </span>
          <span className="text-sm text-slate-400 text-center mt-2 max-w-[200px]">
            Configure gatilhos personalizados para suas necessidades
          </span>
        </button>
      </div>
    </div>
  );
};

export default Automation;