// This file handles the backend logic for program execution in the RISC simulator.
// It parses the instruction set from the textarea, simulates execution, and updates the status.

document.addEventListener('DOMContentLoaded', function() {
    const runProgramButton = document.getElementById('runProgramButton');
    const clearProgramButton = document.getElementById('clearProgramButton');
    const sampleProgramButton = document.getElementById('sampleProgramButton');
    const programInput = document.getElementById('programInput');
    const programStatus = document.getElementById('programStatus');
    const programError = document.getElementById('programError');
    const registerTableContainer = document.getElementById('register-table-container');
    const registerGrid = document.getElementById('register-grid');

    function createRegisterTable() {
        if (!registerGrid) return;
        registerGrid.innerHTML = '';
        for (let i = 0; i < 32; i++) {
            const item = document.createElement('div');
            item.style.display = 'grid';
            item.style.gridTemplateColumns = '1fr 1fr';
            item.style.gap = '4px';
            item.style.padding = '8px';
            item.style.border = '1px solid #334155'; // Default inactive border
            item.style.borderRadius = '6px';
            item.style.background = '#0b1220'; // Default inactive background
            item.style.transition = 'all 0.3s ease'; // Smooth transitions

            const label = document.createElement('span');
            label.textContent = `R${i}`;
            label.style.color = '#cbd5e1'; // Default inactive label color
            label.style.fontWeight = '600';
            label.style.transition = 'color 0.3s ease'; // Smooth color transition

            const valueInput = document.createElement('input');
            valueInput.type = 'number';
            valueInput.value = 0;
            valueInput.style.width = '100%';
            valueInput.style.border = '1px solid #64748b'; // Default inactive input border
            valueInput.style.borderRadius = '4px';
            valueInput.style.background = '#0f172a'; // Default inactive input background
            valueInput.style.color = '#94a3b8'; // Default inactive input text color
            valueInput.style.transition = 'all 0.3s ease'; // Smooth transitions
            valueInput.dataset.register = `R${i}`;
            valueInput.disabled = true; // default to static
            valueInput.title = 'Register not in this program sample';

            item.appendChild(label);
            item.appendChild(valueInput);
            registerGrid.appendChild(item);
        }
    }

    function showRegisterTable() {
        if (!registerTableContainer || !registerGrid) return;

        if (programInput.value.trim().length > 0) {
            registerTableContainer.style.display = 'block';
            if (!registerGrid.children.length) {
                createRegisterTable();
            }
            updateActiveRegisters();
        } else {
            registerTableContainer.style.display = 'none';
        }
    }

    function parseInstructionRegisters() {
        const text = programInput.value.trim().toUpperCase();
        const used = new Set();
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);

        for (const line of lines) {
            const cleaned = line.replace(/,/g, ' ').trim();
            const parts = cleaned.split(/\s+/);
            if (!parts.length) continue;
            const op = parts[0];

            if (["ADD","SUB","SLT","AND","OR"].includes(op) && parts.length >= 4) {
                used.add(parts[1]);
                used.add(parts[2]);
                used.add(parts[3]);
            } else if (op === 'BEQ' && parts.length >= 4) {
                used.add(parts[1]);
                used.add(parts[2]);
            } else if ((op === 'LW' || op === 'SW') && parts.length >= 3) {
                const rt = parts[1];
                const mem = parts[2];
                const m = mem.match(/^-?\d+\((R\d{1,2})\)$/i);
                if (m) {
                    used.add(rt);
                    used.add(m[1].toUpperCase());
                }
            }
        }

        return used;
    }

    function updateActiveRegisters() {
        const used = parseInstructionRegisters();
        Array.from(registerGrid.querySelectorAll('input')).forEach(input => {
            const reg = input.dataset.register;
            const item = input.parentElement;
            const label = item.querySelector('span');
            if (used.has(reg)) {
                input.disabled = false;
                input.style.opacity = '1';
                input.title = 'Editable initial register value';
                // Style active register with accent color
                item.style.border = '2px solid #60a5fa';
                item.style.background = 'linear-gradient(135deg, rgba(96, 165, 250, 0.1), rgba(96, 165, 250, 0.05))';
                item.style.boxShadow = '0 0 10px rgba(96, 165, 250, 0.2)';
                input.style.border = '1px solid #60a5fa';
                input.style.background = 'rgba(96, 165, 250, 0.1)';
                input.style.color = '#60a5fa';
                if (label) label.style.color = '#60a5fa'; // Make label blue for active registers
            } else {
                input.disabled = true;
                input.style.opacity = '0.5';
                input.title = 'Register not in instruction set';
                // Style inactive register with muted colors
                item.style.border = '1px solid #334155';
                item.style.background = '#0b1220';
                item.style.boxShadow = 'none';
                input.style.border = '1px solid #64748b';
                input.style.background = '#0f172a';
                input.style.color = '#94a3b8';
                if (label) label.style.color = '#cbd5e1'; // Reset label to default color
            }
        });
    }

    function getInitialRegistersFromTable() {
        const initial = {};
        Array.from(registerGrid.querySelectorAll('input')).forEach(input => {
            const reg = input.dataset.register;
            if (reg) {
                const val = parseInt(input.value, 10);
                if (!Number.isNaN(val) && val !== 0) {
                    initial[reg.toUpperCase()] = val;
                }
            }
        });
        return initial;
    }

    programInput.addEventListener('input', showRegisterTable);
    programInput.addEventListener('mouseup', showRegisterTable); // for paste with mouse
    programInput.addEventListener('keydown', () => setTimeout(showRegisterTable, 10));

    showRegisterTable();

    function validateProgram(input) {
        const lines = input.split('\n').map(line => line.trim()).filter(line => line);
        if (lines.length === 0) {
            return { error: 'No instructions entered.', lineNum: null };
        }

        for (let idx = 0; idx < lines.length; idx++) {
            const line = lines[idx];
            const parts = line.replace(/,/g, ' ').trim().split(/\s+/);
            const op = parts[0].toUpperCase();

            if (["ADD", "SUB", "SLT", "AND", "OR"].includes(op)) {
                if (parts.length !== 4) {
                    return { error: `${op} requires 3 operands (rd rs rt).`, lineNum: idx + 1 };
                }
            } else if (op === 'BEQ') {
                if (parts.length !== 4 || isNaN(parseInt(parts[3], 0))) {
                    return { error: `BEQ requires 2 registers and immediate (imm).`, lineNum: idx + 1 };
                }
            } else if (op === 'LW' || op === 'SW') {
                if (parts.length !== 3 || !/^-?\d+\(R?\d+\)$/i.test(parts[2])) {
                    return { error: `${op} requires format: ${op} Rt offset(Rs).`, lineNum: idx + 1 };
                }
            } else {
                return { error: `Invalid operation '${op}'.`, lineNum: idx + 1 };
            }
        }

        return { error: '', lineNum: null };
    }

    async function runProgram(event) {
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }

        console.log('[runProgram] clicked');
        const input = programInput.value.trim();
        console.log('[runProgram] programInput:', input);
        const validation = validateProgram(input);

        if (validation.error) {
            if (validation.lineNum) {
                showCodeError(validation.lineNum, validation.error);
            } else {
                showCodeError(1, validation.error);
            }
            programStatus.textContent = 'Invalid program input.';
            return;
        }

        const initialRegisters = getInitialRegistersFromTable();

        programError.textContent = '';
        programStatus.textContent = 'Executing program...';
        clearMessages();

        try {
            console.log('Program sent:', input, 'initialRegisters', initialRegisters);
            const response = await fetch('/run_program', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    program: input,
                    initial_registers: initialRegisters
                })
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server returned an error: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            console.log('Response:', data);
            showCodeSuccess('Program executed successfully!');
            sessionStorage.setItem('simulationResults', JSON.stringify(data));
            window.location.href = '/group_results';
        } catch (error) {
            console.error(error);
            programStatus.textContent = 'Error executing program: ' + error.message;
        }
    }

    function clearProgram() {
        programInput.value = '';
        programStatus.textContent = 'Program cleared.';
        programError.textContent = '';
        showRegisterTable();
    }

    function loadSampleProgram() {
        const sample = `ADD R1 R2 R3\nSUB R4 R1 R5\nSLT R6 R2 R4\nBEQ R1 R4 2\nLW R7 0(R2)\nSW R7 4(R2)`;
        programInput.value = sample;
        programStatus.textContent = 'Sample program loaded.';
        programError.textContent = '';
        showRegisterTable();
    }

    runProgramButton.addEventListener('click', runProgram);
    clearProgramButton.addEventListener('click', clearProgram);
    sampleProgramButton.addEventListener('click', loadSampleProgram);

    // Expose globally for inline handlers
    window.runProgram = runProgram;
    window.clearProgram = clearProgram;
    window.loadSampleProgram = loadSampleProgram;
});
