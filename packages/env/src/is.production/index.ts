// @claim infra/base-dirs
// @claim infra/base-dirs
const isProduction = function (): boolean {
  return process.env["NODE_ENV"] === "production";
};

export default isProduction;
