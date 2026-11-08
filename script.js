// ===== Mi Watchlist =====
// Los datos se guardan en el navegador (localStorage) como una lista de objetos:
// { id, type ("movie" o "series"), title, year, genre, desc, rating (0-5), score (0-100),
//   img, watched_seasons, total_seasons, watched_eps, total_eps, added }
// Los nombres de los campos son los mismos que usa la versión de escritorio (watchlist.json).

var CLAVE = "watchlist";          // nombre con el que se guarda en localStorage
var items = [];                   // todos los títulos
var filtroTipo = "todos";         // "todos", "movie" o "series"
var itemEditando = null;          // el título que se está editando (null = uno nuevo)
var imagenActual = "";            // póster del formulario (texto base64)
var estrellasActuales = 0;        // estrellas del formulario

// Cada rango de puntuación tiene su color y su texto
var NIVELES = [
  { min: 90, color: "#50dc78", texto: "Obra maestra" },
  { min: 80, color: "#50dc78", texto: "Excelente" },
  { min: 70, color: "#f0a030", texto: "Muy buena" },
  { min: 60, color: "#f0a030", texto: "Buena" },
  { min: 50, color: "#ff9f40", texto: "Regular" },
  { min: 30, color: "#e8462a", texto: "Mala" },
  { min: 1,  color: "#e8462a", texto: "Muy mala" }
];

var EJEMPLOS = [
  { id: "e1", type: "movie", title: "Oppenheimer", year: 2023, genre: "Drama, Historia",
    desc: "Biopic sobre el padre de la bomba atómica.", rating: 5, score: 95, added: 1 },
  { id: "e2", type: "series", title: "Severance", year: 2022, genre: "Ciencia ficción",
    desc: "Serie sobre la separación entre vida laboral y personal.", rating: 5, score: 97,
    watched_seasons: 1, total_seasons: 2, watched_eps: 9, total_eps: 18, added: 2 },
  { id: "e3", type: "movie", title: "Dune: Parte 2", year: 2024, genre: "Ciencia ficción",
    desc: "Épica visual sin igual.", rating: 4, score: 88, added: 3 }
];


// ===== Funciones de ayuda =====

function el(id) {
  return document.getElementById(id);
}

// Evita que un título con "<" o "&" rompa la página
function escapar(texto) {
  var div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

// Convierte el valor en número entero y lo limita entre min y max
function entre(valor, min, max) {
  var n = Math.round(Number(valor));
  if (isNaN(n)) {
    n = min;
  }
  return Math.max(min, Math.min(max, n));
}

function nivelDePuntuacion(puntos) {
  for (var i = 0; i < NIVELES.length; i++) {
    if (puntos >= NIVELES[i].min) {
      return NIVELES[i];
    }
  }
  return null; // sin puntuar
}

function textoEstrellas(n) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

// Revisa un título y lo deja con todos sus campos válidos
function limpiarItem(item) {
  var esSerie = (item.type === "series");
  var limpio = {
    id: String(item.id || Date.now()),
    type: esSerie ? "series" : "movie",
    title: String(item.title || "Sin título"),
    year: Number(item.year) || null,
    genre: String(item.genre || ""),
    desc: String(item.desc || ""),
    rating: entre(item.rating, 0, 5),
    score: entre(item.score, 0, 100),
    img: "",
    added: Number(item.added) || 0,
    watched_seasons: 0,
    total_seasons: 0,
    watched_eps: 0,
    total_eps: 0
  };

  // Solo aceptamos imágenes guardadas como base64
  if (typeof item.img === "string" && item.img.indexOf("data:image/") === 0) {
    limpio.img = item.img;
  }

  // El progreso solo aplica a las series
  if (esSerie) {
    limpio.total_seasons = entre(item.total_seasons, 0, 9999);
    limpio.watched_seasons = entre(item.watched_seasons, 0, 9999);
    limpio.total_eps = entre(item.total_eps, 0, 9999);
    limpio.watched_eps = entre(item.watched_eps, 0, 9999);

    // Lo visto no puede ser más que el total
    if (limpio.total_seasons > 0 && limpio.watched_seasons > limpio.total_seasons) {
      limpio.watched_seasons = limpio.total_seasons;
    }
    if (limpio.total_eps > 0 && limpio.watched_eps > limpio.total_eps) {
      limpio.watched_eps = limpio.total_eps;
    }
  }
  return limpio;
}


// ===== Guardar y cargar =====

function cargarDatos() {
  var texto = localStorage.getItem(CLAVE);
  var lista = EJEMPLOS;

  if (texto) {
    try {
      lista = JSON.parse(texto);
    } catch (error) {
      lista = EJEMPLOS;
    }
  }
  return lista.map(limpiarItem);
}

function guardarDatos() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(items));
  } catch (error) {
    alert("No se pudo guardar (almacenamiento lleno). Exporta tu lista o usa pósters más pequeños.");
  }
}


