﻿const apiKey = "40777cc6ab0b41839a4b27319ec5945b";
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
    let collection = document.getElementsByClassName("profileStatText");
    let searchGroup = 1;
    let profileStatsUrl = baseUrl + currentPlayerMembershipType + "/Account/"+currentPlayerMembershipId + "/Stats/?groups="+searchGroup;
    const response = await fetch(profileStatsUrl, { method: 'GET', headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'X-API-Key': apiKey
    } });
    const data = await response.json();
    const pve = data.Response.mergedAllCharacters.results.allPvE.allTime;
    console.log(pve);
    for(let e=0; e < collection.length;e++){
        switch(collection[e].id){
            case "activitiesCleared":
                collection[e].innerHTML = pve.activitiesCleared.basic.displayValue;
                break;
            case "activitiesEntered":
                collection[e].innerHTML = pve.activitiesEntered.basic.displayValue;
                break;
            case "assists":
                collection[e].innerHTML = pve.assists.basic.displayValue;
                break;
            case "totalDeathDistance":
                collection[e].innerHTML = pve.totalDeathDistance.basic.displayValue;
                break;
            case "averageDeathDistance":
                collection[e].innerHTML = pve.averageDeathDistance.basic.displayValue;
                break;
            case "totalKillDistance":
                collection[e].innerHTML = pve.totalKillDistance.basic.displayValue;
                break;
            case "kills":
                collection[e].innerHTML = pve.kills.basic.displayValue;
                break;
            case "averageKillDistance":
                collection[e].innerHTML = pve.averageKillDistance.basic.displayValue;
                break;
            case "secondsPlayed":
                collection[e].innerHTML = pve.secondsPlayed.basic.displayValue;
                break;
            case "deaths":
                collection[e].innerHTML = pve.deaths.basic.displayValue;
                break;
            case "averageLifespan":
                collection[e].innerHTML = pve.averageLifespan.basic.displayValue;
                break;
            case "bestSingleGameKills":
                collection[e].innerHTML = pve.bestSingleGameKills.basic.displayValue;
                break;
            case "bestSingleGameScore":
                collection[e].innerHTML = pve.bestSingleGameScore.basic.displayValue;
                break;
            case "opponentsDefeated":
                collection[e].innerHTML = pve.opponentsDefeated.basic.displayValue;
                break;
            case "efficiency":
                collection[e].innerHTML = pve.efficiency.basic.displayValue;
                break;
            case "killsDeathsRatio":
                collection[e].innerHTML = pve.killsDeathsRatio.basic.displayValue;
                break;
            case "killsDeathsAssists":
                collection[e].innerHTML = pve.killsDeathsAssists.basic.displayValue;
                break;
            case "objectivesCompleted":
                collection[e].innerHTML = pve.objectivesCompleted.basic.displayValue;
                break;
            case "precisionKills":
                collection[e].innerHTML = pve.precisionKills.basic.displayValue;
                break;
            case "resurrectionsPerformed":
                collection[e].innerHTML = pve.resurrectionsPerformed.basic.displayValue;
                break;
            case "resurrectionsReceived":
                collection[e].innerHTML = pve.resurrectionsReceived.basic.displayValue;
                break;
            case "score":
                collection[e].innerHTML = pve.score.basic.displayValue;
                break;
            case "heroicPublicEventsCompleted":
                collection[e].innerHTML = pve.heroicPublicEventsCompleted.basic.displayValue;
                break;
            case "adventuresCompleted":
                collection[e].innerHTML = pve.adventuresCompleted.basic.displayValue;
                break;
            case "suicides":
                collection[e].innerHTML = pve.suicides.basic.displayValue;
                break;
            case "weaponKillsAutoRifle":
                collection[e].innerHTML = pve.weaponKillsAutoRifle.basic.displayValue;
                break;
            case "weaponKillsBeamRifle":
                collection[e].innerHTML = pve.weaponKillsBeamRifle.basic.displayValue;
                break;
            case "weaponKillsBow":
                collection[e].innerHTML = pve.weaponKillsBow.basic.displayValue;
                break;
            case "weaponKillsGlaive":
                collection[e].innerHTML = pve.weaponKillsGlaive.basic.displayValue;
                break;
            case "weaponKillsFusionRifle":
                collection[e].innerHTML = pve.weaponKillsFusionRifle.basic.displayValue;
                break;
            case "weaponKillsHandCannon":
                collection[e].innerHTML = pve.weaponKillsHandCannon.basic.displayValue;
                break;
            case "weaponKillsTraceRifle":
                collection[e].innerHTML = pve.weaponKillsTraceRifle.basic.displayValue;
                break;
            case "weaponKillsMachineGun":
                collection[e].innerHTML = pve.weaponKillsMachineGun.basic.displayValue;
                break;
            case "weaponKillsPulseRifle":
                collection[e].innerHTML = pve.weaponKillsPulseRifle.basic.displayValue;
                break;
            case "weaponKillsRocketLauncher":
                collection[e].innerHTML = pve.weaponKillsRocketLauncher.basic.displayValue;
                break;
            case "weaponKillsScoutRifle":
                collection[e].innerHTML = pve.weaponKillsScoutRifle.basic.displayValue;
                break;
            case "weaponKillsShotgun":
                collection[e].innerHTML = pve.weaponKillsShotgun.basic.displayValue;
                break;
            case "weaponKillsSniper":
                collection[e].innerHTML = pve.weaponKillsSniper.basic.displayValue;
                break;
            case "weaponKillsSubmachinegun":
                collection[e].innerHTML = pve.weaponKillsSubmachinegun.basic.displayValue;
                break;
            case "weaponKillsRelic":
                collection[e].innerHTML = pve.weaponKillsRelic.basic.displayValue;
                break;
            case "weaponKillsSideArm":
                collection[e].innerHTML = pve.weaponKillsSideArm.basic.displayValue;
                break;
            case "weaponKillsSword":
                collection[e].innerHTML = pve.weaponKillsSword.basic.displayValue;
                break;
            case "weaponKillsAbility":
                collection[e].innerHTML = pve.weaponKillsAbility.basic.displayValue;
                break;
            case "weaponKillsGrenade":
                collection[e].innerHTML = pve.weaponKillsGrenade.basic.displayValue;
                break;
            case "weaponKillsGrenadeLauncher":
                collection[e].innerHTML = pve.weaponKillsGrenadeLauncher.basic.displayValue;
                break;
            case "weaponKillsSuper":
                collection[e].innerHTML = pve.weaponKillsSuper.basic.displayValue;
                break;
            case "weaponKillsMelee":
                collection[e].innerHTML = pve.weaponKillsMelee.basic.displayValue;
                break;
            case "weaponBestType":
                collection[e].innerHTML = pve.weaponBestType.basic.displayValue;
                break;
            case "allParticipantsCount":
                collection[e].innerHTML = pve.allParticipantsCount.basic.displayValue;
                break;
            case "allParticipantsScore":
                collection[e].innerHTML = pve.allParticipantsScore.basic.displayValue;
                break;
            case "allParticipantsTimePlayed":
                collection[e].innerHTML = pve.allParticipantsTimePlayed.basic.displayValue;
                break;
            case "longestKillSpree":
                collection[e].innerHTML = pve.longestKillSpree.basic.displayValue;
                break;
            case "longestSingleLife":
                collection[e].innerHTML = pve.longestSingleLife.basic.displayValue;
                break;
            case "mostPrecisionKills":
                collection[e].innerHTML = pve.mostPrecisionKills.basic.displayValue;
                break;
            case "orbsDropped":
                collection[e].innerHTML = pve.orbsDropped.basic.displayValue;
                break;
            case "orbsGathered":
                collection[e].innerHTML = pve.orbsGathered.basic.displayValue;
                break;
            case "publicEventsCompleted":
                collection[e].innerHTML = pve.publicEventsCompleted.basic.displayValue;
                break;
            case "remainingTimeAfterQuitSeconds":
                collection[e].innerHTML = pve.remainingTimeAfterQuitSeconds.basic.displayValue;
                break;
            case "teamScore":
                collection[e].innerHTML = pve.teamScore.basic.displayValue;
                break;
            case "totalActivityDurationSeconds":
                collection[e].innerHTML = pve.totalActivityDurationSeconds.basic.displayValue;
                break;
            case "fastestCompletionMs":
                collection[e].innerHTML = pve.fastestCompletionMs.basic.displayValue;
                break;
            case "longestKillDistance":
                collection[e].innerHTML = pve.longestKillDistance.basic.displayValue;
                break;
            case "highestCharacterLevel":
                collection[e].innerHTML = pve.highestCharacterLevel.basic.displayValue;
                break;
            case "highestLightLevel":
                collection[e].innerHTML = pve.highestLightLevel.basic.displayValue;
                break;
            case "fireTeamActivities":
                collection[e].innerHTML = pve.fireTeamActivities.basic.displayValue;
                break;
        }
    }
    //console.log(data);
}

