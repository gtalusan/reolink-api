# 360° Panorama Capture Tool

This tool uses a PTZ camera to capture a full 360-degree panorama by rotating the camera and taking snapshots at regular intervals.

## Features

- **Automatic rotation**: Continuously pans the camera in a circle
- **Configurable frames**: Set the number of snapshots (e.g., 12 frames = 30° per frame)
- **Two capture methods**:
  - Continuous pan (default) - Uses directional PTZ commands
  - Preset-based - Uses pre-configured camera positions
- **Complete metadata**: JSON file with angles, timestamps, and filenames
- **Stitching instructions**: Includes README with multiple stitching options

## Usage

### Basic Usage

```bash
npx tsx extras/panorama/panorama.ts
```

### Configuration

Edit the `config` object in `panorama.ts`:

```typescript
const config: PanoramaConfig = {
  channel: 0,           // Camera channel (0-based)
  numFrames: 12,        // Number of snapshots (12 = 30° per frame)
  settleMs: 2000,       // Time to wait after movement (ms)
  outputDir: "./output", // Output directory
  panSpeed: 20,         // PTZ pan speed (1-64)
};
```

### Using Presets (More Reliable)

If you have presets configured in a circle, use preset-based capture:

```typescript
const usePresets = true;
const presetIds = [0, 1, 2, 3]; // Your preset IDs positioned around 360°
```

## Output

The tool creates:
- `frame_000.jpg` through `frame_011.jpg` - Individual snapshots
- `metadata.json` - Capture details with timestamps and angles
- `README.txt` - Stitching instructions for various tools

## Stitching the Panorama

### Method 1: Hugin (Free, Cross-platform)
1. Install Hugin: https://hugin.sourceforge.io/
2. Open Hugin and add all `frame_*.jpg` files
3. Click "Align" to detect control points
4. Click "Create Panorama" to stitch
5. Export as JPEG or TIFF

### Method 2: Microsoft ICE (Free, Windows)
1. Download from: https://www.microsoft.com/en-us/research/product/computational-photography-applications/image-composite-editor/
2. Drag and drop all `frame_*.jpg` files
3. Click "Stitch" and export

### Method 3: Python + OpenCV
```python
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
```

### Method 4: Command-line with Hugin tools
```bash
# Generate project file
pto_gen -o project.pto frame_*.jpg

# Find control points
cpfind -o project.pto project.pto

# Optimize
autooptimiser -a -l -s -o project.pto project.pto

# Stitch
nona -o panorama project.pto
enblend -o final_panorama.jpg panorama*.tif
```

## Requirements

- Reolink PTZ camera
- Camera must support directional PTZ commands (Left, Right, Up, Down)
- Environment variables:
  - `REOLINK_NVR_HOST` - Camera IP address
  - `REOLINK_NVR_USER` - Username
  - `REOLINK_NVR_PASS` - Password

## Tips

- **Adjust pan duration**: If frames overlap or have gaps, modify `panDurationMs` in the code
- **Lighting**: Best results in consistent lighting conditions
- **Steady camera**: Ensure camera is stable before starting
- **Frame count**: More frames = better overlap = easier stitching (try 16-24 frames)
- **Speed**: Lower speeds (10-15) may provide smoother transitions

## Troubleshooting

**Camera doesn't move:**
- Check that your camera supports PTZ
- Verify camera is not in guard mode
- Try using preset-based capture instead

**Frames don't align:**
- Increase settle time (`settleMs`)
- Reduce pan speed
- Increase number of frames for better overlap

**Stitching fails:**
- Ensure good overlap between frames (30-50%)
- Check for consistent exposure across frames
- Try different stitching software
- Manually adjust control points in Hugin
