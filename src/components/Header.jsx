import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'react-feather';

export const Header = ({ 
  user, 
  logo, 
  isMobile, 
  isSidebarOpen, 
  toggleSidebar, 
  showDropdown, 
  setShowDropdown, 
  userMenuRef, 
  logout 
}) => {
  const navigate = useNavigate();

  return (
    <header className="app-header bg-gray-900 border-b border-gray-700">
      <div className="header-content">
        <div className="header-left">
          {isMobile && (
            <button 
              onClick={toggleSidebar}
              className="menu-toggle text-white"
              aria-label="Toggle menu"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
          <div className="logo-wrapper">
            <img src={logo} alt="Company Logo" className="app-logo" />
            <h1 className="app-title text-white">Aureo</h1>
          </div>
        </div>

        <div className="header-right" ref={userMenuRef}>
          <div 
            className="user-menu-container"
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            <button 
              className="profile-button"
              onClick={() => setShowDropdown(!showDropdown)}
              aria-label="User menu"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="profile-image" />
              ) : (
                <div className="profile-fallback">
                  {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </button>

            {showDropdown && (
              <div className="user-dropdown bg-gray-800 border border-gray-700">
                <Link 
                  to="/account" 
                  className="dropdown-item hover:bg-gray-700"
                  onClick={() => setShowDropdown(false)}
                >
                  Account Settings
                </Link>
                <button 
                  onClick={logout}
                  className="dropdown-item hover:bg-gray-700"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};