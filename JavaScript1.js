var apiKey = "40777cc6ab0b41839a4b27319ec5945b";
var baseUrl = "https://www.bungie.net/Platform/Destiny2/";

var platformIndex = null;
var currentPlayerMembershipId = null;
var numberOfIdsFound = null;
var characterIds = [];
var characterData = [];

var manifestJsonData = null;
var definitionData = null;

function ItemRequest() {
    let textPara = document.getElementById("testPara");
    let itemRequestUrl = "https://www.bungie.net/platform/Destiny/Manifest/InventoryItem/1274330687/";
    fetch(itemRequestUrl, { method: 'GET', headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'X-API-Key': apiKey
        } })
        .then((response) => response.json())
        .then((data) => textPara.innerHTML = data.Response.data.inventoryItem.itemName);
}

async function searchForUser() {
    if (event.key === 'Enter') {
        let inputBox = document.getElementById("testInputBox");
        let numberOfResultsText = null;
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
        const data = await response.json();
        numberOfResultsText = document.createElement('p');
        numberOfResultsText.innerHTML = "Found: " + data.Response.searchResults.length + " result(s)";
    }
}

async function UserInfoRequest() {
    let platformDropdown = document.getElementById("platformDropdown");
    let usernameTextBox = document.getElementById("usernameTextbox");
    let displayCodeTextbox = document.getElementById("displayCodeTextbox");
    let platformSearchUrl = null;
    let usernameValue = null;
    let displayCodeValue = null;

    if (platformDropdown.selectedIndex == 0) {
        //Do something error wise here
    }
    else {
        if (usernameTextbox.value == null) {
            //Do something error wise here
        }
        else {
            platformIndex = platformDropdown.selectedIndex;
            usernameValue = usernameTextBox.value;
            displayCodeValue = displayCodeTextbox.value;
            platformSearchUrl = baseUrl + "SearchDestinyPlayerByBungieName/" + platformIndex + "/";
            let params = {
                "displayName": usernameValue,
                "displayNameCode": displayCodeValue
            };
            const response = await fetch(platformSearchUrl, {
                method: 'POST', headers: {
                    'Content-Type': 'application/json;charset=UTF-8',
                    'X-API-Key': apiKey
                }, body: JSON.stringify(params),
            });
            const data = await response.json();
            currentPlayerMembershipId = data.Response[0].membershipId;
            getCharacterIds();
        }
    }
}

async function getCharacterIds() {
    //Profile - ?components=100
    await getManifest();
    await getItemDefinitionLibrary();

    let profileRequestUrl = baseUrl + platformIndex + "/Profile/" + currentPlayerMembershipId + "/?components=100";
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
        var characterDataRequestUrl = baseUrl + platformIndex + "/Profile/" + currentPlayerMembershipId + "/Character/";
        characterDataRequestUrl += characterIds[i];
        characterDataRequestUrl += "/?components=200";

        const response = await fetch(characterDataRequestUrl, { method: 'GET', headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                'X-API-Key': apiKey
        } });
        const data = await response.json();
        createCharacterTile(data, i);
    }
}

async function getProfileStats() {

}

async function getCharacterStats(data) {
//    alert("hello");
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
    MakeTitlesVisible();
    var weaponListObject = document.getElementById("equipmentWeaponList");
    var armourListObject = document.getElementById("equipmentArmourList");
    var extrasListObject = document.getElementById("equipmentExtrasList");

    let equipmentItems = null;
    let equipmentItemHashes = [];
    let characterId = characterIds[idIndex];

    let characterEquipmentRequestUrl = baseUrl + platformIndex + "/Profile/" + currentPlayerMembershipId + "/Character/" + characterId + "/?components=205";
    

    const equipmentResponse = await fetch(characterEquipmentRequestUrl, {
        method: 'GET', headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'X-API-Key': apiKey
        }
    });
    const equipmentJsonData = await equipmentResponse.json();
    equipmentItems = equipmentJsonData.Response.equipment.data.items;

    //Store all the item hashes
    for (let e = 0; e < equipmentItems.length; e++) {
        equipmentItemHashes.push(equipmentItems[e].itemHash);
    }
    AddItemsToLists(definitionData, equipmentItemHashes, weaponListObject, armourListObject, extrasListObject);
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
    const definitionResponse = await fetch(itemDefinitionUrl, { method: 'GET' });
    definitionData = await definitionResponse.json();
}

