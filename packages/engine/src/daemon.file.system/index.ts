// @claim core/build-tools
import type { FileSystemPort } from "@kuib-ai/protocol/file.system.port";
import type { DaemonClient } from "../daemon.client/transport.factory/index.ts";

// @claim core/build-tools
const createDaemonFileSystem = function (client: DaemonClient): FileSystemPort {
  return {
    readFile: function (input) {
      return client.readFile.query(input);
    },
    readDir: function (input) {
      return client.readDir.query(input);
    },
  };
};

export default createDaemonFileSystem;
