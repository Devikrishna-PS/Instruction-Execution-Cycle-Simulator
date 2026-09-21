import os
import webbrowser
from threading import Timer
from flask import Flask, render_template, request, jsonify
import re  # used for parsing register/memory syntax

app = Flask(__name__)

# -------------------------------
# Utility Functions and Simulation Helpers
# -------------------------------

# simple register file and data memory for multi-instruction runs
register_file = [0] * 32
data_memory = {}


def register_to_index(reg_str):
    """Convert a register token like 'R5' or 'r12' to numeric index.

    Raises ValueError for invalid register names.
    """
    if not isinstance(reg_str, str):
        raise ValueError(f"Register must be a string, got: {reg_str}")

    reg = reg_str.strip().upper()
    if not re.fullmatch(r"R([0-9]|[12][0-9]|3[01])", reg):
        raise ValueError(f"Invalid register name: {reg_str}. Expected R0-R31")

    return int(reg[1:])


def parse_program(raw_text):
    """Convert a multiline program text into a parse-check and structured instruction list."""
    if not isinstance(raw_text, str) or not raw_text.strip():
        raise ValueError("Program input is empty")

    instructions = []
    for idx, line in enumerate(raw_text.strip().splitlines(), start=1):
        original_line = line
        line = line.strip()
        if not line or line.startswith('#'):
            continue

        # normalize whitespace and commas
        line = line.replace(',', ' ')
        parts = re.split(r'\s+', line)
        op = parts[0].upper()

        if op in ["ADD", "SUB", "AND", "OR", "SLT"]:
            if len(parts) != 4:
                raise ValueError(f"Invalid format at line {idx}: {original_line}")
            rd = register_to_index(parts[1])
            rs = register_to_index(parts[2])
            rt = register_to_index(parts[3])
            instructions.append({"op": op, "rd": rd, "rs": rs, "rt": rt})

        elif op == "BEQ":
            if len(parts) != 4:
                raise ValueError(f"Invalid format at line {idx}: {original_line}")
            rs = register_to_index(parts[1])
            rt = register_to_index(parts[2])
            try:
                imm = int(parts[3], 0)
            except ValueError:
                raise ValueError(f"Invalid immediate at line {idx}: {parts[3]}")
            instructions.append({"op": op, "rs": rs, "rt": rt, "imm": imm})

        elif op in ["LW", "SW"]:
            if len(parts) != 3:
                raise ValueError(f"Invalid format at line {idx}: {original_line}")
            rt = register_to_index(parts[1])
            mem = parts[2]
            m = re.match(r'(-?\d+)\(\s*(R[0-9]|R[12][0-9]|R3[01])\s*\)', mem, re.IGNORECASE)
            if not m:
                raise ValueError(f"Invalid memory operand at line {idx}: {mem}")
            imm = int(m.group(1))
            rs = register_to_index(m.group(2))
            instructions.append({"op": op, "rs": rs, "rt": rt, "imm": imm})

        else:
            raise ValueError(f"Invalid operation at line {idx}: {op}")

    return instructions


