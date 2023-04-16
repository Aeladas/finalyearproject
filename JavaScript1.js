const apiKey = "40777cc6ab0b41839a4b27319ec5945b";
const baseUrl = "https://www.bungie.net/Platform/Destiny2/";
const my_client_id = 42278;
const my_client_secret = "rYv5SySC4xeuLILKv1NtW1ftb0YdF5CI29vW36w2QV8";

var platformIndex = null;
var currentPlayerMembershipId = null;
var currentPlayerMembershipType = null;
var numberOfIdsFound = null;
var characterIds = [];
var characterData = [];

var manifestJsonData = null;
var itemDefinitionData = null;
var statsDefinitionData = null;

let pveStatData = null;
let pvpStatData = null;

async function searchForUser() {
    if (manifestJsonData == null && itemDefinitionData == null && statsDefinitionData == null) {
        await getManifest();
        await getItemDefinitionLibrary();
        await getStatDefinitionLibrary();
    }

    let inputBox = document.getElementById("testInputBox");
    let numOfResults = null;
    let searchUrl = "https://www.bungie.net/platform/User/Search/GlobalName/0/";
    let params = {
        "displayNamePrefix": inputBox.value
    };
    const response = await fetch(searchUrl, {
        method: 'POST', headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'X-API-Key': apiKey
        }, body: JSON.stringify(params),
    });
    const searchData = await response.json();
    numOfResults = await searchData.Response.searchResults.length;
    await createSearchResults(searchData, numOfResults);
    inputBox.value = "";
}

function loginToAccount(event) {
    event.preventDefault();
    //console.log("reached login");
    //&state=6i0mkLx79Hp91nzWVeHrzHG4
    let loginUrl = "https://www.bungie.net/en/oauth/authorize?client_id=" + my_client_id + "&response_type=code&state=6i0mkLx79Hp91nzWVeHrzHG4";
    window.location.replace(loginUrl);
    //MiddleMan();
    getAccessToken();
}

function MiddleMan(){
    let searchCode = window.location.search;
    let removeAfter = searchCode.indexOf("&");
    removeAfter = removeAfter - 6;
    searchCode = searchCode.replace("?code=","");
    searchCode = searchCode.substring(0, removeAfter);
    getAccessToken();
}

async function getAccessToken(){
    console.log("Got to access token");
    console.log("window:"+ window.location.href);
    let tokenUrl = "https://www.bungie.net/platform/app/oauth/token/";
    let searchCode = window.location.search;
    //Needs to get the contents of the url after -> ?code=
    let removeAfter = searchCode.indexOf("&");
    removeAfter = removeAfter - 6;
    searchCode = searchCode.replace("?code=","");
    searchCode = searchCode.substring(0, removeAfter);
    let testPara = document.getElementById("testPara");
    testPara.innerHTML = "Code: "+searchCode;

    //grant_type=authorization_code&code=8c66f9e519b7ec8498c8b4&client_id=123457&client_secret=TqlCb4VTZc89.7NKgBp9e
    
    const body = new URLSearchParams({
        grant_type: "authorization_code",
        code: searchCode,
        client_id: my_client_id,
        client_secret: my_client_secret,
      });
      const tokenFetch = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body,
      });
    console.log(tokenFetch);
}

async function getCharacterIds() {
    //Profile - ?components=100
    let profileRequestUrl = baseUrl + currentPlayerMembershipType + "/Profile/" + currentPlayerMembershipId + "/?components=100";
    const response = await fetch(profileRequestUrl, {
        method: 'GET', headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'X-API-Key': apiKey
    } });
    const data = await response.json();
    numberOfIdsFound = Object.keys(data.Response.profile.data.characterIds).length;
    characterIds = Object.values(data.Response.profile.data.characterIds);
    for(let i = 0; i<characterIds.length;i++){
        if (i > 2){
            break;
        }
    }
    getCharacterInfo();
}