// ===== Dibujar la lista =====

function ordenar(lista, criterio) {
  lista.sort(function (a, b) {
    if (criterio === "recientes") return b.added - a.added;
    if (criterio === "estrellas") return (b.rating - a.rating) || (b.score - a.score);
    if (criterio === "puntuacion") return (b.score - a.score) || (b.rating - a.rating);
    if (criterio === "titulo") return a.title.localeCompare(b.title, "es");
    return (b.year || 0) - (a.year || 0); // "anio"
  });
}

// Texto y color de las temporadas (lo usan la tarjeta y el detalle)
function estadoTemporadas(vistas, total) {
  var faltan = total - vistas;
  if (faltan > 0) {
    var plural = (faltan > 1) ? "s" : "";
    return { texto: faltan + " temp. pendiente" + plural, color: "#f0a030" };
  }
  return { texto: total + " temp. completadas", color: "#50dc78" };
}

function colorEpisodios(vistos, total) {
  if (vistos >= total) return "#50dc78";
  if (vistos / total >= 0.5) return "#f0a030";
  return "#4a8fff";
}

function htmlProgreso(item) {
  if (item.type !== "series") return "";
  if (item.total_eps === 0 && item.total_seasons === 0) return "";

  var html = "";
  if (item.total_eps > 0) {
    var color = colorEpisodios(item.watched_eps, item.total_eps);
    var porcentaje = item.watched_eps / item.total_eps * 100;
    html += '<p class="progreso" style="color:' + color + '">' + item.watched_eps + "/" + item.total_eps + " episodios</p>";
    html += '<div class="barra-progreso"><div style="width:' + porcentaje + "%;background:" + color + '"></div></div>';
  }
  if (item.total_seasons > 0) {
    var estado = estadoTemporadas(item.watched_seasons, item.total_seasons);
    html += '<p class="progreso" style="color:' + estado.color + '">' + estado.texto + "</p>";
  }
  return html;
}

function htmlTarjeta(item) {
  var nivel = nivelDePuntuacion(item.score);
  var emoji = (item.type === "movie") ? "🎬" : "📺";
  var nombreTipo = (item.type === "movie") ? "Película" : "Serie";

  var poster = emoji;
  if (item.img) {
    poster = '<img src="' + item.img + '" alt="">';
  }

  var etiquetaPuntos = "";
  var textoPuntos = "";
  if (nivel) {
    etiquetaPuntos = '<b class="puntos" style="background:' + nivel.color + '">' + item.score + "</b>";
    textoPuntos = ' <small style="color:' + nivel.color + '">' + item.score + "/100</small>";
  }

  var datos = [];
  if (item.year) datos.push(item.year);
  if (item.genre) datos.push(escapar(item.genre));

  return '<article class="tarjeta" data-id="' + item.id + '">' +
    '<div class="poster">' + poster +
      '<b class="tipo ' + item.type + '">' + nombreTipo + "</b>" + etiquetaPuntos +
    "</div>" +
    "<h3>" + escapar(item.title) + "</h3>" +
    '<p class="meta">' + datos.join(" · ") + "</p>" +
    '<span class="estrellas-texto">' + textoEstrellas(item.rating) + "</span>" + textoPuntos +
    htmlProgreso(item) +
    '<div class="acciones">' +
      '<button data-accion="editar">✏️</button>' +
      '<button data-accion="borrar">🗑️</button>' +
      '<button data-accion="ver" class="ver">Ver</button>' +
    "</div>" +
  "</article>";
}

