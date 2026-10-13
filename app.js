import {emailjsConfig} from './emailjs-config.mjs';
import {isEmailConfigured, sendDiagnostic} from './emailjs-client.mjs';
'use strict';
// EmailJS sends only after explicit confirmation on the review screen.
const form = document.querySelector('#lead-form');
const fieldsets = [...form.querySelectorAll('[data-step]')];
const next = document.querySelector('#next');
const back = document.querySelector('#back');
const error = document.querySelector('#form-error');
const result = document.querySelector('#result');
let step = 0;
let prepared = null;
let sending = false;
const sendButton = document.querySelector('#send-request');
const sendStatus = document.querySelector('#send-status');
function resetSendState() {
  sendButton.disabled = !isEmailConfigured(emailjsConfig);
  sendButton.textContent = 'Enviar solicitud';
  sendStatus.textContent = isEmailConfigured(emailjsConfig) ? '' : 'El envío desde la web todavía no está habilitado. Puedes enviarnos tu solicitud por correo.';
  document.querySelector('#edit').hidden = false;
}
const consentText = document.querySelector('label.checkbox span').textContent.trim().replace(/ \*$/, '');
const labels = { business:'Negocio', location:'Isla', locality:'Localidad', category:'Categoría', challenge:'Desafío principal', context:'Contexto', contact:'Contacto', email:'Correo electrónico', phone:'Teléfono' };
function showStep(index, focus = true) {
  step = index;
  fieldsets.forEach((fieldset, i) => { fieldset.hidden = i !== step; fieldset.disabled = i !== step; });
  document.querySelector('#step-label').textContent = `Paso ${step + 1} de 3`;
  document.querySelector('#step-name').textContent = ['Tu negocio', 'Tu prioridad', 'Tu contacto'][step];
  document.querySelector('#progress').style.width = `${(step + 1) / 3 * 100}%`;
  next.textContent = step === 2 ? 'Revisar mi solicitud →' : 'Continuar →';
  back.hidden = step === 0;
  error.textContent = '';
  if (focus) fieldsets[step].querySelector('input,select').focus();
}
function validateStep() {
  const fields = [...fieldsets[step].querySelectorAll('input,select,textarea')];
  for (const field of fields) {
    if (field.disabled) continue;
    if (field.type !== 'checkbox' && field.type !== 'radio') field.value = field.value.trim();
    field.removeAttribute('aria-invalid');
    if (!field.checkValidity()) {
      field.setAttribute('aria-invalid', 'true');
      error.textContent = field.type === 'checkbox' ? 'Marca la autorización para incluirla en tu solicitud.' : field.type === 'radio' ? 'Selecciona tu desafío principal para continuar.' : 'Revisa los campos obligatorios y utiliza un correo válido.';
      field.reportValidity(); return false;
    }
  }
  return true;
}
back.addEventListener('click', () => showStep(step - 1));
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!validateStep()) return;
  if (step < 2) { showStep(step + 1); return; }
  // Revalidate every step, including values restored or autofilled by the browser.
  for (let index = 0; index < fieldsets.length; index++) {
    showStep(index, false);
    if (!validateStep()) return;
  }
  // Enable all steps to serialize once.
  fieldsets.forEach(fieldset => fieldset.disabled = false);
  const data = Object.fromEntries(new FormData(form));
  fieldsets.forEach((fieldset, i) => fieldset.disabled = i !== step);
  prepared = {schemaVersion:2, requestId:crypto.randomUUID(), status:'prepared_not_sent', preparedAt:new Date().toISOString(), business:data.business, location:data.location, locality:data.locality, category:data.category, challenge:data.challenge, context:data.context || '', contact:data.contact, email:data.email, phone:data.phone || '', consent:{diagnosticContact:data.consent === 'on', text:consentText, noticeVersion:'emailjs-1', recordedAt:new Date().toISOString(), scope:'diagnostic_contact'}, source:'canary-business-landing'};
  const summary = document.querySelector('#summary'); summary.replaceChildren();
  for (const [key,label] of Object.entries(labels)) {
    if (!prepared[key]) continue;
    const dt = document.createElement('dt'); dt.textContent = label;
    const dd = document.createElement('dd'); dd.textContent = prepared[key];
    summary.append(dt,dd);
  }
  const dt = document.createElement('dt'); dt.textContent = 'Autorización de contacto';
  const dd = document.createElement('dd'); dd.textContent = consentText; summary.append(dt,dd);
  const body = buildEmailBody(prepared);
  document.querySelector('#email-request').href = 'mailto:canary.one@hotmail.com?subject=' + encodeURIComponent('Solicitud de diagnóstico · ' + prepared.business) + '&body=' + encodeURIComponent(body);
  resetSendState();
  form.hidden = true; result.hidden = false;
  document.querySelector('#download-status').textContent = '';
  document.querySelector('#result-title').focus();
});
document.querySelector('#edit').addEventListener('click', () => { if (sending) return; prepared = null; result.hidden = true; form.hidden = false; showStep(2); });
document.querySelector('#clear').addEventListener('click', () => {
  if (sending) return;
  prepared = null; form.reset();
  form.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid')); document.querySelector('#summary').replaceChildren();
  document.querySelector('#email-request').href = 'mailto:canary.one@hotmail.com'; result.hidden = true; form.hidden = false; showStep(0);
});
document.querySelector('#download').addEventListener('click', () => {
  if (!prepared) return;
  const blob = new Blob([JSON.stringify(prepared, null, 2)], {type:'application/json;charset=utf-8'});
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = 'canary-business-solicitud.json'; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  document.querySelector('#download-status').textContent = 'Se ha solicitado la descarga en tu dispositivo. La descarga no envía la solicitud.';
});
showStep(0, false);
next.disabled = false;

