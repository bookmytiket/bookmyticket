/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as apiKeys from "../apiKeys.js";
import type * as auth from "../auth.js";
import type * as bookings from "../bookings.js";
import type * as emailSettings from "../emailSettings.js";
import type * as emailTemplates from "../emailTemplates.js";
import type * as events from "../events.js";
import type * as feeSettings from "../feeSettings.js";
import type * as homeSettings from "../homeSettings.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as organisers from "../organisers.js";
import type * as paymentGateways from "../paymentGateways.js";
import type * as policies from "../policies.js";
import type * as promotions from "../promotions.js";
import type * as seoSettings from "../seoSettings.js";
import type * as siteBranding from "../siteBranding.js";
import type * as ssoSettings from "../ssoSettings.js";
import type * as supportTickets from "../supportTickets.js";
import type * as systemConfig from "../systemConfig.js";
import type * as ticketSettings from "../ticketSettings.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  apiKeys: typeof apiKeys;
  auth: typeof auth;
  bookings: typeof bookings;
  emailSettings: typeof emailSettings;
  emailTemplates: typeof emailTemplates;
  events: typeof events;
  feeSettings: typeof feeSettings;
  homeSettings: typeof homeSettings;
  migrations: typeof migrations;
  notifications: typeof notifications;
  organisers: typeof organisers;
  paymentGateways: typeof paymentGateways;
  policies: typeof policies;
  promotions: typeof promotions;
  seoSettings: typeof seoSettings;
  siteBranding: typeof siteBranding;
  ssoSettings: typeof ssoSettings;
  supportTickets: typeof supportTickets;
  systemConfig: typeof systemConfig;
  ticketSettings: typeof ticketSettings;
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
