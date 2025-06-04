const originalGeoJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        stroke: '#555555',
        'stroke-width': 1.5,
        'stroke-opacity': 1,
      },
      geometry: {
        coordinates: [
          [131.12994767463658, 30.631868470621498],
          [130.81792214144537, 30.22830487397914],
          [130.23287426671504, 29.280212348906048],
          [129.80383915857817, 28.391886503722304],
          [128.9847721339545, 27.668904857658916],
          [128.04869553438505, 26.557988350578484],
          [127.26863170140922, 25.823021165460986],
          [125.82551361040515, 24.906711819000535],
          [124.92844020248577, 24.55244962857681],
          [123.79734764467082, 24.126011352127378],
          [122.78326466180368, 23.69814685602779],
          [122.31522636201902, 23.3763240444963],
          [121.91355026217764, 22.90406174586201],
          [121.67953111228434, 22.20100417412212],
          [121.8294379164983, 20.87944600105166],
          [121.57416572069309, 20.006523294932663],
          [121.41815295409748, 18.792521167364214],
          [121.26214018750187, 18.348854295252224],
          [120.83310507936716, 16.936487263948564],
          [120.40406997123034, 15.963928270310532],
          [119.89702847979567, 14.004836491478244],
          [119.35098379671325, 11.34139198399832],
          [118.84394230528073, 9.884666612656915],
          [117.36182102262887, 7.262326241647642],
          [116.54275399800514, 5.867453468506909],
          [113.77352739094272, 3.1459305212752042],
          [112.2524029166409, 2.327804741892294],
          [110.34124652585228, 1.5871817198069778],
          [109.21015396803949, 1.0802792510904595],
          [107.18198800230516, 1.0412827446181012],
          [106.55793693592483, 1.0412827446181012],
          [106.08989863614016, 1.1192752570813553],
          [105.50485076140768, 1.1972656953890919],
          [104.06173267040373, 1.4312231210484327],
        ],
        type: 'LineString',
      },
    },
  ],
};

let currentGeoJSON = JSON.parse(JSON.stringify(originalGeoJSON));
let workingGeoJSON = null;
let selectedFeatureIndex = 0;

function loadGeoJSON() {
  const input = document.getElementById('inputGeoJSON').value.trim();
  const status = document.getElementById('loadStatus');

  if (!input) {
    showStatus('Please paste GeoJSON data first.', 'error');
    return;
  }

  try {
    const geoJSON = JSON.parse(input);

    // Validate GeoJSON structure
    if (!geoJSON.type || geoJSON.type !== 'FeatureCollection') {
      throw new Error('Invalid GeoJSON: Must be a FeatureCollection');
    }

    if (!geoJSON.features || !Array.isArray(geoJSON.features)) {
      throw new Error('Invalid GeoJSON: Must contain features array');
    }

    // Find LineString features
    const lineStringFeatures = geoJSON.features
      .map((feature, index) => ({ feature, index }))
      .filter(
        ({ feature }) =>
          feature.geometry &&
          (feature.geometry.type === 'LineString' ||
            feature.geometry.type === 'MultiLineString')
      );

    if (lineStringFeatures.length === 0) {
      throw new Error('No LineString or MultiLineString features found');
    }

    workingGeoJSON = geoJSON;
    populateFeatureSelect(lineStringFeatures);
    showStatus(
      `Loaded ${lineStringFeatures.length} LineString feature(s)`,
      'success'
    );
  } catch (error) {
    showStatus(`Error: ${error.message}`, 'error');
    console.error('GeoJSON parsing error:', error);
  }
}

function populateFeatureSelect(lineStringFeatures) {
  const select = document.getElementById('featureSelect');
  select.innerHTML = '<option value="">Select a LineString feature...</option>';

  lineStringFeatures.forEach(({ feature, index }, i) => {
    const option = document.createElement('option');
    option.value = index;

    // Create a descriptive name for the feature
    let name = `Feature ${i + 1}`;
    if (feature.properties) {
      if (feature.properties.name) {
        name += ` (${feature.properties.name})`;
      } else if (feature.properties.title) {
        name += ` (${feature.properties.title})`;
      } else if (feature.properties.id) {
        name += ` (ID: ${feature.properties.id})`;
      }
    }

    // Add coordinate count info
    let coordCount = 0;
    if (feature.geometry.type === 'LineString') {
      coordCount = feature.geometry.coordinates.length;
    } else if (feature.geometry.type === 'MultiLineString') {
      coordCount = feature.geometry.coordinates.reduce(
        (sum, line) => sum + line.length,
        0
      );
      name += ` [MultiLineString]`;
    }

    name += ` - ${coordCount} points`;
    option.textContent = name;
    select.appendChild(option);
  });
}

