/**
 * Example: Create 360-degree panorama using PTZ
 * 
 * This example demonstrates:
 * - Moving PTZ camera through a 360-degree rotation
 * - Capturing snapshots at regular intervals
 * - Saving individual frames and metadata for stitching
 * 
 * Note: Actual image stitching requires additional libraries like:
 * - sharp (npm install sharp) for image processing
 * - opencv4nodejs for advanced stitching
 * 
 * This example captures the frames and provides metadata.
 * Use external tools like Hugin, PTGui, or AutoStitch for final panorama.
 * 
 * Run with: npx tsx extras/panorama/panorama.ts
 */

import { ReolinkClient } from "../../src/reolink.js";
import { ptzCtrl } from "../../src/ptz.js";
import { snapToFile } from "../../src/snapshot.js";
import { promises as fs } from "fs";
import * as path from "path";

const CHANNEL = 0; // Channel 0 (first camera)

interface PanoramaConfig {
  channel: number;
  numFrames: number;        // Number of snapshots (e.g., 12 = 30° per frame)
  settleMs: number;         // Time to wait after moving before snapshot
  outputDir: string;        // Directory to save frames
  panSpeed: number;         // PTZ pan speed (1-64)
}

interface FrameMetadata {
  frame: number;
  angle: number;            // Approximate angle in degrees
  filename: string;
  timestamp: string;
}

/**
 * Calculate approximate pan position for a given angle
 * PTZ pan typically ranges from -180 to +180 degrees
 */
function calculatePanPosition(angleDegrees: number): number {
  // Normalize to -180 to +180 range
  const normalized = ((angleDegrees + 180) % 360) - 180;
  return normalized;
}

/**
 * Wait for a specified number of milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Capture a 360-degree panorama using continuous pan
 */
