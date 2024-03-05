import React from "react";

export const KameContext = React.createContext<{
    Dark:string,
    Bg:string,
    Accent:string,
    LightAccent:string,
    Main:string,
    Grey:string,
    Popup:CallableFunction
}>({
    Dark: "rgb(0,0,0)",
    Bg: "rgba(255,255,255,0.9)",
    Accent: "pink",
    LightAccent: "rgb(252, 233, 236)",
    Main: "red",
    Grey: "#FAFAFA",
    Popup:()=>{}
});