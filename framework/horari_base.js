// horaris_base.js
// Horari base de demostració per al prototip (sense backend)
// Aquest objecte ha d'incloure els camps necessaris perquè el frontend el processi de manera coherent.

// Dies de la setmana utilitzats en l'horari
const DIES_SETMANA_BASE = [
  "Dilluns",
  "Dimarts",
  "Dimecres",
  "Dijous",
  "Divendres"
];

// Hores disponibles (increment de 30 minuts de 08:00 a 22:00)
function crearHores(inici = 8, fi = 22, increment = 30) {
  const arr = [];
  let hora = inici;
  let minut = 0;
  while (hora < fi || (hora === fi && minut === 0)) {
    const hh = hora.toString().padStart(2, '0');
    const mm = minut.toString().padStart(2, '0');
    arr.push(`${hh}:${mm}`);
    minut += increment;
    if (minut >= 60) {
      hora += 1;
      minut -= 60;
    }
  }
  return arr;
}

// Llistat complet d'hores (xarxa d'extremitats d'interval)
const HORES_BASE = crearHores(8, 22, 30);

// Franges d'horari base: objectes amb hora_inici, hora_fi, dia, assignatura, aula, professor i color
const FRANJES_BASE = [
  { dia: 'Dilluns',    hora_inici: '08:00', hora_fi: '09:00', assignatura: 'Matemàtiques',   color: '#FFCDD2' },
  { dia: 'Dilluns',    hora_inici: '09:00', hora_fi: '10:00', assignatura: 'Català',        color: '#C8E6C9' },
  { dia: 'Dimarts',    hora_inici: '08:00', hora_fi: '09:00', assignatura: 'Física',             color: '#BBDEFB' },
  { dia: 'Dimarts',    hora_inici: '09:00', hora_fi: '10:00', assignatura: 'Química',            color: '#FFE0B2' },
  { dia: 'Dimecres',   hora_inici: '08:00', hora_fi: '09:00', assignatura: 'Història',       color: '#D1C4E9' },
  { dia: 'Dijous',     hora_inici: '08:00', hora_fi: '09:00', assignatura: 'Biologia',          color: '#FFECB3' },
  { dia: 'Divendres',  hora_inici: '08:00', hora_fi: '09:00', assignatura: 'Educ. Física',       color: '#B2EBF2' }
];

// Horari base complet
const HORARI_BASE = {
  id: 'base',
  nom: 'Horari Base',
  dataCreacio: '2025-06-01',
  dies: DIES_SETMANA_BASE,
  hores: HORES_BASE,
  franges: FRANJES_BASE
};

// Exposem al global perquè el frontend pugui accedir-hi
window.HORARI_BASE = HORARI_BASE;
