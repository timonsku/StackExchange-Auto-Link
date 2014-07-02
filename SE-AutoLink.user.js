// ==UserScript==
// @name        SE-AutoLink
// @namespace   Professor FartSparkles
// @include		http*://*stackexchange.com/questions*
// @include     http*://*stackoverflow.com/questions*
// @include		http*://*serverfault.com/questions*
// @include 	http*://*superuser.com/questions*
// @include 	http*://*askubuntu.com/questions*
// @include 	http*://*answers.onstartups.com/questions*
// @include 	http*://*mathoverflow.net/questions*
// @include 	http*://discuss.area51.stackexchange.com/questions/*
// @include 	http*://stackapps.com/questions*
// @version     0.2
// @grant       none
// ==/UserScript==
var arr = document.title.split(' - ');
var sitename = arr[arr.length - 1];
var prefix = "SEAutoLink-"; //prefix to avoid clashes in localstorage
if (!getStorage("settings")){
	var jsonObj = {"links":[["FFmpeg","https://www.ffmpeg.org/download.html"],["Example","http://google.com"]],"settings":{"matchAllOccurrences":false,"caseSensitive":false}};
	setStorage("settings",JSON.stringify(jsonObj))
	console.log("no settings found")
}else{
	var jsonObj = JSON.parse(getStorage("settings"));
	console.log("found settings in localstorage")
}

var keyWords = jsonObj.links;
var jsonStr = JSON.stringify(jsonObj, null, 4);
var input = document.getElementById("wmd-input");
var textSaved = false;
//console.log(jsonStr);

function getStorage(key) { return localStorage[prefix + key]; }
function setStorage(key, val) { localStorage[prefix + key] = val; }
function removeStorage(key) { localStorage.removeItem(prefix + key); }

var markupTemplate = '<div id="popup" class="popup" style="width:690px;height:500px;position: absolute;display: block"><div id="close" class="popup-close"><a title="close this popup (or hit Esc)">&#215;</a></div><h2 class="handle">Settings</h2><textarea id="auto-link-settings" name="textarea" style="width:95%;height:80%"></textarea><div style="overflow:hidden" id="main"><ul class="action-list" style="height:440;overflow-y:auto"></ul><div class="popup-actions"><span class="lsep"> | </span><a title="see info about this popup" class="popup-actions-help" href="coming soon" target="_blank">info</a><span class="lsep"> | </span ><a style="margin-left:5px" class="popup-actions-see">see-through</a><a style="margin-left:10px;color:green" class="popup-actions-add">add empty link</a><div style="float:right;"><input class="popup-submit" type="button" style="margin-right:25px" value="Save"></div><div style="float:right;margin-right:10px";"><input class="popup-actions-cancel" type="button"  value="Cancel"></div></div></div></div></div>'

$(function () {  
    //hacky solution, needs to wait for wmd script to load
    setTimeout(function(){
        buttonBar = document.getElementById("wmd-button-row");                 
        //add process text icon
        var icn = document.createElement("li");
        var span = document.createElement("span")
        icn.appendChild(span);
        buttonBar.appendChild(icn);
        icn.setAttribute("id", "wmd-link-process-icn");
        icn.setAttribute("class", "wmd-button");
        icn.setAttribute("title", "Add links based on keywords specified in the settings");
        var btnPos = parseInt($('#wmd-redo-button').css('left').replace(/[^-\d\.]/g, ''));
        $(icn).css("left",btnPos+50);
        $(span).css("cssText","background-image: url('data:image/png;base64,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')");
        icn.onclick = processLinks;
        //add edit links/configure icon
        icnAdd = document.createElement("li");
        icnAddSpan = document.createElement("span")
        icnAdd.appendChild(icnAddSpan);
        buttonBar.appendChild(icnAdd);
        icnAdd.setAttribute("id", "wmd-link-add-icon");
        icnAdd.setAttribute("class", "wmd-button");
        icnAdd.setAttribute("title", "Auto-Link Settings");
        $(icnAdd).css("left",btnPos+75);
        $(icnAddSpan).css("cssText","background-image: url('data:image/png;base64,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')");
        icnAdd.onclick = settings;
        //add reset icon
        icnRevert = document.createElement("li");
        icnRevertSpan = document.createElement("span")
        icnRevert.appendChild(icnRevertSpan);
        buttonBar.appendChild(icnRevert);
        icnRevert.setAttribute("id", "wmd-link-reset-icon");
        icnRevert.setAttribute("class", "wmd-button");
        icnRevert.setAttribute("title", "Reset text to the state before the first use of the auto link function");
        $(icnRevert).css("left",btnPos+100);
        $(icnRevertSpan).css("cssText","background-image: url('data:image/png;base64,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')");
        icnRevert.onclick = reset;
	}, 2000);
});

