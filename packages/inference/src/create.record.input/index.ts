// @claim core/provider-captures
import type { RecordInput } from "../record.input/index.ts";

const createRecordInput = function (
  changes: Partial<RecordInput> = {},
): RecordInput {
  return {
    row: "synthetic/plain",
    price: { input: 2, output: 10, inputTokens: 100 },
    ...changes,
  };
};

export default createRecordInput;
