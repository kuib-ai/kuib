// @claim infra/testing-helpers
type EnvValues = Record<string, string | undefined>;

// @claim infra/testing-helpers
const overrideEnv = function (values: EnvValues = {}): Disposable {
  const snapshot = { ...process.env };
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) {
      delete process.env[key];
      continue;
    }
    process.env[key] = value;
  }
  return {
    [Symbol.dispose]: function () {
      for (const key of Object.keys(process.env)) {
        if (!(key in snapshot)) {
          delete process.env[key];
        }
      }
      for (const [key, value] of Object.entries(snapshot)) {
        if (value !== undefined && process.env[key] !== value) {
          process.env[key] = value;
        }
      }
    },
  };
};

export default overrideEnv;
export type { EnvValues };
