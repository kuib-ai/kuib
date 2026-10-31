// @claim core/package-barrels
import ID from "./id/index.ts";
import ToolCall from "./tool.call/index.ts";
import Part from "./part/index.ts";
import Message from "./message/index.ts";
import Event from "./event/index.ts";
import Error from "./error/index.ts";
import ServiceMessage from "./service.message/index.ts";
import TokenUsage from "./token.usage/index.ts";
import ModelRef from "./model.ref/index.ts";
import FileSystem from "./file.system/index.ts";
import Endpoint from "./endpoint/index.ts";
import Node from "./node/index.ts";
import Provider from "./provider/index.ts";
import { MessageFormatEnum } from "./message.format.enum/index.ts";
import { ProviderEnum } from "./provider.enum/index.ts";
import { ModelEnum } from "./model.enum/index.ts";

// @claim core/package-barrels
const Protocol = {
  ID,
  ToolCall,
  Part,
  Message,
  Event,
  Error,
  ServiceMessage,
  TokenUsage,
  ModelRef,
  FileSystem,
  Endpoint,
  Node,
  Provider,
  MessageFormatEnum,
  ProviderEnum,
  ModelEnum,
};

export default Protocol;
