/* Aproximación declarativa: especificamos el resultado final y los datos y dejamos a vue que lo resuelva (que vea qué hay que crear en el DOM, modificar en el DOM, etc.)
*/
// Define classes for schedule management
const conf = {
    //una propiedad llamada data que tiene una funcion como valor
    data() {
        return {
            contrasenya:"",
            contrasenya_conf:""
        };
    },
    //funciones que se pueden llamar desde el html
    methods: {
        checkSignUp:function(e) {
            if(this.contrasenya !== this.contrasenya_conf){
                //e.preventDefault();
                Swal.fire({
                    icon: "error",
                    title: "Les contrasenyes no coincideixen",
                    footer: '<a href="#">Perquè tinc aquest problema?</a>'
                });
            }
            else{
                window.location.href = 'menu.html';
            }

        },
    }
};

const app = Vue.createApp(conf);
app.mount("#app");

