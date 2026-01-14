import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Shell from './layouts/Shell';
import Home from './pages/Home';
import CryptogramGame from './games/cryptogram/CryptogramGame';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Home />} />
          <Route path="/cryptogram" element={<CryptogramGame />} />
          <Route path="/hexenergy" element={<div className="p-10">HexEnergy Placeholder</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
