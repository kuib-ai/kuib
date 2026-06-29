import * as http from 'http';
import { connectNodeAdapter } from '@connectrpc/connect-node';
import type { ConnectRouter } from '@connectrpc/connect';
import { DaemonService } from '@kuib/protocol/src/gen/kuib/v1/daemon_pb.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

export function routes(router: ConnectRouter) {
  router.service(DaemonService, {
    async executeCommand(req) {
      console.log(`[Daemon] Executing command: ${req.command} in ${req.cwd}`);
      try {
        const { stdout, stderr } = await execAsync(req.command, {
          cwd: req.cwd || process.cwd(),
          env: { ...process.env, ...req.env }
        });
        return {
          exitCode: 0,
          stdout,
          stderr
        };
      } catch (e: any) {
        return {
          exitCode: e.code || 1,
          stdout: e.stdout || '',
          stderr: e.stderr || e.message
        };
      }
    },
    async readFile(req) {
      console.log(`[Daemon] Reading file: ${req.path}`);
      const content = await fs.readFile(req.path);
      return { content };
    },
    async writeFile(req) {
      console.log(`[Daemon] Writing file: ${req.path}`);
      await fs.writeFile(req.path, req.content);
      return { success: true };
    }
  });
}

// Start a standalone HTTP/1.1 server using the Connect protocol
const handler = connectNodeAdapter({
  routes,
});

const server = http.createServer(handler);
const port = 8080;

server.listen(port, () => {
  console.log(`[Daemon] ConnectRPC Server listening on http://localhost:${port}`);
  console.log(`[Daemon] Test via: curl --header "Content-Type: application/json" --data '{"command": "echo hello"}' http://localhost:8080/kuib.v1.DaemonService/ExecuteCommand`);
});
