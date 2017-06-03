
// Locations for the app. Objects.

var locations = [
	{
		"title" : "Shizen Vegan Sushi Bar", 
		"location" : { "lat" : 37.768313, "lng" : -122.421643 }
	},
    {
    	"title" : "Halu Ramen",
    	"location" : { "lat" : 37.782568, "lng" : -122.466456 }
    },
    {
    	"title" : "Gracias Madre San Francisco",
    	"location" : { "lat" : 37.761572, "lng" : -122.419080 }
    },
    {
    	"title" : "No No Burger",
    	"location" : { "lat" : 37.769769, "lng" : -122.412049 }
    },
    {
    	"title" : "Nourish Cafe",
    	"location" : { "lat" : 37.785241, "lng" : -122.464783 }
    },
    {
    	"title" : "Thai Idea",
    	"location" : { "lat" : 37.783457, "lng" : -122.419116 }
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

// create a blank array for all listing markers
var markers = [];

var polygon = null;

var placeMarkers = [];

function initMap() {
   // Map Constructor 
   map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 37.785, lng: -122.446},
    	zoom: 12,
    	styles: styles2,
    	mapTypeControl: false
   });

   // This autocomplete is for use in the search within time entry box.
    var timeAutocomplete = new google.maps.places.Autocomplete(
    	document.getElementById('search-within-time-text'));
    // This autocomplete is for use in the geocoder entry box.
    // var zoomAutocomplete = new google.maps.places.Autocomplete(
    // 	document.getElementById('zoom-to-area-text'));
    //         //Bias the boundaries within the map for the zoom to area text.
    //         zoomAutocomplete.bindTo('bounds', map);
    // Create a searchbox in order to execute a places search
    var searchBox = new google.maps.places.SearchBox(
        document.getElementById('places-search'));
    // Bias the searchbox to within the bounds of the map.
        searchBox.setBounds(map.getBounds());

            var largeInfowindow = new google.maps.InfoWindow();

            // initialize the drawing manager
            var drawingManager = new google.maps.drawing.DrawingManager({
              drawingMode: google.maps.drawing.OverlayType.POLYGON,
              drawingControl: true,
              drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_LEFT,
                drawingModes: [
                  google.maps.drawing.OverlayType.POLYGON
                ]
              }
            });
            // style the markers
            var defaultIcon = makeMarkerIcon('0091ff');

            // create a "highlighted location" marker color
            var highlightedIcon = makeMarkerIcon('FFFF24');

            for (var i = 0; i < locations.length; i++) {
              var position = locations[i].location;
              var title = locations[i].title;

              var marker = new google.maps.Marker({
                position: position,
                title: title,
                icon: defaultIcon,
                animation: google.maps.Animation.DROP,
                id: i
              });
              // Push the marker to our array of markers
              markers.push(marker);
              // Create an onclick event to open an infowindow at each marker.
              marker.addListener('click', function(){
                populateInfoWindow(this, largeInfowindow);
              });
              // two event listeners - one for mouse over, one ofr mouseout,
              // to change the colors back and forth
              marker.addListener('mouseover', function() {
                this.setIcon(highlightedIcon);
              });
              marker.addListener('mouseout', function() {
                this.setIcon(defaultIcon);
              })
            }

            document.getElementById('show-listings').addEventListener('click', showListings);
            document.getElementById('hide-listings').addEventListener('click', function() {
              hideMarkers(markers);
               });

            document.getElementById('toggle-drawing').addEventListener('click', function() {
              toggleDrawing(drawingManager);
            });

            // document.getElementById('zoom-to-area').addEventListener('click', function() {
            //   zoomToArea();
            // });

            document.getElementById('search-within-time').addEventListener('click', function() {
              searchWithinTime();
            });

            // Listen for the event fired when the user selects a prediction from the
            // picklist and retrieve more details for that place.
            searchBox.addListener('places_changed', function() {
              searchBoxPlaces(this);
            });

            // Listen for the event fired when the user selects a prediction and clicks
            // "go" more details for that place.
            // document.getElementById('go-places').addEventListener('click', textSearchPlaces);

            // Add an event listener so that the polygon is captured,  call the
            // searchWithinPolygon function. This will show the markers in the polygon,
            // and hide any outside of it.
            drawingManager.addListener('overlaycomplete', function(event) {
              // First, check if there is an existing polygon.
              // If there is, get rid of it and remove the markers
              if (polygon) {
                polygon.setMap(null);
                hideListings(markers);
              }
              // Switching the drawing mode to the HAND (i.e., no longer drawing).
              drawingManager.setDrawingMode(null);
              // Creating a new editable polygon from the overlay.
              polygon = event.overlay;
              polygon.setEditable(true);
              // Searching within the polygon.
              searchWithinPolygon();
              // Make sure the search is re-done if the poly is changed.
              polygon.getPath().addListener('set_at', searchWithinPolygon);
              polygon.getPath().addListener('insert_at', searchWithinPolygon);
            });
          };

