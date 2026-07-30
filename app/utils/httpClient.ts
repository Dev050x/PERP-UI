import axios from "axios";
import { Depth, Kline, Ticker, Trade } from "./types";

const BASE_URL = "https://proxy-server-dyjk.onrender.com/api/v1";

//need to create -> depth endpoint - https://api.backpack.exchange/api/v1/depth?symbol=SOL_USDC  type done
export async function getDepth(market: string): Promise<Depth> {
    const response = await axios.get(`${BASE_URL}/depth?symbol=${market}`);    
    return response.data;
}
//neeed to create -> ticker endpoint - https://api.backpack.exchange/api/v1/tickers type done
export async function getTickers(): Promise<Ticker[]> {
    const response = await axios.get(`${BASE_URL}/tickers`);
    return response.data;
}

//need to create -> kline endpoint - https://api.backpack.exchange/api/v1/klines?symbol=SOL_USDC&interval=1month&startTime=1698777000 type done
export async function getKlines(market: string, interval: string, startTime: string): Promise<Kline[]> {
    const response = await axios.get(`${BASE_URL}/klines?symbol=${market}&interval=${interval}&startTime=${startTime}`);
    return response.data;
}

//need to create -> trader endpoint - https://api.backpack.exchange/api/v1/trades?symbol=SOL_USDC&limit250  type done
export async function getTrades(market: string, limit: string): Promise<Trade[]> {
    const response = await axios.get(`${BASE_URL}/trades?symbol=${market}&limit=${limit}`);
    return response.data;
}

export async function getTicker(market: string): Promise<Ticker | undefined> {
    const tickers = await getTickers();
    const ticker = tickers.find(t => t.symbol === market);
    return ticker;
}