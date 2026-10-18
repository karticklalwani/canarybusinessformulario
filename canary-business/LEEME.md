# Canary One Business — versión de revisión local

Esta es la landing existente, ampliada con captación anticipada. No se ha publicado esta revisión.

Abrir mediante servidor HTTP:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Visitar http://127.0.0.1:8000/#forma-parte. Conservar todos los archivos juntos, incluido lead-model.mjs. No se necesita compilación.

Un formulario compartido: diagnóstico gratuito (3 pasos) y registro anticipado (2 pasos). EmailJS está configurado con el servicio y la plantilla existentes. Save Contacts está activo: gestión y CSV en https://dashboard.emailjs.com/admin/contacts . No hay creación de perfiles ni cuentas públicas.

Los datos de EmailJS incluidos son identificadores públicos. Nunca añadir claves privadas al navegador. El registro por email no equivale a incorporación ni garantiza una plaza. El historial de reenvíos es una protección del navegador, con borrado en privacidad; la deduplicación central de contactos es por correo.

Consulta ../REVISION-REGISTRO-ANTICIPADO.md para funcionamiento, límites, pruebas y condiciones antes de publicar. No subir esta revisión a Vercel sin autorización del propietario.
