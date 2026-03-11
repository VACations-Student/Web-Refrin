const hamburger = document.getElementById("hamburger");
const menu = document.getElementById("navMenu");

hamburger.addEventListener("click", () => {
    menu.classList.toggle("open");
});

document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
        menu.classList.remove("open");
    });
});

document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !hamburger.contains(e.target)) {
        menu.classList.remove("open");
    }
});