let menubtn = document.getElementById("menubtn");
let menu = document.getElementById("myMenu");
let modal = document.getElementById("staticBackdropInstructions");
let envForm = document.getElementById("3Denv");

if (!modal)  {
    envForm.style.marginTop = "10%";
    menubtn.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
    menubtn.style.color = "black";
} else if (envForm) {
    envForm.style.marginTop = "0";
}

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
    if (modal && modal.classList.contains("show")) return;
    
    if (menu.style.display === "none") {
        menu.style.display = "flex";
        menubtn.innerHTML = "&#9776; Cerrar Menú";
    } else {
        menu.style.display = "none";
        menubtn.innerHTML = openMenuText;
    }
});