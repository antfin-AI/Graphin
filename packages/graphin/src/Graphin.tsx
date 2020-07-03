// @ts-nocheck
import React, { ErrorInfo } from 'react';
import { cloneDeep } from 'lodash';
/** controller */
import initController from './controller/init';
import registerController from './controller/register';
import HistoryController from './controller/history';

import layoutController from './controller/layout';
import apisController from './apis';
import eventController from './events/index';

/** types  */
import {
  GraphinProps,
  GraphinState,
  ExtendedGraphOptions,
  GraphType,
  ForceSimulation,
  Data,
  Layout,
  ExtendLayout,
} from './types';

/** utils */
import debug from './utils/debug';
import shallowEqual from './utils/shallowEqual';

import './index.less';
import initState from './controller/state';

type DiffValue = Data | Layout | undefined;

class Graph extends React.PureComponent<GraphinProps, GraphinState> {
  graphDOM: HTMLDivElement | null = null;

  graph?: GraphType;

  history: HistoryController;

  forceSimulation: ForceSimulation | null;

  g6Options?: Partial<ExtendedGraphOptions>;

  getLayoutInfo: () => any; // eslint-disable-line

  clearEvents?: () => void;

  constructor(props: GraphinProps) {
    super(props);
    this.state = {
      isGraphReady: false,
      data: props.data,
      forceSimulation: null,
      width: 0,
      height: 0,
      graphSave: null,
    };
    this.history = new HistoryController();
    this.forceSimulation = null;
    this.getLayoutInfo = () => {};
  }

  componentDidMount() {
    const { data } = this.props;
    debug('effect')('did-mount');
    // register props.extend and props.register
    const behavirosMode = registerController(this.props);
    // init G6 instance
    const { instance, width, height, options } = initController(
      this.props,
      this.graphDOM as HTMLDivElement,
      behavirosMode,
    );
    this.g6Options = options;
    this.graph = instance as GraphType;
    const { data: newData, forceSimulation } = layoutController(this.getContext(), { data });
    this.forceSimulation = forceSimulation!;

    this.setState(
      {
        isGraphReady: true,
        graph: this.graph,
        width,
        height,
        data: newData,
        forceSimulation,
      },
      () => {
        this.renderGraphWithLifeCycle(true);
      },
    );
    this.handleEvents();
  }

  componentDidUpdate(prevProps: GraphinProps) {
    const isDataChange = this.shouldUpdateWithDeps(prevProps, ['data']);
    const isLayoutChange = this.shouldUpdateWithDeps(prevProps, ['layout']);

    // only rerender when data or layout change
    if (isDataChange || isLayoutChange) {
      let { data: currentData } = this.state;
      if (isDataChange) {
        const { data } = this.props;
        currentData = data;
      }
      const { data, forceSimulation } = layoutController(this.getContext(), { data: currentData, prevProps });
      this.forceSimulation = forceSimulation!;
      this.setState(
        {
          data,
          forceSimulation,
        },
        () => {
          // rerender Graph
          this.renderGraphWithLifeCycle();
        },
      );
    }
  }

  componentWillUnmount() {
    this.clearEvents!();
    debug('Unmount')('componentWillUnmount');
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Catch component error: ', error, info);
  }

  getApis = () => {
    const context = this.getContext();
    return apisController(context);
  };

  getHistoryInfo = () => {
    return this.history.getHistoryInfo();
  };

  clear = () => {
    this.graph!.clear();
    this.history.reset();
    this.clearEvents!();

    this.setState(
      {
        data: { nodes: [], edges: [] },

        forceSimulation: null,
        graphSave: null,
      },
      () => {
        const { data } = this.state;
        this.renderGraph(data);
      },
    );
  };

  shouldUpdateWithDeps(prevProps: GraphinProps, deps: string[]) {
    const { props } = this;
    let shouldUpdate = false;
    deps.forEach(key => {
      const prevVal = prevProps[key] as DiffValue;
      const currentVal = props[key] as DiffValue;
      if (prevVal !== currentVal) {
        if (!prevVal || !currentVal) {
          shouldUpdate = true;
        } else if (!shallowEqual(prevVal, currentVal)) {
          shouldUpdate = true;
        }
      }
    });
    return shouldUpdate;
  }

  handleEvents() {
    this.clearEvents = eventController(this.getContext()).clear;
  }

