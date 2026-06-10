import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "react-loading-skeleton/dist/skeleton.css";
import "./reusables/design/theme.css";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./redux/store";
import { ThemeProvider } from "./reusables/design";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Router>
    <Provider store={store}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Provider>
  </Router>,
);
