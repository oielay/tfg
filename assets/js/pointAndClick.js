import * as THREE from 'three';
import * as ThreeMeshUI from 'three-mesh-ui';

import { OrbitControls } from 'three/addons/jsm/controls/OrbitControls.js';
import { BoxLineGeometry } from 'three/addons/jsm/geometries/BoxLineGeometry.js';

// Variables

let scene, camera, renderer, controls;
let objsToIntersect = [], objsToOverflow = [];
let moveForward = false, moveBackward = false;

// Obtain content from wordpress page

let newContent = JSON.parse(JSON.stringify(extractContent(content), null, 2)).flat();

// Set page height and width

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

// Set constants

const TITLE_HEIGHT = 0.35;
const DASHBOARD_HEIGHT = 1;
const DASHBOARD_WIDTH = 1.5;
const IMAGE_HEIGHT = 1;
const IMAGE_WIDTH = 1;            
const CAPTION_HEIGHT = 0.075;
const CAPTION_WIDTH = 0.375;
const MARGIN = 0.025;
const PADDING = 0.025;

// Set font

// const fontTexture = 'https://oierlayana.com/tfg/wp-content/uploads/fonts/Roboto-msdf.png';
// const fontJSON = 'https://oierlayana.com/tfg/wp-content/uploads/fonts/Roboto-msdf.json';
const fontTexture = 'http://localhost/wordpress/wp-content/uploads/fonts/Roboto-msdf.png';
const fontJSON = 'http://localhost/wordpress/wp-content/uploads/fonts/Roboto-msdf.json';

// Interaction and listeners

const raycaster = new THREE.Raycaster();

const mouse = new THREE.Vector2();
mouse.x = mouse.y = null;

let selectState = false;

window.addEventListener( 'pointermove', ( event ) => {
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;
} );

window.addEventListener( 'pointerdown', () => {
    selectState = true;
} );

window.addEventListener( 'pointerup', () => {
    selectState = false;
} );

window.addEventListener( 'touchstart', ( event ) => {
    selectState = true;
    mouse.x = ( event.touches[ 0 ].clientX / window.innerWidth ) * 2 - 1;
    mouse.y = -( event.touches[ 0 ].clientY / window.innerHeight ) * 2 + 1;
} );

window.addEventListener( 'touchend', () => {
    selectState = false;
    mouse.x = null;
    mouse.y = null;
} );

window.addEventListener('load', init);
window.addEventListener('resize', onWindowResize);

//

function init() {
    // SCENE

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x505050);

    // CAMERA

    camera = new THREE.PerspectiveCamera(60, WIDTH / HEIGHT, 0.1, 100);

    // RENDERER

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(WIDTH, HEIGHT);
    renderer.localClippingEnabled = true;
    renderer.xr.enabled = true;
    //document.body.appendChild(VRButton.createButton(renderer));
    document.body.appendChild(renderer.domElement);

    // ROOM

    const room = new THREE.LineSegments(
        new BoxLineGeometry(10, 10, 20, 10, 10, 10).translate(0, 5, 0),
        new THREE.LineBasicMaterial({ color: 0x808080 })
    );

    const roomMesh = new THREE.Mesh(
        new THREE.BoxGeometry(10, 10, 20, 10, 10, 10).translate(0, 5, 0),
        new THREE.MeshBasicMaterial({ side: THREE.BackSide })
    );

    scene.add(room);
    objsToIntersect.push(roomMesh);

    // ORBIT CONTROLS

    controls = new OrbitControls(camera, renderer.domElement);
    camera.position.set(0, 3.4, 1);
    controls.target = new THREE.Vector3(0, 2.6, -1.8);

    // DEVICE ORIENTATION CONTROLS

    let interactionType = window.location.search.substring(1).split("&").find(param => param.includes('interaction='));

    if (interactionType.split('=')[1] === 'deviceOrientationControls') {
        // window.addEventListener('deviceorientation', function (event) {
        //     const alpha = event.alpha ? THREE.MathUtils.degToRad(event.alpha) : 0;
        //     const beta = event.beta ? THREE.MathUtils.degToRad(event.beta) : 0;
        //     const gamma = event.gamma ? THREE.MathUtils.degToRad(event.gamma) : 0;

        //     const quaternion = new THREE.Quaternion();
        //     //quaternion.setFromEuler(new THREE.Euler(beta, alpha, -gamma, 'YXZ'));

        //     // // Apply the quaternion to the scene
        //     //camera.rotation.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
        // }, true);

        createMovingControls();
    }

    // TEXT PANELS FOR CONTENT
    
    makeTextPanel(newContent, title);

    renderer.setAnimationLoop(loop);

}

