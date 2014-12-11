var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";

var generatorNum = 0;

function getSessionId() 
{
	var response = $.ajax(
		{
			type: "POST",
			url: baseUrl+"/session?username="+encodeURIComponent(username) +"&password="+encodeURIComponent(password),
			async: false
		}
	);
	return response.responseJSON.sessionId;
}

var usersArray = [];//array z pacienti, ki so na voljo v dropdownu
var selectedUser;
var currentMeasurments = [];//array z meritvami, ki so na volju v dropdownu
var selectedMeasurment;

function generirajVnos()
{
	//generiraj pacienta
	var firstname = "Ime"+generatorNum;
	var lastname = "Priimek"+generatorNum;
	generatorNum++;
	var dateofbirth = nakljucniDatum(new Date(1950, 0, 1).getTime(), 157784630000);//datum od 1950 do 5 let nazaj

	console.log("Generiral pacienta: ");
	console.log(firstname+ " " + lastname);
	console.log(dateofbirth.getDate() + "." + ( dateofbirth.getMonth()+1 ) + "." + dateofbirth.getFullYear());
	console.log();
	//dodaj pacienta v bazo (async)
	var ehrId = dodajPacienta(firstname, lastname, dateofbirth, true);
}

function testMeasurments(ehrId, firstname, lastname, dateofbirth)
{
	//generiraj tri meritve za pacienta
	var bodyheight = (150 + Math.random()*50).toFixed(2);//visina (med 150 in 200)
	var bodyweight = (40 + Math.random()*80).toFixed(2);//teza (med 40 in 120)
	
	for(var i=0; i < 3; i++)
	{
		var dateofmeasurment =  new Date(2014, 9, (1 + i*(7)));//generira datume - 1.10.2014 + i * 7dni
		var age = dateofmeasurment.getFullYear() - dateofbirth.getFullYear();
		var weightChange = 5 - ( Math.random()*10 );// +/- 5kg
		bodyweight =( +bodyweight + weightChange).toFixed(2);
		if(age < 17)
		{
			console.log("povecujem bodyheight");
			bodyheight =( +bodyheight +( Math.random() )).toFixed(2);
		}
		var temperature = ( 36 + Math.random() * 4 ).toFixed(2);
		var systolic =( 70 + Math.random() * 120).toFixed(2);
		var diastolic =( 40 + Math.random() * 60).toFixed(2);
		var pulse =( 40 + Math.random() * 160).toFixed(2);
		console.log("Meritev "+i+ " - "+(dateofmeasurment.getDate()+1 ) + "." + dateofmeasurment.getMonth() + "." + dateofmeasurment.getFullYear());
		console.log("age: "+age);
		console.log("height: "+bodyheight+" cm");
		console.log("weight: "+bodyweight+" kg");
		console.log("temp: "+temperature+" °C");
		console.log("sys: "+systolic);
		console.log("dia: "+diastolic);
		console.log("pulse: "+pulse);
		console.log();
		
		
		//dodaj meritev v bazo (async)
		dodajMeritev(ehrId, dateofmeasurment, bodyheight, bodyweight, temperature, systolic, diastolic, pulse);
	}
	
	console.log("----");
	console.log();
}

function nakljucniDatum(min, offset)
{
	var currDate = new Date();
	var date;
	//generira nakljucni datum, vecji od min in vsaj za offset manjsi od trenutnega datuma
	date = new Date(min + Math.random() * (currDate.getTime() - min - offset));
	return date
}

