import './App.css';
import Login from './components/jsx/Login';
import Register from './components/jsx/Register';
import {Route, Switch, Routes} from 'react-router-dom';

function App() {
  return (
    <div className="App">
      <Routes>
      <Route path='*' exact element={<Login />}/>
      <Route path='/register' element={<Register />}/>
      </Routes>
    </div>
  );
}

export default App;
