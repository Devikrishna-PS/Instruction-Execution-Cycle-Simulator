/* ===============================
   FADE IN ANIMATION ON LOAD
================================ */

document.addEventListener("DOMContentLoaded", function () {
    document.body.style.opacity = "0";

    setTimeout(() => {
        document.body.style.transition = "opacity 1.2s ease";
        document.body.style.opacity = "1";
    }, 100);
});


/* ===============================
   BUTTON RIPPLE EFFECT
================================ */

const buttons = document.querySelectorAll(".btn");

buttons.forEach(button => {
    button.addEventListener("click", function (e) {

        const circle = document.createElement("span");
        circle.classList.add("ripple");

        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);

        circle.style.width = circle.style.height = size + "px";
        circle.style.left = e.clientX - rect.left - size / 2 + "px";
        circle.style.top = e.clientY - rect.top - size / 2 + "px";

        button.appendChild(circle);

        setTimeout(() => {
            circle.remove();
        }, 600);
    });
});


/* ===============================
   FLOATING TITLE EFFECT
================================ */

const title = document.querySelector(".center h1");

let floatDirection = 1;

setInterval(() => {
    if (title) {
        title.style.transform = `translateY(${floatDirection * 5}px)`;
        floatDirection *= -1;
    }
}, 2000);


/* ===============================
   OPTIONAL SCROLL REVEAL
================================ */

window.addEventListener("scroll", () => {
    const elements = document.querySelectorAll(".reveal");

    elements.forEach(el => {
        const position = el.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;

        if (position < windowHeight - 100) {
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
        }
    });
});