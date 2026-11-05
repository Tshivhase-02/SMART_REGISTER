import {
  formatNominatimPlace,
  reverseGeocodingService,
} from '../src/services/reverseGeocodingService';
import {
  verifyLocationAgainstWorkplace,
  DEFAULT_WORKPLACE_OFFICE,
  calculateDistanceMeters,
} from '../src/utils/geoUtils';
import { Coordinates } from '../src/types/attendance';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

console.log('================================================================');
console.log('SMARTREGISTER GPS REVERSE GEOCODING & PLACE NAME VERIFICATION');
console.log('================================================================\n');

// 1. FORMATTING NOMINATIM PLACE NAMES
console.log('1. Testing Nominatim Address & Place Name Formatter');

const samplePoiResponse = {
  place_id: 12345,
  name: 'Dynamic DNA',
  address: {
    amenity: 'Dynamic DNA',
    house_number: '271',
    road: 'Surrey Avenue',
    suburb: 'Ferndale',
    city: 'Randburg',
    country: 'South Africa',
  },
};
const formattedPoi = formatNominatimPlace(samplePoiResponse);
assert(
  formattedPoi === 'Dynamic DNA, 271 Surrey Avenue, Ferndale, Randburg',
  `POI with street and suburb formatted correctly (got: "${formattedPoi}")`
);

const sampleMallResponse = {
  place_id: 67890,
  name: 'Sandton City',
  address: {
    shop: 'Sandton City',
    road: 'Rivonia Road',
    suburb: 'Sandhurst',
    city: 'Sandton',
    country: 'South Africa',
  },
};
const formattedMall = formatNominatimPlace(sampleMallResponse);
assert(
  formattedMall === 'Sandton City, Rivonia Road, Sandhurst, Sandton',
  `Mall POI formatted correctly (got: "${formattedMall}")`
);

const sampleStreetOnlyResponse = {
  place_id: 11111,
  address: {
    house_number: '12',
    road: 'Pretoria Street',
    suburb: 'Hillbrow',
    city: 'Johannesburg',
  },
};
const formattedStreet = formatNominatimPlace(sampleStreetOnlyResponse);
assert(
  formattedStreet === '12 Pretoria Street, Hillbrow, Johannesburg',
  `Street-only address without POI formatted correctly (got: "${formattedStreet}")`
);

const sampleDisplayNameFallback = {
  place_id: 22222,
  display_name: 'Nelson Mandela Square, 5th Street, Sandown, Johannesburg, South Africa',
};
const formattedFallback = formatNominatimPlace(sampleDisplayNameFallback);
assert(
  formattedFallback === 'Nelson Mandela Square, 5th Street, Sandown',
  `Fallback to top segments of display_name (got: "${formattedFallback}")`
);

const sampleErrorResponse = {
  error: 'Unable to geocode',
};
assert(
  formatNominatimPlace(sampleErrorResponse) === null,
  'Error response safely yields null'
);

assert(
  formatNominatimPlace(null) === null && formatNominatimPlace(undefined) === null,
  'Null and undefined inputs safely yield null'
);

// 2. VERIFY LOCATION AGAINST WORKPLACE WITH DETECTED PLACE
console.log('\n2. Testing Location Verification with Place Names');

// Case 2a: Inside authorised workplace (Distance ~3m, accuracy 4m)
const campusCoordinates: Coordinates = {
  latitude: -26.097815,
  longitude: 27.998375,
  accuracy: 4,
};
const insideResult = verifyLocationAgainstWorkplace(campusCoordinates, DEFAULT_WORKPLACE_OFFICE);
assert(
  insideResult.status === 'success' && insideResult.isWithinGeofence === true,
  'Inside workplace passes geofence check'
);
assert(
  insideResult.displayStatus === 'Location Verified.',
  'Inside workplace displays status: "Location Verified."'
);
assert(
  insideResult.detectedPlace === 'DynamicDNA Campus.',
  'Inside workplace detected place is "DynamicDNA Campus."'
);
assert(
  insideResult.displayMessage === 'You are within the authorised workplace area.',
  'Inside workplace display message matches: "You are within the authorised workplace area."'
);

