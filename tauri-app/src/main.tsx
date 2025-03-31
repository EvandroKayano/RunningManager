import React from "react";
import ReactDOM from "react-dom/client";
import {Provider} from "./components/ui/provider";
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import EditRun from "./views/EditRun.tsx";
import Home from "./views/Home.tsx";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />}/>
          <Route path="/edit-race/:id" element={<EditRun />}/>
        </Routes>
      </Router>
    </Provider>
  </React.StrictMode>,
);
