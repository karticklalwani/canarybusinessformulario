export function isEmailConfigured(config) {
  return ['serviceId', 'templateId', 'publicKey'].every(key => typeof config?.[key] === 'string' && config[key].trim().length > 0);
}
export function templateParams(data) {
  return {
    business_name: data.requestType === 'early_access' ? '[REGISTRO ANTICIPADO] ' + data.business : data.business,
    contact_phone: data.phone || '',
    request_type_label: data.requestLabel || 'Diagnóstico gratuito',
    request_intro: data.requestType === 'early_access' ? 'Interés en una futura incorporación a Canary One. Registro gratuito, sin compromiso y sin incorporación inmediata.' : 'Solicitud de diagnóstico inicial gratuito de visibilidad, captación y fidelización.', island: data.location, locality: data.locality,
    category: data.category, challenge: data.challenge, context: [data.context || 'No indicado', 'Tipo: ' + (data.requestLabel || 'Diagnóstico gratuito'), ...Object.entries(data.campaign || {}).map(([key,value]) => key + ': ' + value)].join('\n'),
    contact_name: data.contact, reply_to: data.email, phone: data.phone || 'No indicado',
    consent_text: data.consent.text, consent_at: data.consent.recordedAt,
    consent_version: data.consent.noticeVersion, request_id: data.requestId,
    source: data.source,
  };
}
export async function sendDiagnostic(data, config, {fetchImpl = fetch, timeoutMs = 20000} = {}) {
  if (!isEmailConfigured(config)) throw new Error('not_configured');
  if (!data.consent?.diagnosticContact) throw new Error('consent_required');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, signal: controller.signal,
      body: JSON.stringify({service_id:config.serviceId.trim(), template_id:config.templateId.trim(), user_id:config.publicKey.trim(), template_params:templateParams(data)}),
    });
    const body = await response.text();
    if (response.status !== 200 || body.trim() !== 'OK') {
      const error = new Error(response.status === 429 ? 'rate_limited' : 'send_rejected');
      error.status = response.status;
      throw error;
    }
    return {status:'accepted', acceptedAt:new Date().toISOString()};
  } finally { clearTimeout(timeout); }
}
