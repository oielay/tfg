import * as THREE from 'three';
import * as ThreeMeshUI from 'three-mesh-ui';

import { BoxLineGeometry } from 'three/addons/jsm/geometries/BoxLineGeometry.js';
import { OrbitControls } from 'three/addons/jsm/controls/OrbitControls.js';
import { DeviceOrientationControls } from './deviceOrientationControls.js';

// Variables

let scene, camera, renderer, controls;
let objsToIntersect = [], objsToOverflow = [], textPanels = [];
let joystickData = { x: 0, y: 0 };
let interactionType = window.location.search.substring(1).split("&").find(param => param.includes('interaction=')).split('=')[1];

// Obtain content from wordpress page

let newContent = content.map((post) => JSON.parse(JSON.stringify(extractContent(post['content']), null, 2)).flat());
let titles = content.map((post) => post['title']);

newContent, titles = shuffleArrays(newContent, titles);

function shuffleArrays(array, array2) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
        [array2[i], array2[j]] = [array2[j], array2[i]];
    }
    return array, array2;
}

// Set page height and width

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

// Set constants

const TITLE_HEIGHT = 0.35;
const DASHBOARD_HEIGHT = 1;
const DASHBOARD_WIDTH = 1.5;
const IMAGE_HEIGHT = 1;
const IMAGE_WIDTH = 1;            
const CAPTION_HEIGHT = 0.1;
const CAPTION_WIDTH = 0.375;
const MARGIN = 0.025;
const PADDING = 0.025;

// Other variables for panel movement

var clock = new THREE.Clock();
var isPaused = false;
var isAnyPanelStopped = false;
let stoppedCircle = -1;
let stoppedPanel = -1;
const postsPerCircle = 4;
const baseRadius = 5;
const radiusIncrement = 5;
const circleSpeeds = [];
for (let i = 0; i < newContent.length; i++) {
    const speed = Math.random();
    circleSpeeds.push(speed);
}

// Set font

const fontTexture = 'https://oierlayana.com/tfg/wp-content/uploads/fonts/Roboto-msdf.png';
const fontJSON = 'https://oierlayana.com/tfg/wp-content/uploads/fonts/Roboto-msdf.json';

// TASKS

let userStudyTasks = {
    numberOfClicks: 0,
    numberOfInteractions: 0,
    numberOfLikesInOneMinute: 0,
    timeSpentForJuramentada: 0,
    timeSpentForSixgon: 0,
    timeSpentForTostadora: 0,
};

window.addEventListener('beforeunload', function() {
    //sendData();
});

function sendData() {
    const data = JSON.stringify({ userStudyTasks });
    const url = 'https://oierlayana.com/tfg/wp-content/plugins/plugin-tfg/tasks.php';

    navigator.sendBeacon(url, data);
}

// Interaction and listeners

const raycaster = new THREE.Raycaster();

const mouse = new THREE.Vector2();
mouse.x = mouse.y = null;

let selectState = false;

window.addEventListener( 'pointermove', ( event ) => {
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;
} );

window.addEventListener( 'touchmove', ( event ) => {
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;
} );

window.addEventListener( 'pointerdown', () => {
    selectState = true;
} );

window.addEventListener( 'touchstart', () => {
    selectState = true;
} );

window.addEventListener( 'pointerup', () => {
    selectState = false;
} );

window.addEventListener( 'touchend', () => {
    selectState = false;
} );

window.addEventListener('load', init);
window.addEventListener('resize', onWindowResize);

window.addEventListener('click', () => {
    userStudyTasks.numberOfClicks++;
});

window.addEventListener('touchstart', () => {
    userStudyTasks.numberOfClicks++;
});

//

