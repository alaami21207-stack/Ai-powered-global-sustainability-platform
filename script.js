
async function solveProblem() {
    const problemInput = document.getElementById("problem");
    const categoryInput = document.getElementById("category");
    const solutionBox = document.getElementById("solution");
    const button = document.getElementById("solveBtn");

    const problem = problemInput.value.trim();
    const category = categoryInput.value;

    if (!problem) {
        solutionBox.textContent =
            "Please describe your sustainability problem first.";
        return;
    }

    button.disabled = true;
    button.textContent = "Thinking... 🌱";
    solutionBox.textContent = "EcoSphere AI is generating solutions...";

    try {
        const response = await fetch("/api/solve", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                problem: problem,
                category: category
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "AI request failed.");
        }

        solutionBox.textContent = data.answer || "No answer was returned.";

    } catch (error) {
        console.error("EcoSphere AI error:", error);
        solutionBox.textContent =
            "AI connection failed: " + error.message;

    } finally {
        button.disabled = false;
        button.textContent = "Generate Solutions ✨";
    }
}

function calculateCarbon() {
    const input = document.getElementById("units");
    const result = document.getElementById("carbonResult");

    if (!input || !result) {
        console.error("Calculator input or result element is missing.");
        return;
    }

    const units = Number(input.value);

    if (
        input.value.trim() === "" ||
        !Number.isFinite(units) ||
        units <= 0
    ) {
        result.textContent =
            "Please enter a valid electricity value greater than zero.";
        return;
    }

    const emissions = units * 0.7;

    // Save the latest calculation
    localStorage.setItem("ecoUnits", String(units));
    localStorage.setItem("ecoEmissions", String(emissions));

    // Update optional report values
    const reportUnits = document.getElementById("reportUnits");
    const reportCarbon = document.getElementById("reportCarbon");

    if (reportUnits) {
        reportUnits.textContent = units + " kWh";
    }

    if (reportCarbon) {
        reportCarbon.textContent =
            emissions.toLocaleString(undefined, {
                maximumFractionDigits: 2
            }) + " kg CO₂";
    }

    // Show calculation result
    result.textContent =
        "Estimated monthly emissions: " +
        emissions.toLocaleString(undefined, {
            maximumFractionDigits: 2
        }) +
        " kg CO₂\n\nCalculation: " + units +
        " kWh × 0.7 kg CO₂/kWh\n\n" +
        "This is an illustrative estimate. Actual emissions depend on your electricity grid.";

    // Update calculator charts
    updateSustainabilityCharts(units, emissions);

    // Update optional dashboard values
    const dashboardUnits = document.getElementById("dashboardUnits");
    const dashboardCarbon = document.getElementById("dashboardCarbon");

    if (dashboardUnits) {
        dashboardUnits.innerHTML = units + " <span>kWh</span>";
    }

    if (dashboardCarbon) {
        dashboardCarbon.innerHTML =
            emissions.toLocaleString(undefined, {
                maximumFractionDigits: 2
            }) + " <span>kg</span>";
    }

    // Refresh the dashboard using the latest saved values
    if (typeof window.loadDashboard === "function") {
        window.loadDashboard();
    }
}


// Green challenge
const greenChallenge = document.getElementById("greenChallenge");

if (greenChallenge) {
    greenChallenge.addEventListener("change", function () {
        const count = document.getElementById("greenActions");
        const message = document.getElementById("challengeMessage");

        if (count) {
            count.innerHTML = (this.checked ? 1 : 0) +
                " <span>completed</span>";
        }

        if (message) {
            message.textContent = this.checked
                ? "Great work! One green action completed today. 🌱"
                : "";
        }
    });
}


// Chart variables
let emissionsBarChart = null;
let emissionsDoughnutChart = null;


// Update sustainability charts
function updateSustainabilityCharts(units, emissions) {
    const barCanvas = document.getElementById("emissionsBarChart");
    const doughnutCanvas =
        document.getElementById("emissionsDoughnutChart");

    if (!barCanvas || !doughnutCanvas || typeof Chart === "undefined") {
        console.warn("Chart.js or calculator chart elements are missing.");
        return;
    }

    const targetEmissions = emissions * 0.8;
    const reductionNeeded = emissions * 0.2;

    if (emissionsBarChart) {
        emissionsBarChart.destroy();
    }

    if (emissionsDoughnutChart) {
        emissionsDoughnutChart.destroy();
    }

    emissionsBarChart = new Chart(barCanvas, {
        type: "bar",
        data: {
            labels: ["Current Emissions", "20% Reduction Target"],
            datasets: [{
                label: "Emissions (kg CO₂)",
                data: [emissions, targetEmissions],
                backgroundColor: ["#16a34a", "#60a5fa"]
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "kg CO₂"
                    }
                }
            }
        }
    });

    emissionsDoughnutChart = new Chart(doughnutCanvas, {
        type: "doughnut",
        data: {
            labels: ["Target Emissions (80%)", "Reduction Needed (20%)"],
            datasets: [{
                data: [targetEmissions, reductionNeeded],
                backgroundColor: ["#16a34a", "#f59e0b"]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}


