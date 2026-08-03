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
    const baseMarket = market.split("_")[0];
    const response = await axios.get(`${BASE_URL}/trades/${baseMarket}?limit=${limit}`);
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
    try {
        const response = await api.get("/balance");
        return response.data;
    } catch (err: any) {
        const errMsg = err.response?.data?.error || err.response?.data?.msg || err.message;
        if (errMsg && typeof errMsg === "string" && (errMsg.includes("user does not deposit") || errMsg.includes("deposit any asset"))) {
            return { data: { userBalance: { availableBalance: "0.00", lockedBalance: "0.00" } } };
        }
        throw err;
    }
}

export async function depositApi(amount: string) {
    const response = await api.post("/onramp", { amount });
    return response.data;
}

export async function withdrawApi(amount: string) {
    const response = await api.post("/withdraw", { amount });
    return response.data;
}

// Order Management Endpoints
export interface CreateOrderParams {
    market: string;
    side: "LONG" | "SHORT";
    type: "limit" | "market";
    price?: string;
    qty: string;
    margin: string;
}

export async function createOrderApi(params: CreateOrderParams) {
    const response = await api.post("/order", params);
    return response.data;
}

export async function deleteOrderApi(orderId: string) {
    const response = await api.delete(`/order?orderId=${orderId}`);
    return response.data;
}

export async function getOrdersApi(market: string) {
    const baseMarket = market.split("_")[0];
    try {
        const response = await api.get(`/orders/${baseMarket}`);
        return response.data;
    } catch (err: any) {
        const errMsg = err.response?.data?.error || err.response?.data?.msg || err.message;
        if (errMsg && typeof errMsg === "string" && (errMsg.includes("user does not deposit") || errMsg.includes("deposit any asset"))) {
            return { data: { orders: [] } };
        }
        throw err;
    }
}

export async function getOpenOrdersApi(market: string) {
    const baseMarket = market.split("_")[0];
    try {
        const response = await api.get(`/orders/open/${baseMarket}`);
        return response.data;
    } catch (err: any) {
        const errMsg = err.response?.data?.error || err.response?.data?.msg || err.message;
        if (errMsg && typeof errMsg === "string" && (errMsg.includes("user does not deposit") || errMsg.includes("deposit any asset"))) {
            return { data: { orders: [] } };
        }
        throw err;
    }
}

export async function getOpenPositionApi(market: string) {
    const baseMarket = market.split("_")[0];
    try {
        const response = await api.get(`/position/open/${baseMarket}`);
        return response.data;
    } catch (err: any) {
        const errMsg = err.response?.data?.error || err.response?.data?.msg || err.message;
        if (errMsg && typeof errMsg === "string" && (errMsg.includes("user does not deposit") || errMsg.includes("deposit any asset"))) {
            return { data: { position: null } };
        }
        throw err;
    }
}

export async function getAllPositionsApi() {
    try {
        const response = await api.get("/position/open");
        return response.data;
    } catch (err: any) {
        const errMsg = err.response?.data?.error || err.response?.data?.msg || err.message;
        if (errMsg && typeof errMsg === "string" && (errMsg.includes("user does not deposit") || errMsg.includes("deposit any asset"))) {
            return { data: { positions: [] } };
        }
        throw err;
    }
}

export async function getFillsApi() {
    try {
        const response = await api.get("/fills");
        return response.data;
    } catch (err: any) {
        const errMsg = err.response?.data?.error || err.response?.data?.msg || err.message;
        if (errMsg && typeof errMsg === "string" && (
            errMsg.includes("user does not deposit") ||
            errMsg.includes("deposit any asset") ||
            errMsg.toLowerCase().includes("fills does not exist")
        )) {
            return { data: [] };
        }
        throw err;
    }
}