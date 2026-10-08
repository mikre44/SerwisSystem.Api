import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import CreateRepair from "./pages/CreateRepair";
import CheckRepair from "./pages/CheckRepair";

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Zgłoś naprawę</Link>
        {" | "}
        <Link to="/check">Sprawdź naprawę</Link>
      </nav>

      <Routes>
        <Route path="/" element={<CreateRepair />} />
        <Route path="/check" element={<CheckRepair />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
