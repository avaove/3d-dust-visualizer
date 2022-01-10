import './style.css';
import * as THREE from 'three';
import { data } from './dust.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import * as dat from 'dat.gui';
import colormap from 'colormap';

/*
The Xgrid is sorted based on x values, the cut is made on the x plane only for now
The positions are cut based on percentage 0-100 and the colors and sizes are cut the same way.
A copy of all pos/colors are kept.
*/

let container; 
let camera, scene, renderer, controls, gui, points, axes;
let geometry, material;
const particles = data["pos"].length;
let positionsFull = [];
let colorsFull = [];

let plasmaColors = colormap({
  colormap: 'plasma',
  nshades: 20,
  format: 'rba',
  alpha: 1
})
console.log(plasmaColors)

console.log(data["pos"].length, data["logdust"].length)
var settings = {
  animation: '',
  amountToCut: 0,
}

init();
animate();


function initGui() {
  gui = new dat.GUI();
  gui.add(settings, 'animation', { None: '', Spin: 'spin' })
    .onChange(anim => {
        if (!settings.animation) { // Start animating, if not currently animating.
            requestAnimationFrame(render);
        }
        settings.animation = anim;
    });
  gui.add(settings, 'amountToCut', 0, 100)
    .onChange(p => {
        geometry.dispose();
        geometry = new THREE.BufferGeometry();
        scene.remove(points);

        //take percentage of points
        var cutInd = Math.floor(positionsFull.length * (settings.amountToCut * 0.01)); //*3 since counting x, y, z and r,g,b
        cutInd += 3 - (Math.floor(positionsFull.length * (settings.amountToCut * 0.01)) % 3);

        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positionsFull.slice(cutInd), 3 ) );
        geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colorsFull.slice(cutInd), 3 ) );
        geometry.computeBoundingSphere();

        points = new THREE.Points(geometry, material);
        scene.add(points);
    
        if (!settings.animation) {
            render();
        }
    });
  
}


function initPoints() {
  const color = new THREE.Color();
  const n = 50, n2 = n / 2; // particles spread in the cube, center the cube to origin
  geometry = new THREE.BufferGeometry();
  
  const maxdust = Math.max.apply(Math, data["logdust"]);
  const mindust = Math.min.apply(Math, data["logdust"]);
  for ( let i = 0; i < particles; i ++ ) {

    const x = data["pos"][i][0] * n; 
    const y = data["pos"][i][1] * n; 
    const z = data["pos"][i][2] * n; 
    positionsFull.push( x, y, z );
    
    var colorInd = Math.floor(normalize(data["logdust"][i], mindust, maxdust) * plasmaColors.length);
    if (colorInd >= plasmaColors.length) {colorInd = plasmaColors.length - 1}
    const vx = normalize(plasmaColors[colorInd][0], 0, 255);
    const vy = normalize(plasmaColors[colorInd][1], 0, 255);
    const vz = normalize(plasmaColors[colorInd][2], 0, 255);
    
    color.setRGB( vx, vy, vz );
    colorsFull.push( vx, vy, vz );
  }
  // console.log(Math.max.apply(Math, xx), Math.min.apply(Math, xx));
  
  geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positionsFull, 3 ) );
  geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colorsFull, 3 ) );
  geometry.computeBoundingSphere();

  material = new THREE.PointsMaterial( { size: 15, vertexColors: true } );

  points = new THREE.Points( geometry, material );

  axes = new THREE.AxesHelper( 500 );

  scene.add( points );
  scene.add( axes );
}

function init() {

  container = document.getElementById( 'container' );

  camera = new THREE.PerspectiveCamera( 27, window.innerWidth / window.innerHeight, 5, 3500 );
  camera.position.z = 1000;

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x050505 );
  scene.fog = new THREE.Fog( 0x050505, 500, 2000 );

  initGui();
  initPoints();
  
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );

  container.appendChild( renderer.domElement );

  controls = new TrackballControls( camera, renderer.domElement );
  controls.target.set( 0, 0, 0 );

  window.addEventListener( 'resize', onWindowResize );
}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {
  requestAnimationFrame( animate );
  controls.update();
  render();
}

function render() {
  if (settings.animation) {
    const time = Date.now() * 0.001; //truly random
    points.rotation.x = time * 0.25;
    points.rotation.y = time * 0.5;
  }
  
  renderer.render( scene, camera );
}

function normalize(val, min, max) { return (val - min) / (max - min); }