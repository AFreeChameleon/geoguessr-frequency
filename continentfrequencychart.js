import * as ChartJS from 'chart.js';

ChartJS.Chart.register(...ChartJS.registerables)

const chartEl = document.getElementById('continent-frequency').getContext('2d');

const continents = {
    'Africa': [],
    'Asia': [],
    'North America': [],
    'South America': [],
    'Oceania': [],
    'Europe': []
};

export default function(countriesWithFreq) {
    let labels = Object.keys(continents);
    let data = [];
    for (const country of countriesWithFreq) {
        if (country.region === 'Americas') {
            continents['North America'].push(country.frequency);
            continents['South America'].push(country.frequency);
        } else {
            continents[country.region].push(country.frequency);
        }
    }

    for (const region of labels) {
        data.push(continents[region].reduce((partialSum, a) => partialSum + a));
    }

    ChartJS.Chart.defaults.font.size = 14;
    const continentFrequencyChart = new ChartJS.Chart(chartEl, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#CB03DF',
                    '#0086A3',
                    'rgb(72, 52, 226)',
                    '#51E8F2',
                    '#742C38',
                    '#210535'
                ],
                borderColor: 'rgb(255, 255, 255, 0.3)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: '#ffffff',
                    }
                }
            }
        }
    })
}