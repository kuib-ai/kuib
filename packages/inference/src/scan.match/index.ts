// @claim core/provider-captures

export type ScanMatch = {
  index: number;
  length: number;
  form: "raw" | "json-escaped" | "url-encoded" | "base64" | "unicode-escaped";
};