async function capture360Panorama(
  client: ReolinkClient,
  config: PanoramaConfig
): Promise<FrameMetadata[]> {
  const metadata: FrameMetadata[] = [];
  const degreesPerFrame = 360 / config.numFrames;

  console.log(`\n📸 Capturing 360° panorama:`);
  console.log(`  Frames: ${config.numFrames}`);
  console.log(`  Degrees per frame: ${degreesPerFrame}°`);
  console.log(`  Output: ${config.outputDir}/`);

  // Create output directory
  await fs.mkdir(config.outputDir, { recursive: true });

  // Calculate pan duration for each segment
  // This is approximate and may need calibration for your camera
  const panDurationMs = 1500; // Time to pan for each segment

  console.log(`\n📍 Starting 360° rotation...`);

  // Capture frames during rotation
  for (let frame = 0; frame < config.numFrames; frame++) {
    const angle = frame * degreesPerFrame;
    const filename = `frame_${String(frame).padStart(3, "0")}.jpg`;
    const filepath = path.join(config.outputDir, filename);

    console.log(`\n📍 Frame ${frame + 1}/${config.numFrames} (${angle.toFixed(1)}°)`);

    if (frame > 0) {
      // Start panning right
      console.log(`  Panning right...`);
      await ptzCtrl(client, {
        channel: config.channel,
        op: "Right",
        speed: config.panSpeed,
      });

      // Pan for calculated duration
      await delay(panDurationMs);

      // Stop panning
      await ptzCtrl(client, {
        channel: config.channel,
        op: "Stop",
      });

      // Wait for camera to settle
      console.log(`  Waiting ${config.settleMs}ms for camera to settle...`);
      await delay(config.settleMs);
    } else {
      // First frame - just capture without moving
      await delay(1000); // Initial settle time
    }

    // Capture snapshot
    console.log(`  📷 Capturing snapshot...`);
    try {
      await snapToFile(client, filepath, config.channel);
      console.log(`  ✓ Saved: ${filename}`);

      // Store metadata
      metadata.push({
        frame,
        angle,
        filename,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`  ✗ Error capturing frame: ${error}`);
    }
  }

  return metadata;
}

/**
 * Create a simple 360-degree panorama using presets
 * This is more reliable as it uses pre-configured positions
 */
async function capture360UsingPresets(
  client: ReolinkClient,
  config: PanoramaConfig,
  presetIds: number[]
): Promise<FrameMetadata[]> {
  const metadata: FrameMetadata[] = [];
  const degreesPerFrame = 360 / presetIds.length;

  console.log(`\n📸 Capturing 360° panorama using ${presetIds.length} presets:`);
  console.log(`  Output: ${config.outputDir}/`);

  // Create output directory
  await fs.mkdir(config.outputDir, { recursive: true });

  // Capture frame at each preset
  for (let i = 0; i < presetIds.length; i++) {
    const presetId = presetIds[i];
    const angle = i * degreesPerFrame;
    const filename = `preset_${String(i).padStart(3, "0")}_id${presetId}.jpg`;
    const filepath = path.join(config.outputDir, filename);

    console.log(`\n📍 Preset ${i + 1}/${presetIds.length} (ID: ${presetId}, ~${angle.toFixed(1)}°)`);

    // Move to preset
    console.log(`  Moving to preset ${presetId}...`);
    await ptzCtrl(client, {
      channel: config.channel,
      op: "GotoPreset",
      presetId,
    });

    // Wait for camera to settle
    console.log(`  Waiting ${config.settleMs}ms for camera to settle...`);
    await delay(config.settleMs);

    // Capture snapshot
    console.log(`  📷 Capturing snapshot...`);
    try {
      await snapToFile(client, filepath, config.channel);
      console.log(`  ✓ Saved: ${filename}`);

      metadata.push({
        frame: i,
        angle,
        filename,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`  ✗ Error capturing frame: ${error}`);
    }
  }

  return metadata;
}

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

    const config: PanoramaConfig = {
      channel: CHANNEL,
      numFrames: 12,           // 12 frames = 30° per frame
      settleMs: 2000,          // 2 seconds to settle after movement
      outputDir: "./panorama", // Output directory
      panSpeed: 20,            // Medium speed
    };

    // Choose capture method:
    // Method 1: Use absolute positioning (may need calibration)
    // const metadata = await capture360Panorama(client, config);

    // Method 2: Use presets (more reliable if you have them configured)
    // Example: If you have 4 presets positioned at N, E, S, W
    const usePresets = false;
    let metadata: FrameMetadata[];

    if (usePresets) {
      // Replace with your actual preset IDs positioned around 360°
      const presetIds = [0, 1, 2, 3]; // Example: 4 presets at 90° intervals
      metadata = await capture360UsingPresets(client, config, presetIds);
    } else {
      metadata = await capture360Panorama(client, config);
    }

    // Save metadata to JSON file
    const metadataPath = path.join(config.outputDir, "metadata.json");
    await fs.writeFile(
      metadataPath,
      JSON.stringify(
        {
          config,
          frames: metadata,
          totalFrames: metadata.length,
          captureDate: new Date().toISOString(),
        },
        null,
        2
      )
    );
    console.log(`\n✓ Metadata saved: ${metadataPath}`);

    // Create README with stitching instructions
    const readmePath = path.join(config.outputDir, "README.txt");
    const readmeContent = `360° Panorama Capture
=====================

Captured: ${new Date().toISOString()}
Frames: ${metadata.length}
Channel: ${config.channel}

STITCHING INSTRUCTIONS
----------------------

Method 1: Using Hugin (Free, Cross-platform)
1. Install Hugin: https://hugin.sourceforge.io/
2. Open Hugin and add all frame_*.jpg files
3. Click "Align" to detect control points
4. Click "Create Panorama" to stitch
5. Export as JPEG or TIFF

Method 2: Using Microsoft ICE (Free, Windows only)
1. Download from: https://www.microsoft.com/en-us/research/product/computational-photography-applications/image-composite-editor/
2. Drag and drop all frame_*.jpg files
3. Click "Stitch" and export

Method 3: Using Python + OpenCV
\`\`\`python
import cv2
import glob

# Load images
images = [cv2.imread(f) for f in sorted(glob.glob('frame_*.jpg'))]

# Create stitcher
stitcher = cv2.Stitcher_create()

# Stitch images
status, panorama = stitcher.stitch(images)

if status == cv2.Stitcher_OK:
    cv2.imwrite('panorama.jpg', panorama)
    print("Panorama created successfully!")
else:
    print(f"Stitching failed with status: {status}")
\`\`\`

Method 4: Command-line with Hugin tools
\`\`\`bash
# Generate project file
pto_gen -o project.pto frame_*.jpg

# Find control points
cpfind -o project.pto project.pto

# Optimize
autooptimiser -a -l -s -o project.pto project.pto

# Stitch
nona -o panorama project.pto
enblend -o final_panorama.jpg panorama*.tif
\`\`\`

FILES
-----
${metadata.map((m) => `${m.filename} - ${m.angle.toFixed(1)}°`).join("\n")}

metadata.json - Detailed capture metadata
`;

    await fs.writeFile(readmePath, readmeContent);
    console.log(`✓ Instructions saved: ${readmePath}`);

    await client.close();
    console.log("\n✅ Done! Panorama frames captured.");
    console.log(`\n📁 Output directory: ${config.outputDir}/`);
    console.log(`   ${metadata.length} frames captured`);
    console.log(`\n💡 See ${readmePath} for stitching instructions`);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
