import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SideBar } from '../sbf/sideBar';
import './stats.css';

export function Stats() {
    const [transactions, setTransactions] = useState([]);
    const [distributionData, setDistributionData] = useState([]);
    const [profitLoss, setProfitLoss] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const API_URL = 'http://localhost:5000';
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6384'];

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchTransactions = async () => {
        const user_id = localStorage.getItem('user_id');
        if (!user_id) return;
        try {
            const res = await fetch(`${API_URL}/portfolio/transactions?user_id=${user_id}`);
            const data = await res.json();
            setTransactions(data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    useEffect(() => {
        if (!transactions.length) return;
        const portfolio = {};
        const profitLossMap = {};

        transactions.forEach(tx => {
            const { ticker, shares, price, type } = tx;
            if (!portfolio[ticker]) portfolio[ticker] = { shares: 0, totalCost: 0 };
            if (!profitLossMap[ticker]) profitLossMap[ticker] = { bought: 0, sold: 0, net: 0 };

            if (type === 'buy') {
                portfolio[ticker].shares += shares;
                portfolio[ticker].totalCost += shares * price;
                profitLossMap[ticker].bought += shares * price;
            }

            if (type === 'sell') {
                const avgCost = portfolio[ticker].shares + shares > 0
                    ? portfolio[ticker].totalCost / (portfolio[ticker].shares + shares)
                    : 0;
                portfolio[ticker].shares -= shares;
                portfolio[ticker].totalCost -= shares * avgCost;
                profitLossMap[ticker].sold += shares * price;
            }

            profitLossMap[ticker].net = profitLossMap[ticker].sold - profitLossMap[ticker].bought;
        });

        const totalValue = Object.values(portfolio).reduce((acc, p) => acc + p.totalCost, 0);
        const pieData = Object.entries(portfolio)
            .filter(([_, info]) => info.shares > 0)
            .map(([ticker, info]) => ({
                name: ticker,
                value: info.totalCost,
                percentage: ((info.totalCost / totalValue) * 100).toFixed(1)
            }));

        const plData = Object.entries(profitLossMap).map(([ticker, data]) => ({ ticker, ...data }));

        setDistributionData(pieData);
        setProfitLoss(plData);
    }, [transactions]);

    return (
        <div>
            <SideBar />
            <div className="stats">
                <div className='distribution'>
                    <h1 className='ID'>Investment Distribution</h1>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={isMobile ? 320 : 500}>
                            <PieChart>
                                <Pie
                                    data={distributionData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={isMobile ? 100 : 200}
                                    fill="#8884d8"
                                >
                                    {distributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div style={{
                                                    background: 'rgba(20, 25, 30, 0.75)',
                                                    color: '#00C49F',
                                                    padding: '5px 10px',
                                                    borderRadius: '8px',
                                                    fontSize: '0.8rem',
                                                    textShadow: '0 0 5px rgba(0,196,159,0.6)',
                                                }}>
                                                    {payload[0].name} — ${payload[0].value.toFixed(2)}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend
                                    layout={isMobile ? "horizontal" : "vertical"}
                                    verticalAlign={isMobile ? "bottom" : "middle"}
                                    align={isMobile ? "center" : "right"}
                                    wrapperStyle={{
                                        marginTop: 0,
                                        fontSize: isMobile ? '0.8rem' : '1rem',
                                        maxWidth: isMobile ? '100%' : 'auto',
                                        overflowX: isMobile ? 'auto' : 'hidden',
                                        whiteSpace: isMobile ? 'nowrap' : 'normal',
                                    }}
                                    formatter={(value) => {
                                        const item = distributionData.find(d => d.name === value);
                                        return `${value} — ${item ? item.percentage : 0}%`;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className='profit'>
                    <h1>Profit & Loss</h1>
                    <table>
                        <thead>
                            <tr>
                                <th>Stock</th>
                                <th>Bought</th>
                                <th>Sold</th>
                                <th>Net P/L</th>
                            </tr>
                        </thead>
                        <tbody>
                            {profitLoss.map(stock => (
                                <tr key={stock.ticker}>
                                    <td>{stock.ticker}</td>
                                    <td>${stock.bought.toFixed(2)}</td>
                                    <td>${stock.sold.toFixed(2)}</td>
                                    <td style={{ color: stock.net >= 0 ? 'green' : 'red' }}>
                                        ${stock.net.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
