
const nodes = document.querySelectorAll(".pipe-node");
const descTitle = document.querySelector(".pipeline-desc-title");
const descText = document.querySelector(".pipeline-desc-text");
const playBtn = document.getElementById("pipeline-play");

const stageData = [
    { title: "Instruction Fetch", text: "Fetch instruction using PC." },
    { title: "Instruction Decode", text: "Decode and read registers." },
    { title: "Execute", text: "ALU performs operations." },
    { title: "Memory", text: "Access memory if needed." },
    { title: "Write Back", text: "Store result in register." }
];

function activateStep(index) {
    descTitle.textContent = stageData[index].title;
    descText.textContent = stageData[index].text;

    nodes.forEach(n => n.classList.remove("active-blink"));
    nodes[index].classList.add("active-blink");
}

nodes.forEach(node => {
    node.addEventListener("click", () => {
        activateStep(parseInt(node.dataset.step));
    });
});

let playing = false;
let i = 0;
let interval;

playBtn.addEventListener("click", () => {
    if (playing) {
        clearInterval(interval);
        playBtn.textContent = "▶ Auto-play";
        playing = false;
        return;
    }

    playBtn.textContent = "⏸ Pause";
    playing = true;

    interval = setInterval(() => {
        activateStep(i);
        i = (i + 1) % 5;
    }, 1200);
});