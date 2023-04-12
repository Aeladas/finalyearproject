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
    let pveCollection = document.getElementsByClassName("profilePVEStatText");
    let pvpCollection = document.getElementsByClassName("profilePVPStatText");

    let searchGroup = 1;
    let profileStatsUrl = baseUrl + currentPlayerMembershipType + "/Account/"+currentPlayerMembershipId + "/Stats/?groups="+searchGroup;
    const response = await fetch(profileStatsUrl, { method: 'GET', headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'X-API-Key': apiKey
    } });
    const data = await response.json();
    const pve = data.Response.mergedAllCharacters.results.allPvE.allTime;
    const pvp = data.Response.mergedAllCharacters.results.allPvP.allTime;

    for(let e=0; e < pveCollection.length;e++){
        switch(pveCollection[e].id){
            case "PVE_activitiesCleared":
                pveCollection[e].innerHTML += pve.activitiesCleared.basic.displayValue;
                break;
            case "PVE_activitiesEntered":
                pveCollection[e].innerHTML += pve.activitiesEntered.basic.displayValue;
                break;
            case "PVE_assists":
                pveCollection[e].innerHTML += pve.assists.basic.displayValue;
                break;
            case "PVE_totalDeathDistance":
                pveCollection[e].innerHTML += pve.totalDeathDistance.basic.displayValue;
                break;
            case "PVE_averageDeathDistance":
                pveCollection[e].innerHTML += pve.averageDeathDistance.basic.displayValue;
                break;
            case "PVE_totalKillDistance":
                pveCollection[e].innerHTML += pve.totalKillDistance.basic.displayValue;
                break;
            case "PVE_kills":
                pveCollection[e].innerHTML += pve.kills.basic.displayValue;
                break;
            case "PVE_averageKillDistance":
                pveCollection[e].innerHTML += pve.averageKillDistance.basic.displayValue;
                break;
            case "PVE_secondsPlayed":
                pveCollection[e].innerHTML += pve.secondsPlayed.basic.displayValue;
                break;
            case "PVE_deaths":
                pveCollection[e].innerHTML += pve.deaths.basic.displayValue;
                break;
            case "PVE_averageLifespan":
                pveCollection[e].innerHTML += pve.averageLifespan.basic.displayValue;
                break;
            case "PVE_bestSingleGameKills":
                pveCollection[e].innerHTML += pve.bestSingleGameKills.basic.displayValue;
                break;
            case "PVE_bestSingleGameScore":
                pveCollection[e].innerHTML += pve.bestSingleGameScore.basic.displayValue;
                break;
            case "PVE_opponentsDefeated":
                pveCollection[e].innerHTML += pve.opponentsDefeated.basic.displayValue;
                break;
            case "PVE_efficiency":
                pveCollection[e].innerHTML += pve.efficiency.basic.displayValue;
                break;
            case "PVE_killsDeathsRatio":
                pveCollection[e].innerHTML += pve.killsDeathsRatio.basic.displayValue;
                break;
            case "PVE_killsDeathsAssists":
                pveCollection[e].innerHTML += pve.killsDeathsAssists.basic.displayValue;
                break;
            case "PVE_objectivesCompleted":
                pveCollection[e].innerHTML += pve.objectivesCompleted.basic.displayValue;
                break;
            case "PVE_precisionKills":
                pveCollection[e].innerHTML += pve.precisionKills.basic.displayValue;
                break;
            case "PVE_resurrectionsPerformed":
                pveCollection[e].innerHTML += pve.resurrectionsPerformed.basic.displayValue;
                break;
            case "PVE_resurrectionsReceived":
                pveCollection[e].innerHTML += pve.resurrectionsReceived.basic.displayValue;
                break;
            case "PVE_score":
                pveCollection[e].innerHTML += pve.score.basic.displayValue;
                break;
            case "PVE_heroicPublicEventsCompleted":
                pveCollection[e].innerHTML += pve.heroicPublicEventsCompleted.basic.displayValue;
                break;
            case "PVE_adventuresCompleted":
                pveCollection[e].innerHTML += pve.adventuresCompleted.basic.displayValue;
                break;
            case "PVE_suicides":
                pveCollection[e].innerHTML += pve.suicides.basic.displayValue;
                break;
            case "PVE_weaponKillsAutoRifle":
                pveCollection[e].innerHTML += pve.weaponKillsAutoRifle.basic.displayValue;
                break;
            case "PVE_weaponKillsBeamRifle":
                pveCollection[e].innerHTML += pve.weaponKillsBeamRifle.basic.displayValue;
                break;
            case "PVE_weaponKillsBow":
                pveCollection[e].innerHTML += pve.weaponKillsBow.basic.displayValue;
                break;
            case "PVE_weaponKillsGlaive":
                pveCollection[e].innerHTML += pve.weaponKillsGlaive.basic.displayValue;
                break;
            case "PVE_weaponKillsFusionRifle":
                pveCollection[e].innerHTML += pve.weaponKillsFusionRifle.basic.displayValue;
                break;
            case "PVE_weaponKillsHandCannon":
                pveCollection[e].innerHTML += pve.weaponKillsHandCannon.basic.displayValue;
                break;
            case "PVE_weaponKillsTraceRifle":
                pveCollection[e].innerHTML += pve.weaponKillsTraceRifle.basic.displayValue;
                break;
            case "PVE_weaponKillsMachineGun":
                pveCollection[e].innerHTML += pve.weaponKillsMachineGun.basic.displayValue;
                break;
            case "PVE_weaponKillsPulseRifle":
                pveCollection[e].innerHTML += pve.weaponKillsPulseRifle.basic.displayValue;
                break;
            case "PVE_weaponKillsRocketLauncher":
                pveCollection[e].innerHTML += pve.weaponKillsRocketLauncher.basic.displayValue;
                break;
            case "PVE_weaponKillsScoutRifle":
                pveCollection[e].innerHTML += pve.weaponKillsScoutRifle.basic.displayValue;
                break;
            case "PVE_weaponKillsShotgun":
                pveCollection[e].innerHTML += pve.weaponKillsShotgun.basic.displayValue;
                break;
            case "PVE_weaponKillsSniper":
                pveCollection[e].innerHTML += pve.weaponKillsSniper.basic.displayValue;
                break;
            case "PVE_weaponKillsSubmachinegun":
                pveCollection[e].innerHTML += pve.weaponKillsSubmachinegun.basic.displayValue;
                break;
            case "PVE_weaponKillsRelic":
                pveCollection[e].innerHTML += pve.weaponKillsRelic.basic.displayValue;
                break;
            case "PVE_weaponKillsSideArm":
                pveCollection[e].innerHTML += pve.weaponKillsSideArm.basic.displayValue;
                break;
            case "PVE_weaponKillsSword":
                pveCollection[e].innerHTML += pve.weaponKillsSword.basic.displayValue;
                break;
            case "PVE_weaponKillsAbility":
                pveCollection[e].innerHTML += pve.weaponKillsAbility.basic.displayValue;
                break;
            case "PVE_weaponKillsGrenade":
                pveCollection[e].innerHTML += pve.weaponKillsGrenade.basic.displayValue;
                break;
            case "PVE_weaponKillsGrenadeLauncher":
                pveCollection[e].innerHTML += pve.weaponKillsGrenadeLauncher.basic.displayValue;
                break;
            case "PVE_weaponKillsSuper":
                pveCollection[e].innerHTML += pve.weaponKillsSuper.basic.displayValue;
                break;
            case "PVE_weaponKillsMelee":
                pveCollection[e].innerHTML += pve.weaponKillsMelee.basic.displayValue;
                break;
            case "PVE_weaponBestType":
                pveCollection[e].innerHTML += pve.weaponBestType.basic.displayValue;
                break;
            case "PVE_allParticipantsCount":
                pveCollection[e].innerHTML += pve.allParticipantsCount.basic.displayValue;
                break;
            case "PVE_allParticipantsScore":
                pveCollection[e].innerHTML += pve.allParticipantsScore.basic.displayValue;
                break;
            case "PVE_allParticipantsTimePlayed":
                pveCollection[e].innerHTML += pve.allParticipantsTimePlayed.basic.displayValue;
                break;
            case "PVE_longestKillSpree":
                pveCollection[e].innerHTML += pve.longestKillSpree.basic.displayValue;
                break;
            case "PVE_longestSingleLife":
                pveCollection[e].innerHTML += pve.longestSingleLife.basic.displayValue;
                break;
            case "PVE_mostPrecisionKills":
                pveCollection[e].innerHTML += pve.mostPrecisionKills.basic.displayValue;
                break;
            case "PVE_orbsDropped":
                pveCollection[e].innerHTML += pve.orbsDropped.basic.displayValue;
                break;
            case "PVE_orbsGathered":
                pveCollection[e].innerHTML += pve.orbsGathered.basic.displayValue;
                break;
            case "PVE_publicEventsCompleted":
                pveCollection[e].innerHTML += pve.publicEventsCompleted.basic.displayValue;
                break;
            case "PVE_remainingTimeAfterQuitSeconds":
                pveCollection[e].innerHTML += pve.remainingTimeAfterQuitSeconds.basic.displayValue;
                break;
            case "PVE_teamScore":
                pveCollection[e].innerHTML += pve.teamScore.basic.displayValue;
                break;
            case "PVE_totalActivityDurationSeconds":
                pveCollection[e].innerHTML += pve.totalActivityDurationSeconds.basic.displayValue;
                break;
            case "PVE_fastestCompletionMs":
                pveCollection[e].innerHTML += pve.fastestCompletionMs.basic.displayValue;
                break;
            case "PVE_longestKillDistance":
                pveCollection[e].innerHTML += pve.longestKillDistance.basic.displayValue;
                break;
            case "PVE_highestCharacterLevel":
                pveCollection[e].innerHTML += pve.highestCharacterLevel.basic.displayValue;
                break;
            case "PVE_highestLightLevel":
                pveCollection[e].innerHTML += pve.highestLightLevel.basic.displayValue;
                break;
            case "PVE_fireTeamActivities":
                pveCollection[e].innerHTML += pve.fireTeamActivities.basic.displayValue;
                break;
        }
    }
    for(let p=0; p < pvpCollection.length;p++){
        switch(pvpCollection[p].id){
            case"PVP_activitiesEntered":
                pvpCollection[p].innerHTML += pvp.activitiesEntered.basic.displayValue;
                break;
            case"PVP_activitiesWon":
                pvpCollection[p].innerHTML += pvp.activitiesWon.basic.displayValue;
                break;
            case"PVP_assists":
                pvpCollection[p].innerHTML += pvp.assists.basic.displayValue;
                break;
            case"PVP_totalDeathDistance":
                pvpCollection[p].innerHTML += pvp.totalDeathDistance.basic.displayValue;
                break;
            case"PVP_averageDeathDistance":
                pvpCollection[p].innerHTML += pvp.averageDeathDistance.basic.displayValue;
                break;
            case"PVP_totalKillDistance":
                pvpCollection[p].innerHTML += pvp.totalKillDistance.basic.displayValue;
                break;
            case"PVP_kills":
                pvpCollection[p].innerHTML += pvp.kills.basic.displayValue;
                break;
            case"PVP_averageKillDistance":
                pvpCollection[p].innerHTML += pvp.averageKillDistance.basic.displayValue;
                break;
            case"PVP_secondsPlayed":
                pvpCollection[p].innerHTML += pvp.secondsPlayed.basic.displayValue;
                break;
            case"PVP_deaths":
                pvpCollection[p].innerHTML += pvp.deaths.basic.displayValue;
                break;
            case"PVP_averageLifespan":
                pvpCollection[p].innerHTML += pvp.averageLifespan.basic.displayValue;
                break;
            case"PVP_score":
                pvpCollection[p].innerHTML += pvp.score.basic.displayValue;
                break;
            case"PVP_averageScorePerKill":
                pvpCollection[p].innerHTML += pvp.averageScorePerKill.basic.displayValue;
                break;
            case"PVP_averageScorePerLife":
                pvpCollection[p].innerHTML += pvp.averageScorePerLife.basic.displayValue;
                break;
            case"PVP_bestSingleGameKills":
                pvpCollection[p].innerHTML += pvp.bestSingleGameKills.basic.displayValue;
                break;
            case"PVP_bestSingleGameScore":
                pvpCollection[p].innerHTML += pvp.bestSingleGameScore.basic.displayValue;
                break;
            case"PVP_opponentsDefeated":
                pvpCollection[p].innerHTML += pvp.opponentsDefeated.basic.displayValue;
                break;
            case"PVP_efficiency":
                pvpCollection[p].innerHTML += pvp.efficiency.basic.displayValue;
                break;
            case"PVP_killsDeathsRatio":
                pvpCollection[p].innerHTML += pvp.killsDeathsRatio.basic.displayValue;
                break;
            case"PVP_killsDeathsAssists":
                pvpCollection[p].innerHTML += pvp.killsDeathsAssists.basic.displayValue;
                break;
            case"PVP_objectivesCompleted":
                pvpCollection[p].innerHTML += pvp.objectivesCompleted.basic.displayValue;
                break;
            case"PVP_precisionKills":
                pvpCollection[p].innerHTML += pvp.precisionKills.basic.displayValue;
                break;
            case"PVP_resurrectionsPerformed":
                pvpCollection[p].innerHTML += pvp.resurrectionsPerformed.basic.displayValue;
                break;
            case"PVP_resurrectionsReceived":
                pvpCollection[p].innerHTML += pvp.resurrectionsReceived.basic.displayValue;
                break;
            case"PVP_suicides":
                pvpCollection[p].innerHTML += pvp.suicides.basic.displayValue;
                break;
            case"PVP_weaponKillsAutoRifle":
                pvpCollection[p].innerHTML += pvp.weaponKillsAutoRifle.basic.displayValue;
                break;
            case"PVP_weaponKillsBeamRifle":
                pvpCollection[p].innerHTML += pvp.weaponKillsBeamRifle.basic.displayValue;
                break;
            case"PVP_weaponKillsBow":
                pvpCollection[p].innerHTML += pvp.weaponKillsBow.basic.displayValue;
                break;
            case"PVP_weaponKillsGlaive":
                pvpCollection[p].innerHTML += pvp.weaponKillsGlaive.basic.displayValue;
                break;
            case"PVP_weaponKillsFusionRifle":
                pvpCollection[p].innerHTML += pvp.weaponKillsFusionRifle.basic.displayValue;
                break;
            case"PVP_weaponKillsHandCannon":
                pvpCollection[p].innerHTML += pvp.weaponKillsHandCannon.basic.displayValue;
                break;
            case"PVP_weaponKillsTraceRifle":
                pvpCollection[p].innerHTML += pvp.weaponKillsTraceRifle.basic.displayValue;
                break;
            case"PVP_weaponKillsMachineGun":
                pvpCollection[p].innerHTML += pvp.weaponKillsMachineGun.basic.displayValue;
                break;
            case"PVP_weaponKillsPulseRifle":
                pvpCollection[p].innerHTML += pvp.weaponKillsPulseRifle.basic.displayValue;
                break;
            case"PVP_weaponKillsRocketLauncher":
                pvpCollection[p].innerHTML += pvp.weaponKillsRocketLauncher.basic.displayValue;
                break;
            case"PVP_weaponKillsScoutRifle":
                pvpCollection[p].innerHTML += pvp.weaponKillsScoutRifle.basic.displayValue;
                break;
            case"PVP_weaponKillsShotgun":
                pvpCollection[p].innerHTML += pvp.weaponKillsShotgun.basic.displayValue;
                break;
            case"PVP_weaponKillsSniper":
                pvpCollection[p].innerHTML += pvp.weaponKillsSniper.basic.displayValue;
                break;
            case"PVP_weaponKillsSubmachinegun":
                pvpCollection[p].innerHTML += pvp.weaponKillsSubmachinegun.basic.displayValue;
                break;
            case"PVP_weaponKillsRelic":
                pvpCollection[p].innerHTML += pvp.weaponKillsRelic.basic.displayValue;
                break;
            case"PVP_weaponKillsSideArm":
                pvpCollection[p].innerHTML += pvp.weaponKillsSideArm.basic.displayValue;
                break;
            case"PVP_weaponKillsSword":
                pvpCollection[p].innerHTML += pvp.weaponKillsSword.basic.displayValue;
                break;
            case"PVP_weaponKillsAbility":
                pvpCollection[p].innerHTML += pvp.weaponKillsAbility.basic.displayValue;
                break;
            case"PVP_weaponKillsGrenade":
                pvpCollection[p].innerHTML += pvp.weaponKillsGrenade.basic.displayValue;
                break;
            case"PVP_weaponKillsGrenadeLauncher":
                pvpCollection[p].innerHTML += pvp.weaponKillsGrenadeLauncher.basic.displayValue;
                break;
            case"PVP_weaponKillsSuper":
                pvpCollection[p].innerHTML += pvp.weaponKillsSuper.basic.displayValue;
                break;
            case"PVP_weaponKillsMelee":
                pvpCollection[p].innerHTML += pvp.weaponKillsMelee.basic.displayValue;
                break;
            case"PVP_weaponBestType":
                pvpCollection[p].innerHTML += pvp.weaponBestType.basic.displayValue;
                break;
            case"PVP_winLossRatio":
                pvpCollection[p].innerHTML += pvp.winLossRatio.basic.displayValue;
                break;
            case"PVP_allParticipantsCount":
                pvpCollection[p].innerHTML += pvp.allParticipantsCount.basic.displayValue;
                break;
            case"PVP_allParticipantsScore":
                pvpCollection[p].innerHTML += pvp.allParticipantsScore.basic.displayValue;
                break;
            case"PVP_allParticipantsTimePlayed":
                pvpCollection[p].innerHTML += pvp.allParticipantsTimePlayed.basic.displayValue;
                break;
            case"PVP_longestKillSpree":
                pvpCollection[p].innerHTML += pvp.longestKillSpree.basic.displayValue;
                break;
            case"PVP_longestSingleLife":
                pvpCollection[p].innerHTML += pvp.longestSingleLife.basic.displayValue;
                break;
            case"PVP_mostPrecisionKills":
                pvpCollection[p].innerHTML += pvp.mostPrecisionKills.basic.displayValue;
                break;
            case"PVP_orbsDropped":
                pvpCollection[p].innerHTML += pvp.orbsDropped.basic.displayValue;
                break;
            case"PVP_orbsGathered":
                pvpCollection[p].innerHTML += pvp.orbsGathered.basic.displayValue;
                break;
            case"PVP_remainingTimeAfterQuitSeconds":
                pvpCollection[p].innerHTML += pvp.remainingTimeAfterQuitSeconds.basic.displayValue;
                break;
            case"PVP_teamScore":
                pvpCollection[p].innerHTML += pvp.teamScore.basic.displayValue;
                break;
            case"PVP_totalActivityDurationSeconds":
                pvpCollection[p].innerHTML += pvp.totalActivityDurationSeconds.basic.displayValue;
                break;
            case"PVP_combatRating":
                pvpCollection[p].innerHTML += pvp.combatRating.basic.displayValue;
                break;
            case"PVP_fastestCompletionMs":
                pvpCollection[p].innerHTML += pvp.fastestCompletionMs.basic.displayValue;
                break;
            case"PVP_longestKillDistance":
                pvpCollection[p].innerHTML += pvp.longestKillDistance.basic.displayValue;
                break;
            case"PVP_highestCharacterLevel":
                pvpCollection[p].innerHTML += pvp.highestCharacterLevel.basic.displayValue;
                break;
            case"PVP_highestLightLevel":
                pvpCollection[p].innerHTML += pvp.highestLightLevel.basic.displayValue;
                break;
            case"PVP_fireTeamActivities":
                pvpCollection[p].innerHTML += pvp.fireTeamActivities.basic.displayValue;
                break;
        }
    }
    //console.log(data);
}

function GetGeneralStats(){
    let testPara = document.getElementById("TestPara");
    testPara.innerHTML = "General Stats";
}
async function GetWeaponStats(){
    let testPara = document.getElementById("TestPara");
    testPara.innerHTML = "Weapon Stats";
    let searchGroup = 2;
    let profileWeaponStatsUrl = baseUrl + currentPlayerMembershipType + "/Account/"+currentPlayerMembershipId + "/Stats/?groups="+searchGroup;
    const response = await fetch(profileWeaponStatsUrl, { method: 'GET', headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'X-API-Key': apiKey
    } });
    const data = await response.json();
    console.log(data);
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
}

async function getCharacterInventory(idIndex) {
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
