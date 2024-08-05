let menubtn = document.getElementById("menubtn");
let menu = document.getElementById("myMenu");
let modal = document.getElementById("staticBackdropInstructions");

menubtn.addEventListener("click", function () {
    if (modal.classList.contains("show")) return;
    
    if (menu.style.display === "none") {
        menu.style.display = "flex";
        menubtn.innerHTML = "&#9776; Cerrar Menú";
    } else {
        menu.style.display = "none";
        menubtn.innerHTML = "&#9776; Abrir Menú";
    }
});