// @context @journal/provider-architecture
import createModel from "./model";
import buildProviderOptions from "./build.provider.options";
import resolveModelConfig from "./resolve.model.config";
import buildTools from "./build.tools";

const Provider = {
  createModel,
  buildProviderOptions,
  resolveModelConfig,
  buildTools,
};

export default Provider;