function processLinks(){

	var currentText = input.value;
	if(!textSaved){
		oldText = currentText;
		textSaved = true;
	}
	//check if there are manually added links and get the correct number to advance on
	var lastLnk = currentText.match(/\[(\d{1,3})\]\:\s/g);
	if (typeof lastLnk != 'undefined' && lastLnk !== null){
		lastLnk = lastLnk[lastLnk.length-1].replace( /\D*/g, '');
		var linkNr = parseInt(lastLnk)+1;
	}else{
		var linkNr = 1;
	}

	/*A bit hard to read this part, what is happening is that I search for valid matches (rgxFindStr),
	replace within that match just the keyword with the link markup and then replace a complete valid match with the newly created string.
	The a check if we want just the first all matches of a keyword to be replaced, this was kind of tricky and made the code a bit crude.
	I check if the "match and replace all" setting is set or not, if not I check if there is already a link markup containing our keyword
	and if thats true we don't change anything, otherwise we are good to go*/

	for(var i=0; i<keyWords.length;i++){
		var rgxFindStr = "(?:^|\\n|\\s|\\(|\\[|\\:|;|\\{)("+keyWords[i][0]+")(?:\\s|$|\\)|\\]|,|\\.|\\:|;|\\}|\\?|\\!)(?!\\[\\d*\\])";
		var rgxExistsStr = "\\["+keyWords[i][0]+"\\]\\[\\d*\\]";
		
		var rgxModify = "";
		if (jsonObj.settings.matchAllOccurrences){rgxModify +="g"};
		if (!jsonObj.settings.caseSensitive){rgxModify +="i"};
		
		var rgxFind = new RegExp(rgxFindStr, rgxModify);
		var rgxReplace = new RegExp(keyWords[i][0], rgxModify);
		var rgxExists = new RegExp(rgxExistsStr, "g");

		if (keyWords[i][0] != "" && currentText.match(rgxFind)){
			var myMatch = currentText.match(rgxFind)[0];
			myMatch = myMatch.replace(rgxReplace,"["+keyWords[i][0]+"]"+"["+linkNr+"]");
			if (currentText.match(rgxExists) === null && !jsonObj.settings.matchAllOccurrences){
				currentText = currentText.replace(rgxFind,myMatch);
				currentText += "\n\n  ["+linkNr+"]: "+keyWords[i][1];
				linkNr++;
			}else if (jsonObj.settings.matchAllOccurrences){
				currentText = currentText.replace(rgxFind,myMatch);
				currentText += "\n\n  ["+linkNr+"]: "+keyWords[i][1];
				linkNr++;
			}
		}
	}

	input.value = currentText.toString();
};

function settings() {
    //Create popup and wire-up the functionality
    var popup = $(markupTemplate);
    popup.find('.popup-close').click(function () { popup.fadeOutAndRemove(); });

    //Add handlers for command links
    popup.find('.popup-actions-cancel').click(function () { popup.fadeOutAndRemove(); });
    popup.find('.popup-actions-add').click(function () {
    	jsonStr = textField.value;
    	var tempJsn = JSON.parse(jsonStr);
    	tempJsn.links.push(["",""]);
    	textField.value = JSON.stringify((tempJsn), null, 4);
	});
    popup.find('.popup-actions-see').hover(function () {
      popup.fadeTo('fast', '0.4').children().not('#close').fadeTo('fast', '0.0')
    }, function () {
      popup.fadeTo('fast', '1.0').children().not('#close').fadeTo('fast', '1.0')
    });
    popup.find('.popup-submit').click(function () {
    	console.log("save");
    	setStorage("settings",JSON.stringify(JSON.parse(textField.value)))
    	//update objects to work with
    	jsonStr = JSON.stringify(JSON.parse(getStorage("settings")), null, 4);
    	jsonObj = JSON.parse(getStorage("settings"));
    	keyWords = jsonObj.links;
        popup.fadeOutAndRemove();
    });
    //add popup and center on screen
    $('#answers-header').append(popup);
    popup.center();
    StackExchange.helpers.bindMovablePopups();
    //get and fill text field after it exists
    var textField = document.getElementById('auto-link-settings');
    textField.value = jsonStr;
}


function reset(){
	if (oldText !== undefined){
		input.value = oldText;
	}
}