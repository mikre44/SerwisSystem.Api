import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import CreateRepair from "./pages/CreateRepair";
import CheckRepair from "./pages/CheckRepair";

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Create repair</Link>
        {" | "}
        <Link to="/check">Check repair</Link>
      </nav>

      <Routes>
        <Route path="/" element={<CreateRepair />} />
        <Route path="/check" element={<CheckRepair />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;