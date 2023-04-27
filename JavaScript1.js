//Constants that hold web addresses used for making requests, so they should be altered
const apiKey = "40777cc6ab0b41839a4b27319ec5945b";
const baseUrl = "https://www.bungie.net/Platform/Destiny2/";
const tokenUrl = "https://www.bungie.net/platform/app/oauth/token/";
const baseImagePath = "https://www.bungie.net";
const my_client_id = 42278;
const my_client_secret = "rYv5SySC4xeuLILKv1NtW1ftb0YdF5CI29vW36w2QV8";

//Variables that will hold relavant information about a player's account etc
var currentPlayerMembershipId = null;
var currentPlayerMembershipType = null;
var numberOfIdsFound = null;
var characterIds = [];
var characterData = [];
let currentCharacterInventory = null;

//Variables that will hold large datasets such as the inventory manifest
var manifestJsonData = null;
var itemDefinitionData = null;
var statsDefinitionData = null;

//Variables that will hold the two types of stat data needed for both the modes (PvE & PvP)
let pveGeneralStatData = null;
let pvpGeneralStatData = null;
let pveWeaponStatData = null;
let pvpWeaponStatData = null;

async function searchForUser() {
    /*
        If none of the manifests are stored, fetch then store them
        Once they are stored, get any element with the id "inputBox"
        Construct the search URL and its needed parameters as its a POST request
        Pass both of these into the Fetch API in order to get data from the Bungie API whilst passing in the identifier key
        Once a response comes back, execute the sub function to create the results
        Reset the value of the textbox
    */
    if (manifestJsonData == null && itemDefinitionData == null && statsDefinitionData == null) {
        await getManifest();
        await getItemDefinitionLibrary();
        await getStatDefinitionLibrary();
    }

    let inputBox = document.getElementById("inputBox");
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

function loginToAccount() {
    /*
        Create the redirect URL with the stored clientId we get from Bungie
        Replace the current Window's location
        Flow:
        LocalHost -> Bungie -> LocalHost
    */
    //&state=6i0mkLx79Hp91nzWVeHrzHG4
    let loginUrl = "https://www.bungie.net/en/oauth/authorize?client_id=" + my_client_id + "&response_type=code";
    window.location.replace(loginUrl);
}

async function getAccessToken(){
    /*
        If the 'search' portion of the address bar holds the special code made by Bungie to show that the user authenticated themselves
        Copy the code to a new variable and then remove the '?code=' part as the API wont accept it
        After that create a set of POST parameters using the code we just copied, a string for the grant type,
            and both our ids given by Bungie
        Then fetch the access token's data using the Fetch API and passing in the parameters as we are using a POST request
        When a response is received,
            we store the access token and the refresh token into the browser's localstorage so we can use it later on  
    */
    if (window.location.search.includes("?code=")){
        let searchCode = window.location.search;
        searchCode = searchCode.replace("?code=","");
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
        const tokenFetchResponseData = await tokenFetch.json();
        let expireTime = tokenFetchResponseData.expires_in;
        //Make expiry timer
        /*
        const now = new Date();
        const time = now.getTime();
        console.log(time);
        let newTime = time + expireTime;
        timeLeft = newTime - time;
        timeLeft = timeLeft / 1000;
        timeLeft = timeLeft / 60;
        console.log(timeLeft);
        */
       localStorage.setItem("accessToken", tokenFetchResponseData.access_token);
       localStorage.setItem("refreshToken", tokenFetchResponseData.refresh_token);
    }
    else{
        console.log("kenobi");
    }
}

async function getCharacterIds() {
    /*
        Here we want to get the ids of each character stored in a profile
        First construct the profile request URL, then send off a GET request as we only need to pass in our identifier key
        Once a response has been received we need to store the object's keys and values which are:
          Keys: Number of characters (1-3)
          Values: Unique Ids of these characters
    */
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
    clearInventories();
    getCharacterInfo();
}

async function getCharacterInfo() {
    /*
        For each Character in the profile we want to:
        - Fetch data relating to that character, i.e. race and class
        - Use that data to update the containers that hod character information
    */
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
    /*
        Firstly, collect any elements with the same class name "profileStat"
        Create the URLs to retrieve the Generalised profile data and Weapon data.
        Send off both of these requests, when we get their data back convert it to JSON format
        Separate the stats into the different modes, PvE and PvP

        Afterwards, cycle through the collected elements
        Switch what value they will hold depending upon their id
        e.g. an element with the id "highestCharacterLevelStat" will hold the value for the highest character level
        Finally draw up any comparision graphs
    */
    let statCollection = document.getElementsByClassName("profileStat");
    let generalSearchGroup = 1;
    let weaponSearchGroup = 2;
    let activitySearchGroup = 102;
    let profileStatsUrl = baseUrl + currentPlayerMembershipType + "/Account/"+currentPlayerMembershipId + "/Stats/?groups="+generalSearchGroup;
    let profileWeaponStatsUrl = baseUrl + currentPlayerMembershipType + "/Account/"+currentPlayerMembershipId + "/Stats/?groups="+weaponSearchGroup;
    const generalSearchResponse = await fetch(profileStatsUrl, { method: 'GET', headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'X-API-Key': apiKey
    } });
    const weaponSearchResponse = await fetch(profileWeaponStatsUrl, { method: 'GET', headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'X-API-Key': apiKey
    } });
    const generalStatData = await generalSearchResponse.json();
    const weaponStatData = await weaponSearchResponse.json();
    pveGeneralStatData = generalStatData.Response.mergedAllCharacters.results.allPvE.allTime;
    pvpGeneralStatData = generalStatData.Response.mergedAllCharacters.results.allPvP.allTime;
    pveWeaponStatData = weaponStatData.Response.mergedAllCharacters.results.allPvE.allTime;
    pvpWeaponStatData = generalStatData.Response.mergedAllCharacters.results.allPvP.allTime;
    for(let index = 0; index < statCollection.length;index++){
        switch(statCollection[index].id){
            case "highestCharacterLevelStat":
                statCollection[index].innerHTML = pveGeneralStatData.highestCharacterLevel.basic.displayValue;
                break;
            case "highestPowerLevelStat":
                statCollection[index].innerHTML = pveGeneralStatData.highestLightLevel.basic.displayValue;
                break;
            case "bestScoreStat":
                statCollection[index].innerHTML = pveGeneralStatData.score.basic.displayValue;
                break;
            case "longestSingleLifeStat":
                statCollection[index].innerHTML = pveGeneralStatData.longestSingleLife.basic.displayValue;
                break;
            case "bestSingleGameKillsStat":
                statCollection[index].innerHTML = pveGeneralStatData.bestSingleGameKills.basic.displayValue;
                break;
            case "mostPrecisionKillsStat":
                statCollection[index].innerHTML = pveGeneralStatData.mostPrecisionKills.basic.displayValue;
                break;
            case "bestKillStreakStat":
                statCollection[index].innerHTML = pveGeneralStatData.longestKillSpree.basic.displayValue;
                break;
            case "longestKillDistanceStat":
                statCollection[index].innerHTML = pveGeneralStatData.longestKillDistance.basic.displayValue + "m";
                break;
            case "bestWeaponStat":
                statCollection[index].innerHTML = pveGeneralStatData.weaponBestType.basic.displayValue;
                break;
            case "activitiesEnteredStat":
                statCollection[index].innerHTML = pveGeneralStatData.activitiesEntered.basic.displayValue;
                break;
            case "activitiesClearedStat":
                statCollection[index].innerHTML = pveGeneralStatData.activitiesCleared.basic.displayValue;
                break;
            case "timePlayedStat":
                statCollection[index].innerHTML = pveGeneralStatData.secondsPlayed.basic.displayValue;
                break;
            case "objectivesCompletedStat":
                statCollection[index].innerHTML = pveGeneralStatData.objectivesCompleted.basic.displayValue;
                break;
            case "publicEventCompletedStat":
                statCollection[index].innerHTML = pveGeneralStatData.publicEventsCompleted.basic.displayValue;   //Needs Changing
                break;
            case "publicEventsCompletedStat":
                statCollection[index].innerHTML = pveGeneralStatData.publicEventsCompleted.basic.displayValue;
                break;
            case "adventuresCompletedStat":
                statCollection[index].innerHTML = pveGeneralStatData.adventuresCompleted.basic.displayValue;
                break;
            case "winsStat":
                statCollection[index].innerHTML = pvpGeneralStatData.winLossRatio.basic.displayValue;
                break;
            case "winLossRatioStat":
                statCollection[index].innerHTML = pvpGeneralStatData.winLossRatio.basic.displayValue;
                break;
            case "combatRatingStat":
                statCollection[index].innerHTML = pvpGeneralStatData.combatRating.basic.displayValue;
                break;
            case "killDeathRatioStat":
                statCollection[index].innerHTML = pveGeneralStatData.killsDeathsRatio.basic.displayValue;
                break;
            case "killDeathAverageStat":
                statCollection[index].innerHTML = pvpGeneralStatData.killsDeathsRatio.basic.displayValue;
                break;
            case "averageKillDistanceStat":
                statCollection[index].innerHTML = pveGeneralStatData.averageKillDistance.basic.displayValue;
                break;
            case "suicidesStat":
                statCollection[index].innerHTML = pveGeneralStatData.suicides.basic.displayValue;
                break;
            case "averageScorePerKillStat":
                statCollection[index].innerHTML = pvpGeneralStatData.averageScorePerKill.basic.displayValue;
                break;
            case "averageScorePerLifeStat":
                statCollection[index].innerHTML = pvpGeneralStatData.averageScorePerLife.basic.displayValue;
                break;
        }
    }
    //Add any extra stuff here 
    DrawGraphs();
}

