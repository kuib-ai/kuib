# Journal Graph

## Product

### [[comprehension-model]] | status:decided | tags:comprehension,hunks,ledger,intent,pair,cognition

Everything is one ordered event log: agent hunks, user hunks, decisions, captures, sub-chats, lens switches. Projections...

### [[infrastructure-strategy]] | status:decided | tags:infrastructure,cluster,deployment,mesh,remote,trpc

2. **Daemons**: One per **OS user** on every device (user-scoped, runs as its own user — see [[security-model]], [[multi...

### [[vision]] | status:decided | tags:product,strategy,differentiation,pair,comprehension

Protocol layer (discussions, context control, transparency) and comprehension layer (hunks, ledger, intent, blast radius...

## Experience

### [[context-bootstrap]] | status:open | tags:bootstrap,context,greenfield,project-map,manifest

Cold start on greenfield repos (docs only, sparse code) — model should not jump to implementation without project contex...

### [[discussions-ux]] | status:open | tags:discussions,context,selection,ux,v1

Not linear "last N messages" focus. Users can:

### [[host-layer]] | status:open | tags:host,opentui,solid,bun,nvim,ui,panes,adapter

Host adapter responsibilities:

- [[host-layer/research/tui-framework]]

### [[multi-device-ux]] | status:open | tags:multi-device,cwd,working-context,device,ux,agent-awareness,mesh

From one chat, the agent runs commands / accesses files across the user's mesh of devices. This entry covers how "curren...

## Architecture

### [[architecture-overview]] | status:decided | tags:architecture,monorepo,packages,host

packages/

### [[consensus-model]] | status:in-progress | tags:consensus,mesh,raft,quorum,lease,fencing,leader-election,local-first,p2p

How the local-first P2P mesh stays correct. This is the load-bearing, highest-risk subsystem. The model below was reason...

### [[distributed-mesh-state]] | status:decided | tags:mesh,tailscale,crdt,yjs,zero-trust

We need a secure, distributed way to store user configuration, AI model preferences, and API keys across multiple device...

### [[provider-architecture]] | status:decided | tags:architecture,providers,plugins,llm

Providers are plugins, not core. The protocol defines the provider interface. Anyone can implement it.

### [[security-model]] | status:open | tags:security,permissions,sandbox,access-control,command-parsing

Three user actions on any command that requires approval:

## Protocol

### [[protocol-design]] | status:in-progress | tags:protocol,types,zod,events,state-management,tsgo

Config uses `module: "NodeNext"`, `moduleResolution: "NodeNext"`. No deprecated options (`target: es5`, `moduleResolutio...

- [[protocol-design/plan]]
- [[protocol-design/progress]]
- [[protocol-design/research/superseded]]

## Process

### [[bootstrap-validation]] | status:in-progress | tags:bootstrap,validation,roleplay,edge-cases,methodology

Validate Kuib by **simulating building Kuib as a user journey** — not narrow dogfooding of incomplete software on the cr...

- [[bootstrap-validation/research/scene-00-cold-start]]

### [[house-style-linting]] | status:in-progress | tags:linting,eslint,house-style,context-graph,conventions,tooling

A custom ESLint plugin that encodes the user's hand-coding conventions (so agent-written code matches the user's idiom a...

### [[ux-classification]] | status:stable | tags:classification,ux,context,model,process

When recording bootstrap scenes or product gaps, tag every observation:

## Research

### [[nvim-integration]] | status:stale | tags:nvim,rpc,embed,attach,bridge,research

Comprehension chrome in nvim buffers; code pane uses real nvim primitives (extmarks, virtual text, `setqflist` for agent...

## Meta

### [[journal-system]] | status:in-progress | tags:infrastructure,journal,context,obsidian

Journal entries are nodes in a graph. Wikilinks are edges. The agent navigates the graph without reading content — metad...
