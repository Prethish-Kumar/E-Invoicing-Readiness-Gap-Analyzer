import { Routes, Route } from 'react-router-dom';
import Home from './components/Home.jsx';
import SharePage from './components/SharePage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/share/:id" element={<SharePage />} />
    </Routes>
  );
}
