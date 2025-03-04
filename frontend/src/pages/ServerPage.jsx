import { useParams, useNavigate } from 'react-router-dom';
import ServerDetail from '../components/ServerDetail';

function ServerPage({ socket }) {
    const { serverId } = useParams();
    const navigate = useNavigate();

    const goBack = () => {
        navigate('/');
    };

    return (
        <div className="server-page">
            <div className="page-header">
                <h1>Server Details</h1>
                <button type="button" className="btn" onClick={goBack}>
                    Back to Server List
                </button>
            </div>

            <ServerDetail serverId={serverId} socket={socket} />
        </div>
    );
}

export default ServerPage;