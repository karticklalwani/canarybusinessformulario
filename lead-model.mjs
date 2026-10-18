export const requestModes = Object.freeze({
  diagnostic: {
    label:'Diagnóstico gratuito', steps:[0,1,2],
    consent:'Acepto la política de privacidad y autorizo el contacto para gestionar mi diagnóstico inicial gratuito.',
    intro:'Cuéntanos dónde estás y qué te gustaría mejorar. Completa tus datos y revisa tu solicitud de diagnóstico inicial gratuito.',
    reviewTitle:'Tu diagnóstico empieza aquí. Revisa y confirma.',
    reviewCopy:'Confirma el envío de tus datos para solicitar el diagnóstico inicial gratuito. No implica contratar un servicio ni reservar una cita.',
    sendLabel:'Enviar solicitud de diagnóstico',
  },
  early_access: {
    label:'Registro anticipado', steps:[0,2],
    consent:'Acepto la política de privacidad y autorizo a Canary One Business a contactar conmigo sobre el desarrollo de Canary One y una posible incorporación progresiva de mi negocio.',
    intro:'Cuéntanos quién está detrás de tu negocio. Te contactaremos sobre el desarrollo de Canary One y una posible incorporación progresiva.',
    reviewTitle:'Tu negocio, en el próximo capítulo. Revisa tu interés.',
    reviewCopy:'Registro gratuito y sin compromiso. Canary One está en desarrollo: esta solicitud no supone incorporación inmediata, una plaza garantizada ni la creación de un negocio público.',
    sendLabel:'Confirmar mi interés',
  },
});
export const fieldLabels = Object.freeze({business:'Negocio',location:'Isla',locality:'Municipio',category:'Sector comercial',challenge:'Desafío principal',context:'Contexto',contact:'Responsable',email:'Correo electrónico',phone:'Teléfono'});
export function getCampaign(search) {
  const params = new URLSearchParams(search);
  return Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].flatMap(key => {
    const value=params.get(key)?.trim().slice(0,120);
    return value ? [[key,value.replace(/[\r\n]/g,' ')]] : [];
  }));
}
export function buildLead(fields, mode='diagnostic', campaign={}, id=crypto.randomUUID()) {
  if (!(mode in requestModes)) throw new Error('invalid_mode');
  if (fields.consent !== 'on') throw new Error('consent_required');
  const now=new Date().toISOString();
  return {schemaVersion:3,requestId:id,requestType:mode,requestLabel:requestModes[mode].label,status:'prepared_not_sent',preparedAt:now,
    business:fields.business.trim(),location:fields.location,locality:fields.locality.trim(),category:fields.category,
    challenge:mode==='early_access'?'Registro anticipado':fields.challenge,
    context:mode==='early_access'?'Interés en la futura incorporación. Plataforma en desarrollo; sin compromiso ni incorporación inmediata.':(fields.context||'').trim(),
    contact:fields.contact.trim(),email:fields.email.trim().toLowerCase(),phone:(fields.phone||'').trim(),
    consent:{diagnosticContact:true,text:requestModes[mode].consent,noticeVersion:'business-interest-2026-10-18',recordedAt:now,scope:mode==='early_access'?'early_access_contact':'diagnostic_contact'},
    source:'canary-business-landing',campaign};
}
export function emailBody(data) {
  return ['Hola, Canary One Business:', '', 'Tipo de solicitud: '+data.requestLabel, '', ...Object.entries(fieldLabels).filter(([key])=>data[key]).map(([key,label])=>label+': '+data[key]), '', 'Autorización: '+data.consent.text, 'Fecha (UTC): '+data.consent.recordedAt, 'Referencia: '+data.requestId, 'Origen: '+JSON.stringify(data.campaign||{})].join('\r\n');
}
const historyKey='canary-business-sent-v1';
const ttl=30*24*60*60*1000;
const normal = value => value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
export async function fingerprint(data) {
  const value=JSON.stringify([data.requestType||'diagnostic',data.email.trim().toLowerCase(),normal(data.business),normal(data.location),normal(data.locality)]);
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function history(storage) {
  try { const data=JSON.parse(storage.getItem(historyKey)||'[]'); return Array.isArray(data)?data.filter(x=>typeof x.key==='string'&&typeof x.at==='number'&&Date.now()-x.at<ttl&&x.at<=Date.now()):[]; } catch {return [];}
}
export function acceptedBefore(key,storage) {return history(storage).find(x=>x.key===key)||null;}
export function rememberAccepted(key,reference,storage) {
  try {storage.setItem(historyKey,JSON.stringify([...history(storage).filter(x=>x.key!==key).slice(-99),{key,reference,at:Date.now()}]));}catch {/* Storage restrictions must not turn a successful email into an error. */}
}
export function clearHistory(storage) {try{storage.removeItem(historyKey);return true;}catch{return false;}}
