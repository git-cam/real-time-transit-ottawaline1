

const http = require('http')
const express = require('express')
const session = require('express-session');
const path = require('path')
const favicon = require('serve-favicon')
const logger = require('morgan')
const fs = require('fs')
const bodyParser = require('body-parser'); 
//read routes modules
const routes = require('./routes/index')
const sqlite3 = require('sqlite3').verbose() //verbose provides more detailed stack trace
const db = new sqlite3.Database('data/users.db')


const apiKey = 'YOUR_API_KEY_HERE'; 
const headers = new Headers();
headers.append('apiKey', apiKey);

const  app = express() //create express middleware dispatcher

const PORT = process.env.PORT || 3000

app.use(session({
	secret: '334065455', // Change this to a secret key for session encryption
	resave: false,
	saveUninitialized: true,
  }));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs'); //use hbs handlebars wrapper

app.use(express.static(path.join(__dirname, 'public')));


app.locals.pretty = true //to generate pretty view-source code in browser

//some logger middleware functions
function methodLogger(request, response, next){
		   console.log("METHOD LOGGER")
		   console.log("================================")
		   console.log("METHOD: " + request.method)
		   console.log("URL:" + request.url)
		   next(); //call next middleware registered
}
function headerLogger(request, response, next){
		   console.log("HEADER LOGGER:")
		   console.log("Headers:")
           for(k in request.headers) console.log(k)
		   next() //call next middleware registered
}

/*
app.use(routes.authenticate); //authenticate user
*/
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(logger('dev'))
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(methodLogger)
//routes


app.get('/login',routes.login)
app.post('/login',routes.login)
app.get('/signup',routes.signup)
app.post('/signup',routes.signup)

app.use(routes.authenticate);


app.post('/mystop',async (request, response) => {
	const selectedStop = request.body.stop;

	const username = request.session.username

	const updateQuery = 'UPDATE user_stops SET stop = ? WHERE username = ?';

	db.run(updateQuery, [selectedStop, username], function (err) {
		if (err) {
		return console.error(err.message);
		}

		console.log(`Rows updated: ${this.changes}`);
	});
	response.redirect('/mystop')
});

