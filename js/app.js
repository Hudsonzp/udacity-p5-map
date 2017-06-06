
// Great Vegan restaurant locations in SF for the app
var locations = [
    {
        "title" : "Shizen Vegan Sushi Bar",
        "location" : { "lat" : 37.768313, "lng" : -122.421643 },
        "foursquareid" : "54a8b5d1498ef8abe40ce6b3",
        "rating" : "loading"
    },
    {
    	"title" : "Halu Ramen",
    	"location" : { "lat" : 37.782568, "lng" : -122.466456 },
        "foursquareid" : "4a865e24f964a520fe0020e3",
        "rating" : "loading"
    },
    {
    	"title" : "Gracias Madre San Francisco",
    	"location" : { "lat" : 37.761572, "lng" : -122.419080 },
        "foursquareid" : "4b4955ccf964a520b86d26e3",
        "rating" : "loading"
    },
    {
    	"title" : "No No Burger",
    	"location" : { "lat" : 37.769769, "lng" : -122.412049 },
        "foursquareid" : "5650e4ab498edd90781e193d",
        "rating" : "loading"
    },
    {
    	"title" : "Nourish Cafe",
    	"location" : { "lat" : 37.785241, "lng" : -122.464783 },
        "foursquareid" : "54ea1afc498e12af65963097",
        "rating" : "loading"
    },
    {
    	"title" : "Thai Idea",
    	"location" : { "lat" : 37.783457, "lng" : -122.419116 },
        "foursquareid" : "4e7d7aebf5b9644b441e28f3",
        "rating" : "loading"
    }
];

// Setting up for each individual location
var Location = function(data) {
	var self = this;
	self.title = data.title,
	self.location = data.location
};

// create a new array for the map
var map;

// info window global variable for google maps api
var largeInfoWindow;

// create a blank array for all listing markers
var markers = [];

// counter for the foursquare API calls on success and error
var apiCallsCompleted = 0;


// Call back function for the API. Keeps count of all API calls completed
// Loads the app when finished just to make sure it grabs all ratings.
// @index is the index from the ajax function
// @rating is the rating returned from the Foursquare API
function apiCallBack(index, rating) {
    apiCallsCompleted++;
    locations[index].rating = rating;
    if (apiCallsCompleted >= locations.length) {
        appLoader();
    }
}

// Calls out to foursquare api
function fourSquareData(index) {
    var apiURL = 'https://api.foursquare.com/v2/venues/';
    var foursquareClientID = 'A2ZC3EKQFCXLXBEJPXQPA5YVVDG1EZYTW453HM4FY1HPOWS4'
    var foursquareSecret ='VXX1VWQ1JK1XDTCNYB5JYCILUXQ5MG3X5WIAOL1WTFHCQJSW'
    var foursquareVersion = '20170112';
    var foursquareid = locations[index].foursquareid;

    // URL using variables above
    var foursquareURL = apiURL + foursquareid + '?client_id=' + foursquareClientID +  '&client_secret=' + foursquareSecret +'&v=' + foursquareVersion;

    // Reaches out to Foursquare and grabs the venue rating
    // includes Graceful success and error handling of the Ajax call
    $.ajax({
        "url" : foursquareURL,
        "datatype" : "jsonp",
        "success" : function(response) {
            resp = response.response.venue.rating;
            var rating = "Not yet rated"
            if (resp > 0) {
                rating = resp;
            }
            apiCallBack(index, rating);
        },
        "error" : function(error) {
            console.log('API error for Foursquareid ' + foursquareid);
            var rating = "Could not load results api error";
            apiCallBack(index, rating)
        }
    });
};

// Basic google maps constructor
function initMap() {
    // Map Constructor
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 37.785, lng: -122.446 },
    	zoom: 12,
    	styles: styles2,
    	mapTypeControl: false
    });

    // runs through and gets the rating data
    // bases it on the index.
    for (var i = 0; i < locations.length; i++){
        fourSquareData(i);
    }
}

// Continues loading the app
// Runs only after the ratings are retrieved from the FS api
function appLoader() {

    // info window provides from google maps
    var largeInfoWindow = new google.maps.InfoWindow();

    // style the markers
    var defaultIcon = makeMarkerIcon('0091ff');

    // create a "highlighted location" marker color
    var highlightedIcon = makeMarkerIcon('FFFF24');

    // sets bounds on load to zoom in on San Francisco
    var bounds = new google.maps.LatLngBounds();

    // Loops through all locations and assigns
    // a marker to each of them.
    // this also attaches the FS venue rating within the title.
    for (var i = 0; i < locations.length; i++) {
        var rating = locations[i].rating;
        var position = locations[i].location;
        var title = locations[i].title + ' - Rating: ' + rating;
        // setting the marker and dropping it on each location.
        locations[i].marker = new google.maps.Marker({
            position: position,
            title: title,
            icon: defaultIcon,
            animation: google.maps.Animation.DROP,
            id: i
        });

        // Push the marker to our array of markers
        markers.push(locations[i].marker);

        // Create an onclick event to open an infowindow at each marker.
        locations[i].marker.addListener('click', function() {
            populateInfoWindow(this, largeInfoWindow);
        });

        // two event listeners - one for mouse over, one ofr mouseout,
        // to change the colors back and forth
        locations[i].marker.addListener('mouseover', function() {
            this.setIcon(highlightedIcon);
        });

        // Changes the marker once you mouse off.
        locations[i].marker.addListener('mouseout', function() {
            this.setIcon(defaultIcon);
        });

        // sets the map
        // extends the bounds to include the markers.
        markers[i].setMap(map);
        bounds.extend(locations[i].marker.position);
    }

    // sets map and fits bounds.
    map.fitBounds(bounds);

    // Show pins when clicked (just a nice user function)
    // TODO: Make search function work with this.
    document.getElementById('show-listings').addEventListener('click', showListings);

    // Hide all pins when clicked (just a nice user function)
    // TODO: make search function integrate with this.
    document.getElementById('hide-listings').addEventListener('click', function() {
        hideMarkers(markers);
    });
};

