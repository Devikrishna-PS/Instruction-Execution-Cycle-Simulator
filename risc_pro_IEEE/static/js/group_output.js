document.addEventListener('DOMContentLoaded', () => {
    const dataRaw = sessionStorage.getItem('simulationResults');
    if (!dataRaw) {
        document.body.innerHTML = '<h1 style="text-align:center;margin-top:100px;color:#f87171;">No program result found.</h1>';
        return;
    }

    let data;
    try {
        data = JSON.parse(dataRaw);
    } catch (e) {
        console.error('Invalid JSON', e);
        return;
    }

    const instructions = data.instructions || [];
    const steps = data.steps || [];
    const metrics = data.metrics || {};

    // ================= FINAL PIPELINE FIX =================
    function normalizePipeline(steps) {
        if (!steps.length) return;
        steps[0].stage_cycles = {IF:1, ID:2, EX:3, MEM:4, WB:5};
        for (let i=1;i<steps.length;i++){
            const prev = steps[i-1], curr = steps[i];
            const stall = curr.stall_before||0;
            const newIF = prev.stage_cycles.IF + 1 + stall;
            curr.stage_cycles = {IF:newIF, ID:newIF+1, EX:newIF+2, MEM:newIF+3, WB:newIF+4};
        }
    }

    normalizePipeline(steps); // ✅ CRITICAL FIX

    // ================= MEMORY HANDLING =================
    let currentMemory = {};
    steps.forEach(step=>{
        const address = step.rs_value + step.imm;
        if(step.op==='LW'){
            step.result_decimal = currentMemory[address] || 0;
            step.register_snapshot[step.rt] = step.result_decimal;
        } else if(step.op==='SW'){
            currentMemory[address] = step.rt_value;
        }
    });

    // ================= INSTRUCTION LIST =================
    const instList = document.getElementById('instruction-list');
    instList.innerHTML = '';

    instructions.forEach(instr => {
        const li = document.createElement('li');
        const op = (instr.op || '').toUpperCase();
        let text = '';

        if (['ADD','SUB','AND','OR','SLT'].includes(op)) {
            text = `${op} R${instr.rd} R${instr.rs} R${instr.rt}`;
        } else if (op === 'BEQ') {
            text = `${op} R${instr.rs} R${instr.rt} ${instr.imm}`;
        } else if (op === 'LW' || op === 'SW') {
            text = `${op} R${instr.rt}, ${instr.imm}(R${instr.rs})`;
        } else {
            text = JSON.stringify(instr);
        }

        // Add machine code if available
        if (instr.machine_code) {
            text += ` → ${instr.machine_code}`;
        }

        li.textContent = text;
        instList.appendChild(li);
    });

    // ================= METRICS =================
    const totalInstr = metrics.total_instructions || 0;
    const totalCycles = metrics.total_cycles || 0;

    document.getElementById('metric-total-instr').textContent = totalInstr;
    document.getElementById('metric-total-cycles').textContent = totalCycles;
    document.getElementById('metric-cpi').textContent = (metrics.cpi || 0).toFixed(2);

    const ipcValue = totalCycles > 0 ? totalInstr / totalCycles : 0;
    document.getElementById('metric-ipc').textContent =
        `IPC: ${totalInstr} / ${totalCycles} = ${ipcValue.toFixed(2)}`;

    document.getElementById('metric-stalls').textContent = metrics.stall_cycles || 0;
    document.getElementById('metric-mispredictions').textContent = metrics.branch_mispredictions || 0;

    // ================= SUMMARY =================
    document.getElementById('summary-total-instr').textContent = totalInstr;
    document.getElementById('summary-stalls').textContent = metrics.stall_cycles || 0;
    document.getElementById('summary-reason').textContent =
        metrics.stall_cycles > 0 ? 'Data hazard (RAW)' : 'No stalls';

    document.getElementById('summary-final-output').textContent =
        data.final_result ?? steps[steps.length - 1]?.result_decimal ?? 0;

    // ================= PIPELINE TABLE =================
    function buildPipelineTable(steps) {
        const table = document.getElementById('pipeline-table');
        table.innerHTML = '';

        let maxCycle = 0;
        steps.forEach(step => {
            Object.values(step.stage_cycles).forEach(c => {
                if (c > maxCycle) maxCycle = c;
            });
        });

        const header = document.createElement('tr');
        header.innerHTML = '<th>#</th><th>Inst</th>' +
            Array.from({ length: maxCycle }, (_, i) => `<th>${i + 1}</th>`).join('');
        table.appendChild(header);

        steps.forEach((step, idx) => {
            const row = document.createElement('tr');
            row.insertCell().textContent = idx + 1;
            row.insertCell().textContent = step.op;

            const sc = step.stage_cycles;
            const stallCount = step.stall_before || 0;

            for (let cycle = 1; cycle <= maxCycle; cycle++) {
                const cell = row.insertCell();
                let text = '-';
                let cls = '';

                // ✅ Correct stall placement
                if (stallCount > 0) {
                    const stallStart = sc.IF - stallCount;

                    if (cycle >= stallStart && cycle < sc.IF) {
                        text = 'STALL';
                        cls = 'stage-stall';
                    }
                }

                if (cycle === sc.IF) { text = 'IF'; cls = 'stage-if'; }
                else if (cycle === sc.ID) { text = 'ID'; cls = 'stage-id'; }
                else if (cycle === sc.EX) { text = 'EX'; cls = 'stage-ex'; }
                else if (cycle === sc.MEM) { text = 'MEM'; cls = 'stage-mem'; }
                else if (cycle === sc.WB) { text = 'WB'; cls = 'stage-wb'; }

                cell.textContent = text;
                if (cls) cell.className = cls;
            }

            table.appendChild(row);
        });
    }



    // ================= TRACE TABLE =================
function buildTraceTable(steps, initialState) {
    const tbody = document.querySelector('#trace-table tbody');
    const updateList = document.getElementById('register-updates');

    tbody.innerHTML = '';
    updateList.innerHTML = '';

    // Initialize registers
    let currentRegisters = new Array(32).fill(0);
    Object.entries(initialState || {}).forEach(([reg, val]) => {
        const idx = parseInt(reg.replace('R',''));
        currentRegisters[idx] = val;
    });

    steps.forEach((step, idx) => {
        const row = document.createElement('tr');

        // Safe display: replace null/undefined with empty string or 0
        const rdText = (() => {
            const op = (step.op ?? '').toUpperCase();
            if (['ADD','SUB','AND','OR','SLT'].includes(op)) return step.rd != null ? 'R' + step.rd : '';
            if (op === 'BEQ') return '-';
            if (op === 'LW') return 'R' + step.rt;  // destination of load is rt
            if (op === 'SW') return 'R' + step.rt;  // just show source register
            return '';
        })();
        const resultText = step.result_decimal != null ? step.result_decimal : 0;
        const branchText = step.branch_taken != null 
            ? (step.branch_taken ? 'Taken' : 'Not Taken') 
            : 'N/A';
        const pcAfterText = step.pc_after != null ? step.pc_after : '';
        const machineCodeText = step.machine_code || 'N/A';

        row.innerHTML = `
            <td>${idx + 1}</td>
            <td>${step.op ?? ''}</td>
            <td>${step.rs_value ?? 0}</td>
            <td>${step.rt_value ?? 0}</td>
            <td>${rdText}</td>
            <td>${resultText}</td>
            <td>${branchText}</td>
            <td>${pcAfterText}</td>
            <td>${machineCodeText}</td>
        `;

        tbody.appendChild(row);

        // Register updates
        if (step.register_snapshot) {
            const updates = [];
            const snap = step.register_snapshot;

            for (let r = 0; r < 32; r++) {
                if (snap[r] !== currentRegisters[r] || r === step.rd) {
                    updates.push(`R${r}: ${currentRegisters[r]} → ${snap[r]}`);
                }
            }

            if (updates.length > 0) {
                const li = document.createElement('li');
                li.textContent = `Step ${idx + 1}: ${updates.join(', ')}`;
                updateList.appendChild(li);
            }

            currentRegisters = snap.slice();
        }
    });
}

    // ================= HAZARD =================
    function renderHazardExplanation(steps) {
        const explanation = document.getElementById('hazard-explanation');

        const hazards = steps.filter(s => s.stall_before > 0);
        if (!hazards.length) {
            explanation.textContent = 'No hazards detected.';
            return;
        }

        explanation.textContent = hazards.map(s =>
            `RAW hazard on R${s.rs} → ${s.stall_before} stall inserted`
        ).join('; ');
    }

    // ================= EXECUTION =================
    buildPipelineTable(steps);
    
    buildTraceTable(steps, data.initial_registers || {});
    renderHazardExplanation(steps);
});