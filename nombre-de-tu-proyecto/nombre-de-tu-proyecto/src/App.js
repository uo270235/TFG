import logo from './logo.svg';
import './App.css';
import Editor from './components/editor';
import NavBar from './components/NavBar';

function App() {
  return (
    <div className="app">
      <NavBar></NavBar>
      <h1 className="page-title">Schema (ShEx)</h1>
      <Editor></Editor>
      <div id="svgid"></div>
    </div>
  );
}

export default App;
