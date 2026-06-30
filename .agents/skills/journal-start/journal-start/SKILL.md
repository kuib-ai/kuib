---
name: journal-start
description: Start or extend a journal entry. Invoke at the start of any new task, feature, research, or discussion that produces knowledge worth preserving.
user-invocable: true
argument-hint: [feature-name]
---

# Journal Start

You are starting or extending a journal entry. The feature name is: "$ARGUMENTS"

## Steps

1. **Search for existing journals** matching "$ARGUMENTS":
   - Use Glob to search `journal/*/` folder names
   - Use Grep to search `journal/*/decisions.md` frontmatter for matching title or tags

2. **If a matching journal exists:**
   - Read its `decisions.md` frontmatter to understand current state
   - Read its `progress.md` if it exists (implementation node)
   - Tell the user you found an existing journal and show its current status
   - Ask the user what new work or decisions to add

3. **If no matching journal exists:**
   - Create the directory `journal/$ARGUMENTS/`
   - Create `journal/$ARGUMENTS/decisions.md` from `.claude/templates/decisions.md`
     - Fill in the frontmatter: title, created date, type (ask user if unclear)
     - Type should be one of: vision, implementation, research, reference
   - For implementation nodes, also create:
     - `journal/$ARGUMENTS/plan.md` from `.claude/templates/plan.md`
     - `journal/$ARGUMENTS/progress.md` from `.claude/templates/progress.md`
     - `journal/$ARGUMENTS/research/` directory
   - Confirm the journal has been created

4. **Update the index**: Read `journal/_index.md` and add the new entry under the appropriate section (Vision, Implementation, Research, Reference). Include the wikilink, one-line description, status, and tags from the frontmatter.

5. **Set context**: Tell the user their active journal is `journal/$ARGUMENTS/` and that you will update decisions.md and progress.md (if applicable) after major milestones during this session.

## Wikilinks

When creating entries, add `[[references]]` in the frontmatter `depends-on` and `informs` fields pointing to related journal entries. Also use inline `[[wikilinks]]` in the body when referencing other entries.
