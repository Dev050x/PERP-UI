import axios from "axios";
import { api, BASE_URL } from "./auth";
import { Depth, Kline, Ticker, Trade } from "./types";

// Market Data Endpoints
export async function getDepth(market: string): Promise<Depth> {
    const response = await axios.get(`${BASE_URL}/depth/${market}`);    
    return response.data;
}

export async function getKlines(market: string, interval: string = "1m", startTime?: string | number, limit: number = 500): Promise<Kline[]> {
    let url = `${BASE_URL}/candles/${market}?interval=${interval}&limit=${limit}`;
    if (startTime) {
        url += `&startTime=${startTime}`;
    }
    const response = await axios.get(url);
    return response.data?.data?.candles || response.data;
}

export async function getTrades(market: string, limit: string = "50"): Promise<Trade[]> {
    const response = await axios.get(`${BASE_URL}/trades/${market}?limit=${limit}`);
    return response.data?.data?.trades || response.data;
}

// Authentication Endpoints
export async function signUpApi(username: string, password: string) {
    const response = await api.post("/sign-up", { username, password });
    return response.data;
}

export async function signInApi(username: string, password: string) {
    const response = await api.post("/sign-in", { username, password });
    return response.data;
}

// Balance & Wallet Endpoints
export interface BalanceData {
    availableBalance: string;
    lockedBalance: string;
}

export function extractBalance(res: any): BalanceData {
    const rawObj = res?.data?.userBalance ?? res?.data ?? res?.userBalance ?? res ?? {};
    const avail = rawObj.availableBalance ?? "0";
    const locked = rawObj.lockedBalance ?? "0";
    return {
        availableBalance: typeof avail === "number" ? avail.toString() : (avail || "0"),
        lockedBalance: typeof locked === "number" ? locked.toString() : (locked || "0"),
    };
}

export async function getBalanceApi(): Promise<{ data: any }> {
    const response = await api.get("/balance");
    return response.data;
}

export async function depositApi(amount: string) {
    const response = await api.post("/onramp", { amount });
    return response.data;
}

export async function withdrawApi(amount: string) {
    const response = await api.post("/withdraw", { amount });
    return response.data;
}