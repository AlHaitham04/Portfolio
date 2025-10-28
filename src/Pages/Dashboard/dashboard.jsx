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

    // Replace with your deployed backend URL when not using localhost
    const API_URL = 'http://localhost:5000';

    // --- Validate user input ---
    const validateInput = () => {
        if (!ticker.trim()) {
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

    // --- Handle Buy / Sell Transactions ---
    const handleTransaction = async (type) => {
        if (!validateInput()) return;

        const user_id = localStorage.getItem('user_id');
        if (!user_id) {
            alert('User not logged in. Please sign in again.');
            return;
        }

        const normalizedTicker = ticker.trim().toUpperCase();
        const sharesNum = Number(shares);
        const priceNum = Number(price);

        if (type === 'sell') {
            const currentHolding = portfolio[normalizedTicker]?.shares || 0;
            if (sharesNum > currentHolding) {
                alert(
                    `You are trying to sell ${sharesNum} shares of ${normalizedTicker}, but you only own ${currentHolding}.`
                );
                return;
            }
        }

        const payload = {
            user_id: parseInt(user_id),
            ticker: normalizedTicker,
            shares: sharesNum,
            price: priceNum,
            type,
        };

        try {
            const res = await fetch(`${API_URL}/transaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (data.success) {
                alert(`${type === 'buy' ? 'Purchase' : 'Sell'} complete: ${sharesNum} shares of ${normalizedTicker} at $${priceNum}.`);
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

    // --- Fetch all transactions for user ---
    const fetchTransactions = async () => {
        const user_id = localStorage.getItem('user_id');
        if (!user_id) return;

        try {
            const res = await fetch(`${API_URL}/transactions?user_id=${user_id}`);
            const data = await res.json();
            setTransactions(data);
            calculatePortfolio(data);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        }
    };

    // --- Calculate Portfolio from transactions ---
    const calculatePortfolio = (txs) => {
        const port = {};
        const sortedTxs = [...txs].sort((a, b) => a.id - b.id);

        sortedTxs.forEach(({ ticker, shares, price, type }) => {
            if (!port[ticker]) port[ticker] = { shares: 0, totalCost: 0 };

            if (type === 'buy') {
                port[ticker].shares += shares;
                port[ticker].totalCost += price * shares;
            } else if (type === 'sell') {
                const avgCost = port[ticker].shares > 0 ? port[ticker].totalCost / port[ticker].shares : 0;
                port[ticker].shares -= shares;
                port[ticker].totalCost -= avgCost * shares;

                if (port[ticker].shares < 0) port[ticker].shares = 0;
                if (port[ticker].totalCost < 0) port[ticker].totalCost = 0;
            }
        });

        setPortfolio(port);
        fetchLivePrices(Object.keys(port));
    };

    // --- Fetch live prices for portfolio symbols ---
    const fetchLivePrices = async (symbols) => {
        if (!symbols.length) return;

        try {
            const pricesObj = {};
            for (let symbol of symbols) {
                const res = await fetch(`${API_URL}/price?price=${symbol}`);
                const data = await res.json();
                pricesObj[symbol] = data.price || 0;
            }
            setLivePrices(pricesObj);
        } catch (error) {
            console.error('Failed to fetch live prices:', error);
        }
    };

    // --- Initial fetch ---
    useEffect(() => {
        fetchTransactions();
    }, []);

    // --- Auto refresh live prices every minute ---
    useEffect(() => {
        const symbols = Object.keys(portfolio);
        if (!symbols.length) return;

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
                                                    {currentPrice ? `$${currentValue.toFixed(2)}` : 'Loading...'}
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
