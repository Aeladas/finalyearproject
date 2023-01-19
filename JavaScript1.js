var apiKey = "40777cc6ab0b41839a4b27319ec5945b";
var baseUrl = "https://bungie.net/Platform/Destiny2/";

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

            var platformSearchUrl = "https://www.bungie.net/Platform/Destiny2/SearchDestinyPlayerByBungieName/" + platformIndex + "/";
            var params = {
                "displayName": usernameValue,
                "displayNameCode": displayCodeValue
            }
            xhr.open("POST", platformSearchUrl, true);
            xhr.setRequestHeader("X-API-Key", apiKey);
            xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

            xhr.onreadystatechange = function () {
                if (this.readyState === 4 && this.status === 200) {
                    var json = JSON.parse(this.responseText);
                    var name = json.Response[0].displayName;
                    var membershipId = json.Response[0].membershipId
                    textPara.innerHTML = name;
                }
            }
            xhr.send(JSON.stringify(params));
        }
    }
}