// @context @journal/application-directories
const isProduction = function (): boolean {
  return process.env["NODE_ENV"] === "production";
};

export default isProduction;