function dibujarLista() {
  var busqueda = el("buscador").value.toLowerCase();
  var visibles = [];

  // 1. Filtrar por tipo y por texto de búsqueda
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var coincideTipo = (filtroTipo === "todos" || item.type === filtroTipo);
    var coincideTexto = (item.title.toLowerCase().indexOf(busqueda) !== -1 ||
                         item.genre.toLowerCase().indexOf(busqueda) !== -1);
    if (coincideTipo && coincideTexto) {
      visibles.push(item);
    }
  }

  // 2. Ordenar
  ordenar(visibles, el("selectorOrden").value);

  // 3. Contador de arriba
  var peliculas = items.filter(function (x) { return x.type === "movie"; }).length;
  el("contador").textContent = peliculas + " películas • " + (items.length - peliculas) + " series";

  // 4. Dibujar
  if (visibles.length === 0) {
    el("lista").innerHTML = '<p class="vacio">No se encontraron títulos.<br>Agrega el primero con el botón +</p>';
    return;
  }
  el("lista").innerHTML = visibles.map(htmlTarjeta).join("");
}


// ===== Ventana de detalle =====

function abrirDetalle(item) {
  var nivel = nivelDePuntuacion(item.score);
  var emoji = (item.type === "movie") ? "🎬" : "📺";
  var poster = item.img ? '<img src="' + item.img + '" alt="">' : emoji;

  var html = '<div class="detalle-poster">' + poster + "</div>";
  html += '<div class="detalle-cuerpo">';
  html += "<h2>" + escapar(item.title) + "</h2>";
  html += '<p class="meta">' + [item.year, escapar(item.genre)].filter(Boolean).join(" · ") + "</p>";
  html += '<span class="estrellas-texto">' + textoEstrellas(item.rating) + "</span>";
  if (nivel) {
    html += ' <b style="color:' + nivel.color + '">' + item.score + "/100 · " + nivel.texto + "</b>";
  }

  if (item.type === "series" && (item.total_eps > 0 || item.total_seasons > 0)) {
    html += '<div class="caja"><b>Progreso de la serie</b>';
    if (item.total_seasons > 0) {
      var estado = estadoTemporadas(item.watched_seasons, item.total_seasons);
      html += '<p style="color:' + estado.color + '">Temporadas: ' + item.watched_seasons + "/" + item.total_seasons + " — " + estado.texto + "</p>";
    }
    if (item.total_eps > 0) {
      var color = colorEpisodios(item.watched_eps, item.total_eps);
      html += '<p style="color:' + color + '">Episodios: ' + item.watched_eps + "/" + item.total_eps + "</p>";
    }
    html += "</div>";
  }

  if (item.desc) {
    html += '<p class="descripcion">' + escapar(item.desc) + "</p>";
  }
  html += '<div class="botones-form"><button data-accion="cerrar">Cerrar</button>' +
          '<button data-accion="editar" class="principal">Editar</button></div>';
  html += "</div>";

  el("dialogoDetalle").innerHTML = html;
  el("dialogoDetalle").setAttribute("data-id", item.id);
  el("dialogoDetalle").showModal();
}


// ===== Formulario =====

function tipoSeleccionado() {
  return document.querySelector('input[name="tipo"]:checked').value;
}

function marcarEstrellas(cantidad) {
  estrellasActuales = cantidad;
  var botones = el("estrellas").children;
  for (var i = 0; i < botones.length; i++) {
    botones[i].classList.toggle("marcada", i < cantidad);
  }
}

