
require("dotenv").config();

const mongoose = require("mongoose");
const Listing = require("./models/listing.js");

const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

const geocodingClient = mbxGeocoding({
    accessToken: process.env.MAP_TOKEN
});

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

async function updateCoordinates() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGO_URL);
        console.log("Connected to MongoDB!");

        // Find all listings
        const listings = await Listing.find({});
        console.log(`Total listings found: ${listings.length}`);

        // Update coordinates for every listing
        for (const listing of listings) {
            try {
                // Skip listings that already have valid coordinates
                if (
                    listing.geometry &&
                    listing.geometry.type === "Point" &&
                    Array.isArray(listing.geometry.coordinates) &&
                    listing.geometry.coordinates.length === 2 &&
                    listing.geometry.coordinates.every(Number.isFinite)
                ) {
                    console.log(`Already updated: ${listing.title}`);
                    continue;
                }

                // Get coordinates using listing's existing location
                const geoData = await geocodingClient
                    .forwardGeocode({
                        query: `${listing.location}, ${listing.country}`,
                        limit: 1
                    })
                    .send();

                if (geoData.body.features.length > 0) {
                    listing.geometry = geoData.body.features[0].geometry;

                    await listing.save();

                    console.log(`Successfully updated: ${listing.title}`);
                } else {
                    console.log(`Location not found: ${listing.location}`);
                }

            } catch (err) {
                console.log(
                    `Error updating ${listing.title}:`,
                    err.message
                );
            }
        }

        console.log("All listings processed!");

    } catch (err) {
        console.log("Database error:", err.message);

    } finally {
        await mongoose.connection.close();
        console.log("MongoDB connection closed.");
    }
}

updateCoordinates();
