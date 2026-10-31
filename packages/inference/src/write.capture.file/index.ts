// @claim core/provider-captures
import { writeFileSync } from "node:fs";
import ScanSensitiveBytesUnit from "../scan.sensitive.bytes/index.ts";

const { ENCODER, scan } = ScanSensitiveBytesUnit;

const write = function (
  path: string,
  data: unknown,
  values: string[],
  exclusive = true,
): void {
  const bytes =
    data instanceof Uint8Array
      ? data
      : ENCODER.encode(`${JSON.stringify(data, null, 2)}\n`);
  scan(bytes, values);
  writeFileSync(path, bytes, { flag: exclusive ? "wx" : "w" });
};

export default write;
