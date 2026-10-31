// @claim core/provider-captures
import type { CaptureOptions } from "../capture.options/index.ts";
import type { ScanMatch } from "../scan.match/index.ts";
import RefuseCaptureUnit from "../refuse.capture/index.ts";

const { CaptureError } = RefuseCaptureUnit;

const ENCODER = new TextEncoder();

const base64Bytes = function* (text: string): Generator<Buffer> {
  for (const match of text.matchAll(/[A-Za-z0-9+/_-]{2,}={0,2}/g)) {
    const run = match[0].replaceAll("-", "+").replaceAll("_", "/");
    for (let phase = 0; phase < 4; phase++) {
      const bytes = Buffer.from(run.slice(phase), "base64");
      if (bytes.length > 0) yield bytes;
    }
  }
};

const scan = function (bytes: Uint8Array, values: string[]): void {
  const text = new TextDecoder().decode(bytes);
  const unescaped = text.replace(
    /\\u([a-f0-9]{4})/gi,
    function (_match, code: string) {
      return String.fromCharCode(Number.parseInt(code, 16));
    },
  );
  const decoded = unescaped.replace(
    /%([a-f0-9]{2})/gi,
    function (_match, code: string) {
      return String.fromCharCode(Number.parseInt(code, 16));
    },
  );
  for (const [index, value] of values.entries()) {
    if (value.length === 0) continue;
    const escaped = JSON.stringify(value).slice(1, -1);
    const unicode = value
      .split("")
      .map(function (letter) {
        return `\\u${letter.charCodeAt(0).toString(16).padStart(4, "0")}`;
      })
      .join("");
    const forms: [ScanMatch["form"], string][] = [
      ["raw", value],
      ["json-escaped", escaped],
      ["url-encoded", encodeURIComponent(value)],
      ["base64", Buffer.from(value).toString("base64")],
      ["unicode-escaped", unicode],
    ];
    for (const [form, encoded] of forms) {
      const match = text.includes(encoded)
        ? form
        : unescaped.includes(encoded)
          ? "unicode-escaped"
          : decoded.includes(encoded)
            ? "url-encoded"
            : null;
      if (match !== null)
        throw new CaptureError("sensitive-data", {
          index,
          length: value.length,
          form: match,
        });
    }
    for (const source of new Set([text, unescaped, decoded])) {
      for (const bytes of base64Bytes(source)) {
        if (
          forms.some(function ([, encoded]) {
            return bytes.includes(Buffer.from(encoded));
          })
        )
          throw new CaptureError("sensitive-data", {
            index,
            length: value.length,
            form: "base64",
          });
      }
    }
  }
};

const sensitiveValues = function (options: CaptureOptions): string[] {
  return [options.key, ...(options.secrets ?? [])];
};

export default { ENCODER, base64Bytes, scan, sensitiveValues };
