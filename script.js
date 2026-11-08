'use strict';
const KEY = 'watchlist.v1', YEAR = new Date().getFullYear();
const TIERS = [[90,'#50dc78','Obra maestra 🏆'],[80,'#50dc78','Excelente 🌟'],[70,'#f0a030','Muy buena 👍'],
  [60,'#f0a030','Buena'],[50,'#ff9f40','Regular'],[30,'#e8462a','Mala'],[1,'#e8462a','Muy mala 💀']];
const tier = s => TIERS.find(t => s >= t[0]);
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, Math.round(Number(v)) || a));
const stars = r => '★'.repeat(r) + '☆'.repeat(5 - r);

// Acepta también el watchlist.json de la versión de escritorio
const norm = (o, i = 0) => {
  const s = o.type === 'series', n = k => (s ? clamp(o[k], 0, 9999) : 0);
  let ts = n('total_seasons'), ws = n('watched_seasons'), te = n('total_eps'), we = n('watched_eps');
  if (ts) ws = Math.min(ws, ts);
  if (te) we = Math.min(we, te);
  return {
    id: String(o.id || Date.now() + '-' + i), type: s ? 'series' : 'movie',
    title: String(o.title || 'Sin título').slice(0, 120), year: Number(o.year) || null,
    genre: String(o.genre || ''), desc: String(o.desc || ''),
    rating: clamp(o.rating, 0, 5), score: clamp(o.score, 0, 100),
    img: typeof o.img === 'string' && /^(data:image\/|https?:)/.test(o.img) ? o.img : '',
    watched_seasons: ws, total_seasons: ts, watched_eps: we, total_eps: te, added: Number(o.added) || i
  };
};

const SAMPLE = [
  {type:'movie',title:'Oppenheimer',year:2023,genre:'Drama, Historia',desc:'Magistral biopic sobre el padre de la bomba atómica.',rating:5,score:95},
  {type:'series',title:'Severance',year:2022,genre:'Ciencia Ficción',desc:'Serie increíble sobre la separación entre vida laboral y personal.',rating:5,score:97,watched_eps:9,total_eps:18,watched_seasons:1,total_seasons:2},
  {type:'movie',title:'Dune: Parte 2',year:2024,genre:'Ciencia Ficción',desc:'Épica visual sin igual.',rating:4,score:88},
  {type:'series',title:'The Bear',year:2022,genre:'Drama',desc:'Intensísima serie sobre cocina de alto nivel.',rating:5,score:93,watched_eps:24,total_eps:24,watched_seasons:2,total_seasons:2}
];

let items = load(), filter = 'all', editing = null, img = '', rating = 0;

function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(d)) return d.map(norm); } catch {}
  return SAMPLE.map((o, i) => norm({ ...o, id: 's' + i }, i + 1));
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(items)); }
  catch { alert('No se pudo guardar: almacenamiento lleno. Exporta tu lista o usa pósters más pequeños.'); }
}

const SORTS = {
  recent: (a, b) => b.added - a.added,
  stars: (a, b) => b.rating - a.rating || b.score - a.score,
  score: (a, b) => b.score - a.score || b.rating - a.rating,
  az: (a, b) => a.title.localeCompare(b.title, 'es'),
  year: (a, b) => (b.year || 0) - (a.year || 0)
};

function seasons(w, t) {
  const r = Math.max(0, t - w);
  return r ? [`⏳ ${r} temp. pendiente${r > 1 ? 's' : ''}`, '#f0a030'] : [`✓ ${t} temp. completadas`, '#50dc78'];
}
const epColor = (w, t) => w >= t ? '#50dc78' : w / t >= .5 ? '#f0a030' : '#4a8fff';

function progress(it, big) {
  if (it.type !== 'series' || !(it.total_eps || it.total_seasons)) return '';
  let h = '';
  if (it.total_seasons) { const [t, c] = seasons(it.watched_seasons, it.total_seasons); h += `<p class="prog" style="color:${c}">${t}</p>`; }
  if (it.total_eps) {
    const c = epColor(it.watched_eps, it.total_eps);
    h = `<p class="prog" style="color:${c}">📺 ${it.watched_eps}/${it.total_eps} eps</p>` + h +
      `<div class="bar"><i style="width:${it.watched_eps / it.total_eps * 100}%;background:${c}"></i></div>`;
  }
  return h;
}

