import { Stock } from './types';

export const INITIAL_STOCKS: Stock[] = [
  {
    symbol: 'TECH',
    name: 'TechNova Solutions',
    price: 150.25,
    history: [145, 148, 150.25],
    change: 1.5,
    sector: 'Technology',
  },
  {
    symbol: 'ENER',
    name: 'Global Energy Corp',
    price: 85.50,
    history: [88, 86, 85.50],
    change: -0.6,
    sector: 'Energy',
  },
  {
    symbol: 'BIO',
    name: 'BioGenix Labs',
    price: 42.10,
    history: [40, 41.5, 42.10],
    change: 1.4,
    sector: 'Healthcare',
  },
  {
    symbol: 'FIN',
    name: 'Apex Financial Group',
    price: 210.75,
    history: [215, 212, 210.75],
    change: -1.2,
    sector: 'Finance',
  },
  {
    symbol: 'AUTO',
    name: 'Volt Motors',
    price: 65.30,
    history: [60, 62, 65.30],
    change: 5.3,
    sector: 'Consumer Goods',
  },
  {
    symbol: 'FOOD',
    name: 'Organic Harvest',
    price: 25.40,
    history: [24.5, 25, 25.40],
    change: 1.6,
    sector: 'Consumer Goods',
  },
];

export const INITIAL_BALANCE = 10000;
