# RISC Pipeline Simulator - Project Description

## Project Overview

The **RISC Pipeline Simulator** is an interactive web-based educational tool that simulates the execution of RISC (Reduced Instruction Set Computer) instructions through a 5-stage pipeline architecture. Built with Flask and modern web technologies, it provides real-time visualization, error diagnosis, and performance metrics tracking for computer architecture students and educators.

---

## Problem Statement

### Educational Gap
Students learning computer architecture and processor design struggle to understand:
1. **How instructions flow through CPU pipelines** - The abstract nature of pipeline stages (Instruction Fetch, Decode, Execute, Memory, Write-Back) makes it difficult for learners to visualize the execution process
2. **Pipeline hazards and stalls** - Complex concepts like data dependencies, forwarding issues, and branch prediction are hard to understand without interactive visualization
3. **Error identification** - When instruction execution produces incorrect results, students have no systematic way to diagnose which pipeline stage caused the error
4. **Performance analysis** - Tracking metrics like CPI (Cycles Per Instruction), IPC (Instructions Per Cycle), and branch mispredictions requires manual calculation
5. **Machine code generation** - Understanding the translation between assembly-like instructions and actual machine code (binary and MIPS format)

### Current Limitations in Learning Tools
- Static diagrams and textbooks cannot show dynamic execution flow
- Traditional simulators lack intuitive, interactive interfaces
- Most tools don't provide real-time error diagnosis
- Limited visualization of intermediate results and metrics

---

## Project Objectives

### Primary Objectives
1. **Provide Interactive Pipeline Visualization**
   - Visualize each stage of instruction execution (IF, ID, EX, MEM, WB) in real-time
   - Display intermediate values and results at each stage
   - Show operand values, ALU results, and memory operations

2. **Enable Real-Time Error Diagnosis**
   - Identify incorrect execution results automatically
   - Use pattern matching to diagnose the root cause of errors
   - Pinpoint the specific pipeline stage where the error occurred
   - Provide pedagogical hints to help students learn from mistakes

3. **Track Performance Metrics**
   - Measure instruction execution count
   - Calculate total cycle count (accounting for pipeline delays and stalls)
   - Compute CPI (Cycles Per Instruction)
   - Calculate IPC (Instructions Per Cycle) and throughput
   - Track branch mispredictions
   - Monitor stall cycles caused by hazards

4. **Support Multi-Instruction Execution**
   - Execute multiple instructions in sequence
   - Maintain persistent performance metrics across execution runs
   - Allow metric resets for new test runs

5. **Simulate Real-World Hardware Phenomena**
   - Demonstrate stall cycles caused by pipeline hazards
   - Model branch prediction with misprediction tracking
   - Show how data forwarding could affect results

6. **Provide Comprehensive Instruction Support**
   - Arithmetic operations: ADD, SUB
   - Logical operations: AND, OR
   - Comparison operations: SLT (Set Less Than)
   - Branch operations: BEQ (Branch if Equal)

7. **Generate Machine Code**
   - Convert instruction specifications to 32-bit binary format
   - Display RISC machine code in proper format (opcode + registers + immediate/function code)
   - Show binary representation in grouped 4-bit chunks for readability

8. **Create User-Friendly Interface**
   - Intuitive configuration panel for instruction setup
   - Real-time result display with multiple output formats (decimal, binary, hex)
   - Results dashboard with performance charts
   - Clear, accessible UI for students of all technical backgrounds

---

## Features Implemented

### 1. Simulator Core Engine
- **Instruction Execution**: Implements correct arithmetic, logical, and branch operations
- **Binary Conversion**: Converts 32-bit integers to binary format with proper grouping
- **Machine Code Generation**: Translates instructions to RISC machine code format
  - R-type instructions (ADD, SUB, AND, OR, SLT): 6-bit opcode, 3×5-bit registers, 5-bit shamt, 6-bit function code
  - I-type instructions (BEQ): 6-bit opcode, 2×5-bit registers, 16-bit immediate