async function getCharacterInfo() {
    // ?components=200
    for (let i = 0; i < characterIds.length; i++) {
        let characterDataRequestUrl = baseUrl + currentPlayerMembershipType + "/Profile/" + currentPlayerMembershipId + "/Character/";
        characterDataRequestUrl += characterIds[i];
        characterDataRequestUrl += "/?components=200";

        const response = await fetch(characterDataRequestUrl, { method: 'GET', headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                'X-API-Key': apiKey
        } });
        const data = await response.json();
        let character1Tile = document.getElementById("characterContainer1");
        let character2Tile = document.getElementById("characterContainer2");
        let character3Tile = document.getElementById("characterContainer3");
        if (document.contains(character1Tile) && document.contains(character2Tile) && document.contains(character3Tile)) {
            updateCharacterTile(data, i);
        }
    }
}

async function getProfileStats() {
    let statCollection = document.getElementsByClassName("profileStat");
    let searchGroup = 1;
    let profileStatsUrl = baseUrl + currentPlayerMembershipType + "/Account/"+currentPlayerMembershipId + "/Stats/?groups="+searchGroup;
    const response = await fetch(profileStatsUrl, { method: 'GET', headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'X-API-Key': apiKey
    } });
    const data = await response.json();
    //console.log(data);    
    pveStatData = data.Response.mergedAllCharacters.results.allPvE.allTime;
    pvpStatData = data.Response.mergedAllCharacters.results.allPvP.allTime;
    //console.log(pveStatData);
    console.log(pvpStatData);
    for(let index = 0; index < statCollection.length;index++){
        switch(statCollection[index].id){
            case "highestCharacterLevelStat":
                statCollection[index].innerHTML = pveStatData.highestCharacterLevel.basic.displayValue;
                break;
            case "highestPowerLevelStat":
                statCollection[index].innerHTML = pveStatData.highestLightLevel.basic.displayValue;
                break;
            case "bestScoreStat":
                statCollection[index].innerHTML = pveStatData.score.basic.displayValue;
                break;
            case "longestSingleLifeStat":
                statCollection[index].innerHTML = pveStatData.longestSingleLife.basic.displayValue;
                break;
            case "bestSingleGameKillsStat":
                statCollection[index].innerHTML = pveStatData.bestSingleGameKills.basic.displayValue;
                break;
            case "mostPrecisionKillsStat":
                statCollection[index].innerHTML = pveStatData.mostPrecisionKills.basic.displayValue;
                break;
            case "bestKillStreakStat":
                statCollection[index].innerHTML = pveStatData.longestKillSpree.basic.displayValue;
                break;
            case "longestKillDistanceStat":
                statCollection[index].innerHTML = pveStatData.longestKillDistance.basic.displayValue + "m";
                break;
            case "bestWeaponStat":
                statCollection[index].innerHTML = pveStatData.weaponBestType.basic.displayValue;
                break;
            case "activitiesEnteredStat":
                statCollection[index].innerHTML = pveStatData.activitiesEntered.basic.displayValue;
                break;
            case "activitiesClearedStat":
                statCollection[index].innerHTML = pveStatData.activitiesCleared.basic.displayValue;
                break;
            case "timePlayedStat":
                statCollection[index].innerHTML = pveStatData.secondsPlayed.basic.displayValue;
                break;
            case "scoreStat":
                statCollection[index].innerHTML = pveStatData.score.basic.displayValue;
                break;
            case "teamScoreStat":
                statCollection[index].innerHTML = pveStatData.teamScore.basic.displayValue;
                break;
            case "objectivesCompletedStat":
                statCollection[index].innerHTML = pveStatData.objectivesCompleted.basic.displayValue;
                break;
            case "publicEventCompletedStat":
                statCollection[index].innerHTML = pveStatData.publicEventsCompleted.basic.displayValue;   //Needs Changing
                break;
            case "publicEventsCompletedStat":
                statCollection[index].innerHTML = pveStatData.publicEventsCompleted.basic.displayValue;
                break;
            case "adventuresCompletedStat":
                statCollection[index].innerHTML = pveStatData.adventuresCompleted.basic.displayValue;
                break;
            case "winsStat":
                statCollection[index].innerHTML = pvpStatData.winLossRatio.basic.displayValue;
                break;
            case "winLossRatioStat":
                statCollection[index].innerHTML = pvpStatData.winLossRatio.basic.displayValue;
                break;
            case "combatRatingStat":
                statCollection[index].innerHTML = pvpStatData.combatRating.basic.displayValue;
                break;
            case "killsStat":
                statCollection[index].innerHTML = pveStatData.kills.basic.displayValue;
                break;
            case "deathsStat":
                statCollection[index].innerHTML = pveStatData.deaths.basic.displayValue;
                break;
            case "killDeathRatioStat":
                statCollection[index].innerHTML = pveStatData.killsDeathsRatio.basic.displayValue;
                break;
            case "killDeathAverageStat":
                statCollection[index].innerHTML = pvpStatData.killsDeathsRatio.basic.displayValue;
                break;
            case "averageKillDistanceStat":
                statCollection[index].innerHTML = pveStatData.averageKillDistance.basic.displayValue;
                break;
            case "assistsStat":
                statCollection[index].innerHTML = pveStatData.assists.basic.displayValue;
                break;
            case "precisionKillsStat":
                statCollection[index].innerHTML = pveStatData.precisionKills.basic.displayValue;
                break;
            case "opponentsDefeatedStat":
                statCollection[index].innerHTML = pveStatData.opponentsDefeated.basic.displayValue;
                break;
            case "efficiencyStat":
                statCollection[index].innerHTML = pveStatData.efficiency.basic.displayValue;
                break;
            case "suicidesStat":
                statCollection[index].innerHTML = pveStatData.suicides.basic.displayValue;
                break;
            case "averageScorePerKillStat":
                statCollection[index].innerHTML = pvpStatData.averageScorePerKill.basic.displayValue;
                break;
            case "averageScorePerLifeStat":
                statCollection[index].innerHTML = pvpStatData.averageScorePerLife.basic.displayValue;
                break;
            case "averageLifespanStat":
                statCollection[index].innerHTML = pveStatData.averageLifespan.basic.displayValue;
                break;
            case "resurrectionsStat":
                statCollection[index].innerHTML = pveStatData.resurrectionsPerformed.basic.displayValue;
                break;
            case "resurrectionsRecievedStat":
                statCollection[index].innerHTML = pveStatData.resurrectionsReceived.basic.displayValue;
                break;
            case "orbsDroppedStat":
                statCollection[index].innerHTML = pveStatData.orbsDropped.basic.displayValue;
                break;
            case "orbsGatheredStat":
                statCollection[index].innerHTML = pveStatData.orbsGathered.basic.displayValue;
                break;
        }
    }
    //Add any extra stuff here 
    DrawGraphs();
}

