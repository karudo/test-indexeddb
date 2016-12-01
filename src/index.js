import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

import {keyValue, log} from './idb';

window.kv = keyValue;
window.logg = log;

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
