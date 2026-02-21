/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Briefcase, 
  Newspaper, 
  ArrowRight, 
  ChevronRight,
  History,
  DollarSign,
  BarChart3,
  X
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { INITIAL_STOCKS, INITIAL_BALANCE } from './constants';
import { Stock, PortfolioItem, NewsItem, GameState } from './types';
import { generateMarketNews } from './services/marketService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    balance: INITIAL_BALANCE,
    portfolio: [],
    stocks: INITIAL_STOCKS,
    news: [],
    day: 1,
  });

  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isTrading, setIsTrading] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [tradeAmount, setTradeAmount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate total portfolio value
  const portfolioValue = useMemo(() => {
    return gameState.portfolio.reduce((total, item) => {
      const stock = gameState.stocks.find(s => s.symbol === item.symbol);
      return total + (stock ? stock.price * item.shares : 0);
    }, 0);
  }, [gameState.portfolio, gameState.stocks]);

  const totalAssets = gameState.balance + portfolioValue;

  const advanceDay = async () => {
    setIsLoading(true);
    const sectors = Array.from(new Set(gameState.stocks.map(s => s.sector))) as string[];
    const newNews = await generateMarketNews(gameState.day + 1, sectors);

    setGameState(prev => {
      const updatedStocks = prev.stocks.map(stock => {
        // Base volatility
        let volatility = (Math.random() - 0.5) * 0.05; // -2.5% to 2.5%
        
        // News impact
        if (newNews.affectedSectors.includes(stock.sector)) {
          volatility += newNews.impact * 0.08; // Up to 8% impact
        }

        const newPrice = Math.max(1, stock.price * (1 + volatility));
        const newHistory = [...stock.history, newPrice].slice(-20);
        const change = ((newPrice - stock.price) / stock.price) * 100;

        return {
          ...stock,
          price: Number(newPrice.toFixed(2)),
          history: newHistory,
          change: Number(change.toFixed(2)),
        };
      });

      return {
        ...prev,
        day: prev.day + 1,
        stocks: updatedStocks,
        news: [newNews, ...prev.news].slice(0, 10),
      };
    });
    setIsLoading(false);
  };

  const handleTrade = () => {
    if (!selectedStock) return;

    const cost = selectedStock.price * tradeAmount;
    
    if (tradeType === 'buy') {
      if (cost > gameState.balance) {
        alert("Insufficient funds!");
        return;
      }

      setGameState(prev => {
        const existing = prev.portfolio.find(p => p.symbol === selectedStock.symbol);
        let newPortfolio;
        
        if (existing) {
          newPortfolio = prev.portfolio.map(p => 
            p.symbol === selectedStock.symbol 
              ? { 
                  ...p, 
                  shares: p.shares + tradeAmount, 
                  averagePrice: (p.averagePrice * p.shares + cost) / (p.shares + tradeAmount) 
                }
              : p
          );
        } else {
          newPortfolio = [...prev.portfolio, { symbol: selectedStock.symbol, shares: tradeAmount, averagePrice: selectedStock.price }];
        }

        return {
          ...prev,
          balance: prev.balance - cost,
          portfolio: newPortfolio
        };
      });
    } else {
      const existing = gameState.portfolio.find(p => p.symbol === selectedStock.symbol);
      if (!existing || existing.shares < tradeAmount) {
        alert("Not enough shares!");
        return;
      }

      setGameState(prev => {
        const newPortfolio = prev.portfolio.map(p => 
          p.symbol === selectedStock.symbol 
            ? { ...p, shares: p.shares - tradeAmount }
            : p
        ).filter(p => p.shares > 0);

        return {
          ...prev,
          balance: prev.balance + cost,
          portfolio: newPortfolio
        };
      });
    }
    setIsTrading(false);
    setTradeAmount(1);
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header / Stats */}
      <header className="border-b border-[#141414] p-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-1">
          <h1 className="font-serif italic text-xs uppercase tracking-widest opacity-50">Market Master</h1>
          <p className="font-mono text-2xl font-bold">DAY {gameState.day}</p>
        </div>
        
        <div className="space-y-1">
          <h2 className="font-serif italic text-xs uppercase tracking-widest opacity-50">Available Balance</h2>
          <p className="font-mono text-2xl font-bold">${gameState.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="space-y-1">
          <h2 className="font-serif italic text-xs uppercase tracking-widest opacity-50">Portfolio Value</h2>
          <p className="font-mono text-2xl font-bold">${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="space-y-1">
          <h2 className="font-serif italic text-xs uppercase tracking-widest opacity-50">Total Assets</h2>
          <p className="font-mono text-2xl font-bold text-[#2E7D32]">${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[calc(100vh-100px)]">
        {/* Left Column: Stocks List */}
        <div className="lg:col-span-4 border-r border-[#141414] overflow-y-auto max-h-[calc(100vh-100px)]">
          <div className="p-4 border-b border-[#141414] flex justify-between items-center bg-[#DCDAD6]">
            <span className="font-serif italic text-xs uppercase tracking-widest opacity-50">Market Listings</span>
            <button 
              onClick={advanceDay}
              disabled={isLoading}
              className="px-4 py-1 bg-[#141414] text-[#E4E3E0] text-xs font-mono uppercase tracking-tighter hover:bg-opacity-80 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? 'Simulating...' : 'Advance Day'} <ArrowRight size={14} />
            </button>
          </div>
          
          <div className="divide-y divide-[#141414]">
            {gameState.stocks.map((stock) => (
              <div 
                key={stock.symbol}
                onClick={() => setSelectedStock(stock)}
                className={cn(
                  "p-6 cursor-pointer transition-all hover:bg-[#141414] hover:text-[#E4E3E0] group",
                  selectedStock?.symbol === stock.symbol && "bg-[#141414] text-[#E4E3E0]"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-mono font-bold text-lg">{stock.symbol}</h3>
                    <p className="text-[10px] uppercase tracking-wider opacity-60">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-lg">${stock.price.toFixed(2)}</p>
                    <p className={cn(
                      "text-[10px] font-mono flex items-center justify-end gap-1",
                      stock.change >= 0 ? "text-[#2E7D32] group-hover:text-[#4ADE80]" : "text-[#C62828] group-hover:text-[#F87171]"
                    )}>
                      {stock.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {Math.abs(stock.change)}%
                    </p>
                  </div>
                </div>
                <div className="h-12 w-full mt-4 opacity-40 group-hover:opacity-100 transition-opacity">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stock.history.map((h, i) => ({ val: h, i }))}>
                      <Area 
                        type="monotone" 
                        dataKey="val" 
                        stroke={stock.change >= 0 ? "#4ADE80" : "#F87171"} 
                        fill={stock.change >= 0 ? "#4ADE8022" : "#F8717122"} 
                        strokeWidth={1.5}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Column: Chart & Details */}
        <div className="lg:col-span-5 border-r border-[#141414] flex flex-col">
          {selectedStock ? (
            <div className="flex-1 flex flex-col">
              <div className="p-8 border-b border-[#141414]">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="text-5xl font-mono font-bold tracking-tighter">{selectedStock.symbol}</h2>
                    <p className="text-sm font-serif italic opacity-60">{selectedStock.name} — {selectedStock.sector}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-mono font-bold">${selectedStock.price.toFixed(2)}</p>
                    <p className={cn(
                      "text-sm font-mono",
                      selectedStock.change >= 0 ? "text-[#2E7D32]" : "text-[#C62828]"
                    )}>
                      {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change}% TODAY
                    </p>
                  </div>
                </div>

                <div className="h-64 w-full bg-white/30 border border-[#141414]/10 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedStock.history.map((h, i) => ({ day: i + 1, price: h }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#14141422" vertical={false} />
                      <XAxis 
                        dataKey="day" 
                        hide 
                      />
                      <YAxis 
                        domain={['auto', 'auto']} 
                        orientation="right" 
                        tick={{ fontSize: 10, fontFamily: 'monospace' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#141414', color: '#E4E3E0', border: 'none', fontFamily: 'monospace', fontSize: '10px' }}
                        itemStyle={{ color: '#E4E3E0' }}
                        labelStyle={{ display: 'none' }}
                      />
                      <Line 
                        type="stepAfter" 
                        dataKey="price" 
                        stroke="#141414" 
                        strokeWidth={2} 
                        dot={false} 
                        activeDot={{ r: 4, fill: '#141414' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-8 grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-serif italic text-xs uppercase tracking-widest opacity-50">Your Position</h4>
                  {gameState.portfolio.find(p => p.symbol === selectedStock.symbol) ? (
                    <div className="space-y-2">
                      <div className="flex justify-between font-mono text-sm">
                        <span>Shares Owned</span>
                        <span className="font-bold">{gameState.portfolio.find(p => p.symbol === selectedStock.symbol)?.shares}</span>
                      </div>
                      <div className="flex justify-between font-mono text-sm">
                        <span>Avg. Cost</span>
                        <span className="font-bold">${gameState.portfolio.find(p => p.symbol === selectedStock.symbol)?.averagePrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-mono text-sm">
                        <span>Market Value</span>
                        <span className="font-bold">${(gameState.portfolio.find(p => p.symbol === selectedStock.symbol)!.shares * selectedStock.price).toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="font-mono text-xs opacity-40">No position in this stock.</p>
                  )}
                </div>

                <div className="flex flex-col justify-end gap-2">
                  <button 
                    onClick={() => { setTradeType('buy'); setIsTrading(true); }}
                    className="w-full py-3 bg-[#141414] text-[#E4E3E0] font-mono uppercase tracking-widest text-sm hover:invert transition-all"
                  >
                    Buy {selectedStock.symbol}
                  </button>
                  <button 
                    onClick={() => { setTradeType('sell'); setIsTrading(true); }}
                    disabled={!gameState.portfolio.find(p => p.symbol === selectedStock.symbol)}
                    className="w-full py-3 border border-[#141414] font-mono uppercase tracking-widest text-sm hover:bg-[#141414] hover:text-[#E4E3E0] transition-all disabled:opacity-30"
                  >
                    Sell {selectedStock.symbol}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30">
              <BarChart3 size={64} strokeWidth={1} className="mb-4" />
              <p className="font-serif italic text-lg">Select a stock to view market data and trade</p>
            </div>
          )}
        </div>

        {/* Right Column: News & Portfolio */}
        <div className="lg:col-span-3 overflow-y-auto max-h-[calc(100vh-100px)]">
          {/* Portfolio Summary */}
          <div className="p-6 border-b border-[#141414] bg-[#DCDAD6]">
            <h3 className="font-serif italic text-xs uppercase tracking-widest opacity-50 mb-4">Portfolio</h3>
            <div className="space-y-3">
              {gameState.portfolio.length > 0 ? (
                gameState.portfolio.map(item => {
                  const stock = gameState.stocks.find(s => s.symbol === item.symbol);
                  return (
                    <div key={item.symbol} className="flex justify-between items-center font-mono text-xs">
                      <span className="font-bold">{item.symbol}</span>
                      <span>{item.shares} SH</span>
                      <span className={cn(
                        stock && stock.price >= item.averagePrice ? "text-[#2E7D32]" : "text-[#C62828]"
                      )}>
                        ${stock ? (stock.price * item.shares).toFixed(2) : '0.00'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-[10px] font-mono opacity-40">Your portfolio is empty.</p>
              )}
            </div>
          </div>

          {/* News Feed */}
          <div className="p-6">
            <h3 className="font-serif italic text-xs uppercase tracking-widest opacity-50 mb-6 flex items-center gap-2">
              <Newspaper size={14} /> Market News
            </h3>
            <div className="space-y-8">
              {gameState.news.length > 0 ? (
                gameState.news.map(news => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={news.id} 
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-mono bg-[#141414] text-[#E4E3E0] px-1 py-0.5">DAY {gameState.day}</span>
                      {news.impact > 0.3 && <span className="text-[8px] font-mono text-[#2E7D32] uppercase">Bullish</span>}
                      {news.impact < -0.3 && <span className="text-[8px] font-mono text-[#C62828] uppercase">Bearish</span>}
                    </div>
                    <h4 className="font-bold text-sm leading-tight">{news.title}</h4>
                    <p className="text-xs opacity-70 leading-relaxed">{news.content}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {news.affectedSectors.map(s => (
                        <span key={s} className="text-[8px] font-mono border border-[#141414]/20 px-1 py-0.5 opacity-50">{s}</span>
                      ))}
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-xs font-serif italic opacity-40">No major news reported yet. Advance the day to see market updates.</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Trading Modal */}
      <AnimatePresence>
        {isTrading && selectedStock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141414]/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#E4E3E0] border-2 border-[#141414] w-full max-w-md overflow-hidden"
            >
              <div className="p-4 border-b-2 border-[#141414] flex justify-between items-center bg-[#141414] text-[#E4E3E0]">
                <h3 className="font-mono font-bold uppercase tracking-widest text-sm">
                  {tradeType} {selectedStock.symbol}
                </h3>
                <button onClick={() => setIsTrading(false)} className="hover:rotate-90 transition-transform">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="font-serif italic text-xs opacity-50 uppercase tracking-widest">Current Price</p>
                    <p className="text-3xl font-mono font-bold">${selectedStock.price.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif italic text-xs opacity-50 uppercase tracking-widest">Available</p>
                    <p className="text-xl font-mono">
                      {tradeType === 'buy' 
                        ? `$${gameState.balance.toLocaleString()}` 
                        : `${gameState.portfolio.find(p => p.symbol === selectedStock.symbol)?.shares || 0} SH`}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block font-serif italic text-xs opacity-50 uppercase tracking-widest">Quantity</label>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setTradeAmount(Math.max(1, tradeAmount - 1))}
                      className="w-12 h-12 border-2 border-[#141414] flex items-center justify-center font-mono text-2xl hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(Math.max(1, parseInt(e.target.value) || 0))}
                      className="flex-1 h-12 border-b-2 border-[#141414] bg-transparent text-center font-mono text-2xl focus:outline-none"
                    />
                    <button 
                      onClick={() => setTradeAmount(tradeAmount + 1)}
                      className="w-12 h-12 border-2 border-[#141414] flex items-center justify-center font-mono text-2xl hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#141414]/20 space-y-2">
                  <div className="flex justify-between font-mono text-sm">
                    <span>Total {tradeType === 'buy' ? 'Cost' : 'Proceeds'}</span>
                    <span className="font-bold">${(selectedStock.price * tradeAmount).toFixed(2)}</span>
                  </div>
                  {tradeType === 'buy' && (
                    <div className="flex justify-between font-mono text-[10px] opacity-50">
                      <span>Remaining Balance</span>
                      <span>${(gameState.balance - selectedStock.price * tradeAmount).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleTrade}
                  className="w-full py-4 bg-[#141414] text-[#E4E3E0] font-mono font-bold uppercase tracking-[0.2em] hover:invert transition-all"
                >
                  Confirm {tradeType}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
