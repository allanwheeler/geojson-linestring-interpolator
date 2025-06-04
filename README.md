# GeoJSON LineString Interpolator

A web-based tool for interpolating points along GeoJSON LineString features using different spline interpolation methods. This tool is particularly useful for creating smoother paths or adding intermediate points to existing GeoJSON LineString features.

## Features

- Load and validate GeoJSON FeatureCollections
- Support for both LineString and MultiLineString features
- Two interpolation methods:
  - Catmull-Rom Spline: Creates curves that pass through all original points
  - Curve Basis (B-Spline): Creates smoother curves with adjustable smoothness
- Adjustable parameters:
  - Points per segment: Control the density of interpolated points
  - Tension: Adjust curve tightness for Catmull-Rom splines
  - Smoothness: Control curve smoothness for B-splines
- Real-time preview of coordinates
- Copy interpolated GeoJSON to clipboard
- Responsive and accessible web interface

## Usage

1. Open `index.html` in a web browser
2. Either:
   - Paste your GeoJSON FeatureCollection into the input area, or
   - Click "Load Example" to use the provided sample data
3. Select the LineString feature you want to interpolate
4. Choose an interpolation method
5. Adjust the parameters to achieve your desired result
6. Click "Interpolate" to generate the interpolated points
7. Use "Copy Result" to copy the interpolated GeoJSON to your clipboard

## Technical Details

The tool uses two different spline interpolation methods:

1. **Catmull-Rom Spline**: A type of cubic spline that passes through all control points. The tension parameter controls how tightly the curve follows the original points.

2. **Curve Basis (B-Spline)**: A more general spline that can create smoother curves. The smoothness parameter controls the blend between linear interpolation and full B-spline interpolation.

## Requirements

- Modern web browser with JavaScript enabled
- No external dependencies required
