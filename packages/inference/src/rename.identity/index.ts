// @claim core/provider-captures
import Protocol from "@kuib-ai/protocol";
import ValidateRequestUnit from "../validate.request/index.ts";
import RefuseCaptureUnit from "../refuse.capture/index.ts";
import type { CaptureIdentity } from "../capture.identity/index.ts";
import fileCases from "../file.cases/index.ts";

const { NAME } = ValidateRequestUnit;
const { fail } = RefuseCaptureUnit;

const rename = function (
  root: string,
  identity: CaptureIdentity,
  oldValue: string,
  newValue: string,
): number {
  const enums = {
    messageFormat: Protocol.MessageFormatEnum,
    provider: Protocol.ProviderEnum,
    model: Protocol.ModelEnum,
  };
  if (
    !(identity in enums) ||
    !Object.values(enums[identity]).includes(newValue as never) ||
    !NAME.test(oldValue)
  )
    fail("invalid-identity");
  return fileCases(
    root,
    function (request) {
      if (request[identity] === oldValue)
        return { ...request, [identity]: newValue };
      return request;
    },
    function (request) {
      return request[identity] === oldValue;
    },
  );
};

export default rename;