function render() {
  const q = $('#search').value.toLowerCase();
  const list = items.filter(i => (filter === 'all' || i.type === filter) &&
    (!q || i.title.toLowerCase().includes(q) || i.genre.toLowerCase().includes(q))).sort(SORTS[$('#sort').value]);
  $('#stats').textContent = `🎬 ${items.filter(i => i.type === 'movie').length} películas • 📺 ${items.filter(i => i.type === 'series').length} series`;
  $('#grid').innerHTML = list.length ? list.map(it => {
    const t = tier(it.score), meta = [it.year, it.genre].filter(Boolean).map(esc).join(' · ');
    return `<article class="card" data-id="${esc(it.id)}">
      <div class="poster">${it.img ? `<img src="${esc(it.img)}" alt="" loading="lazy">` : (it.type === 'movie' ? '🎬' : '📺')}
        <b class="badge ${it.type}">${it.type === 'movie' ? 'Película' : 'Serie'}</b>
        ${t ? `<b class="sc" style="background:${t[1]}">${it.score}</b>` : ''}</div>
      <div class="info"><h3>${esc(it.title)}</h3>${meta ? `<p class="meta">${meta}</p>` : ''}
        <span class="stars">${stars(it.rating)}</span>${t ? ` <small style="color:${t[1]}">${it.score}/100</small>` : ''}
        ${progress(it)}</div>
      <div class="actions"><button data-a="edit">✏️</button><button data-a="del">🗑️</button><button data-a="view">Ver</button></div>
    </article>`;
  }).join('') : '<p class="empty">No se encontraron títulos<br>Agrega el primero con el botón ＋</p>';
}

/* ── Detalle ── */
function openDetail(it) {
  const t = tier(it.score);
  let box = '';
  if (it.type === 'series' && (it.total_eps || it.total_seasons)) {
    box = '<div class="box"><b>📺 Progreso de la serie</b>';
    if (it.total_seasons) { const [s, c] = seasons(it.watched_seasons, it.total_seasons);
      box += `<p style="color:${c}">Temporadas: ${it.watched_seasons}/${it.total_seasons} — ${s}</p>`; }
    if (it.total_eps) { const r = it.total_eps - it.watched_eps, c = epColor(it.watched_eps, it.total_eps);
      box += `<p style="color:${c}">Episodios: ${it.watched_eps}/${it.total_eps} — ${r ? '📌 ' + r + ' por ver' : '✓ Todos vistos'}</p>
        <div class="bar"><i style="width:${it.watched_eps / it.total_eps * 100}%;background:${c}"></i></div>`; }
    box += '</div>';
  }
  $('#detail').innerHTML = `<div class="dposter">${it.img ? `<img src="${esc(it.img)}" alt="">` : (it.type === 'movie' ? '🎬' : '📺')}</div>
    <div class="dbody"><p class="meta">${it.type === 'movie' ? 'Película' : 'Serie'}${it.year ? ' · ' + it.year : ''}${it.genre ? ' · ' + esc(it.genre) : ''}</p>
    <h2>${esc(it.title)}</h2>
    <span class="stars">${stars(it.rating)}</span>${t ? ` <b style="color:${t[1]}">${it.score}/100 · ${t[2]}</b>` : ''}
    ${box}${it.desc ? `<p class="desc">${esc(it.desc)}</p>` : ''}
    <div class="actions end"><button data-a="close">Cerrar</button><button class="primary" data-a="edit">✏️ Editar</button></div></div>`;
  $('#detail').dataset.id = it.id;
  $('#detail').showModal();
}

/* ── Formulario ── */
const f = $('#f');
function setRating(v) { rating = v; [...$('#stars').children].forEach((b, i) => b.classList.toggle('on', i < v)); }
function setScore(v) {
  v = clamp(v, 0, 100);
  $('#sr').value = v; $('#sn').value = v || '';
  const t = tier(v); $('#sd').textContent = v ? v + ' · ' + t[2] : '–'; $('#sd').style.color = t ? t[1] : '';
}
function setType(t) { f.type.value = t; $('#eps').hidden = t !== 'series'; }
function setImg(src) { img = src; $('#prev').src = src; $('#prev').hidden = !src; }

