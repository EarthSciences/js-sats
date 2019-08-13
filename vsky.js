
function magof(x, y, z) {
        return Math.sqrt((x*x)+(y*y)+(z*z));
}

//function vsky(fdate, tleLine1, tleLine2, obs) {
function vsky(args) {
	//var tleLine1 = '1 25544U 98067A   19220.55000817  .00016717  00000-0  10270-3 0  9018',
	//	tleLine2 = '2 25544  51.6426 101.4845 0006188 236.8902 123.1656 15.51048261 23374';

	var satrec = satellite.twoline2satrec(args.tleLine1, args.tleLine2);

	var fdate = args.at_time;
	//var fdate = new Date('2019-09-04T03:31:27');
	//var fdate = in_date;

	console.log("fdate = " + fdate.toDateString() + " " + fdate.toGMTString());
	
	var positionAndVelocity = satellite.propagate(satrec, fdate);

	// The position_velocity result is a key-value pair of ECI coordinates.
	// These are the base results from which all other coordinates are derived.
	var positionEci = positionAndVelocity.position,
		velocityEci = positionAndVelocity.velocity;

	var obslat = args.lat; //56.2214; //56.2393;
	var obslon = args.lon; //-2.6956; //-3.2073;
	var obshgt = args.hgt; //0.003;

	var observerGd = { 
		longitude: satellite.degreesToRadians(obslon), 
		latitude: satellite.degreesToRadians(obslat), 
		height: obshgt 
	};


	// You will need GMST for some of the coordinate transforms.
	// http://en.wikipedia.org/wiki/Sidereal_time#Definition
	//var gmst = satellite.gstime(new Date());
	var gmst = satellite.gstime(fdate);

	// You can get ECF, Geodetic, Look Angles, and Doppler Factor.
	var positionEcf   = satellite.eciToEcf(positionEci, gmst),
		observerEcf   = satellite.geodeticToEcf(observerGd),
		positionGd    = satellite.eciToGeodetic(positionEci, gmst),
		lookAngles    = satellite.ecfToLookAngles(observerGd, positionEcf);

	// The coordinates are all stored in key-value pairs.
	// ECI and ECF are accessed by `x`, `y`, `z` properties.
	var satelliteX = positionEci.x,
		satelliteY = positionEci.y,
		satelliteZ = positionEci.z;

	console.log("Satellite Position ECI/X = " + satelliteX.toFixed(3) + " km");
	console.log("Satellite Position ECI/Y = " + satelliteY.toFixed(3) + " km");
	console.log("Satellite Position ECI/Z = " + satelliteZ.toFixed(3) + " km");
	console.log("Satellite Velocity ECI/X = " + velocityEci.x.toFixed(3) + " km/s");
	console.log("Satellite Velocity ECI/Y = " + velocityEci.y.toFixed(3) + " km/s");
	console.log("Satellite Velocity ECI/Z = " + velocityEci.z.toFixed(3) + " km/s");
	var vel = magof(velocityEci.x, velocityEci.y, velocityEci.z);
	console.log("Satellite Velocity Absol = " + vel.toFixed(3) + " km/s");

	var poslon = satellite.radiansToDegrees(positionGd.longitude);
	var poslat = satellite.radiansToDegrees(positionGd.latitude);
	var poshgt = positionGd.height;

	console.log("Satellite GroundPoint lon = " + poslon.toFixed(4) + " degrees");
	console.log("Satellite GroundPoint lat = " + poslat.toFixed(4) + " degrees");
	console.log("Satellite GroundPoint hgt = " + poshgt.toFixed(4) + " km");
	console.log("https://www.google.com/maps/@" + poslat.toFixed(6) + "," + poslon.toFixed(6) + ",14z");


	// Look Angles may be accessed by `azimuth`, `elevation`, `range_sat` properties.
	var azimuth   = lookAngles.azimuth,
		elevation = lookAngles.elevation,
		rangeSat  = lookAngles.rangeSat;

	var la_az = satellite.radiansToDegrees(azimuth);
	var la_el = satellite.radiansToDegrees(elevation);
	var la_rg = rangeSat;
	console.log("Look angle azimuth = " + la_az.toFixed(1) + " degrees");
	console.log("Look angle elevation = " + la_el.toFixed(1) + " degrees");
	console.log("Look angle range = " + la_rg.toFixed(1) + " km");

	var obstimes = SunCalc.getTimes(fdate, obslat, obslon);
	var sunriseStr = obstimes.sunrise.getHours() + ':' + obstimes.sunrise.getMinutes();
	var sunrisePos = SunCalc.getPosition(obstimes.sunrise, obslat, obslon);
	var sunriseAzimuth = (sunrisePos.azimuth * 180 / Math.PI).toFixed(1);
	console.log("Obs sun data = " + sunriseStr + " " + sunriseAzimuth);


	var sattimes = SunCalc.getTimes(fdate, poslat, poslon);
	var satsunriseStr = sattimes.sunrise.getHours() + ':' + sattimes.sunrise.getMinutes();
	var satsunrisePos = SunCalc.getPosition(sattimes.sunrise, poslat, poslon);
	var satsunriseAzimuth = (satsunrisePos.azimuth * 180 / Math.PI).toFixed(1);
	var satsunriseAltitude = (satsunrisePos.altitude * 180 / Math.PI).toFixed(1);
	console.log("Obs sat data = " + satsunriseStr + " " + satsunriseAzimuth + " " + satsunriseAltitude);

	if(false) {
		const a_base = require('astronomia/src/base');
		const a_solar = require('astronomia/src/solar');
		const a_julian = require('astronomia/src/julian');
		const a_solarxyz = require('astronomia/src/solarxyz');
		const a_planetposition = require('astronomia/src/planetposition');
		const vsop87Bearth = require('astronomia/data/vsop87Bearth')

		var earth = new a_planetposition.Planet(vsop87Bearth);
		var jd = a_julian.DateToJD(fdate);
		var sunpos = a_solarxyz.position(earth, jd);
		var au = a_base.AU; //0.989 * 1.496E+8;;
		console.log("Sun Position ECI/X: " + (sunpos.x*au).toFixed(3) + " km");
		console.log("Sun Position ECI/Y: " + (sunpos.y*au).toFixed(3) + " km");
		console.log("Sun Position ECI/Z: " + (sunpos.z*au).toFixed(3) + " km");
		var sunabs = magof(sunpos.x*au, sunpos.y*au, sunpos.z*au);
		console.log("Sun Distance: " + sunabs.toFixed(3));
}

}