app.get('/mystop', async (request, response) => {

	if(request.method == 'GET'){
	try {
		// Add your API key to the headers
		let headers = {
		  'apiKey': apiKey,
		};
		  //let apiUrl = 'https://external.transitapp.com/v3/public/nearby_stops';
		  let apiUrl = 'https://external.transitapp.com/v3/public/route_details';
		// Build the URL with query parameters
			let network_id = 'OC Transpo|Ottawa'
		  let urlWithParams = new URL(apiUrl);
		  let route_id = 'OCT:1410';
		  //urlWithParams.searchParams.append('lat', 45.378784);   //stops for heron
		  //urlWithParams.searchParams.append('lon', -75.680860);
		  urlWithParams.searchParams.append('global_route_id', route_id);
		  urlWithParams.searchParams.append('include_next_departure', true);
	  
		  
		  // Make the request to the external API
		  const urlres = await fetch(urlWithParams.toString(), { headers });
		  const data = await urlres.json();
		
		  // Extracting departures for each direction
		const departuresByDirection = {};

		data.itineraries.forEach((itinerary) => {
			const direction = itinerary.direction_id;
    		const directionName = direction === 0 ? "Blair bound" : "Tunney's Pasture bound";
    		const stops = itinerary.stops;

				// Extracting next 3 departures for each stop
			stops.forEach((stop) => {
				const stopName = stop.stop_name;
				const departures = [];

				for (let i = 0; i < 3; i++) {
					const departureTimeSeconds = stop.next_departure.departure_time;
        			const departureTime = new Date(departureTimeSeconds * 1000).toLocaleTimeString();

					departures.push(departureTime);
				}

				// Create or update the departures for the stop and direction
				if (!departuresByDirection[direction]) {
					departuresByDirection[direction] = {};
				  }
				if (!departuresByDirection[direction][stopName]) {
					departuresByDirection[direction][stopName] = {};
				  }
				  departuresByDirection[direction][stopName] = {
					departures,
					directionName,
				  };
			});
		});

  // Print or use the departuresByDirection object as needed
		
	console.log(JSON.stringify(departuresByDirection, null, 2));
  
  
  
  
  
	const stopChoices = ["Tunney's Pasture",'Bayview','Pimisi','Parliament / Parlement','Rideau','uOttawa','Lees','Hurdman','Tremblay','St-Laurent','Cyrville','Blair']
  
	const usernameToSearch = request.session.username;

	// Query to retrieve the stop for a specific username
 	const query = `SELECT stop FROM user_stops WHERE username = ?`;

	let stop = 'none'
	db.get(query, [usernameToSearch], (err, row) => {
		if (err) {
		  console.error('Error executing query:', err);
		  // Handle the error, send a response, or perform other actions
		} else {
		  if (row) {
			stop = row.stop;
			console.log(`Stop for ${usernameToSearch}: ${stop}`);
			// Call a function or perform other actions with the retrieved stop information
			handleStop(stop);
		  } else {
			console.log(`No entry found for username: ${usernameToSearch}`);
			// Handle the case where no entry is found for the given username
		  }
		}
	  });
	  
	  // Define a function to handle the stop information
	  function handleStop(stop) {
		// Do something with the retrieved stop information
		console.log('Handling stop:', stop);

		const userSelectedStop = stop;
	
		//hardcoding :(
			const blairBoundDepartures = [];
			const tunneysPastureBoundDepartures = [];
			
			for (const directionKey in departuresByDirection) {
			  if (departuresByDirection.hasOwnProperty(directionKey)) {
				const stopsForDirection = departuresByDirection[directionKey];
			
				for (const stopName in stopsForDirection) {
				  if (stopsForDirection.hasOwnProperty(stopName) && stopName === userSelectedStop) {
					// Found the selected stop for this direction
					const departures = stopsForDirection[stopName].departures;
			
					if (directionKey === "0") {
					  // Blair bound
					  blairBoundDepartures.push(...departures);
					} else if (directionKey === "1") {
					  // Tunney's Pasture bound
					  tunneysPastureBoundDepartures.push(...departures);
					}
				  }
				}
			  }
			}


	//in case they were empty, quick fix
	blairBoundDepartures.push(0)
	tunneysPastureBoundDepartures.push(0)


	console.log(blairBoundDepartures)
	console.log(tunneysPastureBoundDepartures)
	//console.log(JSON.stringify(departuresForSelectedStop, null, 2));
	let isAdmin = false
	if(request.session.user_role === 'admin'){
		isAdmin = true
	}
	let validStop = true
	if(stop === 'none'){
		validStop = false
	}
	console.log("mystop")
	
	//console.log(departuresForSelectedStop)
	response.render('mystop',{stopChoices:stopChoices, isAdmin:isAdmin, validStop:validStop, stop:stop, ttimee: tunneysPastureBoundDepartures[0], btime: blairBoundDepartures[0]});
		  
	  }

	
	
	  
		
	} catch (error) {
		console.error('Error:', error);
		response.status(500).send('Internal Server Error');
	}
}



});
app.get('/home', async (request, response) => {
	console.log("In this path")
	try {
	  // Add your API key to the headers
	  let headers = {
		'apiKey': apiKey,
	  };
		//let apiUrl = 'https://external.transitapp.com/v3/public/nearby_stops';
		let apiUrl = 'https://external.transitapp.com/v3/public/route_details';
	  // Build the URL with query parameters
	  	let network_id = 'OC Transpo|Ottawa'
		let urlWithParams = new URL(apiUrl);
		let route_id = 'OCT:1410';
		//urlWithParams.searchParams.append('lat', 45.378784);   //stops for heron
		//urlWithParams.searchParams.append('lon', -75.680860);
		urlWithParams.searchParams.append('global_route_id', route_id);
		urlWithParams.searchParams.append('include_next_departure', true);
	
		//heron 3a (towards school)  OCT:88671
		// Make the request to the external API
		const urlres = await fetch(urlWithParams.toString(), { headers });
		const data = await urlres.json();
	  
		

		const seenStations = {};

		data.itineraries.forEach((itinerary) => {
  		itinerary.stops.forEach((stop) => {
   		const stopKey = `${stop.stop_name}_${itinerary.direction_headsign}`;
   		const currentDepartureTime = stop.next_departure.departure_time;

    if (!seenStations[stopKey] || currentDepartureTime < seenStations[stopKey].departureTime) {
      seenStations[stopKey] = {
        stopName: stop.stop_name,
        directionHeadsign: itinerary.direction_headsign,
        departureTime: currentDepartureTime,
      };
    }
  });
});

// Convert departure times to human-readable format
const stopsData = Object.values(seenStations).map((stopData) => {
  stopData.departureTime = new Date(stopData.departureTime * 1000).toLocaleTimeString();
  return stopData;
});








		  
		console.log("HEre 1");
		console.log(stopsData);
		const blairBoundStops = stopsData.filter(stop => stop.directionHeadsign === 'East');
		const tunneysPastureBoundStops = stopsData.filter(stop => stop.directionHeadsign === "West");

		
		//console.log(stopsData);
		//response.json(data);
		console.log("you are ",request.session.username)
		let isAdmin = false
		if(request.session.user_role === 'admin'){
			isAdmin = true
		}

		console.log("TEST LOG!!!");
		console.log(blairBoundStops)
		console.log(tunneysPastureBoundStops)
		
		response.render('home', {blairBoundStops, tunneysPastureBoundStops, isAdmin });
	  // Respond to the user with the API data 
	  
	} catch (error) {
	  console.error('Error:', error);
	  response.status(500).send('Internal Server Error');
	}

	
	
	  
  });



//app.get('/home',routes.home)
//app.get('/routes',routes.home)

app.get('/users',routes.users)
//app.get('/stop/*',routes.home)
//app.get('/about',routes.home)



//app.post('/handleLogin', routes.handleLogin)

//start server
app.listen(PORT, err => {
  if(err) console.log(err)
  else {
		console.log(`Server listening on port: ${PORT} CNTL:-C to stop`)
		console.log(`To Test:`)
		
		console.log('http://localhost:3000/home')
		console.log('http://localhost:3000/users')
		console.log('http://localhost:3000/login')
		
		//console.log('http://localhost:3000/stop/')
		//console.log('http://localhost:3000/song/372')
	}
})