function init() {
    // SCENE

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x505050);

    // CAMERA

    camera = new THREE.PerspectiveCamera(60, WIDTH / HEIGHT, 0.1, 100);
    camera.position.set(0, 0, 0);

    // RENDERER

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(WIDTH, HEIGHT);
    renderer.localClippingEnabled = true;
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);

    // ROOM

    const room = new THREE.LineSegments(
        new BoxLineGeometry(100, 100, 100, 10, 10, 10).translate(0, 5, 0),
        new THREE.LineBasicMaterial({ color: 0x808080 })
    );

    const roomMesh = new THREE.Mesh(
        new THREE.BoxGeometry(100, 100, 100, 100, 100, 100).translate(0, 5, 0),
        new THREE.MeshBasicMaterial({ side: THREE.BackSide })
    );

    scene.add(room);
    objsToIntersect.push(roomMesh);

    // CONTROLS

    if (interactionType === 'orbitControls') {
        controls = new OrbitControls(camera, renderer.domElement);
        controls.target = new THREE.Vector3(3, 0, 0);
        controls.enableZoom = false;
        controls.screenSpacePanning = false;
        controls.panSpeed = 2;
    } else if (interactionType === 'deviceOrientationControls') {
        controls = new DeviceOrientationControls(camera);
        createMovingControls();
    }

    // TEXT PANELS FOR CONTENT
    
    for (let i = 0; i < newContent.length; i++) {
        let panel = makeTextPanel(newContent[i], titles[i], i, newContent.length);
        textPanels.push(panel);
        objsToIntersect.push(panel);
    }

    renderer.setAnimationLoop(loop);
}

//