//Need to Alter this!!
async function getCharacterStats(data) {
    const statsObject = data.Response.character.data.stats;
    let powerStatText = document.getElementById("powerStat");
    let mobilityStatText = document.getElementById("mobilityStat");
    let resilienceStatText = document.getElementById("resilienceStat");
    let recoveryStatText = document.getElementById("recoveryStatText");
    let disciplineStatText = document.getElementById("disciplineStat");
    let intellectStatText = document.getElementById("intellectStat");
    let strengthStatText = document.getElementById("strengthStat");

    powerStatText.innerHTML = "Power: "+statsObject["1935470627"];
    mobilityStatText.innerHTML = "Mobility: "+statsObject["2996146975"];
    resilienceStatText.innerHTML = "Resilience: "+statsObject["392767087"];
    recoveryStatText.innerHTML = "Recovery: "+statsObject["1943323491"];
    disciplineStatText.innerHTML = "Discipline: "+statsObject["1735777505"];
    intellectStatText.innerHTML = "Intellect: "+statsObject["144602215"];
    strengthStatText.innerHTML = "Strength: "+statsObject["4244567218"];
    /*
    let statsText = document.getElementById("characterStatsText");
    statsText.innerHTML = " Power: "+statsObject["1935470627"];
    statsText.innerHTML += "\n Mobility: " +statsObject["2996146975"];
    statsText.innerHTML += "\n Resilience: "+statsObject["392767087"];
    statsText.innerHTML += "\n Recovery: "+statsObject["1943323491"];
    statsText.innerHTML += "\n Discipline: "+statsObject["1735777505"];
    statsText.innerHTML += "\n Intellect: "+statsObject["144602215"];
    statsText.innerHTML += "\n Strength: "+statsObject["4244567218"];*/
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