def simulate_instruction(instr, registers=None, memory=None):
    """Run a single instruction against a register file and data memory.

    The caller may provide its own `registers` list and `memory` dict to
    maintain state across multiple instructions.  If those are omitted the
    globals `register_file`/`data_memory` are used.

    Returns a dictionary in the same format as `/simulate` (pipeline stages,
    result values, metrics, diagnosis) plus the updated registers and memory
    snapshots.
    """
    global register_file, data_memory
    if registers is None:
        registers = register_file
    if memory is None:
        memory = data_memory

    operation = instr.get("operation")
    rs = instr.get("rs", 0)
    rt = instr.get("rt", 0)
    rd = instr.get("rd", 0)
    imm = instr.get("imm", 0)

    result = 0
    branch_taken = False
    overflow = False

    try:
        if operation == "ADD":
            result = registers[rs] + registers[rt]
            if rd < len(registers):
                registers[rd] = result
        elif operation == "SUB":
            result = registers[rs] - registers[rt]
            if rd < len(registers):
                registers[rd] = result
        elif operation == "AND":
            result = registers[rs] & registers[rt]
            if rd < len(registers):
                registers[rd] = result
        elif operation == "OR":
            result = registers[rs] | registers[rt]
            if rd < len(registers):
                registers[rd] = result
        elif operation == "SLT":
            result = 1 if registers[rs] < registers[rt] else 0
            if rd < len(registers):
                registers[rd] = result
        elif operation == "BEQ":
            branch_taken = (registers[rs] == registers[rt])
            result = 0
        elif operation == "LW":
            address = registers[rs] + imm
            result = memory.get(address, 0)
            if rt < len(registers):
                registers[rt] = result  # rt is destination for load
        elif operation == "SW":
            address = registers[rs] + imm
            memory[address] = registers[rt]
            result = None
    except Exception as e:
        # for a program runner we don't abort the whole run; just attach error
        result = None

    zero_flag = (result == 0)
    machine_code = generate_machine_code(operation, rs, rt, rd, imm)

    # update metrics if the instruction has ALU/branch semantics
    update_metrics(operation, branch_taken, instr.get('predicted_branch', None), instr.get('stall', False))
    metrics_data = compute_derived_metrics()

    diagnosis_result = diagnose_error(operation, registers[rs] if rs < len(registers) else 0,
                                      registers[rt] if rt < len(registers) else 0,
                                      result if result is not None else 0)

    output = {
        "operation": operation,
        "IF": "Instruction Fetched",
        "ID": f"Operands: rs={registers[rs] if rs < len(registers) else 0}, rt={registers[rt] if rt < len(registers) else 0}",
        "EX": f"Executed {operation}",
        "MEM": "Memory Access",
        "WB": "Write Back",
        "result_decimal": result,
        "result_binary": group_binary(to_32bit_binary(result)) if isinstance(result, int) else "",
        "machine_code": machine_code,
        "rs_binary": group_binary(to_32bit_binary(registers[rs] if rs < len(registers) else 0)),
        "rt_binary": group_binary(to_32bit_binary(registers[rt] if rt < len(registers) else 0)),
        "rs_value": registers[rs] if rs < len(registers) else 0,
        "rt_value": registers[rt] if rt < len(registers) else 0,
        "zero_flag": zero_flag,
        "branch_taken": branch_taken,
        "overflow": overflow,
        "expected_result": diagnosis_result.get("expected_result"),
        "diagnosis_status": diagnosis_result.get("status"),
        "diagnosis": diagnosis_result.get("diagnosis"),
        **metrics_data,
        # include snapshots so the front end can inspect program state
        "registers": registers.copy(),
        "memory": memory.copy()
    }
    return output
def to_32bit_binary(value):
    return format(value & 0xFFFFFFFF, '032b')

def group_binary(binary_str):
    return ' '.join(binary_str[i:i+4] for i in range(0, 32, 4))

# -------------------------------
# Error Diagnosis Module
# Pattern-based AI diagnosis for common RISC instruction errors

# -------------------------------
# Performance Metrics
# Global counters to track instruction execution statistics

metrics = {
    "total_instructions": 0,
    "stall_cycles": 0,
    "branch_mispredictions": 0
}


def reset_metrics():
    """Reset all performance counters to zero."""
    metrics["total_instructions"] = 0
    metrics["stall_cycles"] = 0
    metrics["branch_mispredictions"] = 0


