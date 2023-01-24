var apiKey = "40777cc6ab0b41839a4b27319ec5945b";
var baseUrl = "https://www.bungie.net/Platform/Destiny2/";

var currentPlayerMembershipId = null;

function Test() {
    var text = document.getElementById("testPara");
    text.innerHTML = "Hello there";
}

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
    var textPara = document.getElementById("testPara");
    var platformDropdown = document.getElementById("platformDropdown");
    var platformIndex = null;
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
                    currentPlayerMembershipId = parseInt(json.Response[0].membershipId);
                    console.log(currentPlayerMembershipId);
                }
            }
            xhr.send(JSON.stringify(params));
        }
    }
}

function getCharacters() {
    //Characters - ?components=200

    var xhr = new XMLHttpRequest();
    var characterRequestUrl = baseUrl + "3/Profile/" + currentPlayerMembershipId + "/?components=100";

    xhr.open("GET", characterRequestUrl, true);
    xhr.setRequestHeader("X-API-Key", apiKey);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    xhr.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            var json = JSON.parse(this.responseText);
            console.log("Characters in profile: " + json.Response.profile.data.characterIds.length);
        }
    }
    xhr.send();
}

