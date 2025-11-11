# Extras

This directory contains additional tools and examples that are not part of the main package but are useful for specific use cases.

## Tools

### 📸 [Panorama](./panorama/)
Create 360-degree panoramas using PTZ cameras. Automatically rotates the camera and captures snapshots at regular intervals, with support for stitching into a full panorama.

**Run:** `npx tsx extras/panorama/panorama.ts`

## Why Extras?

These tools are kept separate from the main package to:
- Keep the core package lightweight
- Provide advanced features for specific use cases
- Allow for experimental or specialized functionality
- Give users the option to use them without bundling them in the package

## Usage

All extras use the main reolink-api package and can be run directly with tsx:

```bash
npx tsx extras/<tool-name>/<script>.ts
```

## Contributing

Feel free to add your own tools and examples to this directory!
