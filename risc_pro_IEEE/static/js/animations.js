/*function animatePipeline(data) {

    const stages = ["IF", "ID", "EX", "MEM", "WB"];
    let delay = 0;

    stages.forEach((stage, index) => {
        setTimeout(() => {
            pulseClock();
            const element = document.getElementById(stage);
            element.classList.add("active");

            setTimeout(() => {
                element.classList.remove("active");
            }, 800);

        }, delay);

        delay += 1000;
    });
}*/

// Animate pipeline stages in sequence
function animatePipeline(data) {
    const stages = [
        {id: "step-if", label: data.IF},
        {id: "step-id", label: data.ID},
        {id: "step-ex", label: data.EX},
        {id: "step-mem", label: data.MEM},
        {id: "step-wb", label: data.WB},
    ];

    let delay = 0;
    const blinkDuration = 1000; // ms per stage

    stages.forEach((stage, index) => {
        setTimeout(() => {
            const node = document.getElementById(stage.id);
            const label = node.querySelector("small");

            // Set label text from data
            label.innerText = stage.label;

            // Add blink animation
            node.classList.add("active");
            setTimeout(() => node.classList.remove("active"), blinkDuration - 100);
        }, delay);

        delay += blinkDuration;
    });
}