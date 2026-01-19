import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';

interface SpintaxGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (text: string) => void;
    baseText?: string;
}

export const SpintaxGeneratorModal: React.FC<SpintaxGeneratorModalProps> = ({
    isOpen,
    onClose,
    onInsert,
    baseText = ''
}) => {
    const [prompt, setPrompt] = useState(baseText);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedResult, setGeneratedResult] = useState<string | null>(null);

    // Mock de geração por IA
    const generateVariations = async () => {
        if (!prompt) return;

        setIsGenerating(true);

        // Simula delay de API
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Lógica Mockada de IA: Identifica saudações e frases comuns para criar variações
        let result = prompt;

        // Variações simples de saudação se detectar começo de frase
        const greetings = ['Olá', 'Oi', 'Fala', 'Tudo bem'];
        const offers = ['super oferta', 'promoção incrível', 'oportunidade única', 'desconto especial'];
        const ctas = ['Confira agora', 'Acesse o link', 'Clique abaixo', 'Veja detalhes'];

        // Simulação básica de substituição (em produção seria o Gemini)
        if (prompt.toLowerCase().includes('olá') || prompt.toLowerCase().includes('oi')) {
            result = result.replace(/olá|oi/gi, `{${greetings.join('|')}}`);
        }

        if (prompt.toLowerCase().includes('oferta') || prompt.toLowerCase().includes('promoção')) {
            result = result.replace(/oferta|promoção/gi, `{${offers.join('|')}}`);
        }

        if (prompt.toLowerCase().includes('clique') || prompt.toLowerCase().includes('acesse')) {
            // Tenta substituir o final
            result += `\n\n{${ctas.join('|')}}`;
        }

        // Se não encontrou padrões, cria um spintax genérico no início para demonstrar
        if (result === prompt) {
            result = `{Olá|Oi|E aí} {${prompt}|${prompt}!!|${prompt}...}`;
        }

        setGeneratedResult(result);
        setIsGenerating(false);
    };

    const handleApply = () => {
        if (generatedResult) {
            onInsert(generatedResult);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-600">auto_awesome</span>
                        IA Spintax Generator
                    </DialogTitle>
                    <DialogDescription className="text-xs mt-1">
                        Crie variações automáticas da sua mensagem para evitar bloqueios.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Sua Mensagem Base
                        </label>
                        <textarea
                            className="w-full h-32 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                            placeholder="Digite a mensagem principal aqui..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            disabled={isGenerating}
                        />
                    </div>

                    {generatedResult && (
                        <div className="space-y-2 animate-in slide-in-from-top-2">
                            <label className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                Resultado Gerado
                            </label>
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-lg text-sm text-slate-700 dark:text-slate-200 font-mono whitespace-pre-wrap">
                                {generatedResult}
                            </div>
                            <p className="text-[10px] text-slate-400">
                                As partes entre chaves {'{}'} serão alternadas aleatoriamente em cada envio.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>

                    {!generatedResult ? (
                        <button
                            onClick={generateVariations}
                            disabled={!prompt || isGenerating}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition-all shadow-md shadow-purple-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? (
                                <>
                                    <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                                    Gerando...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                                    Gerar Variações
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleApply}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-all shadow-md shadow-emerald-200 dark:shadow-none"
                        >
                            <span className="material-symbols-outlined text-[18px]">check</span>
                            Usar Variação
                        </button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
