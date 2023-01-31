var apiKey = "40777cc6ab0b41839a4b27319ec5945b";
var baseUrl = "https://www.bungie.net/Platform/Destiny2/";

var platformIndex = null;
var currentPlayerMembershipId = null;
var numberOfIdsFound = null;
var character1Id = null;
var character2Id = null;
var character3Id = null;
var characterIds = [];

function ItemRequest() {
    let textPara = document.getElementById("testPara");
    let itemRequestUrl = "https://www.bungie.net/platform/Destiny/Manifest/InventoryItem/1274330687/";
    fetch(itemRequestUrl, { method: 'GET', headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'X-API-Key': apiKey
        } })
        .then((response) => response.json())
        .then((jsonData) => textPara.innerHTML = jsonData.Response.data.inventoryItem.itemName);
}

function UserInfoRequest() {
    
    let platformDropdown = document.getElementById("platformDropdown");
    let usernameTextBox = document.getElementById("usernameTextbox");
    let displayCodeTextbox = document.getElementById("displayCodeTextbox");
    let platformSearchUrl = null;
    let usernameValue = null;
    let displayCodeValue = null;

    //let xhr = new XMLHttpRequest();
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
            fetch(platformSearchUrl, {
                method: 'POST', headers: {
                    'Content-Type': 'application/json;charset=UTF-8',
                    'X-API-Key': apiKey
                }, body: JSON.stringify(params),
            })
                .then((response) => response.json())
                .then((data) => currentPlayerMembershipId = data.Response[0].membershipId)
                .then(getCharacterIds);
        }
    }
}

function getCharacterIds() {
    //Profile - ?components=100
    let profileRequestUrl = baseUrl + platformIndex + "/Profile/" + currentPlayerMembershipId + "/?components=100";
    fetch(profileRequestUrl, {
        method: 'GET', headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'X-API-Key': apiKey
        }
    })
        .then((response) => response.json())
        .then((jsonData) => {
            numberOfIdsFound = jsonData.Response.profile.data.characterIds.length;
            for (let i = 0; i < numberOfIdsFound; i++) {
                characterIds.push(jsonData.Response.profile.data.characterIds[i]);
            }
        })
        .then(getCharacterInfo());
    /*var xhr = new XMLHttpRequest();
    xhr.open("GET", profileRequestUrl, true);
    xhr.setRequestHeader("X-API-Key", apiKey);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    xhr.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            var json = JSON.parse(this.responseText);
            numberOfIdsFound = json.Response.profile.data.characterIds.length;
            for (let i = 0; i < numberOfIdsFound; i++) {
                characterIds.push(json.Response.profile.data.characterIds[i]);
            }
            getCharacterInfo();
        }
    }
    xhr.send();*/
}

function getCharacterInfo() {
    // ?components=200
    for (let i = 0; i < characterIds.length; i++) {
        var xhr = new XMLHttpRequest();

        var characterDataRequestUrl = baseUrl + platformIndex + "/Profile/" + currentPlayerMembershipId + "/Character/";
        characterDataRequestUrl += characterIds[i];
        characterDataRequestUrl += "/?components=200";

        xhr.open("GET", characterDataRequestUrl, true);
        xhr.setRequestHeader("X-API-Key", apiKey);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

        xhr.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                var json = JSON.parse(this.responseText);
                createCharacterTiles(json, i);
            }
        }
        xhr.send();
    }
}

function createCharacterTiles(json, idIndex) {

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
    switch (json.Response.character.data.raceType) {
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
    switch (json.Response.character.data.classType) {
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

    blueColor = json.Response.character.data.emblemColor.blue;
    greenColor = json.Response.character.data.emblemColor.green;
    redColor = json.Response.character.data.emblemColor.red;

    box.style.backgroundColor = "rgb(" + redColor + "," + greenColor + "," + blueColor + ")";
    characterRaceText.style.color = "white";
    characterClassText.style.color = "white";
    box.appendChild(characterRaceText);
    box.appendChild(characterClassText);

    document.getElementsByClassName('characterTiles')[0].appendChild(box);
}

