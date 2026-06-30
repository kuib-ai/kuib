// @context @journal/architecture-overview
import { initTRPC } from "@trpc/server";

const t = initTRPC.create();

const Trpc = {
  router: t.router,
  procedure: t.procedure,
  createCallerFactory: t.createCallerFactory,
};

export default Trpc;