def update_metrics(instruction, branch_taken=False, predicted_branch=None, stall=False):
    """
    Update global performance counters after each instruction.

    Args:
        instruction: instruction string executed
        branch_taken: True if BEQ resulted in a taken branch
        predicted_branch: Optional boolean prediction; if provided and differs
            from branch_taken, counts as a misprediction.
        stall: Boolean flag indicating whether a stall cycle occurred.
    """
    # increment instruction count
    metrics["total_instructions"] += 1

    # stall cycles
    if stall:
        metrics["stall_cycles"] += 1

    # branch misprediction logic
    if instruction == "BEQ" and predicted_branch is not None:
        if predicted_branch != (1 if branch_taken else 0):
            metrics["branch_mispredictions"] += 1


def compute_derived_metrics():
    """Calculate cycles, CPI, IPC, and throughput based on current counters."""
    instr = metrics["total_instructions"]
    stalls = metrics["stall_cycles"]

    # for a 5-stage pipeline: total cycles = instructions + 4 + stall cycles
    total_cycles = instr + 4 + stalls

    cpi = total_cycles / instr if instr > 0 else 0
    ipc = instr / total_cycles if total_cycles > 0 else 0
    throughput = ipc

    return {
        "total_instructions": instr,
        "total_cycles": total_cycles,
        "stall_cycles": stalls,
        "branch_mispredictions": metrics["branch_mispredictions"],
        "cpi": cpi,
        "ipc": ipc,
        "throughput": throughput
    }

# -------------------------------
# Error Diagnosis Module
# Pattern-based AI diagnosis for common RISC instruction errors

