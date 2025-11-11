/**
 * Example: PTZ (Pan-Tilt-Zoom) control
 * 
 * This example demonstrates various PTZ capabilities on channel 0:
 * - Listing configured presets
 * - Moving to presets
 * - Guard mode (auto-return to position)
 * - Patrol routes (automated movement between presets)
 * - Absolute position control
 * 
 * Run with: npx tsx examples/ptz.ts
 */

import { ReolinkClient } from "../src/reolink.js";
import {
  getPtzPreset,
  setPtzPreset,
  ptzCtrl,
  getPtzGuard,
  setPtzGuard,
  getPtzPatrol,
  setPtzPatrol,
  startPatrol,
  stopPatrol,
} from "../src/ptz.js";

const CHANNEL = 0; // Channel 0 (first camera)

async function main() {
  const host = process.env.REOLINK_NVR_HOST || "192.168.1.100";
  const username = process.env.REOLINK_NVR_USER || "admin";
  const password = process.env.REOLINK_NVR_PASS || "password";

  const client = new ReolinkClient({
    host,
    username,
    password,
  });

  try {
    await client.login();
    console.log("✓ Connected to Reolink device");

    // 1. List current presets
    console.log("\n=== Current PTZ Presets ===");
    const presets = await getPtzPreset(client, CHANNEL);
    if (presets.preset && presets.preset.length > 0) {
      // Filter only enabled presets with names
      const enabledPresets = presets.preset.filter((p) => p.enable === 1 && p.name);
      if (enabledPresets.length > 0) {
        enabledPresets.forEach((p) => {
          console.log(`  Preset ${p.id}: ${p.name}`);
        });
      } else {
        console.log("  No enabled presets configured");
      }
    } else {
      console.log("  No presets configured");
    }

    // 2. Set a new preset (use an unused slot)
    console.log("\n=== Setting Preset ===");
    console.log("Note: Camera must be positioned first before setting a preset");
    console.log("Skipping SetPtzPreset - requires manual camera positioning first");
    
    // Example of how to set a preset after positioning:
    // await setPtzPreset(client, CHANNEL, 10, "My Custom Position");

    // 3. PTZ Movement - Go to an existing preset
    console.log("\n=== Moving to Preset ===");
    if (presets.preset && presets.preset.length > 0) {
      const firstEnabled = presets.preset.find((p) => p.enable === 1);
      if (firstEnabled) {
        console.log(`Attempting to move to preset ID ${firstEnabled.id}...`);
        await ptzCtrl(client, {
          channel: CHANNEL,
          op: "GotoPreset",
          presetId: firstEnabled.id,
        });
        console.log(`✓ Moving to preset ${firstEnabled.id} (${firstEnabled.name})...`);
        
        // Wait a moment for movement
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } else {
        console.log("  No enabled presets to move to");
      }
    }

    // 4. PTZ Movement - Manual control (simplified example)
    console.log("\n=== Manual PTZ Control ===");
    console.log("Note: Manual PTZ control requires direction parameters");
    console.log("Skipping manual control demo - use ptzCtrl with specific direction commands");
    
    // Example manual control would require additional parameters:
    // await ptzCtrl(client, { channel: CHANNEL, op: "Right", speed: 20 });
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    // await ptzCtrl(client, { channel: CHANNEL, op: "Stop" });

    // 5. PTZ Guard Mode
    console.log("\n=== PTZ Guard Mode ===");
    const guard = await getPtzGuard(client, CHANNEL);
    console.log(`  Current status: ${guard.benable === 1 ? "Enabled" : "Disabled"}`);
    console.log(`  Timeout: ${guard.timeout} seconds`);
    console.log(`  Position set: ${guard.bexistPos === 1 ? "Yes" : "No"}`);

    // Enable guard mode with current position
    await setPtzGuard(client, CHANNEL, {
      benable: 1,
      timeout: 60,
      cmdStr: "setPos",
      bSaveCurrentPos: 1,
    });
    console.log("✓ Guard mode enabled (will return to this position after 60s)");

    // 6. PTZ Patrol
    console.log("\n=== PTZ Patrol Routes ===");
    const patrols = await getPtzPatrol(client, CHANNEL);
    if (patrols.length > 0) {
      patrols.forEach((patrol) => {
        console.log(`  Patrol ${patrol.id}: ${patrol.enable === 1 ? "Enabled" : "Disabled"}`);
        console.log(`    Presets: ${patrol.preset.map((p) => p.id).join(", ")}`);
      });
    } else {
      console.log("  No patrol routes configured");
    }

    // Create a simple patrol route using existing presets
    console.log("\n=== Creating Patrol Route ===");
    if (presets.preset && presets.preset.length > 0) {
      const enabledPresets = presets.preset.filter((p) => p.enable === 1);
      if (enabledPresets.length >= 2) {
        await setPtzPatrol(client, CHANNEL, {
          channel: CHANNEL,
          id: 0,
          enable: 1,
          preset: [
            { id: enabledPresets[0].id, speed: 32, dwellTime: 5 }, // Stay 5 seconds
            { id: enabledPresets[1].id, speed: 32, dwellTime: 5 }, // Stay 5 seconds
          ],
        });
        console.log(`✓ Patrol route 0 configured with presets ${enabledPresets[0].id} and ${enabledPresets[1].id}`);

        // Start the patrol
        await startPatrol(client, CHANNEL, 0);
        console.log("✓ Patrol started");

        // Wait a bit, then stop
        await new Promise((resolve) => setTimeout(resolve, 5000));
        
        await stopPatrol(client, CHANNEL, 0);
        console.log("✓ Patrol stopped");
      } else {
        console.log("  Need at least 2 enabled presets to create a patrol route");
      }
    } else {
      console.log("  No presets available for patrol");
    }

    // 7. Absolute position control (if supported)
    console.log("\n=== Absolute Position Control ===");
    try {
      await ptzCtrl(client, {
        channel: CHANNEL,
        op: "ToPos",
        x: 0,
        y: 0,
        z: 0,
      });
      console.log("✓ Moved to center position (x:0, y:0, z:0)");
    } catch (error) {
      console.log("  (Not supported on this device)");
    }

    await client.close();
    console.log("\n✓ Done");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
