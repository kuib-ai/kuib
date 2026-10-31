// @claim core/provider-captures
import Protocol from "@kuib-ai/protocol";
import RefuseCaptureUnit from "../refuse.capture/index.ts";
import fileCases from "../file.cases/index.ts";

const { fail } = RefuseCaptureUnit;

const refile = function (root: string): number {
  return fileCases(root, function (request) {
    if (
      !Object.values(Protocol.MessageFormatEnum).includes(
        request.messageFormat,
      ) ||
      !Object.values(Protocol.ProviderEnum).includes(request.provider) ||
      !Object.values(Protocol.ModelEnum).includes(request.model)
    )
      fail("invalid-identity");
    return request;
  });
};

export default refile;
