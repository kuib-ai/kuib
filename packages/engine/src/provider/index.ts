// @context @journal/domains/core#^C002
import createModel from "./model/index.ts";
import buildProviderOptions from "./build.provider.options/index.ts";
import resolveModelConfig from "./resolve.model.config/index.ts";
import buildTools from "./build.tools/index.ts";

const Provider = {
  createModel,
  buildProviderOptions,
  resolveModelConfig,
  buildTools,
};

export default Provider;