def diagnose_error(instruction, rs, rt, simulator_result, current_pc=None):
    """
    Diagnose common errors in RISC instruction execution.
    
    Detects pattern-based mistakes and identifies probable pipeline stage of error.
    
    Args:
        instruction: The RISC instruction (ADD, SUB, AND, OR, SLT, BEQ, LW, SW)
        rs: Source register 1 value
        rt: Source register 2 value
        simulator_result: The result computed by the simulator
        current_pc: Optional program counter value
    
    Returns:
        Dictionary with:
            - expected_result: Correct result value
            - status: "Correct", "Incorrect", or other info
            - diagnosis: Human-readable explanation with pipeline stage hint
    """
    
    # Step 1: Compute expected result based on instruction type
    expected_result = None
    
    if instruction == "ADD":
        expected_result = rs + rt
    elif instruction == "SUB":
        expected_result = rs - rt
    elif instruction == "AND":
        expected_result = rs & rt
    elif instruction == "OR":
        expected_result = rs | rt
    elif instruction == "SLT":
        expected_result = 1 if rs < rt else 0
    elif instruction == "BEQ":  
        # For BEQ, result indicates if branch should be taken (1=taken, 0=not taken)
        expected_result = 1 if rs == rt else 0
    elif instruction in ["LW", "SW"]:
        # memory ops may still be diagnosed for load/store behavior
        if instruction == "LW":
            return {
                "expected_result": None,
                "status": "N/A",
                "diagnosis": "LW loads from memory into register. Ensure address and offset are correct."
            }
        else:  # SW
            return {
                "expected_result": None,
                "status": "N/A",
                "diagnosis": "SW stores register value to memory. Ensure address is computed correctly and destination is valid."
            }

    else:
        return {
            "expected_result": None,
            "status": "Unknown",
            "diagnosis": f"Unknown instruction: {instruction}"
        }
    
    # Step 2: Compare results
    if simulator_result == expected_result:
        return {
            "expected_result": expected_result,
            "status": "Correct",
            "diagnosis": f"✓ {instruction} executed correctly. Pipeline: IF → ID → EX ✓ → MEM → WB"
        }
    
    # Step 3: Error detected - identify pattern
    diagnosis = f"Instruction: {instruction} | Expected: {expected_result} | Got: {simulator_result}\n"
    pipeline_stage = "EX"  # Most errors occur in Execute stage
    
    # Pattern matching for common mistakes
    if instruction == "ADD":
        if simulator_result == rs - rt:
            diagnosis += "Pattern Match: SUB logic used instead of ADD (left operand - right operand detected)."
            pipeline_stage = "EX"
        elif simulator_result == rs & rt:
            diagnosis += "Pattern Match: AND logic used instead of ADD (bitwise AND detected)."
            pipeline_stage = "EX"
        elif simulator_result == rs:
            diagnosis += "Pattern Match: Result equals only rs. rt operand not factored in."
            pipeline_stage = "ID"  # Register read error
        elif simulator_result == rt:
            diagnosis += "Pattern Match: Result equals only rt. rs operand not factored in."
            pipeline_stage = "ID"  # Register read error
        elif simulator_result == 0:
            diagnosis += "Pattern Match: Result is zero. Possible register read failure or forwarding issue."
            pipeline_stage = "EX/ID"
        else:
            diagnosis += "Pattern: Unexpected ADD result value."
            pipeline_stage = "EX"
    
    elif instruction == "SUB":
        if simulator_result == rs + rt:
            diagnosis += "Pattern Match: ADD logic used instead of SUB (addition detected)."
            pipeline_stage = "EX"
        elif simulator_result == rs:
            diagnosis += "Pattern Match: Result equals only rs. rt operand not subtracted."
            pipeline_stage = "ID"  # Register read or ALU routing error
        elif simulator_result == 0:
            diagnosis += "Pattern Match: Result is zero. Possible register read failure or forwarding issue."
            pipeline_stage = "EX/ID"
        else:
            diagnosis += "Pattern: Unexpected SUB result value."
            pipeline_stage = "EX"
    
    elif instruction == "AND":
        if simulator_result == rs:
            diagnosis += "Pattern Match: Result equals only rs. rt operand not applied in AND operation."
            pipeline_stage = "ID"
        elif simulator_result == 0:
            diagnosis += "Pattern Match: Result is zero. Possible register read failure or AND gate issue."
            pipeline_stage = "EX/ID"
        else:
            diagnosis += "Pattern: Unexpected AND result value."
            pipeline_stage = "EX"
    
    elif instruction == "OR":
        if simulator_result == rs:
            diagnosis += "Pattern Match: Result equals only rs. rt operand not applied in OR operation."
            pipeline_stage = "ID"
        elif simulator_result == 0:
            diagnosis += "Pattern Match: Result is zero. Possible register read failure or OR gate issue."
            pipeline_stage = "EX/ID"
        else:
            diagnosis += "Pattern: Unexpected OR result value."
            pipeline_stage = "EX"
    
    elif instruction == "SLT":
        if simulator_result not in [0, 1]:
            diagnosis += "Pattern: SLT result must be 0 or 1 (boolean). Invalid value used."
            pipeline_stage = "EX"
        else:
            # Check for reversed condition
            if (rs < rt and simulator_result == 0) or (rs >= rt and simulator_result == 1):
                diagnosis += "Pattern Match: SLT condition appears reversed (inverted comparison logic)."
                pipeline_stage = "EX"
            else:
                diagnosis += "Pattern: Unexpected SLT comparison result."
                pipeline_stage = "EX"
    
    elif instruction == "BEQ":
        # Check for reversed branch condition
        if (rs == rt and simulator_result == 0) or (rs != rt and simulator_result == 1):
            diagnosis += "Pattern Match: BEQ condition reversed (branch taken when should not be)."
            pipeline_stage = "EX"
        else:
            diagnosis += "Pattern: Unexpected BEQ comparison result."
            pipeline_stage = "EX"
    
    diagnosis += f"\n→ Error likely in {pipeline_stage} stage"
    
    return {
        "expected_result": expected_result,
        "status": "Incorrect",
        "diagnosis": diagnosis
    }

