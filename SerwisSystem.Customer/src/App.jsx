import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";

import CreateRepair from "./pages/CreateRepair";
import CheckRepair from "./pages/CheckRepair";

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell customer-app">
      <header className="site-header">
        <a className="brand" href="/"><img src="/logo_mentor4.svg" alt="Mentor Polska" width="220" /><small>Centrum obsługi serwisowej</small></a>
      <nav aria-label="Nawigacja klienta">
        <NavLink to="/" end>Zgłoś naprawę</NavLink>

        <NavLink to="/check">Sprawdź naprawę</NavLink>
      </nav>
      </header>
      <main className="app-content">

      <Routes>
        <Route path="/" element={<CreateRepair />} />
        <Route path="/check" element={<CheckRepair />} />
      </Routes>
      </main>
      <footer className="site-footer">SerwisSystem <span>Zgłoszenia i status napraw</span></footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
