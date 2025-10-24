import React, { useState, useEffect } from 'react';
import './dashboard.css';
import { SideBar } from '../sbf/sideBar';

export function Dashboard() {
    const [ticker, setTicker] = useState('');
    const [shares, setShares] = useState('');
    const [price, setPrice] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [portfolio, setPortfolio] = useState({});
    const [livePrices, setLivePrices] = useState({});

    const API_URL = 'https://alhaithamportfolio.xo.je/pages/account.php';

    const validateInput = () => {
        if (ticker.trim().length === 0) {
            alert('Please enter a stock ticker.');
            return false;
        }
        if (ticker.length > 5) {
            alert('Ticker cannot be more than 5 characters.');
            return false;
        }
        if (!shares || isNaN(shares) || Number(shares) <= 0) {
            alert('Please enter a valid number of shares.');
            return false;
        }
        if (!price || isNaN(price) || Number(price) <= 0) {
            alert('Please enter a valid price.');
            return false;
        }
        return true;
    };

    const handleTransaction = async (type) => {
        if (!validateInput()) return;

        const user_id = localStorage.getItem('user_id');
        if (!user_id) {
            alert('User not logged in. Please sign in again.');
            return;
        }

        const sharesNum = Number(shares);
        const priceNum = Number(price);

        if (type === 'sell') {
            const currentHolding = portfolio[ticker]?.shares || 0;
            if (sharesNum > currentHolding) {
                alert(`You are trying to sell ${sharesNum} shares of ${ticker}, but you only own ${currentHolding}.`);
                return;
            }
        }

        const payload = {
            user_id: parseInt(user_id),
            ticker,
            shares: sharesNum,
            price: priceNum,
            type,
        };

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (data.success) {
                alert(`${type === 'buy' ? 'Purchase' : 'Sell'} complete: ${shares} shares of ${ticker} at $${price}.`);
                setTicker('');
                setShares('');
                setPrice('');
                fetchTransactions();
            } else {
                alert('Transaction failed.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Server error.');
        }
    };

    const fetchTransactions = async () => {
        const user_id = localStorage.getItem('user_id');
        if (!user_id) {
            alert('User not logged in. Please sign in again.');
            return;
        }

        try {
            const res = await fetch(`${API_URL}?user_id=${user_id}`);
            const data = await res.json();
            setTransactions(data);
            calculatePortfolio(data);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        }
    };

    const calculatePortfolio = (txs) => {
        const port = {};

        txs.forEach(({ ticker, shares, price, type }) => {
            if (!port[ticker]) {
                port[ticker] = { shares: 0, totalCost: 0 };
            }

            const multiplier = type === 'buy' ? 1 : -1;
            port[ticker].shares += shares * multiplier;
            if (type === 'buy') port[ticker].totalCost += price * shares;
        });

        setPortfolio(port);
        fetchLivePrices(Object.keys(port));
    };

    const fetchLivePrices = async (symbols) => {
        if (symbols.length === 0) return;

        try {
            const res = await fetch(`${API_URL}?prices=${symbols.join(',')}`);
            const data = await res.json();

            const prices = {};
            Object.entries(data).forEach(([symbol, price]) => {
                prices[symbol] = parseFloat(price);
            });

            setLivePrices(prices);
        } catch (error) {
            console.error('Failed to fetch live prices:', error);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    useEffect(() => {
        const symbols = Object.keys(portfolio);
        if (symbols.length === 0) return;

        const interval = setInterval(() => {
            fetchLivePrices(symbols);
        }, 60000);

        return () => clearInterval(interval);
    }, [portfolio]);

    return (
        <div>
            <SideBar />
            <div className="Dashboard">
                <div className="left-column">
                    <div className="inputs1">
                        <h1>Manage Portfolio</h1>

                        <div className="form-group1">
                            <label>Enter the Stock Name:</label>
                            <input
                                type="text"
                                placeholder="e.g., AAPL"
                                value={ticker}
                                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                                maxLength={5}
                            />
                        </div>

                        <div className="form-group1">
                            <label>Enter the number of shares:</label>
                            <input
                                type="number"
                                placeholder="e.g., 10"
                                value={shares}
                                onChange={(e) => setShares(e.target.value)}
                            />
                        </div>

                        <div className="form-group1">
                            <label>Enter current price:</label>
                            <input
                                type="number"
                                placeholder="e.g., 150"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                            />
                        </div>

                        <div className="button-group1">
                            <button onClick={() => handleTransaction('buy')}>Buy</button>
                            <button onClick={() => handleTransaction('sell')}>Sell</button>
                        </div>
                    </div>

                    <div className="pBreakdown">
                        <h1>Portfolio Breakdown</h1>
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Stock</th>
                                        <th>Number of Shares</th>
                                        <th>Average Cost</th>
                                        <th>Total Cost</th>
                                        <th>Current Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(portfolio).map(([symbol, data]) => {
                                        if (data.shares <= 0) return null;
                                        const avgCost = data.totalCost / data.shares;
                                        const currentPrice = livePrices[symbol] || 0;
                                        const currentValue = currentPrice * data.shares;

                                        return (
                                            <tr key={symbol}>
                                                <td>{symbol}</td>
                                                <td>{data.shares}</td>
                                                <td>${avgCost.toFixed(2)}</td>
                                                <td>${data.totalCost.toFixed(2)}</td>
                                                <td>
                                                    {currentPrice
                                                        ? `$${currentValue.toFixed(2)}`
                                                        : 'Loading...'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="viewOrders">
                    <h1 className="YRT">Your recent transactions</h1>
                    <div className="table-wrapper2">
                        <table>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Stock</th>
                                    <th>Shares</th>
                                    <th>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx) => (
                                    <tr key={tx.id}>
                                        <td>{tx.type}</td>
                                        <td>{tx.ticker}</td>
                                        <td>{tx.shares}</td>
                                        <td>${Number(tx.price).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