// Mantiene sincronizados la barra, la casilla y el texto de la puntuación
function mostrarPuntos(valor) {
  var puntos = entre(valor, 0, 100);
  var nivel = nivelDePuntuacion(puntos);
  el("rango").value = puntos;
  el("numero").value = (puntos > 0) ? puntos : "";
  el("textoPuntos").textContent = nivel ? (puntos + " · " + nivel.texto) : "–";
}

function mostrarBloqueSerie() {
  el("bloqueSerie").hidden = (tipoSeleccionado() !== "series");
}

function mostrarVistaPrevia(src) {
  imagenActual = src;
  el("vistaPrevia").src = src;
  el("vistaPrevia").hidden = (src === "");
}

function abrirFormulario(item) {
  itemEditando = item;
  el("formulario").reset();
  el("tituloForm").textContent = item ? "Editar título" : "Agregar título";
  el("campoAnio").max = new Date().getFullYear() + 5;

  if (item) {
    document.querySelector('input[name="tipo"][value="' + item.type + '"]').checked = true;
    el("campoTitulo").value = item.title;
    el("campoAnio").value = item.year || "";
    el("campoGenero").value = item.genre;
    el("campoDesc").value = item.desc;
    el("tempVistas").value = item.watched_seasons;
    el("tempTotales").value = item.total_seasons;
    el("epsVistos").value = item.watched_eps;
    el("epsTotales").value = item.total_eps;
  }

  marcarEstrellas(item ? item.rating : 0);
  mostrarPuntos(item ? item.score : 0);
  mostrarVistaPrevia(item ? item.img : "");
  mostrarBloqueSerie();
  el("dialogoForm").showModal();
}

// Al elegir una imagen la reducimos (máx. 400 px de ancho) para que quepa en localStorage
function leerImagen(archivo) {
  var lector = new FileReader();
  lector.onload = function () {
    var imagen = new Image();
    imagen.onload = function () {
      var escala = Math.min(1, 400 / imagen.width);
      var canvas = document.createElement("canvas");
      canvas.width = imagen.width * escala;
      canvas.height = imagen.height * escala;
      canvas.getContext("2d").drawImage(imagen, 0, 0, canvas.width, canvas.height);
      mostrarVistaPrevia(canvas.toDataURL("image/jpeg", 0.8));
    };
    imagen.onerror = function () {
      alert("No se pudo leer la imagen.");
    };
    imagen.src = lector.result;
  };
  lector.readAsDataURL(archivo);
}

function guardarFormulario(evento) {
  evento.preventDefault(); // evita que la página se recargue

  var nuevo = limpiarItem({
    id: itemEditando ? itemEditando.id : Date.now(),
    added: itemEditando ? itemEditando.added : Date.now(),
    type: tipoSeleccionado(),
    title: el("campoTitulo").value.trim(),
    year: el("campoAnio").value,
    genre: el("campoGenero").value.trim(),
    desc: el("campoDesc").value.trim(),
    rating: estrellasActuales,
    score: el("rango").value,
    img: imagenActual,
    watched_seasons: el("tempVistas").value,
    total_seasons: el("tempTotales").value,
    watched_eps: el("epsVistos").value,
    total_eps: el("epsTotales").value
  });

  if (itemEditando) {
    var posicion = items.indexOf(itemEditando);
    items[posicion] = nuevo;
  } else {
    items.push(nuevo);
  }

  guardarDatos();
  el("dialogoForm").close();
  dibujarLista();
}


// ===== Exportar / importar =====

function exportar() {
  var archivo = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
  var enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = "watchlist.json";
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}

function importar(archivo) {
  var lector = new FileReader();
  lector.onload = function () {
    try {
      var datos = JSON.parse(lector.result);
      if (!Array.isArray(datos)) {
        throw new Error("no es una lista");
      }
      if (confirm("Se reemplazarán tus títulos actuales por los " + datos.length + " del archivo. ¿Continuar?")) {
        items = datos.map(limpiarItem);
        guardarDatos();
        dibujarLista();
      }
    } catch (error) {
      alert("El archivo no es un watchlist.json válido.");
    }
  };
  lector.readAsText(archivo);
}


