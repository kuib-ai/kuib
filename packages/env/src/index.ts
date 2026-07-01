// @context @journal/provider-architecture
import bootstrapEnv from "./bootstrap.env";
import EnvSchema from "./env.schema";
import resolveDbPath from "./db.path";

const Env = {
  bootstrapEnv,
  EnvSchema,
  resolveDbPath,
};

export default Env;
