---
description: Validate and update the status of tasks in the global task list
---

# Valid Task Workflow

1. Read `docs/05-Relatorios/global-task-list.md`.
2. check the last session log in `docs/08-Logs-Sessoes/`.
3. If specific tasks are mentioned as completed in the user prompt or session log context, mark them as `[x]` in the content.
4. If no specific context is provided, ask the user: "Quais tarefas você concluiu nesta sessão? (Indique os IDs ou Nomes das Stories)".
5. Save the updated content back to `docs/05-Relatorios/global-task-list.md`.
6. Automatically trigger the `/progress-bar` workflow to update the progress visualization.
