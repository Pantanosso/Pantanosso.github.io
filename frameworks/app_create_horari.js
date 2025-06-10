/* Aproximación declarativa: especificamos el resultado final y los datos y dejamos a vue que lo resuelva (que vea qué hay que crear en el DOM, modificar en el DOM, etc.)
*/
// Define classes for schedule management
class Franja {
    hora_inici;
    hora_fi;
    dia;
    assignatura;
    color;
    constructor(hora_inici, hora_fi, dia, assignatura, color) {
        this.hora_inici = hora_inici;
        this.hora_fi = hora_fi;
        this.dia = dia;
        this.assignatura = assignatura;
    }
    esMajorUnQueLaltre(hora_inici, hora_fi){
        const num_hi = parseInt(hora_inici.slice(0,2));
        const num_hf = parseInt(hora_fi.slice(0,2));
        const num_mi = parseInt(hora_inici.slice(3));
        const num_mf = parseInt(hora_fi.slice(3));

        return (num_hi>num_hf) || ( (num_hi===num_hf) && (num_mi>=num_mf) );
    }
    solapaAmb(hora_inici, hora_fi, dia) {
        if (dia !== this.dia) {
            return false;
        }
        let valor = this.esMajorUnQueLaltre(this.hora_inici, hora_inici);
        valor &= this.esMajorUnQueLaltre(hora_inici, this.hora_fi);
        let valor2 = this.esMajorUnQueLaltre(hora_fi, this.hora_fi);
        valor2 &= this.esMajorUnQueLaltre(this.hora_inici, hora_fi);
        valor |= valor2;
        let valor3 = this.esMajorUnQueLaltre(hora_inici, this.hora_inici);
        valor3 &= this.esMajorUnQueLaltre(this.hora_inici, hora_fi);
        let valor4 = this.esMajorUnQueLaltre(this.hora_fi, hora_fi);
        valor4 &= this.esMajorUnQueLaltre(hora_inici, this.hora_fi);
        valor |= valor3;
        valor |= valor4;
        return valor;
    }
}

