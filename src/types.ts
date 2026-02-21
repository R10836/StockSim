export interface Stock {
  symbol: string;
  name: string;
  price: number;
  history: number[];
  change: number;
  sector: string;
}

export interface PortfolioItem {
  symbol: string;
  shares: number;
  averagePrice: number;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  impact: number; // -1 to 1
  affectedSectors: string[];
  timestamp: Date;
}

export interface GameState {
  balance: number;
  portfolio: PortfolioItem[];
  stocks: Stock[];
  news: NewsItem[];
  day: number;
}
