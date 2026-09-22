// @context @journal/domains/infra#^C012
const isProduction = function (): boolean {
  return process.env["NODE_ENV"] === "production";
};

export default isProduction;
