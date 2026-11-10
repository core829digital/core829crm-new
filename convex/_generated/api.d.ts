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
import type * as backup from "../backup.js";
import type * as clients from "../clients.js";
import type * as conversations from "../conversations.js";
import type * as crons from "../crons.js";
import type * as dailyActivity from "../dailyActivity.js";
import type * as dedupe from "../dedupe.js";
import type * as invoices from "../invoices.js";
import type * as leads from "../leads.js";
import type * as leadsImport from "../leadsImport.js";
import type * as lib_csv from "../lib/csv.js";
import type * as lib_leadSheet from "../lib/leadSheet.js";
import type * as lib_authConst from "../lib/authConst.js";
import type * as lib_authz from "../lib/authz.js";
import type * as lib_catalog from "../lib/catalog.js";
import type * as lib_dedupe from "../lib/dedupe.js";
import type * as lib_jwt from "../lib/jwt.js";
import type * as lib_password from "../lib/password.js";
import type * as lib_sessionSecret from "../lib/sessionSecret.js";
import type * as market from "../market.js";
import type * as messages from "../messages.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as notify from "../notify.js";
import type * as portalImport from "../portalImport.js";
import type * as projects from "../projects.js";
import type * as revenueGoal from "../revenueGoal.js";
import type * as seed from "../seed.js";
import type * as services from "../services.js";
import type * as sessions from "../sessions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activityLogs: typeof activityLogs;
  announcements: typeof announcements;
  backup: typeof backup;
  clients: typeof clients;
  conversations: typeof conversations;
  crons: typeof crons;
  dailyActivity: typeof dailyActivity;
  dedupe: typeof dedupe;
  invoices: typeof invoices;
  leads: typeof leads;
  leadsImport: typeof leadsImport;
  "lib/csv": typeof lib_csv;
  "lib/leadSheet": typeof lib_leadSheet;
  "lib/authConst": typeof lib_authConst;
  "lib/authz": typeof lib_authz;
  "lib/catalog": typeof lib_catalog;
  "lib/dedupe": typeof lib_dedupe;
  "lib/jwt": typeof lib_jwt;
  "lib/password": typeof lib_password;
  "lib/sessionSecret": typeof lib_sessionSecret;
  market: typeof market;
  messages: typeof messages;
  migrations: typeof migrations;
  notifications: typeof notifications;
  notify: typeof notify;
  portalImport: typeof portalImport;
  projects: typeof projects;
  revenueGoal: typeof revenueGoal;
  seed: typeof seed;
  services: typeof services;
  sessions: typeof sessions;
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