function makeTextPanel(content, title, pos_i, totalPosts) {
    const container = new ThreeMeshUI.Block({
        ref: 'container',
        padding: PADDING,
        fontFamily: fontJSON,
        fontTexture: fontTexture,
        fontColor: new THREE.Color(0xffffff),
        backgroundOpacity: 0,
    });

    const postSpacing = 2.5;
    const cameraOffset = (totalPosts % 2 === 0) ? (postSpacing / 2) : 0;
    const containerX = (pos_i - Math.floor(totalPosts / 2)) * postSpacing + cameraOffset;
    
    container.position.set(containerX, 3, -1.8);
    
    container.rotation.x = -0.55;
    scene.add(container);

    let imgWidth = 0;
    let imgExists = false;
    let linkExists = false;
    let textExists = false;

    content.forEach((item) => {
        if (item.tag === 'img') {
            imgExists = true;
        } else if (item.tag === 'a') {
            linkExists = true;
        } else {
            textExists = true;
        }
    });

    if (title.length > 0) {

        const titleBlock = new ThreeMeshUI.Block({
            height: TITLE_HEIGHT,
            width: DASHBOARD_WIDTH,
            justifyContent: 'center',
            fontSize: 0.15,
        });

        titleBlock.add(
            new ThreeMeshUI.Text({
                content: normalizeText(title),
            })
        );

        container.add(titleBlock);
    }

    if (imgExists || linkExists || textExists) {
        const contentContainer = new ThreeMeshUI.Block({
            contentDirection: 'row',
            padding: PADDING,
            margin: MARGIN,
            backgroundOpacity: 0,
        });

        if (imgExists) {
            const leftSubBlock = new ThreeMeshUI.Block({
                height: 1.0,
                width: 1.0,
                padding: PADDING,
                margin: MARGIN,
                justifyContent: 'end',
            });

            if (linkExists) {
                const links = content.filter(item => item.tag === 'a');
                const numLinks = links.length;
                
                const captionsBlock = new ThreeMeshUI.Block({
                    height: CAPTION_HEIGHT * Math.ceil(numLinks / 2),
                    width: IMAGE_WIDTH,
                    margin: -0.066 * Math.ceil(numLinks / 2),
                    textAlign: 'center',
                    justifyContent: 'center',
                    backgroundOpacity: 0,
                    contentDirection: 'column',
                });

                for (let i = 0; i < numLinks - numLinks % 2; i += 2) {
                    const captionsSubBlock = new ThreeMeshUI.Block({
                        height: CAPTION_HEIGHT,
                        width: IMAGE_WIDTH,
                        textAlign: 'center',
                        justifyContent: 'center',
                        backgroundOpacity: 0,
                        contentDirection: 'row',
                    });

                    let caption1 = new ThreeMeshUI.Block({
                        height: CAPTION_HEIGHT,
                        width: CAPTION_WIDTH,
                        margin: MARGIN / 10,
                        textAlign: 'center',
                        justifyContent: 'center'
                    });

                    caption1.add(
                        new ThreeMeshUI.Text({
                            content: normalizeText(links[i].text),
                            fontSize: 0.03,
                            fontColor: new THREE.Color(0x0000FF),
                        })
                    );

                    let caption2 = new ThreeMeshUI.Block({
                        height: CAPTION_HEIGHT,
                        width: CAPTION_WIDTH,
                        margin: MARGIN / 10,
                        textAlign: 'center',
                        justifyContent: 'center',
                    });

                    caption2.add(
                        new ThreeMeshUI.Text({
                            content: normalizeText(links[i + 1].text),
                            fontSize: 0.03,
                            fontColor: new THREE.Color(0x0000FF),
                        })
                    );

                    caption1 = addStatesLinks(caption1, links[i], title);
                    caption2 = addStatesLinks(caption2, links[i + 1], title);

                    captionsSubBlock.add(caption1);
                    captionsSubBlock.add(caption2);

                    objsToIntersect.push(caption1);
                    objsToIntersect.push(caption2);

                    captionsBlock.add(captionsSubBlock);
                }

                if (numLinks % 2 !== 0) {
                    let extraCaption = new ThreeMeshUI.Block({
                        height: CAPTION_HEIGHT,
                        width: CAPTION_WIDTH,
                        margin: MARGIN / 10,
                        textAlign: 'center',
                        justifyContent: 'center',
                        backgroundColor: new THREE.Color(0xFFFFFF),
                    });

                    extraCaption.add(
                        new ThreeMeshUI.Text({
                            content: normalizeText(links[numLinks - 1].text),
                            fontSize: 0.03,
                            fontColor: new THREE.Color(0x0000FF),
                        })
                    );

                    extraCaption = addStatesLinks(extraCaption, links[numLinks - 1], title);

                    captionsBlock.add(extraCaption);

                    objsToIntersect.push(extraCaption);
                }

                leftSubBlock.add(captionsBlock);
            }

            new THREE.TextureLoader().load(content.find((item) => item.tag === 'img').value, (texture) => {
                leftSubBlock.set({
                    backgroundTexture: texture,
                });

                if (texture.image.width > texture.image.height) {
                    leftSubBlock.set({height: (texture.image.height / texture.image.width)});
                    imgWidth = IMAGE_WIDTH;
                } else {
                    leftSubBlock.set({width: (texture.image.width / texture.image.height)});
                    imgWidth = texture.image.width / texture.image.height;
                }

            });

            contentContainer.add(leftSubBlock);
        }

        if (textExists) {
            const rightSubBlock = new ThreeMeshUI.Block({
                width: imgExists ? DASHBOARD_WIDTH - imgWidth : DASHBOARD_WIDTH,
                height: DASHBOARD_HEIGHT,
                padding: PADDING,
                margin: MARGIN,
                backgroundOpacity: 0,
                alignItems: 'start',
            });

            let textContent = []
            if (!imgExists) {
                textContent = content.filter((item) => !['img'].includes(item.tag));
            } else {
                textContent = content.filter((item) => !['img', 'a'].includes(item.tag));
            }

            let texts = [];
            let links = [];

            textContent.forEach((textItem, index) => {
                if (textItem.tag === 'a') {
                    let caption = new ThreeMeshUI.Block({
                        height: CAPTION_HEIGHT,
                        width: CAPTION_WIDTH,
                        margin: MARGIN / 10,
                        textAlign: 'center',
                        justifyContent: 'center',
                        backgroundColor: new THREE.Color(0xFFFFFF),
                    });

                    caption.add(
                        new ThreeMeshUI.Text({
                            content: normalizeText(textItem.text),
                            fontSize: 0.03,
                            fontColor: new THREE.Color(0x0000FF),
                        })
                    );

                    caption = addStatesLinks(caption, textItem, title);

                    objsToIntersect.push(caption);

                    links.push(caption);

                } else if (textItem.tag === 'p') {
                    if (textItem.value.trim() === '') return;

                    let paragraph = new ThreeMeshUI.Block({
                        width: imgExists ? DASHBOARD_WIDTH - PADDING * 4 - imgWidth : DASHBOARD_WIDTH - PADDING * 4,
                        height: 0.05 * Math.ceil(textItem.value.length / 40),
                        textAlign: 'justify-left',
                        justifyContent: 'center',
                        backgroundOpacity: 0,
                        margin: MARGIN,
                    });

                    paragraph.add(
                        new ThreeMeshUI.Text({
                            content: normalizeText(textItem.value),
                            fontSize: 0.05,
                        })
                    );

                    texts.push(paragraph);

                } else if (textItem.tag.match(/h[1-6]/)) {
                    if (textItem.value.trim() === '') return;

                    let hNumber = textItem.tag.slice(-1);
                    let lSize = 0.02;
                    let size = ((lSize * (7 - hNumber) - lSize) / 0.1) * 0.1 + lSize

                    let heading = new ThreeMeshUI.Block({
                        width: imgExists ? DASHBOARD_WIDTH - PADDING * 4 - imgWidth : DASHBOARD_WIDTH - PADDING * 4,
                        height: size * Math.ceil(textItem.value.length / 20),
                        textAlign: 'justify-left',
                        justifyContent: 'center',
                        backgroundOpacity: 0,
                        margin: MARGIN,
                    });

                    heading.add(
                        new ThreeMeshUI.Text({
                            content: normalizeText(textItem.value),
                            fontSize: size,
                        })
                    );

                    texts.push(heading);
                }
            });
            
            let childrenTextsHeight = 0;
            texts.forEach(child => {
                childrenTextsHeight += child.height + MARGIN * 2;
            });

            if (childrenTextsHeight > DASHBOARD_HEIGHT) {
                
                addStatesText(rightSubBlock);

                rightSubBlock.setState('hidden-on');

                objsToOverflow.push(rightSubBlock);
            }

            const textsBlock = new ThreeMeshUI.Block({
                width: imgExists ? DASHBOARD_WIDTH - PADDING * 2 - imgWidth : DASHBOARD_WIDTH - PADDING * 2,
                height: childrenTextsHeight < DASHBOARD_HEIGHT ? DASHBOARD_HEIGHT : childrenTextsHeight,
                backgroundOpacity: 0.7,
                alignItems: 'start',
            });

            texts.forEach(child => {
                textsBlock.add(child);
            })

            rightSubBlock.add(textsBlock);

            if (links.length > 0) {
                const numLinks = links.length;
                
                const captionsBlock = new ThreeMeshUI.Block({
                    height: CAPTION_HEIGHT * Math.ceil(numLinks / 2),
                    width: DASHBOARD_WIDTH,
                    margin: -0.066 * Math.ceil(numLinks / 2),
                    textAlign: 'center',
                    justifyContent: 'center',
                    backgroundOpacity: 0,
                    contentDirection: 'column',
                });

                for (let i = 0; i < numLinks - numLinks % 2; i += 2) {
                    const captionsSubBlock = new ThreeMeshUI.Block({
                        height: CAPTION_HEIGHT,
                        width: DASHBOARD_WIDTH,
                        textAlign: 'center',
                        justifyContent: 'center',
                        backgroundOpacity: 0,
                        contentDirection: 'row',
                    });

                    captionsSubBlock.add(links[i]);
                    captionsSubBlock.add(links[i + 1]);

                    captionsBlock.add(captionsSubBlock);
                }
                
                if (numLinks % 2 !== 0) {
                    captionsBlock.add(links[numLinks - 1]);

                }

                rightSubBlock.add(captionsBlock);
            }

            contentContainer.add(rightSubBlock);
        }

        container.add(contentContainer);
    }

    return container;
}
    