  getContext = () => {
    return this;
  };

  renderGraphWithLifeCycle = (firstRender = false) => {
    const { data } = this.state;
    const cloneData = cloneDeep(data);
    if (firstRender) {
      // 为了提高fitview的效率 取边上4个点去进行第一次的fitview
      const firstRenderData = this.getBorderNodes(cloneData.nodes);
      this.graph!.changeData(firstRenderData);
    }
    this.graph!.changeData(cloneData);
    // console.time('graph.paint')
    // if(!firstRender && !this!.g6Options.animate) this.graph!.paint()
    // console.timeEnd('graph.paint')
    if (this.graph!.getCurrentMode().length > 0) this.graph!.read(cloneData);
    this.graph!.emit('afterchangedata');
    initState(this.graph, data);
    this.graph!.emit('afterchangedata');
    this.handleSaveHistory();
  };

  // 获取所有节点x,y分别为最大最小的节点
  getBorderNodes = (nodes = []) => {
    const xOrderedNodes = nodes.sort((pre, next) => pre.x - next.x);
    const yOrderedNodes = nodes.sort((pre, next) => pre.y - next.y);
    return {
      nodes: [
        xOrderedNodes[0],
        xOrderedNodes[xOrderedNodes.length - 1],
        yOrderedNodes[0],
        yOrderedNodes[yOrderedNodes.length - 1],
      ],
      edges: [],
    };
  };

  stopForceSimulation = () => {
    const { forceSimulation } = this.state;
    if (forceSimulation) {
      forceSimulation.stop();
    }
  };

  handleSaveHistory = () => {
    const currentState = {
      ...this.state,
      graphSave: cloneDeep(this.graph!.save()),
    };
    this.history.save(currentState);
  };

  handleUndo = () => {
    this.stopForceSimulation();

    const prevState = this.history.undo();
    if (prevState) {
      this.setState(
        {
          ...prevState,
        },
        () => {
          this.renderGraphByHistory();
        },
      );
    }
  };

  handleRedo = () => {
    this.stopForceSimulation();

    const nextState = this.history.redo();
    if (nextState) {
      this.setState(
        {
          ...nextState,
        },
        () => {
          this.renderGraphByHistory();
        },
      );
    }
  };

  renderGraph = (data: Data) => {
    this.graph!.changeData(cloneDeep(data));
    /**
     * TODO 移除 `afterchangedata` Event
     * 此方法应该放到G6的changeData方法中去emit
     */
    this.graph!.emit('afterchangedata');
  };

  renderGraphByHistory = () => {
    const { forceSimulation, graphSave } = this.state;
    if (forceSimulation) {
      forceSimulation.restart(graphSave.nodes || [], this.graph!);
    }
    this.renderGraph(graphSave);
  };

  renderChildren = () => {
    let { children } = this.props;

    const combineProps = {
      graph: this.graph,
      graphDOM: this.graphDOM,
      graphVars: this.state,
      apis: this.getApis(),
    };

    if (!children) {
      return null;
    }

    if (typeof children === 'function') {
      return children(combineProps);
    }

    /**
     * 1. <Graphin> <div> this is text <ContextMenu />  </div> </Graphin>
     * 2. <Graphin> <CustomerComponent> this is text  <ContextMenu /> </CustomerComponent> </Graphin>
     * 3. <Graphin> <Fragment> this is text  <ContextMenu /> </Graphin>
     */
    if (
      React.isValidElement(children) &&
      (String(children.type) === 'Symbol(react.fragment)' || typeof children.type === 'string')
    ) {
      console.error('Please do not wrap components inside dom element or Fragment when using Graphin');
      return children;
    }

    if (!Array.isArray(children)) {
      children = [children];
    }

    return React.Children.map(children, child => {
      // do not pass props if element is a DOM element or not a valid react element.
      if (!React.isValidElement(child) || typeof child.type === 'string') {
        return child;
      }
      return React.cloneElement(child, {
        ...combineProps,
      });
    });
  };

  render() {
    const { isGraphReady } = this.state;
    return (
      <>
        <div
          data-testid="custom-element"
          className="graphin-core"
          ref={node => {
            this.graphDOM = node;
          }}
        />
        <div className="graphin-components">{isGraphReady && this.renderChildren()}</div>
      </>
    );
  }
}
export default Graph;
