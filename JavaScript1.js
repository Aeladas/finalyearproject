﻿var apiKey = "40777cc6ab0b41839a4b27319ec5945b";
var baseUrl = "https://www.bungie.net/Platform/Destiny2/";

var platformIndex = null;
var currentPlayerMembershipId = null;
var numberOfIdsFound = null;
var character1Id = null;
var character2Id = null;
var character3Id = null;
var characterIds = [];

function ItemRequest() {
    var xhr = new XMLHttpRequest();
    var textPara = document.getElementById("testPara");
    xhr.open("GET", "https://www.bungie.net/platform/Destiny/Manifest/InventoryItem/1274330687/", true);
    xhr.setRequestHeader("X-API-Key", apiKey);

    xhr.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            var json = JSON.parse(this.responseText);
            var item = json.Response.data.inventoryItem.itemName;
            textPara.innerHTML = item;
        }
    }

    xhr.send();
}

function UserInfoRequest() {
    var xhr = new XMLHttpRequest();
    var platformDropdown = document.getElementById("platformDropdown");
    var usernameTextBox = document.getElementById("usernameTextbox");
    var usernameValue = null;
    var displayCodeTextbox = document.getElementById("displayCodeTextbox");
    var displayCodeValue = null;

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

            var platformSearchUrl = baseUrl + "SearchDestinyPlayerByBungieName/" + platformIndex + "/";
            var params = {
                "displayName": usernameValue,
                "displayNameCode": displayCodeValue
            };
            xhr.open("POST", platformSearchUrl, true);
            xhr.setRequestHeader("X-API-Key", apiKey);
            xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

            xhr.onreadystatechange = function () {
                if (this.readyState === 4 && this.status === 200) {
                    var json = JSON.parse(this.responseText);
                    var name = json.Response[0].displayName;
                    currentPlayerMembershipId = json.Response[0].membershipId;
                    getCharacterIds();
                }
            }
            xhr.send(JSON.stringify(params));
        }
    }
}

function getCharacterIds() {
    //Profile - ?components=100
    var xhr = new XMLHttpRequest();
    var profileRequestUrl = baseUrl + platformIndex + "/Profile/" + currentPlayerMembershipId + "/?components=100";

    xhr.open("GET", profileRequestUrl, true);
    xhr.setRequestHeader("X-API-Key", apiKey);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    xhr.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            var json = JSON.parse(this.responseText);
            numberOfIdsFound = json.Response.profile.data.characterIds.length;
            console.log("ID Order"); //Working here
            for (let i = 0; i < numberOfIdsFound; i++) {
                console.log("ID " + i + ": " + json.Response.profile.data.characterIds[i]);
                characterIds.push(json.Response.profile.data.characterIds[i]);
            }
            getCharacterInfo();
        }
    }
    xhr.send();
}

function getCharacterInfo() {
    // ?components=200
    var characterTilesContainer = document.getElementsByClassName("characterTiles");
    races = [];

    for (let i = 0; i < characterIds.length; i++) {
        var xhr = new XMLHttpRequest();

        var characterDataRequestUrl = baseUrl + platformIndex +
            "/Profile/" + currentPlayerMembershipId + "/Character/";
        characterDataRequestUrl += characterIds[i];
        characterDataRequestUrl += "/?components=200";

        //console.log("URL: " + characterDataRequestUrl);
        
        xhr.open("GET", characterDataRequestUrl, true);
        xhr.setRequestHeader("X-API-Key", apiKey);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

        xhr.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                var json = JSON.parse(this.responseText);
                console.log("Id: " + characterIds[i]);
                console.log("Race: " + json.Response.character.data.raceType);
                var newRaceText = document.createElement('p');
                newRaceText.id = "characterTile" + i;
                switch (json.Response.character.data.raceType) {
                    case 0:
                        newRaceText.innerHTML = "Race: Human"; break;
                    case 1:
                        newRaceText.innerHTML = "Race: Awoken"; break;
                    case 2:
                        newRaceText.innerHTML = "Race: Exo"; break;
                }
                document.getElementsByTagName('body')[0].appendChild(newRaceText);
                //Construct character banners here!
            }
        }
        xhr.send();
    }
}

