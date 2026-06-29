import { createClient } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-node';
import { DaemonService } from '@kuib/protocol/src/gen/kuib/v1/daemon_pb.js';
import { runAgent } from './orchestrator.js';

// The CLI host connects to the local daemon (or remote via tailscale)
const transport = createConnectTransport({
  baseUrl: 'http://localhost:8080', // the daemon's listen address
  httpVersion: '1.1'
});

const daemonClient = createClient(DaemonService, transport);

async function main() {
  const prompt = process.argv[2] || "List the files in the current directory and explain what they are.";
  console.log(`\n> Sending prompt: "${prompt}"\n`);
  
  try {
    await runAgent(prompt, daemonClient);
    console.log('\n\n[Agent Finished Successfully]');
  } catch (error) {
    console.error('\n[Agent Error]', error);
  }
}

main();