# -------------------------------
# Machine Code Generator
def generate_machine_code(operation, rs, rt, rd=0, imm=0):
    rs_bin = format(rs & 0x1F, '05b')
    rt_bin = format(rt & 0x1F, '05b')
    rd_bin = format(rd & 0x1F, '05b')  # Use the rd parameter instead of hardcoding
    shamt = "00000"
    
    opcode = "000000"  # default R-type opcode
    funct_map = {
        "ADD": "100000",
        "SUB": "100010",
        "AND": "100100",
        "OR" : "100101",
        "SLT": "101010"
    }
    
    if operation in funct_map:  # R-type
        funct = funct_map[operation]
        machine_code = f"{opcode} {rs_bin} {rt_bin} {rd_bin} {shamt} {funct}"
    elif operation == "BEQ":  # I-type
        opcode = "000100"
        immediate = format(imm & 0xFFFF, '016b')
        machine_code = f"{opcode} {rs_bin} {rt_bin} {immediate}"
    elif operation == "LW":
        opcode = "100011"
        immediate = format(imm & 0xFFFF, '016b')
        machine_code = f"{opcode} {rs_bin} {rt_bin} {immediate}"
    elif operation == "SW":
        opcode = "101011"
        immediate = format(imm & 0xFFFF, '016b')
        machine_code = f"{opcode} {rs_bin} {rt_bin} {immediate}"
    else:
        machine_code = "0" * 32
    
    return machine_code

# -------------------------------
# Page Routes

@app.route('/')
def splash():
    return render_template('splash.html')

@app.route('/landing')
def landing():
    return render_template('landing.html')

@app.route('/execution')
def execution():
    return render_template('execution.html')

@app.route('/selection')
def selection():
    return render_template('selection.html')

@app.route('/single_instruction')
def single_instruction():
    return render_template('single_instruction.html')

@app.route('/program')
def program():
    return render_template('index.html')   # Program execution page

@app.route('/results')
def results():
    """Display results page - data passed via sessionStorage from frontend."""
    return render_template('results.html')


@app.route('/group_results')
def group_results():
    """Group instruction results page for program mode."""
    return render_template('group_output.html')


@app.route('/simulate', methods=['POST'])
def simulate():
    data = request.json
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid request data"}), 400

    operation = data.get('operation')
    if not operation or not isinstance(operation, str):
        return jsonify({"error": "Operation is required"}), 400

    operation = operation.upper()
    allowed_ops = ["ADD", "SUB", "AND", "OR", "SLT", "BEQ", "LW", "SW"]
    if operation not in allowed_ops:
        return jsonify({"error": f"Unsupported operation: {operation}"}), 400

    try:
        rs = int(data.get('rs', 0))
        rt = int(data.get('rt', 0))
        rd = int(data.get('rd', 0))  # Add rd extraction
    except ValueError:
        return jsonify({"error": "rs, rt, and rd must be integers"}), 400

    if operation in ["ADD", "SUB", "AND", "OR", "SLT", "BEQ"] and (rs < 0 or rt < 0):
        return jsonify({"error": "rs and rt must be non-negative"}), 400

    # Do not carry-over global register state here; use secure stateless execution
    registers = [0] * 32
    memory = {}

    result = 0
    branch_taken = False
    overflow = False

    try:
        if operation == "ADD":
            result = rs + rt
        elif operation == "SUB":
            result = rs - rt
        elif operation == "AND":
            result = rs & rt
        elif operation == "OR":
            result = rs | rt
        elif operation == "SLT":
            result = 1 if rs < rt else 0
        elif operation == "BEQ":
            branch_taken = (rs == rt)
            result = 0
        elif operation == "LW":
            address = rs
            result = memory.get(address, 0)
        elif operation == "SW":
            address = rs
            memory[address] = rt
            result = 0
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    zero_flag = (result == 0)
    # include immediate if provided for machine code (frontend doesn't send imm)
    imm = int(data.get('imm', 0)) if data.get('imm') is not None else 0
    machine_code = generate_machine_code(operation, rs, rt, rd, imm)

    # optional metrics flags from frontend
    predicted_branch = data.get('predicted_branch', None)
    stall = data.get('stall', False)

    # update global performance counters
    update_metrics(operation, branch_taken, predicted_branch, stall)
    metrics_data = compute_derived_metrics()
    
    # Integrate error diagnosis
    diagnosis_result = diagnose_error(operation, rs, rt, result)

    return jsonify({
        # Pipeline stage messages
        "IF": "Instruction Fetched",
        "ID": f"Operands: {rs}, {rt}",
        "EX": f"Executed {operation}",
        "MEM": "Memory Access",
        "WB": "Write Back",

        # ALU results
        "result_decimal": result,
        "result_binary": group_binary(to_32bit_binary(result)),
        "machine_code": machine_code,

        "rs_binary": group_binary(to_32bit_binary(rs)),
        "rt_binary": group_binary(to_32bit_binary(rt)),

        "zero_flag": zero_flag,
        "branch_taken": branch_taken,
        "overflow": overflow,

        # Error Diagnosis
        "expected_result": diagnosis_result["expected_result"],
        "diagnosis_status": diagnosis_result["status"],
        "diagnosis": diagnosis_result["diagnosis"],

        # Performance metrics
        **metrics_data,

        # Memory state
        "memory": data_memory.copy()
    })