function pvpStatSwitch(){
    /*
     * Depending upon the state of the toggle, different stats are shown
        ON - shows PvP stats
        OFF - show PvE stats
     */

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
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveGeneralStatData.score.basic.displayValue;
                    break;
                case "longestSingleLifeStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveGeneralStatData.longestSingleLife.basic.displayValue;
                    break;
                case "bestSingleGameKillsStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveGeneralStatData.bestSingleGameKills.basic.displayValue;
                    break;
                case "mostPrecisionKillsStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveGeneralStatData.mostPrecisionKills.basic.displayValue;
                    break;
                case "bestKillStreakStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveGeneralStatData.longestKillSpree.basic.displayValue;
                    break;
                case "longestKillDistanceStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveGeneralStatData.longestKillDistance.basic.displayValue + "m";
                    break;
                case "bestWeaponStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveGeneralStatData.weaponBestType.basic.displayValue;
                    break;
                case "activitiesEnteredStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveGeneralStatData.activitiesEntered.basic.displayValue;
                    break;
                case "activitiesClearedStat":
                    let activitiesClearedTitle = document.getElementById("activititesClearedandWon");
                    activitiesClearedTitle.innerHTML = "Activities Cleared";
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveGeneralStatData.activitiesCleared.basic.displayValue;
                    break;
                case "objectivesCompletedStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveGeneralStatData.objectivesCompleted.basic.displayValue;
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
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpGeneralStatData.winLossRatio.basic.displayValue;
                    break;
                case "winLossRatioStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpGeneralStatData.winLossRatio.basic.displayValue;
                    break;
                case "combatRatingStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpGeneralStatData.combatRating.basic.displayValue;
                    break;
                case "killDeathRatioStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveGeneralStatData.killsDeathsRatio.basic.displayValue;
                    break;
                case "killDeathAverageStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveGeneralStatData.killsDeathsRatio.basic.displayValue;
                    break;
                case "averageKillDistanceStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pveGeneralStatData.averageKillDistance.basic.displayValue;
                    break;
                case "averageScorePerKillStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpGeneralStatData.averageScorePerKill.basic.displayValue;
                    break;
                case "averageScorePerLifeStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpGeneralStatData.averageScorePerLife.basic.displayValue;
                    break;
            }
        }
    }

    function swapToPvPStats() {
        for (let indexForSwitch = 0; indexForSwitch < statCollectionForSwitch.length; indexForSwitch++) {
            switch (statCollectionForSwitch[indexForSwitch].id) {
                case "bestScoreStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpGeneralStatData.score.basic.displayValue;
                    break;
                case "longestSingleLifeStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpGeneralStatData.longestSingleLife.basic.displayValue;
                    break;
                case "bestSingleGameKillsStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpGeneralStatData.bestSingleGameKills.basic.displayValue;
                    break;
                case "mostPrecisionKillsStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpGeneralStatData.mostPrecisionKills.basic.displayValue;
                    break;
                case "bestKillStreakStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpGeneralStatData.longestKillSpree.basic.displayValue;
                    break;
                case "longestKillDistanceStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpGeneralStatData.longestKillDistance.basic.displayValue + "m";
                    break;
                case "bestWeaponStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpGeneralStatData.weaponBestType.basic.displayValue;
                    break;
                case "activitiesEnteredStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpGeneralStatData.activitiesEntered.basic.displayValue;
                    break;
                case "activitiesClearedStat":
                    let activitiesClearedTitle = document.getElementById("activititesClearedandWon");
                    activitiesClearedTitle.innerHTML = "Activities Won";
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpGeneralStatData.activitiesWon.basic.displayValue;
                    break;
                case "objectivesCompletedStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpGeneralStatData.objectivesCompleted.basic.displayValue;
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
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpGeneralStatData.winLossRatio.basic.displayValue;
                    break;
                case "winLossRatioStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpGeneralStatData.winLossRatio.basic.displayValue;
                    break;
                case "combatRatingStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpGeneralStatData.combatRating.basic.displayValue;
                    break;
                case "killDeathRatioStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpGeneralStatData.killsDeathsRatio.basic.displayValue;
                    break;
                case "killDeathAverageStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpGeneralStatData.killsDeathsRatio.basic.displayValue;
                    break;
                case "averageKillDistanceStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpGeneralStatData.averageKillDistance.basic.displayValue;
                    break;
                case "averageScorePerKillStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpGeneralStatData.averageScorePerKill.basic.displayValue;
                    break;
                case "averageScorePerLifeStat":
                    statCollectionForSwitch[indexForSwitch].innerHTML = pvpGeneralStatData.averageScorePerLife.basic.displayValue;
                    break;
            }
        }
    }
}

