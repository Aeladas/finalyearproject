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
    //Tester();
    getAccessToken();
}

function Tester(){
    let searchCode = window.location.search;
    let removeAfter = searchCode.indexOf("&");
    removeAfter = removeAfter - 6;
    searchCode = searchCode.replace("?code=","");
    searchCode = searchCode.substring(0, removeAfter);

    let testPara = document.getElementById("testPara");
    testPara.innerHTML = "Code: "+searchCode;
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

}

async function getCharacterStats(data) {
    const statsObject = data.Response.character.data.stats;
    let statsText = document.getElementById("characterStatsText");
    statsText.innerHTML = " Power: "+statsObject["1935470627"];
    statsText.innerHTML += "\n Mobility: " +statsObject["2996146975"];
    statsText.innerHTML += "\n Resilience: "+statsObject["392767087"];
    statsText.innerHTML += "\n Recovery: "+statsObject["1943323491"];
    statsText.innerHTML += "\n Discipline: "+statsObject["1735777505"];
    statsText.innerHTML += "\n Intellect: "+statsObject["144602215"];
    statsText.innerHTML += "\n Strength: "+statsObject["4244567218"];
}

async function getCharacterEquipment(idIndex) {
    makeListsVisible();

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
    updateItems(itemDefinitionData, statsDefinitionData, equipmentItems);
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

function makeListsVisible() {
    var weaponListTitle = document.getElementById("equipmentWeaponListTitle");
    var armourListTitle = document.getElementById("equipmentArmourListTitle");
    var extrasListTitle = document.getElementById("equipmentExtrasListTitle");

    let weaponList = document.getElementById("equipmentWeaponList");
    let armourList = document.getElementById("equipmentArmourList");
    let extrasList = document.getElementById("equipmentExtrasList");

    for (let w = 0; w < weaponList.children.length; w++) {
        weaponList.children[w].style.visibility = "visible";
    }
    for (let a = 0; a < armourList.children.length; a++) {
        armourList.children[a].style.visibility = "visible";
    }
    for (let e = 0; e < extrasList.children.length; e++) {
        extrasList.children[e].style.visibility = "visible";
    }

    weaponListTitle.style.visibility = "visible";
    armourListTitle.style.visibility = "visible";
    extrasListTitle.style.visibility = "visible";
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
    containerToEdit.onclick = function(){ getCharacterEquipment(idIndex); }
    containerToEdit.style.visibility = "visible";
}

function updateItems(itemDefinitionData, statsDefinitionData, equipmentItems) {
    for (let i = 0; i < equipmentItems.length; i++) {
        let currentItem = itemDefinitionData[equipmentItems[i].itemHash];
        switch (equipmentItems[i].bucketHash) {
            case 1498876634:
                kineticWeaponItem = document.getElementById("kineticWeaponItem");
                kineticWeaponItem.innerHTML = currentItem.displayProperties.name;
                let statsHashList = itemDefinitionData[equipmentItems[i].itemHash].stats.stats;
                statsHashList = Object.entries(statsHashList);
                //NEED TO STORE KEYS AND INFO IN ARRAYS
                console.log(statsHashList[0][0]);
                console.log(statsHashList[0][1].value);
                //[155624089].displayProperties.name
                //[155624089].value
                break;
            case 2465295065:
                energyWeaponItem = document.getElementById("energyWeaponItem");
                energyWeaponItem.innerHTML = itemDefinitionData[equipmentItems[i].itemHash].displayProperties.name;
                break;
            case 953998645:
                powerWeaponItem = document.getElementById("powerWeaponItem");
                powerWeaponItem.innerHTML = itemDefinitionData[equipmentItems[i].itemHash].displayProperties.name;
                break;
            case 3448274439:
                helmetArmourItem = document.getElementById("helmetArmourItem");
                helmetArmourItem.innerHTML = itemDefinitionData[equipmentItems[i].itemHash].displayProperties.name;
                break;
            case 3551918588:
                gaunletsArmourItem = document.getElementById("gaunletsArmourItem");
                gaunletsArmourItem.innerHTML = itemDefinitionData[equipmentItems[i].itemHash].displayProperties.name;
                break;
            case 14239492:
                chestArmourItem = document.getElementById("chestArmourItem");
                chestArmourItem.innerHTML = itemDefinitionData[equipmentItems[i].itemHash].displayProperties.name;
                break;
            case 20886954:
                legArmourItem = document.getElementById("legArmourItem");
                legArmourItem.innerHTML = itemDefinitionData[equipmentItems[i].itemHash].displayProperties.name;
                break;
            case 1585787867:
                classArmourItem = document.getElementById("classArmourItem");
                classArmourItem.innerHTML = itemDefinitionData[equipmentItems[i].itemHash].displayProperties.name;
                break;
            case 4023194814:
                ghostExtraItem = document.getElementById("ghostExtraItem");
                ghostExtraItem.innerHTML = itemDefinitionData[equipmentItems[i].itemHash].displayProperties.name;
                break;
            case 2025709351:
                vehicleExtraItem = document.getElementById("vehicleExtraItem");
                vehicleExtraItem.innerHTML = itemDefinitionData[equipmentItems[i].itemHash].displayProperties.name;
                break;
            case 284967655:
                shipsExtraItem = document.getElementById("shipsExtraItem");
                shipsExtraItem.innerHTML = itemDefinitionData[equipmentItems[i].itemHash].displayProperties.name;
                break;
            case 3284755031:
                subclassExtraItem = document.getElementById("subclassExtraItem");
                subclassExtraItem.innerHTML = itemDefinitionData[equipmentItems[i].itemHash].displayProperties.name;
                console.log(itemDefinitionData[equipmentItems[i].itemHash]);
                break;
            case 4274335291:
                emblemsExtraItem = document.getElementById("emblemsExtraItem");
                emblemsExtraItem.innerHTML = itemDefinitionData[equipmentItems[i].itemHash].displayProperties.name;
                break;
            case 3683254069:
                finishersExtraItem = document.getElementById("finishersExtraItem");
                finishersExtraItem.innerHTML = itemDefinitionData[equipmentItems[i].itemHash].displayProperties.name;
                break;
            /*case 3183180185:
                emotesExtraItem = document.getElementById("emotesExtraItem");
                emotesExtraItem.innerHTML = itemDefinitionData[equipmentItems[i].itemHash].displayProperties.name;
                break;*/

        }
    }
}
