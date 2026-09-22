# Scene 00 — Cold Start

Bootstrap validation scene. User runs `kuib` in `kuib-ai`, asks to implement host layer from journal docs.

## Scenario

**User:** "Let's start implementing the host layer. Read journal/protocol-design and sketch HostProtocol interface."

**Kuib (actual — without scaffolding):** Reads journal, suggests drafting `packages/host/` — skips architectural vacuum.

## Builder Acceptance

Starting from plain docs is fine — nothing built yet, journal exists.

## Classified Findings

| ID   | Finding                                                                                                | Class   |
| ---- | ------------------------------------------------------------------------------------------------------ | ------- |
| S0-1 | Docs cover engine protocol; discussion clustering is barebones schema only                             | Context |
| S0-2 | Context engine should detect sparse codebase + unindexed `journal/*.md`                                | Context |
| S0-3 | Inject bootstrap block before first turn (manifest / system reminder / dreamer TBD)                    | Context |
| S0-4 | Project Map buffer with repo scan, layer bars, journal coverage, build-order hint, `[1][2][3]` actions | UX      |
| S0-5 | Ledger empty state: "design phase — no code hunks"                                                     | UX      |
| S0-6 | Code pane closed until first file touch                                                                | UX      |
| S0-7 | Model noticing gaps / phrasing nudges without scaffolding                                              | Model   |

## Ideal Behavior (UX + Context)

### Project Map (Scene 0 — building Kuib)

```
╔══════════════════════════════════════════════════════════════════╗
║  KUIB BOOTSTRAP · kuib-ai · session new                          │
╠══════════════════════════════════════════════════════════════════╣
│ ON DISK (scanned)                                                │
│   journal/          12 entries · md · NOT INDEXED  [!]           │
│   kuib/apps/tui/    smoke-test agent (ToolLoopAgent)             │
│   kuib/packages/protocol/  partial schemas                       │
│   (no packages/host, engine, event-log, nvim-host)               │
│   design prototype   external ref         [not linked]          │
╠══════════════════════════════════════════════════════════════════╣
│ LAYER STATUS                                                     │
│   ENGINE/PROTOCOL    [████░░░░]  journal decided · pkg partial   │
│   DISCUSSIONS UX     [██░░░░░░]  schema-only (PartID overlay)    │
│   HOST LAYER         [░░░░░░░░]  missing ← user requested        │
│   COMPREHENSION      [░░░░░░░░]  hunks/ledger/intent undefined   │
│   NVIM SHELL         [░░░░░░░░]  layout undecided                │
╠══════════════════════════════════════════════════════════════════╣
│ DEPENDENCY (from manifest, not model guess)                      │
│   protocol → engine → host → nvim layout                         │
│   context bootstrap ← YOU ARE HERE                               │
╠══════════════════════════════════════════════════════════════════╣
│ JOURNAL COVERAGE (from _index.md)                                │
│   ✓ protocol-design   ✓ vision   ○ host   ○ discussions-ux     │
╠══════════════════════════════════════════════════════════════════╣
│ SAVED DISCUSSIONS: 0                                             │
│ SUGGESTED: [1] Index journal  [2] Sketch host layout  [3] Link ref │
╚══════════════════════════════════════════════════════════════════╝
```

### Ideal Kuib Reply (Given Scaffolding)

> Protocol-design covers engine/events; discussions UX and host undefined. Project Map updated. Pick [2] to sketch host + pane layout, or override to implement HostProtocol.

## Open

- Manifest format: `.kuib/manifest.yaml` vs journal index job
