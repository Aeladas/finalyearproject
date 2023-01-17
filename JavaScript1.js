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
    var platformDropdown = document.getElementById("platformdrop");
    var platformIndex = null;

    if (platformDropdown.selectedIndex == 0) {

    }
    else {
        platformIndex = platformDropdown.selectedIndex;
        xhr.open("GET", "https://bungie.net/Platform/Destiny2/SearchDestinyPlayerByBungieName/-1/ScarletScoundrel/", true);
        xhr.setRequestHeader("X-API-Key", apiKey);

        xhr.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                var json = JSON.parse(this.responseText);
                console.log(json.Response.profiles[0].displayName);
            }
        }
        xhr.send();
    }
}