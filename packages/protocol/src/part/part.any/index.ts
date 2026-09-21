// @context @journal/protocol-design
import { z } from "zod";
import PartAssistant from "../part.assistant/index.ts";
import PartUser from "../part.user/index.ts";

const AnyPart = z.union([PartAssistant, PartUser]);
type AnyPart = z.infer<typeof AnyPart>;

export default AnyPart;
export type { AnyPart };