async function getCharacterStats(data) {
    /*
     * Using data we got about each character in getCharacterInfo()
        we can use this data in tandum with the stat manifest to get the values for each stat and these are unique to each character. 
     */
    const statsObject = data.Response.character.data.stats;
    let powerStatText = document.getElementById("powerStat");
    let mobilityStatText = document.getElementById("mobilityStat");
    let resilienceStatText = document.getElementById("resilienceStat");
    let recoveryStatText = document.getElementById("recoveryStat");
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
}

async function getCharacterEquipment(idIndex) {
    /*
        We want to use the idIndex value we stored from updateCharacterTile() and store a characterId from the list
        Then create a URL to request the equipment of the character, this is public data so no authentication is needed
        Once the data has been received we store it into a variable called "equipmentItems" and pass it onto the sub function
            updateItems()
        After the items are updated then we proceed to fetch the inventory.
    */
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
    /*
     * If the access token is not stored then alter the user they need to sign in to authenticate themselves
     * Otherwise we want to store a copy of the access token from the local storage
     * Construct the URL to retrieve the inventory data and then use the fetch API to retrieve it
     * We store the retrieved data in a variable called currentCharacterInventory 
     * Then we pass each item in the inventory through the item manifest to retrieve their icon
     * After determining what the group the item belongs to (kinetic weapon, helmet armour etc)
     * We add the item to the respective group's inventory div (Kinetic weapon added to Kinetic weapon inventory)
     * Before adding to the inventory we add functionality to the icon,
     *  so that when it is clicked it triggers the equipTheItem() function
     */
    let theAccessToken = null;
    let currentItems = [];
    let kineticWeaponInventoryDiv = document.getElementById("kineticWeaponInventory");
    let energyWeaponInventoryDiv = document.getElementById("energyWeaponInventory");
    let powerWeaponInventoryDiv = document.getElementById("powerWeaponInventory");
    let helmetArmourInventoryDiv = document.getElementById("helmetArmourInventory");
    let gaunletsArmourInventoryDiv = document.getElementById("gaunletsArmourInventory");
    let chestArmourInventoryDiv = document.getElementById("chestArmourInventory");
    let legArmourInventoryDiv = document.getElementById("legArmourInventory");
    let classArmourInventoryDiv = document.getElementById("classArmourInventory");

    if (localStorage.getItem("accessToken") == null){
        alert("Please Sign in to Bungie!");
    }
    else{
        theAccessToken = localStorage.getItem("accessToken");
        ///Platform/Destiny2/3/Profile/4611686018523938391/Character/2305843010090644510/?components=201
        let currentCharacterId = characterIds[idIndex];
        let characterInventoryRequestUrl = baseUrl + currentPlayerMembershipType + "/Profile/" + currentPlayerMembershipId + "/Character/" + currentCharacterId + "/?components=201";
        const inventoryResponse = await fetch(characterInventoryRequestUrl, {
            method: 'GET', headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                'X-API-Key': apiKey,
                'Authorization': "Bearer " + theAccessToken
            }
        });
        const inventoryJsonData = await inventoryResponse.json();
        currentCharacterInventory = inventoryJsonData.Response.inventory.data.items;
        for(let inventoryIndex = 0; inventoryIndex < currentCharacterInventory.length; inventoryIndex++){
            currentItems.push(itemDefinitionData[currentCharacterInventory[inventoryIndex].itemHash]);
        }
        for(let itemIndex = 0; itemIndex < currentItems.length;itemIndex++){
            let newIcon = document.createElement('img');
            newIcon.style.marginLeft = "1%";
            newIcon.onclick = function(){ equipTheItem(currentCharacterInventory[itemIndex].itemInstanceId, currentCharacterId, currentItems[itemIndex]); };
            switch(currentItems[itemIndex].inventory.bucketTypeHash){
                case 1498876634:
                    newIcon.src = baseImagePath + currentItems[itemIndex].displayProperties.icon;
                    kineticWeaponInventoryDiv.appendChild(newIcon);
                    break;
                case 2465295065:
                    newIcon.src = baseImagePath + currentItems[itemIndex].displayProperties.icon;
                    energyWeaponInventoryDiv.appendChild(newIcon);
                    break;
                case 953998645:
                    newIcon.src = baseImagePath + currentItems[itemIndex].displayProperties.icon;
                    powerWeaponInventoryDiv.appendChild(newIcon);
                    break;
                case 3448274439:
                    newIcon.src = baseImagePath + currentItems[itemIndex].displayProperties.icon;
                    helmetArmourInventoryDiv.appendChild(newIcon);
                    break;
                case 3551918588:
                    newIcon.src = baseImagePath + currentItems[itemIndex].displayProperties.icon;
                    gaunletsArmourInventoryDiv.appendChild(newIcon);
                    break;
                case 14239492:
                    newIcon.src = baseImagePath + currentItems[itemIndex].displayProperties.icon;
                    chestArmourInventoryDiv.appendChild(newIcon);
                    break;
                case 20886954:
                    newIcon.src = baseImagePath + currentItems[itemIndex].displayProperties.icon;
                    legArmourInventoryDiv.appendChild(newIcon);
                    break;
                case 1585787867:
                    newIcon.src = baseImagePath + currentItems[itemIndex].displayProperties.icon;
                    classArmourInventoryDiv.appendChild(newIcon);
                    break;
            }
        }
    }

    async function equipTheItem(itemToEquip, currentCharacterId, itemInfo){
        let equipUrl = baseUrl + "Actions/Items/EquipItem/";
        //Add confirmation here

        let equipParams = {
            'characterId': currentCharacterId,
            'membershipType': currentPlayerMembershipType,
            'itemId': itemToEquip
        };
        const equipItemResponse = await fetch(equipUrl, {
            method: 'POST', headers: {
                'X-API-Key': apiKey,
                'Authorization': "Bearer " + theAccessToken
            }, body: JSON.stringify(equipParams),
        });
        const equipItemData = await equipItemResponse.json();
        console.log(equipItemData);
        alert("Item: "+itemInfo.displayProperties.name + " has been equipped!");
    }
}

    //  ****Social function are not implemented****
