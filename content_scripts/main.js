(function() {
/**
 * Check and set a global guard variable.
 * If this content script is injected into the same page again,
 * it will do nothing next time.
 */
  if (window.hasRun) {
  return true;
  }
window.hasRun = true;
const plgInNm="floatingcube";

  //
  function onError(err){
  console.log(err);
  }

  //validate Str
  function validStr(str){
    if( str && (typeof str === 'string' || str instanceof String) && str!=""){
    return str;
    }
  return "";
  }

  function strToBool(str){
    if(str.toLocaleLowerCase()=="true"){
    return true
    }
  return false;
  }

  //I can't believe that this function doesn't exist in javascript
  // makes O'Reily into O\'Reily or "air quotes" into \"air quotes\"
  function addslashes(str){
  return str.replace(/['"\\]/g, '\\$&');
  }

  //convert special characters to html entities.
  function toHtmlEnt(str){
  var rtrn=str;
  rtrn=rtrn.replace(/'/g, '&apos;');
  rtrn=rtrn.replace(/"/g, '&quot;');
  rtrn=rtrn.replace(/\\/g, '&bsol;');
  rtrn=rtrn.replace(/</g, '&lt;');
  rtrn=rtrn.replace(/>/g, '&gt;');
  rtrn=rtrn.replace(/&/g, '&amp;');
  return rtrn;
  }

  //convert special characters back from html entities
  function fromHtmlEnt(str){
  var rtrn=str;
  rtrn=rtrn.replace(/&apos;/g, '\'');
  rtrn=rtrn.replace(/&quot;/g, '"');
  rtrn=rtrn.replace(/&bsol;/g, '\\');
  rtrn=rtrn.replace(/&lt;/g, '<');
  rtrn=rtrn.replace(/&gt;/g, '>');
  rtrn=rtrn.replace(/&amp;/g, '&');
  return rtrn;
  }

//gets hostname from url
  function hostFromURL(str){
  var rtrn=str;
  var proto=rtrn.match(/[a-z]+:\/\/+/g);
  rtrn=rtrn.substr(proto[0].length,rtrn.length);

  var end=rtrn.search('/');
    if(end>=0){
    rtrn=rtrn.substr(0,end);
    }

  return rtrn;
  }


  /*--------------------------
  pre: none
  post: none
  new fangled wait function 
  https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
  ---------------------------*/
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  /*-----------------------
  pre: pageDone()
  post: none
  runs pageDone after "secs" amount of time
  -----------------------*/
  async function delayRun(secs=6500) {
    await sleep(secs);
    pageDone();
  }

  /*----------------------
  pre: none
  post: none
  gets the attributes of an element and makes it into an obj
  ----------------------*/
  function elToObj(el){
  var rtrn={"tagName":"", "attr":{}};
  var arr=el.getAttributeNames();
  arr.forEach( (i,n)=>{rtrn.attr[i]=el.getAttribute(i);});
  rtrn["tagName"]=el.tagName.toLowerCase();
  return rtrn;
  }

  //a hack function to copy to clipboard
  function copyHack(str){
  var ta=document.createElement("textarea");
  ta.textContent=str;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy', false, null);
  document.body.removeChild(ta);
  }

  /*--------------------------------------------
  pre: none
  post:
  sends events that makes forms that cache your input rather
  just reading the d*mn input forms for the values
  actually work and persist.
          onEl.dispatchEvent(new InputEvent('input',{inputType:'insertFromPaste'}));
        onEl.dispatchEvent(new Event('change',{bubbles:true}));
        onEl.value=ptr;
        onEl.dispatchEvent(new Event('change',{bubbles:true}));
  using:
  https://higherme.bamboohr.com/jobs/view.php?id=25&source=aWQ9MjY%3D
  as example
  ---------------------------------------------*/
  function smrtFill(el, val, type, flag=false){

  var vls='value';
    switch(type){
      case 'checked':
      vls='checked';
      break;
      default:
      vls='value';
      break;
    }  

    
    if(!flag){
    el[vls]=val;
    return 0;
    }

    el.dispatchEvent(new InputEvent('input',{inputType:'insertFromPaste'}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
    el[vls]=val;
    el.dispatchEvent(new Event('change',{bubbles:true}));
    el[vls]=val;
    return 0;
  }


  /*--------------------------------------------
  pre: global element onEl, copyHack(), smrtFill()
  post: element onEl filled
  takes the string from the message, find the 
  value from the settings via the string, fills
  the onEl with the value.
  ---------------------------------------------*/ 
  function pasteVal(str, onEl, flag=false){
  //console.log("SARA: starting pasteVal: "+str);
    if(typeof str!="string" || str==""){
    return null;
    }
  let prfl="";
  let tmp=str.split('|');
  prfl=tmp[1];
  tmp=tmp[0].split('-');

  let rtrn="";
  let ptr=null;
    browser.storage.local.get().then((d)=>{
    let max=tmp.length;
    ptr=d.profiles[prfl];
    //skipping 0 as that's root, skipping 1 as that's always category
      if(max<=2){
      return rtrn;
      }

      for(let i=2; i<max; i++){
        if(d.profile_meta[prfl].hasOwnProperty(tmp[i])){
        let nm=d.profile_meta[prfl][tmp[i]].nm;
          if(typeof ptr=="object" && ptr && ptr.hasOwnProperty(nm)){
          ptr=ptr[nm];
          }
        }
      }

    //console.log("found: "+ptr);
    copyHack(ptr);

      if(typeof ptr!="string" && typeof onEl!="object"){
      console.log("SARA: Attempt to paste value into field failed. Field either not an object or value not a string.");
      console.log(typeof ptr);
      //console.log(onEl);
      //console.log(prt);
      return null;
      }

      console.log("SARA: pasting value \""+ptr+"\" into field");
      //console.log(onEl);      

      if(onEl.tagName.toLocaleLowerCase()=="input"){    
        switch(onEl.type){
        case "checkbox":
          if(ptr!=null&&ptr!=false){
          smrtFill(onEl, true, 'checked', flag);
          }
          else{
          smrtFill(onEl, false, 'checked', flag);
          }
        break;
        case "radio":
        let rds=document.getElementsByName(onEl.name);
        let m=rds.length;
          for(let i=0; i<m; i++){
            if(rds[i].value==ptr){
            rds[i].checked=true;
            smrtFill(rds[i], true, 'checked', flag);
            }
          }
        break;
        default:
        smrtFill(onEl, ptr, 'value', flag);
        break;
        }
      }
      else if(onEl.tagName.toLocaleLowerCase()=="option"){
      smrtFill(onEl.parentElement.value, ptr, 'value', flag);
      }
      else{
      smrtFill(onEl, ptr, 'value', flag);
      }

    },onError); 
  }

  /*---------------------------------------------------------
  pre: element
  post:
  extract proper value from element in accordance to what kind
  of element it is
  ----------------------------------------------------------*/
  function getValFrmElTyp(el){
    if(typeof el!="object"){
    return null;
    }

    if(el.tagName.toLocaleLowerCase()=="input"){
      switch(el.type){
      case "checkbox":
        return el.checked;
      break;
      case "radio":
      let arr=document.getElementsByName(el.name);
      let m=arr.length;
        for(let i=0; i<m; i++){
          if(arr[i].checked==true){
          return arr[i].value;
          }
        }
      break;
      default:
      return el.value;
      break;
      }
    }
    else if(el.tagName.toLocaleLowerCase()=="option"){
    return el.parentElement.value;
    }
    else{
    //both textarea and select should fall here
    return el.value;
    }

  return null;
  }

  /*--------------------
  pre: everything above here
  post: everything modified as a result of running functions above here
  the main logic for what to do when a message comes in from the popup menu
  ---------------------*/
  function runOnMsg(request, sender, sendResponse){
  //console.log("SARA: Heard message from. Running action: "+request.action);
  //console.log(request);
    switch(request.action){
      /*
      case 'getEl':
      //sends current hovered over element to the background script to populate the right click menu
      var obj=elToObj(onEl);
      console.log(obj); 
      sendResponse(JSON.stringify(obj));
      break;
      */
      case 'sendInfo':
      //copies the proper attribute of the desire element into the clipboard
      copyHack(request.msg.val);
      sendResponse(true);
      break;
      case 'setPgPrfl':
      rcrdPgPrfl(request.msg.val);
      sendResponse(true);
      break;
      case 'getPgPrfl':
      sendResponse(getPgPrfl());
      break;
      case 'fillForm':
        browser.storage.local.get(['profiles', 'settings']).then((d)=>{
          if(d.profiles.hasOwnProperty(request.msg.val)){
          fillNMsg(d.profiles[request.msg.val], "Fields Filled: ##num##\r\nProfile: "+request.msg.val, d.settings.eventFill);
          }
          else{
          sendResponse(false);
          }
        });
        sendResponse(true);
      break;
      case 'pasteVal':
        browser.storage.local.get().then((d)=>{
        pasteVal(request.msg.path, onEl, d.settings.eventFill);
        });
      sendResponse(true);  
      break;
      case 'clip':
      copyHack(getValFrmElTyp(onEl));
      sendResponse(true);
      break;
      case 'fPnlTgl':
        browser.storage.local.get().then((d)=>{
        let prfl=getPgPrfl();
          if(!prfl){
          let applyHsh=strToApplyLst(d.settings.applyLst);
          prfl=dtrmnPrfl(window.location.host, d, applyHsh);
          }        
        floatPnlDt(d, request.msg.val, prfl);
        });
      sendResponse(true);
      break;
      case 'closeFltPnl':
        browser.storage.local.get().then((d)=>{
        floatPnlDt(d, d.settings.floatPnl, null);
        });
      sendResponse(true);
      break;
      default:
      //console.log(request);
      sendResponse("default");
      break;
    }
  }

  /*-------------------------
  pre: onEl exists, mouseover event passed down, elToObj()
  post: process mouseover event
  sends message current element as object to background script
  -------------------------*/
  function elObjToBG(e){
    if(e.path||e.target){
    let el=e.target||e.path[0];
      try{
      browser.runtime.sendMessage({'onEl':elToObj(el)});
      }
      catch(err){
        var frames=document.getElementsByTagName("iframe");
        if(ignErr===null&&frames.length<=0){
        ignErr=confirm("Hi, this is the extension \"SARA\". I've detected an error when trying to talk with another part of myself.\nThis is most likely because I was upgraded, reloaded or removed. In order for me to run correctly, this page will have to be reloaded. If this continues even after a reload, something is blocking me. Please troubleshoot by turning off other extensions, antivirus, firewalls or the like that might do this. \nClick \"OK\" to reload the page.\nClick \"Cancel\" to continue to work as it is. \n\n"+err);
        }
        if(ignErr){
        location.reload();
        }
      }
    }
  }

  /*---------------------
  pre: elObjToBG()
  post: process mouseover event
  wrapper for mouseover events
  ---------------------*/
  function mouseOvrEvnt(e){
  var act="extIdNmSARAActCopy";
  
    if(e.target.getAttribute('act')==act){
    var vl=fromHtmlEnt(e.target.getAttribute('val'));
    //copyHack(vl);
    //using chrome clipboard copy here to prevent field from losing focus.
    navigator.clipboard.writeText(vl).then(
      (e)=>{
      setFPnlMsg('Copied "'+vl+'"');
      },
      (e)=>{
        if(e=="DOMException: Document is not focused."||e=="NotAllowedError: Document is not focused."){
        setFPnlMsg('Click on page to begin copying');
        }
        console.log('SARA: function mouseOvrEvnt() failed to copy. Error: "'+e+'"');
      });
    }
    else{
    elObjToBG(e);
    }
  }
  

  /*---------------------------------------------------
  pre: global variable onEl 
  post:
  function to capture what element was right-clicked on
  ---------------------------------------------------*/
  function rghtClckOnEl(e){
    if(e.target){
    onEl=e.target;
    }
    else if(e.path){
    onEl=e.path[0];
    }
    else if(e.composedPath){
    onEl=e.composedPath[0];
    }
  }


  /*---------------------------------------------------
  pre:
  post: html element that is not visible.
  adds an invisible element to the page to keep track 
  of what profile was set for this page.
  ---------------------------------------------------*/
  function rcrdPgPrfl(prfl){
    if(typeof prfl != "string" || prfl=="" ||!prfl){
    return false;
    }

  var id="extIdNmSARAPgPrfl";
  var el=document.getElementById(id);
    if(el){
    el.setAttribute("profile",prfl);
    return true;
    }

  el=document.createElement("div");
  el.style.cssText="display:none;max-height: 0px; max-width: 0px; opacity:0;";
  el.setAttribute("profile",prfl);
  el.id=id;
  document.body.appendChild(el);
  return true;
  }

  /*-------------------------------------------------
  pre:
  post:
  checks if page profile marker was set
  --------------------------------------------------*/
  function getPgPrfl(){
  let el=document.getElementById("extIdNmSARAPgPrfl");
    if(el){
    return el.getAttribute("profile");
    }
  return null;
  }

  /*---------------------------------------------------
  pre:
  post:
  returns which profile to use. Meant for first time 
  the page is ran. Subsequent changes depend on popup 
  to tell us (content_script) which profile to use.
  ---------------------------------------------------*/
  function dtrmnPrfl(dmn, d, hsh){
    //if that doesn't exist, return error, ask to create new profile or reinstall (outside of this function). Nothing is done until then
    if(Object.keys(d).length<=0 || Object.keys(d.profiles).length<=0 ){
    return false;
    }

    //since always runs on page start and only on page start, the profile marker is NEVER set
    //if in applyHsh, get profile name
    if(Object.keys(hsh).length>=1&&hsh.hasOwnProperty(dmn)&&d.profiles.hasOwnProperty(hsh[dmn])){
    return hsh[dmn];
    }

    //if that profile doesn't exist/workout, use current profile.
    if(d.settings.hasOwnProperty("cur_profile") && d.profiles.hasOwnProperty(d.settings.cur_profile) && d.settings.hasOwnProperty("curDef") && d.settings.curDef==true){
    return d.settings.cur_profile;
    }

    //if that profile doesn't exist/workout, use default profile.
    if(d.settings.hasOwnProperty("def_profile") && d.profiles.hasOwnProperty(d.settings.def_profile)){
    return d.settings.def_profile;
    }

    //if default doesn't exist, set to first profile in list. 
  return Object.keys(d.profiles)[0];
  }

  /*---------------------------------------------------
  pre: hoverId(value to know if it needs to run)
  post: hoverId added or removed.
  the main logic for the hover Id'ing element. This 
  generates the element, adds listeners to know when to
  add the element, when to remove the element, when to
  start adding, etc.
  ---------------------------------------------------*/
  function hoverId(hoverId){
  var rnFlg=hoverId;
    if(typeof rnFlg != "boolean"){
    rnFlg=false;
    }

  var mrgn=16;
  var el=document.createElement("div");
  el.style.cssText="display:inline-block;position:fixed;color:#cccccc;background-color:black;left:0px;top:0px;border:1px solid #cccccc;border-radius:6px;padding: 6px 6px 6px 6px;opacity:.75;z-index:999999999;margin:"+mrgn+"px;white-space:pre-wrap;word-break:break-all;max-width:"+window.innerWidth+"px;min-width:50px;"
  el.textContent="loading...";
  el.id="extIdNmSARA";

    browser.storage.onChanged.addListener(function(c,n){
      if(c.hasOwnProperty("settings")){
      rnFlg=c.settings.hasOwnProperty("newValue")?c.settings.newValue.hoverId:false;
      oldFlg=c.settings.hasOwnProperty("oldValue")?c.settings.oldValue.hoverId:false;
        if(!rnFlg && document.getElementById(el.id)){
        document.body.removeChild(el);
        }
      }
    });

    document.onmousemove=function(e){
      if(rnFlg){
      document.body.appendChild(el);
        if(!el.isEqualNode(e.target)){
        el.textContent=e.target.tagName.toLowerCase();
        var arr=e.target.getAttributeNames();
        arr.forEach( (i,n)=>{el.textContent+="\r\n"+i+": "+e.target.getAttribute(i);});
        }
          
        if((e.clientX + el.clientWidth + mrgn) > window.innerWidth){
        el.style.maxWidth=window.innerWidth+"px";
        el.style.left= (e.clientX - mrgn - 10 - el.clientWidth) +"px";
        }
        else{
        el.style.maxWidth=window.innerWidth+"px";
        el.style.left=e.clientX+"px";
        }

        if((e.clientY + el.clientHeight + mrgn) > window.innerHeight){
        el.style.maxHeight=window.innerHeight+"px";
        el.style.top= (e.clientY - mrgn - 10 - el.clientHeight) +"px";
        }
        else{
        el.style.maxHeight=window.innerHeight+"px";
        el.style.top=e.clientY+"px";
        }
      }
    };
    //when mouse leaves the webpage, remove hover
    document.onmouseout=function(e){
      if(document.getElementById(el.id)){
      document.body.removeChild(el);
      }
    };
  }

  //gets value from the profile data according to the stack and leaf
  //see used in trvrsDrwPrfl()
  function getValTree(stk, meta, prf, leaf){
  var max=stk.length;
    if(max<=1){
    return '';
    }
  var i=0;
  var val='';
  var pos=prf;
    for(var i=0; i<max; i++){
      if(i>=2&&pos.hasOwnProperty(meta[stk[i].n].nm)){
      pos=pos[meta[stk[i].n].nm];
      }
    }
 
    if(pos.hasOwnProperty(leaf) && typeof pos[leaf]=="string"){
    return pos[leaf];
    }
  return '';
  }


  /*----------------------------
  pre: getVal()
  post: none
  generates html for the float panel
  ----------------------------*/
  //traverse and draw profile 
  function trvrsDrwPrfl(d,p){
  var act="extIdNmSARAActCopy";
  var stack=[];
  var prof=d.profiles[p];
  var meta=d.profile_meta[p];
  var settings=d.settings;
  var rtrn='';
  var path=[];
  stack.push({n:0,i:0});

    while(stack.length>0){
      //if the current id (stack[last].i) is beyond the last element in meta[curId].ord, pop the current entry in stack as we're done with it.
      if(stack[stack.length-1].i>(meta[stack[stack.length-1].n].ord.length-1)){
      stack.pop();
        if(stack.length>0){
        stack[stack.length-1].i = stack[stack.length-1].i +1;
        }
      rtrn+="    </div> \
            </div> \
            <div style=\"display: flex; width:100%; margin: 6px 0px 6px 0px; height:0px;\">&nbsp</div>\
            ";
      }
      else{
      var curId=meta[stack[stack.length-1].n].ord[stack[stack.length-1].i];
        //if the element exists in the profile_meta AND the element has sub elements, but also don't process the root node (stack.length<=1).
        if(meta.hasOwnProperty(curId) && ((meta[curId].ord.length>0 && Object.keys(meta[curId].hash).length>0)||stack.length<=1)){
        rtrn+="<div style=\"display: flex; flex-direction: column; align-items: flex-start; margin-top: 6px; line-height: 1;\"> \
                <span style=\"font-weight: 900;\">"+meta[curId].nm.toUpperCase()+"</span> \
                <div style=\"display: flex; padding: 2px 0px 2px 20px; flex-direction: column; width:100%; box-sizing: border-box; line-height: 1;\"> \
              ";
        stack.push({n:curId,i:0});
        }
        else{
        //else,it's a leaf node
        let val=getValTree(stack, meta, prof, meta[curId].nm);
        rtrn+='<div style="display:flex; flex-direction:row; justify-content:flex-start; align-items: center; margin: 0px 0px 4px 0px; padding: 0px 2px 0px 4px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; width: 100%; box-sizing: border-box; cursor: copy; line-height: 1;" act="'+act+'" val="'+toHtmlEnt(val)+'"><div style=\"display: flex; margin-right: 6px; line-height: 1;\">&bull;</div>'+meta[curId].nm+': <div style="text-overflow:ellipsis; overflow: hidden; border-radius: 4px; margin-left: 6px; white-space:nowrap; width: 100%; line-height: 1;" type="text" act="'+act+'" val="'+toHtmlEnt(val)+'">'+val+'</div></div>';
        stack[stack.length-1].i = stack[stack.length-1].i +1;
        }
      }
    }
  return rtrn;
  }



  /*--------------------------------------------------------
  pre:
  post:
  splits strings with new lines into objects
  --------------------------------------------------------*/
  function strToHsh(str){
    if(typeof str !="string"){
    return null;
    }
  var s=str;
  var arr=s.trim().split("\n");
  var rtrn={};
  var max=arr.length;
    for(let i=0; i<max; i++){
    rtrn[arr[i]]=true;
    }
  return rtrn;
  }

  /*--------------------------------------------------------------
  pre: none
  post: none
  convert string to Apply List object
  --------------------------------------------------------------*/
  function strToApplyLst(str){
    if(typeof str !="string"){
    return {};
    }
  var s=str;
    if(s.trim()==""){
    return {};
    }
  var arr=s.trim().split("\n");
  var rtrn={};
  var max=arr.length;
    for(let i=0; i<max; i++){
    let pos=arr[i].indexOf("|");
    rtrn[arr[i].substr(0,pos)]=arr[i].substr(pos+1);
    }
  return rtrn;
  }

  //match string to the hash
  function mtchAgnstHsh(str, hsh){
    if(!str || str=="" || typeof str !="string"){
    return false;
    }

    if(typeof hsh!="object" || Object.keys(hsh).length <= 0){
    return false;
    } 

  var h=hsh;
  var s=str;
  var ks=Object.keys(h);
  var hsh_ind="";
  var trl="";
  var cm="";
  var rtrn=null;
    while(typeof h=="object" && ks.length>0 && rtrn==null){
    hsh_ind=ks.shift();
    let patt=new RegExp(hsh_ind, "i");
      if(patt.test(s)){
        //if the pattern matches and the pattern is an index for an object, traverse down
        if(typeof h[hsh_ind]=="object"){
        h=h[hsh_ind];
        ks=Object.keys(h);
        trl+=cm+hsh_ind;
        cm="->";
        }
        else{
        //if the pattern matches and the pattern is an index for not an object, it's the final value.
        rtrn=h[hsh_ind];
        trl+=hsh_ind;
        console.log("SARA: match found for \""+s+"\", with trial \""+trl+"\", with value \""+rtrn+"\"");
        return rtrn;
        }
      }
    }
  return rtrn;
  }


  /*----------------------------------------------------------
  pre:
  post:

  ----------------------------------------------------------*/
  function setMsg(msg){

  const sty=document.createElement("style");
  sty.type="text/css";
  sty.className="extIdNmSARAMsgSty";
  sty.textContent="@keyframes extIdNmSARAMsgStyAni{0%{opacity:0.85;}100%{opacity:0;}}";
  sty.id=sty.className;

  document.head.appendChild(sty);

  var id="extIdNmSARAMsg";
  el=document.createElement("div");
  el.style.cssText="position:fixed; box-sizing: border-box; top: 0px; left: 0px; width:100%; display:flex; justify-content: center; opacity: 0.85; z-index:999999; animation: extIdNmSARAMsgStyAni 1.5s ease-in-out 3.5s forwards;";
  el.id=id;
  
  el.appendChild(document.createElement("div"));
  el.firstChild.style.cssText="padding: 8px 12px 8px 12px; border-radius: 0px 0px 6px 6px; background-color:#606060; color:#ffffff; font-weight:700; font-size: x-large; white-space:pre-wrap; ";
  el.firstChild.textContent=msg;

    el.onanimationend=(e)=>{
      try{
      document.body.removeChild(el);
      document.head.removeChild(sty);
      }
      catch(err){
      console.log("SARA: unable to remove element and/or style for the over page message. This is okay if the element doesn't exist. "+err);
      }
    };

  document.body.appendChild(el);

  };

  
  /*---------------------------
  pre: element with id
  post: sets content of element with id
  post sets element with id "id" with content of str
  ---------------------------*/
  function setFPnlMsg(str){
  const id="extIdNmSARAFPnlTtl";
  document.getElementById(id).textContent=str;
  return 0;
  }



  /*-------------------------------------------------------------------
  pre: mtchAgnstHsh(), smrtFill()
  post: html elements filled
  find elements and fill it with proper values.
  -------------------------------------------------------------------*/
  function fndNFll(hsh, flag=false){
    if(typeof hsh!="object" || Object.keys(hsh) <=0){
    return false;
    }

  var h=hsh;
  var inpts=document.getElementsByTagName("input");
  var tas=document.getElementsByTagName("textarea");
  var slcts=document.getElementsByTagName("select");


  //inputs
  var val=null;
  let max=inpts.length;
  var cnt=0;
    for(let i=0;i<max;i++){
    let arr=inpts[i].getAttributeNames();
    let arrm=arr.length;
    //console.log("===============>>");
    //console.log(inpts[i]);
    //console.log(arr);
      //iterating through attributes of the element
      for(let j=0;j<arrm;j++){ 

      //console.log("inputs "+" "+arr[j]+" "+inpts[i].getAttribute(arr[j]));
      //value when type=text, email, hidden, month, number, date, datetime-local,color,vol, image, password,tel, time,url, week
      //checked when value=checkbox, radio
      val=mtchAgnstHsh(inpts[i].getAttribute(arr[j]),hsh);
        if(val!=null&&val!=false){//if val is null or false, the hash doesn't have an entry for this. Don't fill stuff in
        //if, for some bizarre reason, the input element doens't have a type, assume value
          if(!inpts[i].hasAttribute("type")){
          smrtFill(inpts[i], val, 'value', flag);
          cnt++;
          break;
          }
          else{
            if((inpts[i].type=="text"||inpts[i].type=="email"||inpts[i].type=="hidden"||inpts[i].type=="month"||inpts[i].type=="number"||inpts[i].type=="date"||inpts[i].type=="datetime-local"||inpts[i].type=="color"||inpts[i].type=="vol"||inpts[i].type=="image"||inpts[i].type=="password"||inpts[i].type=="tel"||inpts[i].type=="time"||inpts[i].type=="url"||inpts[i].type=="week")){
            smrtFill(inpts[i], val, 'value', flag);
            cnt++;
            break;
            }
            if(inpts[i].type=="radio"&&inpts[i].value==val){//why only if the value match? With radios, multiple inputs are linked together via name and has to provide a value to distinguish the choices from each other.
            //inpts[i].checked=true;
            smrtFill(inpts[i], true, 'checked', flag);
            cnt++;
            break;
            }
            if(inpts[i].type=="checkbox"){
              if(val!="false"&&val!=""){
              smrtFill(inpts[i], true, 'checked', flag);
              }
              else{
              smrtFill(inpts[i], false, 'checked', flag);
              }
              cnt++;
              break;
            }
          }
        }
      }
    }     

  //textarea value 
  val=null;
  max=tas.length;
    for(let i=0;i<max;i++){
    let arr=tas[i].getAttributeNames();
    let arrm=arr.length;
      for(let j=0;j<arrm;j++){ 
      //value when type=text, email, hidden, month, number, date, datetime-local,color,vol, image, password,tel, time,url, week
      //checked when value=checkbox, radio
      val=mtchAgnstHsh(tas[i].getAttribute(arr[j]),hsh);
        if(val!=null&&val!=false){//if val is null or false, the hash doesn't have an entry for this. Don't fill stuff in
        smrtFill(tas[i], val, 'value', flag);
        cnt++;
        }
      }
    }

  //select
  val=null;
  max=slcts.length;
    for(let i=0;i<max;i++){
    let arr=slcts[i].getAttributeNames();
    let arrm=arr.length;
      for(let j=0;j<arrm;j++){ 
      //value when type=text, email, hidden, month, number, date, datetime-local,color,vol, image, password,tel, time,url, week
      //checked when value=checkbox, radio
      val=mtchAgnstHsh(slcts[i].getAttribute(arr[j]),hsh);
        if(val!=null&&val!=false){//if val is null or false, the hash doesn't have an entry for this. Don't fill stuff in
        smrtFill(slcts[i], val, 'value', flag);
        cnt++;
        }
      }
    }
  return cnt;
  }

/*---------------------------------------------------
pre: fndNFll(),setMsg()
post:html forms filled, message set (##num##)
params: hash for fndNFll and profile for message
wrapper for fndNFll and setMsg so only 1 
function needs to be called to both fill and setMsg
---------------------------------------------------*/
function fillNMsg(hsh, msg, flag=false){
  if(typeof hsh!="object"){
  return false;
  }
let num=fndNFll(hsh, flag);
let m=msg.replace("##num##", num);
setMsg(m);
return true;
}


/*---------------------------------------------------
pre: none
post: element changed
fill the profile select with profile names
---------------------------------------------------*/
function fillPrflSlct(obj=null,elId){
const slct=document.getElementById(elId);
  if(!slct){
  console.log(`${plgInNm}: fillPrflSlct(): no element found with id "${elId}"`);
  return null;
  }

  if(!obj||typeof obj!='object'||!obj.hasOwnProperty('profiles')||Object.keys(obj['profiles'])<=0){
  console.log(`${plgInNm}: fillPrflSlct(): obj param has no profiles`);
  return null;
  }


  for(const inx of Object.keys(obj['profiles'])){
  const opt=document.createElement('option');
  opt.value=inx;
  opt.innerText=inx;
  slct.appendChild(opt);
  }

}

/*---------------------------------------------------
pre:
post:
---------------------------------------------------*/
function floatPnlDt(data, tgl){
const id="extIdNmFltCubeFPnl";

const html=`
  <div class="head" style="margin-bottom:6px; border-radius:6px 6px 0px 0px;overflow: hidden; justify-content:flex-end;">
    <div id="${id}MinBtnId" style="display:flex; margin-left:6px; border-left:1px solid; border-bottom:1px solid; border-right:1px solid; border-radius:3px 3px 3px 3px; cursor:pointer;">⏷</div>
    <div id="${id}MaxBtnId" style="display:none; margin-left:6px; border-left:1px solid; border-bottom:1px solid; border-right:1px solid; border-radius:3px 3px 3px 3px; cursor:pointer;">⏶</div>
    <div id="${id}ClsId" style="display:flex; margin-left:6px; border-left:1px solid; border-bottom:1px solid; border-radius:3px 0px 3px 3px; cursor:pointer; padding:0px 3px 0px 3px;" >x</div>
  </div>

  <div class="content" style="min-width:80px; min-height:60px; display:flex; padding:0px; flex-direction:row; justify-content: space-between;">
    <div id="${id}LftPnl" class="leftPanel" style="flex-grow:4; flex-direction:column; align-items:stretch; overflow:hidden; transition: all 0.3s linear; max-width:500px; max-height:500px; resize:both; overflow: auto; padding: 0px 6px 16px 6px; width:180px;">
      <div style="align-items:center; width:100%; min-width:100px; border:1px solid; border-radius:6px; box-sizing:border-box;">
        <input type="text" id="fltCubeVarFltr" name="varFltr" style="width:100%; border:none;" placeholder="variable filter"/>
        <div style="margin:0px 0px 0px 6px;">🔎</div>
      </div>
      <div style="align-items:center; width:100%; min-width:100px; padding:4px 0px 4px 0px; box-sizing:border-box;" id="${id}LftPnlPth">
        <div style="border-bottom:1px solid; font-size:smaller; flex-grow:2; box-sizing: border-box; padding:2px 4px 2px 4px;">
        State.active.variable
        </div>
      </div>
      <div style="align-items:flex-start; width:100%; min-width:100px; border-bottom:1px solid; margin-bottom:6px; flex-direction:column; font-size: smaller;">
        <div style>money</div>
        <div style>XP</div>
        <div style>Stats</div>
      </div>
      <div style="align-items:flex-start; justify-content:space-between; width:100%; min-width:100px;  font-size: smaller;">
        <div style="box-sizing:border-box;">
          <button name="watch" type="button" style="display:flex;" title="Add to watch list">Watch</button>
        </div> 
        <div style="flex-direction:column; align-items:flex-end; box-sizing:border-box;">
          <button name="edit" type="submit" style="display:flex;width:fit-content;" >Edit</button>
          <div id="${id}Push">
            <div style="width:60px;margin-right:6px;overflow:hidden;resize:horizontal;box-sizing:border-box;border-bottom:1px solid;"><input type="text" name="${id}Indx" style="border:none;width:100%;" placeholder="Index" title="For objects only" /></div>
            <button name="push" type="submit" style="display:flex;width:fit-content;" title="ONLY FOR ARRAYS OR OBJECTS OF LEAF NODES. IE THE ONLY DATA IN THE OBJECT OR ARRAY ARE SCALAR VALUES. For objects, requires an index value">Push</button>
          </div>
          <button name="pop" type="submit" style="display:flex;width:fit-content;" title="ONLY FOR ARRAYS OF LEAF NODES. IE THE ONLY DATA IN THE ARRAY ARE SCALAR VALUES.">Pop</button>
        </div>
      </div>
    </div>
    <div class="${id}RghtPnl" style="border-top:1px solid #AAAAAA;border-left:1px solid #AAAAAA;flex-direction:column; align-items:stretch; justify-content:flex-end; font-size:smaller; min-width:80px;">
      <div id="${id}Watch" style="flex-direction:column;">
        <div id="${id}WatchTtl" style="background-color:#AAAAAA;color:black;padding:0px 3px 0px 3px;">Watch</div>
        <div id="${id}WatchEntrys" style="flex-direction:column; align-items:flex-start; justify-content:flex-start; padding:1px 2px;">
          <div name="State.active.variable.xp" title="State.active.variable.xp">v.xp: 1000</div>
          <div name="State.active.variable.money" title="State.active.variable.money">v.money: 1000</div>
        </div>
      </div>
      <div id="${id}Edt" style="flex-direction:column; max-height:600px; max-width:600px; overflow:hidden; transition:all 0.3s linear; box-sizing:border-box;">
        <div id="${id}EdtTtl" style="background-color:#AAAAAA;color:black;padding:0px 3px 0px 3px;">Edit</div>
        <div id="${id}EdtEntrys" style="flex-direction:column; align-items:flex-start; justify-content:flex-start; padding:1px 2px; width:100%; box-sizing:border-box;">
          <div name="state.active.variable.xp" title="state.active.variable.xp" style="display:flex; flex-direction:row; justify-content:space-between; align-items:flex-start; width:100%;">
            <button type="submit" name="fltCubeEdtId.1" style="display:flex;width:fit-content;text-wrap:nowrap;">set v.xp</button>
            <input type="text" name="fltCubeEdtIdVal.1" placeholder="test" style="display:flex;width:fit-content;flex-grow:1;min-width:160px;width:160px;" />
            <button type="submit" name="fltCubeEdtIdDel.1" title="delete edit" style="display:flex;width:fit-content;">x</button>
          </div>
          <div name="state.active.variable.money" title="state.active.variable.money" style="display:flex; flex-direction:row; justify-content:space-between; align-items:flex-start; width:100%;">
            <button type="submit" name="fltCubeEdtId.1" style="display:flex;width:fit-content;text-wrap:nowrap;">push v.money</button>
            <input type="text" name="fltCubeEdtIdIndx.1" placeholder="indx" style="display:flex;width:fit-content;flex-grow:1;min-width:60px;width:60px;" />
            <input type="number" name="fltCubeEdtIdVal.1" placeholder="test" style="display:flex;width:fit-content;flex-grow:1;min-width:100px;width:100px;" />
            <button type="submit" name="fltCubeEdtIdDel.1" title="delete edit" style="display:flex;width:fit-content;">x</button>
          </div>
          <div name="state.active.variable.events" title="state.active.variable.events" style="display:flex; flex-direction:row; justify-content:space-between; align-items:flex-start; width:100%;">
            <button type="submit" name="fltCubeEdtId.1" style="display:flex;width:fit-content;text-wrap:nowrap;">pop v.events</button>
            <div style="display:flex; flex-grow:2;">&nbsp;</div>
            <button type="submit" name="fltCubeEdtIdDel.1" title="delete edit" style="display:flex;width:fit-content;">x</button>
          </div>
        </div>
      </div>
      <div id="${id}RghtPnlSpcr" style="display:flex; flex-grow:1;">
        &nbsp;
      </div>
      <div id="${id}RghtPnlPrflRow" style="display:flex; flex-direction:row; justify-content:flex-end; align-items:stretch; max-width:300px; max-height:80px; overflow:hidden; transition: all 0.3s linear; align-self:flex-end;">
        <div style="">
          <button style="box-sizing:border-box; border-bottom:0px; border-right:0px; border-radius:3px 3px 0px 3px;">+</button>
          <input type="text" placeholder="testing" style="box-sizing:border-box; border-bottom:0px; border-right:0px; width:100px; border-radius: 3px 3px 0px 0px;"/>
        </div>
        <select id="${id}PrflSlct" style="border-radius:3px 3px 6px 3px; border-left:1px solid; border-top:1px solid; border-bottom:0px; border-right:0px;">
          <option value="">none</option>
        </select>
      </div>
    </div>
  </div>`;


//if float panel is toggled, look to see if floating panel already exists, if so, do nothing
let el=document.getElementById(id);
  if(el && el.nodeType){
  return 0;
  }

//<div id="fPnlId" style="border-color:#AAAAAA;position:fixed;left:50vw;top:30vh;border:1px solid;border-radius:6px;background-color:black;box-sizing:border-box;flex-direction:column;z-index:888888;display:flex;opacity:0.82;" draggable="true" ondragstart="setPos1(event)" ondragend="setPos(event)">

el=document.createElement("div");
el.style.cssText="border-color:#AAAAAA;position:fixed;left:50vw;top:30vh;border:1px solid;border-radius:6px;background-color:black;box-sizing:border-box;flex-direction:column;z-index:888888;display:flex;opacity:0.82;";
el.id=id;
el.draggable=true;

  el.addEventListener("dragstart", (e)=>{
  e.target.setAttribute("prevX", e.offsetX);
  e.target.setAttribute("prevY", e.offsetY);
  });
  el.addEventListener("dragend", (e)=>{
  const pos=e.target.getBoundingClientRect();
  const prevX=e.target.getAttribute("prevX");
  const prevY=e.target.getAttribute("prevY");
  e.target.style.top=(pos.y+e.offsetY-prevY)+"px";
  e.target.style.left=(pos.x+e.offsetX-prevX)+"px";
  });

el.innerHTML=html;

document.body.appendChild(el);

//setting close button
const cls=document.getElementById(`${id}ClsId`)
  if(cls){
    cls.addEventListener('click', (e)=>{
    document.body.removeChild(el);
    });
  }

//min button
const min=document.getElementById(`${id}MinBtnId`);
  if(min){
    min.addEventListener('click',(e)=>{
    const lft=document.getElementById(`${id}LftPnl`);
    lft.style.maxWidth="0px";
    lft.style.maxHeight="0px";
    lft.style.padding="0px";
    const edt=document.getElementById(`${id}Edt`);
    edt.style.maxHeight='0px';
    edt.style.maxWidth='0px';
    e.target.style.display='none';
    e.target.nextElementSibling.style.display="flex";
    const prflRow=document.getElementById(`${id}RghtPnlPrflRow`);
    prflRow.style.maxWidth='0px';
    prflRow.style.maxHeight='0px';
    });
  }

//max button
const max=document.getElementById(`${id}MaxBtnId`);
  if(max){
    max.addEventListener('click',(e)=>{
    const lft=document.getElementById(`${id}LftPnl`);
    lft.style.maxWidth="500px";
    lft.style.maxHeight="500px";
    lft.style.padding="0px 6px 16px 6px";
    const edt=document.getElementById(`${id}Edt`);
    edt.style.maxHeight='500px';
    edt.style.maxWidth='500px';
    e.target.style.display='none';
    e.target.previousElementSibling.style.display="flex";
    const prflRow=document.getElementById(`${id}RghtPnlPrflRow`);
    prflRow.style.maxWidth='300px';
    prflRow.style.maxHeight='80px';
    });
  }


  //filling out profile select
  fillPrflSlct(data,`${id}PrflSlct`); 
}




//================================================= main code run ====================================================
const dfltStrg={
  'global':{
  'enabled':true, //global enable switch
  'onEvent':'click', //which event to update/redraw on.
  'fltPnlTgl':false,
  'startVar':'SugarCube' //the name of the global variable to pull from. Most of what we care about is in SugarCube.State.active.variables
  },
  'profiles':{ //profiles to each game/page

    'example':{
      'match':{
        'State.active.variables.author':{
          'cond':'eq', //incl, not, regex, exist(the variable just exists)
          'val':'Author name'
        }
      },

      'watch':[
        //Why are these arrays while all the others are dot strings? I'm going to have to .split() the dot strings anyways. Might as well save the CPU power when I can.
        //RULE: ONLY WATCHES SCALAR VALUES. REASON BEING ARRAYS OR OBJECTS CAN GET TOO LONG TO DISPLAY.
        ['State','active','variables','xp'], 
        ['State','active','variables','money'] 
      ],

      'edit':{
        'order':[
          //order vars below should be display
          //shallow representation of order of vars to edit for convenience. When in doubt, recalculate from vars.used
          1,
          0
        ],
        'vars':[
          {
          //RULE: ONLY SETS SCALAR VALUES. WILL NOT SET ENTIRE OBJECT OR ARRAYS TO DO COMPLEXITY AS WELL AS HOW DESTRUCTIVE IT CAN BE.
          //Using array here because, save cpu power, but also, want the possibly of have 2 entires to the same variable. i.e. Money=100 and money=9999999
          'path':['State','active','variables','money'],
          'type':'number', //for the most part, use typeof to get the type. BUT typeof [] will always give 'object' and not 'array'. This is used to know what actions are valid.
          'action':'set', //for now, only support set and add. set for scalar values like string and number. Add to do things like [].push or Object[indx]=val
          'val':10000,
          'indx':'indx', //used only for type=='object' when action=='set'
          'used':0, //not really meant for human use. Used to keep track how many times this was used to determine order. Used to calculate edit.order
          'ord':1 //shallow representation of the above for quick look up purposes. If wrong, re-calculate from 'used'
          },
          {
          'path':['State','active','variables','type'],
          'type':'string',
          'action':'set',
          'val':'electric',
          'indx':'indx',
          'used':0,
          'ord':0
          }
        ],
      },

      //this should look almost exactly like edit. It's for values to edit that the user decides to keep on time and don't re-order
      //all rules from edit applies
      'bookmark':{
        'order':[
        0,
        1
        ],
        'vars':[
          {
          'path':['State','active','variables','xp'],
          'type':'number',
          'action':'set',
          'val':10000,
          'indx':'indx',
          'ord':0
          },
          {
          'path':['State','active','variables','item',1],
          'type':'string',
          'action':'set',
          'val':'potion',
          'indx':'indx',
          'ord':1
          }
        ]
      }
    },

  }
}

/*
window['extSARAVars']={
onEl:null,
ignErr:null,
ignrHsh:{},
applyHsh:{},
isApply:false,
curPrfl:null,
curInpt:null,
dmn:window.location.host
}
*/

//document.addEventListener("mouseover", mouseOvrEvnt);

browser.storage.local.get().then(function(d){
  if(Object.keys(d).length<=0){
  console.log("floatingcube: No settings found. Initializing with default.");
  d={ ...dfltStrg }
  }

floatPnlDt(d,true);
/*
//set the hashs for east access
ignrHsh=strToHsh(d.settings.ignrLst);
applyHsh=strToApplyLst(d.settings.applyLst);

//see if need to make hoverid. element.
hoverId(d.settings.hoverId);

isApply=applyHsh.hasOwnProperty(dmn); //current page's domain in applyHsh?


curPrfl=dtrmnPrfl(dmn, d, applyHsh);
//see if floating panel should exist
floatPnlDt(d, d.settings.floatPnl, curPrfl);

  //if this fails, we can't do the rest. Stop here
  if(curPrfl==false){
  console.log("SARA: No profiles found. Nothing to do.");
  browser.runtime.onMessage.addListener(runOnMsg);
  return false;
  }


  //if auto fill on see if domain is not in ignore list, if true, do nothing, if not, find fields and apply
  if(d.settings.autoFill){
    if(!ignrHsh.hasOwnProperty(dmn)){
    //find and fill
    fillNMsg(d.profiles[curPrfl], "Autofill ON\r\nFields Filled: ##num##\r\nProfile: "+curPrfl, d.settings.eventFill);
    }
  }
  //if auto fill not on, see if domain is apply list. If so, apply. If not, do nothing.
  else{
    if(isApply){
    //find and fill
    fillNMsg(d.profiles[curPrfl], "Apply List Fill\r\nFields Filled: ##num##\r\nProfile: "+curPrfl, d.settings.eventFill);
    }
  }
*/

//get message from other parts
//browser.runtime.onMessage.addListener(runOnMsg);
});

})();
