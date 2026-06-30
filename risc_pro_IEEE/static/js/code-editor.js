// Code Editor Enhancement - Line numbers and syntax features

document.addEventListener('DOMContentLoaded', function() {
    const programInput = document.getElementById('programInput');
    const lineNumbers = document.getElementById('lineNumbers');
    const codeErrorMsg = document.getElementById('codeErrorMsg');
    const codeSuccessMsg = document.getElementById('codeSuccessMsg');

    function updateLineNumbers() {
        const lines = programInput.value.split('\n').length;
        lineNumbers.innerHTML = '';
        
        for (let i = 1; i <= lines; i++) {
            const lineNum = document.createElement('span');
            lineNum.textContent = i;
            lineNum.id = `line-${i}`;
            lineNumbers.appendChild(lineNum);
        }
    }

    // Initial line numbers
    updateLineNumbers();

    // Update on input
    programInput.addEventListener('input', function() {
        updateLineNumbers();
        clearMessages();
    });

    // Sync scrolling between line numbers and textarea
    programInput.addEventListener('scroll', function() {
        lineNumbers.parentElement.scrollTop = programInput.scrollTop;
    });

    // Tab key support
    programInput.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.selectionStart;
            const end = this.selectionEnd;
            this.value = this.value.substring(0, start) + '\t' + this.value.substring(end);
            this.selectionStart = this.selectionEnd = start + 1;
            updateLineNumbers();
        }
    });

    window.showCodeError = function(lineNum, message) {
        const lineElement = document.getElementById(`line-${lineNum}`);
        if (lineElement) {
            lineElement.classList.add('error-line');
        }
        
        codeErrorMsg.innerHTML = `<strong>❌ Error at line ${lineNum}:</strong> ${message}`;
        codeErrorMsg.classList.add('show');
        codeSuccessMsg.classList.remove('show');
    };

    window.clearMessages = function() {
        codeErrorMsg.classList.remove('show');
        codeSuccessMsg.classList.remove('show');
        
        // Clear error line highlighting
        document.querySelectorAll('.code-line-numbers .error-line').forEach(el => {
            el.classList.remove('error-line');
        });
    };

    window.showCodeSuccess = function(message) {
        codeSuccessMsg.innerHTML = `<strong>✅ Success:</strong> ${message}`;
        codeSuccessMsg.classList.add('show');
        codeErrorMsg.classList.remove('show');
    };
});