const conf = {
  //una propiedad llamada data que tiene una funcion como valor
  data() {
    const i = 8;
    const f = 22;
    const increments = 30;
    const dies = ["Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres"];

    const hores = this.crear_hores(i, f, increments);

    let ret_arr = {};
    for(let i in hores){
      ret_arr[parseInt(i) + 1] = [];
    }


    return {
      horari: {},   
      llista_hores:hores,
      llista_hores_inici:Array.from(hores),
      llista_hores_fi:Array.from(hores),
      dies_setmana:dies,
      horari_franja_per_h: this.crear_horari_franja(hores,dies),
      dia_selected:"Escull dia",
      hora_inici_selected:"Escull hora",
      hora_fi_selected:"Escull hora",
      assignatura_selected:"",
      matriu_inversa_hores:this.crear_taulahash_matriu_inversa(hores),
      matriu_inversa_dies:this.crear_taulahash_matriu_inversa(dies),
      franjes_horaries: [],
      opcions_exportar:["PDF", "Excel", "Imatge"],
      opcio_selecionada_per_exportar:"Exportar en",
      objecte_editant_se_en_dialog:null,
      color_selected:"#FFFFFF",
      matriu_color_assignatura: {},
      dies_borrats_segons_h:ret_arr,
      draggingElement:null,
      ll_franjes_horaries:[],
    };
  },
  //funciones que se pueden llamar desde el html
  methods: {
     actualitzarStorage() {
      const horarisExistents = JSON.parse(
        localStorage.getItem("horaris_guardats") || "[]"
      );
      const idx = horarisExistents.findIndex(h => h.id === this.horari.id);
      if (idx !== -1) {
        horarisExistents[idx].franges = this.obtenirTotesFranjes();
        localStorage.setItem(
          "horaris_guardats",
          JSON.stringify(horarisExistents)
        );
      }
    },

    handlerClick:function (evt) {
        let element_cell = evt.target;
        const url = this.crear_url(evt);
        let frame = document.getElementById("iframe_dialog");
        frame.src = url; //canviem la url

        let dia = document.getElementById("myDialog"); // Agafar-lo aquí dins!
        dia.showModal();
        frame.addEventListener("load", () => {
          this.objecte_editant_se_en_dialog = element_cell;
          const botoEditar = frame.contentDocument.getElementById("btnEditar");
          if (botoEditar) {
            botoEditar.addEventListener("click", (event1) =>
                this.dialog_rebreFranjaEditar(event1, element_cell
                ));
          }
        }, { once: true }); // permet que només hi hagi un action listener de click
      },eliminar: function(e){
        this.eliminarFranja(e,this.objecte_editant_se_en_dialog);
        let dialog = document.getElementById("myDialog");
        dialog.close();
      },
      eliminarFranja:function(e,target_obj){
        e.preventDefault();

        const rowspan = parseInt(target_obj.getAttribute("rowspan"));
        let assignatura = target_obj.textContent;
        assignatura =  assignatura.toLowerCase();
        if (this.matriu_color_assignatura[assignatura] !==undefined){
          let val = this.matriu_color_assignatura[assignatura]["elements"];
          this.matriu_color_assignatura[assignatura]["elements"] = val.filter(
              el => el !== target_obj
          );
          if (this.matriu_color_assignatura[assignatura]["elements"].length === 0){
            delete this.matriu_color_assignatura[assignatura];
          }
        }

        target_obj.style.setProperty('--color-fons', "#FFFFFF"); //eliminem color


        target_obj.textContent = "";

        const row_i = target_obj.parentElement.rowIndex;
        let index_row_fi = rowspan+ row_i  - 1;

        let iter2 = row_i + 1;
        let tbody = target_obj.parentElement.parentElement;

        target_obj.setAttribute("rowspan", "1");

        //target_obj.removeEventListener("click", this.handlerClick.bind(this));
        let tdClone = target_obj.cloneNode(true);
        target_obj.insertAdjacentElement('afterend', tdClone);
        const index_dia = this.trobar_posicio_inversa(row_i, target_obj.cellIndex) ; // index_dia
        target_obj.remove();

        while (iter2 <= index_row_fi){
          let tr = tbody.children[iter2];
          let tdClone = target_obj.cloneNode(true);
          let index = index_dia - 1; //posició abans

          let vec = this.dies_borrats_segons_h[iter2];
          //ordenat al reves
          //vec = vec.toSorted((a, b) => b - a);

          for (let i = 0; i < vec.length; i++) {
            //alert( vec[i] + " " + index_dia + " " + index )
            if(index_dia > vec[i]){
              index--;
            }
            else if(vec[i] === index_dia ){
              this.dies_borrats_segons_h[iter2].splice(i, 1);
            }

          }

          //const cella_del_target_obj = target_obj.cellIndex;
          const cella_del_target_obj = index;
          //TROBEM ERRORS:
          if (tr.children[cella_del_target_obj] === undefined) {
            debugger; // Pausa aquí si DevTools està obert
          }
          tr.children[cella_del_target_obj].insertAdjacentElement('afterend', tdClone);
          iter2++;
        }
      },dialog_rebreFranjaEditar:function(event1, target_obj){
        let frame = document.getElementById("iframe_dialog");

        const dia_setmana_selected = frame.contentDocument.getElementById("id_dia_setmana").value;
        const hora_inici_selected = frame.contentDocument.getElementById("id_hora_inici").value;
        const hora_fi_selected = frame.contentDocument.getElementById("id_hora_fi").value;
        const assignatura_selected = frame.contentDocument.getElementById("id_assignatura").value;
        const color_franja = frame.contentDocument.getElementById("id_color_franja").value;
        const color_selected_assignatura = frame.contentDocument.getElementById("idColorAss").value;
        const canviar_color_assignatura = frame.contentDocument.getElementById("id_canviar_color").checked;

        this.rebreFranjaEditada(
            event1,
            target_obj,
            dia_setmana_selected,
            hora_inici_selected,
            hora_fi_selected,
            assignatura_selected,
            color_franja,
            color_selected_assignatura,
            canviar_color_assignatura
        );
        let dialog = document.getElementById("myDialog");
        dialog.close();

    },
      rebreFranjaEditada:function (
          event1,
          target_obj,
          dia_setmana_selected,
          hora_inici_selected,
          hora_fi_selected,
          assignatura_selected,
          color_franja,
          color_selected_assignatura,
          canviar_color_assignatura
      ){
        // Eliminem el objecte:
        this.eliminarFranja(event1,target_obj);

        //modifiquem el color

        //1. guardem valors:
        const tem_dia_selected = this.dia_selected;
        const tem_hora_inici_selected = this.hora_inici_selected;
        const tem_hora_fi_selected = this.hora_fi_selected;
        const tem_assignatura_selected = this.assignatura_selected;
        const tem_color_selected = this.color_selected;

        // 2.passem valors:
        this.dia_selected = dia_setmana_selected;
        this.hora_inici_selected = hora_inici_selected;
        this.hora_fi_selected = hora_fi_selected;
        this.assignatura_selected = assignatura_selected;
        this.color_selected = color_franja;


        let assignatura = assignatura_selected.toLowerCase();
       if(this.matriu_color_assignatura[assignatura] !== undefined && canviar_color_assignatura) {
          // Actualizar el color en la estructura de datos
          this.matriu_color_assignatura[assignatura]["color"] = color_selected_assignatura;
          
          // Actualizar el estilo visual
          let llista = this.matriu_color_assignatura[assignatura]["elements"];
          for (let i = 0; i < llista.length; i++) {
            llista[i].style.setProperty('--color-fons', color_selected_assignatura);
          }
        }
  
        // Actualizar el color de la franja actual (aunque no sea cambio global)
        this.color_selected = canviar_color_assignatura ? color_selected_assignatura : color_franja;

        this.afegir_franja(event1);

        this.actualitzarStorage();


        // 3.recuperem valors:
        this.dia_selected = tem_dia_selected;
        this.hora_inici_selected = tem_hora_inici_selected;
        this.hora_fi_selected = tem_hora_fi_selected;
        this.assignatura_selected = tem_assignatura_selected;
        this.color_selected = tem_color_selected;

   

      },
      netejar:function(e){
        e.preventDefault();
        this.dia_selected = "Escull dia";
        this.hora_inici_selected = "Escull hora";
        this.hora_fi_selected = "Escull hora";
        this.assignatura_selected = "";
        this.llista_hores_fi = Array.from(this.llista_hores);
        this.llista_hores_inici = Array.from(this.llista_hores);
      },
      esMajorUnQueLaltre:function(hora_inici, hora_fi){
        const num_hi = parseInt(hora_inici.slice(0,2));
        const num_hf = parseInt(hora_fi.slice(0,2));
        const num_mi = parseInt(hora_inici.slice(3));
        const num_mf = parseInt(hora_fi.slice(3));

        return (num_hi>num_hf) || ( (num_hi===num_hf) && (num_mi>=num_mf) );
        },
      filtrar_hores_inici:function(){
        let list = Array.from(this.llista_hores);
        let index = 0;
        while((index < list.length) && (this.esMajorUnQueLaltre(this.hora_inici_selected, list[index]))){
          list.shift();
        }
        this.llista_hores_fi = list;
      },
      eliminar_horari:function(e){
          Swal.fire({
              title: "Estàs segur de que vols eliminar l'horari?",
              text: "No podràs tirar endarrere!",
              icon: "warning",
              showCancelButton: true,
              confirmButtonColor: "#d33",
              cancelButtonColor: "#9b9b9b",
              confirmButtonText: "Sí, elimina'l"
          }).then((result) => {
              if (result.isConfirmed) {
                  Swal.fire({
                      title: "Eliminat!",
                      text: "El teu document ha estat eliminat.",
                      icon: "success"
                  }).then((result) => {
                      window.location.href = "menu.html";
                  });
              }
          });
      },
      filtrar_hores_fi:function(){
        let list = Array.from(this.llista_hores);
        let index = list.length - 1;
        while((index > -1) && (this.esMajorUnQueLaltre(list[index], this.hora_fi_selected))){
          list.pop();
          index--;
        }
        this.llista_hores_inici = list;
      },
      exportar_horari:function(e){
        const taula = document.getElementById("taula2").children[0].children[0];
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        switch (this.opcio_selecionada_per_exportar) {
          case "PDF":
            doc.html(taula, {
              callback: function (doc) {
                doc.save('horari.pdf');
              },
              x: 0.5,
              y: 0.5,
              html2canvas: {
                scale: 0.45,
                width: doc.internal.pageSize.getWidth() - 20
              }
            });
            break;
          case "Excel":
            var wb = XLSX.utils.table_to_book(taula, { raw: true });
            /* Export to file (start a download) */
            XLSX.writeFile(wb, "horari.xlsx");
            break;
          case "Imatge":
            html2canvas(taula).then(function(canvas) {
              const image = canvas.toDataURL('image/png');
              const link = document.createElement('a');
              link.download = 'horari.png';
              link.href = image;
              link.click();
            });
            break;
        }

        this.opcio_selecionada_per_exportar = "Exportar en";

      },trobar_posicio:function(iter, index_dia){
        let vec_dies_que_falten = this.dies_borrats_segons_h[iter];
        let disc = index_dia;

        for (let i = 0; i < vec_dies_que_falten.length; i++) {
          if (vec_dies_que_falten[i] < index_dia){
            disc--;
          }
          else if(vec_dies_que_falten[i] === index_dia){
            //alert(vec_dies_que_falten)
            return -1;
          }
        }
        return disc;
    },
      afegir_franja: function(e){
        e.preventDefault();
        //console.log(this.id);
        if (this.dia_selected==="Escull dia"){
          Swal.fire({
            icon: "error",
            title: "Dia incorrecte",
            text: "Has de seleccionar un dia",
          });
          return;
        }
        if (this.hora_inici_selected==="Escull hora"){
          Swal.fire({
            icon: "error",
            title: "Hora inici incorrecte",
            text: "Has de seleccionar una hora d'inici",
          });
          return;
        }
        if (this.hora_fi_selected==="Escull hora") {
          Swal.fire({
            icon: "error",
            title: "Hora fi incorrecte",
            text: "Has de seleccionar una hora fi",
          });
          return;
        }

        if (this.esMajorUnQueLaltre(this.hora_inici_selected, this.hora_fi_selected)){
          Swal.fire({
            icon: "error",
            title: "Hora fi > Hora inici",
            text: "Has d'escollir una hora fi que sigui major que l'hora d'inici",
          });
          return;
        }

        if (this.assignatura_selected==="")
        {
          Swal.fire({
            icon: "error",
            title: "Assignatura no buida",
            text: "Has d'escriure algun caràcter a l'assignatura.",
          });
          return;
        }
        let taula = document.getElementById("taula2");
        let table = taula.children[0];
        let tbody = table.children[0];

        const index_dia = this.matriu_inversa_dies[this.dia_selected] + 1;
        const index_hora_fi = this.matriu_inversa_hores[this.hora_fi_selected]; //ha de ser 1 menys
        const index_hora_inici = this.matriu_inversa_hores[this.hora_inici_selected] + 1;
        let iterador_hores = index_hora_inici + 1;

        /*1.Afegim nou element a la franja: */
        let element_row = tbody.children[index_hora_inici];
        const allargada = element_row.cells.length;
        const disc = this.trobar_posicio(index_hora_inici, index_dia);

        let element_cell = element_row.cells[disc];

        element_cell.textContent = this.assignatura_selected;
        element_cell.setAttribute("rowspan", (index_hora_fi - index_hora_inici  + 1) + "");

        element_cell.addEventListener("click", this.handlerClick.bind(this));


        let assignatura = this.assignatura_selected;
        assignatura =  assignatura.toLowerCase();

        if (this.matriu_color_assignatura[assignatura] === undefined){
          this.matriu_color_assignatura[assignatura] = {"elements":[] ,"color":"#FFFFFF"};
        }
        this.matriu_color_assignatura[assignatura]["elements"].push(element_cell);

        //const texts = val.map(el => el.textContent);
        //alert(texts.join("\n"));

        element_cell.style.setProperty('--color-fons', this.color_selected);

        /*2.Borrem elements restants: */

        while (iterador_hores <= index_hora_fi){

          let element_row = tbody.children[iterador_hores];
          const length = element_row.cells.length;
          let disc = this.trobar_posicio(iterador_hores, index_dia)
          let element_cell = element_row.cells[disc];
          this.dies_borrats_segons_h[iterador_hores].push(index_dia); // afegim el index del dia que falta

          element_cell.remove();
          iterador_hores++;
        }
        console.log(JSON.stringify(this.dies_borrats_segons_h, null, 0));

        this.netejar(e);

      },
    crear_taulahash_matriu_inversa: function(arr){
        let ret_arr = {};
        for(let i in arr){
          ret_arr[arr[i]] = parseInt(i);
        }
        return ret_arr;
    },
    crear_hores: function(i, f, increments){
        let j = 0;
        let minut = 0;
        let arr = [];
        let hora = i;
        let string_hora = "";
        let string_min = "";
        while (hora <= f){
          string_hora = hora.toString();
          string_min = minut.toString();
          if (minut < 10){
            string_min = "0" + string_min;
          }
          if(hora < 10){
            string_hora = "0" + string_hora;
          }
          arr.push(string_hora + ":" + string_min);
          minut += increments;
          if(minut >= 60){
            hora++;
            minut -= 60;
          }
        }

        return arr;
    },
    crear_horari_franja: function (hores,dies) {
      let taula = {};
      for (let i in  hores) {
        taula[hores[i]] = [];
        for (let j in dies){
          taula[hores[i]].push("");
        }
      }
      return taula;
    },
    guardar_horari: function(e) {
      Swal.fire({
        title: "Amb quin nom vols guardar l'horari?",
        input: "text",
        inputAttributes: {
          autocapitalize: "off"
        },
        showCancelButton: true,
        confirmButtonText: "Guardar",
        showLoaderOnConfirm: true,
        preConfirm: async (nom) => nom,
        allowOutsideClick: () => !Swal.isLoading()
      }).then((result) => {
        if (result.isConfirmed) {
          const nom = result.value.trim();
          if (nom !== "") {
            // Construimos el objeto horario a guardar
            const horari_guardat = {
              id: Date.now(),
              nom: nom,
              franges: this.obtenirTotesFranjes(),
              dies: this.dies_setmana,
              hores: this.llista_hores,
              dataCreacio: new Date().toISOString()
            };

            // Cargamos los horarios ya guardados (si los hay)
            const horaris_existents = JSON.parse(localStorage.getItem("horaris_guardats") || "[]");
            horaris_existents.push(horari_guardat);
            localStorage.setItem("horaris_guardats", JSON.stringify(horaris_existents));

            Swal.fire({
              title: "S'ha guardat correctament",
              text: "Clica el botó per continuar",
              icon: "success"
            }).then(() => {
              window.location.href = "menu.html";
            });

          } else {
            Swal.fire({
              icon: "error",
              title: "No pots guardar un horari sense nom",
              text: "Escull un altre nom"
            });
          }
        }
      });
    },
    tancarDialog:function(e){
        let dialog = document.getElementById("myDialog");
        dialog.close();
        e.preventDefault();
    },
    crear_url:function(e){

      let element = e.target;
      const rowspan = element.getAttribute("rowspan");
      const cell_index = element.cellIndex;
      const tr = element.parentElement;
      const index_h_i = element.parentElement.rowIndex;
      const index_h_f = index_h_i + parseInt(rowspan) - 1; // es -1 o sense -1
      const params = new URLSearchParams();
      const index_dia = this.trobar_posicio_inversa(index_h_i, element.cellIndex) - 1;

      const dia = this.dies_setmana[index_dia];


      params.append("id_dia_setmana", dia);
      params.append("id_hora_inici", tr.children[0].textContent);
      params.append("id_hora_fi", this.llista_hores[index_h_f]);
      params.append("id_assignatura", element.textContent);
      params.append("id_color", element.style.getPropertyValue('--color-fons'));
      params.append("id_color_assignatura", element.style.getPropertyValue('--color-fons'));

      const url = "editarFranja.html?" + params.toString();
      return url;
    },
    trobar_posicio_inversa:function(index_hora, index_dia){
        this.dies_borrats_segons_h[index_hora] = this.dies_borrats_segons_h[index_hora].sort();
        let vec = Array.from(this.dies_borrats_segons_h[index_hora]);
        let valor = index_dia;

        for (let i = 0; i < vec.length; i++) {
          //alert("loop")
          if (vec[i] <= valor){
            valor ++;
          }
        }
        //alert("retornem: " + valor)
        return valor;
    },

    obtenirTotesFranjes: function() {
      const franges = [];
      const assignatures = Object.keys(this.matriu_color_assignatura);
      
      assignatures.forEach(assignatura => {
        this.matriu_color_assignatura[assignatura].elements.forEach(element => {
          const tr = element.parentElement;
          const hora_inici = tr.cells[0].textContent;
          const dia_index = this.trobar_posicio_inversa(tr.rowIndex, element.cellIndex) - 1;
          const dia = this.dies_setmana[dia_index];
          const rowspan = parseInt(element.getAttribute("rowspan"));
          const hora_fi = this.llista_hores[this.llista_hores.indexOf(hora_inici) + rowspan - 1];

          const colorActual = element.style.getPropertyValue('--color-fons') || 
                         this.matriu_color_assignatura[assignatura].color;
      
          
          franges.push({
            dia: dia,
            hora_inici: hora_inici,
            hora_fi: hora_fi,
            assignatura: assignatura,
            color: colorActual
          });
        });
      });
      
      return franges;
    },



    afegir_actionListenersAcella:function (cell) {

      cell.addEventListener('dragstart', (event) => {
        this.draggingElement = event.target;
        this.color_saved_on_drag = event.target.style.getPropertyValue('--color-fons');
      });

      cell.addEventListener('dragover', function(event) {
        event.preventDefault();
      });

      cell.addEventListener('dragleave', function(event) {
        event.target.classList.remove('selected');
        event.preventDefault();
      });

      cell.addEventListener('dragenter', function(event) {
        event.target.classList.add('selected');
        event.preventDefault();
      });

      cell.addEventListener('drop', function(event)  {
        event.preventDefault();
        event.target.classList.remove('selected');
        if (!this.draggingElement || this.draggingElement.textContent === "") {
          this.draggingElement = null;
          return;
        }

        const elementdragged = this.draggingElement;

        const element_ondrop = event.target;

        const index_h_i = element_ondrop.parentElement.rowIndex;
        const rowspan = elementdragged.getAttribute("rowspan");
        const index_h_f = index_h_i + parseInt(rowspan) - 1;


        const index_dia = this.trobar_posicio_inversa(element_ondrop.parentElement.rowIndex, element_ondrop.cellIndex) - 1;
        const dia_setmana_selected = this.dies_setmana[index_dia];
        const hora_inici_selected = this.llista_hores[index_h_i - 1];
        const hora_fi_selected = this.llista_hores[index_h_f];
        const assignatura_selected = elementdragged.textContent;
        const color_franja = elementdragged.style.getPropertyValue('--color-fons');
        const color_selected_assignatura = color_franja;
        const canviar_color_assignatura = false;

        this.rebreFranjaEditada(
            event,
            this.draggingElement,
            dia_setmana_selected,
            hora_inici_selected,
            hora_fi_selected,
            assignatura_selected,
            color_franja,
            color_selected_assignatura,
            canviar_color_assignatura
        );
        console.log("DROP")

        this.draggingElement = null;
      }.bind(this)); //fem que el this de dins el cell.addEvent sigui el mateix que el del app_Create

    },
},mounted() {
    const rawId = new URLSearchParams(window.location.search).get('id');
   if (rawId === 'base' && window.HORARI_BASE) {
    this.horari = window.HORARI_BASE;
  } else if (rawId) {
    const id = Number(rawId);
    const guardats = JSON.parse(localStorage.getItem("horaris_guardats") || "[]");
    const trobat = guardats.find(h => h.id === id);
    if (trobat) {
      this.horari = trobat;
    }
  }
    const table = document.getElementById("taula2").children[0]; // tbody
    for (let i = 1; i < table.rows.length; i++) {
      const row = table.rows[i];
      for (let j = 1; j < row.cells.length; j++) {
        const cell = row.cells[j];

        cell.setAttribute("draggable", true); // assegura que es pugui arrossegar
        this.afegir_actionListenersAcella(cell);
        cell.style.setProperty('--color-fons', '#FFFFFF');
      }
    }
  },
  destroyed() {
    const table = document.getElementById("taula2").children[0]; // tbody
    for (let i = 1; i < table.rows.length; i++) {
      const row = table.rows[i];
      for (let j = 1; j < row.cells.length; j++) {
        const cell = row.cells[j];

        cell.removeEventListener('dragover', (event) => {});

      }
    }
  }

};

const taula1 = Vue.createApp(conf);
taula1.mount("#taula1");

const taula2 = Vue.createApp(conf);

taula2.mount("#taula2");
