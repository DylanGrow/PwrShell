import './style.css';
import { CmdSite } from './components/CmdSite';

// Mount the exact CMD Challenge application
const appEl = document.querySelector<HTMLDivElement>('#app');
if (appEl) {
  new CmdSite(appEl);
}