function mapError() {
    alert("Sorry!  Google Maps could not be loaded");
}

function populateInfoWindow(marker, infowindow) {
    if (infowindow.marker != marker) {
        infowindow.marker = marker;
        infowindow.setContent('<div>' + marker.title + '</div>');
        infowindow.open(map, marker);
        // Making sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick',function(){
            infowindow.setMarker(null);
        });
    var streetViewService = new google.maps.StreetViewService();
    var radius = 50;
    // In case the status is OK, which means the pano was found, compute the
    // position of the streetview image, then calculate the heading, then get a
    // panorama from that and set the options
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
    // 50 meters of the markers position
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

           // This shows and hides (respectively) the drawing options.
function toggleDrawing(drawingManager) {
if (drawingManager.map) {
  drawingManager.setMap(null);
  // In case the user drew anything, get rid of the polygon
  if (polygon !== null) {
    polygon.setMap(null);
  }
} else {
    drawingManager.setMap(map);
    }
}

// This function hides all markers outside the polygon,
// and shows only the ones within it. This is so that the
// user can specify an exact area of search.
function searchWithinPolygon() {
for (var i = 0; i < markers.length; i++) {
  if (google.maps.geometry.poly.containsLocation(markers[i].position, polygon)) {
    markers[i].setMap(map);
  } else {
    markers[i].setMap(null);
  }
}
}

           // This function takes the input value in the find nearby area text input
          // locates it, and then zooms into that area. This is so that the user can
          // show all listings, then decide to focus on one area of the map.
          // function zoomToArea() {
          //   // Initialize the geocoder.
          //   var geocoder = new google.maps.Geocoder();
          //   // Get the address or place that the user entered.
          //   var address = document.getElementById('zoom-to-area-text').value;
          //   // Make sure the address isn't blank.
          //   if (address == '') {
          //     window.alert('You must enter an area, or address.');
          //   } else {
          //     // Geocode the address/area entered to get the center. Then, center the map
          //     // on it and zoom in
          //     geocoder.geocode(
          //       { address: address,
          //         componentRestrictions: {locality: 'New York'}
          //       }, function(results, status) {
          //         if (status == google.maps.GeocoderStatus.OK) {
          //           map.setCenter(results[0].geometry.location);
          //           map.setZoom(15);
          //         } else {
          //           window.alert('We could not find that location - try entering a more' +
          //               ' specific place.');
          //         }
          //       });
          //   }
          // }

          function searchWithinTime() {
            // Initialize the distance matrix service.
            var distanceMatrixService = new google.maps.DistanceMatrixService;
            var address = document.getElementById('search-within-time-text').value;
            // Check to make sure the place entered isn't blank.
            if (address == '') {
              window.alert('You must enter an address.');
            } else {
              hideMarkers(markers);
              // Use the distance matrix service to calculate the duration of the
              // routes between all our markers, and the destination address entered
              // by the user. Then put all the origins into an origin matrix.
              var origins = [];
              for (var i = 0; i < markers.length; i++) {
                origins[i] = markers[i].position;
              }
              var destination = address;
              var mode = document.getElementById('mode').value;
              // Now that both the origins and destination are defined, get all the
              // info for the distances between them.
              distanceMatrixService.getDistanceMatrix({
                origins: origins,
                destinations: [destination],
                travelMode: google.maps.TravelMode[mode],
                unitSystem: google.maps.UnitSystem.IMPERIAL,
              }, function(response, status) {
                if (status !== google.maps.DistanceMatrixStatus.OK) {
                  window.alert('Error was: ' + status);
                } else {
                  displayMarkersWithinTime(response);
                }
              });
            }
          }

          // This function will go through each of the results, and,
          // if the distance is LESS than the value in the picker, show it on the map.
          function displayMarkersWithinTime(response) {
            var maxDuration = document.getElementById('max-duration').value;
            var origins = response.originAddresses;
            var destinations = response.destinationAddresses;
            // Parse through the results, and get the distance and duration of each.
            // Because there might be  multiple origins and destinations we have a nested loop
            // Then, make sure at least 1 result was found.
            var atLeastOne = false;
            for (var i = 0; i < origins.length; i++) {
              var results = response.rows[i].elements;
              for (var j = 0; j < results.length; j++) {
                var element = results[j];
                if (element.status === "OK") {
                  // The distance is returned in feet, but the TEXT is in miles. If we wanted to switch
                  // the function to show markers within a user-entered DISTANCE, we would need the
                  // value for distance, but for now we only need the text.
                  var distanceText = element.distance.text;
                  // Duration value is given in seconds so we make it MINUTES. We need both the value
                  // and the text.
                  var duration = element.duration.value / 60;
                  var durationText = element.duration.text;
                  if (duration <= maxDuration) {
                    //the origin [i] should = the markers[i]
                    markers[i].setMap(map);
                    atLeastOne = true;
                    // Create a mini infowindow to open immediately and contain the
                    // distance and duration
                     var infowindow = new google.maps.InfoWindow({
                      content: durationText + ' away, ' + distanceText +
                        '<div><input type=\"button\" value=\"View Route\" onclick =' +
                        '\"displayDirections(&quot;' + origins[i] + '&quot;);\"></input></div>'
                    });
                    infowindow.open(map, markers[i]);
                    // Put this in so that this small window closes if the user clicks
                    // the marker, when the big infowindow opens
                    markers[i].infowindow = infowindow;
                    google.maps.event.addListener(markers[i], 'click', function() {
                      this.infowindow.close();
                    });
                  }
                }
              }
            }
            if (!atLeastOne) {
              window.alert('We could not find any locations within that distance!');
            }
          }
          function displayDirections(origin) {
            hideMarkers(markers);
            var directionsService = new google.maps.DirectionsService;
            // Get the destination address from the user entered value.
            var destinationAddress =
                document.getElementById('search-within-time-text').value;
            // Get mode again from the user entered value.
            var mode = document.getElementById('mode').value;
            directionsService.route({
              // The origin is the passed in marker's position.
              origin: origin,
              // The destination is user entered address.
              destination: destinationAddress,
              travelMode: google.maps.TravelMode[mode]
            }, function(response, status) {
              if (status === google.maps.DirectionsStatus.OK) {
                var directionsDisplay = new google.maps.DirectionsRenderer({
                  map: map,
                  directions: response,
                  draggable: true,
                  polylineOptions: {
                    strokeColor: 'green'
                  }
                });
              } else {
                window.alert('Directions request failed due to ' + status);
              }
            });
          }
          // This function fires when the user selects a searchbox picklist item.
          // It will do a nearby search using the selected query string or place.
          function searchBoxPlaces(searchBox) {
            hideMarkers(placeMarkers);
            var places = searchBox.getPlaces();
            // For each place, get the icon, name and location.
            createMarkersForPlaces(places);
            if (places.length == 0) {
              window.alert('We did not find any places matching that search!');
            }
          }

          // // This function firest when the user select "go" on the places search.
          // // It will do a nearby search using the entered query string or place.
          // function textSearchPlaces() {
          //   var bounds = map.getBounds();
          //   hideMarkers(placeMarkers);
          //   var placesService = new google.maps.places.PlacesService(map);
          //   placesService.textSearch({
          //     query: document.getElementById('places-search').value,
          //     bounds: bounds
          //   }, function(results, status) {
          //     if (status === google.maps.places.PlacesServiceStatus.OK) {
          //       createMarkersForPlaces(results);
          //     }
          //   });
          // }

          // This function creates markers for each place found in either places search.
          function createMarkersForPlaces(places) {
            var bounds = new google.maps.LatLngBounds();
            for (var i = 0; i < places.length; i++) {
              var place = places[i];
              var icon = {
                url: place.icon,
                size: new google.maps.Size(35, 35),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(15, 34),
                scaledSize: new google.maps.Size(25, 25)
              };
              // Create a marker for each place.
              var marker = new google.maps.Marker({
                map: map,
                icon: icon,
                title: place.name,
                position: place.geometry.location,
                id: place.place_id
              });
              // Create a single infowindow to be used with the place details information
              // so that only one is open at once.
              var placeInfoWindow = new google.maps.InfoWindow();
              // If a marker is clicked, do a place details search on it in the next function.
              marker.addListener('click', function() {
                if (placeInfoWindow.marker == this) {
                  console.log("This infowindow already is on this marker!");
                } else {
                  getPlacesDetails(this, placeInfoWindow);
                }
              });
              placeMarkers.push(marker);
              if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
              } else {
                bounds.extend(place.geometry.location);
              }
            }
            map.fitBounds(bounds);
          }
          // This is the PLACE DETAILS search - it's the most detailed so it's only
        // executed when a marker is selected, indicating the user wants more
        // details about that place.
        function getPlacesDetails(marker, infowindow) {
          var service = new google.maps.places.PlacesService(map);
          service.getDetails({
            placeId: marker.id
          }, function(place, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
              // Set the marker property on this infowindow so it isn't created again.
              infowindow.marker = marker;
              var innerHTML = '<div>';
              if (place.name) {
                innerHTML += '<strong>' + place.name + '</strong>';
              }
              if (place.formatted_address) {
                innerHTML += '<br>' + place.formatted_address;
              }
              if (place.formatted_phone_number) {
                innerHTML += '<br>' + place.formatted_phone_number;
              }
              if (place.opening_hours) {
                innerHTML += '<br><br><strong>Hours:</strong><br>' +
                    place.opening_hours.weekday_text[0] + '<br>' +
                    place.opening_hours.weekday_text[1] + '<br>' +
                    place.opening_hours.weekday_text[2] + '<br>' +
                    place.opening_hours.weekday_text[3] + '<br>' +
                    place.opening_hours.weekday_text[4] + '<br>' +
                    place.opening_hours.weekday_text[5] + '<br>' +
                    place.opening_hours.weekday_text[6];
              }
              if (place.photos) {
                innerHTML += '<br><br><img src="' + place.photos[0].getUrl(
                    {maxHeight: 100, maxWidth: 200}) + '">';
              }
              innerHTML += '</div>';
              infowindow.setContent(innerHTML);
              infowindow.open(map, marker);
              // Make sure the marker property is cleared if the infowindow is closed.
              infowindow.addListener('closeclick', function() {
                infowindow.marker = null;
              });
            }
          });
        }

