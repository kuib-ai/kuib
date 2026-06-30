---
name: remember
description: Bootstraps the agent into an existing in-progress task by reading the active journal context.
---

# Instructions

When the user asks you to resume, continue, or bootstrap an existing task, follow these steps exactly:

1. **Locate Active Context**: Read the contents of the `journal/active/` directory. If there are multiple active files, ask the user which one to resume. If there is only one, read it.
2. **Verify Truth in Code**: The active journal file contains a plan and a pointer to the current phase, but the **code is the ultimate source of truth**. You must inspect the files mentioned in the plan to verify what has actually been implemented versus what is just written in the journal.
3. **Format Your Output**: Before writing any code, reply to the user with the following exact format so they can confirm your understanding:

```markdown
### 🔄 Bootstrapped Context: {Task Name}

**Current Phase:** {Phase number / description}

**Verified State:**

- {What you actually found implemented in the codebase}
- {Any discrepancies between the journal and the code}

**Next Move:**

- {The exact files you intend to edit next based on the plan}
```

4. **Wait for Approval**: Do not execute the next move until the user confirms the bootstrap summary.
