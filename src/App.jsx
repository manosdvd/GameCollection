import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Shell from './layouts/Shell';
import Home from './pages/Home';
import CryptogramGame from './games/cryptogram/CryptogramGame';
import HexEnergyGame from './games/hexenergy/HexEnergyGame';
import AnxietyGame from './games/anxiety/AnxietyGame';
import LightsOutGame from './games/lightsout/LightsOutGame';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Home />} />
          <Route path="/cryptogram" element={<CryptogramGame />} />
          <Route path="/hexenergy" element={<HexEnergyGame />} />
          <Route path="/anxiety" element={<AnxietyGame />} />
          <Route path="/lightsout" element={<LightsOutGame />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
