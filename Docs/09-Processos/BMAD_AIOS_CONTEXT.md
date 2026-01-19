# Contexto: BMAD Method & AIOS

Este documento serve como referência central para a metodologia de desenvolvimento (BMAD) e a fundação de IA (AIOS) utilizadas neste projeto.

## 1. BMAD Method (Breakthrough Method for AI-Driven Development)

O BMAD é um framework agnóstico de modelo para desenvolvimento de software assistido por IA. Ele foca em especificações claras (`specs`), documentação estruturada e fluxos de trabalho de agentes.

### Links Oficiais
- **Documentação Principal:** [https://docs.bmad-method.org](https://docs.bmad-method.org)
- **Guias Passo a Passo:** [https://docs.bmad-method.org/how-to/](https://docs.bmad-method.org/how-to/)
- **Repositório GitHub:** [https://github.com/bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD)
- **Guia do Usuário:** [https://bmadcodes.com/user-guide/](https://bmadcodes.com/user-guide/)
- **Masterclass (Vídeo):** [The Official BMad-Method Masterclass](https://www.youtube.com/watch?v=LorEJPrALcg)

### Estrutura e Conceitos
O BMAD prescreve uma organização de pastas específica para maximizar o contexto da IA:
- Foco em pequenos arquivos de contexto.
- Separação clara entre *Specs*, *Plan*, *Context* e *Code*.
- Instalação via CLI: `npx bmad-method@alpha install`

---

## 2. AIOS (AI Operating System)

AIOS é uma fundação para desenvolvimento e deploy de agentes de IA, fornecendo um kernel e SDK para orquestração.

### Links Oficiais
- **Portal:** [https://www.aios.foundation](https://www.aios.foundation)
- **Documentação Técnica:** [https://docs.aios.foundation](https://docs.aios.foundation)
- **SDK & Kernel:** [https://docs.aios.foundation/aios-docs](https://docs.aios.foundation/aios-docs)

### Integração
O AIOS atua como a camada de tempo de execução (Runtime) onde os agentes definidos pelo método BMAD podem operar ou ser implantados.