//

function makeTextPanel(content, title) {
    const container = new ThreeMeshUI.Block({
        ref: 'container',
        padding: PADDING,
        fontFamily: fontJSON,
        fontTexture: fontTexture,
        fontColor: new THREE.Color(0xffffff),
        backgroundOpacity: 0,
    });

    container.position.set(0, 3, -1.8);
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

                    caption1 = addStatesLinks(caption1, links[i]);
                    caption2 = addStatesLinks(caption2, links[i + 1]);

                    captionsSubBlock.add(caption1);
                    captionsSubBlock.add(caption2);

                    objsToIntersect.push(caption1);
                    objsToIntersect.push(caption2);

                    captionsBlock.add(captionsSubBlock);
                }

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

                extraCaption = addStatesLinks(extraCaption, links[numLinks - 1]);

                captionsBlock.add(extraCaption);

                objsToIntersect.push(extraCaption);

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

                    caption = addStatesLinks(caption, textItem);

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

    controls.update();

    renderer.render(scene, camera);

    updateClickables();
    updateOverflows();

    moveCamera();
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

function addStatesLinks(link, item) {
    link.setupState({
        state: 'selected',
        attributes: {
            offset: 0.02,
            backgroundColor: new THREE.Color( 0xffffff ),
        },
        onSet: () => {
            if (item.value !== 'No href')
                window.open(item.value, '_self');
            else
                mostrarCompradoOLike(item.text);
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
        attributes: {hiddenOverflow: true}
    });

    text.setupState({
        state: 'hidden-off',
        attributes: {hiddenOverflow: false}
    });
}

//

function updateClickables() {

    let intersect;

    if ( mouse.x !== null && mouse.y !== null ) {

        raycaster.setFromCamera( mouse, camera );

        intersect = raycast(objsToIntersect);

    }

    if ( intersect && intersect.object.isUI ) {

        if ( selectState ) {

            intersect.object.setState( 'selected' );

        } else {

            intersect.object.setState( 'hovered' );

        }

    }

    objsToIntersect.forEach( ( obj ) => {

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

        if (intersect.object.currentState === 'hidden-on') {

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

function mostrarCompradoOLike(text) {
    let texto, imagen;

    if (text === 'Comprar') {
        texto = 'Se ha comprado el producto';
        imagen = 'shopping-cart';
    } else {
        texto = 'Se ha dado like a la publicación';
        imagen = 'like';
    }

    const notificationBlock = new ThreeMeshUI.Block({
        width: 0.85,
        height: 0.1,
        backgroundOpacity: 0.8,
        backgroundColor: new THREE.Color(0x00FF00),
        justifyContent: 'center',
        alignItems: 'center',
        contentDirection: 'row',
        fontFamily: fontJSON,
        fontTexture: fontTexture,
    });

    notificationBlock.position.set(0, 3, -1);
    notificationBlock.rotation.x = -0.55;

    const notificationImage = new ThreeMeshUI.InlineBlock({
        height: 0.05,
        width: 0.07,    
        justifyContent: 'center',
    });

    new THREE.TextureLoader().load('http://localhost/wordpress/wp-content/uploads/' + imagen + '.png', (texture) => {
        notificationImage.set({
            backgroundTexture: texture,
        });
    });

    // new THREE.TextureLoader().load('https://oierlayana.com/tfg/wp-content/uploads/' + imagen + '.png', (texture) => {
    //     notificationImage.set({
    //         backgroundTexture: texture,
    //     });
    // });

    notificationBlock.add(notificationImage);

    const notificationText = new ThreeMeshUI.Text({
        content: normalizeText('  ' + texto),
        fontSize: 0.05,
        fontColor: new THREE.Color(0x000000),
    });

    notificationBlock.add(notificationText);

    scene.add(notificationBlock);

    setTimeout(() => {
        scene.remove(notificationBlock);
    }, 3000);
}

function createMovingControls() {
    let moveButtons = document.getElementById('move-buttons');
    moveButtons.style.display = 'flex';

    let forwardButton = document.getElementById('move-forward');
    let backwardButton = document.getElementById('move-backward');

    forwardButton.addEventListener('mousedown', () => {
        moveForward = true;
    });

    forwardButton.addEventListener('mouseup', () => {
        moveForward = false;
    });

    backwardButton.addEventListener('mousedown', () => {
        moveBackward = true;
    });

    backwardButton.addEventListener('mouseup', () => {
        moveBackward = false;
    });
}

function moveCamera() {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    if (moveForward) {
        camera.position.addScaledVector(direction, 0.02);
    }

    if (moveBackward) {
        camera.position.addScaledVector(direction, -0.02);
    }
}