function pvpStatSwitch(){
    let pvpSwitch = document.getElementById("pvpSwitch");
    let statCollectionForSwitch = document.getElementsByClassName("profileStat");
    let winsDiv = document.getElementById("winsDiv");
    let winLossRatioDiv = document.getElementById("winLossRatioDiv");
    let averageScorePerKillDiv = document.getElementById("averageScorePerKillDiv");
    let averageScorePerLifeDiv = document.getElementById("averageScorePerLifeDiv");
    let combatRatingDiv = document.getElementById("combatRatingDiv");
    

    if (pvpSwitch.checked){
        winsDiv.style.visibility = "visible";
        winLossRatioDiv.style.visibility = "visible";
        averageScorePerKillDiv.style.visibility = "visible";
        averageScorePerLifeDiv.style.visibility = "visible";
        combatRatingDiv.style.visibility = "visible";
        swapToPvPStats();
    }
    else{
        winsDiv.style.visibility = "hidden";
        winLossRatioDiv.style.visibility = "hidden";
        averageScorePerKillDiv.style.visibility = "hidden";
        averageScorePerLifeDiv.style.visibility = "hidden";
        combatRatingDiv.style.visibility = "hidden";
        swapToPVEStats();
    }

    function swapToPVEStats() {
        for (let indexForSwitch = 0; indexForSwitch < statCollectionForSwitch.length; indexForSwitch++) {
            switch (statCollectionForSwitch[indexForSwitch].id) {
                case "bestScoreStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.score.basic.displayValue;
                    break;
                case "longestSingleLifeStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.longestSingleLife.basic.displayValue;
                    break;
                case "bestSingleGameKillsStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.bestSingleGameKills.basic.displayValue;
                    break;
                case "mostPrecisionKillsStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.mostPrecisionKills.basic.displayValue;
                    break;
                case "bestKillStreakStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.longestKillSpree.basic.displayValue;
                    break;
                case "longestKillDistanceStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.longestKillDistance.basic.displayValue + "m";
                    break;
                case "bestWeaponStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.weaponBestType.basic.displayValue;
                    break;
                case "activitiesEnteredStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.activitiesEntered.basic.displayValue;
                    break;
                case "activitiesClearedStat":
                    let activitiesClearedTitle = document.getElementById("activititesClearedandWon");
                    activitiesClearedTitle.innerHTML = "Activities Cleared";
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.activitiesCleared.basic.displayValue;
                    break;
                case "timePlayedStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.secondsPlayed.basic.displayValue;
                    break;
                case "scoreStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.score.basic.displayValue;
                    break;
                case "teamScoreStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.teamScore.basic.displayValue;
                    break;
                case "objectivesCompletedStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.objectivesCompleted.basic.displayValue;
                    break;
                case "publicEventCompletedStat":
                    let publicEventCompletedDiv = document.getElementById("publicEventCompletedDiv");
                    publicEventCompletedDiv.style.visibility = "visible";
                    break;
                case "publicEventsCompletedStat":
                    let publicEventsCompletedDiv = document.getElementById("publicEventsCompletedDiv");
                    publicEventsCompletedDiv.style.visibility = "visible";
                    break;
                case "adventuresCompletedStat":
                    let adventuresCompletedDiv = document.getElementById("adventuresCompletedDiv");
                    adventuresCompletedDiv.style.visibility = "visible";
                    break;
                case "winsStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.winLossRatio.basic.displayValue;
                    break;
                case "winLossRatioStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.winLossRatio.basic.displayValue;
                    break;
                case "combatRatingStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.combatRating.basic.displayValue;
                    break;
                case "killsStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.kills.basic.displayValue;
                    break;
                case "deathsStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.deaths.basic.displayValue;
                    break;
                case "killDeathRatioStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.killsDeathsRatio.basic.displayValue;
                    break;
                case "killDeathAverageStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.killsDeathsRatio.basic.displayValue;
                    break;
                case "averageKillDistanceStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.averageKillDistance.basic.displayValue;
                    break;
                case "assistsStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.assists.basic.displayValue;
                    break;
                case "precisionKillsStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.precisionKills.basic.displayValue;
                    break;
                case "opponentsDefeatedStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.opponentsDefeated.basic.displayValue;
                    break;
                case "efficiencyStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.efficiency.basic.displayValue;
                    break;
                case "suicidesStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.suicides.basic.displayValue;
                    break;
                case "averageScorePerKillStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.averageScorePerKill.basic.displayValue;
                    break;
                case "averageScorePerLifeStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.averageScorePerLife.basic.displayValue;
                    break;
                case "averageLifespanStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.averageLifespan.basic.displayValue;
                    break;
                case "resurrectionsStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.resurrectionsPerformed.basic.displayValue;
                    break;
                case "resurrectionsRecievedStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.resurrectionsReceived.basic.displayValue;
                    break;
                case "orbsDroppedStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.orbsDropped.basic.displayValue;
                    break;
                case "orbsGatheredStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveStatData.orbsGathered.basic.displayValue;
                    break;
            }
        }
    }

    function swapToPvPStats() {
        for (let indexForSwitch = 0; indexForSwitch < statCollectionForSwitch.length; indexForSwitch++) {
            switch (statCollectionForSwitch[indexForSwitch].id) {
                case "bestScoreStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.score.basic.displayValue;
                    break;
                case "longestSingleLifeStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.longestSingleLife.basic.displayValue;
                    break;
                case "bestSingleGameKillsStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.bestSingleGameKills.basic.displayValue;
                    break;
                case "mostPrecisionKillsStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.mostPrecisionKills.basic.displayValue;
                    break;
                case "bestKillStreakStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.longestKillSpree.basic.displayValue;
                    break;
                case "longestKillDistanceStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.longestKillDistance.basic.displayValue + "m";
                    break;
                case "bestWeaponStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.weaponBestType.basic.displayValue;
                    break;
                case "activitiesEnteredStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.activitiesEntered.basic.displayValue;
                    break;
                case "activitiesClearedStat":
                    let activitiesClearedTitle = document.getElementById("activititesClearedandWon");
                    activitiesClearedTitle.innerHTML = "Activities Won";
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.activitiesWon.basic.displayValue;
                    break;
                case "timePlayedStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.secondsPlayed.basic.displayValue;
                    break;
                case "scoreStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.score.basic.displayValue;
                    break;
                case "teamScoreStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.teamScore.basic.displayValue;
                    break;
                case "objectivesCompletedStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.objectivesCompleted.basic.displayValue;
                    break;
                case "publicEventCompletedStat":
                    let publicEventCompletedDiv = document.getElementById("publicEventCompletedDiv");
                    publicEventCompletedDiv.style.visibility = "hidden";
                    break;
                case "publicEventsCompletedStat":
                    let publicEventsCompletedDiv = document.getElementById("publicEventsCompletedDiv");
                    publicEventsCompletedDiv.style.visibility = "hidden";
                    break;
                case "adventuresCompletedStat":
                    let adventuresCompletedDiv = document.getElementById("adventuresCompletedDiv");
                    adventuresCompletedDiv.style.visibility = "hidden";
                    break;
                case "winsStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.winLossRatio.basic.displayValue;
                    break;
                case "winLossRatioStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.winLossRatio.basic.displayValue;
                    break;
                case "combatRatingStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.combatRating.basic.displayValue;
                    break;
                case "killsStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.kills.basic.displayValue;
                    break;
                case "deathsStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.deaths.basic.displayValue;
                    break;
                case "killDeathRatioStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.killsDeathsRatio.basic.displayValue;
                    break;
                case "killDeathAverageStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.killsDeathsRatio.basic.displayValue;
                    break;
                case "averageKillDistanceStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.averageKillDistance.basic.displayValue;
                    break;
                case "assistsStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.assists.basic.displayValue;
                    break;
                case "precisionKillsStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.precisionKills.basic.displayValue;
                    break;
                case "opponentsDefeatedStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.opponentsDefeated.basic.displayValue;
                    break;
                case "efficiencyStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.efficiency.basic.displayValue;
                    break;
                case "suicidesStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.suicides.basic.displayValue;
                    break;
                case "averageScorePerKillStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.averageScorePerKill.basic.displayValue;
                    break;
                case "averageScorePerLifeStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.averageScorePerLife.basic.displayValue;
                    break;
                case "averageLifespanStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.averageLifespan.basic.displayValue;
                    break;
                case "resurrectionsStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.resurrectionsPerformed.basic.displayValue;
                    break;
                case "resurrectionsRecievedStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.resurrectionsReceived.basic.displayValue;
                    break;
                case "orbsDroppedStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.orbsDropped.basic.displayValue;
                    break;
                case "orbsGatheredStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpStatData.orbsGathered.basic.displayValue;
                    break;
            }
        }
    }
}

