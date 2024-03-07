import React from "react"
import Svg, { SvgProps, Path, Polygon } from "react-native-svg"
import {KameContext} from "./KameContext";

export interface ISvgProps extends SvgProps {
  xmlns?: string;
  xmlnsXlink?: string;
  xmlSpace?: string;
  svgXmlData?:string;
  faction?:string;
  scale?:number;
  offset?:{
    top?:number;
    left?:number;
    width?:string;
    height?:string;
  }
}
//svgComp.tsx
const SvgComp= (props: ISvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.offset&&props.offset.height?props.offset.height:"100%"}
    height={props.offset&&props.offset.width?props.offset.width:"100%"}
    preserveAspectRatio="xMinYMin slice"
    viewBox="0 0 1000 1000"
    xmlSpace="preserve"
    style={{left:props.offset?.left, top:props.offset?.top}}
    {...props}>
  </Svg>
);

export class Background extends React.Component<ISvgProps> {
  static contextType = KameContext; 
  declare context: React.ContextType<typeof KameContext>;
    render(){
        return <SvgComp xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" {...this.props} fill={this.context.LightAccent} height={250*(this.props.scale??1)} width={250*(this.props.scale??1)} stroke={this.context.Main} strokeWidth={5}>
        <Polygon points="111.823,0 16.622,111.823 111.823,223.646 207.025,111.823 "/>
    </SvgComp>
    }
}

export class FactionSvg extends React.Component<ISvgProps> {
  static contextType = KameContext; 
  declare context: React.ContextType<typeof KameContext>;
    render(){
        let fill;
        let offset;
        switch (this.props.faction) {
            case "Adepta Sororitas":
                fill= <Path d="M503.813 402.866c-9.417-56.663-44.217-82.538-90.973-85.159-28.331-1.556-65.506 9.662-93.101 33.818C332.185 320 357.733 240.737 333.332 145.18 314.499 71.73 274.949 23.091 253.332 0c-21.536 23.091-61.167 71.73-79.918 145.18-25.548 99.733 3.52 181.78 15.148 210.275-28.004-26.857-67.554-39.385-97.36-37.748-46.755 2.62-81.555 28.496-90.972 85.159-7.124 129.376 153.368 123.48 152.713 73.45-82.539-6.47-5.24-70.175 17.523-10.4 4.094 13.183 4.503 38.813 4.585 43.971l-1.392 6.715h-62.231v51.996h98.178c-.41 1.146-.9 2.456-1.31 4.012-12.774 44.872-84.012 29.478-84.012 29.478 4.913 63.869 55.68 75.333 84.012 67.963 1.146-.327 2.129-.819 3.111-1.474l.983 3.44c2.293 19.897 6.878 44.134 15.885 70.91 7.37 21.863 16.05 40.45 24.32 55.681l.41 1.392c8.27-15.23 16.949-33.818 24.318-55.68 9.008-26.777 13.593-51.096 15.886-70.912l.655-2.538c32.344 6.55 75.578-8.434 80.246-68.782 0 0-71.239 15.394-84.013-29.478-.41-1.556-.9-2.866-1.31-4.012h106.53v-51.996h-66.57v-5.896c.163.082.245.082.245.082s0-30.133 4.585-44.872c22.764-59.775 100.062 3.93 17.523 10.4-.655 50.03 159.837 55.926 152.713-73.45z" />;
                break;
            case "Orks":
              fill=[
                <Path key="1" d="M219.242 352.61c10.284-41.664 17.175-81.632 8.8-114.073l-82.481-6.997c6.36-62.232 40.286-141.426 80.678-224.543C135.49 68.7 52.69 130.612 0 192.95c18.765 67.532 44.951 136.125 92.976 199.947 77.498 25.656 156.48 41.77 236.841 49.086-47.071-29.58-86.51-59.37-110.575-89.372zM764.909 0c37.423 80.89 70.288 157.54 73.681 207.05-30.109 15.585-69.653 25.126-114.074 31.593 19.401 47.813 30.215 107.183 36.788 171.959l154.36-47.39c31.593-43.89 56.507-87.781 64.882-131.566C936.231 161.993 856.295 82.586 764.909 0Z" />,
                <Path key="2" d="M615.743 261.437c-19.295-3.499-192.95-121.071-192.95-121.071-60.429 29.896-116.618 64.988-168.46 105.274 3.711 37.954.424 67.957-8.799 91.174 24.596 42.089 114.074 94.779 128.068 103.472l-10.496 300.027 64.882-73.682L457.778 800l59.688-164.856 35.092 131.567 24.595-114.074 40.393 80.679 5.3-284.23c14.313-8.058 42.407.424 71.88 10.495l45.587-40.392c-6.997-68.805-17.599-132.52-36.788-184.15 0 .105-68.487 29.896-87.782 26.398zM359.608 386.006l-6.997-68.38c38.484 12.403 92.022 11.661 142.062 5.3 0 0 42.088 49.086 42.088 66.684 0 6.997-50.888 45.587-50.888 45.587-55.234-31.274-100.08-50.781-126.265-49.191zm192.95 108.773c-7.103-10.178-22.476-13.146-56.19 0 5.62-25.656 13.04-48.556 28.095-59.688h28.095c-9.118 16.963-4.877 38.166 0 59.688zm52.69-52.69-52.584-35.092 13.994-17.493L675.43 379.01c-14.207 17.492-41.135 45.587-70.183 63.08z" />
              ]
              offset={top:9, left:-5, width:"72%", height:"72%"}
              break;
        }
        return <SvgComp xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" {...this.props} fill={this.context.Main} offset={offset}>{fill}</SvgComp>;
     
    }
}


// generate SVGs there : https://react-svgr.com/playground/?dimensions=false&exportType=named&namedExport=AdeptaSororitas&native=true&typescript=true