# -------------------------------
# Metrics Reset Route

@app.route('/reset_metrics', methods=['POST'])
def reset_metrics_route():
    """Endpoint to reset performance counters."""
    reset_metrics()
    return jsonify(compute_derived_metrics())

@app.route("/run_program", methods=["POST"])
def run_program():
    payload = request.json.get("program")
    if not isinstance(payload, str) or not payload.strip():
        return jsonify({"error": "No program provided"}), 400

    try:
        instructions = parse_program(payload)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    # Initialize fresh state for this run
    registers = [0] * 32
    memory = {}

    initial_regs = request.json.get('initial_registers', {}) or {}
    for reg_name, reg_val in initial_regs.items():
        if isinstance(reg_name, str) and re.fullmatch(r'R([0-9]|[12][0-9]|3[01])', reg_name.upper()):
            reg_index = int(reg_name[1:])
            registers[reg_index] = int(reg_val)

    pipeline = []
    steps = []
    total_stalls = 0
    pc = 0
    current_if_cycle = 1

    def execute(inst):
        op = inst["op"]
        rs = inst.get("rs", 0)
        rt = inst.get("rt", 0)
        rd = inst.get("rd", None)
        imm = inst.get("imm", 0)

        result = None
        branch_taken = False

        if op == "ADD":
            result = registers[rs] + registers[rt]
            if rd is not None:
                registers[rd] = result
        elif op == "SUB":
            result = registers[rs] - registers[rt]
            if rd is not None:
                registers[rd] = result
        elif op == "AND":
            result = registers[rs] & registers[rt]
            if rd is not None:
                registers[rd] = result
        elif op == "OR":
            result = registers[rs] | registers[rt]
            if rd is not None:
                registers[rd] = result
        elif op == "SLT":
            result = 1 if registers[rs] < registers[rt] else 0
            if rd is not None:
                registers[rd] = result
        elif op == "BEQ":
            branch_taken = registers[rs] == registers[rt]
            result = 1 if branch_taken else 0

        elif op == "LW":
            address = registers[rs] + imm
        # Optional: check for valid memory address
            if address < 0:
                raise ValueError(f"Invalid memory address {address}")
            registers[rt] = memory.get(address, 0)  # Load from memory, default 0 if empty

        elif op == "SW":
            address = registers[rs] + imm
            if address < 0:
                raise ValueError(f"Invalid memory address {address}")
            memory[address] = registers[rt]  # Store value


        return {
            "result_decimal": result,
            "branch_taken": branch_taken
        }

    # pipeline: simple hazard detection and stage mapping
    while pc < len(instructions):
        inst = instructions[pc]

        # Basic data hazard stall if prior instruction writes a register read by this one
        hazard_stall = 0
        hazard_detail = None
        if steps:
            prev = steps[-1]
            prev_op = prev["op"]
            prev_dest = None
            if prev_op in ["ADD", "SUB", "SLT", "AND", "OR"]:
                prev_dest = prev.get("rd")
            elif prev_op == "LW":
                prev_dest = prev.get("rt")

            if prev_dest is not None and prev_dest != 0:
                if inst.get("rs") == prev_dest or inst.get("rt") == prev_dest:
                    hazard_stall = 1
                    hazard_detail = f"RAW hazard: {inst['op']} depends on {prev_op} result in R{prev_dest}."

        if hazard_stall > 0:
            total_stalls += hazard_stall

        # Assign pipeline cycles
        stage_cycles = {
                    "IF": current_if_cycle,
                    "ID": current_if_cycle + 1,
                    "EX": current_if_cycle + 2 + hazard_stall,
                    "MEM": current_if_cycle + 3 + hazard_stall,
                    "WB": current_if_cycle + 4 + hazard_stall
             }

        # Capture source operand values before execution for accurate trace
        rs_value_in = registers[inst.get("rs", 0)] if inst.get("rs") is not None else None
        rt_value_in = registers[inst.get("rt", 0)] if inst.get("rt") is not None else None

        result_info = execute(inst)

        machine_code = generate_machine_code(inst["op"], inst.get("rs", 0), inst.get("rt", 0), inst.get("rd", 0), inst.get("imm", 0))

        pipeline.append({
            "instruction_index": pc,
            "operation": inst["op"],
            "stage_cycles": stage_cycles,
            "stall_before": hazard_stall,
            "branch_taken": result_info["branch_taken"]
        })

        step_info = {
            "op": inst["op"],
            "rs": inst.get("rs", ""),
            "rt": inst.get("rt", ""),
            "rd": inst.get("rd", ""),
            "imm": inst.get("imm", 0),
            "result_decimal": result_info["result_decimal"],
            "machine_code": machine_code,
            "rs_value": rs_value_in,
            "rt_value": rt_value_in,
            "stage_cycles": stage_cycles,
            "register_snapshot": registers.copy(),
            "memory_snapshot": memory.copy(),
            "branch_taken": result_info["branch_taken"],
            "stall_before": hazard_stall,
            "hazard_detail": hazard_detail,
            "pc_before": pc
        }
        steps.append(step_info)

        # BEQ control handling
        if inst["op"] == "BEQ" and result_info["branch_taken"]:
            pc = pc + inst.get("imm", 0)
            step_info["pc_after"] = pc
            current_if_cycle = stage_cycles["IF"] + 2  # control hazard bubble
        else:
            step_info["pc_after"] = pc + 1
            pc += 1
            current_if_cycle += 1

    total_instructions = len(instructions)
    total_cycles = max(p["stage_cycles"]["WB"] for p in pipeline) if pipeline else 0
    cpi = total_cycles / total_instructions if total_instructions > 0 else 0
    ipc = total_instructions / total_cycles if total_cycles > 0 else 0

    metrics = {
        "total_instructions": total_instructions,
        "total_cycles": total_cycles,
        "stall_cycles": total_stalls,
        "branch_mispredictions": 0,
        "cpi": round(cpi, 2),
        "ipc": round(ipc, 2),
        "throughput": round(ipc, 2)
    }

    final_result = None
    if steps:
        final_result = steps[-1].get("result_decimal")

    # Add machine code to each instruction in program mode output
    for inst in instructions:
        inst["machine_code"] = generate_machine_code(inst.get("op", ""), inst.get("rs", 0), inst.get("rt", 0), inst.get("rd", 0), inst.get("imm", 0))

    return jsonify({
        "instructions": instructions,
        "steps": steps,
        "registers": registers,
        "initial_registers": initial_regs,
        "memory": memory,
        "pipeline": pipeline,
        "metrics": metrics,
        "final_result": final_result
    })

# -------------------------------
# Run App

if __name__ == "__main__":
    app.run()