//Need to Alter this!!
async function getCharacterStats(data) {
    const statsObject = data.Response.character.data.stats;
    let powerStatText = document.getElementById("powerStat");
    let mobilityStatText = document.getElementById("mobilityStat");
    let resilienceStatText = document.getElementById("resilienceStat");
    let recoveryStatText = document.getElementById("recoveryStat");
    let disciplineStatText = document.getElementById("disciplineStat");
    let intellectStatText = document.getElementById("intellectStat");
    let strengthStatText = document.getElementById("strengthStat");

    powerStatText.innerHTML += statsObject["1935470627"];
    mobilityStatText.innerHTML += statsObject["2996146975"];
    resilienceStatText.innerHTML += statsObject["392767087"];
    recoveryStatText.innerHTML += statsObject["1943323491"];
    disciplineStatText.innerHTML += statsObject["1735777505"];
    intellectStatText.innerHTML += statsObject["144602215"];
    strengthStatText.innerHTML += statsObject["4244567218"];
}

async function getCharacterEquipment(idIndex) {
    let equipmentItems = null;
    let characterId = characterIds[idIndex];
    let characterEquipmentRequestUrl = baseUrl + currentPlayerMembershipType + "/Profile/" + currentPlayerMembershipId + "/Character/" + characterId + "/?components=205";
    
    const equipmentResponse = await fetch(characterEquipmentRequestUrl, {
        method: 'GET', headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'X-API-Key': apiKey
        }
    });
    const equipmentJsonData = await equipmentResponse.json();
    equipmentItems = equipmentJsonData.Response.equipment.data.items;
    updateItems(itemDefinitionData, equipmentItems);
    getCharacterInventory(idIndex);
}

