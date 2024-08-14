let menubtn = document.getElementById("menubtn");
let menu = document.getElementById("myMenu");
let modal = document.getElementById("staticBackdropInstructions");

let openMenuText;
function updateMenuText() {
    if (window.innerWidth <= 768) {
        openMenuText = "&#9776;";
    } else {
        openMenuText = "&#9776; Abrir Menú";
    }

    menubtn.innerHTML = openMenuText;
}

window.addEventListener("DOMContentLoaded", updateMenuText);
window.addEventListener("resize", updateMenuText);

menubtn.addEventListener("click", function () {
    if (modal.classList.contains("show")) return;
    
    if (menu.style.display === "none") {
        menu.style.display = "flex";
        menubtn.innerHTML = "&#9776; Cerrar Menú";
    } else {
        menu.style.display = "none";
        menubtn.innerHTML = openMenuText;
    }
});