function openForm(it) {
  editing = it; f.reset();
  $('#ftitle').textContent = it ? 'Editar título' : 'Agregar título';
  f.year.max = YEAR + 5;
  setType(it ? it.type : 'movie');
  if (it) {
    f.title.value = it.title; f.year.value = it.year || ''; f.genre.value = it.genre; f.desc.value = it.desc;
    f.ws.value = it.watched_seasons; f.ts.value = it.total_seasons; f.we.value = it.watched_eps; f.te.value = it.total_eps;
  }
  setRating(it ? it.rating : 0); setScore(it ? it.score : 0); setImg(it ? it.img : '');
  $('#form').showModal();
}

$('#stars').innerHTML = [1, 2, 3, 4, 5].map(i => `<button type="button" data-v="${i}">★</button>`).join('');
$('#stars').onclick = e => { const v = +e.target.dataset.v; if (v) setRating(v === rating ? 0 : v); };
$('#sr').oninput = e => setScore(e.target.value);
$('#sn').oninput = e => setScore(e.target.value);
f.querySelectorAll('[name=type]').forEach(r => r.onchange = () => setType(r.value));
$('#cancel').onclick = () => $('#form').close();
$('#loadUrl').onclick = () => { const u = $('#url').value.trim(); if (/^https?:\/\//i.test(u)) setImg(u); else alert('Pega una URL que empiece con http:// o https://'); };

// Reduce el póster para que quepa en localStorage
$('#file').onchange = e => {
  const file = e.target.files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, 400 / im.width), c = document.createElement('canvas');
      c.width = im.width * k; c.height = im.height * k;
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      setImg(c.toDataURL('image/jpeg', .8));
    };
    im.onerror = () => alert('No se pudo leer la imagen.');
    im.src = r.result;
  };
  r.readAsDataURL(file);
};

f.onsubmit = e => {
  e.preventDefault();
  const o = norm({
    id: editing && editing.id, added: editing ? editing.added : Date.now(),
    type: f.type.value, title: f.title.value.trim(), year: f.year.value, genre: f.genre.value.trim(),
    desc: f.desc.value.trim(), rating, score: $('#sr').value, img,
    watched_seasons: f.ws.value, total_seasons: f.ts.value, watched_eps: f.we.value, total_eps: f.te.value
  });
  if (editing) items = items.map(i => i.id === editing.id ? o : i); else items.push(o);
  save(); $('#form').close(); render();
};

/* ── Eventos generales ── */
$('#grid').onclick = e => {
  const card = e.target.closest('.card'); if (!card) return;
  const it = items.find(i => i.id === card.dataset.id), a = e.target.closest('button')?.dataset.a;
  if (a === 'del') { if (confirm(`¿Eliminar “${it.title}”?`)) { items = items.filter(i => i !== it); save(); render(); } }
  else if (a === 'edit') openForm(it);
  else openDetail(it);
};
$('#detail').onclick = e => {
  const a = e.target.closest('button')?.dataset.a, d = $('#detail');
  if (a === 'edit') { const it = items.find(i => i.id === d.dataset.id); d.close(); openForm(it); }
  else if (a === 'close' || e.target === d) d.close();
};
$('#search').oninput = render;
$('#sort').onchange = render;
$('#add').onclick = () => openForm(null);
document.querySelector('.filters').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  filter = b.dataset.f;
  document.querySelectorAll('.filters button').forEach(x => x.classList.toggle('on', x === b));
  render();
};

/* ── Exportar / importar ── */
$('#export').onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' }));
  a.download = 'watchlist.json'; a.click(); URL.revokeObjectURL(a.href);
};
$('#import').onclick = () => $('#importFile').click();
$('#importFile').onchange = async e => {
  const file = e.target.files[0]; e.target.value = ''; if (!file) return;
  try {
    const d = JSON.parse(await file.text());
    if (!Array.isArray(d)) throw 0;
    if (confirm(`Se reemplazarán tus títulos actuales por los ${d.length} del archivo. ¿Continuar?`)) {
      items = d.filter(o => o && typeof o === 'object').map(norm); save(); render();
    }
  } catch { alert('El archivo no es un watchlist.json válido.'); }
};

render();
