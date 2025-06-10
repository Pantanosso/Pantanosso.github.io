const conf = {
  data() {
    return {
      horaris: []
      
    };
  },
  methods: {
     _carregaHoraris() {
      const base = {
        id:      'base',
        nom:     window.HORARI_BASE.nom,
        enlace:  `visualitzar_horari.html?id=${window.HORARI_BASE.id}`
      };
      const guardats = JSON.parse(localStorage.getItem("horaris_guardats") || "[]")
        .map(h => ({
          id:     h.id,
          nom:    h.nom,
          color:  (h.franges && h.franges.length > 0)
                ? h.franges[0].color
                : '#FFFFFF',
          enlace: `visualitzar_horari.html?id=${h.id}`
          
        }));
      this.horaris = [ base, ...guardats ];
    },

    eliminarHorari(id) {
      if (id === window.HORARI_BASE.id) {
        Swal.fire("Error", "No es pot eliminar l'horari base", "error");
        return;
      }
      Swal.fire({
        title: "Estàs segur?",
        text: "Això eliminarà l'horari definitivament.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#aaa",
        confirmButtonText: "Sí, eliminar",
      }).then((result) => {
        if (result.isConfirmed) {
          let horaris = JSON.parse(localStorage.getItem("horaris_guardats") || "[]");
          horaris = horaris.filter(h => h.id !== id);
          localStorage.setItem("horaris_guardats", JSON.stringify(horaris));
          this._carregaHoraris();
          Swal.fire("Eliminat!", "L'horari ha estat eliminat.", "success");
        }
      });
    }
  },
  mounted() {
     this._carregaHoraris();
  },
  
};


Vue.createApp(conf).mount("#app");

