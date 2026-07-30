const Button = ({ color, label }: { color: string, label: string }) => {
    return (
        <button className={`w-full h-[40px] ${color} text-black font-bold rounded-lg hover:opacity-90 mx-[2px]`}>
            {label}
        </button>
    )
}

export default Button