function buildEmailBody(data) {
  return ['Hola, Canary Business:', '', 'Quiero solicitar un diagnóstico inicial gratuito de mi negocio.', '', ...Object.entries(labels).filter(([key]) => data[key]).map(([key,label]) => label + ': ' + data[key]), '', 'Autorización de contacto: ' + data.consent.text, 'Fecha de autorización: ' + data.consent.recordedAt, 'Versión del aviso: ' + data.consent.noticeVersion, '', 'Solicitud elaborada desde la landing de Canary One Business.'].join('\r\n');
}
document.querySelector('#download-email').addEventListener('click', event => {
  event.preventDefault();
  if (!prepared) return;
  // Fixed headers avoid injecting visitor-controlled text into email headers.
  const message = 'To: canary.one@hotmail.com\r\nSubject: Solicitud de diagnostico Canary Business\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\nX-Unsent: 1\r\n\r\n' + buildEmailBody(prepared);
  const url = URL.createObjectURL(new Blob([message], {type:'message/rfc822'}));
  const link = document.createElement('a'); link.href = url; link.download = 'solicitud-canary-business.eml'; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  document.querySelector('#download-status').textContent = 'Abre el archivo descargado en tu aplicación de correo y pulsa «Enviar». Descargarlo no envía la solicitud.';
});

sendButton.addEventListener('click', async () => {
  if (!prepared || sending || prepared.status === 'emailjs_accepted') return;
  if (!isEmailConfigured(emailjsConfig)) { resetSendState(); return; }
  sending = true;
  const edit = document.querySelector('#edit');
  const clear = document.querySelector('#clear');
  sendButton.disabled = true; edit.disabled = true; clear.disabled = true;
  result.setAttribute('aria-busy', 'true');
  sendButton.textContent = 'Enviando…'; sendStatus.textContent = 'Estamos enviando tu solicitud. Espera un momento.';
  try {
    const receipt = await sendDiagnostic(prepared, emailjsConfig);
    prepared.status = 'emailjs_accepted'; prepared.acceptedAt = receipt.acceptedAt;
    sendButton.textContent = 'Solicitud enviada';
    sendStatus.textContent = 'EmailJS ha aceptado el envío de tu solicitud. No se ha reservado una cita automáticamente. Referencia: ' + prepared.requestId;
    edit.hidden = true;
  } catch (error) {
    sendButton.disabled = false; sendButton.textContent = 'Reintentar envío';
    sendStatus.textContent = error.message === 'rate_limited'
      ? 'El servicio ha limitado temporalmente los envíos. Espera un momento antes de reintentar. Tus datos se conservan.'
      : error.message === 'send_rejected'
      ? 'El servicio no ha aceptado la solicitud. Tus datos se conservan; puedes reintentar o enviarla por correo.'
      : 'No hemos podido confirmar el envío. Puede haberse procesado aunque no recibamos respuesta. Tus datos se conservan; comprueba antes de reintentar para evitar duplicados.';
  } finally {
    sending = false; edit.disabled = false; clear.disabled = false;
    result.removeAttribute('aria-busy');
  }
});
