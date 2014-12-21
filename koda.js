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

//default pacienti
testoslav = 
{
	"ehrId": "115cf694-bbcb-4b90-a041-fd9003361716",
	"firstname": "Testoslav",
	"lastname": "Testovic",
	"dateofbirth": new Date(1950, 4, 5)
};

mjavz =
{
	"ehrId": "4b8be02a-4973-4ccf-a67b-82605b9f2880",
	"firstname": "Mjavz",
	"lastname": "Muc",
	"dateofbirth": new Date(2003, 2, 3)
};

imenko = 
{
	"ehrId": "b19d393c-4be4-470a-a54e-4de7b97b864d",
	"firstname": "Imenko",
	"lastname": "Priimkovic",
	"dateofbirth": new Date(1992, 1, 2)
};


//spremenljivki za dodajanje meritev in pacientov
var addingUser = false;
var addingMeasurment = false;

//ob refreshu
window.onload = function()
{
	pocistiPoljaMeritve();
	pocistiPoljaPacienti();
	$("#izberiPacienta").empty();
	usersArray.push(testoslav);
	$("#izberiPacienta").append($('<option>',{ value : testoslav.ehrId })
	.text(testoslav.firstname+" "+testoslav.lastname));
	usersArray.push(mjavz);
	$("#izberiPacienta").append($('<option>',{ value : mjavz.ehrId })
	.text(mjavz.firstname+" "+mjavz.lastname));
	usersArray.push(imenko);
	$("#izberiPacienta").append($('<option>',{ value : imenko.ehrId })
	.text(imenko.firstname+" "+imenko.lastname));
	
	$("#izberiPacienta").val(testoslav.ehrId);
	izberiPacienta(testoslav.ehrId);



}

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
		//generira datume - 1.10.2014 + i * 7dni
		var dateofmeasurment =  new Date(2014, 9, (1 + i*(7) + (generatorNum-1)%28));
		
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
					if(usersArray.length == 0)
					{
						$("#izberiPacienta").empty();
					}
					usersArray.push(pacient);
					$("#izberiPacienta").append($('<option>',{ value : ehrId }).text(firstname+" "+lastname));
					$("#izberiPacienta").val(ehrId);
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



//funkcije s html gumbov_____________________________________-
function novPacient()
{
	if(addingUser == true || addingMeasurment == true)
	{
		error("adding");
		return;
	}
	//enabla polja za vnos userja
	console.log("dodaj pacienta");
	addingUser = true
	pocistiPoljaMeritve();
	pocistiPoljaPacienti();
	$("#ime").prop("disabled", false);
	$("#priimek").prop("disabled", false);
	$("#datumRojstva").prop("disabled", false);
	$("#shrani").prop("disabled", false);
	
}

function novaMeritev()
{
	if(addingUser == true || addingMeasurment == true)
	{
		error("adding");
		return;
	}

	console.log("dodaj meritev");
	if(selectedUser == undefined)
	{
		error("selectedUserUndefined");
		return;
	}
	addingMeasurment = true;
	pocistiPoljaMeritve();
	$("#datumMeritve").prop("disabled", false);
	$("#visina").prop("disabled", false);
	$("#teza").prop("disabled", false);
	$("#temperatura").prop("disabled", false);
	$("#sist").prop("disabled", false);
	$("#diast").prop("disabled", false);
	$("#utrip").prop("disabled", false);
	$("#shrani").prop("disabled", false);
}

function prekliciSpremembe()
{
	console.log("preklici spremembe");
	if(addingMeasurment==false && addingUser==false)
	{
		error("notadding");
		return;
	}
	
	if(addingMeasurment==true)
	{
		addingMeasurment = false;
		$("#datumMeritve").prop("disabled", true);
		$("#visina").prop("disabled", true);
		$("#teza").prop("disabled", true);
		$("#temperatura").prop("disabled", true);
		$("#sist").prop("disabled", true);
		$("#diast").prop("disabled", true);
		$("#utrip").prop("disabled", true);
		pocistiPoljaMeritve();
	}
	else
	{
		addingUser = false;
		pocistiPoljaPacienti();
		$("#ime").prop("disabled", true);
		$("#priimek").prop("disabled", true);
		$("#datumRojstva").prop("disabled", true);
	}
	
	$("#shrani").prop("disabled", true);
}

