import { render, useKeyboard, useRenderer } from "@opentui/solid";
import { createSignal, onMount, For } from "solid-js";
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-node";
import { DaemonService } from "@kuib/protocol/src/gen/kuib/v1/daemon_pb.ts";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const App = () => {
  const [cwd, setCwd] = createSignal(process.cwd());
  const [nodes, setNodes] = createSignal<{name: string, ip: string, online: boolean}[]>([{ name: "localhost", ip: "127.0.0.1", online: true }]);
  const [outputs, setOutputs] = createSignal<Record<string, string>>({});
  const [command, setCommand] = createSignal("");
  const renderer = useRenderer();

  onMount(async () => {
    try {
      const { stdout } = await execAsync("tailscale status --json");
      const status = JSON.parse(stdout);
      const peers = Object.values(status.Peer) as any[];
      const activeNodes = peers
        .filter(p => p.Online === true && p.TailscaleIPs?.length > 0)
        .map(p => ({
          name: p.HostName,
          ip: p.TailscaleIPs[0],
          online: p.Online
        }));
      
      setNodes([{ name: "localhost", ip: "127.0.0.1", online: true }, ...activeNodes]);
    } catch (e) {
      // Fallback to localhost if tailscale fails
    }
  });

  useKeyboard(async (key) => {
    if (key.name === "escape" || (key.ctrl && key.name === "c")) {
      renderer.destroy();
      process.exit(0);
    }
  });

  const handleSubmit = async (cmd: string) => {
    if (!cmd.trim()) return;
    setCommand("");
    
    // Reset outputs for new command
    const newOutputs: Record<string, string> = {};
    nodes().forEach(n => newOutputs[n.name] = `Running: ${cmd}...`);
    setOutputs({ ...newOutputs });

    // Execute concurrently across all nodes
    nodes().forEach(async (node) => {
      try {
        const transport = createConnectTransport({
          baseUrl: `http://${node.ip}:8080`,
          httpVersion: '1.1'
        });
        const client = createClient(DaemonService, transport);
        
        const res = await client.executeCommand({
          command: cmd,
          cwd: cwd(), // Note: CWD might not exist on remote machines, could fall back to ~
          env: {}
        });
        
        setOutputs(prev => ({
          ...prev,
          [node.name]: res.stdout || res.stderr || "Success (no output)"
        }));
      } catch (e: any) {
        setOutputs(prev => ({
          ...prev,
          [node.name]: `Error: ${e.message}`
        }));
      }
    });
  };

  return (
    <box flexDirection="column" border padding={1} gap={1} flex={1}>
      <text fg="#00FF00">Kuib AI Host (Mesh Broadcast Mode)</text>
      <text fg="#00FFFF">Active Nodes: {nodes().map(n => n.name).join(", ")}</text>
      
      <box flexDirection="column" flex={1} gap={1} overflow="hidden">
        <For each={nodes()}>
          {(node) => (
            <box border padding={1} flexDirection="column" height={10}>
              <text fg="#FFFF00">[{node.name}] ({node.ip})</text>
              <scrollbox flex={1}>
                <text>{outputs()[node.name] || "Ready"}</text>
              </scrollbox>
            </box>
          )}
        </For>
      </box>
      
      <box flexDirection="row" gap={1}>
        <text fg="#00FFFF">$&gt;</text>
        <input 
          placeholder="Broadcast bash command to all daemons..."
          value={command()}
          onInput={setCommand}
          onSubmit={handleSubmit}
          focused={true}
        />
      </box>

      <text fg="#666666">Press [ESC] to quit</text>
    </box>
  );
};

render(App);
