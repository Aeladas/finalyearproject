//Constants that hold web addresses used for making requests, so they should be altered
const apiKey = "40777cc6ab0b41839a4b27319ec5945b";
const baseUrl = "https://www.bungie.net/Platform/Destiny2/";
const tokenUrl = "https://www.bungie.net/platform/app/oauth/token/";
const baseImagePath = "https://www.bungie.net";
const my_client_id = 42278;
const my_client_secret = "rYv5SySC4xeuLILKv1NtW1ftb0YdF5CI29vW36w2QV8";

var currentPlayerMembershipId = null;
var currentPlayerMembershipType = null;
var numberOfIdsFound = null;
var characterIds = [];
var characterData = [];
let currentCharacterInventory = null;

async function documentLoader(){
    characterIds = JSON.parse(sessionStorage.getItem("characterIds"));
    currentPlayerMembershipId = sessionStorage.getItem("currentPlayerId");
    currentPlayerMembershipType = sessionStorage.getItem("currentPlayerLoginType");

    for(let i=0;i<characterIds.length;i++){
        let guardianDataRequestUrl = baseUrl + currentPlayerMembershipType + "/Profile/" + currentPlayerMembershipId + "/Character/";
        guardianDataRequestUrl += characterIds[i];
        guardianDataRequestUrl += "/?components=200";
        
        const response = await fetch(guardianDataRequestUrl, { method: 'GET', headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'X-API-Key': apiKey
        } });
        const data = await response.json();
        updateGuardianCard(data, i);
    }

    function updateGuardianCard(data, idIndex) {
        let containerToEdit = null;
        let imageToEdit = null;
        let classTextToEdit = null;
        let raceTextToEdit = null;
        let powerTextToEdit = null;
        let levelTextToEdit = null;

        //Getters
        switch (idIndex) {
            case 0:
                containerToEdit = document.getElementById("characterContainer1");
                imageToEdit = document.getElementById("background1");
                classTextToEdit = document.getElementById("classText1");
                raceTextToEdit = document.getElementById("raceText1");
                powerTextToEdit = document.getElementById("powerText1");
                levelTextToEdit = document.getElementById("levelText1");
                break;
            case 1:
                containerToEdit = document.getElementById("characterContainer2");
                imageToEdit = document.getElementById("background2");
                classTextToEdit = document.getElementById("classText2");
                raceTextToEdit = document.getElementById("raceText2");
                powerTextToEdit = document.getElementById("powerText2");
                levelTextToEdit = document.getElementById("levelText2");
                break;
            case 2:
                containerToEdit = document.getElementById("characterContainer3");
                imageToEdit = document.getElementById("background3");
                classTextToEdit = document.getElementById("classText3");
                raceTextToEdit = document.getElementById("raceText3");
                powerTextToEdit = document.getElementById("powerText3");
                levelTextToEdit = document.getElementById("levelText3");
                break;
        }

        imageToEdit.src = "https://www.bungie.net" + data.Response.character.data.emblemBackgroundPath;

        switch (data.Response.character.data.raceType) {
            case 0:
                raceTextToEdit.innerHTML = "Human";
                break;
            case 1:
                raceTextToEdit.innerHTML = "Awoken";
                break;
            case 2:
                raceTextToEdit.innerHTML = "Exo";
        }
        switch (data.Response.character.data.classType) {
            case 0:
                classTextToEdit.innerHTML = "Titan";
                break;
            case 1:
                classTextToEdit.innerHTML = "Hunter";
                break;
            case 2:
                classTextToEdit.innerHTML = "Warlock";
                break;
        }

        powerTextToEdit.innerHTML = "Power Level: " + data.Response.character.data.light;
        levelTextToEdit.innerHTML = "Level: " + data.Response.character.data.baseCharacterLevel;
        containerToEdit.onclick = function () {
            //getCharacterStats(data);
            //getCharacterEquipment(idIndex);
        };
        containerToEdit.style.visibility = "visible";
    }
}

function updateCharacterTile(data, idIndex) {

}

function ChangeIcon(){
    let iconToChange = document.getElementById("testImg");
    console.log(iconToChange);
    iconToChange.src = "https://www.bungie.net/common/destiny2_content/icons/d5d362c36487d3f3a64da5b52a1bedf3.jpg";
}