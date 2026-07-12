// @context @journal/protocol-design
import ID from "./id";
import ToolCall from "./tool.call";
import Part from "./part";
import Message from "./message";
import Event from "./event";
import Error from "./error";
import ServiceMessage from "./service.message";
import TokenUsage from "./token.usage";
import ModelRef from "./model.ref";
import FileSystem from "./file.system";
import Endpoint from "./endpoint";
import Node from "./node";
import Provider from "./provider";

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
};

export default Protocol;
