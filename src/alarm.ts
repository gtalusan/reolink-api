/**
 * Alarm and motion detection endpoints
 */

import { ReolinkClient } from "./reolink.js";

/**
 * Response structure for alarm information requests.
 * Contains alarm configuration including enable status, type, and sensitivity.
 *
 * @example
 * ```typescript
 * {
 *   Alarm: {
 *     enable: 1,
 *     type: "motion",
 *     sensitivity: 50
 *   }
 * }
 * ```
 */
export interface AlarmResponse {
  [key: string]: unknown;
}

/**
 * Response structure for motion detection state queries.
 * Indicates the current motion detection state for a specific channel.
 *
 * @example
 * ```typescript
 * {
 *   MdState: {
 *     channel: 0,
 *     state: 1  // 1 = motion detected, 0 = no motion
 *   }
 * }
 * ```
 */
export interface MdStateResponse {
  [key: string]: unknown;
}

/**
 * Retrieves alarm configuration from the device.
 *
 * This function fetches the current alarm settings, including whether alarms
 * are enabled, the alarm type, and sensitivity settings. The exact response
 * structure varies by device model and firmware version.
 *
 * @param client - An authenticated ReolinkClient instance
 * @returns Promise resolving to the alarm configuration object
 *
 * @throws {ReolinkHttpError} When the API request fails or returns an error code
 *
 * @example
 * ```typescript
 * const client = new ReolinkClient({ host: "192.168.1.100", username: "admin", password: "pass" });
 * await client.login();
 *
 * const alarmConfig = await getAlarm(client);
 * console.log("Alarm enabled:", alarmConfig.Alarm?.enable);
 *
 * await client.close();
 * ```
 */
export async function getAlarm(client: ReolinkClient): Promise<AlarmResponse> {
  return client.api<AlarmResponse>("GetAlarm", {});
}

/**
 * Retrieves the current motion detection state for a specific channel.
 *
 * This function queries the device for the real-time motion detection status
 * on the specified channel. The state indicates whether motion is currently
 * being detected (1) or not (0). This is useful for monitoring live detection
 * events without polling the full event stream.
 *
 * @param client - An authenticated ReolinkClient instance
 * @param channel - Zero-based channel number to query (0 for first channel)
 * @returns Promise resolving to the motion detection state object
 *
 * @throws {ReolinkHttpError} When the API request fails or returns an error code
 *
 * @example
 * ```typescript
 * const client = new ReolinkClient({ host: "192.168.1.100", username: "admin", password: "pass" });
 * await client.login();
 *
 * const mdState = await getMdState(client, 0);
 * if (mdState.MdState?.state === 1) {
 *   console.log("Motion detected on channel 0!");
 * } else {
 *   console.log("No motion detected");
 * }
 *
 * await client.close();
 * ```
 */
export async function getMdState(
  client: ReolinkClient,
  channel: number
): Promise<MdStateResponse> {
  return client.api<MdStateResponse>("GetMdState", {
    channel,
  });
}

