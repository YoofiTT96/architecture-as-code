import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

export type Node = {
    data: {
        label: string;
        id: string;
        [idx: string]: string;
    }
}

export type Edge = {
    data: {
        label: string
        source: string;
        target: string;
        [idx: string]: string;
    };

}

interface Props {
    nodes: Node[];
    edges: Edge[];
}

const CytoscapeRenderer = ({ nodes = [], edges = [] }: Props) => {
    const cyRef = useRef(null);

    useEffect(() => {
        // Destroy previous Cytoscape instance to avoid memory leaks
        /*if (cyRef.current) {
            cyRef.current.destroy();
        }*/

        // Initialize Cytoscape instance
        const container = cyRef.current;

        cytoscape({
            container: container, // container to render
            elements: [...nodes, ...edges], // graph data
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': '#0074D9',
                        'label': 'data(label)', // labels from data property
                        'color': '#fff',
                        'text-valign': 'center',
                        'text-outline-width': 2,
                        'text-outline-color': '#0074D9',
                    },
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'curve-style': 'bezier',
                        'label':  'data(label)', // labels from data property
                        'line-color': '#FF4136',
                        'target-arrow-color': '#FF4136',
                        'target-arrow-shape': 'triangle',
                    },
                },
            ],
            layout: {
                name: 'grid', // Use grid layout for simplicity
            },
        });

        /*return () => {
            if (cyRef.current) {
                cyRef.current.destroy();
            }
        };*/
    }, [nodes, edges]); // Re-render on nodes or edges change

    return <div ref={cyRef} style={{ width: '90%', height: '1000px', backgroundColor: "white" }} />;
};

export default CytoscapeRenderer;