function shraniSpremembe()
{
	console.log("shrani spremembe")
	if(addingUser == true)
	{
		//dodaj userja
		var ime = $("#ime").val();
		var priimek = $("#priimek").val();
		var rojstvo = $("#datumRojstva").val();
		
		var datumArray = rojstvo.split(".");
		if(datumArray.length == 3)
		{
			rojstvo = new Date (datumArray[2], (+datumArray[1]-1), datumArray[0]);
		}
		else
		{
			error("dateformat");
			return;
		}
		if(ime == undefined || priimek == undefined)
		{
			error(missingInput);
			return;
		}
		dodajPacienta(ime, priimek, rojstvo, false);
		//pospravi za sabo
		addingUser = false;
		$("#ime").prop("disabled", true);
		$("#priimek").prop("disabled", true);
		$("#datumRojstva").prop("disabled", true);
		if(addingMeasurment == false)
		{
			$("#shrani").prop("disabled", true);
		}
		
	}
	else
	{
		if(addingMeasurment == true)
		{
			if(selectedUser != undefined)
			{
				//dodaj meritev izbranemu userju
				var datumMeritve = $("#datumMeritve").val();
				var datumArray = datumMeritve.split(".");
				if(datumArray.length == 3)
				{
					datumMeritve = new Date (datumArray[2], (+datumArray[1]-1), datumArray[0]);
				}
				else
				{
					error("dateformat");
					return;
				}
				var visina = $("#visina").val();
				var teza = $("#teza").val();
				var temp = $("#temperatura").val();
				var sist = $("#sist").val();
				var diast = $("#diast").val();
				var utrip = $("#utrip").val();
				
				if(visina=="" || teza=="" || temp=="" || sist=="" || diast=="" || utrip=="")
				{
					error("missingInput");
					return;
				}
				dodajMeritev(selectedUser.ehrId, datumMeritve, visina, teza, temp, sist, diast, utrip);
				//pospravi za sabo
				$("#datumMeritve").prop("disabled", true);
				$("#visina").prop("disabled", true);
				$("#teza").prop("disabled", true);
				$("#temperatura").prop("disabled", true);
				$("#sist").prop("disabled", true);
				$("#diast").prop("disabled", true);
				$("#utrip").prop("disabled", true);
				addingMeasurment = false;
				if(addingUser == false)
				{
					$("#shrani").prop("disabled", true);
				}
			}
			else
			{
				error("selectedUserUndefined");
			}
		}
		else
		{
			console.log("nothing to save")
		}
	}
}

function dropdownPacient(selected)
{
	if(addingUser==true || addingMeasurment==true)
	{
		error("adding");
	}
	else
	{
		if(selected != undefined)
		{
			izberiPacienta(selected);
		}
	}
}

function dropdownMeritev(selected)
{
	if(addingUser == true || addingMeasurment == true)
	{
		error("adding");
	}
	else
	{
		if(selected != undefined)
		{
			izberiMeritev(selected);
		}
	}
}

function izberiPacienta(ehrId)
{
	//napolni select za meritve z ustreznimi datumi
	//in napolni currMeasurments z ustreznimi meritvami
	//ce ni nobenih meritev, pusti empty
	//plus ponastavi graf
	$("#izberiGraf").val("none");
	$("#graf").empty();
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
		console.log("izbrani pacient je ze izbran, posodabljam");
	}
	//sprazni polja (za vsk slucaj)
	console.log("cistim polja od meritev");
	pocistiPoljaMeritve();
	
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
		"b_b/data[at0002]/events[at0003]/data[at0001]/items[at0004, 'Body weight']/value/magnitude as weight, "+
		"b_c/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/magnitude as temperature, "+
		"b_d/data[at0001]/events[at0006]/data[at0003]/items[at0004]/value/magnitude as sistolic, "+
		"b_d/data[at0001]/events[at0006]/data[at0003]/items[at0005]/value/magnitude as diastolic, "+
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
					$("#izberiMeritev").empty();
					
					//sprazni currentMeasurments
					while(currentMeasurments.length > 0)
					{
						currentMeasurments.pop();
					}
					
					
					var meritveIzBaze = res.resultSet;
					//nafilaj datume v select
					for(var i in meritveIzBaze)
					{
						var meritev = meritveIzBaze[i]; 
						var datum = new Date(meritev.dateofmeasurment);
						meritev.dateofmeasurment = datum;
						console.log("prebrana meritev iz baze: ");
						console.log(meritev.toSource());
						if(datum != undefined)
						{
							var datumString = (datum.getDate()+"."+(datum.getMonth()+1)+"."+datum.getFullYear());
							$("#izberiMeritev").append($('<option>',{ value : datum}).text(datumString));
							currentMeasurments.push(meritev);
							if(i == 0)
							{
								izberiMeritev(datum);
							}
						}
						else
						{
							console.log("err pri branju aql rezultata");
						}
					}
				}
				else
				{
					$("#izberiMeritev").empty();
					$("#izberiMeritev").append($('<option>',{ value : "empty"}).text("empty"));
					console.log("ni meritev");
				}
			},
			error: function(err)
			{
				console.log("error pri aql poizvedbi za "+ehrId);
				console.log(JSON.parse(err.responseText).userMessage);
				$("#izberiMeritev").empty();
				$("#izberiMeritev").append($('<option>',{ value : "empty"}).text("empty"));
			}
		}
	);
}