async function getCharacterInventory(idIndex) {

    if (window.location.search == ""){
        alert("Please Sign in to Bungie!");
    }
    else{
        ///Platform/Destiny2/3/Profile/4611686018523938391/Character/2305843010090644510/?components=201
        let characterId = characterIds[idIndex];
        let characterInventoryRequestUrl = baseUrl + platformIndex + "/Profile/" + currentPlayerMembershipId + "/Character/" + characterId + "/?components=201";
        const inventoryResponse = await fetch(characterInventoryRequestUrl, {
            method: 'GET', headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                'X-API-Key': apiKey
            }
        });
        const inventoryJsonData = await inventoryResponse.json();
        console.log(inventoryJsonData);
    }
}

// SUB FUNCTIONS
async function createSearchResults(searchData, numOfResults) {
    let resultsBox = document.getElementById("searchResultsBox");
    let resultsTitle = document.getElementById("searchResultsTitle");
    resultsTitle.style.visibility = "visible";
    for (let i = 0; i < numOfResults; i++) {
        if (!resultsBox.hasChildNodes()){
            constructPlayerButton(i);
        }
        else{
            let resultsChildren = Array.from(resultsBox.childNodes);
            let newPlayerName = (element) => element.innerHTML === searchData.Response.searchResults[i].destinyMemberships[0].displayName;
            if (!resultsChildren.some(newPlayerName))
            {
                constructPlayerButton(i);
            }
            else{
                alert("Player: "+ searchData.Response.searchResults[i].destinyMemberships[0].displayName + " already exists");
            }
        }
            
    }

    function constructPlayerButton(i) {
        let newAccountButton = document.createElement('button');
        newAccountButton.id = "playerAccountButton";
        newAccountButton.innerHTML = searchData.Response.searchResults[i].destinyMemberships[0].displayName;
        resultsBox.appendChild(newAccountButton);
        newAccountButton.onclick = function () {
            currentPlayerMembershipId = searchData.Response.searchResults[i].destinyMemberships[0].membershipId;
            currentPlayerMembershipType = searchData.Response.searchResults[i].destinyMemberships[0].membershipType;
            getProfileStats();
            getCharacterIds();
        };
    }
}

