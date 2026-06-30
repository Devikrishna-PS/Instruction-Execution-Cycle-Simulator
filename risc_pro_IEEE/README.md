# RISC Pipeline Simulator

This repository contains a Flask-based RISC pipeline simulator with an interactive web UI. It models a simplified 5-stage RISC processor (IF, ID, EX, MEM, WB) and supports basic instructions (ADD, SUB, AND, OR, SLT, BEQ). The simulator provides execution visualization, detailed diagnostics, performance metrics, and result reporting.

## Project Structure

```
app.py
requirements.txt
README.md
static/
  css/
    execution.css
    landing.css
    simulator.css
    splash.css
    theme.css
  js/
    animations.js
    chart.js
    clock.js
    execution.js
    group_output.js
    landing.js
    program.js
    simulator.js
    splash.js
  images/
  sounds/
templates/
  _nav.html
  execution.html
  group_output.html
  index.html
  landing.html
  results.html
  selection.html
  single_instruction.html
  splash.html
```

## Features

- **Simulator page** for configuring instructions and visualizing pipeline flow.
- **Selection page** to choose between single-instruction mode and multi-instruction (program) mode.
- **Program mode** that accepts multiple instructions, supports sequential and branch execution, and shows per-step rs/rt/result trace.
- **Error diagnosis module** to detect logical mistakes and suggest pipeline stage issues.
- **Performance metrics** tracking (instructions, cycles, stalls, CPI, IPC, throughput, branch mispredictions).
- **Results page** that displays execution results and metrics on a separate screen.
- **Metrics dashboard** with bar and line charts (Chart.js) showing last 20 data points.
- **Stall/branch prediction controls** to simulate hazards and mispredictions.
- Modular Python code with utility functions and Flask routes.

## Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd risc_pro
   ```

2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   source venv/bin/activate  # macOS/Linux
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the App

Start the Flask development server:
```bash
python app.py
```

Open your browser and visit `http://127.0.0.1:5000/simulator` to use the simulator.

## Usage

1. **Configure instruction**:
   - Select type (ADD, SUB, AND, OR, SLT, BEQ)
   - Enter `rs` and `rt` values
   - Optionally toggle `Simulate Stall Cycle` or `Predicted Branch Taken`

2. **Run Instruction**: Clicking the button executes the instruction and redirects to the results page.

3. **Results Page**: View pipeline stage messages, execution results, register state, diagnostics, and performance metrics. Use back button to return.

4. **Reset Metrics**: Metrics are reset when you click the `Reset Metrics` button on simulator or by reloading.

## Code Structure

- `app.py` – Flask server with routes, utility functions, error diagnosis, and metrics logic.
- `templates/` – HTML templates:
  - `index.html` – Simulator UI
  - `results.html` – Result dashboard
- `static/css/` – Stylesheets (`simulator.css`, `theme.css`)
- `static/js/` – JavaScript files (`simulator.js`, `animations.js`, `clock.js`)
- `requirements.txt` – Python dependencies (Flask)

## Extending the Simulator

- Add new instructions by expanding `generate_machine_code`, `simulate` logic, and diagnosis patterns.
- Enhance metrics calculation or add new counters in `update_metrics` and `compute_derived_metrics`.
- Improve UI/UX by editing templates and CSS, or adding new charts.

## Notes

- Data transfer between pages uses `sessionStorage`. Results are cleared when the browser session ends.
- Charts automatically update without page reload and retain up to 20 data points.

## License

This project is provided as-is for educational purposes.

---

Happy simulating! Feel free to customize and extend the pipeline behaviors.