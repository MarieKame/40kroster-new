import React, { ReactElement } from "react"
import Svg, { SvgProps, Path, Polygon, G } from "react-native-svg"
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
    viewBox?:string
  }
}

const SvgComp= (props: ISvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.offset&&props.offset.height?props.offset.height:"100%"}
    height={props.offset&&props.offset.width?props.offset.width:"100%"}
    preserveAspectRatio="xMinYMin slice"
    viewBox={props.offset&&props.offset.viewBox?props.offset.viewBox:"0 0 1000 1000"}
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
        let useDark=false;
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
            case "Genestealer Cults":
              fill=<Path d="M815.399 454.05c-17.38 0-31.392-16.743-31.392-37.308 0-20.564 14.013-37.306 31.392-37.306 8.19 0 15.65 3.73 21.201 9.827 1.729 1.91 4.914.728 4.914-1.91-.273-29.3-2.821-56.87-7.553-82.894-.455-2.548-4.003-3.185-5.186-.91-3.64 6.824-9.645 12.102-17.289 14.376-16.196 4.823-33.667-5.823-38.944-23.748-5.278-17.926 3.549-36.397 19.745-41.129 8.735-2.548 17.743-.728 25.114 4.368 2.184 1.547 5.095-.637 4.276-3.185-10.919-34.759-26.205-65.969-45.222-93.63-1.82-2.64-5.733-1.73-6.37 1.364-1.183 5.915-4.004 11.465-8.462 15.924-12.648 12.648-33.85 12.01-47.225-1.456-13.467-13.467-14.104-34.668-1.456-47.225 6.097-6.096 14.104-9.099 22.384-9.099 3.185 0 4.732-3.73 2.548-6.005-25.842-25.842-55.778-47.225-89.172-64.331-2.912-1.547-6.096 1.546-4.823 4.55 3.367 7.915 3.731 16.65.091 24.567-7.37 16.014-28.116 22.293-46.405 13.922-18.29-8.372-27.116-28.208-19.746-44.222 3.276-7.189 9.282-12.466 16.56-15.196 3.004-1.183 2.913-5.55-.181-6.642C541.696 8.917 483.278 0 421.04 0h-.091C184.462 14.468 23.86 211.192.02 386.988c-.182 1.274.82 2.457 2.184 2.366 36.124-.819 108.19-2.275 143.767-6.733 3.913-.455 4.64-5.824 1.001-7.37-13.74-5.915-22.748-12.103-24.932-19.109-.455-1.365.637-2.73 2.093-2.73 10.828.273 44.495-8.917 61.329-21.2 1.365-1.002 1.092-3.095-.455-3.732-6.734-2.73-21.93-6.096-18.927-9.19 19.564-4.367 44.586-9.918 68.153-26.387 1.456-1.001 1.092-3.367-.728-3.822-16.196-4.095-28.39-8.735-33.03-14.923-1-1.365-.182-3.184 1.456-3.366 23.931-2.275 51.41-3.731 72.066-16.197 1.547-1 1.274-3.367-.546-3.822-15.833-4.64-29.118-10.19-27.662-21.656.091-1 .91-1.728 1.911-1.82 72.157-7.734 107.37 18.199 106.733 76.889 0 .91-.545 1.728-1.455 2.001-18.017 6.097-36.488 3.731-57.325 1.73-1.73-.183-2.912 1.637-2.093 3.184 5.732 10.1 10.282 16.56 12.739 20.746.455.728.364 1.638-.091 2.366-9.372 12.739-21.201 8.644-39.127-1.365-1.365-.728-3.093.182-3.184 1.729-.273 8.098 3.64 13.285 8.189 18.107.728.82.819 2.002.09 2.821-9.735 11.465-27.479 10.646-46.769 6.915-3.185-.637-5.46 3.094-3.367 5.642 4.914 6.005 9.282 10.737 12.83 13.285 1.274.91 1.183 2.911-.273 3.64-10.009 4.913-24.477 5.55-39.672 5.095-3.549-.091-4.823 4.64-1.729 6.278 32.302 17.198 83.349 18.836 127.57 13.194.546-.09 1.001-.273 1.274-.728 40.31-44.95 90.446-76.25 148.408-96.906 1.729-.637 1.91-3.003.273-3.913-12.83-6.642-23.84-17.47-32.666-31.938-.819-1.365.182-3.185 1.82-3.185 116.56-.273 177.707 63.877 181.983 194.54v.456C599.293 591.356 506.3 664.33 396.2 679.709c-127.934 8.917-237.67-48.59-336.123-162.42-1.456-1.73-4.186-.274-3.64 1.91 25.023 96.179 84.44 180.437 183.167 231.938 1.729.91 3.912-.273 4.094-2.183.273-3.276 1.456-6.37 3.64-8.918 6.552-7.825 19.745-7.552 29.3.546 9.645 8.099 12.101 21.02 5.459 28.754-.182.273-.455.455-.637.728 14.923 5.732 30.482 10.919 46.952 15.286 2.184.546 4.185-1.547 3.367-3.64-1.092-3.002-1.456-6.187-.91-9.462 2.001-10.647 13.648-17.47 25.932-15.196 12.284 2.275 20.655 12.83 18.654 23.567a17.977 17.977 0 0 1-5.187 9.554 2.836 2.836 0 0 0 1.456 4.822c11.01 2.002 22.293 3.64 33.849 5.005h.182c14.559 0 28.935-.546 43.13-1.547 2.548-.182 3.549-3.367 1.547-5.004-5.187-4.277-8.462-10.373-8.462-17.107 0-13.103 12.193-23.658 27.297-23.658 15.105 0 27.298 10.555 27.298 23.658 0 4.55-1.547 8.826-4.095 12.466-1.456 2.002.182 4.823 2.73 4.459 28.662-4.459 56.142-11.101 82.347-20.019 2.457-.819 2.548-4.367.091-5.277-5.55-2.093-10.373-5.915-13.466-11.283-7.644-13.285-1.911-30.937 12.738-39.4 14.741-8.462 32.849-4.64 40.492 8.645 4.64 8.098 4.367 17.743.09 26.023-1.182 2.366 1.275 4.914 3.731 3.822 32.576-15.196 62.512-34.213 89.081-57.143 1.82-1.547.91-4.64-1.546-4.913-6.097-.546-12.102-3.003-17.198-7.189-13.376-11.192-14.922-31.21-3.64-44.677 11.374-13.467 31.393-15.286 44.677-4.094 6.46 5.46 10.192 13.011 11.01 20.928.273 2.457 3.276 3.457 4.914 1.547 18.562-21.656 34.759-45.86 48.317-72.52 1.092-2.185-1.001-4.732-3.367-3.914-7.188 2.366-15.287 2.366-23.112-.454-17.561-6.46-26.934-25.023-20.837-41.493 6.096-16.47 25.205-24.659 42.766-18.198 8.917 3.276 15.742 9.736 19.472 17.38 1.092 2.274 4.368 2.092 5.187-.274 9.918-28.116 17.197-58.416 21.656-90.991-3.73-1.911-1.001-.546-4.64-2.457-5.37 4.094-11.648 6.733-18.563 6.733zM123.224 219.107c-3.548 2.548-8.007-1.547-5.823-5.277 14.922-25.114 42.402-59.6 76.069-80.073 12.557-2.093 21.565-.819 24.568 6.37-12.375 16.378-58.508 52.684-94.814 78.98z"/>
              offset={top:5, left:-3, width:"76%", height:"76%"}
              break;
            case "Legiones Daemonica":
              fill=[
                <Path key="1" d="M402.451 176.86A221.742 221.742 0 0 0 180.71 398.604a221.742 221.742 0 0 0 221.742 221.742 221.742 221.742 0 0 0 221.742-221.742A221.742 221.742 0 0 0 402.451 176.86Zm-.79 35.192a186.556 186.556 0 0 1 .79 0 186.556 186.556 0 0 1 186.55 186.55 186.556 186.556 0 0 1-186.55 186.551 186.556 186.556 0 0 1-186.55-186.55 186.556 186.556 0 0 1 185.76-186.55Z" transform="translate(-2.449 1.397)" />,
                <G  key="2">
                  <Path d="M85.266 42.596 70.393 36.12c1.21 1.459 2.32 2.771 2.832 4.553l-13.76-.305c-3.37.336-9.914 2.227-9.914 2.227s6.544 1.89 9.914 2.226l13.76-.304c-.512 1.781-1.623 3.094-2.832 4.552zM.152 42.596l14.873-6.475c-1.21 1.459-2.32 2.771-2.832 4.553l13.76-.305c3.37.336 9.913 2.227 9.913 2.227s-6.543 1.89-9.914 2.226l-13.76-.304c.512 1.781 1.623 3.094 2.833 4.552zM42.709 85.153l6.474-14.873c-1.458 1.21-2.77 2.32-4.552 2.832l.304-13.76c-.336-3.37-2.226-9.914-2.226-9.914s-1.89 6.544-2.227 9.914l.305 13.76c-1.782-.512-3.094-1.623-4.553-2.832zM42.709.039l6.474 14.873c-1.458-1.21-2.77-2.32-4.552-2.832l.304 13.76c-.336 3.37-2.226 9.913-2.226 9.913s-1.89-6.543-2.227-9.914l.305-13.76c-1.782.512-3.094 1.623-4.553 2.833z" transform="matrix(9.3991 0 0 9.39911 -1.424 -.362)"/>
                </G>,
                <G  key="3">
                  <Path
                    d="M65.448 19.856a79.357 79.357 0 0 1-9.181 6.105 79.357 79.357 0 0 1-6.104 9.181 79.357 79.357 0 0 1 9.18-6.104 79.357 79.357 0 0 1 6.105-9.182zM35.255 50.05a79.357 79.357 0 0 1-9.181 6.104 79.357 79.357 0 0 1-6.105 9.181 79.357 79.357 0 0 1 9.182-6.104 79.357 79.357 0 0 1 6.104-9.182zM65.448 65.335a79.357 79.357 0 0 1-6.104-9.181 79.357 79.357 0 0 1-9.181-6.105 79.357 79.357 0 0 1 6.104 9.182 79.357 79.357 0 0 1 9.181 6.104zM35.255 35.142a79.357 79.357 0 0 1-6.104-9.181 79.357 79.357 0 0 1-9.182-6.105 79.357 79.357 0 0 1 6.105 9.182 79.357 79.357 0 0 1 9.181 6.104z"
                    
                    transform="matrix(9.39911 0 0 9.39911 -1.424 -.362)"
                  />
                </G>
              ]
              offset={left:-7}
              break;
            case "Astra Militarum":
              fill=[
                <Path  key="1" d="M1385.141 232.685c-37.668-109.667-148.527-126.594-196.447-128.978 0 0-4.053-.239-10.966-.239h-.477c-7.152 0-10.967.239-10.967.239-47.92 2.145-158.779 19.31-196.447 128.978-31.946 93.455 28.609 199.069 16.212 213.373-49.35 56.98 17.642 147.574 26.94 154.965 16.45 13.589 68.9-13.828 60.555.238-6.199 10.728-12.159 91.548-12.159 91.548h16.212l7.867-28.132 13.828-.238 2.622 28.37h28.37l2.623-26.94 9.536-1.43 1.43 28.37H1167l.954-29.086h18.596l.953 29.086h23.126l1.43-28.37 9.536 1.43 2.623 26.94h28.37l2.623-28.37 13.827.238 7.868 28.132h16.211s-5.721-80.82-12.158-91.548c-8.345-14.066 44.105 13.112 60.555-.238 9.298-7.391 76.29-97.986 26.94-154.965-11.92-14.304 48.635-119.918 16.688-213.373zm-238.168 272.26c-6.437 7.152-15.735 15.735-28.37 22.887-30.278 16.927-60.317 14.543-72.237 12.874-.716 0-1.67-.239-2.146-.716-26.463-16.688-36.476-42.913-28.609-59.124 1.192-2.384 5.722-10.729 19.55-15.735.715-.239 1.668-.239 2.384-.239 16.688 1.43 37.668 4.769 60.555 12.16 18.596 5.72 34.569 12.873 47.443 19.549 3.099 1.43 3.814 5.721 1.43 8.344zm63.178 98.938c0 1.908-2.384 2.623-3.576 1.192-2.861-3.576-6.676-7.867-12.159-11.681-5.722-4.053-10.967-6.676-15.258-8.106-4.053 1.43-9.536 4.053-15.258 8.106-5.245 3.814-9.298 8.105-12.159 11.681-1.192 1.43-3.576.716-3.576-1.192-.953-13.827-.238-42.198 20.503-62.7 2.623-2.623 6.199-5.007 10.252-7.153 4.053 2.146 7.629 4.53 10.251 7.153 21.457 20.74 21.933 49.111 20.98 62.7zm101.561-63.893c-.715.477-1.43.716-2.146.716-12.158 1.669-41.96 4.053-72.237-12.874-12.635-7.152-21.933-15.497-28.37-22.887-2.384-2.861-1.669-7.152 1.669-8.821 13.112-6.676 28.847-13.828 47.443-19.55 23.125-7.152 43.866-10.49 60.555-12.158.715 0 1.669 0 2.384.238 13.827 5.007 18.357 13.35 19.55 15.735 7.628 16.688-2.385 42.913-28.848 59.601z" />,
                <Path key="2" d="M945.281 302.06c-19.549-4.767-38.145-18.356-59.84-27.416-10.013-7.867-36.714-28.609-50.542-75.813-14.304-48.873 29.324-102.515 34.33-112.051 21.219-5.722 27.417-4.53 48.636-10.49V0H0c18.596 38.383 37.668 74.86 56.98 109.905l565.5-2.384c.953 5.245 2.145 10.729 3.337 16.45l-537.13 41.483c36.476 61.747 73.43 117.534 110.144 168.315l433.9-134.7c2.384 8.345 4.768 16.689 7.629 25.271L253.903 406.483c35.046 44.105 69.138 83.442 101.8 118.726L656.81 306.591c2.622 6.198 5.245 12.158 7.867 18.357L393.609 565.262c34.807 35.522 66.992 65.8 97.031 91.548l208.606-262.724a453.043 453.043 0 0 0 16.45 25.032l-186.91 268.923c50.542 39.575 93.455 65.085 129.216 81.535 31.708-94.41 67.707-207.175 99.177-299.439 7.39 6.914 9.536 10.49 16.688 15.735L681.842 779.59c61.032 23.364 97.747 18.357 113.72 15.258 5.007-.954 10.013-2.146 14.781-3.338 13.113-88.687 22.887-187.149 36.238-275.36 6.437.716 12.397.954 17.88.954L855.403 766c19.311-7.868 42.198-20.265 64.37-40.53 5.245-4.767 10.013-9.536 14.304-14.304V465.37c.477-3.576 6.676 2.623 18.834-7.39 7.153-5.96 15.02-32.424 15.02-47.443-10.252-29.801-17.88-35.523-21.218-77.005-.239.238-1.43-20.98-1.43-31.47zM2300.145 112.29c19.31-34.808 38.383-71.523 56.979-109.906h-917.865v76.29c21.219 5.722 27.417 4.53 48.635 10.49 5.245 9.536 48.635 63.178 34.33 112.051-13.827 47.204-40.528 68.184-50.541 75.813-21.695 9.298-40.291 22.649-59.84 27.417 0 10.49-1.192 31.708-1.192 31.708-3.338 41.483-10.967 46.966-21.219 77.005 0 15.02 7.868 41.483 15.02 47.443 12.159 10.013 18.119 3.815 18.834 7.39V713.79c4.291 4.768 9.06 9.536 14.305 14.304 21.933 20.265 45.058 32.662 64.37 40.53l-9.537-248.897c5.483 0 11.444-.238 17.88-.954 13.351 87.972 23.126 186.673 36.238 275.36 4.768 1.192 9.775 2.384 14.781 3.337 15.974 2.861 52.688 7.868 113.72-15.258l-91.786-293.716c6.914-5.245 9.298-8.821 16.688-15.735 31.47 92.502 67.23 205.03 99.177 299.438 35.761-16.45 78.913-42.198 129.217-81.535l-186.911-268.922a453.043 453.043 0 0 0 16.45-25.033l208.606 262.724c30.039-25.748 62.224-56.025 97.031-91.548l-271.306-240.552c2.622-5.96 5.244-12.159 7.867-18.357l301.107 218.618c32.662-35.284 66.754-74.86 101.8-118.726l-386.457-182.143c2.622-8.582 5.245-16.926 7.629-25.27l433.9 134.699c36.714-50.78 73.906-106.568 110.143-168.315l-536.89-41.483c1.191-5.721 2.383-11.205 3.337-16.45z" />            
              ];
              offset={top:13, left:-11, viewBox:"0 0 3000 3000", height:"120%", width:"120%"}
              break;
        }
        return <SvgComp xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" {...this.props} fill={this.context.Dark} offset={offset}>{fill}</SvgComp>;
     
    }
}

// SVGs from https://drive.google.com/drive/folders/1rGgj9xUmgDZ2VDrAZVYGtWmk2eonrU0D
// generate SVGs there : https://react-svgr.com/playground/?dimensions=false&exportType=named&namedExport=AdeptaSororitas&native=true&typescript=true