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
const devGroup = document.getElementById('dev-group');

const miInput = document.getElementById('mi');
const miGroup = document.getElementById('mi-group');

const modeFm = document.getElementById('mode-fm');
const modeAm = document.getElementById('mode-am');

const calcBox1 = document.getElementById('calc-box-1');
const calcTitle1 = document.getElementById('calc-title-1');
const calcFormula1 = document.getElementById('calc-formula-1');
const calcStep1 = document.getElementById('calc-step-1');
const calcValue1 = document.getElementById('calc-value-1');
const calcBadge = document.getElementById('calc-badge');

const calcBox2 = document.getElementById('calc-box-2');
const calcTitle2 = document.getElementById('calc-title-2');
const calcFormula2 = document.getElementById('calc-formula-2');
const calcStep2 = document.getElementById('calc-step-2');
const calcValue2 = document.getElementById('calc-value-2');

const eduIntroText = document.getElementById('edu-intro-text');
const eduDynamicText = document.getElementById('edu-dynamic-text');
const appList = document.getElementById('app-list');

const showMsg = document.getElementById('show-msg');
const showCar = document.getElementById('show-car');
const showMod = document.getElementById('show-mod');
const modLabel = document.getElementById('mod-label');

const themeToggle = document.getElementById('theme-toggle');
const exportPdf = document.getElementById('export-pdf');
const resetBtn = document.getElementById('reset-btn');

let currentMode = 'FM';

// Default Values
const defaults = {
    fc: 100, fcU: 1000,
    fm: 5, fmU: 1000,
    dev: 25, devU: 1000,
    mi: 0.5
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
    const miRaw = parseFloat(miInput.value) || 0;

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

    if (currentMode === 'FM') {
        // Calculate Beta (Modulation Index)
        const beta = dev / fm;
        
        // Calculate Bandwidth (Carson's Rule)
        const bw = 2 * (dev + fm);

        // Update UI for Beta
        calcTitle1.textContent = "Modulation Index (β)";
        calcFormula1.textContent = "β = Δf / Fm";
        calcStep1.textContent = `${devRaw} ${unitToString(devMult)} / ${fmRaw} ${unitToString(fmMult)}`;
        calcValue1.textContent = beta.toFixed(2);
        
        // Update Badge
        calcBadge.style.display = 'block';
        if (beta < 1) {
            calcBadge.textContent = "Narrowband FM";
            calcBadge.style.backgroundColor = "rgba(16, 185, 129, 0.1)"; // success color
            calcBadge.style.color = "var(--success-color)";
        } else {
            calcBadge.textContent = "Wideband FM";
            calcBadge.style.backgroundColor = "rgba(59, 130, 246, 0.1)"; // primary color
            calcBadge.style.color = "var(--primary-color)";
        }

        // Update UI for Bandwidth
        calcTitle2.textContent = "Carson's Rule Bandwidth";
        calcFormula2.textContent = "BW = 2(Δf + Fm)";
        calcStep2.textContent = `2(${devRaw} ${unitToString(devMult)} + ${fmRaw} ${unitToString(fmMult)})`;
        calcValue2.textContent = formatFreq(bw);

        // Update Educational Text
        eduIntroText.innerHTML = `<strong>Frequency Modulation (FM)</strong> is the encoding of information in a carrier wave by varying the instantaneous frequency of the wave.`;
        eduDynamicText.innerHTML = `In your current setup, the modulation index is <strong>${beta.toFixed(2)}</strong>. 
        This means the maximum frequency deviation is ${beta.toFixed(2)} times the message frequency. 
        Because β is ${beta < 1 ? 'less than 1, it is considered Narrowband FM, taking up minimal bandwidth' : 'greater than or equal to 1, it is Wideband FM, which provides better noise immunity at the cost of higher bandwidth requirements'}. 
        According to Carson's Rule, the system requires approximately <strong>${formatFreq(bw)}</strong> of bandwidth.`;
        
        appList.innerHTML = `
            <li><i class="fa-solid fa-radio"></i> FM Radio Broadcasting</li>
            <li><i class="fa-solid fa-walkie-talkie"></i> Two-way Radio Systems</li>
            <li><i class="fa-solid fa-satellite"></i> Satellite Communication</li>
            <li><i class="fa-solid fa-satellite-dish"></i> Telemetry Systems</li>
        `;
        
        modLabel.textContent = "FM Signal";

        // Redraw Charts
        drawTimeChart(fc, fm, beta);
        drawSpectrumChart(fc, fm, beta, bw);
    } else {
        // AM Mode
        const m = miRaw;
        const bw = 2 * fm;
        
        // Update UI for Modulation Index
        calcTitle1.textContent = "Modulation Index (m)";
        calcFormula1.textContent = "m = Am / Ac";
        calcStep1.textContent = `Set by User`;
        calcValue1.textContent = m.toFixed(2);
        
        // Update Badge
        calcBadge.style.display = 'block';
        if (m <= 1) {
            calcBadge.textContent = "Normal AM";
            calcBadge.style.backgroundColor = "rgba(16, 185, 129, 0.1)"; // success color
            calcBadge.style.color = "var(--success-color)";
        } else {
            calcBadge.textContent = "Overmodulation";
            calcBadge.style.backgroundColor = "rgba(239, 68, 68, 0.1)"; // danger color
            calcBadge.style.color = "var(--danger-color)";
        }

        // Update UI for Bandwidth
        calcTitle2.textContent = "AM Bandwidth";
        calcFormula2.textContent = "BW = 2 × Fm";
        calcStep2.textContent = `2 × ${fmRaw} ${unitToString(fmMult)}`;
        calcValue2.textContent = formatFreq(bw);

        // Update Educational Text
        eduIntroText.innerHTML = `<strong>Amplitude Modulation (AM)</strong> is the encoding of information in a carrier wave by varying the amplitude of the carrier wave while keeping its frequency constant.`;
        eduDynamicText.innerHTML = `In your current setup, the modulation index is <strong>${m.toFixed(2)}</strong>. 
        ${m > 1 ? 'Since m is greater than 1, the signal is <strong>overmodulated</strong>, which causes distortion and phase reversals in the envelope.' : 'Since m is less than or equal to 1, the signal can be properly demodulated using an envelope detector.'} 
        The bandwidth required is simply twice the message frequency, which is <strong>${formatFreq(bw)}</strong>.`;
        
        appList.innerHTML = `
            <li><i class="fa-solid fa-radio"></i> AM Radio Broadcasting</li>
            <li><i class="fa-solid fa-plane"></i> Aviation Communication</li>
            <li><i class="fa-solid fa-walkie-talkie"></i> Shortwave Radio</li>
            <li><i class="fa-solid fa-tower-broadcast"></i> Two-way Radio Systems</li>
        `;
        
        modLabel.textContent = "AM Signal";

        // Redraw Charts
        drawTimeChart(fc, fm, m);
        drawSpectrumChart(fc, fm, m, bw);
    }
}

