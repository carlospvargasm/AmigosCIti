# AmigosCiti

Asistente sencillo para un grupo privado de WhatsApp. Permanece en silencio salvo cuando se lo invoca y guarda únicamente fechas y preferencias indicadas explícitamente.

## Funciones
- Agregar, eliminar y listar temas.
- Guardar y listar fechas importantes.
- Aviso diario de fechas guardadas.
- Preguntas de IA limitadas a los temas elegidos.
- Sesión persistente de WhatsApp mediante QR.

## Instalación
1. Instala Node.js 20+.
2. Ejecuta `npm install`.
3. Copia `.env.example` a `.env`.
4. Añade tu clave en `OPENAI_API_KEY` (nunca la subas a GitHub).
5. Ejecuta `npm start`.
6. Escanea el QR desde el teléfono del número dedicado a AmigosCiti.

## Ejemplos
- `AmigosCiti agrega tema Fórmula 1`
- `AmigosCiti elimina tema Fórmula 1`
- `AmigosCiti qué temas tenemos`
- `AmigosCiti recuerda cumpleaños de Pedro el 18/10`
- `AmigosCiti qué fechas tenemos`

## Privacidad
No guarda automáticamente la conversación del grupo. La base local contiene únicamente temas y fechas agregados explícitamente.

## Nota
La conexión usa whatsapp-web.js, una integración no oficial basada en WhatsApp Web. Puede verse afectada por cambios de WhatsApp y no garantiza evitar restricciones de cuenta.
