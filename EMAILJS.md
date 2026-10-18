# Configurar EmailJS

Service ID recibido: `service_aljmdiq`. Template ID configurado: template_3hate4f. Public Key configurada. Introducirlos en `emailjs-config.mjs`. Son valores públicos; nunca añadir la Private Key al navegador.

En la plantilla de EmailJS:

- To Email: `canary.one@hotmail.com` (valor fijo en el panel; no una variable controlada por el visitante).
- Subject: `Diagnóstico Canary Business · {{business_name}}`
- From Name: `Canary One Business`
- From Email: dirección del servicio conectado (configuración del proveedor).
- Reply To: `{{reply_to}}`

Contenido de la plantilla (usar dobles llaves para escapar los valores):

```text
Nueva solicitud de diagnóstico inicial gratuito

Negocio: {{business_name}}
Isla: {{island}}
Localidad: {{locality}}
Categoría: {{category}}
Desafío principal: {{challenge}}
Contexto: {{context}}

Contacto: {{contact_name}}
Correo: {{reply_to}}
Teléfono: {{phone}}

Autorización: {{consent_text}}
Fecha: {{consent_at}}
Versión del aviso: {{consent_version}}
Referencia: {{request_id}}
Origen: {{source}}
```

Permitir el origen local `http://127.0.0.1:8000` y, cuando exista, el dominio de producción en la configuración de orígenes de EmailJS. Habilitar Browser API en la cuenta si está desactivada. La configuración de proveedor y plantilla debe guardarse en el panel.

La web usa la API REST oficial sin cargar un SDK externo. Solicita solo con consentimiento y confirmación explícita. No reintenta automáticamente. Deshabilita envíos concurrentes y evita volver a enviar una solicitud ya aceptada en esa sesión. La referencia facilita identificar duplicados; no equivale a deduplicación del servidor. El control de abuso efectivo depende de las opciones del servicio y del origen configurado.

La aceptación HTTP 200 con respuesta OK confirma que EmailJS aceptó el envío, no que el correo llegó a la bandeja de entrada. Una pérdida de conexión puede dejar el estado incierto; la web lo explica y conserva los datos. Hasta completar la configuración, el envío permanece deshabilitado y se ofrece correo manual.

Prueba final pendiente: enviar una solicitud identificada como prueba y comprobar su recepción en canary.one@hotmail.com.

Documentación: https://www.emailjs.com/docs/rest-api/send/

## Plantilla HTML con logo

La plantilla completa está en ../emailjs-template.html y su copia como texto en ../emailjs-template-codigo.txt. Pegar su contenido en Content → editor de código HTML (<>). En Attachments añadir un Static Attachment llamado exactamente canary-one-logo.png, usando ../canary-one-logo.png. El HTML lo referencia como cid:canary-one-logo.png, sin depender de localhost. Guardar y probar desde el panel.

Documentación de imágenes integradas: https://www.emailjs.com/docs/user-guide/embedded-images/

## Prueba real completada

El 13 de octubre de 2026 EmailJS aceptó una única solicitud enviada desde el formulario local con negocio PRUEBA TÉCNICA — Canary Business. Referencia: 4379e99d-a744-4f65-ae76-47a09c4d76f9. Pendiente de confirmación del propietario: recepción en canary.one@hotmail.com y visualización del logo.

## Revisión del 18 de octubre de 2026

Save Contacts activado y verificado. Dos envíos reales de prueba dejaron un solo contacto y el CSV se descargó correctamente. Name = {{contact_name}} · {{business_name}}, Address = {{island}} · {{locality}} · {{category}}, Email = {{reply_to}}, Phone = {{contact_phone}}. Se corrigieron Reply To, From Name y Subject de la plantilla real. El correo se adaptó a ambos propósitos sin retirar el logo. Consultar ../REVISION-REGISTRO-ANTICIPADO.md. La landing ampliada NO se ha publicado.