async function createCharacterTile(data, idIndex) {
    //Need to create an image request to get the emblems
    var box = document.createElement('div');
    var characterRaceText = document.createElement('p');
    var characterClassText = document.createElement('p');
    var redColor;
    var greenColor;
    var blueColor;

    switch (idIndex) {
        case 0:
            box.className = "character1Tile";
            break;
        case 1:
            box.className = "character2Tile";
            break;
        case 2:
            box.className = "character3Tile";
            break;
    }
    switch (data.Response.character.data.raceType) {
        case 0:
            characterRaceText.innerHTML = "Race: Human";
            break;
        case 1:
            characterRaceText.innerHTML = "Race: Awoken";
            break;
        case 2:
            characterRaceText.innerHTML = "Race: Exo";
            break;
    }
    switch (data.Response.character.data.classType) {
        case 0:
            characterClassText.innerHTML = "Class: Titan";
            break;
        case 1:
            characterClassText.innerHTML = "Class: Hunter";
            break;
        case 2:
            characterClassText.innerHTML = "Class: Warlock";
            break;
    }

    blueColor = data.Response.character.data.emblemColor.blue;
    greenColor = data.Response.character.data.emblemColor.green;
    redColor = data.Response.character.data.emblemColor.red;

    box.style.backgroundColor = "rgb(" + redColor + "," + greenColor + "," + blueColor + ")";
    box.addEventListener('click', function (event) {
        getCharacterStats(data);
        getCharacterEquipment(idIndex);
        //getCharacterInventory(idIndex);
    });
    characterRaceText.style.color = "white";
    characterClassText.style.color = "white";
    box.appendChild(characterRaceText);
    box.appendChild(characterClassText);

    document.getElementsByClassName('characterTiles')[0].appendChild(box);
}

function MakeTitlesVisible() {
    var weaponListTitle = document.getElementById("equipmentWeaponListTitle");
    var armourListTitle = document.getElementById("equipmentArmourListTitle");
    var extrasListTitle = document.getElementById("equipmentExtrasListTitle");

    weaponListTitle.style.visibility = "visible";
    armourListTitle.style.visibility = "visible";
    extrasListTitle.style.visibility = "visible";
}

function AddItemsToLists(definitionData, equipmentItemHashes, weaponListObject, armourListObject, extrasListObject) {
    for (let h = 0; h < equipmentItemHashes.length; h++) {
        let currentItemHash = equipmentItemHashes[h];
        switch (h) {
            case 0:
                kineticWeaponItem = document.createElement('li');
                kineticWeaponItem.appendChild(document.createTextNode(definitionData[currentItemHash].displayProperties.name));
                weaponListObject.appendChild(kineticWeaponItem);
                break;
            case 1:
                energyWeaponItem = document.createElement('li');
                energyWeaponItem.appendChild(document.createTextNode(definitionData[currentItemHash].displayProperties.name));
                weaponListObject.appendChild(energyWeaponItem);
                break;
            case 2:
                powerWeaponItem = document.createElement('li');
                powerWeaponItem.appendChild(document.createTextNode(definitionData[currentItemHash].displayProperties.name));
                weaponListObject.appendChild(powerWeaponItem);
                break;
            case 3:
                helmetArmourItem = document.createElement('li');
                helmetArmourItem.appendChild(document.createTextNode(definitionData[currentItemHash].displayProperties.name));
                armourListObject.appendChild(helmetArmourItem);
                break;
            case 4:
                gaunletsArmourItem = document.createElement('li');
                gaunletsArmourItem.appendChild(document.createTextNode(definitionData[currentItemHash].displayProperties.name));
                armourListObject.appendChild(gaunletsArmourItem);
                break;
            case 5:
                chestArmourItem = document.createElement('li');
                chestArmourItem.appendChild(document.createTextNode(definitionData[currentItemHash].displayProperties.name));
                armourListObject.appendChild(chestArmourItem);
                break;
            case 6:
                legArmourItem = document.createElement('li');
                legArmourItem.appendChild(document.createTextNode(definitionData[currentItemHash].displayProperties.name));
                armourListObject.appendChild(legArmourItem);
                break;
            case 7:
                classArmourItem = document.createElement('li');
                classArmourItem.appendChild(document.createTextNode(definitionData[currentItemHash].displayProperties.name));
                armourListObject.appendChild(classArmourItem);
                break;
            case 8:
                ghostExtraItem = document.createElement('li');
                ghostExtraItem.appendChild(document.createTextNode(definitionData[currentItemHash].displayProperties.name));
                extrasListObject.appendChild(ghostExtraItem);
                break;
            case 9:
                vehicleExtraItem = document.createElement('li');
                vehicleExtraItem.appendChild(document.createTextNode(definitionData[currentItemHash].displayProperties.name));
                extrasListObject.appendChild(vehicleExtraItem);
                break;
            case 10:
                shipExtraItem = document.createElement('li');
                shipExtraItem.appendChild(document.createTextNode(definitionData[currentItemHash].displayProperties.name));
                extrasListObject.appendChild(shipExtraItem);
                break;
            case 11:
                subclassExtraItem = document.createElement('li');
                subclassExtraItem.appendChild(document.createTextNode(definitionData[currentItemHash].displayProperties.name));
                extrasListObject.appendChild(subclassExtraItem);
                break;
            case 12:
                emblemExtraItem = document.createElement('li');
                emblemExtraItem.appendChild(document.createTextNode(definitionData[currentItemHash].displayProperties.name));
                extrasListObject.appendChild(emblemExtraItem);
                break;
            case 13:
                finishersExtraItem = document.createElement('li');
                finishersExtraItem.appendChild(document.createTextNode(definitionData[currentItemHash].displayProperties.name));
                extrasListObject.appendChild(finishersExtraItem);
                break;
            case 14:
                emotesExtraItem = document.createElement('li');
                emotesExtraItem.appendChild(document.createTextNode(definitionData[currentItemHash].displayProperties.name));
                extrasListObject.appendChild(emotesExtraItem);
                break;
        }
    }
}
