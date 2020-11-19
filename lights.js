const v3 = require('node-hue-api').v3;
const GroupLightState = v3.lightStates.GroupLightState;
const fs = require('fs');
const colors = JSON.parse(fs.readFileSync('data/colors.json'));
let api;
const lights = false;

if (lights) {
  v3.discovery.nupnpSearch()
    .then(searchResults => {
      const host = searchResults[0].ipaddress;
      return v3.api.createLocal(host).connect(process.env.HUE_USER);
    })
    .then(_api => {
      api = _api;
      console.log(`Successfully connected`);
    })
    .catch(err => { console.error(err); });
}

const playEmotion = (emotion) => {
  if (!lights) return;
  
  let hex = colors[emotion.base][0];
  let cie = hex2cie(hex);
  console.log(cie);

  let sat = emotion.level * 30 + 164;
  console.log(`LIGHTS: Setting group light state to ${hex} ${sat}`);
  const state = new GroupLightState().on().xy(cie.x, cie.y).sat(sat).brightness(100);
  api.groups.setGroupState(0, state)
    .then(result => {
      console.log(`LIGHTS: Successfully set group light state? ${result}`);
    })
    .catch(err => { console.error(err); });
};

const hex2rgb = (hex) => {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : null;
};

function hex2cie(hex)
{
  let rgb = hex2rgb(hex);
	//Apply a gamma correction to the RGB values, which makes the color more vivid and more the like the color displayed on the screen of your device
	var red 	= (rgb.r > 0.04045) ? Math.pow((rgb.r + 0.055) / (1.0 + 0.055), 2.4) : (rgb.r / 12.92);
	var green 	= (rgb.g > 0.04045) ? Math.pow((rgb.g + 0.055) / (1.0 + 0.055), 2.4) : (rgb.g / 12.92);
	var blue 	= (rgb.b > 0.04045) ? Math.pow((rgb.b + 0.055) / (1.0 + 0.055), 2.4) : (rgb.b / 12.92); 

	//RGB values to XYZ using the Wide RGB D65 conversion formula
	var X 		= red * 0.664511 + green * 0.154324 + blue * 0.162028;
	var Y 		= red * 0.283881 + green * 0.668433 + blue * 0.047685;
  var Z 		= red * 0.000088 + green * 0.072310 + blue * 0.986039;

	//Calculate the xy values from the XYZ values
	var x 		= (X / (X + Y + Z)).toFixed(4);
	var y 		= (Y / (X + Y + Z)).toFixed(4);

	if (isNaN(x)) x = 0;
	if (isNaN(y)) y = 0;

	return {x: Number(x), y: Number(y)};
}

// const discovery = v3.discovery;
// const appName = 'the-changing-room';
// const deviceName = 'tcr-bridge';
// v3.discovery.nupnpSearch()
//   .then(searchResults => {
//     const host = searchResults[0].ipaddress;
//     return v3.api.createLocal(host).connect(process.env.HUE_USER);
//   })
//   .then(api => {
//     // Using a LightState object to build the desired state

    
//     return apigroups.setState(0, state);
//   })
//   .then(result => {
//     console.log(`Light state change was successful? ${result}`);
//   })
// ;

// async function discoverBridge() {
//   const discoveryResults = await discovery.nupnpSearch();
//   if (discoveryResults.length === 0) {
//     console.error('Failed to resolve any Hue Bridges');
//     return null;
//   } else {
//     // Ignoring that you could have more than one Hue Bridge on a network as this is unlikely in 99.9% of users situations
//     return discoveryResults[0].ipaddress;
//   }
// }
// async function discoverAndCreateUser() {
//   const ipAddress = await discoverBridge();
//   // Create an unauthenticated instance of the Hue API so that we can create a new user
//   const unauthenticatedApi = await hueApi.createLocal(ipAddress).connect();
//   let createdUser;
//   try {
//     createdUser = await unauthenticatedApi.users.createUser(appName, deviceName);
//     console.log('*******************************************************************************\n');
//     console.log('User has been created on the Hue Bridge. The following username can be used to\n' +
//                 'authenticate with the Bridge and provide full local access to the Hue Bridge.\n' +
//                 'YOU SHOULD TREAT THIS LIKE A PASSWORD\n');
//     console.log(`Hue Bridge User: ${createdUser.username}`);
//     console.log(`Hue Bridge User Client Key: ${createdUser.clientkey}`);
//     console.log('*******************************************************************************\n');
//     // Create a new API instance that is authenticated with the new user we created
//     const authenticatedApi = await hueApi.createLocal(ipAddress).connect(createdUser.username);
//     // Do something with the authenticated user/api
//     const bridgeConfig = await authenticatedApi.configuration.getConfiguration();
//     console.log(`Connected to Hue Bridge: ${bridgeConfig.name} :: ${bridgeConfig.ipaddress}`);
//   } catch(err) {
//     if (err.getHueErrorType() === 101) {
//       console.error('The Link button on the bridge was not pressed. Please press the Link button and try again.');
//     } else {
//       console.error(`Unexpected Error: ${err.message}`);
//     }
//   }
// }
// discoverAndCreateUser();



module.exports.playEmotion = playEmotion;