function dodajPacienta(firstname, lastname, dateofbirth, generator)
{
	var session = getSessionId();
	$.ajaxSetup({headers: {"Ehr-Session": session}});
	$.ajax(
	{
		url: baseUrl + "/ehr",
		type: 'POST',
		success: function(data)
		{
			var ehrId = data.ehrId;
			var partyData =
			{
				firstNames: firstname,
				lastNames: lastname,
				dateOfBirth: dateofbirth,
				partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
			};
			$.ajax(
			{
				url: baseUrl + "/demographics/party",
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify(partyData),
				success: function(party)
				{
					//success
					var pacient = 
					{
						"ehrId": ehrId,
						"firstname": firstname,
						"lastname": lastname,
						"dateofbirth": dateofbirth
					};
					console.log("dodal pacienta "+pacient.firstname+" "+pacient.lastname+" "+pacient.ehrId);

					//TODO pocisti vse iz selecta


					usersArray[usersArray.length] = pacient;
					$("#izberiPacienta").append($('<option>',{ value : ehrId }).text(firstname+" "+lastname));
					izberiPacienta(ehrId);
					if(generator == true)
					{
						//generira tri meritve (async)
						testMeasurments(ehrId, firstname, lastname, dateofbirth);
					}
				},
				error: function(err)
				{
					console.log("error pri dodajanju pacienta "+firstname + " " + lastname + " " + ehrId);
					console.log(JSON.parse(err.responseText).userMessage);
					return "err";
				}
			}
			);
		}
	}
	);
}

function dodajMeritev(ehrId, date, height, weight, temp, systolic, diastolic, pulse)
{
	var session = getSessionId();
	var data = 
	{
		"ctx/language": "en",
		"ctx/territory": "SI",
		"ctx/time": date,
		"vital_signs/height_length/any_event/body_height_length": height,
		"vital_signs/body_weight/any_event/body_weight": weight,
		"vital_signs/body_temperature/any_event/temperature|magnitude": temp,
		"vital_signs/body_temperature/any_event/temperature|unit": "°C",
		"vital_signs/blood_pressure/any_event/systolic": systolic,
		"vital_signs/blood_pressure/any_event/diastolic": diastolic,
		"vital_signs/pulse/any_event/rate|magnitude": pulse,
		"vital_signs/pulse/any_event/rate|unit": "/min",
	};
	var request = 
	{
		"ehrId": ehrId,
		templateId: "Vital Signs",
		format: "FLAT",
		commiter: "js"
		
	};
	$.ajaxSetup({headers: {"Ehr-Session": session}});
	$.ajax(
	{
		url: baseUrl + "/composition?" + $.param(request),
		type: "POST",
		contentType: "application/json",
		data: JSON.stringify(data),
		success: function(res)
		{
			console.log("dodal meritev za pacienta "+ehrId);
			console.log(res.meta.href);
			izberiPacienta(ehrId);//posodobi seznam meritev
			
		},
		error: function(err)
		{
			console.log("error pri dodajanju meritve");
			console.log(JSON.parse(err.responseText).userMessage);
		}
	}
	);
}



//funkcije s html gumbov
function novPacient()
{
	console.log("dodaj pacienta");
}

function novaMeritev()
{
	console.log("dodaj meritev");
}

function izbrisiMeritev()
{
	console.log("izbrisi meritev");
}

function shraniSpremembe()
{
	console.log("shrani spremembe")
}

function dropdownPacient(selected)
{
	if(selected != undefined)
	{
		izberiPacienta(selected);
	}
}

function dropdownMeritev(selected)
{
	if(selected != undefined)
	{
		izberiMeritev(selected);
	}
}

