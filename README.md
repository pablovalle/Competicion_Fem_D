# EIBAR · Ranking de entrenamientos

Aplicación estática y responsive para el ranking interno del equipo. HTML, CSS y JavaScript modular, sin build, backend, cuentas, base de datos ni servicios externos. Todos los cálculos se realizan en el navegador a partir de **`data/ranking.xlsx`**. Las dependencias se sirven desde este mismo proyecto.

## Empezar en local

Desde la carpeta del proyecto, con Python 3 instalado:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Abre <http://127.0.0.1:8000>. Para detener el servidor, pulsa `Ctrl+C`. Es un servidor de archivos solo para la previsualización local, no un backend de la aplicación. No abras `index.html` con doble clic: `fetch` y los módulos necesitan HTTP.

Se incluye un Excel con **datos ficticios de ejemplo**, 12 jugadoras y 8 sesiones. Sustituye sus filas y columnas por las reales y renombra la primera pestaña de `Ejemplo` a `Ranking`. El aviso de ejemplo desaparecerá automáticamente. No hay nombres ni puntuaciones de jugadoras en el código de la aplicación.

## Actualizar ranking

1. Abre `data/ranking.xlsx` en Excel.
2. Añade una columna a la derecha de la última sesión, con una fecha o descripción en la primera fila.
3. Introduce la puntuación de cada jugadora; admite enteros, decimales y cero.
4. Pon `-` en las ausencias; también puedes dejar la celda vacía.
5. Guarda el archivo como `.xlsx`, conservando su nombre y ubicación.
6. Haz commit manualmente.
7. Haz push manualmente a la rama configurada para Pages.
8. GitHub Pages publicará los nuevos datos tras completar su despliegue. Recarga la página.

No hay que regenerar archivos, cambiar versiones ni editar JavaScript, JSON o HTML. El Excel se solicita en cada carga con `cache: 'no-store'` y un parámetro temporal automático. Esto reduce la caché del navegador; no adelanta el despliegue de Pages.

## Formato del Excel

Se lee exclusivamente la **primera hoja**. La fila 1 contiene las cabeceras; A1 debe ser `Nombre`. Las columnas posteriores son entrenamientos en su orden de aparición, no se ordenan por fecha. Puedes usar fechas nativas de Excel o descripciones de texto.

| Nombre | 10/09 | 12/09 | Técnica |
| --- | --- | --- | --- |
| Jugadora A | 8 | 7,5 | - |
| Jugadora B | 0 | - | 9 |

- Una puntuación numérica, incluido `0`, cuenta como asistencia. Los números negativos también se aceptan si tu sistema los utiliza.
- `-`, vacío, `null` y valores inexistentes son ausencia. No se convierten en una puntuación de cero.
- Se toleran espacios alrededor de los nombres, cabeceras y puntuaciones; también decimales escritos con coma o punto. Es preferible usar celdas numéricas de Excel.
- El texto inesperado se trata como ausencia, con un aviso en consola que identifica jugadora y entrenamiento.
- Las filas completamente vacías se ignoran. Las filas con puntuaciones pero sin nombre se ignoran con un aviso.
- No dejes columnas de entrenamiento sin cabecera. Las columnas vacías al final se ignoran; una columna con título cuenta como sesión registrada aunque aún no tenga puntuaciones. Añádela cuando vayas a registrar ese entrenamiento.
- Evita celdas combinadas, encabezados decorativos y totales en la zona de datos. Para homónimas, incluye un apellido o inicial; cada fila representa una jugadora distinta.
- Si usas fórmulas, Excel debe recalcularlas y guardar el libro: SheetJS lee su resultado guardado, no ejecuta las fórmulas.
- Puedes corregir cualquier sesión anterior; se reconstruirá todo el histórico.

## Añadir jugadora

Añade una fila con su nombre en la primera columna. Introduce sus puntuaciones y deja en blanco o con `-` las sesiones a las que no asistió. La nueva fila se detecta al recargar. Para eliminar una jugadora del ranking, elimina su fila.

## Cómo funciona el ranking

Los puntos son la suma de puntuaciones numéricas. Las asistencias son el número de puntuaciones, incluido cero. El orden se centraliza en `comparePlayers()` de `js/ranking.js`:

1. Más puntos totales.
2. En caso de empate, más entrenamientos asistidos.
3. Si persiste el empate, nombre en orden alfabético español.

**La media no desempata.** Las posiciones son ordinales consecutivas: 1, 2, 3… Los acumulados se estabilizan a diez decimales para evitar que operaciones como `0.1 + 0.2` rompan un empate. Las estadísticas visibles se redondean a un máximo de dos decimales; el formato español utiliza coma decimal.

