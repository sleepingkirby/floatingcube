function setMsg(id,txt){
  document.getElementById(id).innerText+="- "+txt+"\n";
  document.getElementById(id).style.cssText="animation: opac 7s;";
}

function onError(e){
console.log(e);
}

//gets hostname from url
function hostFromURL(str){
var rtrn=str;
var proto=rtrn.match(/[a-z]+:\/\/+/g);
rtrn=rtrn.substr(proto[0].length,rtrn.length);
var end=rtrn.search('/');
  if(end<0){
  rtrn=rtrn.substr(0,end);
  }
return rtrn;
}

function getURLVar(){
var url=window.location.href;
var i=url.indexOf("?");
  if(i<0){
  return "";
  }
var vNm=url.substr(i+1);
return vNm;
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
a.download = "floating_cube_${prflNm}.txt";
a.click();
window.URL.revokeObjectURL(url);
}

//users exportSettings()
function exprtSttngs(elId, prflNm=""){
var el=document.getElementById(elId);
  if(el==false || !elId || elId=="" || !prflNm || prflNm=="" ){ 
  return null;
  }
  browser.storage.local.get().then((e)=>{
  el.textContent=JSON.stringify(e);
  exportSettings(el.textContent);
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





//draw Profiles page
function drawProfiles(prof){

var p=prof;
var elId="prflFrm";
var stack=[];
var rtrn="";

  if(!prof || prof==""){
  p="default";
  }

  browser.storage.local.get().then(function(d){
    
    if(!d.hasOwnProperty("profiles")||!d.hasOwnProperty("profile_meta")){
    return 0;
    }
    if(d.profiles.length<=0||d.profile_meta.length<=0){
    return 0;
    }
    if(!d.profiles.hasOwnProperty(p) || !d.profile_meta.hasOwnProperty(p)){
    return 0;
    }

  prof=d.profiles[p];
  meta=d.profile_meta[p];
  settings=d.settings; 
  stack.push({n:0,i:0});

    if(!prof || prof==""){
    p=settings.def_profile;
    }

    document.getElementById("prflFrm").textContent="";

    if(Object.keys(meta).length<=0){
    return 0;
    }

    var tmp=null;
    //this is a depth first tree traversal. Not using recursive due to the high memory involved in recursive functison.
    //using the tail end of stack as the current location 
    var i=0;
    var idNum=1;
    var idPre="stdPath";
    while(stack.length>0){

      //if the current id (stack[last].i) is beyond the last element in meta[curId].ord, pop the current entry in stack as we're done with it.
      if(stack[stack.length-1].i>(meta[stack[stack.length-1].n].ord.length-1)){
      stack.pop();
        if(stack.length>0){
        stack[stack.length-1].i = stack[stack.length-1].i +1;
        }
      rtrn+="    </div> \
            </div> \
            ";
      }
      else{
        //if the current location and index is object and hash and ord is not empty, push to stack.
        //assume first item is always a category
        var curId=meta[stack[stack.length-1].n].ord[stack[stack.length-1].i];
        if(meta.hasOwnProperty(curId) && ((meta[curId].ord.length>0 && Object.keys(meta[curId].hash).length>0)||stack.length<=1)){
        idNum++;
        var pathId=genStkPath(stack, curId);
        //idObj[pathIndx]=pathTtl;
        var ttlVal=meta[curId].nm;
        rtrn+="<div class=\"prflCtg\"> \
                <div class=\"prflCtgTtlWrap\"> \
                  <div class=\"prflCtgTtl\"> \
                    <input id=\""+pathId+"\" act=\"rnFld\" type=\"text\" dfltVal=\""+ttlVal+"\" value=\""+ttlVal+"\" /> \
                  </div> \
                  <button act=\"rmFld\" forInpt=\""+pathId+"\">x</button> \
                </div> \
                <div class=\"prflGrp\"> \
              ";
        stack.push({n:curId,i:0});
        }
        else{
        //else,it's a leaf node
        //console.log(meta[stack[stack.length-1].n][stack[stack.length-1].i]);
        idNum++;
        var pathId=genStkPath(stack, curId);
        var ttlVal=meta[curId].nm;
        rtrn+="<div class=\"prflInpt\"><div class=\"prflInptTtl\"><input id=\""+pathId+"\" act=\"rnFld\"type=\"text\" dfltVal=\""+ttlVal+"\"value=\""+ttlVal+"\" /></div> <textarea id=\""+pathId+"-val\" act=\"updtFld\"forInpt=\""+pathId+"\" type=\"text\" name=\""+curId+"\" class=\"prflInptTA\" />"+getVal(prof,meta,stack,curId)+"</textarea><button act=\"rmFld\" forInpt=\""+pathId+"\">x</button></div>";
        stack[stack.length-1].i = stack[stack.length-1].i +1;
        }
      }
    }
    document.getElementById("prflFrm").innerHTML=rtrn;
  },onError);
}

function setCSSMd(lght,dflt){
  browser.storage.local.get().then((d)=>{
  document.getElementById("cssPath").href=d.settings.clrMd?lght:dflt;
  },onError);
}


const cssDflt="./settings.css"
const cssDfltLght="./settingslight.css"


var urlPrf=getURLVar();
var meta=null;
var prof=null;
var settings=null;
var idObj={};

drawProfiles(urlPrf);
