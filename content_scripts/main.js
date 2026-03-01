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
const id="extIdNmFltCubeFPnl";
var path="";
var sc=null; //will hold the base variable (SugarCube)
var data=null;//floatingCube data
var wht='#AAAAAA';
var blck='black';

var cssText={
  'highlight':`display: flex; cursor: pointer; background-color:${wht}; color:${blck}; text-shadow:none;`,
  'dehighlight':`display: flex; cursor: pointer;`,
}


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


/*--------------------------
pre:
post:
unifying console.log
--------------------------*/
function logger(str){
const lgStrt='floatingcube: ';
console.log(lgStrt+str);
}

/*--------------------------
pre:
post:
populate variable path
--------------------------*/
function ppltPth(str, eId=null){
const elId=eId||`${id}LftPnlPth`
const el=document.getElementById(elId);
el.innerText=str;
el.scrollLeft=el.scrollLeftMax;
}

/*---------------------------
pre:
post:
default split path
---------------------------*/
function spltPth(pth=null){
  if(!pth){
  return null;
  }
return pth.split('.');
}

/*---------------------------
pre:
post:
default split path
---------------------------*/
function addPth(vl=null){
  if(!vl){
  return null;
  }
  path+='.'+vl
return path;
}

/*---------------------------
pre: data.global.startVar
post:
pop from path. A function to add safe guards
---------------------------*/
function popPth(){
let pthArr=path.split('.');
pthArr.pop();
  if(pthArr<=0){
  pthArr=[data.global.startVar];
  }
path=pthArr.join('.');
return path;
}



/*-------------------------------------------------------
pre: none
post: none
returns variable/"pointer" to where in variable (i.e. 
SugarCube.State.active.variable.events) the pthArr takes you
-------------------------------------------------------*/
function trvsPthInVar(v=null, pthArr=null, d=null){
  if(!v||!pthArr||!d){
  return null;
  }

let cur=v
  for(const indx of pthArr){
    if(indx==d.global.startVar){
    continue;
    }
    cur=cur[indx];
  }

return cur;
}


/*----------------------------------------------
pre: none 
post: none
determine if is scalar. Scalar is only numner, string or boolean
----------------------------------------------*/
function isScalar(val=null){
  switch(typeof val){
    case 'number':
    return true;
    break;
    case 'string':
    return true;
    break;
    case 'boolean':
    return true;
    break;
    default:
    return false;
    break;
  }
return false; 
}

/*---------------------------------------------------------------------------------------------------------------------------
pre: trvsPthInVar(), global sc var, global data var
post: none
evaluates the sugarcube variable. Returns one of

*NOTE* SugarCube.State and SugarCube.State.active get weird

SugarCube.State, in this plugin, will not you list its children.
---------------------------------------------------------------------------------------------------------------------------*/
function evalSgrCbVar(path=null, varNm=null){
  const evl={
  'type':null,
  'leaf':null,
  'val':null
  }

  //bad values
  if(!path){
  return evl;
  }

const pthArr=spltPth(path);
  if(varNm){
    pthArr.push(varNm);
  }
let cur=trvsPthInVar(sc,pthArr,data);

  //if array, if any member of the array is NOT scalar, i.e. not number, string or boolean, not a leaf
  if(Array.isArray(cur)){
  evl.type='array';
  evl.leaf=true;
    for(const a of cur){
      //if any not scalar, is not leaf
      if(!isScalar(a)){
      evl.leaf=false;
      return evl;
      } 
    }
  return evl;
  }

  if(typeof cur=="object"){
  evl.type='object';
  evl.leaf=false;
    /*SugarCube exception
    SugarCube.State will not let you access/list its children and/or indexes properly.
    So, to safeguard against unable to access being seen as a leaf node
    assume all are NOT leaf nodes until otherwise proven. And, to do that
    check ALL members of an object to see if its true. Then and only then
    is it actually true.
    */
    let flag=null;
    for(const n of Object.keys(cur)){
      if(isScalar(cur[n])){
      flag=true;
      }
      else{
      flag=false;
      break;
      }
    }
    if(flag==true){
    evl.leaf=true;
    return evl;
    }
  return evl;
  }


evl.type=typeof cur;
evl.leaf=false;
  if(isScalar(cur)){
  evl.leaf=true;
  evl.val=cur;
  return evl;
  }

return evl;
}


