import G6 from '@antv/g6';
import { cloneDeep } from 'lodash';
import { LayoutOptionBase, Data } from '../../types';

export interface CircularLayoutOption extends LayoutOptionBase {
  /** 中心点坐标 */
  center: [number, number];
  radius: number;
  /** null | 'topology' | 'degree' */
  ordering: string;
}

const CircularLayout = (data: Data, options: CircularLayoutOption) => {
  const source = cloneDeep(data);
  // eslint-disable-next-line new-cap
  const layout = new G6.Layout.circular({
    ...options,
  });

  layout.init(source);
  layout.execute();

  return {
    nodes: layout.nodes,
    edges: data.edges,
  };
};
export default CircularLayout;
