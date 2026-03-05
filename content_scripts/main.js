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
var tmpData=null;
var wht='#AAAAAA';
var blck='black';
var xWdth=window.screen.width;

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

  slct.innerHTML='';
  const prfls=Object.keys(obj['profiles']);  
  prfls.unshift("none");

  for(const inx of prfls){
  const opt=document.createElement('option');
  opt.value=inx=="none"?"":inx;
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
function trvrsPthInVar(v=null, pthArr=null, d=null,){
  if(!v||!pthArr||!d){
  return null;
  }

let cur=v;
  for(const indx of pthArr){
    if(indx==d.global.startVar){
    continue;
    }
    if(cur[indx]==undefined){
    return undefined;
    }
    cur=cur[indx];
  }

return cur;
}

/*-------------------------------------------------------
pre: none
post: none
returns "pointer" to the variable to allow setting to the
variable
params:
  v=global variable, for sugarcube,it's SugarCube
  pth=Array of path to take
  d=global data, for data.global.startVar to knoww where 
    to start
-------------------------------------------------------*/
function getSetVarFrmPath(v=null, pthArr=null, d=null,){
  if(!v||!pthArr||!d){
  return null;
  }

let cur=v;
let max=pthArr.length-1;
  if(max<0){
  return null;
  }
  for(let i=0;i<max;i++){
    if(i==0&&pthArr[i]==d.global.startVar){
    continue;
    }
    if(cur[pthArr[i]]==undefined){
    return undefined;
    }
    cur=cur[pthArr[i]];
  }

return {pos:cur,indx:pthArr[max]};
}

/*----------------------------------------------
pre: none 
post: none
determine if is scalar. Scalar is only numner, string or boolean
----------------------------------------------*/
function isScalar(val=null){
  if(val==undefined||val==null){
  return false;
  }
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
pre: trvrsPthInVar(), global sc var, global data var
post: none
evaluates the sugarcube variable defined by the path and var name. Determines if it's a leaf node or not.

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
let cur=trvrsPthInVar(sc,pthArr,data);


  //if cur is null. This is needed because typeof null returns object
  if(cur==undefined||cur==null){
  evl.leaf=true;
  return evl;
  }

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

  if(cur&&typeof cur=="object"){
  evl.type='object';
  evl.leaf=false;
    /*SugarCube exception
    SugarCube.State will not let you access/list its children and/or indexes properly.
    So, to safeguard against unable to access being seen as a leaf node
    assume all are NOT leaf nodes until otherwise proven. And, to do that
    check ALL members of an object to see if its true. Then and only then
    is it actually true.
    This means that empty objects are treated as NOT leaf nodes. This will cause problems/limit
    the functuality, but it's a trade off I'm willing to accept as there are other varibales
    within SugarCube that does this. And writing to/overwriting values there can cause issues.
    i.e. THIS CANNOT BE SAFELY SOLVED WITH JUST AND IF EXCEPTION. MUST TREAT ALL OF IT LIKE
    THIS FOR SAFETY'S SAKE.
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
el.scrollLeft=el.scrollLeftMax
return infoEl;
}

/*-------------------------------------------------------------------------------
pre: none
post: none
generate elements for each variable type. This does NOT check if the 
-------------------------------------------------------------------------------*/
function applyLftBtn(varNm, varEvl, eId=null){
const elId=eId||`${id}LftPnlBtns`;
const cntnr=document.getElementById(elId);
const tp={
  'string':'text',
  'number':'number'
}

let inpt=null;
let slct=null;
let dv=null;
let edt=null;
let btnDv=null;
let wtch=null;
let psh=null;
let actnDv=null;
let pop=null;
let inptVl=null;
let vlDv=null;

  switch(varEvl.type){
    case 'number':
    case 'string':
    case 'boolean':

    wtch=document.createElement('button');
    wtch.style.cssText="display:flex; text-wrap:nowrap; width:fit-content; min-width:4px; text-shadow:none; margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial;";
    wtch.name="watch";
    wtch.type="button";
    wtch.title="Add to watch list";
    wtch.innerText="Watch";
    wtch.setAttribute('varName',varNm);
    wtch.setAttribute('varPath',path);
    wtch.setAttribute('varType',varEvl.type);
    wtch.setAttribute('clickAction','watch');

      //input field
      if(varEvl.type=='number'||varEvl.type=='string'){
      inpt=document.createElement('input');
      inpt.value=varEvl.val;
      inpt.style.cssText="border:none;padding:0px;width:60px;";
      inpt.name=`${id}EdtValNm`;
      inpt.title="Value to be edited";
      inpt.setAttribute('varVal',varEvl.val);
      inpt.type=tp[varEvl.type];
      inpt.placeholder="value to be set";

        if(varEvl.type=='string'){
        inpt.style.width='100%';
        dv=document.createElement('div');
        dv.style.cssText="width:60px;margin-right:6px;overflow:hidden;resize:horizontal;box-sizing:border-box;border-bottom:1px solid;";
        dv.appendChild(inpt);
        }
      }
      //boolean
      else if(varEvl.type=='boolean'){
      slct=document.createElement('select');
      let opt=document.createElement('option');
      opt.value=true;
      opt.innerText=true;
      slct.appendChild(opt);
      opt=document.createElement('option');
      opt.value=false;
      opt.innerText=false;
      slct.appendChild(opt);

      slct.value=varEvl.val;
      slct.name=`${id}EdtValNm`;
      slct.title="Value to be edited";
      slct.setAttribute('varVal',varEvl.val);
      slct.style.cssText="display:flex;padding:0px;box-sizing:border-box;";
      }
   
    edt=document.createElement('button');
    edt.style.cssText="margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial; text-shadow:none; width:fit-content; text-wrap:nowrap; min-width:4px;";
    edt.type="button";
    edt.name="Edit";
    edt.title="Add to edit list";
    edt.innerText="Edit";
    edt.setAttribute('varName',varNm);
    edt.setAttribute('varPath',path);
    edt.setAttribute('varType',varEvl.type);
    edt.setAttribute('clickAction','edit');
    edt.setAttribute('varValueName',`${id}EdtValNm`);

    btnDv=document.createElement('div');
    btnDv.style.cssText="display:flex;flex-direction:row;justify-content:flex-end;align-items:center;box-sizing:border-box;";
      if(varEvl.type=="boolean"){
      btnDv.appendChild(slct);
      btnDv.appendChild(edt);
      }
      else if(varEvl.type=='string'){
      btnDv.appendChild(dv);
      btnDv.appendChild(edt);
      }
      else if(varEvl.type=='number'){
      btnDv.appendChild(inpt);
      btnDv.appendChild(edt);
      }
    cntnr.appendChild(wtch);
    cntnr.appendChild(btnDv);
    break;


    case 'array':
    inpt=document.createElement('input');
    inpt.value=varEvl.val;
    inpt.style.cssText="border:none;width:100%; padding:0px;";
    inpt.name=`${id}EdtValNm`;
    inpt.title="Value to be pushed";
    inpt.setAttribute('varVal',varEvl.val);
    inpt.type="text";
    inpt.placeholder="value to be pushed";

    dv=document.createElement('div');
    dv.style.cssText="width:60px;margin-right:6px;overflow:hidden;resize:horizontal;box-sizing:border-box;border-bottom:1px solid;";
    dv.appendChild(inpt);

    psh=document.createElement('button');
    psh.style.cssText="margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial; text-shadow:none; width:fit-content; text-wrap:nowrap; min-width:4px;";
    psh.type="button";
    psh.name="Push";
    psh.title="Add push to edit list";
    psh.innerText="Push";
    psh.setAttribute('varName',varNm);
    psh.setAttribute('varPath',path);
    psh.setAttribute('varType',varEvl.type);
    psh.setAttribute('varAction','push');
    psh.setAttribute('clickAction','edit');
    psh.setAttribute('varValueName',`${id}EdtValNm`);

    pop=document.createElement('button');
    pop.style.cssText="margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial; text-shadow:none; width:fit-content; text-wrap:nowrap; min-width:4px;";
    pop.type="button";
    pop.name="Pop";
    pop.title="Add pop to edit list";
    pop.innerText="Pop";
    pop.setAttribute('varName',varNm);
    pop.setAttribute('varPath',path);
    pop.setAttribute('varType',varEvl.type);
    pop.setAttribute('varAction','pop');
    pop.setAttribute('clickAction','edit');


    btnDv=document.createElement('div');
    btnDv.style.cssText="display:flex;flex-direction:row;justify-content:flex-end;align-items:center;box-sizing:border-box;";
    btnDv.appendChild(dv);
    btnDv.appendChild(psh);

    actnDv=document.createElement('div');
    actnDv.style.cssText="display:flex;flex-direction:column;justify-content:flex-start;align-items:flex-end;box-sizing:border-box;";
    actnDv.appendChild(btnDv);
    actnDv.appendChild(pop);

    //was watch button, repurposing for spacer
    wtch=document.createElement('div');
    wtch.style.display='flex';

    cntnr.appendChild(wtch);
    cntnr.appendChild(actnDv);
    break;

    case 'object':
//Push row of buttons
    inpt=document.createElement('input');
    inpt.value=varEvl.val;
    inpt.style.cssText="border:none;width:100%; padding:0px;";
    inpt.name=`${id}PshIndxNm`;
    inpt.title="Index to be set";
    inpt.setAttribute('varVal',varEvl.val);
    inpt.type=tp[varEvl.type];
    inpt.placeholder="index to be set";

    inptVl=document.createElement('input');
    inptVl.value=varEvl.val;
    inptVl.style.cssText="border:none;width:100%; padding:0px;";
    inptVl.name=`${id}PshValNm`;
    inptVl.title="Value to be pushed";
    inptVl.setAttribute('varVal',varEvl.val);
    inptVl.type=tp[varEvl.type];
    inptVl.placeholder="Value to be set";

    dv=document.createElement('div');
    dv.style.cssText="width:60px;margin-right:6px;overflow:hidden;resize:horizontal;box-sizing:border-box;border-bottom:1px solid;";
    dv.appendChild(inpt);

    vlDv=document.createElement('div');
    vlDv.style.cssText="width:60px;margin-right:6px;overflow:hidden;resize:horizontal;box-sizing:border-box;border-bottom:1px solid;";
    vlDv.appendChild(inptVl);


    psh=document.createElement('button');
    psh.style.cssText="margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial; text-shadow:none; width:fit-content; text-wrap:nowrap; min-width:4px;";
    psh.type="button";
    psh.name="Push";
    psh.title="Add push to edit list";
    psh.innerText="Push";
    psh.setAttribute('varName',varNm);
    psh.setAttribute('varPath',path);
    psh.setAttribute('varType',varEvl.type);
    psh.setAttribute('varAction','push');
    psh.setAttribute('clickAction','edit');
    psh.setAttribute('varIndexName',`${id}PshIndxNm`);
    psh.setAttribute('varValueName',`${id}PshValNm`);

    btnDv=document.createElement('div');
    btnDv.style.cssText="display:flex;flex-direction:row;justify-content:flex-end;align-items:center;box-sizing:border-box;";
    btnDv.appendChild(dv);
    btnDv.appendChild(vlDv);
    btnDv.appendChild(psh);

    actnDv=document.createElement('div');
    actnDv.style.cssText="display:flex;flex-direction:column;justify-content:flex-start;align-items:flex-end;box-sizing:border-box;";
    actnDv.appendChild(btnDv);


  //Pop row of buttons
    inpt=document.createElement('input');
    inpt.value=varEvl.val;
    inpt.style.cssText="border:none;width:100%; padding:0px;";
    inpt.name=`${id}PopIndxNm`;
    inpt.title="Index to be set";
    inpt.setAttribute('varVal',varEvl.val);
    inpt.type=tp[varEvl.type];
    inpt.placeholder="index to be set";

    dv=document.createElement('div');
    dv.style.cssText="width:60px;margin-right:6px;overflow:hidden;resize:horizontal;box-sizing:border-box;border-bottom:1px solid;";
    dv.appendChild(inpt);

    pop=document.createElement('button');
    pop.style.cssText="margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial; text-shadow:none; width:fit-content; text-wrap:nowrap; min-width:4px;";
    pop.type="button";
    pop.name="Delete";
    pop.title="Add delete to edit list";
    pop.innerText="Del";
    pop.setAttribute('varName',varNm);
    pop.setAttribute('varPath',path);
    pop.setAttribute('varType',varEvl.type);
    pop.setAttribute('varAction','del');
    pop.setAttribute('clickAction','edit');
    pop.setAttribute('varIndexName',`${id}PopIndxNm`);

    btnDv=document.createElement('div');
    btnDv.style.cssText="display:flex;flex-direction:row;justify-content:flex-end;align-items:center;box-sizing:border-box;";
    btnDv.appendChild(dv);
    btnDv.appendChild(pop);

    actnDv.appendChild(btnDv);

    //was watch button, repurposing for spacer
    wtch=document.createElement('div');
    wtch.style.display='flex';

    cntnr.appendChild(wtch);
    cntnr.appendChild(actnDv);
    break;

    default:
    break;
  }
}

/*----------------------------------------------
pre:
post:
gen names for buttons of paths.
i.e.
  path: [ 
    0: "State"
    1: "active"
    2: "variables"
    3: "lastName"
  ]

generate "v.lastName"
----------------------------------------------*/
function genVarNmFrmPth(pthArr){
const w=pthArr;
return `${w[w.length-2][0]}.${w[w.length-1]}`;
}

/*----------------------------------------------
pre:
post:
gen edit row buttons
  {
  action: "edit"
  indx: ""
  ord: 0
  path: [ 
    0: "State"
    1: "active"
    2: "variables"
    3: "lastName"
  ]
  type: "string"
  used: 0
  
/val: "Silk"
  }
----------------------------------------------*/
function genEdtBtns(v,varId){
const rw=document.createElement('div');
rw.title=v.path.join('.')+', used: '+v.used;
rw.name=v.path.join('.');
rw.style.cssText="display:flex; flex-direction:row; justify-content:space-between; align-items:center; width:100%;";
const btndv=document.createElement('div');
btndv.style.cssText="display:flex; flex-direction:row; justify-content:flex-start; align-items:center;";

let setBtn=null;
let inpt=null; 
let inptIndx=null; 
let del=null;
let opt=null;

  switch(v.type){
    case 'string':
    case 'number':
    setBtn=document.createElement('button');
    setBtn.style.cssText="margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial; text-shadow:none;flex;width:fit-content;text-wrap:nowrap;min-width:4px;";
    setBtn.type='button';
    setBtn.name=`${id}EdtItmId.${varId}`;
    setBtn.setAttribute('varVal',`${id}EdtItmVal.${varId}`);
    setBtn.innerText='set '+genVarNmFrmPth(v['path']);
    setBtn.setAttribute('clickAction','edtItmSet');
    btndv.appendChild(setBtn);

    inpt=document.createElement('input');
    inpt.type=v.type=='number'?'number':'text';
    inpt.name=`${id}EdtItmVal.${varId}`;
    inpt.placeholder='value to set';
    inpt.style.cssText="display:flex;width:fit-content;min-width:60px;padding:1px 2px; border-radius:5px;border-color:#AAAAAA;";
    inpt.value=v.val;
    btndv.appendChild(inpt);

    rw.appendChild(btndv);

    delBtn=document.createElement('button');
    delBtn.style.cssText="margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial; text-shadow:none;min-width:4px;text-wrap:nowrap;width:fit-content;"
    delBtn.type='button';
    delBtn.name=`${id}EdtItmDel.${varId}`;
    delBtn.title='remove';
    delBtn.innerText='🗑';
    delBtn.setAttribute('clickAction','edtItmDel');
    rw.appendChild(delBtn);
    return rw;
    break;

    case 'boolean':
    setBtn=document.createElement('button');
    setBtn.style.cssText="margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial; text-shadow:none;flex;width:fit-content;text-wrap:nowrap;min-width:4px;";
    setBtn.type='button';
    setBtn.name=`${id}EdtItmId.${varId}`;
    setBtn.setAttribute('varVal',`${id}EdtItmVal.${varId}`);
    setBtn.innerText='set '+genVarNmFrmPth(v['path']);
    setBtn.setAttribute('clickAction','edtItmSet');
    btndv.appendChild(setBtn);

    inpt=document.createElement('select');
    inpt.style.cssText="display:flex;width:fit-content;min-width:60px;padding:1px 2px; border-radius:5px;border-color:#AAAAAA;";
    inpt.name=`${id}EdtItmVal.${varId}`;

    opt=document.createElement('option');
    opt.value=true;
    opt.innerText=true;
    inpt.appendChild(opt);
    opt=document.createElement('option');

    opt.value=false;
    opt.innerText=false;
    inpt.appendChild(opt);
    inpt.value=v.val;
    btndv.appendChild(inpt);

    rw.appendChild(btndv);

    delBtn=document.createElement('button');
    delBtn.style.cssText="margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial; text-shadow:none;min-width:4px;text-wrap:nowrap;width:fit-content;"
    delBtn.type='button';
    delBtn.name=`${id}EdtItmDel.${varId}`;
    delBtn.title='remove';
    delBtn.innerText='🗑';
    delBtn.setAttribute('clickAction','edtItmDel');
    rw.appendChild(delBtn);
    return rw;
    break;

    case 'array': //push value or pop from array
    const txt=v.action=='push'?'to':'from';
    setBtn=document.createElement('button');
    setBtn.style.cssText="margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial; text-shadow:none;flex;width:fit-content;text-wrap:nowrap;min-width:4px;";
    setBtn.type='button';
    setBtn.name=`${id}EdtItmId.${varId}`;
    setBtn.setAttribute('varVal',`${id}EdtItmVal.${varId}`);
    setBtn.innerText=v.action+' '+txt+' '+genVarNmFrmPth(v['path']);
    setBtn.setAttribute('clickAction','edtItmSet');
    btndv.appendChild(setBtn);

      if(v.action=='push'){
      inpt=document.createElement('input');
      inpt.type='text';
      inpt.name=`${id}EdtItmVal.${varId}`;
      inpt.placeholder='value to array';
      inpt.style.cssText="display:flex;width:fit-content;min-width:60px;padding:1px 2px; border-radius:5px;border-color:#AAAAAA;";
      inpt.value=v.val;
      btndv.appendChild(inpt);
      }

    rw.appendChild(btndv);

    delBtn=document.createElement('button');
    delBtn.style.cssText="margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial; text-shadow:none;min-width:4px;text-wrap:nowrap;width:fit-content;"
    delBtn.type='button';
    delBtn.name=`${id}EdtItmDel.${varId}`;
    delBtn.title='remove';
    delBtn.innerText='🗑';
    delBtn.setAttribute('clickAction','edtItmDel');
    rw.appendChild(delBtn);
    return rw;
    break;

    case 'object': //push value w/ index or del entry (via index) fro obj
    setBtn=document.createElement('button');
    setBtn.style.cssText="margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial; text-shadow:none;flex;width:fit-content;text-wrap:nowrap;min-width:4px;";
    setBtn.type='button';
    setBtn.name=`${id}EdtItmId.${varId}`;
    setBtn.setAttribute('varIndx',`${id}EdtItmIndx.${varId}`);
    setBtn.setAttribute('varVal',`${id}EdtItmVal.${varId}`);
      if(v.action=='push'){
      setBtn.innerText='push to '+genVarNmFrmPth(v['path']);
      }
      else{
      setBtn.innerText='delete from '+genVarNmFrmPth(v['path']);
      }
    setBtn.setAttribute('clickAction','edtItmSet');
    btndv.appendChild(setBtn);

    inptIndx=document.createElement('input');
    inptIndx.type='text';
    inptIndx.name=`${id}EdtItmIndx.${varId}`;
    inptIndx.placeholder='index for object';
    inptIndx.style.cssText="display:flex;width:fit-content;min-width:60px;padding:1px 2px; border-radius:5px;border-color:#AAAAAA;";
    inptIndx.value=v.indx;
    btndv.appendChild(inptIndx);
   

      if(v.action=='push'){
      inpt=document.createElement('input');
      inpt.type='text';
      inpt.name=`${id}EdtItmVal.${varId}`;
      inpt.placeholder='value to set';
      inpt.style.cssText="display:flex;width:fit-content;min-width:60px;padding:1px 2px; border-radius:5px;border-color:#AAAAAA;";
      inpt.value=v.val;
      btndv.appendChild(inpt);
      }

    rw.appendChild(btndv);

    delBtn=document.createElement('button');
    delBtn.style.cssText="margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial; text-shadow:none;min-width:4px;text-wrap:nowrap;width:fit-content;"
    delBtn.type='button';
    delBtn.name=`${id}EdtItmDel.${varId}`;
    delBtn.title='remove';
    delBtn.innerText='🗑';
    delBtn.setAttribute('clickAction','edtItmDel');
    rw.appendChild(delBtn);

    return rw;
    break;

    default:
    break;
  }


}

/*----------------------------------------------
pre:
post:
Draw edit rows
----------------------------------------------*/
function drwEdt(){
const edt=tmpData.edit;
const vars=edt.vars;
const drwEl=document.getElementById(`${id}EdtEntries`);
drwEl.innerHTML='';

  for(const i of edt.order){
  const v=vars[i];
  
  const btns=genEdtBtns(v,i);

  drwEl.appendChild(btns);
  }
  
}


/*----------------------------------------------
pre: tmpData.edit.vars(optional)
post: tmpData changed

----------------------------------------------*/
function srtVars(vars=null){
const arr=vars||tmpData.edit.vars;
let lst=[];
  for(const i in arr){
  lst.push({id:i, used:Number(arr[i].used)});
  }
lst.sort((a,b)=>Number(b.used)-Number(a.used)); //used in order of largest to smallest

const order=[];

  for(const i in lst){
  const id=lst[i].id;
  order.push(Number(id));
  tmpData.edit.vars[id].ord=i; //writing order back to object for easier access/lookup
  }

tmpData.edit.order=order;
}

/*----------------------------------------------
pre: drwEdt()
post: tmpData changed

----------------------------------------------*/
function addEdt(el){
const vr={ ...tmpl['vars'] };
/*
{
  'path':[],
  'type':'',
  'action':'',
  'val':null,
  'indx':'',//not used for scalars
  'used':0,
  'ord':0
  }
    psh.innerText="Push";
    psh.setAttribute('varName',varNm);
    psh.setAttribute('varPath',path);
    psh.setAttribute('varType',varEvl.type);
    psh.setAttribute('clickAction','edit');
    psh.setAttribute('varValueName',`${id}EdtValNm`);
    psh.setAttribute('varIndexName',`${id}PshIndxNm`);
*/
const varObj={
  'varPath':null,
  'varName':null,
  'varType':null,
  'varAction':null,
  'varValueName':null,
  'varIndexName':null  
}

  for(const i of Object.keys(varObj)){
  varObj[i]=el.getAttribute(i);
  }

const valEl=document.getElementsByName(varObj['varValueName'])[0];
const indxEl=document.getElementsByName(varObj['varIndexName'])[0];
const pthArr=varObj['varPath'].split('.');
  if(pthArr[0]==data.global.startVar){
  pthArr.shift();
  }
  if(varObj.varName){
  pthArr.push(varObj.varName);
  }

vr.path=pthArr;
vr.type=varObj['varType'];
vr.action=varObj['varAction'];
vr.val=valEl?valEl.value:null;
vr.indx=indxEl?indxEl.value:null;

const len=tmpData.edit.vars.push(vr);
//temp
//tmpData.edit.order.push(len-1);
//sortEdts();
srtVars();
drwEdt();
}

/*----------------------------------------------------------------------------
pre: (global) tmpData, trvrsPthInVar() (and what it needs)
post:SugarCube updated
takes the vars object, the values or index, and sets the value into SugarCube
----------------------------------------------------------------------------*/
function setEdt(el){
  if(!el||!el.name){
  return null;
  }
const plls={
  'varindx':undefined,
  'varval':undefined
}

const nm=el.name;
const vrArr=nm.split('.');
const id=Number(vrArr[vrArr.length-1]);
const vr=tmpData.edit.vars[id];
console.log(vr);

  for(const nm of Object.keys(plls)){
  const ref=el.getAttribute(nm);

  const refEl=document.getElementsByName(ref)[0];
    if(refEl){
    plls[nm]=refEl.value;
    }
  }

let cur=getSetVarFrmPath(sc,vr.path,data);

//if undefined, the path didn're resolve or doesn't exist.
  if(cur==undefined||cur==null){
  return null;
  }

let val=null;

  switch(vr.type){
    case 'string':
    case 'number':
    case 'boolean':
      if(vr.type=='string'){
      val=String(plls.varval);
      }
      else if(vr.type=='number'){
      val=Number(plls.varval);
      }
      else if(vr.type=='boolean'){
      val=Boolean(plls.varval);
      }
    cur.pos[cur.indx]=val;
    break;

    case 'array':
      if(!Array.isArray(cur.pos[cur.indx])||!cur.pos[cur.indx]){
      return null;
      }
      if(vr.action=='pop'){
      cur.pos[cur.indx].pop();
      }
      else if(vr.action=='push'&&plls.varval!=undefined){
      cur.pos[cur.indx].push(plls.varval);
      }
    break;

    case 'object':
      if(typeof cur.pos[cur.indx]!='object'||!cur.pos[cur.indx]){
      return null;
      }
      if(vr.action=='del'){
      delete cur.pos[cur.indx][plls.varindx];
      }
      else if(vr.action=='push'){
      cur.pos[cur.indx][plls.varindx]=plls.varval;
      }
    break;

    default:
    return null;
    break;
  }

//up use count
vr.val=plls.varval;
vr.used++;
return 0;
}

/*----------------------------------------------
pre: global tmpData variable
post:
----------------------------------------------*/
function delEdt(el){
  if(!el||!el.getAttribute('name')){
  return null;
  }

const nm=el.name;
const arr=nm.split('.');
const id=arr[arr.length-1];
const vr=tmpData.edit.vars;

const ord=vr.ord;
tmpData.edit.vars.splice(id,1);
tmpData.edit.order.splice(ord,1);
return vr;
}


/*----------------------------------------------
pre: (global) data
post:
key press listener just for filtering
----------------------------------------------*/
function fltrVarsLstnFunc(e){
  if(e.key=="Enter"){
  ppltVarDpth(path, data);
  }
}

/*----------------------------------------------
pre: (global) data
post:
key press listener just for filtering
----------------------------------------------*/
function bodyClckLstnFunc(e){
drwWtch();
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
  let prflTtl=null;

  switch(e.target.getAttribute('clickAction')){

    case 'watch':
    addWtch(e.target);
    drwWtch();
    break;

    case 'watchUp':
    swpWtch(e.target,'up');
    drwWtch();
    break;

    case 'watchDwn':
    swpWtch(e.target,'dwn');
    drwWtch();
    break;

    case 'watchDel':
    delWtch(e.target);
    break;

    case 'edit':
    addEdt(e.target);
    break;

    case 'edtItmSet':
    setEdt(e.target);
    srtVars();
    drwEdt();
    drwWtch();
    break;

    case 'edtItmDel':
    delEdt(e.target);
    srtVars();
    drwEdt();
    drwWtch();
    break;

    case 'rfrshVarsLst':
    ppltVarDpth(path, data);
    break;

    case 'updatePath':
    const vl=e.target.getAttribute('varname');
      if(!vl){
      return null;
      }
    document.getElementById(`${id}VarFltr`).value='';//clears variable name filter
    document.getElementById(`${id}LftPnlBtns`).innerHTML='';//clears buttons
    const v=evalSgrCbVar(path,vl);

      if(v.leaf){
      updtVarSlct(vl, v);
      applyLftBtn(vl, v);
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
    document.getElementById(`${id}LftPnlBtns`).innerHTML='';//clears buttons
    ppltPth(path,`${id}LftPnlPth`);//set current path
    ppltVarDpth(path, data);
    break;

    case 'savePrfl':
    //redraw profile select
    //set profile select to current value
    prflTtl=document.getElementById(`${id}PrflSave`).value;
      if(!prflTtl||prflTtl==""){
      return null;
      }
    data.profiles[prflTtl]=tmpData;
      browser.storage.local.set(data).then((e)=>{
      fillPrflSlct(data,`${id}PrflSlct`); 
      const fl=document.getElementById(`${id}PrflSlct`);
      fl.value=prflTtl; 
      }); 
    break;

    case 'loadPrfl':
      browser.storage.local.get().then((d)=>{
      const fl=document.getElementById(`${id}PrflSlct`);
      document.getElementById(`${id}PrflSave`).value=fl.value;
      data=d;
      tmpData=data.profiles[fl.value];

      ppltPth(path,`${id}LftPnlPth`);//set current path
      ppltVarDpth(path, data);//populate var list
      document.getElementById(`${id}LftPnlBtns`).innerHTML='';//clears buttons
      srtVars();
      drwWtch();
      drwEdt();
      });
    break;

    case 'delPrfl':
    //redraw profile select
    //set profile select to current value
    const prflSlct=document.getElementById(`${id}PrflSlct`);
      if(!prflSlct||prflSlct.value==""){
      return null;
      }
    delete data.profiles[prflSlct.value]
      browser.storage.local.set(data).then((e)=>{
      fillPrflSlct(data,`${id}PrflSlct`); 
      const fl=document.getElementById(`${id}PrflSlct`);
      fl.value=""; 
      }); 

    break;



    default:
    drwWtch();
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
  const cur=trvrsPthInVar(sc, pthArr, d);
 
  let varArr=cur?Object.keys(cur):[];
  
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
  pre: global var sc, data, element id 'WatchEntries'
  post:
  draw watch list from tmp data
  ---------------------------------------------------*/
  function drwWtch(d=null){
    const dt=d||tmpData;
  const wtch=document.getElementById(id+'WatchEntries');
  if(!wtch){
  return null;
  }
  wtch.innerHTML='';
  const w=[ ...tmpData.watch ];
    for(const i in w){
    const rw=document.createElement('div');
    rw.style.cssText="display:flex;flex-direction:row;text-wrap:nowrap;justify-content:space-between;align-items:center;padding:0px;margin:0px;box-sizing:border-box;";
    const dv=document.createElement('div');
    dv.style.cssText=`display:flex;flex-direction:row;text-wrap:nowrap;justify-content:flex-start;align-items:center;margin:0px 6px 0px 0px;padding:2px;border:0px;box-sizing:border-box;`;
    dv.title=w[i].join('.');
    const val=trvrsPthInVar(sc,w[i],data);   
    dv.innerText=genVarNmFrmPth(w[i])+': '+val;
    rw.appendChild(dv);

    const btnDv=document.createElement('div');
    btnDv.style.cssText="display:flex;flex-direction:row;text-wrap:nowrap;justify-content:flex-end;align-items:center;margin:0px;border:0px;box-sizing:border-box;";
    const btnUp=document.createElement('button');
    btnUp.style.cssText="display:flex; justify-content:center; align-items:center; text-wrap:nowrap; width:fit-content; min-width:4px; text-shadow:none; margin:0px 0px 0px 3px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial;width:18px;";
    btnUp.innerText='⏶';
    btnUp.setAttribute('varWatchId',i);
    btnUp.setAttribute('clickAction','watchUp');
    
    const btnDwn=document.createElement('button');
    btnDwn.style.cssText="display:flex; justify-content:center; align-items:center; text-wrap:nowrap; width:fit-content; min-width:4px; text-shadow:none; margin:0px 0px 0px 3px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial;width:18px;";
    btnDwn.innerText='⏷';
    btnDwn.setAttribute('varWatchId',i);
    btnDwn.setAttribute('clickAction','watchDwn');
 

    const del=document.createElement('button');
    del.style.cssText="display:flex; jutif-content:center; align-items:center; text-wrap:nowrap; width:fit-content; min-width:4px; text-shadow:none; margin:0px 0px 0px 3px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial;width:18px;";
    del.innerText='🗑';
    del.setAttribute('varWatchId',i);
    del.setAttribute('clickAction','watchDel');
 

    btnDv.appendChild(btnUp);
    btnDv.appendChild(btnDwn);
    btnDv.appendChild(del);
    rw.appendChild(btnDv);

    wtch.appendChild(rw);
    }
  
  }

  /*---------------------------------------------------
  pre: drwWtch()
  post: draw html
  add to watch then drwWtch()
  *NOTE* ONLY WATCH SCALARS. NOT OBJECTS, NOT ARRAYS, SCALARS
  ---------------------------------------------------*/
  function addWtch(el){
  const varObj={
    'varName':null,
    'varPath':null,
    'varType':null
  };
    for(const i of Object.keys(varObj)){
    varObj[i]=el.getAttribute(i);
    }

    if(varObj['varPath']&&typeof varObj['varPath']=='string'){
    const arr=varObj['varPath'].split('.');
      if(arr[0]==data.global.startVar){
      arr.shift();
      }
    arr.push(varObj.varName);
    tmpData.watch.push([ ...arr ]);
    }
  }

  /*---------------------------------------------------
  pre: drwWtch()
  post: draw html
  del to watch item
  ---------------------------------------------------*/
  function delWtch(el){
  const varObj={
    'varWatchId':null
  };
    for(const i of Object.keys(varObj)){
    varObj[i]=el.getAttribute(i);
    }

    if(varObj['varWatchId']!=null){
    tmpData.watch.splice(Number(varObj['varWatchId']),1);
    }

  drwWtch();
  }

  /*---------------------------------------------------
  pre: drwWtch()
  post: draw html
  swap watch items up or down
  ---------------------------------------------------*/
  function swpWtch(el,dir=null){
    if(!el||(dir!='up'&&dir!='dwn')){
    return null;
    }
  const id=Number(el.getAttribute('varWatchId'));
  const buff=tmpData.watch[id];
  const max=tmpData.watch.length-1;
  
  let nid=dir=='up'?id-1:id+1;

  //if id is out of range, do nothing
    if(nid<0||nid>max){
    return null;
    }

  tmpData.watch[id]=tmpData.watch[nid];
  tmpData.watch[nid]=buff;

  drwWtch();
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
          <div id="${id}VarFltrBtn" style="display:flex; cursor:pointer; margin:0px 6px 0px 6px;" clickAction="rfrshVarsLst">🔎</div>
        </div>
        <div style="align-items:center; width:100%; min-width:100px; padding:4px 2px 4px 2px; box-sizing:border-box; border-bottom:1px solid; font-size:smaller; display:flex; justify-content:flex-start; align-items:center; overflow:auto;" id="${id}LftPnlPth">
          State.active.variables
        </div>
        <div id="${id}LftPnlVarLst" style="display:flex; align-items:stretch; width:100%; min-width:100px; border-bottom:1px solid; flex-direction:column; font-size: smaller; max-height:350px; overflow:auto;">
         none (reload) 
        </div>
        <div id="${id}LftPnlVarSlct" style="display:flex; flex-direction:row; align-items:flex-start; justify-content:flex-start; box-sizing:border-box; margin:2px 2px 3px 2px; padding-bottom:6px; overflow:auto; text-wrap:nowrap;">
        </div>
        <div id="${id}LftPnlBtns" style="display:flex; align-items:flex-start; justify-content:space-between; width:100%; min-width:100px; font-size: smaller;">
          &nbsp;
        </div>
      </div>
      <div class="${id}RghtPnl" style="display:flex; border-top:1px solid #AAAAAA;border-left:1px solid #AAAAAA;flex-direction:column; align-items:stretch; justify-content:flex-end; font-size:smaller; min-width:80px;">
        <div id="${id}Watch" style="flex-direction:column; display:flex; text-shadow:none;">
          <div id="${id}WatchTtl" style="background-color:#AAAAAA;color:black;padding:0px 3px 0px 3px;">Watch</div>
          <div id="${id}WatchEntries" style="flex-direction:column; align-items:flex-start; justify-content:flex-start; padding:1px 2px;">
          </div>
        </div>
        <div id="${id}Edt" style="display:flex; text-shadow:none; flex-direction:column; max-height:600px; max-width:600px; overflow:hidden; transition:all 0.3s linear; box-sizing:border-box;">
          <div id="${id}EdtTtl" style="display:flex; background-color:#AAAAAA;color:black;padding:0px 3px 0px 3px;">Edit</div>
          <div id="${id}EdtEntries" style="flex-direction:column; align-items:flex-start; justify-content:flex-start; padding:1px 2px; width:100%; box-sizing:border-box;">
          </div>
        </div>
        <div id="${id}RghtPnlSpcr" style="display:flex; flex-grow:1;">
          &nbsp;
        </div>
        <div id="${id}RghtPnlPrflRow" style="display:flex; flex-direction:row; justify-content:flex-end; align-items:stretch; max-width:300px; max-height:80px; overflow:hidden; transition: all 0.3s linear; align-self:flex-end;">
          <div style="display:flex; flex-direction:row; justify-content:flex-end; align-items:center;">
            <button style="margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial; text-shadow:none;box-sizing:border-box; border-bottom:0px; border-right:0px; border-radius:3px 3px 0px 3px;width:fit-content;text-wrap:nowrap;min-width:4px;justify-content:cener;align-items:center;" clickAction="savePrfl">save</button>
            <input id="${id}PrflSave" type="text" placeholder="new profile name" style="box-sizing:border-box; border-bottom:0px; border-right:0px; width:100px; border-radius: 5px 5px 0px 0px; padding:1px 2px; border-color:#AAAAAA; min-width:80px;"/>
          </div>
          <button style="margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial; text-shadow:none;box-sizing:border-box; border-bottom:0px; border-right:0px; border-radius:3px 3px 0px 3px;width:fit-content;text-wrap:nowrap;min-width:4px;justify-content:center;align-items:center;" clickAction="loadPrfl">load</button>
          <select id="${id}PrflSlct" style="display:flex; border-color:#AAAAAA; border-radius:3px 3px 6px 3px; border-left:1px solid #AAAAAA; border-top:1px solid #AAAAAA; border-bottom:0px; border-right:0px; padding:1px 2px;">
            <option value="">none</option>
          </select>
          <button style="margin:0px; display:flex; background-color:#AAAAAA; color:black; padding:1px 4px; border-radius:6px; border:1px solid #666666; font-family:initial; text-shadow:none;box-sizing:border-box; border-bottom:0px; border-right:0px; border-radius:3px 3px 0px 3px;width:fit-content;text-wrap:nowrap;min-width:4px;justify-content:center;align-items:center;" clickAction="delPrfl">🗑</button>
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
  el.style.cssText="border-color:#AAAAAA;position:fixed;left:40vw;top:20vh;border:1px solid;border-radius:6px;background-color:black;box-sizing:border-box;flex-direction:column;z-index:888888;display:flex;opacity:0.78;transition: all 0.3s linear;";
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

    //recording max right x position for later minimization
    const fltPnl=document.getElementById(id); 
    const fpPos=fltPnl.getBoundingClientRect();
    console.log(fpPos);
    console.log(e);
    xWdth=fpPos.x+fpPos.width; 
      if(xWdth>=window.screen.width){ 
      xWdth=window.screen.width; 
      }
    console.log(`xWdth: ${xWdth}, window.screen.width: ${window.screen.width}, floatPanel.x: ${fpPos.x}, floatPanel.width: ${fpPos.width}, `);
    });
  
  el.innerHTML=html;
  
  document.body.appendChild(el);
  
  //trnadition for minimization
  el.addEventListener('transitionend',(e)=>{
    if(e.propertyName=='max-width'){
    const el=document.getElementById(id);
    const npos=el.getBoundingClientRect();
    const newx=xWdth-npos.width;
    el.style.left=newx+"px";
    }
  });


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

  //draw watches
  drwWtch();
 
  //draw edits
  srtVars();
  drwEdt();
 
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
  document.getElementById(`${id}VarFltr`).addEventListener('keypress',fltrVarsLstnFunc);
  document.body.addEventListener('click',bodyClckLstnFunc);
 
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
        ],//in a bookmark, this is authoritative. Ord is the shallow representation.
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

const bkmrkTmpl={
  'order':[],
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

const tmpl={
  'bookmark':{
  'order':[],
  'vars':[],
  },
  'vars':{
  'path':[],
  'type':'',
  'action':'',
  'val':null,
  'indx':'',
  'used':0,
  'ord':0
  },
  'tmpData':{
    'watch':[],
    'edit':{
      'order':[0,1],
      'vars':[]
    },
    'bookmarks':{
      'order':[],
      'vars':[]
    }
  }
}

  //document.addEventListener("mouseover", mouseOvrEvnt);
  browser.storage.local.get().then(function(d){
    if(Object.keys(d).length<=0){
    logger('No settings found. Initializing with default.');
    d={ ...dfltStrg }
    }

  data=d;//setting data for global use
  tmpData={ ...tmpl['tmpData'] }; //for when there's no profile
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

  browser.runtime.onMessage.addListener((e)=>{
    switch(e.action){
      case 'floatPanel':
      const el=document.getElementById(id);
        if(e.msg.val&&!el){
        floatPnlDt(data,data.global.fltPnlTgl);
        }
      break;
      default:
      break;
    }
  });

})();

