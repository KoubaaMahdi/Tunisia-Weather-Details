
document.addEventListener('DOMContentLoaded', () => {
    const map = L.map('map').setView([35.5, 10], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    const states = [
        { name: 'Tunis', lat: 36.807, lon: 10.184 },
        { name: 'Ariana', lat: 36.866, lon: 10.164 },
        { name: 'Ben Arous', lat: 36.746, lon: 10.235 },
        { name: 'Manouba', lat: 36.805, lon: 10.101 },
        { name: 'Bizerte', lat: 37.274, lon: 9.873 },
        { name: 'Nabeul', lat: 36.460, lon: 10.729 },
        { name: 'Zaghouan', lat: 36.407, lon: 10.149 },
        { name: 'Siliana', lat: 36.083, lon: 9.370 },
        { name: 'Kef', lat: 36.168, lon: 8.709 },
        { name: 'Jendouba', lat: 36.504, lon: 8.775 },
        { name: 'Beja', lat: 36.725, lon: 9.184 },
        { name: 'Sousse', lat: 35.829, lon: 10.634 },
        { name: 'Monastir', lat: 35.771, lon: 10.835 },
        { name: 'Mahdia', lat: 35.504, lon: 11.043 },
        { name: 'Kairouan', lat: 35.674, lon: 10.091 },
        { name: 'Kasserine', lat: 35.168, lon: 8.832 },
        { name: 'Sidi Bouzid', lat: 34.910, lon: 9.384 },
        { name: 'Gabes', lat: 33.886, lon: 10.098 },
        { name: 'Gafsa', lat: 34.421, lon: 8.781 },
        { name: 'Tozeur', lat: 33.919, lon: 8.133 },
        { name: 'Medenine', lat: 33.354, lon: 10.508 },
        { name: 'Tataouine', lat: 32.925, lon: 10.449 },
        { name: 'Sfax', lat: 34.74, lon: 10.760 },
        { name: 'Djerba', lat: 33.801, lon: 10.857 },
    ];

    let selectedState = null;

    function fetchWeatherData(latitude, longitude, date, callback) {
        const apiUrl = `https://archive-api.open-meteo.com/v1/era5?latitude=${latitude}&longitude=${longitude}&start_date=${date}&end_date=${date}&hourly=temperature_2m`;

        fetch(apiUrl)
            .then((response) => response.json())
            .then((data) => {
                plotWeatherData(data.hourly);
                if (callback) {
                    callback(data.hourly);
                }
            })
            .catch((error) => {
                console.error('Error fetching weather data:', error);
            });
    }

    function plotWeatherData(hourlyData) {
        const times = hourlyData.time.map(t => new Date(t));
        const temperatures = hourlyData.temperature_2m;

        // Clear the existing chart
        d3.select("#chart").select("svg").remove();

        const svg = d3.select("#chart").append("svg")
            .attr("width", 550)
            .attr("height", 400);

        const xScale = d3.scaleTime()
            .domain([d3.min(times), d3.max(times)])
            .range([40, 550]);

        const yScale = d3.scaleLinear()
            .domain([d3.min(temperatures) - 1, d3.max(temperatures) + 1])
            .range([400, 0]);

        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

        svg.append("g")
            .attr("transform", "translate(0, 380)")
            .call(xAxis);

        svg.append("g")
            .attr("transform", "translate(40, 0)")
            .call(yAxis);

        const line = d3.line()
            .x(d => xScale(new Date(d)))
            .y((d, i) => yScale(temperatures[i]));

        svg.append("path")
            .datum(hourlyData.time)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("d", line);
    }

    states.forEach((state) => {
        const marker = L.marker([state.lat, state.lon])
            .addTo(map)
            .bindPopup(state.name);

        marker.on("click", () => {
            selectedState = state;
            const selectedDate = document.getElementById("date-picker").value;
            fetchWeatherData(state.lat, state.lon, selectedDate);
        });
    });

    function fetchWeatherDataForAllStates(date) {
        const stateTemperatures = [];

        // Fetch weather data for all states and calculate average temperatures
        let completedRequests = 0;
        states.forEach((state) => {
            fetchWeatherData(state.lat, state.lon, date, (hourlyData) => {
                const avgTemperature = hourlyData.temperature_2m.reduce((a, b) => a + b, 0) / hourlyData.temperature_2m.length;
                stateTemperatures.push({
                    name: state.name,
                    avgTemperature,
                    hourlyData // Pass hourlyData to access later
                });
                completedRequests += 1;
                if (completedRequests === states.length) {
                    // Once all data is fetched, plot the bar graph
                    plotBarGraph(stateTemperatures);
                    updateStateTemperatureStats(stateTemperatures)
                }
            });
        });

    }
    // Call fetchWeatherDataForAllStates when the page is loaded
    const initialDate = document.getElementById("date-picker").value; // Get the date from the date picker
    fetchWeatherDataForAllStates(initialDate); // Call the function with the initial date
    states.forEach((state) => {
        const marker = L.marker([state.lat, state.lon])
            .addTo(map)
            .bindPopup(state.name);

        marker.on("click", () => {
            selectedState = state;
            const selectedDate = document.getElementById("date-picker").value;
            fetchWeatherData(state.lat, state.lon, selectedDate, plotWeatherData);
        });
    });

    document.getElementById("refresh").addEventListener("click", () => {
        const selectedDate = document.getElementById("date-picker").value;

        // Clear previous bar graph and plot the new one
        d3.select("#bar-graph").select("svg").remove();

        // Fetch data and plot the bar graph
        fetchWeatherDataForAllStates(selectedDate);

        if (selectedState) {
            fetchWeatherData(selectedState.lat, selectedState.lon, selectedDate, plotWeatherData);
        }
    });
    const stateSelector = document.getElementById('state-selector');
    const loadAirQualityButton = document.getElementById('load-air-quality');
    states.forEach((state) => {
        const option = document.createElement('option');
        option.value = state.name;
        option.textContent = state.name;
        stateSelector.appendChild(option);
    });
    function fetchAirQualityData(state) {
        const stateData = states.find(s => s.name === state);
        if (!stateData) return; // Return if state not found

        const apiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${stateData.lat}&longitude=${stateData.lon}&hourly=pm10,pm2_5`;

        fetch(apiUrl)
            .then((response) => response.json())
            .then((data) => {
                plotAirQualityData(data.hourly);
            })
            .catch((error) => {
                console.error('Error fetching air quality data:', error);
            });
    }

    // Function to plot air quality data with hover tooltip
function plotAirQualityData(hourlyData) {
    // Validate input data
    if (!hourlyData || !hourlyData.time || !hourlyData.pm10 || !hourlyData.pm2_5) {
        console.error("Hourly data is incomplete or undefined.");
        return; // Exit if data is incomplete
    }

    const times = hourlyData.time.map(t => new Date(t)); // Ensure proper time mapping
    const pm10 = hourlyData.pm10;
    const pm2_5 = hourlyData.pm2_5;

    // Ensure all arrays have consistent length
    if (times.length !== pm10.length || times.length !== pm2_5.length) {
        console.error("Data length mismatch.");
        return; // Exit if data is inconsistent
    }

    // Clear previous chart
    d3.select("#air-quality-chart").select("svg").remove();

    const svgWidth = 1100; // Width of the SVG canvas
    const svgHeight = 400; // Height of the SVG canvas
    const svg = d3.select("#air-quality-chart").append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    // Define scales
    const xScale = d3.scaleTime()
        .domain([d3.min(times), d3.max(times)] )
        .range([40, svgWidth - 40]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max([...pm10, ...pm2_5]) +10])
        .range([svgHeight - 40, 20]);

    // Add axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    svg.append("g")
        .attr("transform", `translate(0, ${svgHeight - 40})`)
        .call(xAxis);

    svg.append("g")
        .attr("transform", "translate(40, 0)")
        .call(yAxis);

    // Create a tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.75)")
        .style("color", "white")
        .style("padding", "5px 10px")
        .style("border-radius", "5px")
        .style("opacity", 0);

    // Function to plot line with bullets
    const plotLineWithBullets = (data, color) => {
        // Plot the line
        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                .x((d, i) => {
                    if (!times[i] || isNaN(times[i].getTime())) {
                        console.error("Invalid time data at index " + i);
                        return xScale(times[0]); // Default to first time point if invalid
                    }
                    return xScale(times[i]);
                })
                .y((d, i) => yScale(data[i]))
            );

        // Plot the bullets and add hover event
        svg.selectAll(`circle.${color}`)
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", (d, i) => xScale(times[i] || times[0])) // Fallback to first index if undefined
            .attr("cy", (d, i) => yScale(data[i]))
            .attr("r", 4) // Radius for the bullet
            .attr("fill", color)
            .on("mouseover", (event, d) => {
                i = 0 ;
                index = 0
                for (i = 0 ; i < pm10.length;i++){
                    if (pm10[i]==d)
                        index = i
                }
                console.log(index)
                const tooltipData = {
                    pm10: pm10[index],
                    pm2_5: pm2_5[index],
                    time: times[index]
                };

                if (!tooltipData.time) {
                    console.error("Time data is undefined at index " + index);
                    return; // Prevent tooltip display if invalid
                }

                const formattedTime = tooltipData.time.toLocaleString(); // Format the date and time
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`
                    <strong>${formattedTime}</strong><br/>
                    pm10: ${tooltipData.pm10.toFixed(1)} µg/m³<br/>
                    pm2_5: ${tooltipData.pm2_5.toFixed(1)} µg/m³
                `)
                .style("left", `${event.pageX + 10}px`) // Tooltip position
                .style("top", `${event.pageY - 20}px`);
            })
            .on("mouseout", () => {
                tooltip.transition().duration(200).style("opacity", 0); // Hide tooltip on mouse out
            });
    };

    // Plot PM10 and PM2.5 lines with bullets
    plotLineWithBullets(pm10, "orange");
    plotLineWithBullets(pm2_5, "purple");
}

    
    
    


    //fetchAirQualityData(selectedState.value);
    loadAirQualityButton.addEventListener("click", () => {
        const selectedState = stateSelector.value;
        fetchAirQualityData(selectedState);
    });
    fetchAirQualityData(stateSelector.value);
});


function plotBarGraph(stateTemperatures) {
    const svgWidth = 800; // Width of the SVG canvas
    const svgHeight = 400; // Height of the SVG canvas
    const barPadding = 10; // Padding between the bars

    // Clear any existing SVG content in the container to avoid overlapping or duplicate charts
    d3.select("#bar-graph").select("svg").remove();

    // Create a new SVG canvas inside the #bar-graph container
    const svg = d3.select("#bar-graph")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    // Define the scales for the X and Y axes
    const xScale = d3.scaleBand()
        .domain(stateTemperatures.map(d => d.name))
        .range([40, svgWidth - 40])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(stateTemperatures, d => d.avgTemperature)])
        .range([svgHeight - 40, 20]);

    // Create a tooltip div (hidden by default)
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "lightgray")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("opacity", 0); // Start with hidden tooltip

    // Add the X-axis to the SVG canvas
    svg.append("g")
        .attr("transform", `translate(0, ${svgHeight - 40})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Add the Y-axis to the SVG canvas
    svg.append("g")
        .attr("transform", "translate(40, 0)")
        .call(d3.axisLeft(yScale));

    // Add bars to the bar graph with hover events
    svg.selectAll("rect")
        .data(stateTemperatures)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.name))
        .attr("y", d => yScale(d.avgTemperature))
        .attr("width", xScale.bandwidth())
        .attr("height", d => svgHeight - 40 - yScale(d.avgTemperature))
        .attr("fill", "steelblue")
        .on("mouseover", (event, d) => {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9); // Show tooltip with fade-in effect
            tooltip.html(`Average Temperature: ${d.avgTemperature.toFixed(1)} °C`) // Tooltip content
                .style("left", `${event.pageX + 10}px`) // Position tooltip
                .style("top", `${event.pageY - 20}px`); // Position tooltip
        })
        .on("mouseout", () => {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0); // Hide tooltip with fade-out effect
        });
}

