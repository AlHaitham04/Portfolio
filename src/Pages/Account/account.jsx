import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './account.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

export function Account() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const validateEmail = (email) => email.includes('@') && email.includes('.');
    const validatePassword = (password) => password.length >= 8;


    const handleSubmit = async (e, currentAction) => {
        e.preventDefault();

        if (!validateEmail(email)) {
            alert("Please enter a valid email address including '@' and '.'");
            return;
        }

        if (currentAction === 'signup' && !validatePassword(password)) {
            alert("Password must be at least 8 characters long");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('https://if0_40248807.infinityfreeapp.com/account.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: currentAction,
                    email,
                    password,
                }),
            });

            const text = await res.text();

            let data;
            try {
                data = JSON.parse(text);
            } catch (jsonErr) {
                alert('Server returned invalid JSON: ' + text);
                setLoading(false);
                return;
            }

            if (data.success) {
                localStorage.setItem('user_id', data.user_id);
                alert(data.message);
                navigate('/Dashboard');
            } else {
                alert(`${currentAction === 'signin' ? 'Sign in' : 'Sign up'} failed: ${data.message}`);
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
        setLoading(false);
    };

    return (
        <div className="sign">
            <h1 className="HomePage">Welcome to Your Portfolio Tracker</h1>
            <div className="page-container">
                <div className="inputs">
                    <h1>Sign In</h1>
                    <form>
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="text"
                                id="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group password-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <FontAwesomeIcon
                                icon={showPassword ? faEyeSlash : faEye}
                                onClick={() => setShowPassword(!showPassword)}
                                className="fa-icon"
                                title={showPassword ? 'Hide password' : 'Show password'}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            />
                        </div>
                        <div className="button-group-wrapper">
                            <button
                                type="submit"
                                onClick={(e) => handleSubmit(e, 'signin')}
                                className="button-group"
                                disabled={loading}
                            >
                                {loading ? 'Please wait...' : 'Sign In'}
                            </button>
                            <button
                                type="submit"
                                onClick={(e) => handleSubmit(e, 'signup')}
                                className="button-group"
                                disabled={loading}
                            >
                                {loading ? 'Please wait...' : 'Sign Up'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
