// Error Diagnosis Card Generator

function generateErrorDiagnosisCard(data) {
    if (!data) {
        return null;
    }

    const { error, expected, actual, reason, status = 'error' } = data;
    
    const statusIcon = {
        error: '❌',
        success: '✅',
        warning: '⚠️'
    }[status] || '❌';

    const statusText = {
        error: 'Error',
        success: 'Success',
        warning: 'Warning'
    }[status] || 'Error';

    let html = `
        <div class="error-diagnosis-card ${status}">
            <div class="error-diagnosis-header">
                <div class="error-diagnosis-icon">${statusIcon}</div>
                <h3 class="error-diagnosis-title">${error || statusText}</h3>
            </div>
            <div class="error-diagnosis-status ${status}">${statusText.toUpperCase()}</div>
    `;

    if (expected !== undefined || actual !== undefined) {
        html += `
            <div class="error-diagnosis-section">
                <div class="error-diagnosis-label">Result Comparison</div>
                <div class="error-diagnosis-comparison">
                    <div class="error-diagnosis-expected">
                        <div class="error-diagnosis-expected-value">${expected !== undefined ? formatValue(expected) : 'N/A'}</div>
                    </div>
                    <div class="error-diagnosis-actual">
                        <div class="error-diagnosis-actual-value">${actual !== undefined ? formatValue(actual) : 'N/A'}</div>
                    </div>
                </div>
            </div>
        `;
    }

    if (reason) {
        html += `
            <div class="error-diagnosis-section">
                <div class="error-diagnosis-label">Diagnosis</div>
                <div class="error-diagnosis-reason">
                    <p class="error-diagnosis-reason-text">${reason}</p>
                </div>
            </div>
        `;
    }

    html += `</div>`;
    
    return html;
}

function formatValue(value) {
    if (typeof value === 'number') {
        return `${value} (0x${value.toString(16).toUpperCase()})`;
    }
    if (typeof value === 'object') {
        return Object.entries(value).map(([k, v]) => `${k}: ${v}`).join('<br>');
    }
    return String(value);
}

// Enhanced version for multiple error sections
function generateErrorDiagnosisSection(diagnosisData) {
    if (!diagnosisData || diagnosisData.length === 0) {
        return '';
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';
    diagnosisData.forEach(diagnosis => {
        const card = generateErrorDiagnosisCard(diagnosis);
        if (card) {
            html += card;
        }
    });
    html += '</div>';

    return html;
}

// Example data structure for testing
function getExampleErrorDiagnosis() {
    return [
        {
            error: 'Error in EX Stage',
            status: 'error',
            expected: 10,
            actual: 5,
            reason: 'The ALU executed a SUB instruction instead of ADD. This likely indicates a control signal decoding error or an incorrect opcode.'
        }
    ];
}

function getExampleSuccessDiagnosis() {
    return [
        {
            error: 'Execution Successful',
            status: 'success',
            expected: 42,
            actual: 42,
            reason: 'The instruction executed correctly through all pipeline stages. No hazards or stalls detected.'
        }
    ];
}

// Make globally accessible
window.generateErrorDiagnosisCard = generateErrorDiagnosisCard;
window.generateErrorDiagnosisSection = generateErrorDiagnosisSection;
window.getExampleErrorDiagnosis = getExampleErrorDiagnosis;
window.getExampleSuccessDiagnosis = getExampleSuccessDiagnosis;

document.addEventListener('DOMContentLoaded', function() {
    // Try to inject error diagnosis from simulation results
    const resultsJSON = sessionStorage.getItem('simulationResults');
    if (resultsJSON) {
        try {
            const results = JSON.parse(resultsJSON);
            if (results.error_diagnosis) {
                const container = document.getElementById('error-diagnosis-container');
                if (container) {
                    const html = generateErrorDiagnosisSection(
                        Array.isArray(results.error_diagnosis) 
                            ? results.error_diagnosis 
                            : [results.error_diagnosis]
                    );
                    container.innerHTML = html;
                }
            }
        } catch (e) {
            console.warn('Could not parse simulation results:', e);
        }
    }
});
