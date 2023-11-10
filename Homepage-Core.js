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

var manifestJsonData = null;
var itemDefinitionData = null;
var statsDefinitionData = null;

async function searchForUser() {    
    let inputBox = document.getElementById("inputBox");
    let numOfResults = null;
    let searchUrl = "https://www.bungie.net/platform/User/Search/GlobalName/0/";
    let params = {"displayNamePrefix": inputBox.value};
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
    //&state=6i0mkLx79Hp91nzWVeHrzHG4
    let loginUrl = "https://www.bungie.net/en/oauth/authorize?client_id=" + my_client_id + "&response_type=code";
    window.location.replace(loginUrl);
}

async function getAccessToken(){
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
       sessionStorage.setItem("accessToken", tokenFetchResponseData.access_token);
       sessionStorage.setItem("refreshToken", tokenFetchResponseData.refresh_token);
    }
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
    sessionStorage.setItem("characterIds",JSON.stringify(characterIds));
    getCharacterInfo();
}

async function getCharacterInfo() {
    // ?components=200
    
    for (let i = 0; i < characterIds.length; i++) {
        let characterDataRequestUrl = baseUrl + currentPlayerMembershipType + "/Profile/" + currentPlayerMembershipId + "/Character/";
        characterDataRequestUrl += characterIds[i];
        characterDataRequestUrl += "/?components=200";

        const response = await fetch(characterDataRequestUrl, { method: 'GET', headers: {'Content-Type': 'application/json;charset=UTF-8','X-API-Key': apiKey} });
        const data = await response.json();
        let guardianCards = document.getElementsByClassName("guardian");
        let card = guardianCards[i];
        let cardClass = card.children[0];
        let cardRace = card.children[1];
        let cardLevel = card.children[2];
        let cardBackground = card.children[3];
        switch(data.Response.character.data.classType) {
            case 0:
                cardClass.innerHTML = "Titan";
                break;
            case 1:
                cardClass.innerHTML = "Hunter";
                break;
            case 2:
                cardClass.innerHTML = "Warlock";
                break;
        }
        switch(data.Response.character.data.raceType){
            case 0:
                cardRace.innerHTML = "Human";
                break;
            case 1:
                cardRace.innerHTML = "Awoken";
                break;
            case 2:
                cardRace.innerHTML = "Exo";
                break;
        }
        cardLevel.innerHTML = data.Response.character.data.light;
        cardBackground.src = baseImagePath + data.Response.character.data.emblemBackgroundPath;
        card.onclick = function(){
            getCharacterStats(data);
        }
        card.style.visibility = 'visible';
    }
}

async function getProfileStats() {
    let profileStatsUrl = baseUrl + currentPlayerMembershipType + "/Account/"+currentPlayerMembershipId + "/Stats/?groups=1";
    let profileWeaponStatsUrl = baseUrl + currentPlayerMembershipType + "/Account/"+currentPlayerMembershipId + "/Stats/?groups=2";
    
    let playTimeText = document.getElementById("playTimeStat");
    let matchesText = document.getElementById("matchesStat");
    let overviewValueObjects = document.getElementsByClassName("overviewValue");

    const generalSearchResponse = await fetch(profileStatsUrl, { method: 'GET', headers: {'Content-Type': 'application/json;charset=UTF-8','X-API-Key': apiKey} });
    const weaponSearchResponse = await fetch(profileWeaponStatsUrl, { method: 'GET', headers: {'Content-Type': 'application/json;charset=UTF-8','X-API-Key': apiKey} });
    
    const generalStatData = await generalSearchResponse.json();
    const weaponStatData = await weaponSearchResponse.json();
    playTimeText.innerHTML = generalStatData.Response.mergedAllCharacters.merged.allTime.secondsPlayed.basic.displayValue;
    playTimeText.innerHTML += " Playtime";
    matchesText.innerHTML = generalStatData.Response.mergedAllCharacters.merged.allTime.activitiesEntered.basic.displayValue;
    matchesText.innerHTML += " Matches";

    for(let e=0;e<overviewValueObjects.length;e++){
        let element= overviewValueObjects[e]
        switch (element.id){
            case "killsValue":
                element.innerHTML = generalStatData.Response.mergedAllCharacters.merged.allTime.kills.basic.displayValue
                break;
            case "assistsValue":
                element.innerHTML = generalStatData.Response.mergedAllCharacters.merged.allTime.assists.basic.displayValue
                break;
            case "precisionKillsValue":
                element.innerHTML = generalStatData.Response.mergedAllCharacters.merged.allTime.precisionKills.basic.displayValue
                break;
            case "supersValue":
                element.innerHTML = generalStatData.Response.mergedAllCharacters.merged.allTime.weaponKillsSuper.basic.displayValue
                break;
            case "deathsValue":
                element.innerHTML = generalStatData.Response.mergedAllCharacters.merged.allTime.deaths.basic.displayValue
                break;
            case "suicidesValue":
                element.innerHTML = generalStatData.Response.mergedAllCharacters.merged.allTime.suicides.basic.displayValue
                break;
        }
    }

    //Add any extra stuff here 
    //DrawGraphs(generalStatData, weaponStatData);
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
    const statsObject = data.Response.character.data.stats;
    statObjects = document.getElementsByClassName("characterStatObject");
    for(let index=0;index<statObjects.length;index++){
        switch(statObjects[index].children[0].title){
            case "Mobility":
                statObjects[index].children[1].innerHTML = statsObject["2996146975"];
                break;
            case "Resilience":
                statObjects[index].children[1].innerHTML = statsObject["392767087"];
                break;
            case "Recovery":
                statObjects[index].children[1].innerHTML = statsObject["1943323491"];
                break;
            case "Discipline":
                statObjects[index].children[1].innerHTML = statsObject["1735777505"];
                break;
            case "Intellect":
                statObjects[index].children[1].innerHTML = statsObject["144602215"];
                break;
            case "Strength":
                statObjects[index].children[1].innerHTML = statsObject["4244567218"];
                break;
        }
    }
}

