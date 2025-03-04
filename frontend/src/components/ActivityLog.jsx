import { useState, useEffect } from 'react';
import api from '../services/api';

function ActivityLog({ serverId, socket }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setLoading(true);
                const data = await api.getServerLogs(serverId);
                setLogs(data);
                setError(null);
            } catch (err) {
                setError('Failed to fetch activity logs');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [serverId]);

    // Listen for log updates
    useEffect(() => {
        if (!socket) return;

        const handleLogsUpdated = (data) => {
            if (data.server_id === serverId) {
                setLogs(data.logs);
            }
        };

        socket.on('activity_log_updated', handleLogsUpdated);

        return () => {
            socket.off('activity_log_updated', handleLogsUpdated);
        };
    }, [socket, serverId]);

    if (loading) return <div>Loading logs...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="activity-log">
            {logs.length === 0 ? (
                <p>No activity logs found.</p>
            ) : (
                <ul className="log-list">
                    {logs.map((log, index) => (
                        <li key={`log-${log.time}-${index}`} className="log-entry">
                            <span className="log-time">{log.time}</span>
                            <span className="log-activity">{log.activity}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default ActivityLog;