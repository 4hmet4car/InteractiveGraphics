import GUI from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js' // Presentation 2
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
// import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
// import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
// import { RenderPixelatedPass } from 'three/examples/jsm/postprocessing/RenderPixelatedPass.js'
// import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
// import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js'
import gsap from 'gsap'

/**
 * Base
 */
// Debug
// Presentation 3
const gui = new GUI({
    width: 400,
}).hide()
const parameters = {}
parameters.orthographicScale = 15
parameters.parallax = 1
parameters.velocity = 30
parameters.speedMultiplier = 0.95
parameters.pixelSize = 3
parameters.whiteCarWeight = 0.75
parameters.cameraX = -32
parameters.cameraY = 28
parameters.cameraZ = 38

gui.add(parameters,'parallax').min(0).max(20).step(0.1)
gui.add(parameters,'speedMultiplier').min(0.75).max(0.99).step(0.01)
gui
    .add(parameters,'pixelSize')
    .min(1)
    .max(10)
    .step(1)
    .onChange(()=>{
        renderer.setSize(sizes.width / parameters.pixelSize, sizes.height / parameters.pixelSize)
        renderer.domElement.style.width = '100%'
        renderer.domElement.style.height = '100%'
    })

// Toggle the GUI
window.addEventListener('keydown', (event)=>{
    if(event.key == 'h'){
        gui.show(gui._hidden)
    }
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
const loadingScreen = document.querySelector('.loading-screen')
const loadingBar =  document.getElementById('loading-bar')

// Presentation 1
// Loading manager
const manager = new THREE.LoadingManager()
manager.onStart = function ( url, itemsLoaded, itemsTotal ) {
	console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' )
}

manager.onLoad = function ( ) {
	console.log( 'Loading complete!')
    setTimeout(()=>{loadingScreen.style.opacity = 0},2000)
    setTimeout(()=>{loadingScreen.style.display = 'none'},2500)
}

manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
	console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' )
    const progressRatio = itemsLoaded / itemsTotal
    loadingBar.style.transform = `scaleX(${progressRatio})`
}

manager.onError = function ( url ) {
	console.log( 'There was an error loading ' + url )
}

// Presentation 2
// Texture loader
const textureLoader = new THREE.TextureLoader(manager)

// Draco loader
const dracoLoader = new DRACOLoader(manager)
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader(manager)
gltfLoader.setDRACOLoader(dracoLoader)

// Audio
const correct = new Audio('./correct.wav')
const wrong = new Audio('./wrong.wav')
const start = new Audio('./start.wav')
const fail = new Audio('./fail.wav')

/**
 * Textures
 */
const environmentUV = textureLoader.load('./bakedEnvTextureToonMagenta.jpg')
environmentUV.colorSpace = THREE.SRGBColorSpace
environmentUV.flipY = false
environmentUV.generateMipmaps = false
environmentUV.minFilter = THREE.NearestFilter
environmentUV.magFilter = THREE.NearestFilter

const carTextures = {}
for (let i = 1; i < 4; i++) {
    carTextures[i - 1] = textureLoader.load('./CarUV' + i + '.jpg')
    carTextures[i - 1].colorSpace = THREE.SRGBColorSpace
    carTextures[i - 1].flipY = false
    carTextures[i - 1].generateMipmaps = false
    carTextures[i - 1].minFilter = THREE.NearestFilter
    carTextures[i - 1].magFilter = THREE.NearestFilter
}

const gradientTexture = textureLoader.load('3.jpg')
gradientTexture.generateMipmaps = false
gradientTexture.minFilter = THREE.NearestFilter
gradientTexture.magFilter = THREE.NearestFilter

/**
 * Materials
 */
const environmentMaterial = new THREE.MeshToonMaterial({
    transparent: true,
    map: environmentUV,
    gradientMap: gradientTexture,
    side: THREE.DoubleSide,
})

const carMaterial = new THREE.MeshToonMaterial({
    map: carTextures[0],
    gradientMap: gradientTexture,
})

/**
 * Models
 */

const models = {}

let carMove = null
let carZigZag = null

gltfLoader.load('./BeyazTorosSceneTorosBakedOptimized.glb', (gltf) =>{
    
    const chilren = [...gltf.scene.children]

    for(const child of chilren){
        if(child.name === 'environment' || child.name === 'floor'){
            child.material = environmentMaterial
        }else{
            child.material = carMaterial
        }
        models[child.name] = child
    }

    models.environment.castShadow = true
    models.environment.receiveShadow = true
    models.car.castShadow = true
    // models.frontWheels.castShadow = true
    // models.rearWheels.castShadow = true
    models.floor.receiveShadow = true
    
    for(const model in models){
        // console.log(models[model])
        scene.add(models[model])
    }

    models.car.attach(models.rearWheels)
    models.car.attach(models.frontWheels)
    
    carMove = gsap.fromTo(
        models.car.position,
        {
            z: (-85/2) / (16/9) * aspect - 7
        },
        {
            z: (85/2) / (16/9) * aspect + 7, // 7 is the car length, 16/9 is standart aspect used for normalization
            duration: (85 / (16/9) * aspect + 14) / parameters.velocity, // Distance / Velocity
            ease: 'none',
            repeat: -1,
            onRepeat: whiteChecker,
        })
    carZigZag = gsap.fromTo(
        models.car.position,
        {
            x: -2
        },
        {   x: 2,
            duration: 3,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
        })

})

// Presentation 6
/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

let aspect = sizes.width / sizes.height
let left = -aspect * parameters.orthographicScale
let right = aspect * parameters.orthographicScale
let top = 1 * parameters.orthographicScale
let bottom = -1 * parameters.orthographicScale

window.addEventListener('resize', () =>
{
    if(!gameActivated){
        resizeHandler()
    }else{
        instructions.innerHTML = 'restart the game!'
        button.innerHTML = 'restart'
        startScreen.style.display = 'flex'
        time.innerHTML = 'time: 0'
        gameActivated = false

        resizeHandler()
    }
})

const resizeHandler = ()=>{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    aspect = sizes.width / sizes.height
    left = -aspect * parameters.orthographicScale
    right = aspect * parameters.orthographicScale
    camera.left = left
    camera.right = right
    camera.updateProjectionMatrix()
    /**
     * Since the left and right frustrum planes
     * are normalized using the height, there is no
     * need to update top and bottom planes, they are always 1
     */

    carMove.kill()
    carMove = gsap.fromTo(
        models.car.position,
        {
            z: (-85/2) / (16/9) * aspect - 7
        },
        {
            z: (85/2) / (16/9) * aspect + 7, // 7 is the car length, 16/9 is standart aspect
            duration: (85 / (16/9) * aspect + 14) / parameters.velocity, // Distance / Velocity
            ease: 'none',
            repeat: -1,
            onRepeat: whiteChecker,
        })

    // Update renderer
    renderer.setSize(sizes.width / parameters.pixelSize, sizes.height / parameters.pixelSize)
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.setPixelRatio(1)

    // // // Update effectComposer
    // effectComposer.setSize(sizes.width, sizes.height)
    // effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

gui
    .add(parameters,'orthographicScale')
    .min(1)
    .max(100)
    .step(1)
    .onChange(()=>{
        camera.left = -aspect * parameters.orthographicScale
        camera.right = aspect * parameters.orthographicScale
        camera.top = 1 * parameters.orthographicScale
        camera.bottom = -1 * parameters.orthographicScale
        camera.updateProjectionMatrix()
    })

/**
 * Game Logic and Interactions
 */
// Weighted random
function weightedRandom(weight) {
    const rand = Math.random();
    
    if (rand < weight) {
        return 0;
    }
    else if (rand < weight + (1-weight)/2) {
        return 1;
    }
    else {
        return 2;
    }
}

// Presentation 7
// DOM elements
const button = document.getElementById('button')
const startScreen = document.getElementById('start')
const time = document.getElementById("time")
const life = document.getElementById("life")
const instructions = document.getElementById("instructions")

let gameActivated = false

button.addEventListener('click', ()=>{
    start.play()
    carMove.duration((85 / (16/9) * aspect + 14) / parameters.velocity)
    carMove.restart()
    startTime = elapsedTime
    gameActivated = true
    lifes = 5
    startScreen.style.display = 'none'
    time.style.display = 'flex'
})

let lifes = 5

const whiteChecker = () =>
{
    if(gameActivated && lifes > 1){
        if(models.car.material.map === carTextures[0]){
            wrong.currentTime = 0
            wrong.play()
            lifes -= 1
            gsap.fromTo(camera.position, {x: camera.position.x -1}, {x: camera.position.x, duration:0.4, ease: 'bounce'})
        }
    }else if(gameActivated && lifes === 1){
        if(models.car.material.map === carTextures[0]){
            fail.play()
            lifes -= 1
            gsap.fromTo(camera.position, {x: camera.position.x -1}, {x: camera.position.x, duration:0.4, ease: 'bounce'})
        }
    }
    models.car.material.map = carTextures[weightedRandom(parameters.whiteCarWeight)]
}

// Raycaster and mouse events
const raycaster = new THREE.Raycaster()

const mouse = new THREE.Vector2()

window.addEventListener('pointerdown', (event)=>{
    mouse.x =  event.clientX / sizes.width * 2 - 1
    mouse.y =  - event.clientY / sizes.height * 2 + 1

    // Cast a ray
    raycaster.setFromCamera(mouse, camera)

    // Test intersect
    if(gameActivated && Object.keys(models).length == 5){
        const intersect = raycaster.intersectObject(models.car)
        if(intersect.length){
            if(models.car.material.map !== carTextures[0]  &&  lifes > 1){
                wrong.currentTime = 0
                wrong.play()
                lifes -= 1
                gsap.fromTo(camera.position, {x: camera.position.x -1}, {x: camera.position.x, duration:0.4, ease: 'bounce'})
            }else if(models.car.material.map !== carTextures[0]  &&  lifes === 1){
                fail.play()
                lifes -= 1
                gsap.fromTo(camera.position, {x: camera.position.x -1}, {x: camera.position.x, duration:0.4, ease: 'bounce'})
            }
            else{
                correct.currentTime = 0
                correct.play()
            }
            models.car.material.map = carTextures[weightedRandom(parameters.whiteCarWeight)]
            carMove.restart()
            carMove.duration(carMove.duration()* parameters.speedMultiplier)
        }
    }
})

// Presentation 4
// Parallax mouse event if the device is not mobile using regex
const userAgent = navigator.userAgent.toLowerCase()
const isMobile = /iphone|ipod|android|blackberry|windows phone|opera mini|mobile/i.test(userAgent)

const cursorPosition = {}
cursorPosition.x = 0
cursorPosition.y = 0

if(!isMobile){
    window.addEventListener('mousemove', (event)=>
        {
            cursorPosition.x = event.clientX / sizes.width - 0.5
            cursorPosition.y = event.clientY / sizes.height - 0.5
        })
}

/**
 * Camera
 */
// Group
const cameraGroup = new THREE.Group()
scene.add(cameraGroup)

// Base camera
const camera = new THREE.OrthographicCamera(left , right, top , bottom , 0.1, 120)
camera.position.x = parameters.cameraX
camera.position.y = parameters.cameraY
camera.position.z = parameters.cameraZ
cameraGroup.add(camera)

gui.add(camera.position,'x').min(-100).max(100).step(0.001).name('CameraX')
gui.add(camera.position,'y').min(-100).max(100).step(0.001).name('CameraY')
gui.add(camera.position,'z').min(-100).max(100).step(0.001).name('CameraZ')

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.enabled = false
gui.add(controls,'enabled').name('enableControls')

/**
 * Lights
 */
// Ambient Light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
scene.add(ambientLight)
gui.add(ambientLight, 'intensity').min(0).max(2).step(0.001).name('Ambient Intensity')

// Spot Light
const spotLight = new THREE.SpotLight()
spotLight.intensity = 21000
gui.add(spotLight, 'intensity').min(0).max(70000).step(0.001).name('Spot Intensity')
spotLight.distance = 90
spotLight.angle = Math.PI * 0.236
spotLight.castShadow = true
spotLight.position.x = 21
spotLight.position.y = 46
spotLight.position.z = 40
scene.add(spotLight)

spotLight.shadow.mapSize.x = 1024 * 4
spotLight.shadow.mapSize.y = 1024 * 4

spotLight.shadow.camera.near = 20
spotLight.shadow.camera.far = 100

spotLight.shadow.bias = -0.0005
spotLight.shadow.normalBias = -0.0233

spotLight.shadow.radius = 1
spotLight.shadow.focus = 1

gui.add(spotLight.shadow,'bias').min(-0.5).max(0.5).step(0.0001)
gui.add(spotLight.shadow,'normalBias').min(-0.5).max(0.5).step(0.0001)

const spotLightCameraHelper = new THREE.CameraHelper(spotLight.shadow.camera)
spotLightCameraHelper.visible = false
gui.add(spotLightCameraHelper, 'visible').name('Spot Helper Visible')
scene.add(spotLightCameraHelper)

gui.add(spotLight.position,'x').min(-100).max(100).step(0.001).name('LightX')
gui.add(spotLight.position,'y').min(-100).max(100).step(0.001).name('LightY')
gui.add(spotLight.position,'z').min(-100).max(100).step(0.001).name('LightZ')
gui.add(spotLight,'angle').min(0).max(Math.PI * 0.5)
gui.add(spotLight.shadow,'focus').min(0).max(1).onChange(()=>{spotLightCameraHelper.update()})

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: false,
    alpha: true
})
renderer.setSize(sizes.width / parameters.pixelSize, sizes.height / parameters.pixelSize)
renderer.domElement.style.width = '100%'
renderer.domElement.style.height = '100%'
renderer.setPixelRatio(1)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