async function getFriendList(){
    alert("Getting friend list has not been implemented yet");
}
async function getFriendRequestList(){
    alert("Getting friend request list has not been implemented yet");
}
async function sendFriendRequest(){
    alert("Sending friend requests has not been implemented yet");
}
async function acceptFriendRequest(){
    alert("Accepting friend requests has not been implemented yet");
}
async function declineFriendRequest(){
    alert("Declining friend requests has not been implemented yet");
}
async function removeFriend(){
    alert("Removing friend has not been implemented yet");
}
async function removeFriendRequest(){
    alert("Removing friend requests has not been implemented yet");
}

// SUB FUNCTIONS

function lightDarkSwitch(){
    /*
        Changes the colour of the body and text to create light / dark themes
    */
    var theBody = document.getElementsByTagName("body")[0];
    var lightDarkSwitch = document.getElementById("lightDarkSwitch");
    var textElements = document.getElementsByClassName("TEXT")
    if (lightDarkSwitch.checked){
        theBody.style.backgroundColor = "#505050";
        for(let elementIndex = 0; elementIndex < textElements.length; elementIndex++)
        {
            textElements[elementIndex].style.color = "white";
        }
    }
    else{
        theBody.style.backgroundColor = "#FFFFFF";
        for(let darkElementIndex = 0; darkElementIndex < textElements.length; darkElementIndex++)
        {
            textElements[darkElementIndex].style.color = "black";
        }
    }
}

async function createSearchResults(searchData, numOfResults) {
    /*
        Firstly, gather any elements from the HTML document
        Make sure that they are visible to the user
        For each result we got from the search data,
            If the list of player buttons in the box is empty then create one
            Otherwise if there are buttons inside the box
                Check to see if the current player exists inside it, if they do then skip them and move on
                If they dont exist then add them to the list.
    */
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
        /*
            Create a button element and assign it an id
            Set it's text to the display name of the player
            Add it to the search results box and then set its onclick functionality to:
                - Store the player's unique membershipId
                - Store the player's membershipType number (platform they use to sign in)
                - Get their profile Stats and characterIds
        */
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
    /*
        Returns the current version of the manifest as a json object.
    */
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
    /*
        Using the data we gathered from the manifest,
            we can use this libray to convert item hashes into data that we can use.
            As these hashes are just keys for the library
    */
    let itemDefinitionUrl = "https://www.bungie.net";
    itemDefinitionUrl += manifestJsonData.Response.jsonWorldComponentContentPaths.en.DestinyInventoryItemDefinition;
    const itemDefinitionResponse = await fetch(itemDefinitionUrl, { method: 'GET' });
    itemDefinitionData = await itemDefinitionResponse.json();
}

