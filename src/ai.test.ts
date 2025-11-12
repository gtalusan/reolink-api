/**
 * Unit tests for AI endpoints
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReolinkClient } from "./reolink.js";
import { getAiCfg, getAiState } from "./ai.js";
import { ReolinkHttpError } from "./types.js";

describe("AI endpoints", () => {
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

  describe("getAiCfg", () => {
    it("should get AI configuration for a channel", async () => {
      const aiCfgResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            code: 0,
            value: {
              AiCfg: {
                channel: 0,
                people: { enable: 1, sensitivity: 50 },
                vehicle: { enable: 1, sensitivity: 50 },
              },
            },
          },
        ]),
      };

      mockFetch.mockResolvedValueOnce(createLoginResponse());
      mockFetch.mockResolvedValueOnce(aiCfgResponse);

      await client.login();
      const result = await getAiCfg(client, 0);

      expect(result).toHaveProperty("AiCfg");
      expect(mockFetch).toHaveBeenCalledTimes(2);

      const [, requestArgs] = mockFetch.mock.calls[1];
      const body = JSON.parse(String(requestArgs?.body ?? "[]"));
      expect(body[0].cmd).toBe("GetAiCfg");
      expect(body[0].param).toEqual({ channel: 0 });
    });

    it("should handle different channel numbers", async () => {
      const aiCfgResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            code: 0,
            value: {
              AiCfg: {
                channel: 3,
                people: { enable: 0, sensitivity: 30 },
              },
            },
          },
        ]),
      };

      mockFetch.mockResolvedValueOnce(createLoginResponse());
      mockFetch.mockResolvedValueOnce(aiCfgResponse);

      await client.login();
      const result = await getAiCfg(client, 3);

      const [, requestArgs] = mockFetch.mock.calls[1];
      const body = JSON.parse(String(requestArgs?.body ?? "[]"));
      expect(body[0].param).toEqual({ channel: 3 });
      expect((result as AiCfgResult).AiCfg.channel).toBe(3);
    });

    it("should handle empty or minimal AI configuration", async () => {
      const aiCfgResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            code: 0,
            value: {
              AiCfg: {
                channel: 0,
              },
            },
          },
        ]),
      };

      mockFetch.mockResolvedValueOnce(createLoginResponse());
      mockFetch.mockResolvedValueOnce(aiCfgResponse);

      await client.login();
      const result = await getAiCfg(client, 0);

      expect(result).toHaveProperty("AiCfg");
      expect((result as Record<string, unknown>).AiCfg.channel).toBe(0);
    });

    it("should handle AI configuration with multiple detection types", async () => {
      const aiCfgResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            code: 0,
            value: {
              AiCfg: {
                channel: 0,
                people: { enable: 1, sensitivity: 50 },
                vehicle: { enable: 1, sensitivity: 60 },
                pet: { enable: 0, sensitivity: 40 },
                face: { enable: 1, sensitivity: 70 },
              },
            },
          },
        ]),
      };

      mockFetch.mockResolvedValueOnce(createLoginResponse());
      mockFetch.mockResolvedValueOnce(aiCfgResponse);

      await client.login();
      const result = await getAiCfg(client, 0);

      expect((result as Record<string, unknown>).AiCfg.people).toEqual({ enable: 1, sensitivity: 50 });
      expect((result as Record<string, unknown>).AiCfg.vehicle).toEqual({ enable: 1, sensitivity: 60 });
      expect((result as Record<string, unknown>).AiCfg.pet).toEqual({ enable: 0, sensitivity: 40 });
      expect((result as Record<string, unknown>).AiCfg.face).toEqual({ enable: 1, sensitivity: 70 });
    });
  });

  describe("getAiState", () => {
    it("should get AI state for a channel", async () => {
      const aiStateResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            code: 0,
            value: {
              AiState: {
                channel: 0,
                people: { alarmState: 0 },
                vehicle: { alarmState: 1 },
              },
            },
          },
        ]),
      };

      mockFetch.mockResolvedValueOnce(createLoginResponse());
      mockFetch.mockResolvedValueOnce(aiStateResponse);

      await client.login();
      const result = await getAiState(client, 0);

      expect(result).toHaveProperty("AiState");
      expect(mockFetch).toHaveBeenCalledTimes(2);

      const [, requestArgs] = mockFetch.mock.calls[1];
      const body = JSON.parse(String(requestArgs?.body ?? "[]"));
      expect(body[0].cmd).toBe("GetAiState");
      expect(body[0].param).toEqual({ channel: 0 });
    });

    it("should handle different channel numbers", async () => {
      const aiStateResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            code: 0,
            value: {
              AiState: {
                channel: 2,
                people: { alarmState: 1 },
              },
            },
          },
        ]),
      };

      mockFetch.mockResolvedValueOnce(createLoginResponse());
      mockFetch.mockResolvedValueOnce(aiStateResponse);

      await client.login();
      const result = await getAiState(client, 2);

      const [, requestArgs] = mockFetch.mock.calls[1];
      const body = JSON.parse(String(requestArgs?.body ?? "[]"));
      expect(body[0].param).toEqual({ channel: 2 });
      expect((result as Record<string, unknown>).AiState.channel).toBe(2);
    });

    it("should throw ReolinkHttpError on API error", async () => {
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
              rspCode: -6,
              detail: "Channel not found",
            },
          },
        ]),
      };

      mockFetch
        .mockResolvedValueOnce(loginResponse)
        .mockResolvedValueOnce(errorResponse);

      await expect(getAiState(client, 99)).rejects.toThrow(ReolinkHttpError);
    });

    it("should handle inactive AI state (all alarms off)", async () => {
      const aiStateResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            code: 0,
            value: {
              AiState: {
                channel: 0,
                people: { alarmState: 0 },
                vehicle: { alarmState: 0 },
                pet: { alarmState: 0 },
              },
            },
          },
        ]),
      };

      mockFetch.mockResolvedValueOnce(createLoginResponse());
      mockFetch.mockResolvedValueOnce(aiStateResponse);

      await client.login();
      const result = await getAiState(client, 0);

      expect((result as Record<string, unknown>).AiState.people.alarmState).toBe(0);
      expect((result as Record<string, unknown>).AiState.vehicle.alarmState).toBe(0);
      expect((result as Record<string, unknown>).AiState.pet.alarmState).toBe(0);
    });

    it("should handle active AI state (multiple alarms triggered)", async () => {
      const aiStateResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            code: 0,
            value: {
              AiState: {
                channel: 0,
                people: { alarmState: 1 },
                vehicle: { alarmState: 1 },
                pet: { alarmState: 0 },
                face: { alarmState: 1 },
              },
            },
          },
        ]),
      };

      mockFetch.mockResolvedValueOnce(createLoginResponse());
      mockFetch.mockResolvedValueOnce(aiStateResponse);

      await client.login();
      const result = await getAiState(client, 0);

      expect((result as Record<string, unknown>).AiState.people.alarmState).toBe(1);
      expect((result as Record<string, unknown>).AiState.vehicle.alarmState).toBe(1);
      expect((result as Record<string, unknown>).AiState.pet.alarmState).toBe(0);
      expect((result as Record<string, unknown>).AiState.face.alarmState).toBe(1);
    });

    it("should handle minimal AI state response", async () => {
      const aiStateResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            code: 0,
            value: {
              AiState: {
                channel: 0,
              },
            },
          },
        ]),
      };

      mockFetch.mockResolvedValueOnce(createLoginResponse());
      mockFetch.mockResolvedValueOnce(aiStateResponse);

      await client.login();
      const result = await getAiState(client, 0);

      expect(result).toHaveProperty("AiState");
      expect((result as Record<string, unknown>).AiState.channel).toBe(0);
    });
  });

  describe("integration scenarios", () => {
    it("should successfully call both getAiCfg and getAiState in sequence", async () => {
      const aiCfgResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            code: 0,
            value: {
              AiCfg: {
                channel: 0,
                people: { enable: 1, sensitivity: 50 },
              },
            },
          },
        ]),
      };

      const aiStateResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            code: 0,
            value: {
              AiState: {
                channel: 0,
                people: { alarmState: 1 },
              },
            },
          },
        ]),
      };

      mockFetch.mockResolvedValueOnce(createLoginResponse());
      mockFetch.mockResolvedValueOnce(aiCfgResponse);
      mockFetch.mockResolvedValueOnce(aiStateResponse);

      await client.login();
      const config = await getAiCfg(client, 0);
      const state = await getAiState(client, 0);

      expect((config as Record<string, unknown>).AiCfg.people.enable).toBe(1);
      expect((state as Record<string, unknown>).AiState.people.alarmState).toBe(1);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});
