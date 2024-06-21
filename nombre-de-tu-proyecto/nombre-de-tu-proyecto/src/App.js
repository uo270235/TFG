import logo from './logo.svg';
import './App.css';
import Editor from './components/editor';
import NavBar from './components/NavBar';

function App() {
  return (
    <div className="app">
      <NavBar></NavBar>
      <Editor></Editor>
    </div>
  );
}

export default App;
