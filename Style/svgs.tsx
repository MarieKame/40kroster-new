import * as React from "react"
import Svg, { SvgProps, Path, Polygon } from "react-native-svg"
import Variables from "./Variables";

export interface ISvgProps extends SvgProps {
  xmlns?: string;
  xmlnsXlink?: string;
  xmlSpace?: string;
  svgXmlData?:string;
  faction?:string;
}
//svgComp.tsx
const SvgComp= (props: ISvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={"100%"}
    height={"100%"}
    preserveAspectRatio="xMinYMin slice"
    viewBox="0 0 1000 1000"
    xmlSpace="preserve"
    {...props}>
  </Svg>
);

export class Background extends React.Component<ISvgProps> {
    render(){
        return <SvgComp xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" {...this.props} fill={Variables.colourLightAccent} height={250} width={250} stroke={Variables.colourMain} strokeWidth={5}>
        <Polygon points="111.823,0 16.622,111.823 111.823,223.646 207.025,111.823 "/>
    </SvgComp>
    }
}

export class FactionSvg extends React.Component<ISvgProps> {
    render(){
        let fill;
        switch (this.props.faction) {
            case "Adepta Sororitas":
                fill= <Path d="M503.813 402.866c-9.417-56.663-44.217-82.538-90.973-85.159-28.331-1.556-65.506 9.662-93.101 33.818C332.185 320 357.733 240.737 333.332 145.18 314.499 71.73 274.949 23.091 253.332 0c-21.536 23.091-61.167 71.73-79.918 145.18-25.548 99.733 3.52 181.78 15.148 210.275-28.004-26.857-67.554-39.385-97.36-37.748-46.755 2.62-81.555 28.496-90.972 85.159-7.124 129.376 153.368 123.48 152.713 73.45-82.539-6.47-5.24-70.175 17.523-10.4 4.094 13.183 4.503 38.813 4.585 43.971l-1.392 6.715h-62.231v51.996h98.178c-.41 1.146-.9 2.456-1.31 4.012-12.774 44.872-84.012 29.478-84.012 29.478 4.913 63.869 55.68 75.333 84.012 67.963 1.146-.327 2.129-.819 3.111-1.474l.983 3.44c2.293 19.897 6.878 44.134 15.885 70.91 7.37 21.863 16.05 40.45 24.32 55.681l.41 1.392c8.27-15.23 16.949-33.818 24.318-55.68 9.008-26.777 13.593-51.096 15.886-70.912l.655-2.538c32.344 6.55 75.578-8.434 80.246-68.782 0 0-71.239 15.394-84.013-29.478-.41-1.556-.9-2.866-1.31-4.012h106.53v-51.996h-66.57v-5.896c.163.082.245.082.245.082s0-30.133 4.585-44.872c22.764-59.775 100.062 3.93 17.523 10.4-.655 50.03 159.837 55.926 152.713-73.45z" />;
                break;
        }
        return <SvgComp xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" {...this.props} fill={Variables.colourMain}>{fill}</SvgComp>;
     
    }
}
// generate SVGs there : https://react-svgr.com/playground/?dimensions=false&exportType=named&namedExport=AdeptaSororitas&native=true&typescript=true