Las cinco primeras tienen el distintivo Top 5 y quedan exentas de traer comida a las merendolas de Navidad, Semana Santa y final de temporada. «En lo más alto» muestra las cinco primeras en orden de clasificación, con la líder destacada. En móvil la primera ocupa una fila y las otras cuatro se distribuyen en dos columnas. Si hay menos de cinco jugadoras, muestra las disponibles.

## Cómo funciona la flecha de racha

La columna **Racha** compara la posición actual con la clasificación recalculada excluyendo exclusivamente la última columna de entrenamiento. Ambas clasificaciones usan los mismos criterios de puntos, asistencias y nombre.

- `↑ 2`: ha subido dos posiciones.
- `↓ 1`: ha bajado una posición.
- `→`: mantiene la posición.
- `—`: solo existe una sesión, sin clasificación anterior comparable.

Una fila que antes no tenía puntos también ocupa una posición en la clasificación anterior. El orden de las filas del Excel no decide la posición. Al añadir una jugadora, el histórico se reconstruye considerando su fila actual y las ausencias de sus sesiones anteriores; el Excel no conserva altas o bajas históricas.

## Estadísticas individuales

Pulsa en cualquier fila o tarjeta del podio. Se abre una ficha lateral, a pantalla completa en móvil, con cierre mediante botón, Escape o el fondo exterior. Los gráficos tienen tooltips al tocar o señalar y una tabla desplegable de datos para teclado y lectores de pantalla.

- **Media:** puntos divididos entre asistencias; muestra 0 si no ha asistido.
- **Mejor / peor puntuación:** máximo y mínimo de las puntuaciones numéricas. Sin puntuaciones, `—`. Si se repite la mejor, se muestra la sesión más reciente.
- **Última puntuación:** la de la última columna del calendario. Si faltó, `—` y el texto «Ausente en el último entrenamiento».
- **Evolución de puntuación:** puntuaciones sesión a sesión; las ausencias dejan huecos, sin unir la línea a través de ellas. Incluye una referencia horizontal de la media si hay puntuaciones.
- **Evolución en la clasificación:** reconstruye el ranking tras cada columna, con los mismos desempates. La posición 1 está arriba.
- **Puntos acumulados:** suma progresiva de puntos. Una ausencia conserva el acumulado anterior.
- **Racha de entrenamientos:** asistencias consecutivas desde la última sesión hacia atrás. Si faltó a la última, 0. **Mejor racha:** máximo de asistencias consecutivas en todo el calendario. Es distinta de la flecha de la tabla.
- **Distancia al Top 5:** fuera del Top 5, puntos propios menos los de la quinta; dentro, puntos propios menos los de la sexta. Con menos de seis jugadoras, `—`. En un empate puede ser 0; los otros desempates siguen decidiendo la posición. No representa necesariamente los puntos necesarios para adelantar.
- **Tendencia:** compara la media de las tres últimas puntuaciones numéricas con las tres anteriores, saltando ausencias. Requiere seis puntuaciones. Diferencia absoluta menor que 0,25: «Estable»; desde +0,25: «Mejorando»; desde −0,25: «Bajando».
- **Últimos 5 entrenamientos:** las cinco últimas columnas del calendario, con `AUS` para ausencias, o todas si hay menos de cinco.
- **Puntos últimos 5 entrenamientos:** suma de esas cinco columnas; una ausencia no suma puntos.
- **Media últimos 5 entrenamientos asistidos:** media de las últimas cinco puntuaciones numéricas, aunque abarquen más de cinco columnas. Si hay menos, usa las disponibles; sin ninguna, `—`.
- **Regularidad:** desviación estándar poblacional de las puntuaciones: `σ = sqrt(sum((puntuación − media)²) / asistencias)`. Hasta 0,75 inclusive: «Muy regular»; mayor que 0,75 y hasta 1,50 inclusive: «Regular»; mayor que 1,50: «Variable». Requiere tres puntuaciones. Son umbrales absolutos en puntos, adecuados para una escala cercana a 0–10; se pueden cambiar en `regularity()` de `js/statistics.js` si cambia la escala. No afecta al ranking.
- **Media del equipo:** suma de todas las puntuaciones de todas las jugadoras dividida por el total de asistencias; no es el promedio sin ponderar de las medias individuales. Diferencia = media personal menos media del equipo. Si no hay datos comparables, `—`.
- **Historial:** todas las sesiones, de la más reciente a la más antigua, incluidas las ausencias.

