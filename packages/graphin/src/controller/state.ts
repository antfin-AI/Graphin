import { Data, GraphType } from '../types';

const initState = (graph: GraphType, data: Data) => {
  if (!graph) return;

  const autoPaint = graph.get('autoPaint');
  graph.setAutoPaint(false);

  const { nodes = [], edges = [] } = data;
  nodes.forEach(n => {
    if (n?.data?.states) {
      const { states = {} } = n.data;

      Object.keys(states).forEach(k => {
        graph.setItemState(n.id, k, states[k]);
      });
    }
  });
  edges.forEach(e => {
    if (e?.data?.states) {
      const { states = {} } = e.data;
      Object.keys(states).forEach(k => {
        graph.setItemState(e.id, k, states[k]);
      });
    }
  });

  graph.paint();
  graph.setAutoPaint(autoPaint);
};

export default initState;
