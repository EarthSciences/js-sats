
function sat_checkbox_callback(that) 
{
	planetarium.draw();
	$(".satcb").each(function(idx, cb) {
		var o = $("#" + idx + ":checked");
		if(cb.checked) {
			display_sats.forEach(function(rval, idx) {
				if(parseInt(rval.args.satid) == parseInt(cb.id)) {
					console.log("Redrawing " + rval.args.satid);
					drawsat_live(rval.args, planetarium);
				}
			});
		}		
	});
}

function clear_sat_list() 
{
	$("#maintable_div").empty();
	$("#maintable_div").html("<table id='maintable' width='100%'><tr></tr></table>");
	display_sats = null;
	display_sats = new Array();
}

function show_sat_list(sats)
{
	$("#maintable_div").html("<table id='maintable' width='100%'><tr></tr></table>");
	sats.forEach(function(rval, index) {
		var id = rval.args.satid;
		var href = '<a target="_blank" href="https://heavens-above.com/orbit.aspx?satid=' + rval.args.satid + '">' + rval.args.satid + '</a>';
		var tr = "<tr>" +
				"<td width='1%'><input type='checkbox' class='satcb' id='"+id+"' onclick='sat_checkbox_callback(this.id)' checked='checked'></checkbox></td>" +
				"<td width='1%'>" + href+ "</td>" +
				"<td>" + rval.args.tleLine0 + "</td>" +	
				"<td>Inclination: " + rval.args.inclination + "°</td>" +	
				"<tr>";
		$('#maintable tr:last').after(tr);
	});
}

function load_sats()
{
	sats = new Array;
	$.getJSON("sats.json", 
	function(data) {
		data.forEach(function(item, index){
			var sat = {};
			sat.satid = item.OBJECT_NUMBER;
			sat.line0 = item.TLE_LINE0;
			sat.line1 = item.TLE_LINE1;
			sat.line2 = item.TLE_LINE2;
			sat.inclination = item.INCLINATION;
			sats.push(sat);
		});
	},
	function() {
	});
	console.log("Specials");
	$.getJSON("specials.json", 
	function(data) {
		data.forEach(function(item, index){
			var sat = {};
			sat.satid = item.OBJECT_NUMBER;
			sat.line0 = item.TLE_LINE0;
			sat.line1 = item.TLE_LINE1;
			sat.line2 = item.TLE_LINE2;
			sat.inclination = item.INCLINATION;
			sats.push(sat);
			console.log(sat);
		});
	},
	function() {
	});
	return sats;
}

function drawsats_array(sats, planetarium) 
{
	sats.forEach(function(rval, index) {
		if(rval.lookAngles.el_degrees > 5) {
			//console.log("Over horizon: " + rval.args.satid);
			drawsat_live(rval.args, planetarium);
		}
	});
}

function drawsat_live(args, planetarium) 
{
	above_count = 0;
	var maxb,minb,maxl,old,a,b,c,oldx,oldy,bstep;
	bstep = 2;
	var sdate_obj = new Date(args.at_time.getTime() - (10*60000));
	var edate_obj = new Date(args.at_time.getTime() + (10*60000));
	start_time = sdate_obj.getTime();
	end_time   = edate_obj.getTime();
	old = { moved:false };
	var c = planetarium.ctx;
	c.beginPath(); 
	c.strokeStyle = "green";
	c.lineWidth = 1.5;
	maxl = planetarium.maxLine();
	args_copy = args;
	for(start_time = sdate_obj.getTime(); start_time < end_time; ) {		
		var sendclock = new Date(start_time);
		var rval = sat(args_copy, true, sendclock);
		if(rval.ok && rval.lookAngles.el_degrees > 0) { 
			if(false && above_count == 0) {
				start_time -= (1*60000);
				continue;
			}
			old = myjoinpoint(planetarium, "az", rval.lookAngles.az_radians, rval.lookAngles.el_radians, old, maxl);
			end_time += (1*60000) // Advance to get LOS
			above_count++;
		}
		start_time += 15000;
		var temp = new Date(start_time);
		start_time = temp.getTime();
	}
	c.stroke();	
}

function scannow()
{
	clear_sat_list();
	var ldate_str = $("#sdate").val();
	var ldate = new Date(ldate_str);
	satellites.forEach(function(item, index){
		if(true || item.satid == 25544) { 
			var lat = parseFloat($("#latitude").val());
			var lon = parseFloat($("#longitude").val());
			var hgt = parseFloat($("#height").val());
			var args = {
					lat: lat, 
					lon: lon,
					hgt: hgt,
					at_time: ldate,
					tleLine0: item.line0,
					tleLine1: item.line1,
					tleLine2: item.line2,
					inclination: item.inclination
			};
			var rval = sat(args, true);
			if(rval.ok) {
				if(rval.lookAngles.el_degrees > 5) {
				args.satid = item.satid;
				rval.args = args;
					display_sats.push(rval);
				}
			}
		}
	});
	if(display_sats.length > 0) {
		drawsats_array(display_sats, planetarium);
		show_sat_list(display_sats);
	}
};
	
function testdraw(planetarium)
{
	if(!testdrawn) {
		var maxb,minb,maxl,old,a,b,c,oldx,oldy,bstep;
		bstep = 2;
		//maxb = (typeof planetarium.projection.maxb==="number") ? planetarium.projection.maxb : 90-bstep;
		maxb = 90;
		minb = 0;

		var step = Math.PI;
		var c = planetarium.ctx;
		c.beginPath(); 
		c.strokeStyle = "green";
		c.lineWidth = 1;
		maxl = planetarium.maxLine(5);
		old = {moved:false};
		step *= planetarium.d2r;
		bstep *= planetarium.d2r;
		minb *= planetarium.d2r;
		maxb *= planetarium.d2r;
		// Draw grid lines in elevation/declination/latitude
		for(a = Math.PI/2 ; a < Math.PI*2 ; a += step){
			old.moved = false;
			for(b = minb; b <= maxb ; b+= bstep) old = myjoinpoint(planetarium,"az",a,b,old,maxl);
			break;
		}
		c.stroke();	
		testdrawn = true;
	}
	else {
		planetarium.draw();
		testdrawn = false;
	}
}

// Ripped from virtualsky.js as it appears to be a private function
// not accessable from my code but I want to draw all over the sky :)
function myjoinpoint(s,type,a,b,old,maxl)
{
	var x,y,show,c,pos;
	c = s.ctx;
	if(type=="az") pos = s.azel2xy((a-s.az_off*s.d2r),b,s.wide,s.tall);
	else if(type=="eq") pos = s.radec2xy(a,b);
	else if(type=="ec") pos = s.ecliptic2xy(a,b,s.times.LST);
	else if(type=="gal") pos = s.gal2xy(a,b);
	x = pos.x;
	y = pos.y;
	if(type=="az") show = true;
	else show = ((s.isVisible(pos.el)) ? true : false);
	if(show && isFinite(x) && isFinite(y)){
		if(type=="az"){
			if(!old.moved || Math.sqrt(Math.pow(old.x-x,2)+Math.pow(old.y-y,2)) > s.tall/2) c.moveTo(x,y);
			c.lineTo(x,y);
			old.moved = true;
		}else{
			// If the last point on s contour is more than a canvas width away
			// it is probably supposed to be behind us so we won't draw a line 
			if(!old.moved || Math.sqrt(Math.pow(old.x-x,2)+Math.pow(old.y-y,2)) > maxl){
				c.moveTo(x,y);
				old.moved = true;
			}else c.lineTo(x,y);
		}
		old.x = x;
		old.y = y;
	}
	return old;
}

var testdrawn = false;

