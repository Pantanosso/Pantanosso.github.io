

        const { jsPDF } = window.jspdf;

        const { createApp } = Vue;
        
        createApp({
            data() {
                return {
                    horari: {},
                    dies_setmana: ["Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres"],
                    llista_hores: [],
                    opcions_exportar: ["PDF", "Excel", "Imatge"],
                    opcio_selecionada_per_exportar: "Exportar en",
                    matriu_color_assignatura: {},
                     darkMode: false
                };
            },
            methods: {

                toggleDarkMode() {
                    this.darkMode = !this.darkMode;
                    // Aplicar/quitar clase en <html>
                    document.documentElement.classList.toggle('dark', this.darkMode);
                    // Persistir preferencia
                    localStorage.setItem('darkMode', this.darkMode);
                    },




            async compartirHorari() {
                const taula = document.getElementById("taula2").children[0];

                try {
                // 1) Captura la taula sencera amb html2canvas
                const canvas = await html2canvas(taula, {
                    scale: 2,
                    width: taula.scrollWidth,
                    height: taula.scrollHeight,
                    windowWidth: taula.scrollWidth,
                    windowHeight: taula.scrollHeight,
                    scrollX: 0,
                    scrollY: -window.scrollY
                });

                // 2) Converteix a Blob
                canvas.toBlob(async blob => {
                    if (!blob) throw new Error("No s'ha pogut generar la imatge");

                    // 3) Crea un File per compartir
                    const file = new File([blob], 'horari.png', { type: 'image/png' });

                    // 4) Si el navegador suporta compartir fitxers…
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                        files: [file],
                        title: this.horari.nom || 'El meu Horari',
                        text: 'T envio el meu horari en imatge'
                        });
                    } catch (err) {
                        console.error('Error al compartir:', err);
                    }
                    } else {
                    // 5) Fallback: copia la imatge al porta-retalls
                    try {
                        await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                        ]);
                        Swal.fire({
                        icon: 'success',
                        title: 'Imatge copiada',
                        text: 'He copiat la imatge al porta-retalls. Pots enganxar-la on vulguis.'
                        });
                    } catch (err) {
                        console.error('Error al copiar al porta-retalls:', err);
                        Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'No puc copiar la imatge automàticament.'
                        });
                    }
                    }
                }, 'image/png');

                } catch (err) {
                console.error('Error generant la imatge:', err);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No s\'ha pogut generar la imatge de l\'horari.'
                });
                }
            },

                
                carregarHorari() {
                    const urlParams = new URLSearchParams(window.location.search);
                    const rawId = urlParams.get('id');
                    
                    if (rawId === 'base' && window.HORARI_BASE) {
                        this.horari = window.HORARI_BASE;
                        this.llista_hores = window.HORARI_BASE.hores;
                    } else {
                        // Cargar horario guardado
                        const id = Number(rawId);
                        const horarisGuardats = JSON.parse(localStorage.getItem("horaris_guardats") || []);
                        const horariTrobat = horarisGuardats.find(h => h.id === id);
                        
                        if (horariTrobat) {
                        this.horari = horariTrobat;
                        this.llista_hores = horariTrobat.hores;
                        
                        // Inicializar colores
                        horariTrobat.franges.forEach(franja => {
                            this.matriu_color_assignatura[franja.assignatura] = franja.color;
                        });
                        } else {
                        Swal.fire("Error", "Horari no trobat", "error").then(() => {
                            window.location.href = "llistar_horaris.html";
                        });
                        }
  }
},
                
                obtenirFranja(dia, hora) {
                    if (!this.horari.franges) return null;
                    
                    const horaIndex = this.llista_hores.indexOf(hora);
                    
                    return this.horari.franges.find(f => {
                        const iniciIndex = this.llista_hores.indexOf(f.hora_inici);
                        const fiIndex = this.llista_hores.indexOf(f.hora_fi);
                        return f.dia === dia && horaIndex >= iniciIndex && horaIndex < fiIndex;
                    });
                },
                
                obtenirColor(dia, hora) {
                    const franja = this.obtenirFranja(dia, hora);
                    if (franja) {
                        return franja.color;
                    } else {
                       
                        return 'var(--bg-fondo)';
                    }
                    },
                
                obtenirRowspan(dia, hora) {
                    const franja = this.obtenirFranja(dia, hora);
                    if (!franja) return 1;
                    
                    const iniciIndex = this.llista_hores.indexOf(franja.hora_inici);
                    const fiIndex = this.llista_hores.indexOf(franja.hora_fi);
                    return fiIndex - iniciIndex;
                },
                
                esPrimeraHoraFranja(dia, hora) {
                    const franja = this.obtenirFranja(dia, hora);
                    if (!franja) return true;
                    
                    return hora === franja.hora_inici;
                },
                
                exportar_horari() {
                    const taula = document.getElementById("taula2").children[0];

                    switch (this.opcio_selecionada_per_exportar) {
                        case "PDF":
                        html2canvas(taula, {
                            scale: 1,
                            width: taula.scrollWidth,
                            height: taula.scrollHeight,
                            windowWidth: taula.scrollWidth,
                            windowHeight: taula.scrollHeight,
                            scrollX: 0,
                            scrollY: -window.scrollY
                        }).then(canvas => {
                            // 1) Transformem tot el canvas a dataURL
                            const imgData = canvas.toDataURL("image/png");
                            // 2) Creem el PDF amb la mida exacta del canvas
                            const pdf = new jsPDF({
                            orientation: "landscape",
                            unit: "pt",
                            format: [canvas.width, canvas.height]
                            });
                            // 3) Afegim la imatge de la taula tota sencera
                            pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
                            // 4) Descarreguem
                            pdf.save("horari.pdf");
                        });
                        break;

                        case "Excel":
                        const wb = XLSX.utils.table_to_book(taula, { raw: true });
                        XLSX.writeFile(wb, "horari.xlsx");
                        break;

                        case "Imatge":
                        html2canvas(taula, {
                            scale: 1,
                            width: taula.scrollWidth,
                            height: taula.scrollHeight,
                            windowWidth: taula.scrollWidth,
                            windowHeight: taula.scrollHeight,
                            scrollX: 0,
                            scrollY: -window.scrollY
                        }).then(canvas => {
                            const image = canvas.toDataURL("image/png");
                            const link = document.createElement("a");
                            link.download = "horari.png";
                            link.href = image;
                            link.click();
                        });
                        break;
                    }

                    this.opcio_selecionada_per_exportar = "Exportar en";
                    }


            },
            mounted() {
                   this.carregarHorari();
                   const stored = localStorage.getItem('darkMode');
                    if (stored !== null) {
                    this.darkMode = stored === 'true';
                    } else {
                    // si no hay preferencia, usar prefers-color-scheme
                    this.darkMode = window.matchMedia &&
                                    window.matchMedia('(prefers-color-scheme: dark)').matches;
                    }
                    document.documentElement.classList.toggle('dark', this.darkMode);
                            }
        }).mount("#app");
