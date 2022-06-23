import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import ThreeGlobe from 'three-globe';
import axios from 'axios';
import gsap from 'gsap';

import countries from './countries.json';
import countryBoundaries from './country_boundaries.json'
import { HemisphereLight } from 'three';
import { DirectionalLight } from 'three';
import { Color } from 'three';

import HeatmapChart from './svgheatmap';
import ContinentFrequencyChart from './continentfrequencychart';

const canvasEl = document.getElementById('app');

let mouse = {
  x: 0,
  y: 0,
  down: false,
  xPrev: 0,
  yPrev: 0,
  clientX: 0,
  clientY: 0
};

async function getCountryFrequencies() {
  const res = await axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${import.meta.env.VITE_GOOGLE_SPREADSHEET_KEY}/values/A%3AZ?key=${import.meta.env.VITE_GOOGLE_API_KEY}`);
  const values = res.data.values.map((v) => {
    const countryName = v[0];
    if (countryName) {
      const idx = countries.findIndex(c => c.name === countryName || c.altSpellings.indexOf(countryName) !== -1);
      if (idx !== -1) {
        return {
          ...countries[idx],
          frequency: v[1] === "" ? 0 : Number(v[1])
        }
      }
    }
    return 0;
  });
  return values.filter(v => v);
}

function addEventListeners({ innerHeight, innerWidth, renderer, Globe, camera }) {

  renderer.domElement.addEventListener('mousemove', (event) => {
    const offset = renderer.domElement.getBoundingClientRect().top;
    mouse.x = (event.clientX / innerWidth) * 2 - 1;
    mouse.y = -((event.clientY - offset) / innerHeight) * 2 + 1;
    mouse.clientX = event.clientX;
    mouse.clientY = event.clientY;

    if (mouse.down) {
      event.preventDefault();
      const deltaX = event.clientX - mouse.xPrev;
      const deltaY = event.clientY - mouse.yPrev;
      Globe.rotation.offset.x += deltaY * 0.005;
      Globe.rotation.offset.y += deltaX * 0.005;
      gsap.to(Globe.rotation, {
        y: Globe.rotation.offset.y,
        x: Globe.rotation.offset.x,
        duration: 2
      });
  
      mouse.xPrev = event.clientX;
      mouse.yPrev = event.clientY;
    }
  });
  
  renderer.domElement.addEventListener('mouseup', (event) => {
    mouse.down = false;
  });

  renderer.domElement.addEventListener('mousedown', ({ clientX, clientY }) => {
    mouse.down = true;
    mouse.xPrev = clientX;
    mouse.yPrev = clientY;
});
}

const main = async () => {
  const labelDOM = document.getElementById('frequency-label');
  const labelTextDOM = document.getElementById('frequency-label-text');
  const labelFrequencyDOM = document.getElementById('frequency');
  const countriesWithFreq = await getCountryFrequencies();
  const group = new THREE.Group();
  HeatmapChart(countriesWithFreq);
  ContinentFrequencyChart(countriesWithFreq);
  const Globe = new ThreeGlobe()
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
    .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
    .polygonsData(countryBoundaries.features.filter(d => d.properties.ISO_A2 !== 'AQ').map(d => {
      const countryData = countriesWithFreq.find(cf => cf && (
        cf.name === d.properties.NAME_LONG || 
        cf.name === d.properties.NAME || 
        cf.altSpellings.includes(d.properties.NAME) || 
        cf.altSpellings.includes(d.properties.NAME_LONG)
      ));
      return { 
        ...d, 
        properties: {
          ...d.properties,
          frequency: countryData ? countryData.frequency : 0,
        }
      }
    } ))
    .polygonCapColor(() => 'rgba(99,75,209,0.7)')
    .polygonSideColor(() => 'rgba(72,3,85,0.2)')
    .polygonStrokeColor(() => '#111')
    .onGlobeReady(() => {
      setTimeout(() => {
          Globe.polygonAltitude((c) => {
          const highestFrequency = Math.max(...countriesWithFreq.map(c => c.frequency))
          const selectedCountry = countriesWithFreq.find(cf => cf.name === c.properties.NAME);
          if (selectedCountry && selectedCountry.frequency) {
            return (selectedCountry.frequency / highestFrequency) / 1.5;
          }
          return 0.01;
          
        });
        document.getElementById('loading-screen').style.display = 'none';
      }, 100);
    }).showGraticules(true);

  Globe.rotation.offset = {
    x: 0,
    y: 0
  };

  console.log(Globe.children)



  // Setup renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('app').appendChild(renderer.domElement);

  // Setup scene
  const scene = new THREE.Scene();
  scene.background = new Color(0x050D21);
  group.add(Globe);
  scene.add(Globe);
  scene.add(new THREE.AmbientLight(0xbbbbbb));
  scene.add(new THREE.DirectionalLight(0xffffff, 0.6));

  const raycaster = new THREE.Raycaster();

  // Setup camera
  let camera = new THREE.PerspectiveCamera(
    75,
    renderer.domElement.offsetWidth / renderer.domElement.offsetHeight,
    0.1,
    1000
  );
  // camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  camera.position.z = 250;
  camera.position.y = 25;

  addEventListener('resize', () => {
    console.log('resized')
    renderer.setSize(canvasEl.offsetWidth, canvasEl.offsetHeight);
    camera = new THREE.PerspectiveCamera(
      75,
      canvasEl.offsetWidth / canvasEl.offsetHeight,
      0.1,
      1000
    );

    camera.position.z = 250;
    camera.position.y = 25;
  })

  // Add camera controls
  // const tbControls = new OrbitControls(camera, renderer.domElement);
  // tbControls.enablePan = false;
  // tbControls.minDistance = 101;
  // tbControls.zoomSpeed = 0.8;
  // tbControls.update();

  const hemiLight = new HemisphereLight(0x0dadf2, 0xf205c3, 2.0);
  scene.add(hemiLight);

  const topLight = new DirectionalLight(0x0dadf2, 1.0);
  topLight.position.set(10, 10, 0);
  topLight.target.position.set(0, 0, 0);

  scene.add(topLight);


  addEventListeners({ innerHeight, innerWidth, renderer, Globe, camera });

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(10, 50, 50),
    new THREE.ShaderMaterial({
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    })
  );
  atmosphere.scale.set(1.1, 1.1, 1.1);

  // Stars
  const starGeometry = new THREE.BufferGeometry();
  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff
  });

  const starVertices = [];
  for (let i = 0; i < 10000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = -Math.random() * 5000;
    starVertices.push(x, y, z);
  }

  starGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(starVertices, 3)
  );

  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(atmosphere);
  scene.add(stars);




  // Kick-off renderer
  let parentPolygon;
  let countryCoordinates = [];
  let addedScrollListener = false;

  (function animate() {
    requestAnimationFrame(animate);
    // Frame cycle

    raycaster.setFromCamera(mouse, camera);

    if (!addedScrollListener) {
      window.addEventListener('scroll', (e) => {
        addedScrollListener = true;
        const offset = renderer.domElement.getBoundingClientRect().top;
        mouse.x = ((mouse.clientX + window.scrollX) / innerWidth) * 2 - 1;
        mouse.y = -(((mouse.clientY + window.scrollY) - offset) / innerHeight) * 2 + 1;
        mouse.clientX = (mouse.clientX + window.scrollX);
        mouse.clientY = (mouse.clientY + window.scrollY);
      });
    }

    const intersects = raycaster.intersectObjects(
      Globe.children[0].children.filter((mesh) => {
        return mesh.type === 'Group';
      })
    );
    
    if (intersects.length > 0 && intersects[0].object.parent && intersects[0].object.parent.__data && (mouse.clientX && mouse.clientY)) {
      if ((parentPolygon && countryCoordinates && countryCoordinates.length > 0) && parentPolygon !== intersects[0].object.parent) {
        for (const boundary of countryCoordinates) {
          boundary.children[0].material[0].color.setHex(0x480355);
          boundary.children[0].material[1].color.setHex(0x634BD1);
        }
      }
      parentPolygon = intersects[0].object.parent;
      countryCoordinates = parentPolygon.parent.children.filter(c => c.__data.data.properties.NAME === parentPolygon.__data.data.properties.NAME);
      const intersectedProperties = parentPolygon.__data.data.properties;
      for (const boundary of countryCoordinates) {
        boundary.children[0].material[0].color.setHex(0xffffff);
        boundary.children[0].material[1].color.setHex(0xf205c3);
      }
      // console.log('create label')
      // Create label
      labelDOM.style.display = 'block';
      labelDOM.style.top = (mouse.clientY + window.scrollY + 10) + 'px';
      labelDOM.style.left = (mouse.clientX + window.scrollX + 10) + 'px';
      labelTextDOM.innerHTML = intersectedProperties.NAME_LONG;
      labelFrequencyDOM.innerHTML = intersectedProperties.frequency.toString();
    } else {
      if (labelDOM.style.display === 'block') {
        labelDOM.style.display = 'none';
        if (parentPolygon && countryCoordinates &&  countryCoordinates.length > 0) {
          for (const boundary of countryCoordinates) {
            boundary.children[0].material[0].color.setHex(0x480355);
            boundary.children[0].material[1].color.setHex(0x634BD1);
          }
          parentPolygon = null;
          countryCoordinates = [];
        }
      }
    }

    renderer.render(scene, camera);
  })();
}

main();
