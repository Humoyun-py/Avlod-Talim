import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initSavedTheme } from './utils/theme';

initSavedTheme();

createRoot(document.getElementById('root')!).render(<App />);
