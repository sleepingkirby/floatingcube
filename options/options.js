function setMsg(txt){
const id='msgPrfl';
document.getElementById(id).innerText+="- "+txt+"\n";
document.getElementById(id).style.cssText="animation: opac 7s;";
}

function onError(e){
console.log(e);
}

function exportSettings( str, prflNm="" ){
//not my code. But very clean and understandable so I;m using it
//https://stackoverflow.com/questions/33664398/how-to-download-file-using-javascript-only
var a = document.createElement("a");
a.style = "display: none";
document.body.appendChild(a);

var blob = new File([str], {type: 'text/plain'});
var url = window.URL.createObjectURL(blob);
a.href = url;
a.download = `floating_cube-${prflNm}.txt`;
a.click();
window.URL.revokeObjectURL(url);
}


/*--------------------------------------------
pre:
post:
--------------------------------------------*/
function loadPrflToTxt(prflNm=''){
var el=document.getElementById('prflJSON');
  if(!prflNm || prflNm=="" ){
  setMsg(`Profile name not supplied for load`);
  return null;
  }
  browser.storage.local.get('profiles').then((e)=>{
    if(!e.hasOwnProperty('profiles') || !e.profiles.hasOwnProperty(prflNm)){
    setMsg("Profile name does not exist");
    return 0;
    }
  
  el.textContent=JSON.stringify(e.profiles[prflNm]);
  exportSettings(el.textContent, prflNm);
  },onError);
}

function imprtSttngs(elId, prflNm=""){
var el=document.getElementById(elId);
  if(el==false || !elId || elId=="" || !prflNm || prflNm==""){ 
  return null;
  }
  
  if(el.value==""){
  setMsg("msgPrfl", "No settings found in textbox. Nothing to import.");
  return false;
  }

var d=JSON.parse(el.value);

  browser.storage.local.set(d).then((e)=>{
  fillSlct("prflSlct", getURLVar());
  setMsg("msgPrfl", "Settings imported.");
  },onError);
return true;
}


/*------------------------------------------
pre:
post:
------------------------------------------*/
function fillPrflSlct(){
  browser.storage.local.get("profiles").then((prfls)=>{
  const prflKeys=Object.keys(prfls["profiles"]).sort();
  const slct=document.getElementById("prflSlctSlct");
    //no profiles, don't run.
    if(prflKeys.length<=0){
    return 0;
    }

  let opts='';
    for(let nm of prflKeys){
    opts+=`<option value="${nm}">${nm}</option>`;
    }

    if(opts!=''){
    slct.innerHTML=opts;
    }
    return 0;
  });
return 0;
}


/*------------------------------------------
pre:
post:
------------------------------------------*/
function delPrfl(prflNm=''){
console.log(prflNm);
  if(!prflNm || prflNm==''){
  setMsg(`No profile name was passed into delete profile.`);
  return 0;
  }

  if(confirm(`Are you sure you want to delete the profile "${prflNm}".`)){
    browser.storage.local.get('profiles').then((d)=>{
      if(!d.hasOwnProperty('profiles')||!d.profiles.hasOwnProperty(prflNm)){
      setMsg(`Profiles or frofile name "${prflNm}" does not exist to delete.`);
      return 0;
      }
      
    delete d.profiles[prflNm];
      browser.storage.local.set(d).then(()=>{
      setMsg(`Profile ${prflNm} removed`);
      fillPrflSlct(); 
      }, (err)=>{
      setMsg(err);
      });
    });
  }

}

/*------------------------------------------
pre:
post:
------------------------------------------*/
function startListen(){
  document.addEventListener("click",(e)=>{
  const el=document.getElementById('prflSlctSlct');
    switch(e.target.getAttribute("act")){
      case 'loadPrfl':
      loadPrflToTxt(el.value);
      break;
      case 'delPrfl':
      delPrfl(el.value);
      break;
      default:
      break;
    }
  });

const msgPrfl=document.getElementById("msgPrfl");
  msgPrfl.addEventListener("animationend", ()=>{
  msgPrfl.innerText="";
  msgPrfl.style.cssText="";
  });

}

fillPrflSlct();
startListen();
