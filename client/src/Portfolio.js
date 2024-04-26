import { useState, useRef } from "react";

import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useVelocity,
  useAnimationFrame
} from "framer-motion";

import { wrap } from "@motionone/utils";
import { Link } from "react-router-dom";
import { IconContext } from "react-icons";

import { ImArrowUp2 } from "react-icons/im";
import profile_pic from "./components/images/profile_pic.jpg";
import html5logo from "./components/images/html5.png";
import csslogo from "./components/images/css.png";
import javascriptlogo from "./components/images/javascript.png";
import reactlogo from "./components/images/logo192.png";
import tailwindlogo from "./components/images/tailwind_logo.png";
import mysql_logo from "./components/images/mysql.png";
import jwt_logo from "./components/images/jwt.png";
import expressjs_logo from "./components/images/expressjs.jpg";
import aws_ec2_logo from "./components/images/aws_ec2.png";

import car from "./components/images/car.PNG";
import plate from "./components/images/plate.PNG";
import result from "./components/images/result.PNG";








function ParallaxText({ children, baseVelocity = 100 }) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400
  });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
    clamp: false
  });

  //on hover && touchstart
  const [isHovered, setIsHovered] = useState(false); // State to track hover state
  const containerRef = useRef(null); // Ref to the parallax container

  // Function to handle mouse hover events
  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Function to handle touch events on mobile devices
  const handleTouchStart = () => {
    setIsHovered(true);
  };

  const handleTouchEnd = () => {
    setIsHovered(false);
  };


  /**
   * This is a magic wrapping for the length of the text - you
   * have to replace for wrapping that works for you or dynamically
   * calculate
   */
  const x = useTransform(baseX, v => `${wrap(0, -25, v)}%`);

  const directionFactor = useRef(1);
  useAnimationFrame((t, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

    /**
     * This is what changes the direction of the scroll once we
     * switch scrolling directions.
     */
    if (velocityFactor.get() < 0) {
      directionFactor.current = -1;
    } else if (velocityFactor.get() > 0) {
      directionFactor.current = 1;
    }

    moveBy += directionFactor.current * moveBy * velocityFactor.get();

    if (!isHovered) {
      baseX.set(baseX.get() + moveBy);
    }

  });

  /**
   * The number of times to repeat the child text should be dynamically calculated
   * based on the size of the text and viewport. Likewise, the x motion value is
   * currently wrapped between -20 and -45% - this 25% is derived from the fact
   * we have four children (100% / 4). This would also want deriving from the
   * dynamically generated number of children.
   */
  return (
    <div className="parallax"
      ref={containerRef}
      onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
      >
      <motion.div className="scroller" style={{ x }}>
        <div>{children} </div>
        <div>{children} </div>
        <div>{children} </div>
        <div>{children} </div>
      </motion.div>
    </div>
  );
}

