/**
 * Unit tests for Alarm endpoints
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReolinkClient } from "./reolink.js";
import { getAlarm, getMdState } from "./alarm.js";
import { ReolinkHttpError } from "./types.js";

describe("Alarm endpoints", () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: ReolinkClient;

  const createLoginResponse = () => ({
    ok: true,
    json: vi.fn().mockResolvedValue([
      {
        code: 0,
        value: {
          Token: { name: "test-token", leaseTime: 3600 },
        },
      },
    ]),
  });

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.clearAllMocks();
    client = new ReolinkClient({
      host: "192.168.1.100",
      username: "admin",
      password: "password",
      fetch: mockFetch as unknown as typeof fetch,
    });
  });

  describe("getAlarm", () => {
    it("should get alarm information", async () => {
      const alarmResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            code: 0,
            value: {
              Alarm: {
                enable: 1,
                type: "motion",
                sensitivity: 50,
              },
            },
          },
        ]),
      };

      mockFetch.mockResolvedValueOnce(createLoginResponse());
      mockFetch.mockResolvedValueOnce(alarmResponse);

      await client.login();
      const result = await getAlarm(client);

      expect(result).toHaveProperty("Alarm");
      expect(mockFetch).toHaveBeenCalledTimes(2);

      const [, requestArgs] = mockFetch.mock.calls[1];
      const body = JSON.parse(String(requestArgs?.body ?? "[]"));
      expect(body[0].cmd).toBe("GetAlarm");
      expect(body[0].param).toEqual({});
    });

    it("should return alarm configuration with disabled state", async () => {
      const alarmResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            code: 0,
            value: {
              Alarm: {
                enable: 0,
                type: "none",
                sensitivity: 0,
              },
            },
          },
        ]),
      };

      mockFetch.mockResolvedValueOnce(createLoginResponse());
      mockFetch.mockResolvedValueOnce(alarmResponse);

      await client.login();
      const result = await getAlarm(client);

      expect(result.Alarm).toBeDefined();
      expect(result.Alarm).toHaveProperty("enable", 0);
    });
  });

  describe("getMdState", () => {
    it("should get motion detection state for a channel", async () => {
      const mdStateResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            code: 0,
            value: {
              MdState: {
                channel: 0,
                state: 1,
              },
            },
          },
        ]),
      };

      mockFetch.mockResolvedValueOnce(createLoginResponse());
      mockFetch.mockResolvedValueOnce(mdStateResponse);

      await client.login();
      const result = await getMdState(client, 0);

      expect(result).toHaveProperty("MdState");
      expect(mockFetch).toHaveBeenCalledTimes(2);

      const [, requestArgs] = mockFetch.mock.calls[1];
      const body = JSON.parse(String(requestArgs?.body ?? "[]"));
      expect(body[0].cmd).toBe("GetMdState");
      expect(body[0].param).toEqual({ channel: 0 });
    });

    it("should get motion detection state for different channels", async () => {
      const mdStateResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            code: 0,
            value: {
              MdState: {
                channel: 2,
                state: 0,
              },
            },
          },
        ]),
      };

      mockFetch.mockResolvedValueOnce(createLoginResponse());
      mockFetch.mockResolvedValueOnce(mdStateResponse);

      await client.login();
      const result = await getMdState(client, 2);

      expect(result.MdState).toHaveProperty("channel", 2);
      expect(result.MdState).toHaveProperty("state", 0);

      const [, requestArgs] = mockFetch.mock.calls[1];
      const body = JSON.parse(String(requestArgs?.body ?? "[]"));
      expect(body[0].param).toEqual({ channel: 2 });
    });

    it("should handle motion detected state", async () => {
      const mdStateResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            code: 0,
            value: {
              MdState: {
                channel: 0,
                state: 1,
              },
            },
          },
        ]),
      };

      mockFetch.mockResolvedValueOnce(createLoginResponse());
      mockFetch.mockResolvedValueOnce(mdStateResponse);

      await client.login();
      const result = await getMdState(client, 0);

      expect(result.MdState).toHaveProperty("state", 1);
    });

    it("should handle no motion detected state", async () => {
      const mdStateResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            code: 0,
            value: {
              MdState: {
                channel: 0,
                state: 0,
              },
            },
          },
        ]),
      };

      mockFetch.mockResolvedValueOnce(createLoginResponse());
      mockFetch.mockResolvedValueOnce(mdStateResponse);

      await client.login();
      const result = await getMdState(client, 0);

      expect(result.MdState).toHaveProperty("state", 0);
    });

    it("should handle API errors gracefully", async () => {
      const loginResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            code: 0,
            value: {
              Token: { name: "test-token", leaseTime: 3600 },
            },
          },
        ]),
      };

      const errorResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            code: 1,
            error: {
              rspCode: -18,
              detail: "Channel not found",
            },
          },
        ]),
      };

      mockFetch
        .mockResolvedValueOnce(loginResponse)
        .mockResolvedValueOnce(errorResponse);

      await expect(getMdState(client, 99)).rejects.toThrow(ReolinkHttpError);
    });

    it("should handle channel 0 (first channel)", async () => {
      const mdStateResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            code: 0,
            value: {
              MdState: {
                channel: 0,
                state: 1,
              },
            },
          },
        ]),
      };

      mockFetch.mockResolvedValueOnce(createLoginResponse());
      mockFetch.mockResolvedValueOnce(mdStateResponse);

      await client.login();
      const result = await getMdState(client, 0);

      expect(result.MdState).toHaveProperty("channel", 0);
    });
  });
});
