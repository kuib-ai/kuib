// @claim core/protocol-parts
import { z } from "zod";
import PartText from "../part.text/index.ts";
import PartFile from "../part.file/index.ts";

// @claim core/protocol-parts
const PartUser = z.discriminatedUnion("type", [PartText, PartFile]);
type PartUser = z.infer<typeof PartUser>;

export default PartUser;
export type { PartUser };
