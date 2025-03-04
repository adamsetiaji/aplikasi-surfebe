import { Link } from 'react-router-dom';

function Header({ isConnected }) {
  return (
    <header className="header">
      <div className="header-container">
        <h1>
          <Link to="/">Aplikasi ABC v.1.0.0</Link>
        </h1>
        <div className="connection-status">
        <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
    </header>
  ); 
}

export default Header;