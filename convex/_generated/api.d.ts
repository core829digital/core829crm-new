/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activityLogs from "../activityLogs.js";
import type * as announcements from "../announcements.js";
import type * as clients from "../clients.js";
import type * as dailyActivity from "../dailyActivity.js";
import type * as invoices from "../invoices.js";
import type * as leads from "../leads.js";
import type * as market from "../market.js";
import type * as migrations from "../migrations.js";
import type * as projects from "../projects.js";
import type * as revenueGoal from "../revenueGoal.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activityLogs: typeof activityLogs;
  announcements: typeof announcements;
  clients: typeof clients;
  dailyActivity: typeof dailyActivity;
  invoices: typeof invoices;
  leads: typeof leads;
  market: typeof market;
  migrations: typeof migrations;
  projects: typeof projects;
  revenueGoal: typeof revenueGoal;
  seed: typeof seed;
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

export declare const components: {};
