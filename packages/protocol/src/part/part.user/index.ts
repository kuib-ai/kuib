// @context @journal/protocol-design
import { z } from "zod";
import PartText from "../part.text";
import PartFile from "../part.file";

const PartUser = z.discriminatedUnion("type", [PartText, PartFile]);
type PartUser = z.infer<typeof PartUser>;

export default PartUser;
export type { PartUser };
