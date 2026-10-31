// @claim infra
import acquireTestSlot from "./acquire.test.slot/index.ts";
import changeCwd from "./change.cwd/index.ts";
import createSandbox from "./create.sandbox/index.ts";
import createSocketPath from "./create.socket.path/index.ts";
import createLoopbackServer from "./create.loopback.server/index.ts";
import createTempDir from "./create.temp.dir/index.ts";
import findProjectRoot from "./find.project.root/index.ts";
import FixtureDescription from "./fixture.description/index.ts";
import { FixtureOriginEnum } from "./fixture.origin.enum/index.ts";
import loadFixture from "./load.fixture/index.ts";
import mergeTestCoverage from "./merge.test.coverage/index.ts";
import overrideEnv from "./override.env/index.ts";
import parseTestRequest from "./parse.test.request/index.ts";
import reportTestCoverage from "./report.test.coverage/index.ts";
import resolveTestFiles from "./resolve.test.files/index.ts";
import resolveTestKind from "./resolve.test.kind/index.ts";
import resolveTestProjects from "./resolve.test.projects/index.ts";
import resolveTestTargets from "./resolve.test.targets/index.ts";
import resolveTestTask from "./resolve.test.task/index.ts";
import resolveTestDepth from "./resolve.test.depth/index.ts";
import resolveTestEnv from "./resolve.test.env/index.ts";
import resolveTestPermissions from "./resolve.test.permissions/index.ts";
import runTestCommand from "./run.test.command/index.ts";
import runTestCoverage from "./run.test.coverage/index.ts";
import runTestProcess from "./run.test.process/index.ts";
import runTestProjects from "./run.test.projects/index.ts";
import runTestTarget from "./run.test.target/index.ts";
import { TestKindEnum } from "./test.kind.enum/index.ts";

// @claim infra/package-exports
const Testing = {
  acquireTestSlot,
  changeCwd,
  createSandbox,
  createSocketPath,
  createLoopbackServer,
  createTempDir,
  findProjectRoot,
  FixtureDescription,
  FixtureOriginEnum,
  loadFixture,
  mergeTestCoverage,
  overrideEnv,
  parseTestRequest,
  reportTestCoverage,
  resolveTestFiles,
  resolveTestKind,
  resolveTestProjects,
  resolveTestTargets,
  resolveTestTask,
  resolveTestDepth,
  resolveTestEnv,
  resolveTestPermissions,
  runTestCommand,
  runTestCoverage,
  runTestProcess,
  runTestProjects,
  runTestTarget,
  TestKindEnum,
};

export default Testing;
