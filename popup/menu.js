const cssDflt="./menu.css";
const cssLght="./menulight.css";

function reportErr(error){
console.error('' + error.message);
}

function onError(item){
console.log("Error: " + error);
var notif=document.getElementsByClassName('notify')[0];

}

function doNothing(item, err){

}


/*---------------------------------------------------------------------
pre: none 
post: updates browser.storage.local
function to set up listeners for events.
---------------------------------------------------------------------*/
function startListen(){
var act=null;
  document.addEventListener("click", (e) => {
  act=e.target.getAttribute("act");
    switch(act){
      case "floatOn":
      browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
        browser.tabs.sendMessage(tabs[0].id, {action: 'floatPanel', msg:{val:true}});
      });
      break;
      default:
      break;
    }
  });
}

function browserSendMsgErrHndl(action, tabs){
  if(browser.runtime.lastError){
  console.log("SARA: Received the following error: \n\n"+browser.runtime.lastError.message+"\n\nTrying to send a \""+action+"\" to\ntab: "+tabs[0].id+"\ntitled: \""+tabs[0].title+"\"\nurl: \""+tabs[0].url+"\"");
  }
}


//================================ main ==========================

startListen();