async function getManifest() {
    let manifestRequestUrl = "https://www.bungie.net/Platform/Destiny2/Manifest/";
    const manifestResponse = await fetch(manifestRequestUrl, {
        method: 'GET', headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'X-API-Key': apiKey
        }
    });
    manifestJsonData = await manifestResponse.json();
    
}
async function getItemDefinitionLibrary() {
    let itemDefinitionUrl = "https://www.bungie.net";
    itemDefinitionUrl += manifestJsonData.Response.jsonWorldComponentContentPaths.en.DestinyInventoryItemDefinition;
    const itemDefinitionResponse = await fetch(itemDefinitionUrl, { method: 'GET' });
    itemDefinitionData = await itemDefinitionResponse.json();
}
async function getStatDefinitionLibrary() {
    let statDefinitionUrl = "https://www.bungie.net";
    statDefinitionUrl += manifestJsonData.Response.jsonWorldComponentContentPaths.en.DestinyStatDefinition;
    const statDefinitionResponse = await fetch(statDefinitionUrl, { method: 'GET' });
    statDefinitionData = await statDefinitionResponse.json();
}

function DrawGraphs(){
    // Line Graph
    /*
    const xValues = [50,60,70,80,90,100,110,120,130,140,150];
    const yValues = [7,8,8,9,9,9,10,11,14,14,15];
    new Chart("myChart", {
        type: "line",
        data: {
          labels: xValues,
          datasets: [{
            fill:false,
            backgroundColor:"rgba(0,0,255,1.0)",
            borderColor: "rgba(0,0,255,0.1)",
            data: yValues
          }]
        },
        options:{
            legend: {display: false},
            scales: {
                yAxes: [{ticks: {min: 6, max:16}}],
            }
        }
    });
    */
    var xValues = ["PvE", "PvP"];
    var yValues = [pveStatData.kills.basic.displayValue, pvpStatData.kills.basic.displayValue];
    var barColors = ["red", "red"];
    
    new Chart("myChart", {
        type: "bar",
        data: {
            labels: xValues,
            datasets: [{
                backgroundColor: barColors,
                data: yValues
            }]
        },
        options: {
            legend: {display: false},
            title: {
                display: true,
                text: "Total Kills"
            }
        }
    });
}

