// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: magic;

// Transparent
const {transparent} = importModule("Transparent");
let bgImage = await transparent("HWN");

// Widget Params
// Don't edit this, those are default values for debugging (location for Cupertino).
// You need to give your locations parameters through the widget params, more info below.
//const widgetParams = JSON.parse((args.widgetParameter != null) ? args.widgetParameter : '{ "LAT" : "37.32" , "LON" : "-122.03" , "LOC_NAME" : "Cupertino, US" }')

// WEATHER API PARAMETERS !important
// API KEY, you need an Open Weather API Key
// You can get one for free at: https://home.openweathermap.org/api_keys (account needed).
const API_KEY = ""

// Latitude and Longitude of the location where you get the weather of.
// You can get those from the Open Weather website while searching for a city, etc.
// This values are getted from the widget parameters, the widget parameters is a JSON string that looks like this:
// { "LAT" : "<latitude>" , "LON" : "<longitude>" , "LOC_NAME" : "<name to display>" }
// This to allow multiple instances of the widget with different locations, if you will only use one instance (1 widget), you can "hardcode" the values here.
// Note: To debug the widget you need to place the values here, because when playing the script in-app the widget parameters are null (= crash).

//get location
let latLong = {}
try {
  Location.setAccuracyToHundredMeters();
  latLong = await Location.current();
} catch {}

const LAT =
const LON =


// Looking settings
// This are settings to customize the looking of the widgets, because this was made an iPhone SE (2016) screen, I can't test for bigger screens.
// So feel free to modify this to your taste.

// units : string > Defines the unit used to measure the temps, for temperatures in Fahrenheit use "imperial", "metric" for Celcius and "standard" for Kelvin (Default: "metric").
const units = "metric"
// roundedTemp : true|false > true (Displays the temps rounding the values (29.8 = 30 | 29.3 = 29).
const roundedTemp = true

// Widget Size !important.
// Since the widget works "making" an image and displaying it as the widget background, you need to specify the exact size of the widget to
// get an 1:1 display ratio, if you specify an smaller size than the widget itself it will be displayed blurry.
// You can get the size simply taking an screenshot of your widgets on the home screen and measuring them in an image-proccessing software.
// contextSize : number > Height of the widget in screen pixels, this depends on you screen size (for an 4 inch display the small widget is 282 * 282 pixels on the home screen)
const contextSize = 465
// mediumWidgetWidth : number > Width of the medium widget in pixels, this depends on you screen size (for an 4 inch display the medium widget is 584 pixels long on the home screen)
const mediumWidgetWidth = 987
// backgroundColor : Color > Background color of the widgets.
const backgroundColor = Color.black();

//From here proceed with caution.
//create icloud folder for store weather's icons and cache of location
let fm = FileManager.iCloud();
let cachePath = fm.joinPath(fm.documentsDirectory(), "weatherCacheRC");
if(!fm.fileExists(cachePath)){
  fm.createDirectory(cachePath)
}
// declare variables
let widget = new ListWidget();
var today = new Date();
let weatherData;
let locationData;
let usingCachedData = false;
let drawContext = new DrawContext();

drawContext.size = new Size((config.widgetFamily == "small") ? contextSize : mediumWidgetWidth, contextSize)
drawContext.opaque = false
drawContext.setTextAlignedCenter()

const bgRect = new Rect(0,0, (config.widgetFamily=='small')?contextSize:mediumWidgetWidth, contextSize)

drawContext.drawImageInRect(bgImage, bgRect)

