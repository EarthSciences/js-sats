
function sat(args, with_vel_mag = false, stime = false) {
	var rval = { ok: false };
	
	var at_time = new Date();
	if(stime === false) {
		at_time = new Date(args.at_time.getTime());
	}
	else {
		at_time = stime;
	}
	//console.log("   time = " + at_time);
	rval.observerGeo = {};
	rval.observerGeo.hgt = args.hgt;
	rval.observerGeo.lat_degrees = args.lat;
	rval.observerGeo.lon_degrees = args.lon;
	rval.observerGeo.lat_radians = satellite.degreesToRadians(rval.observerGeo.lat_degrees);
	rval.observerGeo.lon_radians = satellite.degreesToRadians(rval.observerGeo.lon_degrees);
	var satrec = satellite.twoline2satrec(args.tleLine1, args.tleLine2);
	if(typeof satrec === 'undefined') return rval;
	var positionAndVelocity = satellite.propagate(satrec, at_time);
	if(!('velocity' in positionAndVelocity)) return rval;
	if(!('position' in positionAndVelocity)) return rval;
	rval.positionEci = positionAndVelocity.position;
	var velocityEci = {};
	velocityEci.xdot = positionAndVelocity.velocity.x;
	velocityEci.ydot = positionAndVelocity.velocity.y;
	velocityEci.zdot = positionAndVelocity.velocity.z;
	if(with_vel_mag) { // Avoid expensive math calcs when not needed.
		velocityEci.vdot = Math.sqrt(
			(positionAndVelocity.velocity.x*positionAndVelocity.velocity.x)+
			(positionAndVelocity.velocity.y*positionAndVelocity.velocity.y)+
			(positionAndVelocity.velocity.z*positionAndVelocity.velocity.z)
		);
	}
	rval.velocityEci = velocityEci;
	var observerGd = { 
		longitude: rval.observerGeo.lon_radians,
		latitude: rval.observerGeo.lat_radians,
		height: rval.observerGeo.hgt 
	};
	rval.gmst = satellite.gstime(at_time);
	var positionEcf   = satellite.eciToEcf(positionAndVelocity.position, rval.gmst),
		observerEcf   = satellite.geodeticToEcf(observerGd),
		positionGd    = satellite.eciToGeodetic(positionAndVelocity.position, rval.gmst),
		lookAngles    = satellite.ecfToLookAngles(observerGd, positionEcf);
	rval.positionEcf = positionEcf;
	rval.observerEcf = observerEcf;
	rval.groundPoint = {};
	rval.groundPoint.hgt_kms = positionGd.height;
	rval.groundPoint.lat_radians = positionGd.latitude;
	rval.groundPoint.lon_radians = positionGd.longitude;
	rval.groundPoint.lat_degrees = satellite.radiansToDegrees(positionGd.latitude);
	rval.groundPoint.lon_degrees = satellite.radiansToDegrees(positionGd.longitude);
	rval.lookAngles = {};
	rval.lookAngles.az_radians = lookAngles.azimuth;
	rval.lookAngles.el_radians = lookAngles.elevation;
	rval.lookAngles.range_kms = lookAngles.rangeSat;
	rval.lookAngles.az_degrees = satellite.radiansToDegrees(lookAngles.azimuth);
	rval.lookAngles.el_degrees = satellite.radiansToDegrees(lookAngles.elevation);
	rval.ok = true;
	return rval;
}