// ===== Eventos (qué pasa cuando el usuario hace clic) =====

// Clic en una tarjeta: según el botón que se tocó, editar, borrar o ver
el("lista").addEventListener("click", function (evento) {
  var tarjeta = evento.target.closest(".tarjeta");
  if (!tarjeta) return;

  var item = items.find(function (x) { return x.id === tarjeta.getAttribute("data-id"); });
  var boton = evento.target.closest("button");
  var accion = boton ? boton.getAttribute("data-accion") : "ver";

  if (accion === "editar") {
    abrirFormulario(item);
  } else if (accion === "borrar") {
    if (confirm("¿Eliminar “" + item.title + "”?")) {
      items = items.filter(function (x) { return x !== item; });
      guardarDatos();
      dibujarLista();
    }
  } else {
    abrirDetalle(item);
  }
});

// Clic dentro de la ventana de detalle
el("dialogoDetalle").addEventListener("click", function (evento) {
  var dialogo = el("dialogoDetalle");
  var boton = evento.target.closest("button");
  var accion = boton ? boton.getAttribute("data-accion") : "";

  if (accion === "editar") {
    var item = items.find(function (x) { return x.id === dialogo.getAttribute("data-id"); });
    dialogo.close();
    abrirFormulario(item);
  } else if (accion === "cerrar" || evento.target === dialogo) {
    dialogo.close(); // también se cierra al hacer clic fuera
  }
});

// Filtros Todos / Películas / Series
document.querySelector(".filtros").addEventListener("click", function (evento) {
  var boton = evento.target.closest("button");
  if (!boton) return;

  filtroTipo = boton.getAttribute("data-tipo");
  var botones = document.querySelectorAll(".filtros button");
  for (var i = 0; i < botones.length; i++) {
    botones[i].classList.toggle("activo", botones[i] === boton);
  }
  dibujarLista();
});

el("buscador").addEventListener("input", dibujarLista);
el("selectorOrden").addEventListener("change", dibujarLista);
el("btnAgregar").addEventListener("click", function () { abrirFormulario(null); });
el("btnExportar").addEventListener("click", exportar);
el("btnImportar").addEventListener("click", function () { el("archivoImportar").click(); });
el("archivoImportar").addEventListener("change", function (evento) {
  var archivo = evento.target.files[0];
  evento.target.value = ""; // permite elegir el mismo archivo otra vez
  if (archivo) importar(archivo);
});

// Formulario
el("formulario").addEventListener("submit", guardarFormulario);
el("btnCancelar").addEventListener("click", function () { el("dialogoForm").close(); });
el("rango").addEventListener("input", function () { mostrarPuntos(el("rango").value); });
el("numero").addEventListener("input", function () { mostrarPuntos(el("numero").value); });
el("campoImagen").addEventListener("change", function (evento) {
  if (evento.target.files[0]) leerImagen(evento.target.files[0]);
});
var radiosTipo = document.querySelectorAll('input[name="tipo"]');
for (var i = 0; i < radiosTipo.length; i++) {
  radiosTipo[i].addEventListener("change", mostrarBloqueSerie);
}

// Las 5 estrellas del formulario (clic otra vez en la misma la quita)
for (var n = 1; n <= 5; n++) {
  var estrella = document.createElement("button");
  estrella.type = "button";
  estrella.textContent = "★";
  estrella.setAttribute("data-valor", n);
  el("estrellas").appendChild(estrella);
}
el("estrellas").addEventListener("click", function (evento) {
  var valor = Number(evento.target.getAttribute("data-valor"));
  if (!valor) return;
  marcarEstrellas(valor === estrellasActuales ? 0 : valor);
});


// ===== Inicio =====
items = cargarDatos();
dibujarLista();
