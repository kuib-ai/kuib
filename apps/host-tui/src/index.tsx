import { render, useKeyboard, useRenderer, Portal } from "@opentui/solid";
import { createSignal, onMount, onCleanup, For, Show } from "solid-js";
import { exec } from "child_process";
import { promisify } from "util";
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-node";
import { DaemonService } from "@kuib/protocol/src/gen/kuib/v1/daemon_pb.ts";

const execAsync = promisify(exec);

interface TailscaleNode {
  name: string;
  ip: string;
  online: boolean;
}

const App = () => {
  const renderer = useRenderer();
  const [nodes, setNodes] = createSignal<TailscaleNode[]>([]);
  const [command, setCommand] = createSignal("");
  const [outputs, setOutputs] = createSignal<Record<string, string>>({});
  const [showModal, setShowModal] = createSignal(false);
  const [modalSelectedIndex, setModalSelectedIndex] = createSignal(0);
  const [selectedNode, setSelectedNode] = createSignal<string>("all");

  let inputRef: any;
  let interval: ReturnType<typeof setInterval>;

  const fetchNodes = async () => {
    try {
      const { stdout } = await execAsync("tailscale status --json");
      const status = JSON.parse(stdout);
      
      const parsedNodes: TailscaleNode[] = [];
      if (status.Self) {
        parsedNodes.push({
          name: status.Self.HostName || "localhost",
          ip: status.Self.TailscaleIPs[0],
          online: status.Self.Online
        });
      }
      
      if (status.Peer) {
        for (const [id, peer] of Object.entries<any>(status.Peer)) {
          parsedNodes.push({
            name: peer.HostName,
            ip: peer.TailscaleIPs[0],
            online: peer.Online
          });
        }
      }
      
      setNodes(parsedNodes);
    } catch (e) {
      setOutputs(prev => ({ ...prev, localhost: `Error fetching tailscale status: ${String(e)}` }));
    }
  };

  onMount(() => {
    fetchNodes();
    interval = setInterval(fetchNodes, 5000);
  });

  onCleanup(() => {
    clearInterval(interval);
  });

  const modalOptions = () => ["all", ...nodes().map(n => n.name)];

  useKeyboard((key) => {
    if (key.ctrl && key.name === "p") {
      setShowModal(true);
      return;
    }

    if (showModal()) {
      const opts = modalOptions();
      
      if (key.name === "escape") {
        setShowModal(false);
      } else if (key.name === "up") {
        setModalSelectedIndex((i) => Math.max(0, i - 1));
      } else if (key.name === "down") {
        setModalSelectedIndex((i) => Math.min(opts.length - 1, i + 1));
      } else if (key.name === "return") {
        const opt = opts[modalSelectedIndex()];
        const n = nodes().find(x => x.name === opt);
        if (opt === "all" || (n && n.online)) {
           setSelectedNode(opt);
           setShowModal(false);
        }
      }
    } else {
      if (key.name === "escape") {
        renderer.destroy();
      }
    }
  });

  const handleSubmit = async () => {
    const cmd = command();
    if (!cmd.trim()) return;

    if (inputRef && typeof inputRef.setText === "function") {
      inputRef.setText("");
    }
    setCommand("");
    
    const targets = selectedNode() === "all" 
      ? nodes().filter(n => n.online) 
      : nodes().filter(n => n.name === selectedNode());
      
    setOutputs(prev => {
      const next = { ...prev };
      targets.forEach(t => next[t.name] = (next[t.name] || "") + `$ ${cmd}\n`);
      return next;
    });

    await Promise.all(targets.map(async (node) => {
      try {
        const transport = createConnectTransport({
          baseUrl: `http://${node.ip}:8080`,
          httpVersion: "1.1"
        });
        const client = createClient(DaemonService, transport);
        
        const res = await client.executeCommand({ command: cmd });
        setOutputs(prev => ({
          ...prev,
          [node.name]: prev[node.name] + (res.stdout || "") + (res.stderr || "")
        }));
      } catch (e) {
        setOutputs(prev => ({
          ...prev,
          [node.name]: prev[node.name] + `Error: ${String(e)}\n`
        }));
      }
    }));
  };

  const currentBufferText = () => {
    if (selectedNode() === "all") {
       return Object.entries(outputs())
         .map(([name, log]) => `[${name}]\n${log}`)
         .join("\n\n");
    }
    return outputs()[selectedNode()] || "";
  };

  return (
    <box width="100%" height="100%" flexDirection="column" padding={1} gap={1}>
      <box flexDirection="row" justifyContent="space-between" flexShrink={0}>
        <text fg="green">Kuib AI Host (Press Ctrl+P to select target)</text>
        <text fg="magenta">Target: {selectedNode() === "all" ? "Broadcast (All)" : selectedNode()}</text>
      </box>

      <box border flexGrow={1} flexDirection="column" padding={1}>
        <scrollbox flexGrow={1}>
          <text>{currentBufferText()}</text>
        </scrollbox>
      </box>

      <box border width="100%" height={3} flexShrink={0}>
        <input
          ref={inputRef}
          placeholder={selectedNode() === "all" ? "Broadcast bash command to all daemons..." : `Execute command on ${selectedNode()}...`}
          onInput={setCommand}
          onSubmit={handleSubmit}
          focused={!showModal()}
        />
      </box>

      <Show when={showModal()}>
        <box 
          position="absolute"
          top={0} left={0} right={0} bottom={0}
          width="100%"
          height="100%"
          justifyContent="center"
          alignItems="center"
        >
          <box 
            width={60}
            border
            backgroundColor="#111"
            flexDirection="column"
            padding={1}
          >
            <text fg="yellow" marginBottom={1}>Select Target Node (Enter to select, Esc to close)</text>
            
            <box flexDirection="column" gap={0}>
               <For each={modalOptions()}>
                 {(opt, i) => {
                    const isSel = () => i() === modalSelectedIndex();
                    
                    if (opt === "all") {
                      return <text fg={isSel() ? "black" : "white"} bg={isSel() ? "white" : undefined}>{isSel() ? ">" : " "} All (Broadcast)</text>
                    }
                    
                    const n = nodes().find(x => x.name === opt);
                    const isOnline = n?.online;
                    
                    return (
                      <text 
                        fg={isSel() ? "black" : (isOnline ? "cyan" : "gray")} 
                        bg={isSel() ? "white" : undefined}
                      >
                        {isSel() ? ">" : " "} {opt} ({n?.ip}) {isOnline ? "" : "- Offline"}
                      </text>
                    );
                 }}
               </For>
            </box>
          </box>
        </box>
      </Show>
    </box>
  );
};

render(App);