### 2. Error Diagnosis Module
- **Pattern Matching**: Detects common mistakes like:
  - Wrong instruction type applied (e.g., ADD using SUB logic)
  - Missing operands (only one operand factored in)
  - Register read failures
  - Inverted comparison logic
  - Incorrect branch prediction
- **Pipeline Stage Attribution**: Identifies whether errors likely occurred in:
  - **IF (Instruction Fetch)**: Instruction not properly fetched
  - **ID (Instruction Decode)**: Register read errors
  - **EX (Execute)**: ALU operation errors
  - **MEM (Memory)**: Memory access issues
  - **WB (Write-Back)**: Register write failures
- **Pedagogical Diagnosis**: Provides human-readable explanations with suggestions for remediation

### 3. Performance Metrics System
Tracks and calculates:
- **Total Instructions**: Count of executed instructions
- **Total Cycles**: Calculated as `instructions + 4 (pipeline latency) + stall_cycles`
- **Stall Cycles**: Cycles spent waiting due to hazards
- **Branch Mispredictions**: Count of incorrect branch predictions
- **CPI (Cycles Per Instruction)**: `total_cycles / total_instructions`
- **IPC (Instructions Per Cycle)**: `total_instructions / total_cycles`
- **Throughput**: Equivalent to IPC
- **Metrics History**: Stores last 20 data points for trend analysis

### 4. Web Interface
- **Splash Page**: Introductory landing screen with project branding
- **Main Landing Page**: Overview of features and instructions
- **Execution Page**: Interactive instruction configuration and execution
- **Simulator Page**: Main interface with simulation controls
- **Results Page**: Comprehensive dashboard with metrics visualization
- **Navigation**: Seamless navigation between all pages

### 5. Frontend Visualizations
- **Chart.js Integration**: Real-time line and bar charts showing:
  - CPI trends
  - Cycle counts over time
  - Instruction throughput
  - Misprediction rates
- **Execution Display**: 
  - Pipeline stage progression animation
  - Operand values display
  - Result formats (decimal, binary, hex)
  - Machine code representation

### 6. Backend Technologies
- **Flask Framework**: Lightweight Python web framework for routing and request handling
- **JSON API**: RESTful endpoints for simulation and metrics
- **Session Management**: Persistent data across multiple requests
- **Global State Management**: Performance metrics maintained across instruction runs

---

## Implementation Details

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Flask Web Server                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Frontend (HTML/CSS/JavaScript)           │  │
│  │  - User Interface & Form Input                   │  │
│  │  - Result Display & Visualization               │  │
│  │  - Chart.js Integration                         │  │
│  └──────────────────────────────────────────────────┘  │
│                        ↓ HTTP                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │          Backend (Python/Flask)                 │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Routes:                                         │  │
│  │ - /simulate (POST)     → Instruction execution  │  │
│  │ - /reset_metrics (POST) → Metrics reset        │  │
│  │ - Render templates    → UI pages               │  │
│  └──────────────────────────────────────────────────┘  │
│                        ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │       Core Simulation Engine                    │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Components:                                     │  │
│  │ 1. Instruction Executor                        │  │
│  │    - ADD, SUB, AND, OR, SLT, BEQ               │  │
│  │ 2. Binary Converter                            │  │
│  │    - 32-bit conversion & formatting            │  │
│  │ 3. Error Diagnosis Module                      │  │
│  │    - Pattern matching & diagnosis              │  │
│  │ 4. Machine Code Generator                      │  │
│  │    - RISC instruction encoding                 │  │
│  │ 5. Performance Metrics Tracker                 │  │
│  │    - CPI, IPC, stalls, mispredictions         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Module Breakdown

#### 1. Simulator Core (`app.py` - Lines 1-50)
```python
def to_32bit_binary(value)      # Convert to 32-bit binary
def group_binary(binary_str)    # Format binary as 4-bit groups
```

#### 2. Performance Metrics (`app.py` - Lines 18-83)
```python
metrics = {
    "total_instructions": 0,
    "stall_cycles": 0,
    "branch_mispredictions": 0
}

def reset_metrics()             # Reset all counters
def update_metrics()            # Update after each instruction
def compute_derived_metrics()   # Calculate CPI, IPC, etc.
```

