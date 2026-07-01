// @context @journal/tool-system
import type { FileSystemPort } from "@kuib-ai/protocol/file.system.port";
import type { DaemonClient } from "../daemon.client/transport.factory";

const createDaemonFileSystem = function (client: DaemonClient): FileSystemPort {
  return {
    readFile: function (input) {
      return client.readFile.query(input);
    },
  };
};

export default createDaemonFileSystem;
