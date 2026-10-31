// @claim core/provider-captures
import { join, relative } from "node:path";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import ScanSensitiveBytesUnit from "../scan.sensitive.bytes/index.ts";
import ValidateRequestUnit from "../validate.request/index.ts";
import RefuseCaptureUnit from "../refuse.capture/index.ts";
import ParseCaptureJsonUnit from "../parse.capture.json/index.ts";
import safePath from "../resolve.capture.path/index.ts";

const { ENCODER, base64Bytes, scan } = ScanSensitiveBytesUnit;
const { IDENTITY_HEADER, RATE_HEADER } = ValidateRequestUnit;
const { CaptureError, fail } = RefuseCaptureUnit;
const { object, parseJson } = ParseCaptureJsonUnit;

const audit = function (
  root: string,
  values: string[],
  organizationIds: string[] = [],
): { files: number } {
  let count = 0;
  const visit = function (folder: string): void {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const path = safePath(root, relative(root, join(folder, entry.name)));
      if (entry.isDirectory()) {
        visit(path);
        continue;
      }
      const bytes = readFileSync(path);
      scan(bytes, values);
      let bodyPermitted = false;
      if (entry.name === "response.body" || entry.name === "request.body") {
        const transportPath = join(folder, "transport.json");
        const permitted =
          existsSync(transportPath) &&
          object(parseJson(readFileSync(transportPath, "utf8")))
            ?.anthropicOrganizationId === true;
        bodyPermitted = permitted;
        for (const decoded of base64Bytes(new TextDecoder().decode(bytes))) {
          if (
            !permitted &&
            /[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}/i.test(
              decoded.toString("latin1"),
            )
          ) {
            const fixture = relative(root, folder);
            scan(ENCODER.encode(fixture), values);
            throw new CaptureError("encoded-uuid", undefined, fixture);
          }
        }
      }
      if (!bodyPermitted) scan(bytes, organizationIds);
      if (entry.name === "request.json" || entry.name === "response.json") {
        const headers = object(
          object(parseJson(new TextDecoder().decode(bytes)))?.headers,
        );
        if (
          headers !== null &&
          Object.keys(headers).some(function (name) {
            return (
              IDENTITY_HEADER.test(name.toLowerCase()) &&
              !RATE_HEADER.test(name.toLowerCase())
            );
          })
        )
          fail("identity-header-on-disk");
      }
      count++;
    }
  };
  visit(root);
  return { files: count };
};

export default audit;
