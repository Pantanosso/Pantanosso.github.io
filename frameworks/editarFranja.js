/* Aproximación declarativa: especificamos el resultado final y los datos y dejamos a vue que lo resuelva (que vea qué hay que crear en el DOM, modificar en el DOM, etc.)
*/
// Define classes for schedule management
const conf = {
    //una propiedad llamada data que tiene una funcion como valor
    data() {
        const i = 8;
        const f = 22;
        const increments = 30;
        const dies = ["Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres"];
        const hores = this.crear_hores(i,f, increments);

        return {
            dia_setmana:"",
            hora_inici:"",
            hora_fi:"",
            assignatura:"",
            color_franja:"#FFFFFF",
            color_assignatura:"#FFFFFF",
            color_assignatura_dialog:"#FFFFFF",

            ll_dies:dies,
            ll_hores:hores,
            ll_hores_inici:hores,
            ll_hores_fi:hores,

            copia_dia_setmana:"",
            copia_hora_inici:"",
            copia_hora_fi:"",
            copia_assignatura:"",
            copia_color:"#FFFFFF",
            copia_color_assignatura:"#FFFFFF",
            canviar_color_assignatura:false,
        };
    },
    //funciones que se pueden llamar desde el html
    methods: {
        esMajorUnQueLaltre:function(hora_inici, hora_fi){
            const num_hi = parseInt(hora_inici.slice(0,2));
            const num_hf = parseInt(hora_fi.slice(0,2));
            const num_mi = parseInt(hora_inici.slice(3));
            const num_mf = parseInt(hora_fi.slice(3));

            return (num_hi>num_hf) || ( (num_hi==num_hf) && (num_mi>=num_mf) );
        },
        filtrar_hores_inici:function(){
            let list = Array.from(this.ll_hores);
            let index = 0;
            while((index < list.length) && (this.esMajorUnQueLaltre(this.hora_inici, list[index]))){
                list.shift();
            }
            this.ll_hores_fi = list;
        },
        filtrar_hores_fi:function(){
            let list = Array.from(this.ll_hores);
            let index = list.length - 1;
            while((index > -1) && (this.esMajorUnQueLaltre(list[index], this.hora_fi))){
                list.pop();
                index--;
            }
            this.ll_hores_inici = list;
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
        reiniciar_parametres:function() {
            this.dia_setmana = this.copia_dia_setmana;
            this.hora_inici = this.copia_hora_inici;
            this.hora_fi = this.copia_hora_fi;
            this.assignatura = this.copia_assignatura;
            this.color = this.copia_color;
            this.filtrar_hores_inici();
            this.filtrar_hores_fi();
        },
        color_franja_assignatura(e){
            let dialog = document.getElementById("myDialog");
            dialog.showModal();

        },
        tancarDialog:function(){
            let dialog = document.getElementById("myDialog");
            dialog.close();

        },
        EditarDialog:function(){
            this.color_assignatura = this.color_assignatura_dialog;
            this.copia_color_assignatura = this.color_assignatura;
            this.color_franja = this.color_assignatura;
            let dialog = document.getElementById("myDialog");
            dialog.close();
        }
    },
    mounted() {
        const params = new URLSearchParams(window.location.search);
        this.dia_setmana = params.get("id_dia_setmana") || "";
        this.hora_inici = params.get("id_hora_inici") || "";
        this.hora_fi = params.get("id_hora_fi") || "";
        this.assignatura = params.get("id_assignatura") || "";
        this.color_franja = params.get("id_color") || "";
        this.color_assignatura_dialog = params.get("id_color_assignatura") || "";

        // Guardem la còpia inicial
        this.copia_dia_setmana = this.dia_setmana;
        this.copia_hora_inici = this.hora_inici;
        this.copia_hora_fi = this.hora_fi;
        this.copia_assignatura = this.assignatura;
        this.copia_color = this.color;
        this.canviar_color_assignatura = false;

        this.filtrar_hores_inici();
        this.filtrar_hores_fi();

    }
};

const app = Vue.createApp(conf);
app.mount("#app");

