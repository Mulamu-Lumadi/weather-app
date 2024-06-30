import express from "express";
import axios from "axios";

const app = express();
const port = 3000;

// geo coding api to find latitude.longitude coordinates from place name search
const API_URL_GEO = "https://geocoding-api.open-meteo.com/v1";
const API_URL_WEATHER = "https://api.open-meteo.com/v1";
const MAX_PLACES = 10;
// boolean flag to print out message 
let willRain;
// int flag to determine the amount of rain in mm
let rainAmount = -1;
// error message flag for invalid place name searches
let message = '';
// var to store places object and send to ejs
let placesObjArr;

app.use(express.static("public"))
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.render("index.ejs", { locError: message, rainMeasure: rainAmount, rainfall: willRain, dropDownPlace: placesObjArr });
});

app.post("/submit/placeText", async (req, res) => {

    /* reset flag and error message for invalid place name, so
    messages on screen are updating when user searches for 
    other places */
    rainAmount = -1;
    message = '';

    try {
        const response = await axios.get(API_URL_GEO + "/search",
            {
                params:
                {
                    name: req.body.placeName,
                    count: MAX_PLACES,
                    language: 'en',
                    format: 'json'
                }
            });

        // handle invalid place name search term and send error message
        if (!response.data.results) {
            message = 'Invalid location name try again';
            return res.redirect("/");
        } else {
            placesObjArr = response.data;
        }
    } catch (error) {
        console.log(error.message);
    }

    res.redirect("/");
});

app.post("/submit/placeDrop", async (req, res) => {
    try {
        const response = await axios.get(API_URL_WEATHER + "/forecast",
            {
                params: {
                    /* use drop down list index (value parameter for option)
                    to find the coordinates of the matching location
                    chosen by the user */
                    latitude: placesObjArr.results[req.body.places].latitude,
                    longitude: placesObjArr.results[req.body.places].longitude,
                    daily: 'rain_sum',
                    forecast_days: 1
                }
            });

        /* determine the possible rainfall in mm and 
        evaluate the amount against 30mm threshold */
        rainAmount = response.data.daily.rain_sum[0];
        willRain = rainAmount > 30 ? true : false;

        console.log(rainAmount);
    } catch (error) {
        console.log(error.message)
    }

    res.redirect("/");
});

app.listen(port, () => {
    console.log("Server hosted at port " + port);
});