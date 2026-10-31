// @claim infra/testing-helpers
// @claim infra/testing-helpers
const changeCwd = function (path: string): Disposable {
  const previous = process.cwd();
  process.chdir(path);
  return {
    [Symbol.dispose]: function () {
      process.chdir(previous);
    },
  };
};

export default changeCwd;
