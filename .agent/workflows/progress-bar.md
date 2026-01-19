---
description: Update the progress bar based on completed tasks in the global list
---

# Progress Bar Update Workflow

1. Read `docs/05-Relatorios/global-task-list.md`.
2. Count the total number of task checkboxes (`- [ ]` + `- [x]`).
3. Count the number of completed tasks (`- [x]`).
4. Calculate the percentage: `(Completed / Total) * 100` (Round to 2 decimal places).
5. Generate a progress bar string with 20 chars length (e.g., using `█` for completion and `░` for remaining).
   - Example: 50% = `██████████░░░░░░░░░░`
6. Update `docs/05-Relatorios/progress-bar.md` with:
   - The new percentage.
   - The visual bar.
   - The current date and time of update.
7. (Optional) If you want, you can also prepend this status to the top of `docs/05-Relatorios/global-task-list.md`.
8. Notify the user of the updated progress.
