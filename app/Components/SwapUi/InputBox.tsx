"use client"
import { useState } from "react";

const InputBox = ({ placeholder, isMarket }: { placeholder: string, isMarket: 'limit' | 'market' }) => {
    const [inputValue, setInputValue] = useState('');
    const isDisabled = isMarket === 'market' && placeholder !== "USDC";

    return (
        <input
            type="text"
            className="w-full h-[40px] px-[8px] mx-[3px] rounded-lg border border-[#b0b7c2] bg-transparent text-white focus text-[12px]"
            placeholder={placeholder}
            disabled={isDisabled}
            value={isDisabled ? placeholder : inputValue}
            onChange={(e) => !isDisabled && setInputValue(e.target.value)}
        />
    )
}

export default InputBox