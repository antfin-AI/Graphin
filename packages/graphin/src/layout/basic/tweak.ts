import { Data } from '../../types';
/* eslint-disable no-param-reassign */
const getRandomPosition = () => {
    return Math.round((Math.random() - 0.5) * 80);
};
/**
 *
 * @param data
 * @param options
 */

const tweak = (data: Data, options: any) => {
    const { graph, width, height } = options;

    const { nodes: currNodes, edges: currEdges } = data;
    const { nodes: preNodes } = graph.save();

    /** 将图上之前节点的位置信息存储在positionMap中 */
    const positionMap = new Map();
    preNodes.forEach((item: any) => {
        const { id, x, y } = item;
        positionMap.set(id, {
            x,
            y,
        });
    });

    const incrementNodesMap = new Map();
    currNodes.forEach((node: any) => {
        const { id } = node;
        const position = positionMap.get(id);
        if (position) {
            node.x = position.x;
            node.y = position.y;
        } else {
            incrementNodesMap.set(id, node);
        }
    });

    const incrementPositonMap = new Map();
    currEdges.forEach((edge: any) => {
        const { source, target } = edge;

        const nodeInSource = incrementNodesMap.get(source);
        const nodeInTarget = incrementNodesMap.get(target);
        const positionInSource = positionMap.get(source);
        const positionInTarget = positionMap.get(target);

        if (nodeInSource && positionInTarget) {
            incrementPositonMap.set(source, {
                // ...nodeInSource,
                x: positionInTarget.x + getRandomPosition(),
                y: positionInTarget.y + getRandomPosition(),
            });
        }
        if (nodeInTarget && positionInSource) {
            incrementPositonMap.set(target, {
                // ...nodeInTarget,
                x: positionInSource.x + getRandomPosition(),
                y: positionInSource.y + getRandomPosition(),
            });
        }
    });

    currNodes.forEach((node: any) => {
        const { id } = node;
        const position = positionMap.get(id) || incrementPositonMap.get(id);
        // 表示固定节点
        if (node.data && node.data.fixed === true) {
            node.layout = {
                ...node.layout,
                force: {
                    mass: 1000000000,
                },
            };
        }

        // 一旦设置了 fix 的 坐标，则加力导 mass 固定且设置为指定位置
        if (node.data && node.data.fx && node.data.fy) {
            node.layout = {
                ...node.layout,
                force: {
                    mass: 100000000,
                },
            };
            node.x = node.data.fx;
            node.y = node.data.fy;
            return;
        }

        if (position) {
            node.x = position.x;
            node.y = position.y;
            return;
        }

        node.x = Math.round(Math.random() * width);
        node.y = Math.round(Math.random() * height);
    });

    return {
        data: {
            nodes: currNodes,
            edges: currEdges,
        },
    };
};
export default tweak;
