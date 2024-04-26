import { useState, useEffect, useRef } from "react";

import netsuite_pic from "./components/images/netsuite.jpg";
import aws_ec2_logo from "./components/images/aws_ec2.png";
import mysql_logo from "./components/images/mysql.png";
import jwt_logo from "./components/images/jwt.png";
import expressjs_logo from "./components/images/expressjs.jpg";
import signin_withgoogle_logo from "./components/images/signin_withgoogle.png";
import login_page from "./components/images/login_page.png";
import register_page from "./components/images/register_page.png";
import email_confirmation_page from "./components/images/email-confirmation_page.png";
import forgot_password_page from "./components/images/forgot-password_page.png";
import otp from "./components/images/otp.png";

//<img src={netsuite_pic} className="max-w-full h-auto w-1/4 min-w-[16rem] my-4 mx-auto"></img>

const ModalImageComponent = ({ image, isModalOpen, setModalOpen }) => {
  const refModal = useRef();
  

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setModalOpen(false);
      }
    };
    const handleClickOutside = (event) => {
      if (!refModal.current.contains(event.target)) {
        setModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener("keydown", handleEsc, true);
      document.addEventListener("mousedown", handleClickOutside, true);
      document.addEventListener("touchend", handleClickOutside, true);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc, true);
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("touchend", handleClickOutside, true);
    };
  }, [isModalOpen, setModalOpen]);

  return (
    <>
      
      <div className="image-modal-portfolio">
        <span
          onClick={() => setModalOpen(false)}
          className="modal-portfolio-close-button"
        >
          {" "}
          &times;{" "}
        </span>
        <img src={image} alt="" ref={refModal} className="" />
      </div>
      {/* )}  */}
    </>
  );
};



const Portfolio_2 = () => {
  const dynamic_values = useRef();

  const [isModalOpen, setModalOpen] = useState(false);
  console.log("isModalOpen", isModalOpen);
  const handleClick = (image_src) => {
    dynamic_values.current = image_src;
    setModalOpen((prev) => !prev);
  };

  return (
    <div className="h-full">
      <div className="flex flex-col max-w-[1200px] relative content">
        <section className="flex flex-row gap-6">
          <div className="box">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl ">Experience.</h1>
            </div>
            <div className="pl-4 box-div">
              <h2 className="">Internship: Software Developer at TeibTo </h2>
              <div className="">
                
                  13 January 2022 - 17 May 2022, Do some coding, programming by
                  using html, css, javascript and <br/> 
                  <span
                    onClick={() => handleClick(netsuite_pic)}
                    className="span-modal-portfolio"
                  >
                    Oracle Netsuite
                  </span>{" "} to support and
                  solve customer's issue. Create a PDF bill (like Invoice bill, Purchase Order bill, etc.) from user's requirement using HTML and CSS {" "}
                  
                  
                  {isModalOpen && (
                    <ModalImageComponent
                      image={dynamic_values.current}
                      isModalOpen={isModalOpen}
                      setModalOpen={setModalOpen}
                    />
                  )}
                
              </div>
            </div>
          </div>
        </section>
        {/* <div className='py-2'>  </div> */}
        <section className="box">
          <h1 className="">More About Me.</h1>
          <div className="pl-4">
            <div className="describing-application">
              <div className="">
                <h1 className="">What I have been doing? </h1>
                <span className="">
                  Currently, I've been studying about react js library as a
                  front-end tool, and I have been studying about
                  backend-security for website.
                  <br /> <br />
                  I was a full-time streamer before in 2023 but it didn't turn
                  out to be successfully, so I decided to start a new challenge
                  as a web-developer.
                  <br /> <br />I have an application which I made it's called
                  Todo-list web application which is hosting on vercel.com and
                  my backend{" "}
                  <span
                    onClick={() => handleClick(expressjs_logo)}
                    className="span-modal-portfolio"
                  >
                    Express.js
                  </span>{" "}
                  is hosting on{" "}
                  <span
                    onClick={() => handleClick(aws_ec2_logo)}
                    className="span-modal-portfolio"
                  >
                    AWS EC2
                  </span>{" "}
                  as well as my database using{" "}
                  <span
                    onClick={() => handleClick(mysql_logo)}
                    className="span-modal-portfolio"
                  >
                    MYSQL
                  </span> .
                  <br /> <br />
                  More about my application is my{" "}
                  <span
                    onClick={() => handleClick(login_page)}
                    className="span-modal-portfolio"
                  >
                    login page
                  </span>{" "}
                  which has authentication system using{" "}
                  <span
                    onClick={() => handleClick(jwt_logo)}
                    className="span-modal-portfolio"
                  >
                    JWT (JSON Web Tokens)
                  </span>{" "}
                  as an access token to access the contents and I encrypted jwt
                  for more security with{" "}
                  <span className="font-bold">Crypto.js</span>, and the other
                  way to login is through{" "}
                  <span
                    onClick={() => handleClick(signin_withgoogle_logo)}
                    className="span-modal-portfolio"
                  >
                    Sign in with Google
                  </span>
                  .
                  <br /> <br />
                  About{" "}
                  <span
                    onClick={() => handleClick(register_page)}
                    className="span-modal-portfolio"
                  >
                    register page
                  </span>
                  , I have regex validation as well as login page and hash a
                  password using <span className="font-bold">Argon2</span> to
                  store user's password.
                  <br />
                  After user successfully signed up, they will get an{" "}
                  <span
                    onClick={() => handleClick(email_confirmation_page)}
                    className="span-modal-portfolio"
                  >
                    email confirmation
                  </span>{" "}
                  in their email's inbox to confirm their signing up.
                  <br /> <br />I also have function like{" "}
                  <span
                    onClick={() => handleClick(forgot_password_page)}
                    className="span-modal-portfolio"
                  >
                    forgot password page
                  </span>{" "}
                  which will send them {" "}
                  <span
                    onClick={() => handleClick(otp)}
                    className="span-modal-portfolio"
                  >
                    OTP
                  </span>{" "}
                  to their email to verify the user and give them to set their
                  new password.
                  {/* ทำต่อ otp page */}
                  <br /> <br />
                  Now I'm looking for opportunities as a web developer.{" "}
                </span>
              </div>
            </div>
            <div className="my-2">
              <div className="">
                <h2 className="">Language:</h2> Thai-Native English-Intermediate
                (TOEIC 635){" "}
              </div>
            </div>

            <div className="my-2">
              <div className="">
                <h2 className="">Github:</h2>{" "}
                <a
                  href="https://github.com/JoeSaranbro/portfolio/tree/J1"
                  className="text-blue-500 underline underline-offset-2"
                >
                  JoeSaranbro
                </a>
              </div>

              <div className="">
                <h2 className="">Contact:</h2>
                <span className=""> Tel. 095-114-9151</span>
              </div>
            </div>
            <div className="break-all">
              <div>
                <h2 className="">Email:</h2> sarankunsutha@gmail.com
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Portfolio_2;
