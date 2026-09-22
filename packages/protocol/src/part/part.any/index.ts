// @claim core/protocol-parts
import { z } from "zod";
import PartAssistant from "../part.assistant/index.ts";
import PartUser from "../part.user/index.ts";

// @claim core/protocol-parts
const AnyPart = z.union([PartAssistant, PartUser]);
type AnyPart = z.infer<typeof AnyPart>;

export default AnyPart;
export type { AnyPart };
