import './App.css';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Login from './components/auth/Login';
import { useDispatch, useSelector } from 'react-redux';
import Splash from './components/main/Splash';
import Home from './components/main/Home';
import Register from './components/auth/Register';
import Verification from './components/auth/Verification';
import { useEffect, useRef } from 'react';
import { AuthCheck } from './reusables/hooks/requests';
import Alert from './components/widgets/Alert';
import { SET_PATHNAME_LISTENER, SET_SCREEN_SIZE_LISTENER } from './redux/types';

function App() {

  const authentication = useSelector((state: any) => state.authentication)
  const screensizelistener = useSelector((state: any) => state.screensizelistener)
  const alerts = useSelector((state: any) => state.alerts)
  const dispatch = useDispatch()

  const location = useLocation().pathname

  const scrollDivAlerts = useRef<HTMLDivElement>(null)

  const screensizelistenerTrigger = () => {
    dispatch({ type: SET_SCREEN_SIZE_LISTENER, payload:{
      screensizelistener:{
        W: window.innerWidth,
        H: window.innerHeight
      }
    } })
    // console.log(screensizelistener)
  }

  useEffect(() => {
    AuthCheck(dispatch);
    console.log("v2.1.5.1");
  },[])

  useEffect(() => {
    dispatch({
      type: SET_PATHNAME_LISTENER,
      payload:{
        pathnamelistener: location
      }
    })
    // console.log(location)
  },[location])

  useEffect(() => {
    window.addEventListener("resize", screensizelistenerTrigger)

    return () => {
      window.removeEventListener("resize", screensizelistenerTrigger)
    }

  },[screensizelistener])

  useEffect(() => {
    if(scrollDivAlerts.current){
      const scrollHeight = scrollDivAlerts.current.scrollHeight;
      const clientHeight = scrollDivAlerts.current.clientHeight;
      const maxScrollTop = scrollHeight - clientHeight
      scrollDivAlerts.current.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
    }
  },[alerts, scrollDivAlerts])

  return (
    <div className="App">
      <div id='div_alerts_container' ref={scrollDivAlerts}>
        {alerts.map((al: any, i: number) => {
          return(
            <Alert key={i} al={al} />
          )
        })}
      </div>        
      <Routes>
        <Route path='/*' element={authentication.auth != null? authentication.auth? authentication.user.isVerified? <Home /> : <Navigate to='/verification' /> : <Navigate to='/login' /> : <Splash />} />
        <Route path='/login' element={authentication.auth != null? authentication.auth? authentication.user.isVerified? <Navigate to='/' /> : <Navigate to='/verification' /> : <Login /> : <Splash />} />
        <Route path='/register' element={authentication.auth != null? authentication.auth? authentication.user.isVerified? <Navigate to='/' /> : <Navigate to='/verification' /> : <Register /> : <Splash />} />
        <Route path='/verification' element={authentication.auth != null? authentication.auth? authentication.user.isVerified? <Navigate to='/' /> : <Verification /> : <Navigate to='/login' /> : <Splash />} />
        {/* <Route path='/app/*' element={authentication.auth != null? authentication.auth? authentication.user.isVerified? <Home /> : <Navigate to='/verification' /> : <Navigate to='/login' /> : <Splash />} /> */}
      </Routes>
    </div>
  );
}

export default App;