// /**
//  * Post-Processing
//  */
// const effectComposer = new EffectComposer(renderer)
// effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
// effectComposer.setSize(sizes.width, sizes.height)

// const renderPass = new RenderPass(scene,camera)
// effectComposer.addPass(renderPass)

// const renderPixelatedPass = new RenderPixelatedPass(6,scene,camera)
// renderPixelatedPass.normalEdgeStrength = 0
// renderPixelatedPass.depthEdgeStrength = 0
// renderPixelatedPass.pixelSize = 3
// renderPixelatedPass.enabled = true
// effectComposer.addPass(renderPixelatedPass)

// gui
//     .add(renderPixelatedPass,'enabled')
//     .name('renderPixelated')
//     .onChange(
//         ()=>{
//             if(renderPixelatedPass.enabled)
//             {
//                 pixelSize.show()
//                 normalEdgeStrength.show()
//                 depthEdgeStrength.show()
//             }
//             else
//             {
//                 pixelSize.hide()
//                 normalEdgeStrength.hide()
//                 depthEdgeStrength.hide()
//             }
//         }
//     )
// const params = { pixelSize: 3, normalEdgeStrength: .3, depthEdgeStrength: .4, pixelAlignedPanning: true }
// const pixelSize = gui.add( params, 'pixelSize' ).min( 1 ).max( 16 ).step( 1 )
//                      .onChange( () => {
//                          renderPixelatedPass.setPixelSize( params.pixelSize )
//                      } )
// const normalEdgeStrength = gui.add( renderPixelatedPass, 'normalEdgeStrength' ).min( 0 ).max( 2 ).step( .05 )
// const depthEdgeStrength = gui.add( renderPixelatedPass, 'depthEdgeStrength' ).min( 0 ).max( 1 ).step( .05 )

