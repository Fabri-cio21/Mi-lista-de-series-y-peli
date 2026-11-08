# 🎬 Mi Watchlist

Lista personal de películas y series para llevar lo que quieres ver y lo que ya viste, con póster, estrellas, puntuación y progreso de episodios.

Tiene dos versiones: una de **escritorio** (Python) y una **web** (HTML, CSS y JavaScript).

![Captura de la versión web](capturas/web.png)

## Funciones

- Agregar, editar y eliminar películas y series
- Calificación con estrellas (1 a 5) y puntuación de 0 a 100
- Progreso de series: temporadas y episodios vistos
- Póster desde una imagen de tu computadora
- Búsqueda por título o género
- Filtros por tipo y orden (recientes, estrellas, puntuación, A–Z, año)

## Versión web

No necesita instalar nada.

1. Descarga o clona el repositorio.
2. Abre `web/index.html` en el navegador.

También puedes verla en línea: <enlace de GitHub Pages>

## Versión de escritorio

Requiere Python 3.9 o superior.

```bash
cd escritorio
pip install -r requirements.txt
python Listapeli.py
```

## Dónde se guardan tus datos

- **Web:** en el navegador (`localStorage`). Si cambias de navegador o de computadora, la lista aparece vacía. Usa **Exportar** para guardar una copia y **Importar** para recuperarla.
- **Escritorio:** en `watchlist.json` y en la carpeta `imagenes/`, junto al programa. Estos archivos no se suben a GitHub (están en `.gitignore`).

Las dos versiones usan el mismo formato de `watchlist.json`, así que puedes pasar tu lista de una a otra con Exportar / Importar (los pósters no se pasan).

## Estructura

```
├── escritorio/
│   ├── Listapeli.py
│   └── requirements.txt
├── web/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── capturas/
├── .gitignore
└── README.md
```

## Tecnologías

- Escritorio: Python, CustomTkinter, Pillow
- Web: HTML, CSS y JavaScript (sin librerías)

## Autor

<Tu Fabricio Villar Ato> · <enlace a tu perfil de GitHub>