// Errors out for Google maps according to their documentation
function mapError() {
    alert("Sorry!  Google Maps could not be loaded");
}

// populates the boxes that pop up when a marker is clicked.
function populateInfoWindow(marker, infowindow) {
    if (infowindow.marker != marker) {
        infowindow.marker = marker;
        infowindow.setContent('<div>' + marker.title + '</div>');
        infowindow.open(map, marker);

        // Making sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick',function(){
            infowindow.setMap(null);
        });

        var streetViewService = new google.maps.StreetViewService();
        var radius = 50;

        // In case the status is OK, which means the pano was found, compute the
        // position of the streetview image, then calculate the heading, then get a
        // panorama from that and set the options.
        function getStreetView(data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
                var nearStreetViewLocation = data.location.latLng;
                var heading = google.maps.geometry.spherical.computeHeading(
                    nearStreetViewLocation, marker.position);
                infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
                var panoramaOptions = {
                    position: nearStreetViewLocation,
                    pov: {
                        heading: heading,
                        pitch: 30
                    }
                };
                var panorama = new google.maps.StreetViewPanorama(
                    document.getElementById('pano'), panoramaOptions);
            } else {
              infowindow.setContent('<div>' + marker.title + '</div>' +
                '<div>No Street View Found</div>');
            }
        };
        // Use streetview service to get the closest streetview image within
        // 50 meters of the markers position.
        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        // Open the infowindow on the correct marker.
        infowindow.open(map, marker);
    }
};

// This function will loops through the markers array and display them all.
function showListings() {
    var bounds = new google.maps.LatLngBounds();
    // extend the boundaries of the map for each marker and display the marker.
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
        bounds.extend(markers[i].position);
    }
    map.fitBounds(bounds);
}

// this function will loop through listings and hide them all
function hideMarkers(markers) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
}

// sets the marker icon
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21,34));
    return markerImage;
}

// Knockout JS viewmodel function
// listSelect: handles when location is selected from list on the left hand side.
// search entry: handles the search functionality of the viewmodel.
var AppViewModel = function() {
    var self = this;
    self.appLocations = ko.observableArray(locations.slice());
    self.searchEntry = ko.observable('');
    self.listSelect = function(locations) {
        // Open info window on click.
        google.maps.event.trigger(locations.marker, 'click')
    };
    self.onSearchEntry = function(event) {
        this.appLocations.removeAll();
        for (var i = 0; i < locations.length; i++) {
            if (self.searchEntry() !== ''){
                if (locations[i].title.toLowerCase().indexOf(self.searchEntry().toLowerCase()) != -1) {
                    self.appLocations.push(locations[i]);
                    markers[i].setMap(map);
                } else {
                    markers[i].setMap(null);
                }
            } else {
                self.appLocations.push(locations[i]);
                markers[i].setMap(map);
            }
        }
    };
};




// instantiate the ViewModel using the operator and apply bindings
var appViewModel = new AppViewModel();

// activate knockout and apply binding.
ko.applyBindings(appViewModel);

// all the styles for the google maps.
// nice and green and healthy looking!
var styles2 = [
    {
        "featureType": "landscape",
        "stylers": [
            {
                "hue": "#FFA800"
            },
            {
                "saturation": 0
            },
            {
                "lightness": 0
            },
            {
                "gamma": 1
            }
        ]
    },
    {
        "featureType": "road.highway",
        "stylers": [
            {
                "hue": "#53FF00"
            },
            {
                "saturation": -73
            },
            {
                "lightness": 40
            },
            {
                "gamma": 1
            }
        ]
    },
    {
        "featureType": "road.arterial",
        "stylers": [
            {
                "hue": "#FBFF00"
            },
            {
                "saturation": 0
            },
            {
                "lightness": 0
            },
            {
                "gamma": 1
            }
        ]
    },
    {
        "featureType": "road.local",
        "stylers": [
            {
                "hue": "#00FFFD"
            },
            {
                "saturation": 0
            },
            {
                "lightness": 30
            },
            {
                "gamma": 1
            }
        ]
    },
    {
        "featureType": "water",
        "stylers": [
            {
                "hue": "#00BFFF"
            },
            {
                "saturation": 6
            },
            {
                "lightness": 8
            },
            {
                "gamma": 1
            }
        ]
    },
    {
        "featureType": "poi",
        "stylers": [
            {
                "hue": "#679714"
            },
            {
                "saturation": 33.4
            },
            {
                "lightness": -25.4
            },
            {
                "gamma": 1
            }
        ]
    }
];