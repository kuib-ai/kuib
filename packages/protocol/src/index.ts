// @context @journal/protocol-design
import ID from "./id";
import ToolCall from "./tool.call";
import Part from "./part";
import Message from "./message";
import Event from "./event";
import ServiceMessage from "./service.message";
import TokenUsage from "./token.usage";
import ModelRef from "./model.ref";
import FileSystem from "./file.system";

const Protocol = {
  ID,
  ToolCall,
  Part,
  Message,
  Event,
  ServiceMessage,
  TokenUsage,
  ModelRef,
  FileSystem,
};

export default Protocol;
