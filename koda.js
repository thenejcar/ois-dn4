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
        url: baseUrl+"/session?username="+encodeURIComponent(username) +
                "&password="+encodeURIComponent(password),
        async: false
        }
    );
    return response.responseJSON.sessionId;
}
//test
generirajVnos();
generirajVnos();
generirajVnos();
generirajVnos();
generirajVnos();

function generirajVnos()
{
    //generiraj pacienta
    var firstname = "ime "+generatorNum;
    var lastname = "priimek "+generatorNum;
    generatorNum++;
    var dateofbirth = nakljucniDatum(new Date(1950, 0, 1).getTime(), 157784630);//datum med 1950 in 5 let nazaj
    
    console.log("Generiral pacienta: ");
    console.log(firstname+ " " + lastname);
    console.log(dateofbirth.getDate() + "." + dateofbirth.getMonth() + "." + dateofbirth.getFullYear());
    console.log();
    //generiraj tri meritve za pacienta
    var bodyheight = 150 + Math.random()*50;//visina (med 150 in 200)
    var bodyweight = 40 + Math.random()*80;//teza (med 40 in 120)
    
    for(var i=0; i < 3; i++)
    {
        var dateofmeasurement =  new Date(2014, 10, (1 + i*(7)));//generira datume - 1.10.2014 in nato z enim tednom zamika
        
        var temperature = ( 36 + Math.random() * 4 ).toFixed(2);
        var systolic =( 70 + Math.random() * 120).toFixed(2);
        var diastolic =( 40 + Math.random() * 60).toFixed(2);
        var pulse =( 40 + Math.random() * 160).toFixed(2);
        console.log("Meritev "+i+ " - "+dateofmeasurement.getDate() + "." + dateofmeasurement.getMonth() + "." + dateofmeasurement.getFullYear());
        console.log("temp:"+temperature+" °C");
        console.log("sys: "+systolic);
        console.log("dia: "+diastolic);
        console.log("pulse: "+pulse);
        console.log();
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