/*-------------------------------------------------------------------------------
pre:
post:
update the variable selected element
-------------------------------------------------------------------------------*/
function updtVarSlct(varNm, varEvl, elId=null){
let varSlctId=elId;
  if(!varSlctId){
    varSlctId=id+'LftPnlVarSlct';
  }
const el=document.getElementById(varSlctId);
const infoEl=document.createElement('div');
infoEl.innerText=`${varNm}(${varEvl.type})`;
  if(varEvl.val!=null||varEvl.val!=undefined){
  infoEl.innerText+=': '+varEvl.val;
  }

el.innerHTML='';

el.appendChild(infoEl);

return infoEl;
}

/*----------------------------------------------
pre: (global) data
post:
Click listener function for the float panel (or more)
processes all clicks events
----------------------------------------------*/
function clckLstnFunc(e){
  //refreshing sc as default action
  sc=window.wrappedJSObject[data.global.startVar];
  XPCNativeWrapper(window.wrappedJSObject[data.global.startVar]);

  switch(e.target.getAttribute('clickAction')){
    case 'updatePath':
    const vl=e.target.getAttribute('varname');
      if(!vl){
      return null;
      }
    document.getElementById(`${id}VarFltr`).value='';
    const v=evalSgrCbVar(path,vl);
      if(v.leaf){
      updtVarSlct(vl, v);
      }

      if(v.type=="object"||v.type=="array"){
      addPth(vl);
      ppltPth(path,`${id}LftPnlPth`);//set current path
      ppltVarDpth(path, data);//populate var list
      return null;
      }
    break;

    case 'backPath':
    popPth();
    document.getElementById(id+'LftPnlVarSlct').innerHTML='';
    ppltPth(path,`${id}LftPnlPth`);//set current path
    ppltVarDpth(path, data);
    break;

    default:
    ppltVarDpth(path, data);
    break;
  }
}

/*----------------------------------------------
pre: (global) data
post:
mouseover listener function for the float panel (or more)
processes all clicks events
----------------------------------------------*/
function mouseOvrLstnFunc(e){
  switch(e.target.getAttribute('mouseOverAction')){
    case 'highlight':
      e.target.style.cssText=cssText.highlight;
    break;
    default:
    break;
  }
}

/*----------------------------------------------
pre: (global) data
post:
mouseout listener function for the float panel (or more)
processes all clicks events
----------------------------------------------*/
function mouseOutLstnFunc(e){
  switch(e.target.getAttribute('mouseOutAction')){
    case 'dehighlight':
      e.target.style.cssText=cssText.dehighlight;
    break;
    default:
    break;
  }
}


