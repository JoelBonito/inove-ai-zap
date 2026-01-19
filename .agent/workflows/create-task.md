---
description: Create the global task list from the epics documentation
---

# Create Task List Workflow

1. Read the content of `Docs/planning-artifacts/epics.md` to identify Epics and Stories.
2. Create or overwrite the file `docs/05-Relatorios/global-task-list.md`.
3. In `docs/05-Relatorios/global-task-list.md`, write a header "# Lista Global de Tarefas".
4. Parse `epics.md` and for each "## Epic X" and "### Story X.Y", verify the content and format it into the task list file as follows:
   - For Epics: `## Epic X: Title` (No checkbox)
   - For Stories: `- [ ] **Story X.Y:** Title`
5. Ensure that all stories are captured.
6. Notify the user that the task list has been created and saved to `docs/05-Relatorios/global-task-list.md`.
