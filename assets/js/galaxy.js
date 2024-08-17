import { CSS2DRenderer, CSS2DObject } from '//unpkg.com/three/examples/jsm/renderers/CSS2DRenderer.js';

// Creamos el grafo

const Graph = ForceGraph3D({ controlType: 'orbit', extraRenderers: [new CSS2DRenderer()]})
    (document.getElementById('3d-graph'))
    .jsonUrl('http://localhost/wordpress/wp-content/plugins/plugin-tfg/assets/galaxy-nodes.json')
    .nodeThreeObject(node => {
        const nodeEl = document.createElement('div');
        nodeEl.textContent = node.id;
        nodeEl.style.color = node.color;
        nodeEl.className = 'node-label';
        return new CSS2DObject(nodeEl);
      })
    .nodeThreeObjectExtend(true)
    .nodeAutoColorBy('group')
    .onNodeClick(node => {
        const distance = 40;
        const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

        const newPos = node.x || node.y || node.z
        ? { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }
        : { x: 0, y: 0, z: distance };

        Graph.cameraPosition(
            newPos,
            node,
            3000
        );

        // Draw text panel with post of the node.
    });