/*--------------------------
pre: glocal var sc
post:
populate the element with the variables/index of the current level.
path needs to be at an object or array. NOT SCALAR
--------------------------*/
function ppltVarDpth(path, d, eId=null, fId=null){
//id+'LftPnlVarLst', id+'VarFltr'
const elId=eId||`${id}LftPnlVarLst`;
const fltrId=fId||`${id}VarFltr`;
const el=document.getElementById(elId);
  if(!el){
  return null;
  }

const pthArr=spltPth(path);
const cur=trvsPthInVar(sc, pthArr, d);

let varArr=Object.keys(cur);

//filter
const fltr=document.getElementById(fltrId);
  if(fltr&&fltr.value&&fltr.value!=""){
  varArr=varArr.filter(e=>e.toLocaleLowerCase().includes(fltr.value.toLocaleLowerCase()));
  }

varArr.sort();//sorting for ease of lookup

//filling populating elId with var names
el.innerHTML='';

let tmpEl=null;
//back button only if there's more than 1 element in path
  if(pthArr.length>1){
  tmpEl=document.createElement('div');
  tmpEl.innerText='<< BACK';
  tmpEl.setAttribute('clickAction', 'backPath');
  tmpEl.setAttribute('mouseOverAction', 'highlight');
  tmpEl.setAttribute('mouseOutAction', 'dehighlight');
  tmpEl.style.cssText=cssText.dehighlight;
  el.appendChild(tmpEl);
  }

  /*
  exception for Sugar.State since it doesn't let you view it's members
  */
  if(pthArr[0]=="SugarCube"&&pthArr[1]=="State"&&pthArr.length==2){
  tmpEl=document.createElement('div');
  tmpEl.innerText='active';
  tmpEl.setAttribute('clickAction', 'updatePath');
  tmpEl.setAttribute('mouseOverAction', 'highlight');
  tmpEl.setAttribute('mouseOutAction', 'dehighlight');
  tmpEl.setAttribute('varName','active');
  tmpEl.style.cssText=cssText.dehighlight;
  el.appendChild(tmpEl);
  return 0;
  }


  //if none. display none
  if(varArr.length<=0){
  tmpEl=document.createElement('div');
  tmpEl.innerText='No Results';
  el.appendChild(tmpEl);
  return 0;
  }

  for(const val of varArr){
  tmpEl=document.createElement('div');
  tmpEl.innerText=val;
  tmpEl.setAttribute('clickAction', 'updatePath');
  tmpEl.setAttribute('mouseOverAction', 'highlight');
  tmpEl.setAttribute('mouseOutAction', 'dehighlight');
  tmpEl.setAttribute('varName',val);
  tmpEl.style.cssText=cssText.dehighlight;
  
  el.appendChild(tmpEl);
  }

return 0;
}


  /*---------------------------------------------------
  pre:
  post:
  ---------------------------------------------------*/
  function floatPnlDt(data, tgl){
  
  const html=`
    <div id="${id}HeadSpcr" class="head" style="display:flex; margin-bottom:6px; border-radius:6px 6px 0px 0px; overflow: hidden; justify-content:flex-end; flex-direction:row;">
      <div id="${id}MinBtnId" style="display:flex; margin-left:6px; border-left:1px solid; border-bottom:1px solid; border-right:1px solid; border-radius:3px; cursor:pointer;">⏷</div>
      <div id="${id}MaxBtnId" style="display:none; margin-left:6px; border-left:1px solid; border-bottom:1px solid; border-right:1px solid; border-radius:3px; cursor:pointer;">⏶</div>
      <div id="${id}ClsId" style="display:flex; margin-left:6px; border-left:1px solid; border-bottom:1px solid; border-radius:3px 0px 3px 3px; cursor:pointer; padding:0px 3px 0px 3px;" >x</div>
    </div>
  
    <div id="${id}Cntnt" class="content" style="min-width:80px; min-height:60px; display:flex; padding:0px; flex-direction:row; justify-content: space-between;">
      <div id="${id}LftPnl" class="leftPanel" style="flex-grow:4; flex-direction:column; align-items:stretch; overflow:hidden; transition: all 0.3s linear; max-width:500px; max-height:500px; resize:both; overflow: auto; padding: 0px 6px 16px 6px; width:180px;">
        <div style="display:flex; align-items:center; width:100%; min-width:100px; border:1px solid; border-radius:6px; box-sizing:border-box; overflow:hidden;">
          <input type="text" id="${id}VarFltr" name="varFltr" style="display:flex; border-radius:5px; flex-grow:1; border:none; min-width:100px; font-size:small;" placeholder="variable filter"/>
          <div id="${id}VarFltrBtn" style="display:flex; cursor:pointer; margin:0px 6px 0px 6px;">🔎</div>
        </div>
        <div style="align-items:center; width:100%; min-width:100px; padding:4px 2px 4px 2px; box-sizing:border-box; border-bottom:1px solid; font-size:smaller; display:flex; justify-content:flex-start; align-items:center; overflow:auto;" id="${id}LftPnlPth">
          State.active.variables
        </div>
        <div id="${id}LftPnlVarLst" style="display:flex; align-items:stretch; width:100%; min-width:100px; border-bottom:1px solid; flex-direction:column; font-size: smaller; max-height:350px; overflow:auto;">
         none (reload) 
        </div>
        <div id="${id}LftPnlVarSlct" style="display:flex; flex-direction:row; align-items:flex-start; justify-content:flex-start; box-sizing:border-box; margin:2px 2px 3px 2px; padding-bottom:6px; overflow:auto; text-wrap:nowrap;">
        </div>
        <div style="display:flex; align-items:flex-start; justify-content:space-between; width:100%; min-width:100px; font-size: smaller;">
          <div style="display:flex; flex-direction:column; align-items:flex-start; justify-content:flex-start; box-sizing:border-box;">
            <button style="display:flex; text-wrap:nowrap; width:fit-content; min-width:4px; text-shadow:none; margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial;" name="watch" type="button" title="Add to watch list">Watch</button>
          </div> 
          <div style="display:flex; flex-direction:column; align-items:flex-end; justify-content:flex-start; box-sizing:border-box;">
            <button style="margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial; text-shadow:none;" name="edit" type="submit" style="display:flex;width:fit-content; text-wrap:nowrap; min-width:4px;" >Edit</button>
            <div id="${id}Push" style="display:flex; flex-direction:row; justify-content:flex-end; align-items:center;">
              <div style="width:60px;margin-right:6px;overflow:hidden;resize:horizontal;box-sizing:border-box;border-bottom:1px solid;"><input type="text" name="${id}Indx" style="border:none;width:100%; padding:0px;" placeholder="Index" title="For objects only" /></div>
              <button style="margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial; text-shadow:none; text-wrap:nowrap; width:fit-content; min-width:4px;" name="push" type="submit" style="display:flex;width:fit-content;" title="ONLY FOR ARRAYS OR OBJECTS OF LEAF NODES. IE THE ONLY DATA IN THE OBJECT OR ARRAY ARE SCALAR VALUES. For objects, requires an index value">Push</button>
            </div>
            <button style="margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial; text-shadow:none;text-wrap:nowrap; width:fit-content; min-width:4px;" name="pop" type="submit" style="display:flex;width:fit-content;" title="ONLY FOR ARRAYS OF LEAF NODES. IE THE ONLY DATA IN THE ARRAY ARE SCALAR VALUES.">Pop</button>
          </div>
        </div>
      </div>
      <div class="${id}RghtPnl" style="display:flex; border-top:1px solid #AAAAAA;border-left:1px solid #AAAAAA;flex-direction:column; align-items:stretch; justify-content:flex-end; font-size:smaller; min-width:80px;">
        <div id="${id}Watch" style="flex-direction:column; display:flex; text-shadow:none;">
          <div id="${id}WatchTtl" style="background-color:#AAAAAA;color:black;padding:0px 3px 0px 3px;">Watch</div>
          <div id="${id}WatchEntrys" style="flex-direction:column; align-items:flex-start; justify-content:flex-start; padding:1px 2px;">
            <div name="State.active.variable.xp" title="State.active.variable.xp">v.xp: 1000</div>
            <div name="State.active.variable.money" title="State.active.variable.money">v.money: 1000</div>
          </div>
        </div>
        <div id="${id}Edt" style="display:flex; text-shadow:none; flex-direction:column; max-height:600px; max-width:600px; overflow:hidden; transition:all 0.3s linear; box-sizing:border-box;">
          <div id="${id}EdtTtl" style="display:flex; background-color:#AAAAAA;color:black;padding:0px 3px 0px 3px;">Edit</div>
          <div id="${id}EdtEntrys" style="flex-direction:column; align-items:flex-start; justify-content:flex-start; padding:1px 2px; width:100%; box-sizing:border-box;">
            <div name="state.active.variable.xp" title="state.active.variable.xp" style="display:flex; flex-direction:row; justify-content:space-between; align-items:center; width:100%;">
              <button style="margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial; text-shadow:none;flex;width:fit-content;text-wrap:nowrap;min-width:4px;" type="submit" name="fltCubeEdtId.1" >set v.xp</button>
              <input type="text" name="fltCubeEdtIdVal.1" placeholder="test" style="display:flex;width:fit-content;flex-grow:1;min-width:160px;width:160px;padding:1px 2px; border-radius:5px;border-color:#AAAAAA;" />
              <button style="margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial; text-shadow:none;min-width:4px;text-wrap:nowrap;width:fit-content;" type="submit" name="fltCubeEdtIdDel.1" title="delete edit" >x</button>
            </div>
            <div name="state.active.variable.money" title="state.active.variable.money" style="display:flex; flex-direction:row; justify-content:space-between; align-items:center; width:100%;">
              <button style="margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial; text-shadow:none;width:fit-content;text-wrap:nowrap;min-width:4px;" type="submit" name="fltCubeEdtId.1" >push v.money</button>
              <input type="text" name="fltCubeEdtIdIndx.1" placeholder="indx" style="display:flex;width:fit-content;flex-grow:1;min-width:60px;width:60px;border-radius:5px;padding:1px 2px;border-color:#AAAAAA;" />
              <input type="number" name="fltCubeEdtIdVal.1" placeholder="test" style="display:flex;width:fit-content;flex-grow:1;min-width:100px;width:100px;border-radius:5px;padding:1px 2px;border-color:#AAAAAA;" />
              <button style="margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial; text-shadow:none;text-wrap:nowrap;width:fit-content;min-width:4px;" type="submit" name="fltCubeEdtIdDel.1" title="delete edit" >x</button>
            </div>
            <div name="state.active.variable.events" title="state.active.variable.events" style="display:flex; flex-direction:row; justify-content:space-between; align-items:flex-start; width:100%;">
              <button style="margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial; text-shadow:none;width:fit-content;text-wrap:nowrap;min-width:4px;" type="submit" name="fltCubeEdtId.1" >pop v.events</button>
              <div style="display:flex; flex-grow:2;">&nbsp;</div>
              <button style="margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial; text-shadow:none;width:fit-content;text-wrap:nowrap;min-width:4px;" type="submit" name="fltCubeEdtIdDel.1" title="delete edit">x</button>
            </div>
          </div>
        </div>
        <div id="${id}RghtPnlSpcr" style="display:flex; flex-grow:1;">
          &nbsp;
        </div>
        <div id="${id}RghtPnlPrflRow" style="display:flex; flex-direction:row; justify-content:flex-end; align-items:stretch; max-width:300px; max-height:80px; overflow:hidden; transition: all 0.3s linear; align-self:flex-end;">
          <div style="display:flex; flex-direction:row; justify-content:flex-end; align-items:center;">
            <button style="margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial; text-shadow:none;box-sizing:border-box; border-bottom:0px; border-right:0px; border-radius:3px 3px 0px 3px;width:fit-content;text-wrap:nowrap;min-width:4px;">+</button>
            <input type="text" placeholder="testing" style="box-sizing:border-box; border-bottom:0px; border-right:0px; width:100px; border-radius: 5px 5px 0px 0px; padding:1px 2px; border-color:#AAAAAA; min-width:80px;"/>
          </div>
          <select id="${id}PrflSlct" style="display:flex; border-color:#AAAAAA; border-radius:3px 3px 6px 3px; border-left:1px solid #AAAAAA; border-top:1px solid #AAAAAA; border-bottom:0px; border-right:0px; padding:1px 2px;">
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
  
  //toggle off. Don't create panel and remove existing panel
    if(!tgl){
      if(el){
      logger('Toggle set to false. Removing existing floating panel'); 
      document.body.removeChild(el);
      }
    return 0;
    }
  
  
  el=document.createElement("div");
  el.style.cssText="border-color:#AAAAAA;position:fixed;left:50vw;top:30vh;border:1px solid;border-radius:6px;background-color:black;box-sizing:border-box;flex-direction:column;z-index:888888;display:flex;opacity:0.78;";
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
  
  path=(!path||path=="")?data.global.dfltPth:path;
  
  //fill out path
  ppltPth(path,`${id}LftPnlPth`);//set current path

  //fill variables from path
  ppltVarDpth(path, data, id+'LftPnlVarLst', id+'VarFltr');
 
  el.addEventListener('click',clckLstnFunc);
  el.addEventListener('mouseover',mouseOvrLstnFunc);
  el.addEventListener('mouseout',mouseOutLstnFunc);
  //replace with someting better later
  document.getElementById(`${id}VarFltr`).addEventListener('keypress',(e)=>{
    if(e.key=="Enter"){
    ppltVarDpth(path, data);
    }
  });
 
  return el;
  }




//================================================= main code run ====================================================
const dfltStrg={
  'global':{
  'enabled':true, //global enable switch
  'onEvent':'click', //which event to update/redraw on.
  'fltPnlTgl':true,
  'startVar':'SugarCube', //the name of the global variable to pull from. Most of what we care about is in SugarCube.State.active.variables
  'format':'SugarCube',
  'dfltPth':'SugarCube.State.active.variables'
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


  //document.addEventListener("mouseover", mouseOvrEvnt);
  const glblVarNm='fltCubeVar';
  browser.storage.local.get().then(function(d){
    if(Object.keys(d).length<=0){
    logger('No settings found. Initializing with default.');
    d={ ...dfltStrg }
    }
  
  data=d;//setting data for global use
  
    if(!d.global.enabled){
    logger('Plugin not enabled.');
    return null;
    }
  
    
  
  //check if this is a SugarCube page, if not, do nothing.
  const twEls=document.getElementsByTagName('tw-storydata');
    if(!twEls||twEls.length<=0||!twEls[0].hasAttribute('format')||twEls[0].getAttribute('format')!=data.global.format){
    logger(`Could not find tw-storydata with format==${data.global.format}. Not starting.`);
    return null;
    }

  //populating sc
    if(!sc&&window.wrappedJSObject.hasOwnProperty(data.global.startVar)){
    sc=window.wrappedJSObject[data.global.startVar]; //
    /*Mozilla docs said it's best practice to do this
    https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts#xray_vision_in_firefox
    It says to read a page for more details but the page it links to doesn't go into detail. I still don't understand what it means
    that it's "unwrapped" and that it needs to be "rewrap", especially if we're only pulling on variable.
    */
    XPCNativeWrapper(window.wrappedJSObject[data.global.startVar]);
    }

  //adding on click event listener to the floating panel so that, on click,it can refresh values.
  logger(`Starting. Panel toggle is ${data.global.fltPnlTgl}`);
  const fPnl=floatPnlDt(d,data.global.fltPnlTgl);

  });
})();