function izberiPacienta(ehrId)
{
	//napolni select za meritve z ustreznimi datumi
	//in napolni currMeasurments z ustreznimi meritvami
	//ce ni nobenih meritev, pusti empty
	if(selectedUser == undefined || selectedUser.ehrId != ehrId)
	{
		console.log("izbral pacienta "+ehrId);
		console.log("pacienti v seznamu: ");
		for(var i = 0; i < usersArray.length; i++)
		{
			var user = usersArray[i];
			console.log(user.ehrId);
			if(user.ehrId == ehrId)
			{
				selectedUser = user;
				break;
			}
		}
		if(selectedUser == undefined)
		{
			console.log("izbranega pacienta ni v seznamu");
			return;
		}
	}
	else
	{
		console.log("izbrani pacient je ze izbran");
	}
	$("#ime").val(selectedUser.firstname);
	$("#priimek").val(selectedUser.lastname);
	var date = selectedUser.dateofbirth;
	$("#datumRojstva").val(date.getDate()+"."+(date.getMonth()+1)+"."+date.getFullYear());
	//naredi poizvedbo, za vse meritve (vsi parametri)
	var session = getSessionId();
	var AQL =
	
	"select "+
		"a/context/start_time/value as dateofmeasurment, "+
		"b_a/data[at0001]/events[at0002]/data[at0003]/items[at0004, 'Body Height/Length']/value/magnitude as height,"+
		"b_b/data[at0002]/events[at0003]/data[at0001]/items[at0004, 'Body weight']/value as weight, "+
		"b_c/data[at0002]/events[at0001]/items[at0004]/value/magnitude as temperature, "+
		"b_d/data[at0001]/events[at0006]/data[at0003]/items[at0004]/value as sistolic, "+
		"b_d/data[at0001]/events[at0006]/data[at0003]/items[at0005]/value as diastolic, "+
		"b_f/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/magnitude as pulse "+
	"from EHR e[e/ehr_id/value='"+ehrId+"'] "+
	"contains COMPOSITION a[openEHR-EHR-COMPOSITION.encounter.v1] "+
	"contains ( "+
	"OBSERVATION b_a[openEHR-EHR-OBSERVATION.height.v1] and "+
	"OBSERVATION b_b[openEHR-EHR-OBSERVATION.body_weight.v1] and "+
	"OBSERVATION b_c[openEHR-EHR-OBSERVATION.body_temperature.v1] and "+
	"OBSERVATION b_d[openEHR-EHR-OBSERVATION.blood_pressure.v1] and "+
	"OBSERVATION b_f[openEHR-EHR-OBSERVATION.heart_rate-pulse.v1] "+
	" ) "+
	"where a/name/value='Vital Signs'";
	
	$.ajax(
		{
			url: baseUrl + "/query?" + $.param({"aql": AQL}),
			type: 'GET',
			headers: {"Ehr-Session": session},
			success: function(res)
			{
				if(res)
				{
					//TODO izbrisi vse iz selecta
					
					
					currentMeasurments = res.resultSet;
					//nafilaj datume v select
					for(var i in currentMeasurments)
					{
						var meritev = currentMeasurments[i]; 
						var datum = meritev.dateofmeasurment;
						console.log("prebrana meritev iz baze: ");
						console.log("datum: "+datum);
						console.log("visina: "+meritev.height);
						console.log("teza: "+meritev.weight);
						console.log("temp: "+meritev.temperature);
						console.log("sistolic: "+meritev.sistolic);
						console.log("diastolic: "+meritev.diastolic);
						console.log("pulz: "+meritev.pulse);
						if(datum != undefined)
						{
							$("#izberiMeritev").append($('<option>',{ value : datum}).text(datum));//TODO format texta
						}
					}
				}
				else
				{
					//TODO poskrbi da bo empty v selectu
					console.log("ni meritev");
				}
			},
			error: function(err)
			{
				console.log("error pri aql poizvedbi za "+ehrId);
				console.log(JSON.parse(err.responseText).userMessage);
				//TODO poskrbi da bo empty v selectu
			}
		}
	);
}

function izberiMeritev(datum)
{
	if(selectedMeasurment == undefined || selectedMeasurment.dateofmeasurment == datum)
	{
		for(var i in currentMeasurments)
		{
			if(currentMeasurments[i].dateofmeasurment == datum)
			{
				selectedMeasurment = currentMeasurments[i];
				break;
			}
		}
		if(selectedMeasurment == undefined)
		{
			console.log("izbrane meritve ni v seznamu");
			return;
		}
	}
	else
	{
		console.log("izbrana meritev je ze izbrana");
	}
	
	//nafilaj polja s podatki iz selectedMeasurment
	$("#datumMeritve").val(selectedMeasurment.dateofmeasurment);
	$("#visina").val(selectedMeasurment.height);
	$("#teza").val(selectedMeasurment.weight);
	$("#temperatura").val(selectedMeasurment.tempearture);
	$("#sist").val(selectedMeasurment.sistolic);
	$("#diast").val(selectedMeasurment.diastolic);
	$("#utrip").val(selectedMeasurment.pulse);
	
}