La temporada visible se calcula con la fecha del dispositivo: julio a junio. Es una etiqueta visual; no filtra datos. Para una temporada nueva, reemplaza en el Excel las columnas de la temporada anterior.

## GitHub Pages

La aplicación admite una ruta como `https://usuario.github.io/nombre-repositorio/`. Los recursos y el Excel utilizan rutas relativas. No hay que configurar dominios ni claves.

1. Cuando hayas revisado el proyecto, guarda estos archivos en tu repositorio y haz commit y push manualmente. Esta carpeta no se ha inicializado como repositorio Git durante el desarrollo.
2. Abre el repositorio en GitHub y entra en **Settings → Pages**.
3. En **Build and deployment → Source**, selecciona **Deploy from a branch**.
4. Selecciona la rama donde has subido la web, normalmente `main`, y la carpeta **/ (root)**.
5. Pulsa **Save** y espera a que termine el despliegue. Puedes consultar su estado en **Actions**.
6. Abre la URL que muestra Pages. Las futuras actualizaciones del Excel se publican al hacer push a esa rama.

Se incluye `.nojekyll`; no hay proceso de compilación ni workflow personalizado necesario. Guía oficial: [configurar la fuente de publicación de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

**Visibilidad:** «Uso interno» expresa el uso previsto, no restringe el acceso. En GitHub Pages público tanto la página como el Excel son accesibles a quien tenga la URL. No hay login ni control de acceso en esta web estática.

## Estructura y decisiones técnicas

```text
index.html                 Estructura semántica, estados y diálogo
css/styles.css             Identidad Eibar y diseño responsive
js/app.js                  Carga, coordinación, podio y tabla
js/excel.js                Fetch, lectura SheetJS y normalización
js/ranking.js              Comparador, puntos, asistencias e histórico
js/statistics.js           Estadísticas de la ficha, sin DOM
js/player-detail.js        Ficha, historial y comportamiento del diálogo
js/charts.js               Gráficos y alternativas tabulares accesibles
js/ui.js                   Formato, escape HTML y badges compartidos
data/ranking.xlsx          Única fuente de datos
assets/favicon.svg         Identidad tipográfica original
assets/vendor/             Librerías locales y sus licencias
tests/                     Pruebas de cálculo y navegador
```

Se usa `<dialog>` nativo para confinar el foco, cerrar con Escape y devolver el foco a la jugadora seleccionada. Cada fila tiene un botón accesible por teclado y toda su superficie responde al clic. Las flechas incluyen texto accesible. Se respetan preferencias de movimiento reducido. Las cadenas del Excel se escapan antes de insertarlas en HTML.

No hay trackers, cookies, fuentes remotas, imágenes descargadas, APIs ni peticiones externas durante el uso. La identidad es textual; el símbolo de bandas y el favicon son originales. El navegador solo solicita archivos del mismo sitio. Se recomienda un navegador moderno actualizado (Chrome, Edge, Firefox o Safari).

### Librerías

- **SheetJS CE 0.20.3**, licencia Apache-2.0, para leer XLSX. [Distribución oficial](https://docs.sheetjs.com/docs/getting-started/installation/standalone/).
- **Chart.js 4.5.1**, licencia MIT, para los tres gráficos. [Integración oficial](https://www.chartjs.org/docs/latest/getting-started/integration/).

Los archivos y licencias están en `assets/vendor`. No se cargan desde CDN al abrir la web. Python y Playwright se han usado solo para desarrollo y comprobación: no son requisitos del sitio publicado.

## Comprobaciones

Con el servidor local en el puerto 8000, Python, Chrome y `playwright` instalados:

```powershell
python tests/browser-check.py
```

La prueba usa Chrome sin ventana, verifica cálculos con fixtures independientes, lectura de un XLSX real, estados vacío/error, reintento, un solo entrenamiento, teclado, foco, Escape, interacción táctil y gráficos. Comprueba los anchos 375, 430, 768, 1024 y 1440 px, guarda capturas en `tests/artifacts/` (excluidas de Git) y falla ante errores de consola o desbordamiento horizontal. No modifica tu Excel.

Resultado verificado durante el desarrollo: **53 comprobaciones de cálculo superadas**, los cinco anchos correctos, ningún error de consola en el funcionamiento normal, solo peticiones al origen local y rutas relativas correctas en una simulación de publicación bajo `/club/`. También se revisaron visualmente capturas de móvil, tablet y escritorio. La publicación real en GitHub Pages queda pendiente de tu revisión y activación manual.

Para comprobar manualmente una ruta de subdirectorio equivalente a Pages, sirve la carpeta superior con HTTP y abre `/Ranking_competi/`. El archivo Excel se seguirá buscando dentro del proyecto.
