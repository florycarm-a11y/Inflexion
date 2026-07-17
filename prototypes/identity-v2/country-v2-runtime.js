/* Contournement local au prototype : voir le bug GeoJSON Mexique documenté dans le plan. */
(function () {
    'use strict';

    if (typeof L === 'undefined' || typeof L.geoJSON !== 'function') return;

    var renderGeoJSON = L.geoJSON;

    function arrayDepth(value) {
        if (!Array.isArray(value)) return 0;
        var depth = 0;
        for (var i = 0; i < value.length; i++) {
            depth = Math.max(depth, arrayDepth(value[i]));
        }
        return depth + 1;
    }

    L.geoJSON = function (feature, options) {
        var normalized = feature;

        // Une partie du polygone Mexique porte un niveau de tableau superflu dans le GeoJSON actuel.
        if (
            feature &&
            feature.type === 'Feature' &&
            feature.properties &&
            feature.properties.zone === 'mexique' &&
            feature.geometry &&
            feature.geometry.type === 'Polygon'
        ) {
            var coordinates = feature.geometry.coordinates;
            while (arrayDepth(coordinates) > 3 && coordinates.length === 1) {
                coordinates = coordinates[0];
            }

            if (coordinates !== feature.geometry.coordinates) {
                normalized = Object.assign({}, feature, {
                    geometry: Object.assign({}, feature.geometry, { coordinates: coordinates })
                });
            }
        }

        return renderGeoJSON.call(this, normalized, options);
    };
})();