//get weather and location's datas from location of iphone
try {
  //delete and recreate folder for not fill all memory
  if(fm.fileExists(cachePath + "/location")){
    fm.remove(cachePath + "/location")
    fm.createDirectory(cachePath + "/location")
  }
  else{
    fm.createDirectory(cachePath + "/location")
  }
  //get data from openweather and geocode
  weatherData = await new Request("https://api.openweathermap.org/data/2.5/onecall?lat=" + LAT + "&lon=" + LON + "&exclude=daily,minutely,alerts&units=" + units + "&lang=en&appid=" + API_KEY).loadJSON();
  fm.writeString(fm.joinPath(cachePath + "/location", "lastread"+"_"+LAT+"_"+LON), JSON.stringify(weatherData));
  locationData = await await Location.reverseGeocode(LAT, LON)
  fm.writeString(fm.joinPath(cachePath + "/location", "lastLoc"+"_"+LAT+"_"+LON), JSON.stringify(locationData));
}catch(e){
  console.log("Offline mode")
  try{
    //if it is not possibile to catch data, read cache data
    await fm.downloadFileFromiCloud(fm.joinPath(cachePath + "/location", "lastread"+"_"+LAT+"_"+LON));
    let raw = fm.readString(fm.joinPath(cachePath + "/location", "lastread"+"_"+LAT+"_"+LON));
    weatherData = JSON.parse(raw);
    await fm.downloadFileFromiCloud(fm.joinPath(cachePath + "/location", "lastLoc"+"_"+LAT+"_"+LON));
    let rawLoc = fm.readString(fm.joinPath(cachePath + "/location", "lastLoc"+"_"+LAT+"_"+LON));
    locationData = JSON.parse(rawLoc);
    usingCachedData = true;
  }catch(e2){
    console.log("Error: No offline data cached")
  }
}

// function to add suffix to day's number
function ordinalSuffix(input) {
	if (input % 10 == 1 && input != 11) {
		return input.toString() + "st";
	} else if (input % 10 == 2 && input != 12) {
		return input.toString() + "nd";
	} else if (input % 10 == 3 && input != 13) {
		return input.toString() + "rd";
	} else {
		return input.toString() + "th";
	}
}

//set widget

widget.setPadding(-50, -50, 0, 0)
widget.backgroundColor = backgroundColor;


//add day to widget
var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
drawContext.setFont(Font.regularSystemFont(63))
drawContext.setTextColor(Color.white())
drawContext.drawText(days[today.getDay()].toString(), new Point(25,25));

//add month and number of the day to widget
var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
drawContext.setFont(Font.regularSystemFont(63))
drawContext.setTextColor(Color.white())
drawContext.drawText(months[today.getMonth()].toString() + " " + ordinalSuffix(today.getDate()), new Point(25, 83));

//city name
try{
  //add name of city
  drawContext.setFont(Font.regularSystemFont(35))
  drawContext.setTextColor(Color.white())
  drawContext.drawText(locationData[0].postalAddress.city.toString(), new Point(25, 155))
}catch(e){
  //if name of the city isn't yet ready
  drawContext.setFont(Font.regularSystemFont(30))
  drawContext.setTextColor(Color.white())
  drawContext.drawText("Locating...", new Point(25, 155))
}

//all weather data
try{
  //add image of weather condition
  let image = await loadImage(weatherData.current.weather[0].icon)
  drawContext.drawImageInRect(image, new Rect(25, 210, 150, 150))

  //add degrees
  drawContext.setFont(Font.regularSystemFont(80))
  drawContext.setTextColor(Color.white())
  drawContext.drawText(Math.round(weatherData.current.temp) + "°", new Point(225, 235))

  //add degrees feels like
  drawContext.setFont(Font.regularSystemFont(30))
  drawContext.setTextColor(Color.gray())
  drawContext.drawText("feels like " + Math.round(weatherData.current.feels_like) + "°", new Point(25, 380))
}catch(e){
  //if weather data isen't yet ready
  drawContext.setFont(Font.regularSystemFont(63))
  drawContext.setTextColor(Color.white())
  drawContext.drawText("Loading...", new Point(25, 270))
}

//function to download weather's icon from a.animelweb
async function loadImage(imgName){
  if(fm.fileExists(fm.joinPath(cachePath, imgName))){
    await fm.downloadFileFromiCloud(fm.joinPath(cachePath, imgName))
    return Image.fromData(Data.fromFile(fm.joinPath(cachePath, imgName)))
  }else{
    //let imgdata = await new Request("https://openweathermap.org/img/wn/" + imgName + ".png").load();
    let imgdata = await new Request("http://a.animedlweb.ga/weather/ico/" + imgName + "_ico.png").load();
    let img = Image.fromData(imgdata);
    fm.write(fm.joinPath(cachePath, imgName), imgdata);
	return img;
  }
}

widget.backgroundImage = (drawContext.getImage());
widget.presentMedium()
Script.setWidget(widget);