//

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

//

function loop() {
    ThreeMeshUI.update();

    renderer.render(scene, camera);

    updateClickables();
    updateOverflows();
    updatePanels();

    if (interactionType === 'deviceOrientationControls')
        moveCamera();

    controls.update();
}

//

function extractContent(html) {
    let parser = new DOMParser();
    let doc = parser.parseFromString(html, 'text/html');
    let root = doc.body;

    let wpBlockGroups = Array.from(root.querySelectorAll('.wp-block-group')).filter(block => !block.closest('.wp-block-group .wp-block-group'));
    let rootChildren = Array.from(root.children);

    let contentBlocks = Array.from(new Set([...wpBlockGroups, ...rootChildren]));
    
    let data = [];

    contentBlocks.forEach(block => {
        let row = [];
        if (block.tagName.toLowerCase() !== 'div' &&
            block.tagName.toLowerCase() !== 'a' &&
            block.tagName.toLowerCase() !== 'img')
                row.push({type: 'text', tag: block.tagName.toLowerCase(), value: block.textContent.trim()});
        
        if (block.tagName.toLowerCase() === 'div') {
            let texts = getTextElements(block);
            texts.forEach(text => {
                row.push({type: 'text', tag: text.tagName.toLowerCase(), value: text.textContent.trim()});
            });
        }
        let links = block.querySelectorAll('a');
        links.forEach(link => {
            row.push({type: 'link', tag: link.tagName.toLowerCase(), value: link.href.length > 0 ? link.href : 'No href', text: link.textContent.trim()});
        });
        let images = block.querySelectorAll('img');
        images.forEach(img => {
            row.push({type: 'img', tag: img.tagName.toLowerCase(), value: img.src});
        });
        data.push(row);
    });

    return data;
}