var AppViewModel = function() {
    var self = this;
    self.locations = ko.observableArray();
    self.searchEntry = ko.observable();
    self.listSelect = function() {
            // TODO: open info windows
            // populateInfoWindow()
            // TODO: trigger animations
            // google.maps.event
        };
    self.onSearchEntry = function(event) {
        if (self.searchEntry() !== '') {
        //TODO: find the thing
    } else {
        for (var i = 0; i < locations.length; i++) {
            self.locations[i].title;
        }
    };

};
};

// instantiate the ViewModel using the operator and apply bindings
var appViewModel = new AppViewModel();

// activate knockout and apply binding.
ko.applyBindings(appViewModel);

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


// var styles = [
// 	{
// 		featureType: 'water',
// 		stylers: [
// 			{
// 				color: '#19a0d8' 
// 			}
// 		]
// 	},
// 	{
// 	featureType: 'administrative',
// 	elementType: 'labels.text.stroke',
// 	stylers: [
// 	{ color: '#ffffff' },
// 	{ weight: 6 }
// 	]
// 	},
// 	{
// 	featureType: 'administrative',
// 	elementType: 'labels.text.fill',
// 	stylers: [
// 	{ color: '#e85113' }
// 	]
// 	},
// 	{
// 	featureType: 'road.highway',
// 	elementType: 'geometry.stroke',
// 	stylers: [
// 	{ color: '#efe9e4' },
// 	{ lightness: -40 }
// 	]
// 	},
// 	{
// 	featureType: 'transit.station',
// 	stylers: [
// 	{ weight: 9 },
// 	{ hue: '#e85113' }
// 	]
// 	},
// 	{
// 	featureType: 'road.highway',
// 	elementType: 'labels.icon',
// 	stylers: [
// 	{ visibility: 'off' }
// 	]
// 	},
// 	{
// 	featureType: 'water',
// 	elementType: 'labels.text.stroke',
// 	stylers: [
// 	{ lightness: 100 }
// 	]
// 	},
// 	{
// 		featureType: 'water',
// 		elementType: 'labels.text.fill',
// 		stylers: [
// 			{ 
// 				lightness: -100 
// 			}
// 		]
// 	},
// 	{
// 		featureType: 'poi',
// 		elementType: 'geometry',
// 		stylers: [
// 	{ visibility: 'on' },
// 	{ color: '#f0e4d3' }
// 	]
// 	},
// 	{
// 		featureType: 'road.highway',
// 		elementType: 'geometry.fill',
// 		stylers: [
// 	{ color: '#efe9e4' },
// 	{ lightness: -25 }
// 	]
// }
// ];

// ----------------

// var Cat = function() {
// 	this.locations = ko.observable(data.clickCount);
// 	this.imgSrc = ko.observable('img/34123123');
// 	this.name = ko.observable('tabby');
// }

// var ViewModel = function () {
// 	var self = this;
// 	this.incrementCounter = function() {
// 		self.currentCat().clickCount(self.currentCat().clickCount() + 1);
// 	};

// 	this.catList = ko.observableArray([]);

// 	initialCats.forEach(function(catItem){
// 		self.catList.push( new cat(catItem) );
// 	})
// 	this.currentCat = ko.observable( this.currentCat()[0] );
// 	this.setCta = function(clickedCat) {
// 		self.currentCat(clickedCat)
// 	};
// ko.applyBindings(new ViewModel())


// /* HTML shit */
// div data-bind="with:currentCat"
// data-bind="text: currentCat().name"
// data-bind "click: $parent.incrementCounter, attr: { imgSrc }"
// </div>

// <ul data-bind="with:currentCat">
// <li data-bind"text: name, click: $parent.setCat">
