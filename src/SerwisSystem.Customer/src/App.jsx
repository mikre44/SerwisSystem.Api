import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import CreateRepair from "./pages/CreateRepair";
import CheckRepair from "./pages/CheckRepair";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<CreateRepair />} />
        <Route path="/check" element={<CheckRepair />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
