
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

const geocodingClient = mbxGeocoding({
    accessToken: process.env.MAP_TOKEN
});

// Function to get coordinates from location
const getCoordinates = async (location) => {
    const geoData = await geocodingClient.forwardGeocode({
        query: location,
        limit: 1
    }).send();

    if (geoData.body.features.length === 0) {
        throw new Error("Location not found. Please enter a valid location.");
    }

    return geoData.body.features[0].geometry;
};

module.exports = {
    // Show all listings
    index: async (req, res) => {
        const allListings = await Listing.find({});
        res.render("listings/index.ejs", { allListings });
    },

    // Render new listing form
    renderNewForm: (req, res) => {
        res.render("listings/new.ejs");
    },

    // Create new listing
    createListing: async (req, res) => {
        const newListing = new Listing(req.body.listing);

        newListing.owner = req.user._id;

        newListing.image = {
            url: req.file.path,
            filename: req.file.filename
        };

        newListing.geometry = await getCoordinates(newListing.location);

        await newListing.save();

        req.flash("success", "New listing created!");
        res.redirect("/listings");
    },

    // Show single listing
    showListing: async (req, res) => {
        const { id } = req.params;

        const listing = await Listing.findById(id)
            .populate({
                path: "reviews",
                populate: {
                    path: "author"
                }
            })
            .populate("owner");

        if (!listing) {
            req.flash("error", "Listing you requested does not exist!");
            return res.redirect("/listings");
        }

        res.render("listings/show.ejs", { listing });
    },

    // Render edit form
    renderEditForm: async (req, res) => {
        const { id } = req.params;

        const listing = await Listing.findById(id);

        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }

        res.render("listings/edit.ejs", { listing });
    },

    // Update listing
    updateListing: async (req, res) => {
        const { id } = req.params;

        let listing = await Listing.findByIdAndUpdate(
            id,
            { ...req.body.listing },
            { new: true }
        );

        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }

        // Update coordinates from location
        if (req.body.listing.location) {
            listing.geometry = await getCoordinates(
                req.body.listing.location
            );
        }

        // Update image if a new image is uploaded
        if (req.file) {
            listing.image = {
                url: req.file.path,
                filename: req.file.filename
            };
        }

        await listing.save();

        req.flash("success", "Listing updated!");
        res.redirect(`/listings/${id}`);
    },

    // Delete listing
    destroyListing: async (req, res) => {
        const { id } = req.params;

        await Listing.findByIdAndDelete(id);

        req.flash("success", "Listing deleted!");
        res.redirect("/listings");
    }
};
