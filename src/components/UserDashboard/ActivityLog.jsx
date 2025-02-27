import React from 'react';
import styled from 'styled-components';

const ActivityLog = ({ logs = [] }) => {
  return (
    <ActivityLogContainer>
      <Title>Activity Log</Title>
      
      <ServerStatusBox>
        <StatusTitle>Server Status</StatusTitle>
        <StatusRow>
          <StatusDot active />
          <StatusText>Connection: Active</StatusText>
        </StatusRow>
        <StatusRow>
          <StatusText>Last Ping: 12 ms</StatusText>
        </StatusRow>
      </ServerStatusBox>
      
      <LogHeader>
        <LogHeaderCell width="100px">Time</LogHeaderCell>
        <LogHeaderCell>Activity</LogHeaderCell>
      </LogHeader>
      
      {logs.length === 0 ? (
        <EmptyLog>No recent activity</EmptyLog>
      ) : (
        <LogEntries>
          {logs.map((log, index) => (
            <LogEntry key={index}>
              <LogTime>{log.time}</LogTime>
              <LogActivity>{log.message || log.activity}</LogActivity>
            </LogEntry>
          ))}
        </LogEntries>
      )}
    </ActivityLogContainer>
  );
};

const ActivityLogContainer = styled.div`
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: bold;
  color: #2c3e50;
  margin: 0 0 15px 0;
`;

const ServerStatusBox = styled.div`
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 20px;
`;

const StatusTitle = styled.h3`
  font-size: 16px;
  font-weight: bold;
  color: #2c3e50;
  margin: 0 0 10px 0;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  margin: 10px 0;
`;

const StatusDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.active ? '#27ae60' : '#e74c3c'};
  margin-right: 10px;
`;

const StatusText = styled.p`
  font-size: 14px;
  color: #2c3e50;
  margin: 0;
`;

const LogHeader = styled.div`
  display: flex;
  background-color: #f1f5f9;
  border-radius: 3px;
  padding: 8px 15px;
  margin-bottom: 5px;
`;

const LogHeaderCell = styled.div`
  font-size: 14px;
  font-weight: bold;
  color: #2c3e50;
  width: ${props => props.width || 'auto'};
`;

const LogEntries = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

const LogEntry = styled.div`
  display: flex;
  padding: 8px 15px;
  border-bottom: 1px solid #ecf0f1;
  
  &:last-child {
    border-bottom: none;
  }
`;

const LogTime = styled.div`
  width: 100px;
  font-size: 12px;
  color: #7f8c8d;
`;

const LogActivity = styled.div`
  font-size: 12px;
  color: #2c3e50;
`;

const EmptyLog = styled.div`
  padding: 20px 0;
  text-align: center;
  color: #7f8c8d;
  font-size: 14px;
`;

export default ActivityLog;