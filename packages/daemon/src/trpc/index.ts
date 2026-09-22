// @claim core/daemon-router
import { initTRPC } from "@trpc/server";

const t = initTRPC.create();

// @claim core/daemon-router
const Trpc = {
  router: t.router,
  procedure: t.procedure,
  createCallerFactory: t.createCallerFactory,
};

export default Trpc;
