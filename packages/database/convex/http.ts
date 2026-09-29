import { httpRouter } from "convex/server";
import { auth } from "./auth";

const createHttpRouter = () => {
  const router = httpRouter();
  auth.addHttpRoutes(router);
  return router;
};

export default createHttpRouter();
