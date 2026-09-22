// @claim core/package-barrels
import createModel from "./model/index.ts";
import buildProviderOptions from "./build.provider.options/index.ts";
import resolveModelConfig from "./resolve.model.config/index.ts";
import buildTools from "./build.tools/index.ts";

// @claim core/package-barrels
const Provider = {
  createModel,
  buildProviderOptions,
  resolveModelConfig,
  buildTools,
};

export default Provider;
