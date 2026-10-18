import {emailjsConfig} from './emailjs-config.mjs';
import {isEmailConfigured,sendDiagnostic} from './emailjs-client.mjs';
import {requestModes,fieldLabels,buildLead,emailBody,getCampaign,fingerprint,acceptedBefore,rememberAccepted,clearHistory} from './lead-model.mjs';

const $=selector=>document.querySelector(selector);
const form=$('#lead-form');
const fieldsets=[...form.querySelectorAll('[data-step]')];
const next=$('#next'),back=$('#back'),error=$('#form-error'),result=$('#result');
const sendButton=$('#send-request'),sendStatus=$('#send-status');
let mode='diagnostic',step=0,prepared=null,sending=false;
const campaign=getCampaign(location.search);
// A blocked browser storage API must not prevent completion of a request.
let storage;
try {storage=localStorage;} catch {storage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};}
function showStep(index,focus=true) {
  step=index;
  fieldsets.forEach((item,i)=>{item.hidden=i!==step;item.disabled=i!==step;});
  const steps=requestModes[mode].steps;
  const position=steps.indexOf(step);
  $('#step-label').textContent=`Paso ${position+1} de ${steps.length}`;
  $('#step-name').textContent=['Tu negocio','Tu prioridad','Tu contacto'][step];
  $('#progress').style.width=`${(position+1)/steps.length*100}%`;
  next.textContent=position===steps.length-1?'Revisar mi solicitud →':'Continuar →';
  back.hidden=position===0;
  error.textContent='';
  if(focus)fieldsets[step].querySelector('input,select').focus();
}
function selectMode(value,focus=false) {
  if(sending||!(value in requestModes))return;
  mode=value;prepared=null;
  form.querySelector(`input[name=requestType][value=${mode}]`).checked=true;
  $('#consent').checked=false;
  $('#consent-text').textContent=requestModes[mode].consent+' *';
  $('#form-intro-copy').textContent=requestModes[mode].intro;
  $('#early-expectations').hidden=mode!=='early_access';
  $('#result').hidden=true;form.hidden=false;
  form.querySelectorAll('[aria-invalid]').forEach(field=>field.removeAttribute('aria-invalid'));
  showStep(0,focus);
}
form.querySelectorAll('[name=requestType]').forEach(input=>input.addEventListener('change',()=>selectMode(input.value)));
document.querySelectorAll('a[href="#solicitud"]').forEach(link=>link.addEventListener('click',()=>{
  if(sending)return;
  const requested=link.dataset.intent||'diagnostic';
  if(requested!==mode)selectMode(requested);
}));
function validateStep() {
  for(const field of fieldsets[step].querySelectorAll('input,select,textarea')) {
    if(field.disabled)continue;
    if(!['checkbox','radio'].includes(field.type))field.value=field.value.trim();
    field.removeAttribute('aria-invalid');
    if(!field.checkValidity()) {
      field.setAttribute('aria-invalid','true');
      error.textContent=field.type==='checkbox'?'Acepta la política de privacidad y la autorización de contacto para continuar.':field.type==='radio'?'Selecciona tu desafío principal.':'Revisa los campos obligatorios y utiliza un correo válido.';
      field.reportValidity();return false;
    }
  }
  return true;
}
back.addEventListener('click',()=>showStep(requestModes[mode].steps[requestModes[mode].steps.indexOf(step)-1]));
form.addEventListener('submit',event=>{
  event.preventDefault();
  if(!validateStep())return;
  const steps=requestModes[mode].steps,position=steps.indexOf(step);
  if(position<steps.length-1){showStep(steps[position+1]);return;}
  for(const index of steps){showStep(index,false);if(!validateStep())return;}
  fieldsets.forEach((item,i)=>item.disabled=!steps.includes(i));
  prepared=buildLead(Object.fromEntries(new FormData(form)),mode,campaign);
  fieldsets.forEach((item,i)=>item.disabled=i!==step);
  const summary=$('#summary');summary.replaceChildren();
  for(const [label,value] of [['Solicitud',prepared.requestLabel],...Object.entries(fieldLabels).filter(([key])=>prepared[key]&&(mode!=='early_access'||!['challenge','context'].includes(key))).map(([key,label])=>[label,prepared[key]]),['Autorización de contacto',prepared.consent.text]]) {
    const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;summary.append(dt,dd);
  }
  $('#email-request').href='mailto:canary.one@hotmail.com?subject='+encodeURIComponent(prepared.requestLabel+' · '+prepared.business)+'&body='+encodeURIComponent(emailBody(prepared));
  $('#result-title').textContent=requestModes[mode].reviewTitle;
  $('#result-copy').textContent=requestModes[mode].reviewCopy;
  result.dataset.state='review';result.querySelector('.result-icon').textContent='→';
  sendButton.disabled=!isEmailConfigured(emailjsConfig);sendButton.textContent=requestModes[mode].sendLabel;
  sendStatus.textContent=isEmailConfigured(emailjsConfig)?'':'El envío desde la web no está habilitado. Puedes escribirnos por correo.';
  $('#edit').hidden=false;form.hidden=true;result.hidden=false;
  $('#download-status').textContent='';$('#result-title').focus();
});
$('#edit').addEventListener('click',()=>{if(sending)return;prepared=null;result.hidden=true;form.hidden=false;showStep(requestModes[mode].steps.at(-1));});
$('#clear').addEventListener('click',()=>{
  if(sending)return;
  const currentMode=mode;prepared=null;form.reset();$('#summary').replaceChildren();
  $('#email-request').href='mailto:canary.one@hotmail.com';selectMode(currentMode,true);
});
function download(content,type,filename,message) {
  const url=URL.createObjectURL(new Blob([content],{type}));
  const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);$('#download-status').textContent=message;
}
$('#download').addEventListener('click',()=>{if(prepared)download(JSON.stringify(prepared,null,2),'application/json;charset=utf-8','canary-business-solicitud.json','Se ha solicitado la descarga de tu copia. Descargar no envía ninguna solicitud.');});
$('#download-email').addEventListener('click',event=>{
  event.preventDefault();if(!prepared||sending)return;
  const message='To: canary.one@hotmail.com\r\nSubject: Solicitud Canary One Business\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\nX-Unsent: 1\r\n\r\n'+emailBody(prepared);
  download(message,'message/rfc822','solicitud-canary-business.eml','Abre el archivo en tu correo y pulsa «Enviar». Descargarlo no envía la solicitud.');
});
$('#clear-send-history').addEventListener('click',()=>{$('#privacy-status').textContent=clearHistory(storage)?'Historial local eliminado. Las solicitudes ya recibidas no se han eliminado.':'No se ha podido acceder al historial en este navegador.';});
function busy(value) {
  sending=value;sendButton.disabled=value;$('#edit').disabled=value;$('#clear').disabled=value;
  form.querySelectorAll('[name=requestType]').forEach(input=>input.disabled=value);
  for(const link of [$('#email-request'),$('#download-email')])link.setAttribute('aria-disabled',String(value));
  result.setAttribute('aria-busy',String(value));
}
$('#email-request').addEventListener('click',event=>{if(sending)event.preventDefault();});
function showAccepted(duplicate,reference) {
  prepared.status=duplicate?'already_accepted_locally':'emailjs_accepted';
  sendButton.disabled=true;sendButton.textContent=duplicate?'Solicitud ya enviada':'Solicitud enviada';
  $('#result-title').textContent=duplicate?'Ya has enviado esta solicitud.':mode==='early_access'?'Tu interés ya está enviado.':'Tu solicitud ya está enviada.';
  $('#result-copy').textContent=mode==='early_access'?'Canary One está en desarrollo. Contactaremos contigo sobre una posible incorporación progresiva. No se ha creado un perfil público ni confirmado una incorporación.':'No se ha reservado una cita ni contratado ningún servicio.';
  sendStatus.textContent=(duplicate?'Este navegador conserva la confirmación de un envío igual. No hemos vuelto a enviarlo.':'EmailJS ha aceptado el envío. La llegada al correo depende del servicio de correo.')+' Referencia: '+reference;
  $('#edit').hidden=true;result.dataset.state='sent';result.querySelector('.result-icon').textContent='✓';
}
sendButton.addEventListener('click',async()=>{
  if(!prepared||sending||['emailjs_accepted','already_accepted_locally'].includes(prepared.status)||!isEmailConfigured(emailjsConfig))return;
  busy(true);sendButton.textContent='Enviando…';sendStatus.textContent='Estamos enviando tu solicitud. Espera un momento.';
  let accepted=false;
  try {
    const key=await fingerprint(prepared);
    const perform=async()=>{
      const previous=acceptedBefore(key,storage);
      if(previous){accepted=true;showAccepted(true,previous.reference);return;}
      const receipt=await sendDiagnostic(prepared,emailjsConfig);
      prepared.acceptedAt=receipt.acceptedAt;rememberAccepted(key,prepared.requestId,storage);
      accepted=true;showAccepted(false,prepared.requestId);
    };
    // Coordinate same-origin tabs where supported. Server-side contact deduplication belongs to EmailJS Contacts.
    if(navigator.locks?.request)await navigator.locks.request('canary-send-'+key,perform);else await perform();
  } catch(reason) {
    sendButton.textContent='Reintentar envío';
    sendStatus.textContent=reason.message==='rate_limited'?'El servicio limita temporalmente los envíos. Espera antes de reintentar. Conservamos tus datos.':reason.message==='send_rejected'?'El servicio no ha aceptado la solicitud. Conservamos tus datos: puedes reintentar o enviarla por correo.':'No hemos podido confirmar el envío. Puede haberse procesado aunque no recibamos respuesta. Conservamos tus datos; comprueba antes de reintentar para evitar duplicados.';
  } finally {busy(false);sendButton.disabled=accepted;}
});
selectMode(new URLSearchParams(location.search).get('solicitud')==='registro'?'early_access':'diagnostic');
next.disabled=false;
