/* simulator.js */

// Animate pipeline stages
function animatePipeline(data) {
    const stages = ["if", "id", "ex", "mem", "wb"];
    stages.forEach(stage => {
        const node = document.getElementById(`step-${stage}`);
        const label = document.getElementById(`label-${stage}`);
        if (node) node.classList.remove('active');
        if (label) label.innerText = "Waiting...";
    });

    let delay = 0;
    stages.forEach(stage => {
        setTimeout(() => {
            const node = document.getElementById(`step-${stage}`);
            const label = document.getElementById(`label-${stage}`);
            if (node) node.classList.add('active');
            if (label) label.innerText = data[stage.toUpperCase()];
        }, delay);
        delay += 500;
    });
}

// Main run simulation
async function runSimulation() {
    const operation = document.getElementById("instrType").value;
    const rs = parseInt(document.getElementById("rsValue").value, 10) || 0;
    const rt = parseInt(document.getElementById("rtValue").value, 10) || 0;

    try {
        const stallFlag = document.getElementById('stallFlag').checked;
        const predBranch = document.getElementById('predBranch').checked ? 1 : 0;

        const response = await fetch("/simulate", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({operation, rs, rt, stall: stallFlag, predicted_branch: predBranch})
        });
        if (!response.ok) throw new Error("Server returned an error!");

        const data = await response.json();
        data.operation = operation;
        data.rs = rs;
        data.rt = rt;

        // Animate pipeline before redirecting
        animatePipeline(data);

        // Store results and redirect after animation
        setTimeout(() => {
            sessionStorage.setItem('simulationResults', JSON.stringify(data));
            window.location.href = '/results';
        }, 3000); // Wait for animation to complete
    } catch (error) {
        console.error(error);
        alert("Simulation failed: " + error.message);
    }
}

// Run a program (multi-line)
async function runProgram() {
    const programText = document.getElementById("programInput").value.trim();
    if (!programText) {
        alert("Please enter a program to execute.");
        return;
    }
    try {
        const resp = await fetch("/run_program", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({program: programText})
        });
        if (!resp.ok) throw new Error("Server returned " + resp.status);
        const data = await resp.json();
        console.log("Program execution result:", data);
        // save entire payload so results page can render summary
        sessionStorage.setItem('simulationResults', JSON.stringify(data));
        window.location.href = '/results';
    } catch (err) {
        console.error(err);
        alert("Error running program: " + err.message);
    }
}

// Theme toggle
function toggleTheme() {
    document.body.classList.toggle("light");
}

// Attach listeners after DOM loaded
document.addEventListener("DOMContentLoaded", function () {
    const runBtn = document.getElementById("runButton");
    if (runBtn) runBtn.addEventListener("click", runSimulation);

    const resetBtn = document.getElementById("resetButton");
    if (resetBtn) resetBtn.addEventListener("click", () => location.reload());

    const progBtn = document.getElementById("runProgramButton");
    if (progBtn) progBtn.addEventListener("click", runProgram);

    const clearBtn = document.getElementById("clearProgramButton");
    if (clearBtn) clearBtn.addEventListener("click", () => {
        document.getElementById("programInput").value = "";
        document.getElementById("programStatus").innerText = "Program not executed.";
    });
});