function getTextElements(node) {
    let textElements = [];
    let childNodes = node.childNodes;

    for (let i = 0; i < childNodes.length; i++) {
        let child = childNodes[i];

        if (child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() !== 'a' && child.tagName.toLowerCase() !== 'img') {
            let childChildNodes = child.childNodes;
            let hasOnlyTextContent = Array.from(childChildNodes).every(childChild => childChild.nodeType === Node.TEXT_NODE || (childChild.nodeType === Node.ELEMENT_NODE && childChild.tagName.toLowerCase() === 'br'));

            if (hasOnlyTextContent && child.textContent.trim() !== '') {
                textElements.push(child);
            }
        }

        textElements.push(...getTextElements(child));
    }
    
    return textElements;
}

function normalizeText(text) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9\s.,;:!?€'"(){}[\]<>\/\\&@#%^*+=|`~_-]/g, '');
}

//

/*
function addStatesButtons(button, name) {
    button.setupState({
        state: 'selected',
        attributes: {
            offset: 0.02,
            backgroundColor: new THREE.Color( 0x555555 ),
        },
        onSet: () => {
            if (name === 'back')
                history.back();
            else if (name === 'forward')
                history.forward();
        }
    });

    button.setupState({
        state: 'hovered',
        attributes: {
            offset: 0.035,
            backgroundColor: new THREE.Color( 0x111111 ),
            backgroundOpacity: 1,
        },
    });

    button.setupState({
        state: 'idle',
        attributes: {
            offset: 0.035,
            backgroundColor: new THREE.Color( 0x333333 ),
            backgroundOpacity: 0.6,
        },
    });

    return button;
}
*/

function addStatesLinks(link, item, title) {
    link.setupState({
        state: 'selected',
        attributes: {
            offset: 0.02,
            backgroundColor: new THREE.Color( 0xffffff ),
        },
        onSet: () => {
            userStudyTasks.numberOfInteractions++;

            if (item.value !== 'No href')
                window.open(item.value, '_self');
            else if (item.text === 'Comprar' || item.text === 'Like')
                mostrarCompradoOLike(item.text, title);
        }
    });

    link.setupState({
        state: 'hovered',
        attributes: {
            offset: 0.035,
            backgroundColor: new THREE.Color( 0xcfcfcf ),
            backgroundOpacity: 1,
        },
    });

    link.setupState({
        state: 'idle',
        attributes: {
            offset: 0.035,
            backgroundColor: new THREE.Color( 0xffffff ),
            backgroundOpacity: 0.8,
        },
    });

    return link;
}

function addStatesText(text) {
    text.setupState({
        state: 'hidden-on',
        attributes: {hiddenOverflow: true},
        onSet: () => {
            userStudyTasks.numberOfInteractions++;
        }
    });

    text.setupState({
        state: 'hidden-off',
        attributes: {hiddenOverflow: false}
    });
}

//

function checkPanelDistance(panel, setDistance) {
    if (camera.position.distanceTo(panel.position) < setDistance)
        return true;
    return false;
}

function updatePanels() {
    textPanels.forEach((panel, index) => {
        const circleIndex = Math.floor(index / postsPerCircle);
        const positionInCircle = index % postsPerCircle;

        const radius = baseRadius + radiusIncrement * circleIndex;

        const reverseDirection = circleIndex % 2 === 1;

        const panelDistance = checkPanelDistance(panel, 3);

        if (panelDistance || (stoppedCircle === circleIndex && isAnyPanelStopped)) {
            if (!isPaused) {
                isPaused = true;
                isAnyPanelStopped = true;
                stoppedCircle = circleIndex;
                stoppedPanel = index;
            }
            
            if (!panelDistance && stoppedPanel === index) {
                isPaused = false;
                isAnyPanelStopped = false;
                stoppedCircle = -1;
            }            
        } else {
            const time = clock.getElapsedTime() * 0.1 * Math.PI;

            let angle = time + Math.PI * 2 * (positionInCircle / postsPerCircle);
            if (reverseDirection) {
                angle = -angle;
            }

            angle += circleSpeeds[circleIndex];

            panel.position.set(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            );
            panel.lookAt(0, 0, 0);
        }
    });
}

