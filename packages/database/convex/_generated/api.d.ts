/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ResendOTP from "../ResendOTP.js";
import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as authz from "../authz.js";
import type * as crons from "../crons.js";
import type * as drafts from "../drafts.js";
import type * as formModel from "../formModel.js";
import type * as forms from "../forms.js";
import type * as http from "../http.js";
import type * as invites from "../invites.js";
import type * as pilotDefinitions from "../pilotDefinitions.js";
import type * as rateLimits from "../rateLimits.js";
import type * as seed from "../seed.js";
import type * as submissions from "../submissions.js";
import type * as uploads from "../uploads.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ResendOTP: typeof ResendOTP;
  admin: typeof admin;
  auth: typeof auth;
  authz: typeof authz;
  crons: typeof crons;
  drafts: typeof drafts;
  formModel: typeof formModel;
  forms: typeof forms;
  http: typeof http;
  invites: typeof invites;
  pilotDefinitions: typeof pilotDefinitions;
  rateLimits: typeof rateLimits;
  seed: typeof seed;
  submissions: typeof submissions;
  uploads: typeof uploads;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
