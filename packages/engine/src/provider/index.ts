// @context @journal/provider-architecture
import createModel from "./model";
import resolveModelConfig from "./resolve.model.config";
import buildTools from "./build.tools";

const Provider = {
  createModel,
  resolveModelConfig,
  buildTools,
};

export default Provider;