function selectFeature() {
  const select = document.getElementById('featureSelect');
  const featureIndex = parseInt(select.value);

  if (isNaN(featureIndex) || !workingGeoJSON) {
    return;
  }

  selectedFeatureIndex = featureIndex;
  currentGeoJSON = JSON.parse(JSON.stringify(workingGeoJSON));

  // For MultiLineString, we'll work with the first line
  const feature = currentGeoJSON.features[selectedFeatureIndex];
  if (feature.geometry.type === 'MultiLineString') {
    // Convert MultiLineString to LineString using the longest line
    const lines = feature.geometry.coordinates;
    const longestLine = lines.reduce((longest, current) =>
      current.length > longest.length ? current : longest
    );
    feature.geometry.coordinates = longestLine;
    feature.geometry.type = 'LineString';
    showStatus('Using longest line from MultiLineString', 'success');
  }

  updateOutput();
}

function loadExample() {
  document.getElementById('inputGeoJSON').value = JSON.stringify(
    originalGeoJSON,
    null,
    2
  );
  loadGeoJSON();
  // Auto-select the first (and only) feature
  setTimeout(() => {
    document.getElementById('featureSelect').value = '0';
    selectFeature();
  }, 100);
}

function showStatus(message, type) {
  const status = document.getElementById('loadStatus');
  status.textContent = message;
  status.className = type === 'error' ? 'status-error' : 'status-success';
  setTimeout(() => {
    status.textContent = '';
    status.className = '';
  }, 5000);
}

// Catmull-Rom spline interpolation
function catmullRomSpline(p0, p1, p2, p3, t, tension = 0.5) {
  const t2 = t * t;
  const t3 = t2 * t;

  const v0 = (p2[0] - p0[0]) * tension;
  const v1 = (p3[0] - p1[0]) * tension;
  const v2 = (p2[1] - p0[1]) * tension;
  const v3 = (p3[1] - p1[1]) * tension;

  const x =
    (2 * p1[0] - 2 * p2[0] + v0 + v1) * t3 +
    (-3 * p1[0] + 3 * p2[0] - 2 * v0 - v1) * t2 +
    v0 * t +
    p1[0];

  const y =
    (2 * p1[1] - 2 * p2[1] + v2 + v3) * t3 +
    (-3 * p1[1] + 3 * p2[1] - 2 * v2 - v3) * t2 +
    v2 * t +
    p1[1];

  return [x, y];
}

// Curve Basis (B-Spline) interpolation
function curveBasisSpline(p0, p1, p2, p3, t, smoothness = 0.3) {
  const t2 = t * t;
  const t3 = t2 * t;

  // B-spline basis functions (cubic)
  const b0 = (1 - t3 + 3 * t2 - 3 * t) / 6;
  const b1 = (4 - 6 * t2 + 3 * t3) / 6;
  const b2 = (1 + 3 * t + 3 * t2 - 3 * t3) / 6;
  const b3 = t3 / 6;

  // Apply smoothness factor - blend between linear and full B-spline
  const linearX = p1[0] + (p2[0] - p1[0]) * t;
  const linearY = p1[1] + (p2[1] - p1[1]) * t;

  const splineX = b0 * p0[0] + b1 * p1[0] + b2 * p2[0] + b3 * p3[0];
  const splineY = b0 * p0[1] + b1 * p1[1] + b2 * p2[1] + b3 * p3[1];

  const x = linearX * (1 - smoothness) + splineX * smoothness;
  const y = linearY * (1 - smoothness) + splineY * smoothness;

  return [x, y];
}

function updateMethodControls() {
  const method = document.getElementById('methodSelect').value;
  const tensionControl = document.getElementById('tensionControl');
  const smoothnessControl = document.getElementById('smoothnessControl');

  if (method === 'catmullrom') {
    tensionControl.style.display = 'block';
    smoothnessControl.style.display = 'none';
  } else {
    tensionControl.style.display = 'none';
    smoothnessControl.style.display = 'block';
  }
}

