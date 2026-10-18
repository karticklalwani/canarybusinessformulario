# Canary One Business — revisión local del 18 de octubre de 2026

## Resultado

Se ha mejorado la landing existente en `outputs/canary-business`. Se conservan el hero, el logo original, la paleta, la fotografía elegida, el diagnóstico gratuito, las secciones, preguntas frecuentes y contactos. No se ha creado otro Site, no se ha modificado Vercel ni se ha publicado la nueva página.

Vista local: http://127.0.0.1:8000/#forma-parte

## Captación anticipada

Nueva sección dentro de la landing con el título y subtítulo solicitados, presentación para empresarios, CTA «Quiero formar parte», referencia a las ocho islas y explicación del desarrollo progresivo. No se anuncian plazas limitadas, fechas, resultados ni incorporación automática.

Un único formulario con dos intenciones:

- Diagnóstico gratuito: conserva los tres pasos y las preguntas de visibilidad, captación y fidelización.
- Registro anticipado: dos pasos; negocio, responsable, isla, municipio, sector, correo, teléfono opcional y aceptación de privacidad. No exige responder preguntas del diagnóstico.

Cambiar de intención conserva los campos comunes, reinicia la autorización y muestra el texto de consentimiento adecuado. Antes de enviar aparece un resumen seguro y un botón de confirmación específico. El propósito se incluye en el asunto/detalle recibido; el registro anticipado lleva el prefijo [REGISTRO ANTICIPADO] en el negocio para distinguirlo incluso con la plantilla compartida.

## Envío y contactos

Se reutilizan el servicio y la plantilla EmailJS existentes. No se han creado negocios, cuentas ni perfiles públicos.

Con la sesión iniciada por el usuario se activó Save Contacts en la plantilla `template_3hate4f`. Mapeo:

- Email: {{reply_to}}
- Name: {{contact_name}} · {{business_name}}
- Address: {{island}} · {{locality}} · {{category}}
- Phone: {{contact_phone}} (vacío cuando no se aporta)

Se corrigieron From Name, Reply To y Subject, que tenían variables diferentes a las enviadas por la landing. Se adaptó el texto del correo para aceptar ambas intenciones, manteniendo el logo. **Estos ajustes de la integración EmailJS sí están guardados en el servicio y afectan al correo de la plantilla existente; la web nueva no está publicada.**

Gestión: https://dashboard.emailjs.com/admin/contacts

El panel permite consultar y exportar contactos a CSV. El CSV verificado contiene Created At, Email, Name, Address, Phone y Template ID. Isla, municipio y sector aparecen dentro de Address. Para estados comerciales, seguimiento y agrupaciones más avanzadas, importa ese CSV a una hoja de cálculo y añade columnas de estado y próxima acción. No se ha inventado un CRM conectado.

EmailJS mantiene un contacto por correo. Los dos envíos de prueba (registro y diagnóstico) dejaron una sola fila. Una persona puede solicitar varios negocios: el contacto central no representa una fila por negocio; cada correo conserva los detalles de su solicitud. El último envío puede actualizar los datos del contacto.

No se han eliminado los registros de prueba: el único contacto comprobado está claramente marcado PRUEBA, con canary.one@hotmail.com. No es un empresario captado. Referencias de prueba: prueba-registro-20261018 y prueba-diagnostico-20261018.

## Duplicados y errores

- Bloqueo de clics concurrentes durante el envío y bloqueo del mismo resultado tras aceptación.
- Huella SHA-256 del propósito, correo normalizado, negocio, isla y municipio. Historial local durante 30 días, sin campos de contacto en texto; opción para borrarlo en privacidad.
- Coordinación entre pestañas del mismo origen mediante Web Locks cuando está disponible.
- Un mismo negocio con variaciones de mayúsculas, espacios y acentos no vuelve a enviarse desde el historial del navegador; solicitudes de distinto tipo o negocio se permiten.
- El historial local es una protección complementaria. Puede desaparecer al borrar datos o usar otro navegador; la deduplicación central por correo la aporta EmailJS Contacts. No se promete deduplicación mundial de cada correo enviado ni de solicitudes manuales.
- Solo HTTP 200 con respuesta OK se considera aceptación. Se conservan los datos ante rechazo, límites, red o timeout. No se reintenta automáticamente. Una respuesta incierta se explica sin presentar un éxito falso.

## Destino para anuncios

URL de sección: /#forma-parte

URL con registro preseleccionado:

`/?solicitud=registro&utm_source=instagram&utm_medium=paid_social&utm_campaign=negocios_canarias#forma-parte`

Variantes: utm_source=facebook para Facebook; utm_source=google y utm_medium=cpc para Google. El contenido del anuncio debe prometer únicamente registro gratuito y sin compromiso en una plataforma en desarrollo. No se han lanzado anuncios ni instalado píxeles publicitarios.

Solo se recogen utm_source, utm_medium, utm_campaign, utm_content y utm_term, con longitud limitada, como parte de la solicitud. No se guarda el resto de parámetros de URL ni se añade seguimiento publicitario.

## Privacidad

Se actualizó el aviso para diferenciar diagnóstico y contacto sobre desarrollo/incorporación, explicar EmailJS Contacts, datos enviados, origen de campaña, historial local, retirada de autorización y eliminación. El borrado local no afirma eliminar datos ya recibidos por correo o EmailJS. No se añade una suscripción a publicidad general.

El aviso disponible identifica la marca y el correo de contacto. Antes de lanzar campañas debe completarse con la identidad legal del responsable, sus datos de contacto formales y las condiciones de conservación/transferencia que correspondan a su configuración real. No se ha inventado esa información ni se ha dado por realizada una revisión jurídica.

## Pruebas realizadas

- Pruebas de lógica: ambas modalidades, consentimiento diferenciado, campos, no inclusión de preguntas del diagnóstico en el registro, normalización, expiración de huellas y restricciones de almacenamiento.
- Pruebas de formulario en DOM simulado (sin navegador): campos obligatorios, correo, consentimiento, dos/tres pasos, volver/editar, borrado, resumen sin inyección HTML, envío concurrente, error sin falso éxito, reintento con la misma referencia y protección de duplicados.
- Pruebas del cliente EmailJS con respuestas simuladas: éxito, rechazo, falta de consentimiento/configuración, 429, red y timeout.
- Pruebas reales en EmailJS: dos envíos aceptados (200 OK), un contacto central, exportación CSV descargada y comprobada.
- Estructura: un solo formulario, IDs únicos, etiquetas y enlaces internos válidos.
- El servidor local devuelve 200 y módulos/imágenes existen.

Limitación: la política del navegador bloqueó observar la página local en este turno. Se revisaron las reglas responsive añadidas, pero no se ha confirmado visualmente su renderizado en móvil ni escritorio. El resultado está abierto en local para revisión del usuario antes de autorizar publicación.

Fuentes EmailJS:
https://www.emailjs.com/docs/rest-api/send/
https://www.emailjs.com/docs/user-guide/collecting-contacts/
