import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import ServerContext from '../contexts/ServerContext';

const Header = ({ appName, version }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activityLogEnabled, setActivityLogEnabled] = useState(true);
  const { currentServer } = useContext(ServerContext);
  const navigate = useNavigate();
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  const toggleActivityLog = () => {
    setActivityLogEnabled(!activityLogEnabled);
  };
  
  const handleNavigation = (path) => {
    navigate(path);
    setMenuOpen(false);
  };
  
  return (
    <HeaderContainer>
      <Logo>{appName} {version}</Logo>
      
      {currentServer && (
        <ServerConnectionIndicator>
          <ConnectionDot />
          <span>Connected to: {currentServer.url} ({currentServer.server_type} Server)</span>
        </ServerConnectionIndicator>
      )}
      
      <MenuButton onClick={toggleMenu}>
        Menu
        <ArrowIcon open={menuOpen} />
      </MenuButton>
      
      {currentServer && (
        <BackButton onClick={() => navigate('/server-management')}>
          ↩ Back to Server List
        </BackButton>
      )}
      
      {menuOpen && (
        <MenuDropdown>
          <MenuItem onClick={() => handleNavigation('/')}>Dashboard</MenuItem>
          {/* <MenuItem onClick={() => handleNavigation('/users-management')}>Users Management</MenuItem> */}
          {/* <MenuItem active onClick={() => handleNavigation('/server-management')}>Server Management</MenuItem> */}
          <MenuItem onClick={() => handleNavigation('/reports')}>Reports</MenuItem>
          <MenuItem onClick={() => handleNavigation('/settings')}>Settings</MenuItem>
          <Divider />
          <MenuItem onClick={toggleActivityLog}>
            Toggle Activity Log
            <ToggleSwitch active={activityLogEnabled}>
              <ToggleButton active={activityLogEnabled} />
            </ToggleSwitch>
          </MenuItem>
        </MenuDropdown>
      )}
    </HeaderContainer>
  );
};

const HeaderContainer = styled.header`
  width: 100%;
  height: 50px;
  background-color: #2c3e50;
  display: flex;
  align-items: center;
  position: relative;
`;

const Logo = styled.h1`
  color: white;
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 0 20px;
`;

const ServerConnectionIndicator = styled.div`
  background-color: #27ae60;
  border-radius: 13px;
  height: 26px;
  display: flex;
  align-items: center;
  padding: 0 15px;
  margin-left: 50px;
  color: white;
  font-size: 14px;
  opacity: 0.9;
`;

const ConnectionDot = styled.div`
  background-color: white;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
`;

const MenuButton = styled.button`
  display: flex;
  align-items: center;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 3px;
  height: 25px;
  padding: 0 10px;
  margin-left: 20px;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background-color: #2980b9;
  }
`;

const ArrowIcon = styled.span`
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-left: 5px;
  position: relative;
  
  &:before {
    content: '';
    position: absolute;
    width: 6px;
    height: 2px;
    background-color: white;
    transform: rotate(${props => props.open ? '45deg' : '-45deg'});
    top: ${props => props.open ? '3px' : '5px'};
    left: 0;
  }
  
  &:after {
    content: '';
    position: absolute;
    width: 6px;
    height: 2px;
    background-color: white;
    transform: rotate(${props => props.open ? '-45deg' : '45deg'});
    top: ${props => props.open ? '3px' : '5px'};
    right: 0;
  }
`;

const BackButton = styled.button`
  background-color: #34495e;
  color: white;
  border: none;
  border-radius: 13px;
  height: 26px;
  padding: 0 15px;
  margin-left: auto;
  margin-right: 20px;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background-color: #2c3e50;
  }
`;

const MenuDropdown = styled.div`
  position: absolute;
  top: 50px;
  left: 160px;
  width: 200px;
  background-color: white;
  border-radius: 5px;
  border: 1px solid #ddd;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  z-index: 1000;
  opacity: 0.95;
`;

const MenuItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  font-size: 14px;
  color: #2c3e50;
  cursor: pointer;
  background-color: ${props => props.active ? '#f5f7fa' : 'white'};
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  
  &:hover {
    background-color: #f5f7fa;
  }
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background-color: #ddd;
  margin: 5px 0;
`;

const ToggleSwitch = styled.div`
  width: 20px;
  height: 10px;
  background-color: ${props => props.active ? '#3498db' : '#bdc3c7'};
  border-radius: 5px;
  position: relative;
`;

const ToggleButton = styled.div`
  width: 10px;
  height: 10px;
  background-color: white;
  border-radius: 50%;
  position: absolute;
  left: ${props => props.active ? '10px' : '0'};
  transition: left 0.2s;
`;

export default Header;