// const gammaCorrection = new ShaderPass(GammaCorrectionShader)
// effectComposer.addPass(gammaCorrection)

/**
 * Animate
 */
const clock = new THREE.Clock()

let elapsedTime = 0
let startTime = 0
let score = 0

const tick = () =>
{
    elapsedTime = clock.getElapsedTime()

    if(gameActivated && lifes >= 1){
        score = (elapsedTime - startTime).toFixed(2)
        time.innerHTML = 'time: ' + score
    }
    
    if(lifes >= 0){
        life.innerHTML = "♥️".repeat(lifes)
    }

    if(lifes === 0){
        instructions.innerHTML = 'you lasted<br>' + score + ' seconds<br>you can do better!'
        button.innerHTML = 'restart'
        startScreen.style.display = 'flex'
        time.style.display = 'none'
        gameActivated = false
    }

    // Presentation 4
    // Parallax
    const parallaxX = cursorPosition.x
    const parallaxY = - cursorPosition.y
    
    cameraGroup.position.x = parallaxX * parameters.parallax
    cameraGroup.position.y = parallaxY * parameters.parallax

    // Update controls
    controls.update()

    // Presentation 5
    // Rotate the wheels and change the color
    if(Object.keys(models).length == 5){
        models.rearWheels.rotation.y = - elapsedTime * Math.PI * 2
        models.frontWheels.rotation.y = - elapsedTime * Math.PI * 2
        if(!gameActivated && Object.keys(carTextures).length == 3){
            models.car.material.map = carTextures[Math.floor((elapsedTime*3)%3)]
        }
    }

    // Render
    renderer.render(scene, camera)
    // effectComposer.render()

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()