function drawTimeChart(fc, fm, modParam) {
    const colors = getThemeColors();
    const t_max = 3 / fm; // Show 3 cycles of message
    const points = 2000;
    
    let t = [];
    let msg = [];
    let car = [];
    let mod_sig = [];

    for (let i = 0; i <= points; i++) {
        const time = (i / points) * t_max;
        t.push(time * 1000); // ms for better display
        
        msg.push(Math.cos(2 * Math.PI * fm * time));
        car.push(Math.cos(2 * Math.PI * fc * time));
        
        if (currentMode === 'FM') {
            mod_sig.push(Math.cos(2 * Math.PI * fc * time + modParam * Math.sin(2 * Math.PI * fm * time)));
        } else {
            // AM
            mod_sig.push((1 + modParam * Math.cos(2 * Math.PI * fm * time)) * Math.cos(2 * Math.PI * fc * time));
        }
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

    if (showMod.checked) {
        traces.push({
            x: t, y: mod_sig,
            mode: 'lines',
            name: currentMode === 'FM' ? 'FM Signal' : 'AM Signal',
            line: { color: colors.fmColor, width: 2 }
        });
    }

    // Determine y-axis range based on AM/FM
    let yRange = [-1.2, 1.2];
    if (currentMode === 'AM') {
        const maxAmp = 1 + modParam;
        yRange = [-(maxAmp + 0.2), maxAmp + 0.2];
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
            range: yRange
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

function drawSpectrumChart(fc, fm, modParam, bw) {
    const colors = getThemeColors();
    
    const x = [];
    const y = [];
    const text = [];
    
    if (currentMode === 'FM') {
        // Calculate theoretical spectrum components using Bessel functions
        const numSidebands = Math.max(3, Math.ceil(modParam) + 3);
        
        for (let n = -numSidebands; n <= numSidebands; n++) {
            const freq = fc + n * fm;
            const amplitude = Math.abs(besselJ(n, modParam));
            
            // Only plot significant components
            if (amplitude > 0.01) {
                x.push(freq);
                y.push(amplitude);
                text.push(`J<sub>${Math.abs(n)}</sub>(β) = ${amplitude.toFixed(3)}<br>${formatFreq(freq)}`);
            }
        }
    } else {
        // AM Spectrum
        // Carrier
        x.push(fc);
        y.push(1); // Normalized carrier amplitude
        text.push(`Carrier<br>${formatFreq(fc)}`);
        
        // Lower Sideband
        if (fc - fm > 0) {
            x.push(fc - fm);
            y.push(modParam / 2);
            text.push(`LSB<br>${formatFreq(fc - fm)}`);
        }
        
        // Upper Sideband
        x.push(fc + fm);
        y.push(modParam / 2);
        text.push(`USB<br>${formatFreq(fc + fm)}`);
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
const inputs = [fcInput, fcUnit, fmInput, fmUnit, devInput, devUnit, miInput];
inputs.forEach(input => {
    input.addEventListener('input', updateCalculations);
});

[showMsg, showCar, showMod].forEach(cb => {
    cb.addEventListener('change', updateCalculations);
});

[modeFm, modeAm].forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.checked) {
            currentMode = e.target.value;
            if (currentMode === 'AM') {
                devGroup.classList.add('hidden');
                miGroup.classList.remove('hidden');
            } else {
                devGroup.classList.remove('hidden');
                miGroup.classList.add('hidden');
            }
            updateCalculations();
        }
    });
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
    miInput.value = defaults.mi;
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
