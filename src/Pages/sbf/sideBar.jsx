import "./sidebar.css";
import { Link, useNavigate } from "react-router-dom";
import { FaHome, FaUser, FaChartBar, FaBars } from "react-icons/fa";
import { useState } from "react";

export function SideBar() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('user_id');
        navigate('/');
    };

    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <div className="nav-bar">

            <h1 className='title'>Portfolio Tracker</h1>
            <button className="menu-toggle" onClick={toggleMenu}>
                <FaBars />
            </button>
            <nav className={isOpen ? "active" : ""}>
                <ul>
                    <li className="nav-item">
                        <Link to="/Dashboard" className="nav-link" onClick={() => setIsOpen(false)}>
                            <FaHome className="nav-icon" />
                            <span className="nav-text">Dashboard</span>
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/Stats" className="nav-link" onClick={() => setIsOpen(false)}>
                            <FaChartBar className="nav-icon" />
                            <span className="nav-text">Stats</span>
                        </Link>
                    </li>
                    <li className="nav-item">
                        <button onClick={handleLogout} className="nav-link logout-button" >
                            <FaUser className="nav-icon" />
                            <span className="nav-text">Logout</span>
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );
}

