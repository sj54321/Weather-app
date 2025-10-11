import React from 'react';

function Navbar({ darkMode, toggleDarkMode }) {
  return (
    <nav className={`navbar ${darkMode ? 'dark-mode' : ''}`}>
      <div className="brand">Weather_Forcast</div>
      {/* <button className="dark-mode-toggle" onClick={toggleDarkMode}>
        {darkMode ? '☀️' : '🌙'}
      </button> */}
      <button className="dark-mode-toggle" onClick={toggleDarkMode}>
  <img
    src={`/icons/${darkMode ? 'sun.svg' : 'moon.svg'}`}
    alt={darkMode ? 'Sun' : 'Moon'}
  />
</button>
    </nav>
  );
}

export default Navbar;