function izberiMeritev(datum)
{
	console.log("izbral meritev "+datum);
	if(addingMeasurment == true)
	{
		error("adding");
		return;
	}
	if(selectedMeasurment == undefined || selectedMeasurment.dateofmeasurment != datum)
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
			//pocisti polja
			pocistiPoljaMeritve();
			return;
		}
	}
	else
	{
		console.log("izbrana meritev je ze izbrana, posodabljam");
	}
	
	//nafilaj polja s podatki iz selectedMeasurment
	var datumString = selectedMeasurment.dateofmeasurment;
	if(datumString != undefined)
	{
		datumString= datumString.getDate()+"."+(datumString.getMonth()+1)+"."+datumString.getFullYear();
		console.log("tole bom izpisal: "+selectedMeasurment.toSource());
		$("#datumMeritve").val(datumString);
		$("#visina").val(selectedMeasurment.height);
		$("#teza").val(selectedMeasurment.weight);
		$("#temperatura").val(selectedMeasurment.temperature);
		$("#sist").val(selectedMeasurment.sistolic);
		$("#diast").val(selectedMeasurment.diastolic);
		$("#utrip").val(selectedMeasurment.pulse);
	}
	else
	{
		console.log("neki ni v redu z datumom: "+selectedMeasurment.dateofmeasurment);
	}
}

function pocistiPoljaMeritve()
{
	$("#datumMeritve").val("");
	$("#visina").val("");
	$("#teza").val("");
	$("#temperatura").val("");
	$("#sist").val("");
	$("#diast").val("");
	$("#utrip").val("");
}
function pocistiPoljaPacienti()
{
	$("#ime").val("");
	$("#priimek").val("");
	$("#datumRojstva").val("");
}