#### 3. Error Diagnosis (`app.py` - Lines 85-228)
```python
def diagnose_error(instruction, rs, rt, simulator_result, current_pc)
# Pattern matching for 6 instruction types
# Returns: expected_result, status, diagnosis, pipeline_stage
```

#### 4. Machine Code Generator (`app.py` - Lines 230-254)
```python
def generate_machine_code(operation, rs, rt)
# R-type: opcode(6) + rs(5) + rt(5) + rd(5) + shamt(5) + funct(6)
# I-type: opcode(6) + rs(5) + rt(5) + immediate(16)
```

#### 5. Route Handlers (`app.py` - Lines 256-370)
- `@app.route('/')` - Splash page
- `@app.route('/landing')` - Landing page
- `@app.route('/execution')` - Execution page
- `@app.route('/simulator')` - Main simulator
- `@app.route('/results')` - Results dashboard
- `@app.route('/simulate', methods=['POST'])` - Core simulation endpoint
- `@app.route('/reset_metrics', methods=['POST'])` - Metrics reset

### Data Flow

```
User Input (HTML Form)
    ↓
JavaScript Validation & Submission
    ↓
POST /simulate with JSON Payload
    {
        "operation": "ADD",
        "rs": 10,
        "rt": 20,
        "stall": false,
        "predicted_branch": null
    }
    ↓
Flask Route Handler (/simulate)
    ↓
Instruction Execution (ADD/SUB/AND/OR/SLT/BEQ)
    ↓
Result Computation (result_decimal, result_binary)
    ↓
Error Diagnosis (diagnose_error function)
    ↓
Machine Code Generation
    ↓
Performance Metrics Update
    ↓
Derived Metrics Calculation (CPI, IPC, etc.)
    ↓
JSON Response to Frontend
    ↓
JavaScript Display Update
    ↓
User Sees Results on UI
```

### Instruction Execution Logic

**R-Type Instructions (ADD, SUB, AND, OR, SLT)**
```
operation = specified instruction type
rs, rt = operand values from input
result = apply operation logic
  - ADD: result = rs + rt
  - SUB: result = rs - rt
  - AND: result = rs & rt
  - OR:  result = rs | rt
  - SLT: result = 1 if rs < rt else 0
```

**I-Type Instructions (BEQ)**
```
BEQ condition evaluation:
  - Compare rs and rt values
  - branch_taken = (rs == rt)
  - result = always 0 (comparison result encoded separately)
```

### Error Diagnosis Algorithm

```
1. Compute Expected Result
   - Use correct instruction definition
   
2. Compare with Simulator Result
   - If equal → Mark as "Correct"
   - If not equal → Proceed to step 3
   
3. Pattern Matching
   - Look for specific error patterns in result
   - Examples:
     • ADD result == rs - rt → Wrong instruction (SUB vs ADD)
     • ADD result == rs → Missing operand (rt not used)
     • result == 0 → Register read failure
     • BEQ condition reversed → Inverted logic
     
4. Pipeline Stage Attribution
   - ID stage errors: Register read failures
   - EX stage errors: ALU or comparison logic errors
   - EX/ID errors: Forwarding or data dependency issues
   
5. Generate Pedagogical Diagnosis
   - Explain expected vs actual
   - Describe detected pattern
   - Suggest likely pipeline stage
   - Recommend corrective action
```

### Performance Metrics Calculation

```
Given:
  - total_instructions (count of executed instructions)
  - stall_cycles (pipeline hazard wait cycles)
  
Calculate:
  - total_cycles = total_instructions + 4 (pipeline latency) + stall_cycles
  - CPI = total_cycles / total_instructions
  - IPC = total_instructions / total_cycles
  - throughput = IPC
  
The "+4" accounts for:
  - Initial pipeline fill (4 stages waiting for first instruction to complete)
```

### File Structure

