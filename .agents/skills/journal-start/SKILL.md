---
name: journal-start
description: Start or extend a journal entry. Invoke at the start of any new architectural decision, domain definition, or strategy contract.
---

# Journal Start

You are starting or extending a journal entry.

## Steps

1. **Search for existing journals**:
   - Use `list_dir` to look in `journal/architecture/`
   - Read related `decisions.md` frontmatter to see if the topic is already covered.

2. **If a matching journal exists:**
   - Read its `decisions.md` to understand current state.
   - Tell the user you found an existing journal and ask what new decisions to add.

3. **If no matching journal exists:**
   - Ask the user for a short, hyphenated domain name (e.g. `order-execution`).
   - Create the directory `journal/architecture/[domain-name]/`.
   - Create `journal/architecture/[domain-name]/decisions.md` with the following frontmatter:
     ```yaml
     ---
     title: [Human Readable Title]
     type: implementation
     layer: architecture
     status: decided
     created: [YYYY-MM-DD]
     tags: [tag1, tag2]
     depends-on: []
     informs: []
     ---
     ```
   - Add the initial architectural decisions based on user context.

4. **Update the index**:
   - Run `pnpm exec tsx scripts/compile-journal-index.ts`.
   - Ensure the new entry passes all structural validation checks.

5. **Set context**: Tell the user the ADR is created and they can now run the domain generator (`pnpm generate`) and manually link `@context @journal/[domain-name]/decisions.md`.

## Wikilinks

When creating entries, add `[references]` in the frontmatter `depends-on` and `informs` fields pointing to related journal entries (e.g. `[grpc-tailnet-topology]`). Use reciprocal links.
