
console.log("Listing data:", listing);
console.log("Mapbox token loaded:", !!mapToken);
console.log("Coordinates:", listing.geometry?.coordinates);
console.log("Mapbox loaded:", typeof mapboxgl);

// Check Mapbox library
if (typeof mapboxgl === "undefined") {
    console.error("Mapbox GL JS is not loaded!");
} 
// Check access token
else if (!mapToken || !mapToken.startsWith("pk.")) {
    console.error("Invalid or missing public Mapbox token!");
} 
// Check coordinates
else if (
    !listing.geometry ||
    !Array.isArray(listing.geometry.coordinates) ||
    listing.geometry.coordinates.length !== 2
) {
    console.error("Invalid listing coordinates!");
} 
else {
    mapboxgl.accessToken = mapToken;

    const coordinates = listing.geometry.coordinates;

    const map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/streets-v12",
        center: coordinates,
        zoom: 9
    });

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl());

    // Add marker
    const marker = new mapboxgl.Marker({
        color: "red"
    })
        .setLngLat(coordinates)
        .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
                `<h4>${listing.location}</h4>
                 <p>Exact Location will be provided after booking</p>`
            )
        )
        .addTo(map);

    // Check map loading
    map.on("load", () => {
        console.log("Map loaded successfully!");
    });

    map.on("error", (error) => {
        console.error("Mapbox error:", error);
    });
}
