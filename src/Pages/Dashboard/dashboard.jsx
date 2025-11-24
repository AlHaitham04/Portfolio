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
    const API_URL = 'http://localhost:5000';

    const validateInput = () => {
        if (!ticker.trim()) return false;
        if (ticker.length > 5) return false;
        if (!shares || isNaN(shares) || Number(shares) <= 0) return false;
        if (!price || isNaN(price) || Number(price) <= 0) return false;
        return true;
    };

    const handleTransaction = async (type) => {
        if (!validateInput()) return alert('Invalid input');
        const user_id = localStorage.getItem('user_id');
        if (!user_id) return alert('User not logged in');

        const normalizedTicker = ticker.trim().toUpperCase();
        const sharesNum = Number(shares);
        const priceNum = Number(price);

        if (type === 'sell') {
            const currentHolding = portfolio[normalizedTicker]?.shares || 0;
            if (sharesNum > currentHolding) return alert('Not enough shares to sell');
        }

        const payload = { user_id: parseInt(user_id), ticker: normalizedTicker, shares: sharesNum, price: priceNum, type };

        try {
            const res = await fetch(`${API_URL}/portfolio/transaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                setTicker('');
                setShares('');
                setPrice('');
                fetchTransactions();
            } else {
                alert('Transaction failed');
            }
        } catch (error) {
            console.error(error);
            alert('Server error');
        }
    };

    const fetchTransactions = async () => {
        const user_id = localStorage.getItem('user_id');
        if (!user_id) return;

        try {
            const res = await fetch(`${API_URL}/portfolio/transactions?user_id=${user_id}`);
            if (!res.ok) throw new Error('Failed to fetch transactions');
            const data = await res.json();
            if (!Array.isArray(data)) throw new Error('Invalid data format');
            setTransactions(data);
            calculatePortfolio(data);
        } catch (error) {
            console.error(error);
            setTransactions([]);
            setPortfolio({});
        }
    };

    const calculatePortfolio = (txs) => {
        const port = {};
        txs.forEach(({ ticker, shares, price, type }) => {
            if (!port[ticker]) port[ticker] = { shares: 0, totalCost: 0 };
            if (type === 'buy') {
                port[ticker].shares += shares;
                port[ticker].totalCost += shares * price;
            } else if (type === 'sell') {
                const avgCost = port[ticker].shares ? port[ticker].totalCost / port[ticker].shares : 0;
                port[ticker].shares -= shares;
                port[ticker].totalCost -= avgCost * shares;
                if (port[ticker].shares < 0) port[ticker].shares = 0;
                if (port[ticker].totalCost < 0) port[ticker].totalCost = 0;
            }
        });
        setPortfolio(port);
        fetchLivePrices(Object.keys(port));
    };

    const fetchLivePrices = async (symbols) => {
        if (!symbols.length) return;
        try {
            const pricesObj = {};
            await Promise.all(symbols.map(async (symbol) => {
                const res = await fetch(`${API_URL}/portfolio/price?price=${symbol}`);
                const data = await res.json();
                pricesObj[symbol] = parseFloat(data.price) || 0;
            }));
            setLivePrices(pricesObj);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    useEffect(() => {
        const symbols = Object.keys(portfolio);
        if (!symbols.length) return;
        const interval = setInterval(() => fetchLivePrices(symbols), 60000);
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
                            <input type="text" placeholder="e.g., AAPL" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} maxLength={5} />
                        </div>
                        <div className="form-group1">
                            <label>Enter the number of shares:</label>
                            <input type="number" placeholder="e.g., 10" value={shares} onChange={(e) => setShares(e.target.value)} />
                        </div>
                        <div className="form-group1">
                            <label>Enter current price:</label>
                            <input type="number" placeholder="e.g., 150" value={price} onChange={(e) => setPrice(e.target.value)} />
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
                                        return (
                                            <tr key={symbol}>
                                                <td>{symbol}</td>
                                                <td>{data.shares}</td>
                                                <td>${avgCost.toFixed(2)}</td>
                                                <td>${data.totalCost.toFixed(2)}</td>
                                                <td>${(currentPrice * data.shares).toFixed(2)}</td>
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
