function generateTimelineTable(simulationData) {
    const container = document.getElementById('timeline-table-container');
    if (!container) return;

    const steps = simulationData.steps || [];
    if (!steps.length) return;

    // ===== Find max cycle =====
    let maxCycle = 0;
    steps.forEach(step => {
        Object.values(step.stage_cycles).forEach(c => {
            if (c > maxCycle) maxCycle = c;
        });
    });

    let html = "<table class='timeline-table'>";

    // ===== HEADER =====
    html += "<tr><th>Instruction</th>";
    for (let i = 1; i <= maxCycle; i++) {
        html += `<th>C${i}</th>`;
    }
    html += "</tr>";

    // ===== ROWS =====
    steps.forEach(step => {
        html += "<tr>";

        // ✅ FIX: Proper instruction name
        html += `<td class="timeline-instruction-name">${step.op}</td>`;

        const sc = step.stage_cycles;
        const stallCount = step.stall_before || 0;

        for (let cycle = 1; cycle <= maxCycle; cycle++) {
            let text = '-';
            let cls = '';

            // ===== STALL LOGIC =====
            if (stallCount > 0) {
                const stallStart = sc.IF - stallCount;

                if (cycle >= stallStart && cycle < sc.IF) {
                    text = 'STALL';
                    cls = 'stage-stall';
                }
            }

            // ===== PIPELINE STAGES =====
            if (cycle === sc.IF) { text = 'IF'; cls = 'stage-if'; }
            else if (cycle === sc.ID) { text = 'ID'; cls = 'stage-id'; }
            else if (cycle === sc.EX) { text = 'EX'; cls = 'stage-ex'; }
            else if (cycle === sc.MEM) { text = 'MEM'; cls = 'stage-mem'; }
            else if (cycle === sc.WB) { text = 'WB'; cls = 'stage-wb'; }

            html += `<td class="${cls}">${text}</td>`;
        }

        html += "</tr>";
    });

    html += "</table>";

    // ===== LEGEND =====
    html += `
        <div class="timeline-legend">
            <div class="legend-item"><div class="legend-box if"></div> IF</div>
            <div class="legend-item"><div class="legend-box id"></div> ID</div>
            <div class="legend-item"><div class="legend-box ex"></div> EX</div>
            <div class="legend-item"><div class="legend-box mem"></div> MEM</div>
            <div class="legend-item"><div class="legend-box wb"></div> WB</div>
            <div class="legend-item"><div class="legend-box stall"></div> STALL</div>
        </div>
    `;

    container.innerHTML = html;
}

// ===== AUTO LOAD =====
document.addEventListener('DOMContentLoaded', function () {
    const resultsJSON = sessionStorage.getItem('simulationResults');

    if (!resultsJSON) return;

    try {
        const results = JSON.parse(resultsJSON);
        generateTimelineTable(results);   // ✅ uses real pipeline data
    } catch (e) {
        console.error("Timeline error:", e);
    }
});