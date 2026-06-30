function pulseClock() {
    const clock = document.getElementById("clock");
    clock.style.boxShadow = "0 0 25px #00ff88";

    const audio = new Audio("/static/sounds/clock.mp3");
    audio.play();

    setTimeout(() => {
        clock.style.boxShadow = "none";
    }, 500);
}