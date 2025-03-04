import { useState } from 'react';
import ServerList from '../components/ServerList';
import ServerForm from '../components/ServerForm';

function HomePage({ socket }) {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="home-page">
      <div className="page-header">
        <h1>Server Management</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Hide Form' : 'Add Server'}
        </button>
      </div>

      {showAddForm && (
        <ServerForm onServerAdded={() => { }} />
      )}

      <ServerList socket={socket} />
    </div>
  );
}

export default HomePage;