async function getStatDefinitionLibrary() {
    /*
        Uses the Manifest to get the libray that hold stat definitions
        Acts similiar to the itemDefinition retrieval
    */
    let statDefinitionUrl = "https://www.bungie.net";
    statDefinitionUrl += manifestJsonData.Response.jsonWorldComponentContentPaths.en.DestinyStatDefinition;
    const statDefinitionResponse = await fetch(statDefinitionUrl, { method: 'GET' });
    statDefinitionData = await statDefinitionResponse.json();
}

function DrawGraphs(){
    /*
        Here we use Chart.js to help create the graphs to visualise data that can be compared
        For PvE and PvP data, the X values on the graphs will be identifiable by the respective names (PvE and PvP)
        Whereas for weapon data, this is split between each weapon type (Auto Rifle, Rocket Launcher and Sword etc)
        However, the Y values will be numerical
        For colours, red is used for the bar charts as its one unique dataset we are looking at
            but we are comparing the size between them 
        For doughnut charts there are more colours to match the variety of weapons to help define the weapons

    */
    var playerVersusXValues = ["PvE", "PvP"];
    var weaponXValues = ["AutoRifle Kills","BeamRifle Kills","Bow Kills","Glaive Kills","FusionRifle Kills","HandCannon Kills",
    "TraceRifle Kills","MachineGun Kills","PulseRifle Kills","RocketLauncher Kills","ScoutRifle Kills","Shotgun Kills",
    "Sniper Kills","Submachinegun Kills","Relic Kills","SideArm Kills","Sword Kills","Ability Kills",
    "Grenade Kills","GrenadeLauncher Kills","Super Kills","Melee Kills"];

    var killYValues = [pveGeneralStatData.kills.basic.displayValue, pvpGeneralStatData.kills.basic.displayValue];
    var deathYValues = [pveGeneralStatData.deaths.basic.displayValue, pvpGeneralStatData.deaths.basic.displayValue];
    var scoreYValues = [pveGeneralStatData.score.basic.displayValue, pvpGeneralStatData.score.basic.displayValue];
    var secondsPlayedYValues = [pveGeneralStatData.secondsPlayed.basic.value, pvpGeneralStatData.secondsPlayed.basic.value];
    var longestLifeYValues = [pveGeneralStatData.longestSingleLife.basic.value, pvpGeneralStatData.longestSingleLife.basic.value];
    var averageLifeYValues = [pveGeneralStatData.averageLifespan.basic.value, pvpGeneralStatData.averageLifespan.basic.value];
    var teamScoreYValues = [pveGeneralStatData.teamScore.basic.displayValue, pvpGeneralStatData.teamScore.basic.displayValue];
    var assistsYValues = [pveGeneralStatData.assists.basic.displayValue, pvpGeneralStatData.assists.basic.displayValue];
    var precisionKillsYValues = [pveGeneralStatData.precisionKills.basic.displayValue, pvpGeneralStatData.precisionKills.basic.displayValue];
    var averageKillDistanceYValues = [pveGeneralStatData.averageKillDistance.basic.displayValue, pvpGeneralStatData.averageKillDistance.basic.displayValue];
    var opponentsDefeatedYValues = [pveGeneralStatData.opponentsDefeated.basic.displayValue, pvpGeneralStatData.opponentsDefeated.basic.displayValue];
    var suicidesYValues = [pveGeneralStatData.suicides.basic.displayValue, pvpGeneralStatData.suicides.basic.displayValue];
    var efficiencyYValues = [pveGeneralStatData.efficiency.basic.displayValue, pvpGeneralStatData.efficiency.basic.displayValue];
    var resurrectionsPerformedYValues = [pveGeneralStatData.resurrectionsPerformed.basic.displayValue, pvpGeneralStatData.resurrectionsPerformed.basic.displayValue];
    var resurrectionsReceivedYValues = [pveGeneralStatData.resurrectionsReceived.basic.displayValue, pvpGeneralStatData.resurrectionsReceived.basic.displayValue];
    var orbsDroppedYValues = [pveGeneralStatData.orbsDropped.basic.displayValue, pvpGeneralStatData.orbsDropped.basic.displayValue];
    var orbsGatheredYValues = [pveGeneralStatData.orbsGathered.basic.displayValue, pvpGeneralStatData.orbsGathered.basic.displayValue];
    
    var weaponKillYValues = [pveWeaponStatData.weaponKillsAutoRifle.basic.displayValue,pveWeaponStatData.weaponKillsBeamRifle.basic.displayValue,pveWeaponStatData.weaponKillsBow.basic.displayValue,
        pveWeaponStatData.weaponKillsGlaive.basic.displayValue,pveWeaponStatData.weaponKillsFusionRifle.basic.displayValue,pveWeaponStatData.weaponKillsHandCannon.basic.displayValue,
        pveWeaponStatData.weaponKillsTraceRifle.basic.displayValue,pveWeaponStatData.weaponKillsMachineGun.basic.displayValue,pveWeaponStatData.weaponKillsPulseRifle.basic.displayValue,
        pveWeaponStatData.weaponKillsRocketLauncher.basic.displayValue,pveWeaponStatData.weaponKillsScoutRifle.basic.displayValue,pveWeaponStatData.weaponKillsShotgun.basic.displayValue,
        pveWeaponStatData.weaponKillsSniper.basic.displayValue,pveWeaponStatData.weaponKillsSubmachinegun.basic.displayValue,pveWeaponStatData.weaponKillsRelic.basic.displayValue,
        pveWeaponStatData.weaponKillsSideArm.basic.displayValue,pveWeaponStatData.weaponKillsSword.basic.displayValue,pveWeaponStatData.weaponKillsAbility.basic.displayValue,
        pveWeaponStatData.weaponKillsGrenade.basic.displayValue,pveWeaponStatData.weaponKillsGrenadeLauncher.basic.displayValue,pveWeaponStatData.weaponKillsSuper.basic.displayValue,
        pveWeaponStatData.weaponKillsMelee.basic.displayValue];
    var weaponKillPvPYValues = [pvpWeaponStatData.weaponKillsAutoRifle.basic.displayValue,pvpWeaponStatData.weaponKillsBeamRifle.basic.displayValue,pvpWeaponStatData.weaponKillsBow.basic.displayValue,
        pvpWeaponStatData.weaponKillsGlaive.basic.displayValue,pvpWeaponStatData.weaponKillsFusionRifle.basic.displayValue,pvpWeaponStatData.weaponKillsHandCannon.basic.displayValue,
        pvpWeaponStatData.weaponKillsTraceRifle.basic.displayValue,pvpWeaponStatData.weaponKillsMachineGun.basic.displayValue,pvpWeaponStatData.weaponKillsPulseRifle.basic.displayValue,
        pvpWeaponStatData.weaponKillsRocketLauncher.basic.displayValue,pvpWeaponStatData.weaponKillsScoutRifle.basic.displayValue,pvpWeaponStatData.weaponKillsShotgun.basic.displayValue,
        pvpWeaponStatData.weaponKillsSniper.basic.displayValue,pvpWeaponStatData.weaponKillsSubmachinegun.basic.displayValue,pvpWeaponStatData.weaponKillsRelic.basic.displayValue,
        pvpWeaponStatData.weaponKillsSideArm.basic.displayValue,pvpWeaponStatData.weaponKillsSword.basic.displayValue,pvpWeaponStatData.weaponKillsAbility.basic.displayValue,
        pvpWeaponStatData.weaponKillsGrenade.basic.displayValue,pvpWeaponStatData.weaponKillsGrenadeLauncher.basic.displayValue,pvpWeaponStatData.weaponKillsSuper.basic.displayValue,
        pvpWeaponStatData.weaponKillsMelee.basic.displayValue];
    
    
    var barColors = ["red","red","red","red","red"];
    var pieColors = ["#909090","#FE0000","#CDA434","#2F4538","#3E5F8A","#763C28","#4E3B31","#BDECB6","#969992","#39352A","#FF2301","#316650",
    "#354D73","#FE0000","#E6D690","#F44611","#8F8F8F","#2A6478","#193737","#252850","#B32428","#AEA04B","#293133","#999950",
    "#412227","#7E7B52","#924E7D","#D6AE01","#CFD3CD","#1D1E33"];
    
    new Chart("killsChart", {
        type: "bar",
        data: {
            labels: playerVersusXValues,
            datasets: [{
                backgroundColor: barColors,
                data: killYValues
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
    new Chart("deathsChart", {
        type: "bar",
        data: {
            labels: playerVersusXValues,
            datasets: [{
                backgroundColor: barColors,
                data: deathYValues
            }]
        },
        options: {
            legend: {display: false},
            title: {
                display: true,
                text: "Total Deaths"
            }
        }
    });
    new Chart("scoreChart", {
        type: "bar",
        data: {
            labels: playerVersusXValues,
            datasets: [{
                backgroundColor: barColors,
                data: scoreYValues
            }]
        },
        options: {
            legend: {display: false},
            title: {
                display: true,
                text: "Total Score"
            }
        }
    });
    new Chart("timePlayedChart", {
        type: "bar",
        data: {
            labels: playerVersusXValues,
            datasets: [{
                backgroundColor: barColors,
                data: secondsPlayedYValues
            }]
        },
        options: {
            legend: {display: false},
            title: {
                display: true,
                text: "Total Time Played"
            }
        }
    });
    new Chart("longestLifeChart", {
        type: "bar",
        data: {
            labels: playerVersusXValues,
            datasets: [{
                backgroundColor: barColors,
                data: longestLifeYValues
            }]
        },
        options: {
            legend: {display: false},
            title: {
                display: true,
                text: "Longest Life Comparison"
            }
        }
    });
    new Chart("averageLifeChart", {
        type: "bar",
        data: {
            labels: playerVersusXValues,
            datasets: [{
                backgroundColor: barColors,
                data: averageLifeYValues
            }]
        },
        options: {
            legend: {display: false},
            title: {
                display: true,
                text: "Average Lifespan Comparison"
            }
        }
    });
    new Chart("teamScoreChart", {
        type: "bar",
        data: {
            labels: playerVersusXValues,
            datasets: [{
                backgroundColor: barColors,
                data: teamScoreYValues
            }]
        },
        options: {
            legend: {display: false},
            title: {
                display: true,
                text: "Total Team Score"
            }
        }
    });
    new Chart("assistsChart", {
        type: "bar",
        data: {
            labels: playerVersusXValues,
            datasets: [{
                backgroundColor: barColors,
                data: assistsYValues
            }]
        },
        options: {
            legend: {display: false},
            title: {
                display: true,
                text: "Total Assists"
            }
        }
    });
    new Chart("precisionKillsChart", {
        type: "bar",
        data: {
            labels: playerVersusXValues,
            datasets: [{
                backgroundColor: barColors,
                data: precisionKillsYValues
            }]
        },
        options: {
            legend: {display: false},
            title: {
                display: true,
                text: "Total Precision Kills"
            }
        }
    });
    new Chart("averageKillDistanceChart", {
        type: "bar",
        data: {
            labels: playerVersusXValues,
            datasets: [{
                backgroundColor: barColors,
                data: averageKillDistanceYValues
            }]
        },
        options: {
            legend: {display: false},
            title: {
                display: true,
                text: "Total Average Kill Distance"
            }
        }
    });
    new Chart("opponentsDefeatedChart", {
        type: "bar",
        data: {
            labels: playerVersusXValues,
            datasets: [{
                backgroundColor: barColors,
                data: opponentsDefeatedYValues
            }]
        },
        options: {
            legend: {display: false},
            title: {
                display: true,
                text: "Total Opponents Defeated"
            }
        }
    });
    new Chart("suicidesChart", {
        type: "bar",
        data: {
            labels: playerVersusXValues,
            datasets: [{
                backgroundColor: barColors,
                data: suicidesYValues
            }]
        },
        options: {
            legend: {display: false},
            title: {
                display: true,
                text: "Total Suicides"
            }
        }
    });
    new Chart("efficiencyChart", {
        type: "bar",
        data: {
            labels: playerVersusXValues,
            datasets: [{
                backgroundColor: barColors,
                data: efficiencyYValues
            }]
        },
        options: {
            legend: {display: false},
            title: {
                display: true,
                text: "Total Efficiency"
            }
        }
    });
    new Chart("resurrectionsPerformedChart", {
        type: "bar",
        data: {
            labels: playerVersusXValues,
            datasets: [{
                backgroundColor: barColors,
                data: resurrectionsPerformedYValues
            }]
        },
        options: {
            legend: {display: false},
            title: {
                display: true,
                text: "Total Resurrections Performed"
            }
        }
    });
    new Chart("resurrectionsReceivedChart", {
        type: "bar",
        data: {
            labels: playerVersusXValues,
            datasets: [{
                backgroundColor: barColors,
                data: resurrectionsReceivedYValues
            }]
        },
        options: {
            legend: {display: false},
            title: {
                display: true,
                text: "Total Resurrections Received"
            }
        }
    });
    new Chart("orbsDroppedChart", {
        type: "bar",
        data: {
            labels: playerVersusXValues,
            datasets: [{
                backgroundColor: barColors,
                data: orbsDroppedYValues
            }]
        },
        options: {
            legend: {display: false},
            title: {
                display: true,
                text: "Total Orbs Dropped"
            }
        }
    });
    new Chart("orbsGatheredChart", {
        type: "bar",
        data: {
            labels: playerVersusXValues,
            datasets: [{
                backgroundColor: barColors,
                data: orbsGatheredYValues
            }]
        },
        options: {
            legend: {display: false},
            title: {
                display: true,
                text: "Total Orbs Gathered"
            }
        }
    });
    new Chart("weaponKillsChart", {
        type: "doughnut",
        data: {
            labels: weaponXValues,
            datasets: [{
                backgroundColor: pieColors,
                data: weaponKillYValues
            }]
        },
        options: {
            legend: {display: true},
            title: {
                display: true,
                text: "Weapon PvE Kills"
            }
        }
    });
    new Chart("weaponKillsPvPChart", {
        type: "doughnut",
        data: {
            labels: weaponXValues,
            datasets: [{
                backgroundColor: pieColors,
                data: weaponKillPvPYValues
            }]
        },
        options: {
            legend: {display: true},
            title: {
                display: true,
                text: "Weapon PvP Kills"
            }
        }
    });
}

function updateCharacterTile(data, idIndex) {
    /*
        For this function, we are altering the contents of HTML elements to match the values from the latest data
        Depending upon what the value of the index is, tells us which character tile we are editting
        Then we change the background image to match the one in the latest data
        Afterwards, we change the text elements that show a character's race and class to reflect the values of the latest data
        We also do this with the power level and character level text elements
        In addition, adding functionality to the background image whereby it executes the fetches for character stats and equipment
        Finally, it makes sure that the tile is visible to the user.
    */
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

    powerTextToEdit.innerHTML = "Power Level: "+data.Response.character.data.light
    levelTextToEdit.innerHTML = "Level: "+data.Response.character.data.baseCharacterLevel
    containerToEdit.onclick = function(){
        getCharacterStats(data);
        getCharacterEquipment(idIndex);
    }
    containerToEdit.style.visibility = "visible";
}

function updateItems(itemDefinitionData,equipmentItems) {
    /*
        This function, updates information about the current equipment that is shown in their respective containers
        It looks at each item in the equipment list and sorts them into groups depending upon a hash number
        After that, it collects neccessary references to HTML elements, updating their values to match the latest data
        It also applies functionality to the inventory div element and the item's icon
            - when the mouse hovers over the icon, the inventory related to the item is shown e.g. kinetic weapon shows kinetic weapon inventory
            - Hides and non relavant inventories
        Also alters the container's style to retain the gap size between the the weapons and armour containers
    */
    for (let i = 0; i < equipmentItems.length; i++) {
        let currentItem = itemDefinitionData[equipmentItems[i].itemHash];
        switch (equipmentItems[i].bucketHash) {
            case 1498876634: //Kinetic Weapon
                let kineticWeaponIcon = document.getElementById("kineticWeaponImage");
                let kineticWeaponName = document.getElementById("kineticWeaponName");
                let kineticWeaponType = document.getElementById("kineticWeaponType");
                let kineticWeaponNameDesc = document.getElementById("kineticWeaponDesc");
                let currentKineticWeaponInventory = document.getElementById("kineticWeaponInventory");
                kineticWeaponIcon.src = baseImagePath + currentItem.displayProperties.icon;
                kineticWeaponName.innerHTML = currentItem.displayProperties.name;
                kineticWeaponType.innerHTML = currentItem.itemTypeAndTierDisplayName;
                kineticWeaponNameDesc.innerHTML = currentItem.flavorText;
                kineticWeaponIcon.onmouseover = function(){ hoverToShowInventory(currentKineticWeaponInventory) };
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
                let currentEnergyWeaponInventory = document.getElementById("energyWeaponInventory");
                energyWeaponIcon.src = baseImagePath + currentItem.displayProperties.icon;
                energyWeaponName.innerHTML = currentItem.displayProperties.name;
                energyWeaponType.innerHTML = currentItem.itemTypeAndTierDisplayName;
                energyWeaponDesc.innerHTML = currentItem.flavorText;
                energyWeaponIcon.onmouseover = function(){ hoverToShowInventory(currentEnergyWeaponInventory) };
                break;
            case 953998645: //Power Weapon
                let powerWeaponIcon = document.getElementById("powerWeaponImage");
                let powerWeaponName = document.getElementById("powerWeaponName");
                let powerWeaponType = document.getElementById("powerWeaponType");
                let powerWeaponDesc = document.getElementById("powerWeaponDesc");
                let currentPowerWeaponInventory = document.getElementById("powerWeaponInventory");
                powerWeaponIcon.src = baseImagePath + currentItem.displayProperties.icon;
                powerWeaponName.innerHTML = currentItem.displayProperties.name;
                powerWeaponType.innerHTML = currentItem.itemTypeAndTierDisplayName;
                powerWeaponDesc.innerHTML = currentItem.flavorText;
                powerWeaponIcon.onmouseover = function(){ hoverToShowInventory(currentPowerWeaponInventory) };
                break;
            case 3448274439: //Helmet Armour
                let helmetArmourIcon = document.getElementById("helmetArmourImage");
                let helmetArmourName = document.getElementById("helmetArmourName");
                let helmetArmourType = document.getElementById("helmetArmourType");
                let currentHelmetArmourInventory = document.getElementById("helmetArmourInventory");
                helmetArmourIcon.src = baseImagePath + currentItem.displayProperties.icon;
                helmetArmourName.innerHTML = currentItem.displayProperties.name;
                helmetArmourType.innerHTML = currentItem.itemTypeAndTierDisplayName;
                helmetArmourIcon.onmouseover = function(){ hoverToShowInventory(currentHelmetArmourInventory) };
                break;
            case 3551918588: //Gaunlets Armour
                let gaunletsArmourIcon = document.getElementById("gaunletsArmourImage");
                let gaunletsArmourName = document.getElementById("gaunletsArmourName");
                let gaunletsArmourType = document.getElementById("gaunletsArmourType");
                let currentGaunletsArmourInventory = document.getElementById("gaunletsArmourInventory");
                gaunletsArmourIcon.src = baseImagePath + currentItem.displayProperties.icon;
                gaunletsArmourName.innerHTML = currentItem.displayProperties.name;
                gaunletsArmourType.innerHTML = currentItem.itemTypeAndTierDisplayName;
                gaunletsArmourIcon.onmouseover = function(){ hoverToShowInventory(currentGaunletsArmourInventory) };
                break;
            case 14239492: //Chest Armour
                let chestArmourIcon = document.getElementById("chestArmourImage");
                let chestArmourName = document.getElementById("chestArmourName");
                let chestArmourType = document.getElementById("chestArmourType");
                let currentChestArmourInventory = document.getElementById("chestArmourInventory");
                chestArmourIcon.src = baseImagePath + currentItem.displayProperties.icon;
                chestArmourName.innerHTML = currentItem.displayProperties.name;
                chestArmourType.innerHTML = currentItem.itemTypeAndTierDisplayName;
                chestArmourIcon.onmouseover = function(){ hoverToShowInventory(currentChestArmourInventory) };
                break;
            case 20886954: //Leg Armour
                let legArmourIcon = document.getElementById("legArmourImage");
                let legArmourName = document.getElementById("legArmourName");
                let legArmourType = document.getElementById("legArmourType");
                let currentLegArmourInventory = document.getElementById("legArmourInventory");
                legArmourIcon.src = baseImagePath + currentItem.displayProperties.icon;
                legArmourName.innerHTML = currentItem.displayProperties.name;
                legArmourType.innerHTML = currentItem.itemTypeAndTierDisplayName;
                legArmourIcon.onmouseover = function(){ hoverToShowInventory(currentLegArmourInventory) };
                break;
            case 1585787867: //Class Armour
                let classArmourIcon = document.getElementById("classArmourImage");
                let classArmourName = document.getElementById("classArmourName");
                let classArmourType = document.getElementById("classArmourType");
                let currentClassArmourInventory = document.getElementById("classArmourInventory");
                classArmourIcon.src = baseImagePath + currentItem.displayProperties.icon;
                classArmourName.innerHTML = currentItem.displayProperties.name;
                classArmourType.innerHTML = currentItem.itemTypeAndTierDisplayName;
                classArmourIcon.onmouseover = function(){ hoverToShowInventory(currentClassArmourInventory) };
                break;
        }
    }
    let weaponContainer = document.getElementById("weaponsContainer");
    let armourContainer = document.getElementById("armourContainer");
    weaponContainer.style.marginLeft = "10%";
    armourContainer.style.marginLeft = "10%";
}

function hoverToShowInventory(inventory){
    /*
        This function alters the visibility of the inventories depending on which one is being hovered over
         - Collect any elements with the class name 'inventory'
         - Make them all invisible to the user
         - Make the one we are hovering over visible
    */
    allInventories = document.getElementsByClassName("inventory");
    for(let activeInventoryIndex=0; activeInventoryIndex < allInventories.length; activeInventoryIndex++)
    {
        allInventories[activeInventoryIndex].style.visibility = "hidden";
    }
    inventory.style.visibility = "visible";
}
function clearInventories(){
    let allInventories = document.getElementsByClassName("inventory");
    let inventoryInformation = null;
    for(let currentInventoryIndex=0; currentInventoryIndex < allInventories.length; currentInventoryIndex++)
    {
        allInventories[currentInventoryIndex].replaceChildren();
        inventoryInformation = document.createElement('p');
        inventoryInformation.className = "TEXT";
        textNode = document.createTextNode("Click item to equip it");
        inventoryInformation.appendChild(textNode);
        allInventories[currentInventoryIndex].appendChild(inventoryInformation);
    }
}