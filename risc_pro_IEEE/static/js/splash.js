/* Loading Effects and Animations */

document.addEventListener("DOMContentLoaded", function () {
    document.body.style.opacity = "0";

    setTimeout(() => {
        document.body.style.transition = "opacity 1.5s ease";
        document.body.style.opacity = "1";
    }, 100);

    // Animate loading steps
    const steps = document.querySelectorAll('.loading-step');
    if (steps.length > 0) {
        steps.forEach((step, index) => {
            setTimeout(() => {
                // Mark previous steps as complete
                steps.forEach((s, i) => {
                    if (i <= index) {
                        s.classList.add('active');
                        s.querySelector('.step-icon').textContent = '✓';
                    }
                });
            }, 600 + (index * 600));
        });
    }
});

/* Loading Text Dot Animation */
const loadingText = document.querySelector(".loading-text");
let dots = 0;

setInterval(() => {
    dots = (dots + 1) % 4;
    if (loadingText) {
        loadingText.textContent = "Initializing" + ".".repeat(dots);
    }
}, 500);

/* Fade Out + Redirect */
setTimeout(() => {
    document.body.style.transition = "opacity 1s ease";
    document.body.style.opacity = "0";

    setTimeout(() => {
        window.location.href = "/landing";
    }, 1000);

}, 3000);