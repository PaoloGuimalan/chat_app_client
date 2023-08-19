import logo from './logo.svg';
import './App.css';
import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './components/auth/Login';
import { useDispatch, useSelector } from 'react-redux';
import Splash from './components/main/Splash';
import Home from './components/main/Home';
import Register from './components/auth/Register';
import Verification from './components/auth/Verification';
import { useEffect } from 'react';
import { AuthCheck } from './reusables/hooks/requests';

function App() {

  const authentication = useSelector(state => state.authentication)
  const dispatch = useDispatch()

  useEffect(() => {
    AuthCheck(authentication, dispatch)
  },[])

  return (
    <div className="App">
      <Routes>
        <Route path='/' element={authentication.auth != null? authentication.auth? <Navigate to='/home' /> : <Navigate to='/login' /> : <Splash />} />
        <Route path='/login' element={authentication.auth != null? authentication.auth? <Navigate to='/home' /> : <Login /> : <Splash />} />
        <Route path='/register' element={authentication.auth != null? authentication.auth? <Navigate to='/home' /> : <Register /> : <Splash />} />
        <Route path='/verification' element={authentication.auth != null? authentication.auth? <Navigate to='/home' /> : <Verification /> : <Splash />} />
        <Route path='/home/*' element={authentication.auth != null? authentication.auth? <Home /> : <Navigate to='/login' /> : <Splash />} />
      </Routes>
    </div>
  );
}

export default App;
