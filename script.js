// Initial setup for dark mode based on system preference
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
if (prefersDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
}

// Elements
const fcInput = document.getElementById('fc');
const fcUnit = document.getElementById('fc-unit');
const fmInput = document.getElementById('fm');
const fmUnit = document.getElementById('fm-unit');
const devInput = document.getElementById('dev');
const devUnit = document.getElementById('dev-unit');

const betaStep = document.getElementById('beta-step');
const betaValue = document.getElementById('beta-value');
const fmTypeBadge = document.getElementById('fm-type');

const bwStep = document.getElementById('bw-step');
const bwValue = document.getElementById('bw-value');

const eduDynamicText = document.getElementById('edu-dynamic-text');

const showMsg = document.getElementById('show-msg');
const showCar = document.getElementById('show-car');
const showFm = document.getElementById('show-fm');

const themeToggle = document.getElementById('theme-toggle');
const exportPdf = document.getElementById('export-pdf');
const resetBtn = document.getElementById('reset-btn');

// Default Values
const defaults = {
    fc: 100, fcU: 1000,
    fm: 5, fmU: 1000,
    dev: 25, devU: 1000
};

// Bessel function of the first kind using numerical integration
function besselJ(n, x) {
    const steps = 100;
    let sum = 0;
    for (let i = 0; i <= steps; i++) {
        const tau = (i / steps) * Math.PI;
        const val = Math.cos(n * tau - x * Math.sin(tau));
        // Trapezoidal rule weights
        const weight = (i === 0 || i === steps) ? 0.5 : 1;
        sum += val * weight;
    }
    return (sum / steps);
}

// Format number with SI prefix for display
function formatFreq(val) {
    if (val >= 1e6) return (val / 1e6).toFixed(2) + ' MHz';
    if (val >= 1e3) return (val / 1e3).toFixed(2) + ' kHz';
    return val.toFixed(2) + ' Hz';
}

// Format unit value to string
function unitToString(unitVal) {
    if (unitVal == 1000000) return 'MHz';
    if (unitVal == 1000) return 'kHz';
    return 'Hz';
}

function getThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
        bg: isDark ? '#1e293b' : '#ffffff',
        text: isDark ? '#f8fafc' : '#1f2937',
        grid: isDark ? '#334155' : '#e5e7eb',
        msgColor: '#10b981', // green
        carColor: '#a78bfa', // purple
        fmColor: '#3b82f6'  // blue
    };
}

function updateCalculations() {
    // Get raw values
    const fcRaw = parseFloat(fcInput.value) || 0;
    const fmRaw = parseFloat(fmInput.value) || 0;
    const devRaw = parseFloat(devInput.value) || 0;

    // Get units
    const fcMult = parseFloat(fcUnit.value);
    const fmMult = parseFloat(fmUnit.value);
    const devMult = parseFloat(devUnit.value);

    // Calculate actual values in Hz
    const fc = fcRaw * fcMult;
    const fm = fmRaw * fmMult;
    const dev = devRaw * devMult;

    // Validation
    if (fm === 0) return; // Prevent division by zero

    // Calculate Beta (Modulation Index)
    const beta = dev / fm;
    
    // Calculate Bandwidth (Carson's Rule)
    const bw = 2 * (dev + fm);

    // Update UI for Beta
    betaStep.textContent = `${devRaw} ${unitToString(devMult)} / ${fmRaw} ${unitToString(fmMult)}`;
    betaValue.textContent = beta.toFixed(2);
    
    // Update Badge
    if (beta < 1) {
        fmTypeBadge.textContent = "Narrowband FM";
        fmTypeBadge.style.backgroundColor = "rgba(16, 185, 129, 0.1)"; // success color
        fmTypeBadge.style.color = "var(--success-color)";
    } else {
        fmTypeBadge.textContent = "Wideband FM";
        fmTypeBadge.style.backgroundColor = "rgba(59, 130, 246, 0.1)"; // primary color
        fmTypeBadge.style.color = "var(--primary-color)";
    }

    // Update UI for Bandwidth
    bwStep.textContent = `2(${devRaw} ${unitToString(devMult)} + ${fmRaw} ${unitToString(fmMult)})`;
    bwValue.textContent = formatFreq(bw);

    // Update Educational Text
    eduDynamicText.innerHTML = `In your current setup, the modulation index is <strong>${beta.toFixed(2)}</strong>. 
    This means the maximum frequency deviation is ${beta.toFixed(2)} times the message frequency. 
    Because β is ${beta < 1 ? 'less than 1, it is considered Narrowband FM, taking up minimal bandwidth' : 'greater than or equal to 1, it is Wideband FM, which provides better noise immunity at the cost of higher bandwidth requirements'}. 
    According to Carson's Rule, the system requires approximately <strong>${formatFreq(bw)}</strong> of bandwidth.`;

    // Redraw Charts
    drawTimeChart(fc, fm, beta);
    drawSpectrumChart(fc, fm, beta, bw);
}