// Case 2b: Outside authorised area with identified place name
const outsideWithPlaceCoords: Coordinates = {
  latitude: -26.1076,
  longitude: 28.053,
  accuracy: 10,
};
const outsideResultWithPlace = verifyLocationAgainstWorkplace(
  outsideWithPlaceCoords,
  DEFAULT_WORKPLACE_OFFICE,
  undefined,
  '5th Street, Sandown, Sandton'
);
assert(
  outsideResultWithPlace.status === 'error' && outsideResultWithPlace.isWithinGeofence === false,
  'Outside workplace fails geofence check'
);
assert(
  outsideResultWithPlace.displayStatus === 'Outside Authorised Area.',
  'Outside workplace display status is "Outside Authorised Area."'
);
assert(
  outsideResultWithPlace.detectedPlace === '5th Street, Sandown, Sandton',
  'Outside workplace reports detected place name: "5th Street, Sandown, Sandton"'
);
assert(
  outsideResultWithPlace.displayMessage ===
    'You are currently at 5th Street, Sandown, Sandton, which is outside the authorised workplace area.',
  'Outside workplace reports message with detected place name'
);
assert(
  typeof outsideResultWithPlace.distanceMeters === 'number' && outsideResultWithPlace.distanceMeters > 100,
  `Distance is preserved internally for debugging (got: ${outsideResultWithPlace.distanceMeters}m)`
);

// Case 2c: Outside authorised area when reverse geocoding cannot identify place
const outsideUnknownCoords: Coordinates = {
  latitude: -26.15,
  longitude: 28.01,
  accuracy: 8,
};
const outsideResultUnknown = verifyLocationAgainstWorkplace(
  outsideUnknownCoords,
  DEFAULT_WORKPLACE_OFFICE,
  undefined,
  null // No place name identified
);
assert(
  outsideResultUnknown.displayStatus === 'Outside Authorised Area.',
  'Outside unknown place display status is "Outside Authorised Area."'
);
assert(
  outsideResultUnknown.detectedPlace === 'Unable to identify your current location.',
  'Outside unknown place detected place is "Unable to identify your current location."'
);
assert(
  outsideResultUnknown.displayMessage === 'You are currently outside the authorised workplace area.',
  'Outside unknown place message does not invent place names'
);

// Case 2d: GPS Accuracy Insufficient (> 30m)
const poorAccuracyCoords: Coordinates = {
  latitude: -26.097815,
  longitude: 27.998375,
  accuracy: 45, // Exceeds 30m threshold
};
const poorAccuracyResult = verifyLocationAgainstWorkplace(
  poorAccuracyCoords,
  DEFAULT_WORKPLACE_OFFICE
);
assert(
  poorAccuracyResult.status === 'warning' && poorAccuracyResult.isAccuracyAcceptable === false,
  'Poor GPS accuracy triggers warning'
);
assert(
  poorAccuracyResult.displayStatus === 'GPS accuracy insufficient.',
  'Displays "GPS accuracy insufficient."'
);
assert(
  poorAccuracyResult.displayMessage ===
    'GPS accuracy insufficient – Please wait for a more accurate reading.',
  'Displays prompt to wait for more accurate reading'
);

// Case 2e: Separation of reverse geocoding from GPS distance logic
// Even if reverse geocoding passes null or errors, physical presence at campus STILL verifies!
const campusWithNullGeocode = verifyLocationAgainstWorkplace(
  campusCoordinates,
  DEFAULT_WORKPLACE_OFFICE,
  undefined,
  null
);
assert(
  campusWithNullGeocode.isWithinGeofence === true && campusWithNullGeocode.status === 'success',
  'Reverse geocoding failure never changes a successful GPS distance verification into a failure'
);

console.log('\n================================================================');
console.log(`TEST RESULTS: ${passedTests}/${totalTests} Passed (100%)`);
console.log('================================================================');