function updateCharacterTile(data, idIndex) {
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

    switch(data.Response.character.data.raceType){
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

    powerTextToEdit.innerHTML = data.Response.character.data.light
    levelTextToEdit.innerHTML = data.Response.character.data.baseCharacterLevel
    containerToEdit.onclick = function(){
        getCharacterStats(data);
        getCharacterEquipment(idIndex);
    }
    containerToEdit.style.visibility = "visible";
}

function updateItems(itemDefinitionData,equipmentItems) {
    let baseImagePath = "https://www.bungie.net";
    for (let i = 0; i < equipmentItems.length; i++) {
        let currentItem = itemDefinitionData[equipmentItems[i].itemHash];
        switch (equipmentItems[i].bucketHash) {
            case 1498876634: //Kinetic Weapon
                let kineticWeaponIcon = document.getElementById("kineticWeaponImage");
                let kineticWeaponName = document.getElementById("kineticWeaponName");
                let kineticWeaponType = document.getElementById("kineticWeaponType");
                let kineticWeaponNameDesc = document.getElementById("kineticWeaponDesc");
                kineticWeaponIcon.src = baseImagePath + currentItem.displayProperties.icon;
                kineticWeaponName.innerHTML = currentItem.displayProperties.name;
                kineticWeaponType.innerHTML = currentItem.itemTypeAndTierDisplayName;
                kineticWeaponNameDesc.innerHTML = currentItem.flavorText;
                let statsHashList = itemDefinitionData[equipmentItems[i].itemHash].stats.stats;
                statsHashList = Object.entries(statsHashList);
                //NEED TO STORE KEYS AND INFO IN ARRAYS
                console.log(statsHashList[0][0]);
                console.log(statsHashList[0][1].value);
                //[155624089].displayProperties.name
                //[155624089].value
                break;
            case 2465295065: //Energy Weapon
                let energyWeaponIcon = document.getElementById("energyWeaponImage");
                let energyWeaponName = document.getElementById("energyWeaponName");
                let energyWeaponType = document.getElementById("energyWeaponType");
                let energyWeaponDesc = document.getElementById("energyWeaponDesc");
                energyWeaponIcon.src = baseImagePath + currentItem.displayProperties.icon;
                energyWeaponName.innerHTML = currentItem.displayProperties.name;
                energyWeaponType.innerHTML = currentItem.itemTypeAndTierDisplayName;
                energyWeaponDesc.innerHTML = currentItem.flavorText;
                break;
            case 953998645: //Power Weapon
                let powerWeaponIcon = document.getElementById("powerWeaponImage");
                let powerWeaponName = document.getElementById("powerWeaponName");
                let powerWeaponType = document.getElementById("powerWeaponType");
                let powerWeaponDesc = document.getElementById("powerWeaponDesc");
                powerWeaponIcon.src = baseImagePath + currentItem.displayProperties.icon;
                powerWeaponName.innerHTML = currentItem.displayProperties.name;
                powerWeaponType.innerHTML = currentItem.itemTypeAndTierDisplayName;
                powerWeaponDesc.innerHTML = currentItem.flavorText;
                break;
            case 3448274439: //Helmet Armour
                let helmetArmourIcon = document.getElementById("helmetArmourImage");
                let helmetArmourName = document.getElementById("helmetArmourName");
                let helmetArmourType = document.getElementById("helmetArmourType");
                helmetArmourIcon.src = baseImagePath + currentItem.displayProperties.icon;
                helmetArmourName.innerHTML = currentItem.displayProperties.name;
                helmetArmourType.innerHTML = currentItem.itemTypeAndTierDisplayName;
                break;
            case 3551918588: //Gaunlets Armour
                let gaunletsArmourIcon = document.getElementById("gaunletsArmourImage");
                let gaunletsArmourName = document.getElementById("gaunletsArmourName");
                let gaunletsArmourType = document.getElementById("gaunletsArmourType");
                gaunletsArmourIcon.src = baseImagePath + currentItem.displayProperties.icon;
                gaunletsArmourName.innerHTML = currentItem.displayProperties.name;
                gaunletsArmourType.innerHTML = currentItem.itemTypeAndTierDisplayName;
                break;
            case 14239492: //Chest Armour
                let chestArmourIcon = document.getElementById("chestArmourImage");
                let chestArmourName = document.getElementById("chestArmourName");
                let chestArmourType = document.getElementById("chestArmourType");
                chestArmourIcon.src = baseImagePath + currentItem.displayProperties.icon;
                chestArmourName.innerHTML = currentItem.displayProperties.name;
                chestArmourType.innerHTML = currentItem.itemTypeAndTierDisplayName;
                break;
            case 20886954: //Leg Armour
                let legArmourIcon = document.getElementById("legArmourImage");
                let legArmourName = document.getElementById("legArmourName");
                let legArmourType = document.getElementById("legArmourType");
                legArmourIcon.src = baseImagePath + currentItem.displayProperties.icon;
                legArmourName.innerHTML = currentItem.displayProperties.name;
                legArmourType.innerHTML = currentItem.itemTypeAndTierDisplayName;
                break;
            case 1585787867: //Class Armour
                let classArmourIcon = document.getElementById("classArmourImage");
                let classArmourName = document.getElementById("classArmourName");
                let classArmourType = document.getElementById("classArmourType");
                classArmourIcon.src = baseImagePath + currentItem.displayProperties.icon;
                classArmourName.innerHTML = currentItem.displayProperties.name;
                classArmourType.innerHTML = currentItem.itemTypeAndTierDisplayName;
                break;

        }
    }
    let weaponContainer = document.getElementById("weaponsContainer");
    let armourContainer = document.getElementById("armourContainer");
    weaponContainer.style.marginLeft = "10%";
    armourContainer.style.marginLeft = "10%";
}
