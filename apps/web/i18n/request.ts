import { getRequestConfig } from "next-intl/server";

import messages from "../messages/tr.json";

/** Single locale, no locale prefix in URLs (plan 10.2: next-intl, tr). */
export const LOCALE = "tr";
export const TIME_ZONE = "Europe/Istanbul";

export default getRequestConfig(() => ({
  locale: LOCALE,
  timeZone: TIME_ZONE,
  messages,
}));
