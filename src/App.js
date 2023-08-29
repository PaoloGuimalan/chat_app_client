import logo from './logo.svg';
import './App.css';
import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './components/auth/Login';
import { useDispatch, useSelector } from 'react-redux';
import Splash from './components/main/Splash';
import Home from './components/main/Home';
import Register from './components/auth/Register';
import Verification from './components/auth/Verification';
import { useEffect, useRef } from 'react';
import { AuthCheck } from './reusables/hooks/requests';
import Alert from './components/widgets/Alert';

function App() {

  const authentication = useSelector(state => state.authentication)
  const alerts = useSelector(state => state.alerts)
  const dispatch = useDispatch()

  const scrollDivAlerts = useRef(null)

  useEffect(() => {
    AuthCheck(authentication, dispatch)
    console.log("v2.3.2")
  },[])

  useEffect(() => {
    const scrollHeight = scrollDivAlerts.current.scrollHeight;
    const clientHeight = scrollDivAlerts.current.clientHeight;
    const maxScrollTop = scrollHeight - clientHeight
    scrollDivAlerts.current.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
  },[alerts, scrollDivAlerts])

  return (
    <div className="App">
      <div id='div_alerts_container' ref={scrollDivAlerts}>
        {alerts.map((al, i) => {
          return(
            <Alert key={i} al={al} />
          )
        })}
      </div>        
      <Routes>
        <Route path='/' element={authentication.auth != null? authentication.auth? authentication.user.isVerified? <Navigate to='/app' /> : <Navigate to='/verification' /> : <Navigate to='/login' /> : <Splash />} />
        <Route path='/login' element={authentication.auth != null? authentication.auth? authentication.user.isVerified? <Navigate to='/app' /> : <Navigate to='/verification' /> : <Login /> : <Splash />} />
        <Route path='/register' element={authentication.auth != null? authentication.auth? authentication.user.isVerified? <Navigate to='/app' /> : <Navigate to='/verification' /> : <Register /> : <Splash />} />
        <Route path='/verification' element={authentication.auth != null? authentication.auth? authentication.user.isVerified? <Navigate to='/app' /> : <Verification /> : <Navigate to='/login' /> : <Splash />} />
        <Route path='/app/*' element={authentication.auth != null? authentication.auth? authentication.user.isVerified? <Home /> : <Navigate to='/verification' /> : <Navigate to='/login' /> : <Splash />} />
      </Routes>
    </div>
  );
}

export default App;