```
risc_pro/
├── app.py                    # Main Flask application (371 lines)
├── requirements.txt          # Python dependencies (Flask)
├── README.md                 # Project documentation
├── PROJECT_DESCRIPTION.md    # This file
│
├── templates/                # HTML templates
│   ├── splash.html          # Splash page
│   ├── landing.html         # Landing/overview page
│   ├── index.html           # Main simulator interface
│   ├── execution.html       # Execution visualization
│   ├── results.html         # Results dashboard
│   ├── _nav.html            # Navigation component
│
├── static/                   # Static assets
│   ├── css/                 # Stylesheets
│   │   ├── splash.css       # Splash page styling
│   │   ├── landing.css      # Landing page styling
│   │   ├── simulator.css    # Simulator UI styling
│   │   ├── execution.css    # Execution display styling
│   │   ├── theme.css        # Global theme & colors
│   │
│   ├── js/                  # JavaScript files
│   │   ├── splash.js        # Splash page interactivity
│   │   ├── landing.js       # Landing page interactivity
│   │   ├── simulator.js     # Main simulator logic
│   │   ├── execution.js     # Execution flow visualization
│   │   ├── chart.js         # Chart.js integration for metrics
│   │   ├── animations.js    # UI animations
│   │   ├── clock.js         # Clock/timer display
│   │
│   ├── images/              # Image assets
│   └── sounds/              # Audio files (optional)
```

---

## Limitations

### 1. **Simplified 5-Stage Pipeline Model**
- Real modern processors use more complex pipelines (8+ stages)
- No modeling of:
  - Out-of-order execution
  - Multiple execution units
  - Cache hierarchy (L1, L2, L3)
  - Memory hierarchy effects
  - Branch prediction algorithms (only basic flag support)

### 2. **Instruction Set Limitations**
- Only 6 instruction types supported (ADD, SUB, AND, OR, SLT, BEQ)
- Missing instruction types:
  - Load/Store operations (LW, SW)
  - Jump instructions (J, JAL)
  - Shift operations (SLL, SRL)
  - Immediate operations (ADDI, ANDI, ORI)
  - Complex operations (MUL, DIV)

### 3. **Register and Memory Constraints**
- No actual register file implementation (only rs and rt operands)
- No memory simulation (MEM stage non-functional)
- No cache simulation
- Infinite register space (no realistic architectural limits)

### 4. **Hazard Handling**
- Stall simulation is manual flag-based (not automatic detection)
- No data forwarding pathways modeled
- Branch prediction support is limited:
  - Only tracks mispredictions (no algorithm)
  - No accurate predictor models (always-taken, always-not-taken, etc.)
- No structural hazard modeling

### 5. **Error Diagnosis Scope**
- Pattern matching is heuristic-based (not exhaustive)
- May not catch all error types
- Diagnosis accuracy depends on instruction format compliance
- Cannot diagnose timing-related errors or pipeline-specific issues

### 6. **Scalability**
- Metrics stored in global variables (not database)
- Metrics limited to last 20 data points
- No multi-user support or user session management
- No persistent data storage across server restarts

### 7. **Frontend Limitations**
- Chart visualization limited to last 20 execution points
- No real-time pipeline animation (static snapshots)
- Browser-dependent features
- No export functionality for results

### 8. **Architecture Assumptions**
- 32-bit instruction word format fixed
- RISC instruction set specifics (MIPS-like subset)
- Little-endian data representation assumed
- No floating-point support
- No interrupt or exception handling

### 9. **Testing Limitations**
- No automated test suite
- Limited edge case handling
- No input validation for extreme values
- Overflow behavior not fully defined

### 10. **Documentation**
- Limited inline code comments
- No API documentation beyond README
- Missing usage examples for advanced features

---

## System Requirements

### Hardware Requirements
- **Processor**: Dual-core processor or better
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: 100MB available space
- **Internet**: For CDN resources (Chart.js, Bootstrap)

### Software Requirements
- **Python**: 3.7 or higher
- **Operating Systems**: Windows, macOS, Linux
- **Web Browsers**: Modern browsers with JavaScript support
  - Chrome 90+
  - Firefox 88+
  - Safari 14+
  - Edge 90+

### Dependencies
- **Flask**: Web framework
- **Chart.js**: Frontend charting library
- **Bootstrap** (optional): CSS framework

