---
name: remember
description: Search and load journal context into the current session. Use after context compaction or to reference previous discussions and decisions.
user-invocable: true
argument-hint: [search query]
---

# Remember

Search the journal for entries matching: "$ARGUMENTS"

## Steps

1. **Read the index first**: Read `journal/_index.md` to see all available entries with their metadata.

2. **Find matches:**
   - Search the index for entries whose title, tags, or description match "$ARGUMENTS"
   - If no index match, use Glob for `journal/$ARGUMENTS/` as a direct folder match
   - If still nothing, use Grep across `journal/*/decisions.md` for content matching "$ARGUMENTS"

3. **Load the matched entry:**
   - Read `decisions.md` (always — this is the current truth)
   - Read `progress.md` if it exists (for implementation status)
   - List `research/` contents but don't read unless the user asks
   - Do NOT read `plan.md` unless the user needs implementation details

4. **Follow relevant edges:**
   - Check the `depends-on` and `informs` fields in the frontmatter
   - Mention related entries to the user: "This depends on [[X]] and informs [[Y]]"
   - Do NOT auto-load them — let the user decide if they need that context too

5. **Summarize:** Tell the user what journal is now in context, its status, and what the key decisions/state are. Keep it concise.

## For deep retrieval

If you need to load a journal entry mid-conversation without the user asking (e.g., you realize a past decision is relevant), spawn an Explore subagent to read the entry and return a focused summary. Do NOT read heavy journal content directly into your main context.