function interpolateLineString() {
  if (!currentGeoJSON || !currentGeoJSON.features[selectedFeatureIndex]) {
    showStatus('Please load and select a feature first', 'error');
    return;
  }

  const pointsPerSegment = parseInt(
    document.getElementById('pointsInput').value
  );
  const method = document.getElementById('methodSelect').value;
  const tension = parseFloat(document.getElementById('tensionInput').value);
  const smoothness = parseFloat(
    document.getElementById('smoothnessInput').value
  );

  const feature = currentGeoJSON.features[selectedFeatureIndex];
  const originalCoords = feature.geometry.coordinates;

  if (originalCoords.length < 2) {
    showStatus('Feature must have at least 2 coordinates', 'error');
    return;
  }

  const interpolatedCoords = [];

  // Add first point
  interpolatedCoords.push(originalCoords[0]);

  for (let i = 0; i < originalCoords.length - 1; i++) {
    // Get 4 points for spline interpolation
    const p0 = i === 0 ? originalCoords[0] : originalCoords[i - 1];
    const p1 = originalCoords[i];
    const p2 = originalCoords[i + 1];
    const p3 =
      i === originalCoords.length - 2
        ? originalCoords[i + 1]
        : originalCoords[i + 2];

    // Interpolate between p1 and p2
    for (let j = 1; j <= pointsPerSegment; j++) {
      const t = j / pointsPerSegment;
      let interpolatedPoint;

      if (method === 'catmullrom') {
        interpolatedPoint = catmullRomSpline(p0, p1, p2, p3, t, tension);
      } else {
        interpolatedPoint = curveBasisSpline(p0, p1, p2, p3, t, smoothness);
      }

      interpolatedCoords.push(interpolatedPoint);
    }
  }

  // Update the feature
  feature.geometry.coordinates = interpolatedCoords;

  // Update visual properties to indicate interpolation
  if (!feature.properties) feature.properties = {};
  feature.properties.stroke = method === 'catmullrom' ? '#28a745' : '#007bff';
  feature.properties['stroke-width'] = 2;
  feature.properties.interpolated = true;
  feature.properties.interpolationMethod = method;

  updateOutput();
  showStatus(
    `${
      method === 'catmullrom' ? 'Catmull-Rom' : 'Curve Basis'
    } interpolation complete!`,
    'success'
  );
}

function resetToOriginal() {
  if (!workingGeoJSON) {
    showStatus('No original data to reset to', 'error');
    return;
  }

  currentGeoJSON = JSON.parse(JSON.stringify(workingGeoJSON));

  // Handle MultiLineString conversion again if needed
  const feature = currentGeoJSON.features[selectedFeatureIndex];
  if (feature.geometry.type === 'MultiLineString') {
    const lines = feature.geometry.coordinates;
    const longestLine = lines.reduce((longest, current) =>
      current.length > longest.length ? current : longest
    );
    feature.geometry.coordinates = longestLine;
    feature.geometry.type = 'LineString';
  }

  updateOutput();
  showStatus('Reset to original', 'success');
}

function updateOutput() {
  const output = document.getElementById('output');
  const stats = document.getElementById('stats');
  const preview = document.getElementById('preview');

  if (!currentGeoJSON || !currentGeoJSON.features[selectedFeatureIndex]) {
    output.value = '';
    stats.textContent = 'No feature selected';
    preview.innerHTML = '';
    return;
  }

  output.value = JSON.stringify(currentGeoJSON, null, 2);

  const feature = currentGeoJSON.features[selectedFeatureIndex];
  const currentCount = feature.geometry.coordinates.length;

  // Try to get original count
  let originalCount = currentCount;
  if (workingGeoJSON && workingGeoJSON.features[selectedFeatureIndex]) {
    const originalFeature = workingGeoJSON.features[selectedFeatureIndex];
    if (originalFeature.geometry.type === 'LineString') {
      originalCount = originalFeature.geometry.coordinates.length;
    } else if (originalFeature.geometry.type === 'MultiLineString') {
      const lines = originalFeature.geometry.coordinates;
      originalCount = lines.reduce(
        (longest, current) => Math.max(longest, current.length),
        0
      );
    }
  }

  stats.textContent = `Original points: ${originalCount} | Current points: ${currentCount}`;

  // Show preview of first 10 coordinates
  const coords = feature.geometry.coordinates.slice(0, 10);
  const isInterpolated = feature.properties && feature.properties.interpolated;

  preview.innerHTML =
    coords
      .map(
        (coord, index) =>
          `<div class="point ${isInterpolated ? 'interpolated' : 'original'}">
            ${index + 1}: [${coord[0].toFixed(6)}, ${coord[1].toFixed(6)}]
        </div>`
      )
      .join('') +
    (currentCount > 10 ? '<div class="point">... and more</div>' : '');
}

function copyToClipboard() {
  const output = document.getElementById('output');
  output.select();
  document.execCommand('copy');
  alert('GeoJSON copied to clipboard!');
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function () {
  // Sync sliders and inputs
  document.getElementById('pointsSlider').oninput = function () {
    document.getElementById('pointsInput').value = this.value;
  };
  document.getElementById('pointsInput').oninput = function () {
    document.getElementById('pointsSlider').value = this.value;
  };
  document.getElementById('tensionSlider').oninput = function () {
    document.getElementById('tensionInput').value = this.value;
  };
  document.getElementById('tensionInput').oninput = function () {
    document.getElementById('tensionSlider').value = this.value;
  };
  document.getElementById('smoothnessSlider').oninput = function () {
    document.getElementById('smoothnessInput').value = this.value;
  };
  document.getElementById('smoothnessInput').oninput = function () {
    document.getElementById('smoothnessSlider').value = this.value;
  };

  // Load example data by default
  loadExample();
});