---

## Installation & Usage

### Installation Steps

1. **Clone/Download Repository**
   ```bash
   cd c:\Users\DEVIKA\OneDrive\Documents\Desktop\version\ 1\ \(coa\)\risc_pro
   ```

2. **Create Virtual Environment** (Recommended)
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   source venv/bin/activate  # macOS/Linux
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run Application**
   ```bash
   python app.py
   ```

5. **Access in Browser**
   - Open: `http://127.0.0.1:5000/`
   - Or directly: `http://127.0.0.1:5000/simulator`

### Usage Workflow

1. **Splash Page**: View project introduction and branding
2. **Landing Page**: Review features and instructions
3. **Simulator Page**: Configure and execute instructions
   - Select operation type (ADD, SUB, AND, OR, SLT, BEQ)
   - Enter operand values (rs, rt)
   - Configure optional flags (Stall, Branch Prediction)
   - Click "Execute"
4. **Execution Page**: View real-time results
   - Pipeline stage progression
   - Operand and result values
   - Error diagnosis (if applicable)
   - Machine code representation
5. **Results Page**: Analyze performance metrics
   - View execution history
   - Study CPI/IPC trends
   - Track mispredictions and stalls
   - Export data (if available)
6. **Reset Metrics**: Clear counters for new test run

---

## Future Enhancements

### Short-term Improvements
1. Add more instruction types (LW, SW, J, JAL)
2. Implement automatic hazard detection
3. Add real branch prediction algorithms
4. Include register file visualization
5. Add memory simulation with cache modeling
6. Implement data forwarding paths

### Medium-term Enhancements
1. Support multiple pipeline configurations (3-stage, 7-stage, 10-stage)
2. Add pipeline animation with stage visualization
3. Implement advanced error diagnosis with rule-based engine
4. Create user accounts and progress tracking
5. Add test suite with automated validation
6. Support program loading (multiple instructions)

### Long-term Enhancements
1. Support multiple processor architectures (ARM, x86)
2. Add cycle-accurate simulation with waveform display
3. Implement power and performance modeling
4. Create competition mode for students
5. Develop mobile application version
6. Add AI-powered debugging assistant
7. Support Verilog/SystemVerilog co-simulation
8. Create real-time collaborative learning platform

---

## Testing Considerations

### Test Scenarios

**Instruction Execution Tests:**
- Valid inputs for each instruction type
- Boundary values (0, negative numbers, large values)
- All combinations of stall and branch prediction flags

**Error Detection Tests:**
- Each instruction with wrong result values
- Pattern matching validation
- Pipeline stage attribution accuracy

**Performance Metrics Tests:**
- Metric accumulation across multiple instructions
- CPI/IPC calculation accuracy
- Metrics reset functionality

**UI/UX Tests:**
- Navigation between pages
- Form input validation
- Result display accuracy
- Chart rendering

---

## Educational Value

### Learning Outcomes
Students using this simulator will understand:
1. How instructions flow through processor pipelines
2. The role of each pipeline stage (IF, ID, EX, MEM, WB)
3. Sources and types of pipeline hazards
4. Performance metrics and their significance
5. Instruction encoding and machine code generation
6. Error diagnosis and debugging techniques
7. Real-world processor architecture constraints

### Pedagogical Approach
- Interactive visualization enables active learning
- Immediate feedback on execution results
- Error diagnosis guides students to correct understanding
- Performance metrics provide quantitative analysis
- Experimental exploration encourages deeper comprehension

---

## Conclusion

The RISC Pipeline Simulator is a comprehensive educational tool that bridges the gap between theoretical computer architecture concepts and practical understanding. By providing interactive visualization, automatic error diagnosis, and real-time performance metrics, it enables students to explore pipeline behavior, understand hazards, and debug instruction execution problems. While simplified in scope, it serves as an excellent foundation for learning fundamental processor design principles and can be extended to support more complex architectures and instruction sets as pedagogical needs evolve.

---

**Project Version**: 1.0  
**Last Updated**: March 4, 2026  
**Status**: Active Development