function drawTimeChart(fc, fm, beta) {
    const colors = getThemeColors();
    const t_max = 3 / fm; // Show 3 cycles of message
    const points = 2000;
    
    let t = [];
    let msg = [];
    let car = [];
    let fm_sig = [];

    for (let i = 0; i <= points; i++) {
        const time = (i / points) * t_max;
        t.push(time * 1000); // ms for better display
        
        msg.push(Math.cos(2 * Math.PI * fm * time));
        car.push(Math.cos(2 * Math.PI * fc * time));
        fm_sig.push(Math.cos(2 * Math.PI * fc * time + beta * Math.sin(2 * Math.PI * fm * time)));
    }

    const traces = [];
    
    if (showMsg.checked) {
        traces.push({
            x: t, y: msg,
            mode: 'lines',
            name: 'Message (Fm)',
            line: { color: colors.msgColor, width: 2 }
        });
    }
    
    if (showCar.checked) {
        traces.push({
            x: t, y: car,
            mode: 'lines',
            name: 'Carrier (Fc)',
            line: { color: colors.carColor, width: 1, dash: 'dot' },
            opacity: 0.5
        });
    }

    if (showFm.checked) {
        traces.push({
            x: t, y: fm_sig,
            mode: 'lines',
            name: 'FM Signal',
            line: { color: colors.fmColor, width: 2 }
        });
    }

    const layout = {
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        margin: { t: 10, r: 10, b: 40, l: 40 },
        xaxis: { 
            title: 'Time (ms)', 
            gridcolor: colors.grid,
            zerolinecolor: colors.grid,
            tickfont: { color: colors.text },
            titlefont: { color: colors.text }
        },
        yaxis: { 
            title: 'Amplitude', 
            gridcolor: colors.grid,
            zerolinecolor: colors.grid,
            tickfont: { color: colors.text },
            titlefont: { color: colors.text },
            range: [-1.2, 1.2]
        },
        legend: {
            orientation: 'h',
            y: 1.1,
            font: { color: colors.text }
        },
        hovermode: 'closest'
    };

    Plotly.newPlot('time-chart', traces, layout, {displayModeBar: false, responsive: true});
}

function drawSpectrumChart(fc, fm, beta, bw) {
    const colors = getThemeColors();
    
    // Calculate theoretical spectrum components using Bessel functions
    const x = [];
    const y = [];
    const text = [];
    
    // Calculate how many sidebands to show. Usually beta + a few more.
    const numSidebands = Math.max(3, Math.ceil(beta) + 3);
    
    for (let n = -numSidebands; n <= numSidebands; n++) {
        const freq = fc + n * fm;
        const amplitude = Math.abs(besselJ(n, beta));
        
        // Only plot significant components
        if (amplitude > 0.01) {
            x.push(freq);
            y.push(amplitude);
            text.push(`J<sub>${Math.abs(n)}</sub>(β) = ${amplitude.toFixed(3)}<br>${formatFreq(freq)}`);
        }
    }

    const trace = {
        x: x,
        y: y,
        type: 'bar',
        text: text,
        hoverinfo: 'text',
        marker: {
            color: x.map(f => f === fc ? colors.fmColor : colors.accentColor),
            width: 2 // Make bars look like spectral lines
        },
        width: x.map(() => fm * 0.1) // 10% of fm spacing to look like impulses
    };

    // Add Carson's Bandwidth overlay
    const bwShape = {
        type: 'rect',
        xref: 'x', yref: 'paper',
        x0: fc - bw/2, y0: 0,
        x1: fc + bw/2, y1: 1,
        fillcolor: colors.fmColor,
        opacity: 0.1,
        line: { width: 0 }
    };

    const layout = {
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        margin: { t: 10, r: 10, b: 40, l: 40 },
        xaxis: { 
            title: 'Frequency', 
            gridcolor: colors.grid,
            zerolinecolor: colors.grid,
            tickfont: { color: colors.text },
            titlefont: { color: colors.text }
        },
        yaxis: { 
            title: 'Magnitude', 
            gridcolor: colors.grid,
            zerolinecolor: colors.grid,
            tickfont: { color: colors.text },
            titlefont: { color: colors.text }
        },
        shapes: [bwShape],
        showlegend: false,
        hovermode: 'closest',
        bargap: 0
    };

    Plotly.newPlot('spectrum-chart', [trace], layout, {displayModeBar: false, responsive: true});
}

// Event Listeners
const inputs = [fcInput, fcUnit, fmInput, fmUnit, devInput, devUnit];
inputs.forEach(input => {
    input.addEventListener('input', updateCalculations);
});

[showMsg, showCar, showFm].forEach(cb => {
    cb.addEventListener('change', updateCalculations);
});

themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    themeToggle.innerHTML = isDark ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    // Redraw charts with new theme colors
    updateCalculations();
});

resetBtn.addEventListener('click', () => {
    fcInput.value = defaults.fc;
    fcUnit.value = defaults.fcU;
    fmInput.value = defaults.fm;
    fmUnit.value = defaults.fmU;
    devInput.value = defaults.dev;
    devUnit.value = defaults.devU;
    updateCalculations();
});

exportPdf.addEventListener('click', () => {
    const element = document.getElementById('report-content');
    const opt = {
        margin:       0.5,
        filename:     'FM_Modulation_Report.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
    };
    
    // Temporary style adjustments for PDF
    element.style.background = 'white';
    document.documentElement.setAttribute('data-theme', 'light');
    updateCalculations();
    
    html2pdf().set(opt).from(element).save().then(() => {
        // Restore theme
        element.style.background = '';
        if (prefersDark || document.documentElement.getAttribute('data-theme') === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
        updateCalculations();
    });
});

// Initialize
updateCalculations();

// Initial icon set
const isInitiallyDark = document.documentElement.getAttribute('data-theme') === 'dark';
themeToggle.innerHTML = isInitiallyDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
