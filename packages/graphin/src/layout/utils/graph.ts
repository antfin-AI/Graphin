/* eslint-disable import/prefer-default-export */
import { Edge } from '../../layout/force/Elements';
import { Node } from '../../types';

function hasLabelCollide(aNode: Node, bNode: Node): boolean {
  const fontSize = Math.max(aNode.shapeComponent?.label?.fontSize ?? 14, bNode.shapeComponent?.label?.fontSize ?? 14);
  // 进入可能产生的冲突区
  if (Math.abs(aNode.y - bNode.y) > fontSize * 1.5) {
    // console.log('not collide');
    return false;
  }

  const p1Label = aNode?.data?.label ?? '__';
  const p2Label = bNode?.data?.label ?? '__';
  const labelLength = (p1Label.length / 2 + p2Label.length / 2) * fontSize;
  const pointXDistance = Math.abs(aNode.x - bNode.x);

  if (labelLength > pointXDistance) {
    return true;
  }

  return false;
}

export const getDegree = (node: Node, edges: Edge[]) => {
  const nodeId = node.data.id;
  let index = 0;

  edges.forEach(edge => {
    if (edge.data.source === nodeId || edge.data.target === nodeId) {
      index = index + 1;
    }
  });

  return index;
};

/**
 * 更新 label 的位置
 */
export const updateLabelPosition = (nodes: Node[]) => {
  // 按 y 从低到高排序
  nodes.sort((aNode, bNode) => aNode.y - bNode.y);
  // console.log('nodes', nodes);

  const len = nodes.length;
  for (let i = 0; i < len; i++) {
    for (let j = i + 1; j < len; j++) {
      if (i === j) continue; // eslint-disable-line
      const iNode = nodes[i];
      const jNode = nodes[j];
      if (!hasLabelCollide(iNode, jNode)) continue; // eslint-disable-line
      // console.log(iNode, jNode);
      jNode.y += 20;

      nodes.sort((aNode, bNode) => aNode.y - bNode.y);
    }
  }
};
