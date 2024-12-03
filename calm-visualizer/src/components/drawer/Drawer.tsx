import Sidebar from '../sidebar/Sidebar'
import { useState } from 'react'
import {CALMInstantiation} from '../../../../shared/src';
import FileUploader from '../fileuploader/FileUploader'
import CytoscapeRenderer, {Node} from "../cytoscape-renderer/CytoscapeRenderer.tsx";
import {
    CALMComposedOfRelationship, CALMConnectsRelationship,
    CALMDeployedInRelationship,
    CALMInteractsRelationship,
    CALMRelationship
} from "../../types";

function isComposedOf(relationship: CALMRelationship): relationship is CALMComposedOfRelationship {
    return 'composed-of' in relationship['relationship-type'];
}

function isDeployedIn(relationship: CALMRelationship): relationship is CALMDeployedInRelationship {
    return 'deployed-in' in relationship['relationship-type'];
}

function isInteracts(relationship: CALMRelationship): relationship is CALMInteractsRelationship {
    return 'interacts' in relationship['relationship-type'];
}

function isConnects(relationship: CALMRelationship): relationship is CALMConnectsRelationship {
    return 'connects' in relationship['relationship-type'];
}

const getComposedOfRelationships = (calmInstance: CALMInstantiation) => {
    const composedOfRelationships: {
        [idx: string]: {
            type: 'parent' | 'child'
            parent?: string
        }
    } = {}

    calmInstance.relationships.forEach(relationship => {
        if (isComposedOf(relationship)) {
            const rel = relationship["relationship-type"]["composed-of"];
            composedOfRelationships[rel["container"]] = {type: "parent"}
            rel["nodes"].forEach(node => {
                composedOfRelationships[node] = {
                    type: 'child',
                    parent: rel['container'],
                }
            })
        }
    })

    return composedOfRelationships;
}
const getDeployedInRelationships = (calmInstance:  CALMInstantiation) => {
    const deployedInRelationships: {
        [idx: string]: {
            type: 'parent' | 'child'
            parent?: string
        }
    } = {}
    calmInstance.relationships.forEach(relationship => {
        if (isDeployedIn(relationship)) {
            const rel = relationship["relationship-type"]["deployed-in"];
            deployedInRelationships[rel["container"]] = {type: "parent"}
            rel["nodes"].forEach(node => {
                deployedInRelationships[node] = {
                    type: 'child',
                    parent: rel['container'],
                }
            })
        }
    })

    return deployedInRelationships;
}

function Drawer() {
    const [title, setTitle] = useState('Architecture as Code')
    const [selectedNode, setSelectedNode] = useState(null)
    const [calmInstance, setCALMInstance] = useState<CALMInstantiation | null>(null)

    const closeSidebar = () => {
        setSelectedNode(null)
    }

    const getNodesAndEdges = () => {
        if(!calmInstance) return [[], []];
        const composedOfRelationships = getComposedOfRelationships(calmInstance);
        const deployedInRelationships = getDeployedInRelationships(calmInstance);

        const nodes =  calmInstance ? calmInstance.nodes.map(node => {
            const newData: Node = {
                classes: 'node',
                data: {
                    label: node.name,
                    description: node.description, type: node["node-type"], id: node["unique-id"]
                }
            }

            if (composedOfRelationships[node["unique-id"]]?.type === "parent") {
                newData.classes = "group";
            }

            if (composedOfRelationships[node["unique-id"]]?.type === "child" && composedOfRelationships[node["unique-id"]]["parent"]) {
                newData.data.parent = composedOfRelationships[node["unique-id"]].parent!;
            }

            if (deployedInRelationships[node["unique-id"]]?.type === "parent") {
                newData.classes = "group";
            }

            if (deployedInRelationships[node["unique-id"]]?.type === "child" && deployedInRelationships[node["unique-id"]]["parent"] && !newData.data.parent) {
                newData.data.parent = deployedInRelationships[node["unique-id"]].parent!;
            }
            return newData;
        }): []

        const relationships = calmInstance ? calmInstance.relationships.filter(relationship =>  !isComposedOf(relationship) && !isDeployedIn(relationship)).map(relationship => {
            if (isInteracts(relationship) && relationship["unique-id"] && relationship.description) {
                return {
                    data: {
                        id: relationship["unique-id"],
                        label: relationship.description,
                        source: relationship["relationship-type"].interacts.actor,
                        target: relationship["relationship-type"].interacts.nodes[0],
                        smooth: {
                            enabled: true,
                            type: "curvedCW",
                            roundness: 0.1
                        }
                    }
                }
            }
            if (isConnects(relationship) && relationship["unique-id"] && relationship.description && relationship["relationship-type"].connects.source.node && relationship["relationship-type"].connects.destination.node) {
                const source = relationship["relationship-type"].connects.source.node;
                const target = relationship["relationship-type"].connects.destination.node;
                return {
                    data: {
                        id: relationship["unique-id"],
                        label: relationship.description,
                        source,
                        target,
                        smooth: {
                            enabled: true,
                            type: "curvedCW",
                            roundness: 0.1
                        }
                    }
                }
            }

        }) : []

        return [nodes, relationships]
    }

    const [nodes,  relationships] = getNodesAndEdges();


    async function handleFile(instanceFile: File) {
        const instanceString = await instanceFile.text()
        const calmInstance:CALMInstantiation = JSON.parse(instanceString);
        setTitle(instanceFile.name);
        setCALMInstance(calmInstance);
    }


    return (
        <>
            <div
                className={`drawer drawer-end ${selectedNode ? 'drawer-open' : ''}`}
            >
                <input
                    type="checkbox"
                    className="drawer-toggle"
                    checked={!!selectedNode}
                    onChange={closeSidebar}
                />
                <div className="drawer-content">
                    <div className="text-xl font-bold">{title}</div>
                    <FileUploader callback={handleFile} />
                    <div id="app">
                        {calmInstance && <CytoscapeRenderer nodes={nodes} edges={relationships}/>}
                    </div>
                </div>
                {selectedNode && (
                    <Sidebar
                        selectedData={selectedNode}
                        closeSidebar={closeSidebar}
                    />
                )}
            </div>
        </>
    )
}

export default Drawer