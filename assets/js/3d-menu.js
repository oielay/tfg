let menubtn = document.getElementById("menubtn");
let menu = document.getElementById("myMenu");

menubtn.addEventListener("click", function () {
    if (menu.style.display === "none") {
        menu.style.display = "block";
        menubtn.innerHTML = "&#9776; Close Menu";
    } else {
        menu.style.display = "none";
        menubtn.innerHTML = "&#9776; Open Menu";
    }
});