function updateStateTemperatureStats(stateTemperatures) {
    // Find the hottest and coldest states
    const hottestState = stateTemperatures.reduce((max, state) => (state.avgTemperature > max.avgTemperature ? state : max), stateTemperatures[0]);
    const coldestState = stateTemperatures.reduce((min, state) => (state.avgTemperature < min.avgTemperature ? state : min), stateTemperatures[0]);

    // Calculate the average temperature across all states
    const totalTemperature = stateTemperatures.reduce((sum, state) => sum + state.avgTemperature, 0);
    const avgTemperature = totalTemperature / stateTemperatures.length;

    // Calculate the temperature range
    const tempRange = hottestState.avgTemperature - coldestState.avgTemperature;

    // Update the placeholders in the HTML
    document.getElementById("hottest-state").textContent = hottestState.name;
    document.getElementById("hottest-temp").textContent = hottestState.avgTemperature.toFixed(1);
    document.getElementById("coldest-state").textContent = coldestState.name;
    document.getElementById("coldest-temp").textContent = coldestState.avgTemperature.toFixed(1);
    document.getElementById("avg-temperature").textContent = avgTemperature.toFixed(1);
    document.getElementById("temp-range").textContent = tempRange.toFixed(1);

    // Update the times of hottest and coldest temperatures (assuming times data is provided)
    document.getElementById("hottest-time").textContent = findTimeOfExtremeTemperature(hottestState);
    document.getElementById("coldest-time").textContent = findTimeOfExtremeTemperature(coldestState);
}

function findTimeOfExtremeTemperature(state) {
    const hourlyData = state.hourlyData; // Get the hourly data

    if (!hourlyData || !hourlyData.temperature_2m || !hourlyData.time) {
        return "Data Unavailable"; // Return default if data is undefined
    }

    const temperatures = hourlyData.temperature_2m;

    const hottestIndex = temperatures.indexOf(Math.max(...temperatures));
    const coldestIndex = temperatures.indexOf(Math.min(...temperatures));

    const getFormattedTime = (index) => {
        if (index === -1) return "Unknown"; // If index is invalid or not found

        const timeString = hourlyData.time[index]; // Get the full time string
        const date = new Date(timeString); // Convert to Date object

        const hours = date.getHours().toString().padStart(2, "0"); // Extract hours
        const minutes = date.getMinutes().toString().padStart(2, "0"); // Extract minutes

        return `${hours}:${minutes}`; // Return in HH:MM format
    };

    const hottestTime = getFormattedTime(hottestIndex);
    const coldestTime = getFormattedTime(coldestIndex);

    // Return the formatted hottest and coldest times
    return hottestTime || coldestTime;
}



