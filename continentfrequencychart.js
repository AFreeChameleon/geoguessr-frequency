import * as ChartJS from 'chart.js';

ChartJS.Chart.register(...ChartJS.registerables)

const chartEl = document.getElementById('continent-frequency').getContext('2d');

const continents = {
    'africa': [],
    'asia': [],
    'north america': [],
    'south america': [],
    'oceania': [],
    'europe': []
};

export default function(countriesWithFreq) {
    let labels = Object.keys(continents);
    let data = [];
    for (const country of countriesWithFreq) {
        if (country.regionName === 'eurasia') {
            continents['europe'].push(country.frequency);
        } else {
            continents[country.regionName].push(country.frequency);
        }
    }

    for (const region of labels) {
        data.push(continents[region].reduce((partialSum, a) => partialSum + a));
    }

    ChartJS.Chart.defaults.font.size = 14;
    const continentFrequencyChart = new ChartJS.Chart(chartEl, {
        type: 'pie',
        data: {
            labels: labels.map((l) => {
                const words = l.split(' ');
                for (let i = 0; i < words.length; i++) {
                    words[i] = words[i][0].toUpperCase() + words[i].substr(1);
                }
                return words.join(' ')
            }),
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