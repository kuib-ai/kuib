// @claim infra/fixture-convention
import { z } from "zod";
import { FixtureOriginEnum } from "../fixture.origin.enum/index.ts";

// @claim infra/fixture-convention
const FixtureDescription = z.strictObject({
  shows: z.string().trim().min(1),
  origin: z.enum(FixtureOriginEnum),
});
type FixtureDescription = z.infer<typeof FixtureDescription>;

export default FixtureDescription;
export type { FixtureDescription };
