import React from 'react';
import './App.css';
import Graphin, { Utils } from '@antv/graphin';

import '@antv/graphin/dist/index.css';

const App: React.FC = () => {
    const data = Utils.mock(20)
        .circle()
        .graphin();
    data.nodes.forEach(node => {
        node.style && (node.style.icon = 'home');
    });

    console.log(data);
    return (
        <div className="App">
            <Graphin data={data} layout={{ name: 'force' }} />
        </div>
    );
};

export default App;