//#region Socials
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
//#endregion

function openTheEditor(){
    window.location.replace("Editor.html");
}

//#region Secondary Functions
async function documentLoader(){
    console.clear()
    if (window.location.search === ""){
        localStorage.clear();
    }
    else{
        getAccessToken();
    }
    
    if (manifestJsonData == null && itemDefinitionData == null && statsDefinitionData == null) {
        await getManifest();
        await getItemDefinitionLibrary();
        await getStatDefinitionLibrary();
    }
}

function lightDarkSwitch(){
    var theBody = document.getElementsByTagName("body")[0];
    var theLogo = document.getElementById("d2Logo");
    var lightDarkSwitch = document.getElementById("lightDarkSwitch");
    var textElements = document.getElementsByClassName("TEXT");  
    
    if (lightDarkSwitch.checked){ //Go dark
        theBody.style.backgroundColor = "#505050";
        theLogo.src = "theLogoWhite.png"
        for(let elementIndex = 0; elementIndex < textElements.length; elementIndex++) {
            textElements[elementIndex].style.color = "white";
        }
        
    }
    else{ //Go light
        theBody.style.backgroundColor = "#FFFFFF";
        theLogo.src = "theLogo.png"
        for(let darkElementIndex = 0; darkElementIndex < textElements.length; darkElementIndex++)
        {
            textElements[darkElementIndex].style.color = "black";
        }
    }
}

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
            if (!resultsChildren.some(newPlayerName)) {
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
        newAccountButton.style.marginLeft = "10px";
        newAccountButton.style.marginBottom = "10px";
        newAccountButton.style.borderRadius = "10px";
        resultsBox.appendChild(newAccountButton);
        newAccountButton.onclick = function () {
            currentPlayerMembershipId = searchData.Response.searchResults[i].destinyMemberships[0].membershipId;
            currentPlayerMembershipType = searchData.Response.searchResults[i].destinyMemberships[0].membershipType;
            sessionStorage.setItem("currentPlayerId",currentPlayerMembershipId);
            sessionStorage.setItem("currentPlayerLoginType",currentPlayerMembershipType);
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

function DrawGraphs(generalStatData, weaponStatData){
    var weaponXValues = ["AutoRifle Kills","BeamRifle Kills","Bow Kills","Glaive Kills","FusionRifle Kills","HandCannon Kills",
    "TraceRifle Kills","MachineGun Kills","PulseRifle Kills","RocketLauncher Kills","ScoutRifle Kills","Shotgun Kills",
    "Sniper Kills","Submachinegun Kills","Relic Kills","SideArm Kills","Sword Kills","Ability Kills",
    "Grenade Kills","GrenadeLauncher Kills","Super Kills","Melee Kills"];
    
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

    var chartZero = document.getElementById("myChart").getContext('2d');
    var chartOne = document.getElementById("myChart1").getContext('2d');
    
    var chart0 = new Chart(chartZero, {
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
    var chart1 = new Chart(chartOne, {
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
//#endregion