function updateClickables() {

    let intersect;

    if ( mouse.x !== null && mouse.y !== null ) {

        raycaster.setFromCamera( mouse, camera );

        intersect = raycast(objsToIntersect);

    }

    if ( intersect && intersect.object.isUI ) {

        if ( intersect.object.parentUI == null ) return;

        if ( selectState && !isModalOpen('staticBackdropInstructions')) {

            intersect.object.setState( 'selected' );

        } else {

            intersect.object.setState( 'hovered' );

        }

    }

    objsToIntersect.forEach( ( obj ) => {

        if ( obj.parentUI == null ) return;

        if ( ( !intersect || obj !== intersect.object ) && obj.isUI ) {

            obj.setState( 'idle' );

        }

    } );

}

function updateOverflows() {

    let intersect;

    if ( mouse.x !== null && mouse.y !== null ) {

        raycaster.setFromCamera( mouse, camera );

        intersect = raycast(objsToOverflow);

    }

    if ( intersect && intersect.object.isUI ) {

        if (intersect.object.currentState === 'hidden-on' && !isModalOpen('staticBackdropInstructions')) {

            intersect.object.setState('hidden-off');

        }

    }

    objsToOverflow.forEach( ( obj ) => {

        if ( ( !intersect || obj !== intersect.object ) && obj.isUI ) {

            obj.setState( 'hidden-on' );

        }

    } );

}

function raycast(list) {

    return list.reduce( ( closestIntersection, obj ) => {

        const intersection = raycaster.intersectObject( obj, true );

        if ( !intersection[ 0 ] ) return closestIntersection;

        if ( !closestIntersection || intersection[ 0 ].distance < closestIntersection.distance ) {

            intersection[ 0 ].object = obj;

            return intersection[ 0 ];

        }

        return closestIntersection;

    }, null );

}

function mostrarCompradoOLike(text, title) {
    let texto, imagen;

    if (text === 'Comprar') {
        texto = 'Se ha comprado el producto ' + title;
        imagen = 'shopping-cart';

        if (title === 'Juramentada')
            userStudyTasks.timeSpentForJuramentada = Math.round(performance.now() / 1000);
        else if (title === 'Sixgon')
            userStudyTasks.timeSpentForSixgon = Math.round(performance.now() / 1000);
        else if (title === 'Tostadora')
            userStudyTasks.timeSpentForTostadora = Math.round(performance.now() / 1000);
    } else {
        texto = 'Se ha dado like a la publicación ' + title;
        imagen = 'like';

        if (performance.now() <= 60000)
            userStudyTasks.numberOfLikesInOneMinute++;
    }

    let notification = document.getElementById('notification');
    notification.style.display = 'flex';

    let notificationText = document.getElementById('notification-text');
    notificationText.textContent = texto;

    let notificationImage = document.getElementById('notification-image');
    notificationImage.src = 'https://oierlayana.com/tfg/wp-content/uploads/' + imagen + '.png';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

function createMovingControls() {
    let moveButton = document.getElementById('joystick');
    moveButton.style.display = 'flex';

    new JoyStick('joystick', {}, function(stickData) {
        joystickData = stickData;
    });
}

function moveCamera() {
    const moveSpeed = 0.0005;

    const moveVector = new THREE.Vector3(
        joystickData.x * moveSpeed,
        0,
        joystickData.y * moveSpeed
    );

    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    const moveDirection = new THREE.Vector3(
        direction.x * moveVector.z - direction.z * moveVector.x,
        0,
        direction.z * moveVector.z + direction.x * moveVector.x
    );

    camera.position.add(moveDirection);
}

function isModalOpen(modalId) {
    var modal = document.getElementById(modalId);
    return modal.classList.contains('show');
}