const Portfolio = () => {
  const images = [{
    title: "HTML5",
    src: html5logo
  },{
    title: "CSS",
    src: csslogo
  },
  {
    title: "Javascript",
    src: javascriptlogo
  },
  {
    title: "React.js",
    src: reactlogo
  },
  {
    title: "TailwindCSS",
    src: tailwindlogo
  },
  {
    title: "MYSQL",
    src: mysql_logo
  },
  {
    title: "JWT",
    src: jwt_logo
  },
  {
    title: "Express.js",
    src: expressjs_logo
  },
  {
    title: "AWS EC2",
    src: aws_ec2_logo
  }

  
]
  const clickMeBtn = () => {
    document.getElementById("showproj").style.display = "block";
  };

  return (
    <div className=" w-full">
      <div className="header flex flex-col content max-w-full ">
        <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.8,
          delay: 0.5,
          ease: [0, 0.71, 0.2, 1.01]
        }}
        
        >
        <div className="text-welcome flex justify-center">
          Hi, welcome to my Portfolio.
          {/* <div className="fadingEffect"></div> */}
        </div>
        </motion.div>
        <div className="flex flex-row justify-center">
          <div className=" w-full">
            <div className="">
            <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 1,
              duration: 0.6,
              ease: [0, 0.71, 0.2, 1.01],
              scale: {
                type: "spring",
                damping: 5,
                stiffness: 100,
                restDelta: 0.001
              }
            }}
            >
              <div  className="flex flex-col gap-2">
                <p className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black">Saran Kunsutha (Joe) </p>
                <p className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold">24 years old </p>
                <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-medium"> Information Technology (IT) Student 
                <br/>
                 From Suan Dusit University  
                 <br/>
                 Fresh Graduate 2022 
                 </p>
                
                
              </div>
            </motion.div> 
            </div>
            <div></div>
            
          </div>
          <div className="flex justify-end px-2 py-4">
            <img
            src={profile_pic}
            className="w-[200px] min-w-[80px] h-auto mt-6 fadein-bottom rounded-3xl"
            alt=""
            ></img>
          </div>
          
          
        </div>
        <div className="flex flex-col mt-10 w-full overflow-hidden">
          <div className="text-center">
          <h1
            className="fadein-top"
            style={{ animationDelay: "1.75s" }}
          >
            Skills, Tools, Stacks.
          </h1>
          </div>
          
            
            <ParallaxText baseVelocity={-5}>
              {images.map((val,index) => (
              <div className="my-5 flex flex-col" key={index}>
              <img
                src={val.src}
                className="max-w-full h-auto w-32 max-h-32 fadein-top"
                 style={{ animationDelay: "2.25s" }}
                alt=""
              ></img>
              <p
                className="text-2xl font-bold fadein-bottom text-center"
                style={{ animationDelay: "2.25s" }}
              >
                {val.title}
              </p>
            </div>
            ))}
            </ParallaxText>

          
        </div>
        <div className="flex flex-wrap md:flex-nowrap w-full mt-8">
          <div className="flex flex-col px-2 py-2">
            <h1 className="fadein-top" 
            style={{ animationDelay: "3s" }}>
              Project
            </h1>
            <button
              onClick={clickMeBtn}
              className="btn"
              style={{ animationDelay: "3s" }}
            >
              Click Me
            </button>
            <IconContext.Provider value={{ size: "4em" }} >
              <div
                id="arrow"
                className="mt-24 fadein-up-arrow hidden md:block "
                style={{ animationDelay: "3s" }}
              >
                <ImArrowUp2 />
              </div>
            </IconContext.Provider>
            
          </div>
          <div
            id="showproj"
            className="flex showproject gap-20 border-solid border-8 border-white rounded-3xl fadein-zoom text-left ml-2 px-6 py-2"
            style={{ display: "none" }}
          >
            <div className="pl-1">
              <h3 className="">
                Project Name{" "}
              </h3>{" "}
               A Comparison License Plate Detection and Recognition by using
              Deep Learning
            </div>
            <div className="pl-1">
              <h3 className="">
                Tools{" "}
              </h3>{" "}
               For License Plate Detection - YoloV4 , SSD-Mobilenet <br />
              <span className="">
                For License Plate Reader/Recognition - Google Vision API ,
                EasyOCR
              </span>
            </div>
            <hr className="mt-4" />

            <div className="flex flex-col sm:flex-row">
              <div className="flex flex-wrap gap-4 mt-2 showproject-img relative grow">
              <div>
                <h3 className="">
                  Example:
                </h3>
              </div>
              <div className="flex flex-wrap justify-center gap-6">
              
                <img 
                  src={car} 
                  className="" 
                  alt=""
                ></img>
                <img
                  src={plate}
                  className=""
                  alt=""
                ></img>
                <img
                  src={result}
                  className=" "
                  alt=""
                ></img>
              </div>
              </div>
              <div className="flex self-center">
              <button className=" btn h-12 min-w-[120px] align-middle">
                <Link
                  to="/portfolio_2"
                  className=""
                >
                  Go Next
                </Link>
              </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Portfolio;
