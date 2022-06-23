import SVGTest from './world.svg';
const chartEl = document.getElementById('heatmap-chart');
const labelEl = document.getElementById('frequency-label-map');
const labelTextEl = document.getElementById('frequency-label-map-text');
const labelNumberEl = document.getElementById('frequency-map');

function getPossibleCountryNames(cf) {
    return [cf.name, ...cf.altSpellings].map((nm) => `path[name="${nm}"], path[class="${nm}"]`).join(',');
}

const endColor = {
    red: 242,
    green: 5,
    blue: 195
}

const startColor = {
    red: 72,
    green: 52,
    blue: 226
}
function getFrequencyColour(percentFade, opacity) {
    let diffRed = endColor.red - startColor.red;
    let diffGreen = endColor.green - startColor.green;
    let diffBlue = endColor.blue - startColor.blue;

    diffRed = (diffRed * percentFade) + startColor.red;
    diffGreen = (diffGreen * percentFade) + startColor.green;
    diffBlue = (diffBlue * percentFade) + startColor.blue;

    return `rgba(${diffRed}, ${diffGreen}, ${diffBlue}, ${opacity})`;
}

export default function(countriesWithFreq) {
    fetch(process.env.NODE_ENV === 'development' ? '/world.svg' : '/assets/world.svg')
    .then((res) => res.text())
    .then((SVGHeatMapImage) => {
        window.addEventListener('scroll', (e) => {
            labelEl.style.display = 'none';
        })
        chartEl.innerHTML = SVGHeatMapImage;
        const highestFrequency = Math.max(...countriesWithFreq.map(c => c.frequency));
        const mapImgEl = document.getElementById('world-map-image');
        const pathElList = document.querySelectorAll("path");
        for (const pathEl of pathElList) {
            pathEl.addEventListener('mousemove', (e) => {
                const mouse = {
                    x: e.clientX,
                    y: e.clientY
                }
                labelEl.style.display = 'block';
                labelEl.style.top = (mouse.y + window.scrollY + 10) + 'px';
                labelEl.style.left = (mouse.x + window.scrollX + 10) + 'px';
                labelTextEl.innerHTML = e.target.className.baseVal || e.target.attributes.name.value;
                labelNumberEl.innerHTML = 0;
                e.target.setAttribute('style', `fill: rgb(72, 52, 226, 1);`);
            });

            pathEl.addEventListener('mouseout', (e) => {
                pathEl.setAttribute('style', `fill: rgb(72, 52, 226, 0.8);`);
                labelEl.style.display = 'none';
            })
        }
        for (let i = 0; i < countriesWithFreq.length; i++) {
            const cf = countriesWithFreq[i];
            const possibleCountryNames = getPossibleCountryNames(cf);
            const countryPaths = document.querySelectorAll(possibleCountryNames);
            if (countryPaths.length) {
                for (let j = 0; j < countryPaths.length; j++) {
                    const countryPath = countryPaths[j];
                    countryPath.setAttribute('orderId', i)
                    countryPath.setAttribute('style', `fill: ${getFrequencyColour(cf.frequency / highestFrequency, 0.8)};`);
                    countryPath.setAttribute('frequency', `${cf.frequency || 0}`);
                    countryPath.addEventListener('mousemove', (e) => {
                        const countryPathGroup = document
                            .querySelectorAll(`path[class="${countryPath.className.baseVal || 'nothing'}"], path[id="${countryPath.id || 'nothing'}"]`);
                        const cpgLength = countryPathGroup.length;
                        for (let j = 0; j < cpgLength; j++) {
                            const cpgI = countryPathGroup[j];
                            cpgI.setAttribute('style', `fill: ${getFrequencyColour(cf.frequency / highestFrequency, 1)};`);
                        }
                        const mouse = {
                            x: e.clientX,
                            y: e.clientY
                        }
                        labelEl.style.display = 'block';
                        labelEl.style.top = (mouse.y + window.scrollY + 10) + 'px';
                        labelEl.style.left = (mouse.x + window.scrollX + 10) + 'px';
                        labelTextEl.innerHTML = e.target.className.baseVal || e.target.attributes.name.value;
                        labelNumberEl.innerHTML = e.target.attributes.frequency.value;
                    });
                    countryPath.addEventListener('mouseout', (e) => {
                        const countryPathGroup = document
                            .querySelectorAll(`path[class="${e.target.className.baseVal || 'nothing'}"], path[id="${e.target.id || 'nothing'}"]`);
                        const cpgLength = countryPathGroup.length;
                        for (let j = 0; j < cpgLength; j++) {
                            const cpgI = countryPathGroup[j];
                            cpgI.setAttribute('style', `fill: ${getFrequencyColour(cf.frequency / highestFrequency, 0.8)};`);
                        }
                        labelEl.style.display = 'none';
                    })
                }
            }
        }
        
    });
}