function narisiGraf(type)
{
	var podatki = [];
	var warning = [];
	var maxWidth;
	switch(type)
	{
		case "Visina":
			maxWidth=300;
			var average = {val: null, text: null, color: 0};
			average.val = 128.2;//average WHO value
			average.text = "<small>WHO average:</small> "+"128.2";
			podatki.push(average);
			for(var i=0; i<currentMeasurments.length; i++)
			{
				var podatek={val: null, text: null, color: 0}; 
				podatek.val = currentMeasurments[i].height;
				var datum = currentMeasurments[i].dateofmeasurment;
				podatek.text = "<small>"+datum.getDate()+"."+(+datum.getMonth()+1)+"."+datum.getFullYear()+" :</small> "
				+"<b>"+currentMeasurments[i].height+"</b>";
				//ni barve
				podatki.push(podatek);
			}
			break;
		case "Teza":
			maxWidth=300;
			var average={val: null, text: null, color: 0};
			average.val = 123;//average WHO value
			average.text = "WHO average";
			podatki.push(average);
			for(var i=0; i<currentMeasurments.length; i++)
			{
				var podatek={val: null, text: null, color: 0};
				podatek.val = currentMeasurments[i].weight;
				var datum = currentMeasurments[i].dateofmeasurment;
				podatek.text = "<small>"+datum.getDate()+"."+(+datum.getMonth()+1)+"."+datum.getFullYear()+" :</small> "
				+"<b>"+currentMeasurments[i].weight+"</b>";
				//ni barve
				podatki.push(podatek);
			}
		break;
		case "Temperatura":
			maxWidth=60;
			var average={val: null, text: null, color: 0};
			average.val = 36;//average WHO value
			average.text = "WHO average";
			podatki.push(average);
			for(var i=0; i<currentMeasurments.length; i++)
			{
				var podatek={val: null, text: null, color: 0};
				podatek.val = currentMeasurments[i].temperature;
				var datum = currentMeasurments[i].dateofmeasurment;
				podatek.text = "<small>"+datum.getDate()+"."+(+datum.getMonth()+1)+"."+datum.getFullYear()+" :</small> "
				+currentMeasurments[i].temperature+"</b>";
				if(podatek.val > 37.5)
				{
					podatek.color = 1;
				}
				else
				{
					if(podatek.val < 36.5)
					{
						podatek.color = -1;
					}
				}
				podatki.push(podatek);
			}
		break;
		case "Sistolicni tlak":
			maxWidth=250;
			var average={val: null, text: null, color: 0};
			average.val = 123;//average WHO value
			average.text = "WHO average";
			podatki.push(average);
			for(var i=0; i<currentMeasurments.length; i++)
			{
				var podatek={val: null, text: null, color: 0};
				podatek.val = currentMeasurments[i].sistolic;
				var datum = currentMeasurments[i].dateofmeasurment;
				podatek.text = "<small>"+datum.getDate()+"."+(+datum.getMonth()+1)+"."+datum.getFullYear()+" :</small> "
				+"<b>"+currentMeasurments[i].sistolic+"</b>";
				if(podatek.val >= 140)
				{
					podatek.color = 1;
				}
				else
				{
					if(podatek.val < 90)
					{
						podatek.color = -1;
					}
				}
				podatki.push(podatek);
			}
		break;
		case "Diastolicni tlak":
			maxWidth=250;
			var average={val: null, text: null, color: 0};
			average.val = 123;//average WHO value
			average.text = "WHO average";
			podatki.push(average);
			for(var i=0; i<currentMeasurments.length; i++)
			{
				var podatek={val: null, text: null, color: 0};
				podatek.val = currentMeasurments[i].diastolic;
				var datum = currentMeasurments[i].dateofmeasurment;
				podatek.text = "<small>"+datum.getDate()+"."+(+datum.getMonth()+1)+"."+datum.getFullYear()+" :</small> "
				+"<b>"+currentMeasurments[i].diastolic+"</b>";
				if(podatek.val >= 90)
				{
					podatek.color = 1;
				}
				else
				{
					if(podatek.val < 60)
					{
						podatek.color = -1;
					}
				}
				podatki.push(podatek);
			}
		break;
		case "Utrip":
			maxWidth=250;
			var average={val: null, text: null, color: 0};
			average.val = 123;//average WHO value
			average.text = "WHO average";
			podatki.push(average);
			for(var i=0; i<currentMeasurments.length; i++)
			{
				var podatek={val: null, text: null, color: 0};
				podatek.val = currentMeasurments[i].pulse;
				var datum = currentMeasurments[i].dateofmeasurment;
				podatek.text = "<small>"+datum.getDate()+"."+(+datum.getMonth()+1)+"."+datum.getFullYear()+" :</small> "
				+"<b>"+currentMeasurments[i].pulse+"</b>";
				if(podatek.val > 100)
				{
					podatek.color = 1;
				}
				else
				{
					if(podatek.val < 60)
					{
						podatek.color = -1;
					}
				}

				podatki.push(podatek);
			}
		break;
		default:
			console.log("ne razumem: "+type);
			break;
	}
	var dp = $("#izberiGraf").width() / maxWidth;
	console.log("dp = "+dp);
	
	$("#graf").empty();
	console.log("barve: "+warning.toSource())
	
	d3.select(".graf")
		.selectAll("div")
		.data(podatki)
		.enter().append("div")
		.style("width", function(d) { return ( (+d.val) * (+dp) ) + "px"; })
		.style("background-color", function(d) 
		{
			switch(d.color)
			{
				case 1:
					//previsoko
					return "#CC0000";
					break;
				case -1:
					//prenizko
					return "#0000CC";
					break;
				default:
					//normalno
					return "#00CC00";
					break;
			}
		}) 
		.html(function(d) { return d.text ; });
	
}










function error(errcode)
{
	switch(errcode)
	{
		case "adding":
			console.log("najprej shrani ali preklici");
			window.alert("Najprej shrani ali preklici spremembe.");
			break;
		case "dateformat":
			console.log("napacen format datuma");
			window.alert("Datum mora biti vnesen kot dd.mm.yyyy");
			break;
		case "selectedUserUndefined":
			console.log("no user selected");
			window.alert("Pacient ni izbran.");
			break;
		case "missingInput":
			console.log("vnesi vse podatke");
			window.alert("Vnesi vse podatke");
			break;
		case "notadding":
			console.log("not adding");
			window.alert("Trenutno ne urejas nobenih vnosov.");
		
		default:
			console.log("unknown error");
			window.alert("Error");
			break;
	}
}
