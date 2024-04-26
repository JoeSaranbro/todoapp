import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import argon2 from "argon2";
import mysql2 from "mysql2/promise";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import CryptoJS from "crypto-js";
import nodemailer from "nodemailer";
import fs from "fs-extra";

import { OAuth2Client } from "google-auth-library";
console.log("first line")
dotenv.config();
const app = express();
app.use(cookieParser());



const client = new OAuth2Client();
console.log("before db")
const db = await mysql2.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 0,
});

const isOnProduction = process.env.isOnProduction;

//If there is a auth problem


app.use(express.json());

//----------------------Start cors -------------------------------------------------
const corsOptions = {
  origin: true,
  credentials: true,
};
app.use(cors(corsOptions));

const client_URL = process.env.Client_URL;
const backend_URL = process.env.Backend_URL;

const port = process.env.PORT || 8800;
//  app.use(cors());

//----------------------End cors -------------------------------------------------

app.get("/", (req, res) => {
  res.json("hello this is the backend");
});

//----------------------Start Todo App -------------------------------------------------

//---------------------- Start Authentication -------------------------------------------------
// Encrypt by crypto.js

const enCrypt = (message, secretkey) => {
  try {
    const ciphertext = CryptoJS.AES.encrypt(message, secretkey).toString();
    return ciphertext;
  } catch (error) {
    console.log("try catch enCrypt error", error);
    return false;
  }
};

// Decrypt
const deCrypt = (ciphertext, secretkey) => {
  try {
    //Note: encrypted data can't grab them directly from web developer tools because web browser convert "/" to "%2f" and "+" to "%2B" ,
    //it will cause an error if grab the value directly and decrypt it.
    //always get the value from res.cookie
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretkey);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);

    return originalText;
  } catch (error) {
    console.log("try catch deCrypt error", error);
    return false;
  }
};

//generate random string
function generateRandomString() {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < 160) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

// ------------------------------ Start cookies options -----------------------------------
let access_token_cookieOptions = {
  maxAge: 365 * 24 * 60 * 60 * 1000, // expires after 365 days // first number is how many day, second number is 1 day (60 minutes * 24 = 1440)
  httpOnly: true, // prevent client-side scripts from accessing the cookie
  path: "/",
}



let refresh_token_cookieOptions = {
  maxAge: 365 * 24 * 60 * 60 * 1000, // expires after 365 days // first number is how many day, second number is 1 day (60 minutes * 24 = 1440)
  httpOnly: true, // prevent client-side scripts from accessing the cookie
  path: "/",
}

if (isOnProduction === "production") {
  access_token_cookieOptions.secure = true
  access_token_cookieOptions.sameSite = "none"
  access_token_cookieOptions.domain = backend_URL
  refresh_token_cookieOptions.secure = true
  refresh_token_cookieOptions.sameSite = "none"
  refresh_token_cookieOptions.domain = backend_URL
}






// ------------------------------ End cookies options -----------------------------------

app.get("/authentication", async (req, res) => {
  const response = { msg: "", status: null };
  if (!req.cookies["auth_token"] || !req.cookies["refresh_token"]) {
    console.log("No auth_token || refresh_token");
    return res.status(401).json("You're not authenticated!");
  }

  const auth_token = deCrypt(
    req.cookies["auth_token"],
    process.env.SecretKey_Cryptojs_JWT
  );
  const refresh_token = deCrypt(
    req.cookies["refresh_token"],
    process.env.SecretKey_Cryptojs_JWT
  );

  // console.log(refresh_token)

  try {
    const verifyingRefreshToken = () => {
      return new Promise((resolve, reject) => {
        try {
          //check if there is refresh token
          if (refresh_token) {
            jwt.verify(
              refresh_token,
              process.env.SecretKey_RefreshToken,
              async (err, decoded) => {
                //condition if there is an error in verifying refresh token
                if (err) {
                  //check if token not valid
                  if (err.name === "JsonWebTokenError") {
                    console.log("refresh Token is not valid, go login again");

                    response.msg = "You're not authenticated!";
                    response.status = "fail";
                    resolve(response);
                  }
                  //check if token is valid but expired
                  else if (err.name === "TokenExpiredError") {
                    console.log(
                      "authentication, refresh token is valid but expired"
                    );
                    const date = new Date(err.expiredAt);
                    const convertDate = date.getTime();
                    const timeRemaining = convertDate + 7 * 24 * 60 * 60 * 1000;

                    // check if token is valid but expired and user use application within 2 days after expired, we will give user new token
                    if (timeRemaining > Date.now()) {
                      console.log(
                        "refresh Token is valid but it expired, we'll give you new refresh token"
                      );

                      const decoded = jwt.decode(
                        refresh_token,
                        process.env.SecretKey_RefreshToken
                      );

                      const csrfToken = generateRandomString();
                      const new_auth_token = jwt.sign(
                        {
                          user_id: decoded.user_id,
                          user_name: decoded.user_name,
                          user_email: decoded.user_email,
                          role: decoded.isAdmin,
                        },
                        process.env.SecretKey_AccessToken,
                        { expiresIn: "15m" }
                      );
                      const new_refresh_token = jwt.sign(
                        {
                          user_id: decoded.user_id,
                          user_name: decoded.user_name,
                          user_email: decoded.user_email,
                          role: decoded.isAdmin,
                          csrfToken: csrfToken,
                        },
                        process.env.SecretKey_RefreshToken,
                        { expiresIn: "15d" }
                      );
                      console.log(
                        "authentication, refresh token is expired, sign new jwt"
                      );
                      const encrypted_auth_token = enCrypt(
                        new_auth_token,
                        process.env.SecretKey_Cryptojs_JWT
                      );
                      const encrypted_refresh_token = enCrypt(
                        new_refresh_token,
                        process.env.SecretKey_Cryptojs_JWT
                      );
                      console.log(
                        "authentication, refresh token is expired, encrypt jwt"
                      );

                      res.cookie(
                        "auth_token",
                        encrypted_auth_token,
                        access_token_cookieOptions
                      );
                      res.cookie(
                        "refresh_token",
                        encrypted_refresh_token,
                        refresh_token_cookieOptions
                      );

                      //fetch todo items from user_id
                      try {
                        const q =
                          "SELECT todo_id, title, details, date_start, date_end FROM todo_item WHERE user_id = ?";
                        const [rows] = await db.execute(q, [decoded.user_id]);
                        response.status = "success";
                        response.user_name = decoded.user_name;
                        response.data = rows;
                        response.csrf = csrfToken;
                        console.log(
                          "authentication, refresh token is expired, fetch latest data"
                        );
                        db.unprepare(q);
                        resolve(response);
                      } catch (error) {
                        response.status = "fail";
                        response.msg = "Internal error!";
                        console.log(
                          "authentication, verifyingRefreshToken, fetch latest data error",
                          error
                        );
                        db.unprepare(q);
                        resolve(response);
                      }
                    } //token is valid but expired and user didn't use application within 2 days after expired, we won't give them new token.
                    else {
                      console.log(
                        "token is valid but expired and user didn't use application within 7 days after expired, we won't give them new token"
                      );
                      response.msg = "You're not authenticated!";
                      response.status = "fail";
                      resolve(response);
                    }
                  } //catch other error
                  else {
                    response.msg = "You're not authenticated!";
                    response.status = "fail";
                    console.log(
                      "authentication, verifyingRefreshToken, jwt verify error"
                    );
                    resolve(response);
                  }
                }
                //Refresh Token is valid and not expired, we'll give user new access token
                else {
                  console.log(
                    "authentication, verifyingRefreshToken, Refresh Token is valid and not expired"
                  );

                  const new_auth_token = jwt.sign(
                    {
                      user_id: decoded.user_id,
                      user_name: decoded.user_name,
                      user_email: decoded.user_email,
                      role: decoded.isAdmin,
                    },
                    process.env.SecretKey_AccessToken,
                    { expiresIn: "15m" }
                  );
                  console.log(
                    "authentication, verifyingRefreshToken, sign new jwt auth token"
                  );
                  const encrypted_auth_token = enCrypt(
                    new_auth_token,
                    process.env.SecretKey_Cryptojs_JWT
                  );
                  console.log(
                    "authentication, verifyingRefreshToken, encrypt jwt"
                  );

                  res.cookie(
                    "auth_token",
                    encrypted_auth_token,
                    access_token_cookieOptions
                  );

                  //fetch todo items from user_id
                  try {
                    const q =
                      "SELECT todo_id, title, details, date_start, date_end FROM todo_item WHERE user_id = ?";
                    const [rows] = await db.execute(q, [decoded.user_id]);
                    db.unprepare(q);

                    response.status = "success";
                    response.user_name = decoded.user_name;
                    response.data = rows;

                    console.log(
                      "authentication, verifyingRefreshToken, fetch todo items"
                    );
                    resolve(response);
                  } catch (error) {
                    db.unprepare(q);
                    console.log(
                      "authentication, verifyingRefreshToken, fail to fetch todo items",
                      error
                    );
                    response.status = "fail";
                    response.msg = "Internal error!";
                    resolve(response);
                  }
                }
              }
            );
          } else {
            response.status = "fail";
            response.msg = "You're not authenticated!";
            console.log(
              "authentication, verifyingRefreshToken, refresh token is null or undefined"
            );
            resolve(response);
          }
        } catch (error) {
          console.log(
            "authentication, try catch main verifyingRefreshToken error"
          );
          console.log(error);
          response.status = "fail";
          response.msg = "Internal error!";
          resolve(response);
        }
      });
    };
    //if auth_token existed
    if (auth_token) {
      //verify access/auth token

      jwt.verify(
        auth_token,
        process.env.SecretKey_AccessToken,
        async (err, decoded) => {
          if (err) {
            if (err.name === "JsonWebTokenError") {
              console.log("authentication,Auth token is not valid.");
              response.status = "fail";
              response.msg = "You're not authenticated!";
              return res.status(401).json(response);
            } else if (err.name === "TokenExpiredError") {
              console.log("authentication, auth token is valid but expired");

              try {
                const response_verifying_refreshToken =
                  await verifyingRefreshToken();
                console.log(
                  "response_verifying_refreshToken",
                  response_verifying_refreshToken.status
                );
                if (response_verifying_refreshToken.status === "success") {
                  return res.json(response_verifying_refreshToken);
                } else if (response_verifying_refreshToken.status === "fail") {
                  if (
                    response_verifying_refreshToken.msg ===
                    "You're not authenticated!"
                  ) {
                    return res
                      .status(401)
                      .json(response_verifying_refreshToken);
                  } else if (
                    response_verifying_refreshToken.msg === "Internal error!"
                  ) {
                    return res
                      .status(500)
                      .json(response_verifying_refreshToken);
                  }
                }
              } catch (error) {
                console.log(
                  "authentication, response_verifying_refreshToken error"
                );
                console.log(error);
                response.status = "fail";
                response.msg = "Internal error!";
                return res.status(500).json(response);
              }
            } else {
              console.log(
                "authentication,unknown jwt verify auth token error",
                err.name
              );
              response.status = "fail";
              response.msg = "Internal error!";

              return res.status(500).json(response);
            }
          } else {
            //if there is no error in verify auth token
            //fetch todo items from user id

            //check if this user exist in database in case auth_token is not expired
            console.log(
              "authentication, check if this user exist in database in case auth_token is not expired"
            );
            const query_user_info =
              "SELECT user_email FROM users WHERE user_email = ? ";

            try {
              const [rows] = await db.execute(query_user_info, [
                decoded.user_email,
              ]);

              if (rows.length === 1) {
                console.log("authentication, there is user in database");
              } else {
                //result after check user exist in database is not === 1
                response.status = "fail";
                response.msg = "Internal error!";
                console.log(
                  "authentication, this user is not exist in database or might have multiple user account in database"
                );
                return res.status(401).json(response);
              }
            } catch {
              response.status = "fail";
              response.msg = "Internal error!";
              console.log(
                "authentication try catch,  this user is not exist in database or might have multiple user account in database"
              );
              return res.status(500).json(response);
            }

            console.log("auth token is valid,fetch todo items");
            const q =
              "SELECT todo_id, title, details, date_start, date_end FROM todo_item WHERE user_id = ?";
            try {
              const [rows] = await db.execute(q, [decoded.user_id]);

              response.status = "success";
              response.user_name = decoded.user_name;
              response.data = rows;

              db.unprepare(q);

              return res.json(response);
            } catch (error) {
              db.unprepare(q);
              response.status = "fail";
              response.msg = "Internal error!";
              console.log(
                "authentication, fetch todo items from user id error",
                error
              );
              return res.status(500).json(response);
            }
          }
        }
      );
    }
    // if auth_token is not existed
    else {
      response.status = "fail";
      response.msg = "You're not authenticated!";
      console.log("authentication, user doesn't have auth token in cookie.");
      return res.status(401).json(response);
    }
  } catch (error) {
    response.status = "fail";
    response.msg = "Internal error!";

    console.log("authentication, main try catch authentication error ", error);
    return res.status(500).json(response);
  }
});

//---------------------- End Authentication -------------------------------------------------
// Verify  token

const verifyTokens = (encryptedAuthToken, encryptedRefreshToken) => {
  if (!encryptedAuthToken || !encryptedRefreshToken) {
    console.log("no !authToken || !refreshToken");
    return false;
  } else {
    const auth_token = deCrypt(
      encryptedAuthToken,
      process.env.SecretKey_Cryptojs_JWT
    );
    const refresh_token = deCrypt(
      encryptedRefreshToken,
      process.env.SecretKey_Cryptojs_JWT
    );

    if (!auth_token || !refresh_token) {
      return false;
    } else {
      try {
        
        
        const verify_auth = jwt.verify(
          auth_token,
          process.env.SecretKey_AccessToken,
          (err,decoded) => {
            
            if (err) {
              if (err.name === "TokenExpiredError") {
                
              
              try {
                
                const encrypted_refresh_token = jwt.verify(
                  refresh_token,
                  process.env.SecretKey_RefreshToken
                );

                
                const new_auth_token = jwt.sign({
                  user_id: encrypted_refresh_token.user_id,
                  user_name: encrypted_refresh_token.user_name,
                  user_email: encrypted_refresh_token.user_email,
                },
                process.env.SecretKey_AccessToken,
                { expiresIn: "15m" }
                
              );

              return new_auth_token;

              
                
              } catch (error) {
                console.log("verifyTokens, verify verify_auth error", error)
              }
            } else {
              console.log("verifyTokens,auth token is invalid")
              return false;
            }

            } else {
              return decoded;
            }
          }
        );

        

        const decoded_refresh_token = jwt.verify(
          refresh_token,
          process.env.SecretKey_RefreshToken
        );

        

        if (verify_auth && decoded_refresh_token) {
          return [verify_auth, decoded_refresh_token];
        } else {
          return false;
        }
      } catch (error) {
        console.log("verifyTokens try catch error", error);
        return false;
      }
    }
  }
};



function authenticateToken(req, res, next) {

  console.log("authenticateToken")

  const auth_token = req.cookies["auth_token"];
  const refresh_token = req.cookies["refresh_token"];
  const csrfToken =  req.headers["x-csrf-token"];
  
  if (!auth_token || !refresh_token || !csrfToken) {
    console.log("authenticateToken", "auth_token or refresh_token or csrfToken is missing/false state")
    return res.sendStatus(401); // Unauthorized
  }


  const decrypted_auth_token = deCrypt(auth_token, process.env.SecretKey_Cryptojs_JWT)
  const decrypted_refresh_token = deCrypt(refresh_token, process.env.SecretKey_Cryptojs_JWT)

  
  jwt.verify(decrypted_auth_token, process.env.SecretKey_AccessToken, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        // Token is expired, try refreshing
        console.log("authenticateToken, auth token is valid but expired, gonna give them new one.")
        req.decrypted_refresh_token = decrypted_refresh_token;
        return genNewAuthToken(req, res, next);
      } else {
        // Token is invalid
        console.log("authenticateToken, auth token is not valid", err.name)
        return res.sendStatus(403); // Forbidden
      }
    } else {
      // Token is valid and not expired
      console.log("authenticateToken, auth token is valid and not expired.")
      req.decoded_auth = decoded; // Attach user information to request object
      next(); // Continue processing middleware chain
    }
  });
}

function genNewAuthToken(req, res, next) {
  
  console.log("genNewAuthToken")
  const refresh_token = req.decrypted_refresh_token;
  const csrfToken =  req.headers["x-csrf-token"];
  

  if (!refresh_token || !csrfToken) {
    console.log("genNewAuthToken, refresh_token or csrfToken is missing/false state")
    return res.sendStatus(401); // Unauthorized
  }

  try {
    //process.env.SecretKey_RefreshToken
  jwt.verify(refresh_token, process.env.SecretKey_RefreshToken, (err, decoded) => {

    if (err) {
      console.log("genNewAuthToken, refresh_token is not valid")
      return res.sendStatus(403); // Forbidden
    }

    // Generate a new access token
    if (decoded.csrfToken !== csrfToken) {
      console.log("genNewAuthToken, csrfToken from user !== csrfToken in refresh token")
      return res.sendStatus(403);
    }
    const newAccessToken = jwt.sign({ 
      user_id: decoded.user_id,
      user_name: decoded.user_name,
      user_email: decoded.user_email,
     }, process.env.SecretKey_AccessToken, { expiresIn: '15m' });

     console.log("genNewAuthToken, signed new auth")
     
    const encrypted_auth_token = enCrypt(
      newAccessToken,
      process.env.SecretKey_Cryptojs_JWT
    );

    console.log("genNewAuthToken, enCrypted new auth")

    

    res.cookie(
      "auth_token",
      encrypted_auth_token,
      access_token_cookieOptions
    );

    const decoded_auth = jwt.decode(newAccessToken)
    
    // Return the new access token
    req.decoded_auth = decoded_auth
    console.log("genNewAuthToken, go next")
    next();
  });
} catch (error) {
   console.log("genNewAuthToken error", error)
   return res.status(403).json("Forbidden")
}
}

app.post('/todo_app/add_todo', authenticateToken, async (req, res) => {
  
  console.log("add_todo")
  const verified_auth = req.decoded_auth;


  try {
    console.log("add todo, auth token and csrf is valid");
    const fetchSpecificUser = "SELECT user_email FROM users WHERE user_id = ?";
    const [rows] = await db.execute(fetchSpecificUser, [verified_auth.user_id]);

    if (rows.length !== 1) {
      console.log(
        "user_id doesn't exist in database or there is multiple user_id"
      );
      return res.status(400).json("Bad request");
    }
  } catch (error) {
    console.log(
      "add todo,fail to check if there is an user_id and email in database ",
      error
    );
    return res.status(500).json("Internal error!");
  }

  //add new todo item
  
  const addTodo =
    "INSERT INTO todo_item (`title`,`details`, date_start, date_end,`user_id`) VALUES (?,?,?,?,?)";
  try {
    const values = [
      req.body.title,
      req.body.details,
      req.body.date_start,
      req.body.date_end,
      verified_auth.user_id,
    ];

    //console.log(values)
    const [rows] = await db.execute(addTodo, values);

    db.unprepare(addTodo);
    console.log("added data successfully");
    console.log("rows.insertId",rows.insertId)
    return res.json(rows.insertId);
  } catch (error) {
    console.log("failed to add todo", error);
    db.unprepare(addTodo);

    return res.status(500).json("Internal error!");
  }


});




app.put("/todo_app/update_todo/:todo_id", authenticateToken, async (req, res) => {
  const response = { msg: "", status: null };
  console.log("update_todo")
  const verified_auth = req.decoded_auth;

    try {
      // get a todo data from database
      const fetchSpecificTodo = "SELECT user_id FROM todo_item WHERE todo_id = ?";
      const [rows] = await db.execute(fetchSpecificTodo, [req.params.todo_id]);
      //check if todo's user_id and authToken user_id is match?
      
      
      
      if (rows[0].user_id != verified_auth.user_id) {
        console.log("update_todo,You're not allowed to update!");
        db.unprepare(fetchSpecificTodo);
        response.status = "fail"; 
        response.msg = "You're not allowed to update!"
        return res.status(400).json(response);
      }
    } catch (error) {
      console.log("get todo data from database error, todo item might be deleted.", error);
      response.status = "fail";
      response.msg = "There's something wrong!"
      return res.status(500).json(response);
    }

    try {
      const todoId = req.params.todo_id;
      const updateTodo = "UPDATE todo_item SET `title`= ?, `details`= ?, `date_start` = ?, `date_end` = ?, `user_id` = ? WHERE todo_id = ?";

      const values = [
        req.body.title,
        req.body.details,
        req.body.date_start,
        req.body.date_end,
        verified_auth.user_id,
      ];

      //updating todo
      const [rows] = await db.execute(updateTodo, [...values, todoId]);

      if (rows.affectedRows === 0) {
        db.unprepare(updateTodo);
        console.log("todo might be deleted")
        response.status = "fail";
        response.msg = "Can't update, there's something wrong!"
        return res.status(500).json(response);
        
      } else {
        db.unprepare(updateTodo);
        console.log("update_todo, Updated successfully!")
        response.status = "success"
        response.msg = "Updated successfully!"
        return res.json(response)
      }
    } catch (error) {
      response.status = "fail";
      response.msg = "There's something wrong!"
      console.log("try catch Update Todo Error!", error);
      return res.status(500).json(response);
    }
  
});

app.delete("/todo_app/delete_todo/:todo_id", authenticateToken, async (req, res) => {
  
  console.log("delete_todo")
  const verified_auth = req.decoded_auth;
  const response = { msg: "", status: null };
  const todoId = req.params.todo_id;

    const deleteTodo = "DELETE FROM todo_item WHERE todo_id = ?";
    try {
      const fetchSpecificTodo =
        "SELECT user_id FROM todo_item WHERE todo_id = ?";
        
      const [query_rows] = await db.execute(fetchSpecificTodo, [todoId]);
      //check if payload user_id and authToken user_id is match?
      console.log(query_rows[0].user_id, verified_auth.user_id)
      if (query_rows[0].user_id != verified_auth.user_id) {
        console.log("delete_todo, You're not allowed to delete!");
        db.unprepare(fetchSpecificTodo);
        response.msg = "You're not authenticated!"
        response.status = "fail"
        return res.status(401).json(response);
      }

      const [delete_rows] = await db.execute(deleteTodo, [todoId]);
      
      console.log("delete_rows.affectedRows",delete_rows.affectedRows)
      db.unprepare(deleteTodo);
      if (delete_rows.affectedRows === 1) {
        console.log("deleted todo successfully")
        response.msg = "Deleted todo successfully!"
        response.status = "success"
        return res.status(200).json(response);
      }
      
    } catch (error) {
      console.log("Failed to delete todo_item", error);
      response.msg = "Failed to delete todo item, the todo item might be deleted or not existed"
      response.status = "fail"
      return res.status(500).json(response);
    }
  
});
//----------------------Start Login/Sign up TodoApp -------------------------------------------------

//------------------------------Start Sign up page-----------------------------------------------------
app.post("/is-email-available", async (req, res) => {
  const q = "SELECT user_email FROM users WHERE user_email = ?";

  const values = req.body[0];
  const email_pattern = new RegExp(/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/);
  const response = { emailValidation: null, isEmailAvailable: null };

  if (email_pattern.test(values) && typeof values === "string") {
    response.emailValidation = true;
  } else {
    response.emailValidation = false;
    return res.json(response);
  }

  //check email available
  console.log("check email available");
  const [rows] = await db.execute(q, [values]);
  try {
    // check if there is email name in database
    //didn't remove the cache with db.unprepare(q, [values])
    if (rows.length > 0) {
      console.log("Email is not available");
      response.isEmailAvailable = false;
      return res.json(response);
    } else {
      console.log("yes email is available");
      response.isEmailAvailable = true;
      db.unprepare(q, [values]);
      return res.json(response);
    }
  } catch (error) {
    console.log("try catch check email available error", error);
    return res.status(500).json({ error: "Internal error!" });
  }
});

app.post("/todo_app/signup", async (req, res) => {
  const username_pattern = new RegExp("^[a-zA-Z0-9_]{8,20}$");
  const password_pattern = new RegExp(
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{8,20}$/
  );
  const email_pattern = new RegExp(
    /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  );

  const response = {
    msg: null,
    status: null,
    isEmailAvailable: null,
  };

  const data = [req.body.username, req.body.password, req.body.confirm_password, req.body.email];
  const allStrings = data.every(value => typeof value === 'string');

  if (!allStrings) {
    console.log("todo_app/signup, inputs aren't string")
    response.isEmailAvailable = false;
    
    response.status = "fail";
    response.msg = "Error!"
    return res.json(response);
  } 
  
  //check if there is already have an email in database.
  const check_email = "SELECT user_email FROM users WHERE user_email = ?";

  try {
    const [rows] = await db.execute(check_email, [req.body.email]);
    console.log("sign rows", rows.length);



    if (
      rows.length > 0 ||
      !username_pattern.test(req.body.username) ||
      !password_pattern.test(req.body.password) ||
      !email_pattern.test(req.body.email) ||
      req.body.password !== req.body.confirm_password
    ) {
      response.isEmailAvailable = false;
      
      response.status = "fail"
      response.msg = "Please check your input again."
      db.unprepare(check_email);
      console.log("Signup failed, email is not available or input is invalid!");
      return res.json(response);
    } else {
      db.unprepare(check_email);
      console.log("Input validation: Pass");
      response.isEmailAvailable = true;
      
    }
  } catch (err) {
    console.log("todo_app/signup",err);
    db.unprepare(check_email);
    response.status = "fail"
    response.msg = "There is an error!"
    return res.json(response);
  }

  const addUser =
    "INSERT INTO users (`user_name`,`user_password`,`user_email`,`user_verification`) VALUES (?,?,?,?)";

  try {
    const hash = await argon2.hash(req.body.password);

    const values = [req.body.username, hash, req.body.email, 0];
    const [rows] = await db.execute(addUser, values);
    response.status = "success";
    response.msg = "Sign up successfully!";
    db.unprepare(addUser);
    
    console.log("todo_app/signup Successfully add user!");
    return res.json(response);
  } catch (error) {
    console.log("todo_app/signup Failed to add user!", error);
    response.status = "fail";
    response.msg = "Oops, there is an error!";
    return res.json(response)
  }
});

//------------------------------End Sign up page-----------------------------------------------------

//------------------------------Start Login page-----------------------------------------------------

app.post("/todo_app/login", async (req, res) => {
  const password_pattern = new RegExp(
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{8,20}$/
  );
  const email_pattern = new RegExp(
    /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  );

  const response = { status: null, msg: null };
  if (typeof req.body.email !== "string" || typeof req.body.password !== "string") {
    console.log("todo_app/login, inputs aren't string")
    response.status = "fail"
    response.msg = "Error"
    return res.json(response)
  } 

  //check if email and password pass a test
  if (!email_pattern.test(req.body.email) || !password_pattern.test(req.body.password)) {
    console.log("email or password is not pass the regex test");
    response.status = "fail";
    response.msg = "Username or Password is incorrect!";
    return res.json(response);
  } 

  const query_user_info = "SELECT * FROM users WHERE user_email = ? ";

  try {
    const [rows] = await db.execute(query_user_info, [req.body.email]);
    console.log("todo_app/login, check users from email")
    if (rows.length === 1) {
      //if there is an email in database

      try {
        if (await argon2.verify(rows[0].user_password, req.body.password)) {
          //Password does match
          //if user email has verified
          console.log("user_verification", rows[0].user_verification)
          if (rows[0].user_verification === 1) {
            console.log("user email has verified");

            const csrfToken = generateRandomString();

            const auth_token = jwt.sign(
              {
                user_id: rows[0].user_id,
                user_name: rows[0].user_name,
                user_email: rows[0].user_email,
                role: rows[0].user_role,
              },
              process.env.SecretKey_AccessToken,
              
              { expiresIn: "15m" }
            );
            const refresh_token = jwt.sign(
              {
                user_id: rows[0].user_id,
                user_name: rows[0].user_name,
                user_email: rows[0].user_email,
                role: rows[0].user_role,
                csrfToken: csrfToken,
              },
              process.env.SecretKey_RefreshToken,
              { expiresIn: "15d" }
            );
            console.log("signing jwt");
            const encrypted_auth_token = enCrypt(
              auth_token,
              process.env.SecretKey_Cryptojs_JWT
            );
            const encrypted_refresh_token = enCrypt(
              refresh_token,
              process.env.SecretKey_Cryptojs_JWT
            );
            console.log("encrypting jwt");

            res.cookie(
              "auth_token",
              encrypted_auth_token,
              access_token_cookieOptions
            );
            res.cookie(
              "refresh_token",
              encrypted_refresh_token,
              refresh_token_cookieOptions
            );

            console.log("send cookie encrypted jwt");

            response.status = "success";
            response.msg = "Login Success.";
            console.log("login success");

            response.url = "/todoapp";
            response.csrf = csrfToken;
            db.unprepare(query_user_info);

            return res.json(response);

            //else if user email has not verified
          } else {
            console.log("user email has not verified");
            //send email verification to user's mail
            try {
              const email_verification = jwt.sign(
                { user_id: rows[0].user_id, user_email: rows[0].user_email },
                process.env.SecretKey_JWT_EmailVerification,
                { expiresIn: "1d" }
              );
              console.log("sign jwt");

              const encryptedJWT = enCrypt(
                email_verification,
                process.env.SecretKey_Cryptojs_EmailVerification
              );
              console.log("encrypt Data");

              if (encryptedJWT === false) {
                response.status = "fail";
                response.msg = "There is an error!";
                response.url = "/error_page";
                return res.json(response);
              }

              const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                  user: process.env.Gmail,
                  pass: process.env.GmailP,
                },
              });

              const readHTMLFile = async () => {
                try {
                  console.log("todo app login, readHTMLFile success");
                  const data = await fs.readFile(
                    "email_verification_template.html",
                    "utf8"
                  );
                  return data;
                } catch (error) {
                  console.log("todo app login, readHTMLFile error", error);
                  return false;
                }
              };

              const htmlContent = await readHTMLFile();

              //Note If on production, we will use dynamic email which is rows[0].user_email in "to:" below
              //Note 2, If on Test server, don't forget to change https to http.
              const mailOptions = {
                from: "u6111011940013@gmail.com",
                to: rows[0].user_email,
                subject: "Email Confirmation ToDoApp",
                text: "Please confirm your email by clicking the link we give you.",
                html: htmlContent.replaceAll(
                  "{{dynamicLink}}",
                  `https://${backend_URL}/todo_app/email_verification?token=${encryptedJWT}`
                ), // on test, remove https://www.
              }; //on production add https://www.

              transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                  console.log("send mail email_verification error", error);
                  response.status = "fail";
                  response.msg = "There is an error!";
                  response.url = "/error_page";
                  return res.json(response);
                } else {
                  console.log("Email sent: " + info.response);
                  response.status = "fail";
                  response.msg = "You've not verified your email!";
                  response.url = "/email_verification_page";
                  return res.json(response);
                }
              });
            } catch (error) {
              console.log("try catch send email verification error", error);
              response.status = "fail";
              response.msg = "There is an error!";
              response.url = "/error_page";
              return res.json(response);
            }
          }
        } else {
          //Password does not match
          response.status = "fail";
          response.msg = "Username or Password is incorrect!";
          console.log("Login failed, Password does not match");
          db.unprepare(query_user_info);
          return res.json(response);
        }
      } catch (error) {
        console.log("try catch check if email and password match error", error);
        db.unprepare(query_user_info);
        return res.status(500).json("There is something wrong!");
      }
    } else if (rows.length === 0) {
      //ถ้าuser ใส่ email หรือ password ผิด
      console.log("todo_app/login, Username or Password is incorrect!")
      response.status = "fail";
      response.msg = "Username or Password is incorrect!";
      db.unprepare(query_user_info);
      return res.json(response);
    } else {
      //ถ้าบังเอิญมีEmail ซ้ำกันในระบบฐานข้อมูล หรือ rows ติดลบ
      console.log("ถ้าบังเอิญมีEmail ซ้ำกันในระบบฐานข้อมูล หรือ rows ติดลบ");
      response.status = "fail";
      response.msg = "There is something wrong!";
      db.unprepare(query_user_info);
      return res.json(response);
    }
  } catch (error) {
    db.unprepare(query_user_info);
    console.log("login, try catch query user_info error", error);
    return res.status(500).json("Internal error!");
  }
});

// Function to generate OTP with timestamp
async function generateOTP() {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp;
  } catch (error) {
    console.log("generateOTP error", error);
    return "error";
  }
}

// Function to check OTP and its expiration
async function checkOTP(enteredOTP, user_email, user_name) {
  try {
    const q =
      "SELECT otp, time_start FROM otp WHERE user_email = ? AND user_name = ? ORDER BY time_start DESC LIMIT 1";
      
    const [rows] = await db.execute(q, [user_email, user_name]);
    console.log(user_email, user_name)
    //console.log("otp rows", rows)
    if (rows.length === 1) {
      console.log("checkOTP, check if user_email exist in database");
      const storedOTP = rows[0].otp;
      const time_start = rows[0].time_start;
      const currentTime_start = Date.now();

      // Check if OTP matches and is within the 60-second window
      if (enteredOTP == storedOTP && currentTime_start - time_start <= 60000) {
        console.log(
          "checkOTP, check if otp receive from user and in database is not difference more than 1 minute"
        );
        db.unprepare(q);
        return true;
      }
    }

    console.log("checkOTP, otp or time_start is invalid");
    db.unprepare(q);
    return false;
  } catch (error) {
    console.log("checkOTP function error", error);
    db.unprepare(q);
    return false;
  }
}

app.post("/todo_app/forgot_password", async (req, res) => {
  //test email pattern
  const user_name = req.body.username;
  const user_email = req.body.email;
  

  const username_pattern = new RegExp("^[a-zA-Z0-9_]{8,20}$");
  const email_pattern = new RegExp(
    /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  );
  const response = { msg: "", status: "" };

  if (typeof user_name !== "string" || typeof user_email !== "string") {
    response.status = "fail"
    response.msg = "error"
    return res.json(response)
  }

  try {
    //regex test username and email
    if (username_pattern.test(user_name) && email_pattern.test(user_email)) {
      console.log("pass test");

      //search for email in database
      const query_user_info =
        "SELECT user_name,user_email FROM users WHERE user_name = ? AND user_email = ?";

      const [rows] = await db.execute(query_user_info, [user_name, user_email]);
      if (rows.length === 1) {
        console.log("there is user in database");

        const otp_identification = jwt.sign(
          { user_name: rows[0].user_name, user_email: rows[0].user_email },
          process.env.SecretKey_JWT_OTP,
          { expiresIn: "2m" }
        );

        console.log("forgot_password sign jwt");

        //encrypt jwt
        try {
          //console.log("otp_identification", otp_identification)
          const ciphertext = CryptoJS.AES.encrypt(
            otp_identification,
            process.env.SecretKey_Cryptojs_OTP
          ).toString();
          console.log("forgot_password encrypt jwt ");

          //Note when set cookie, don't forget to add {withCredentials: true} in request header
          let otp_cookie_options = {
            maxAge: 3 * 60 * 1000,
            httpOnly: true,
            path: "/",
          }

          if (isOnProduction === "production") {
            otp_cookie_options.secure = true;
            otp_cookie_options.sameSite = "none";
            otp_cookie_options.domain = backend_URL;
          }
          res.cookie("otp_fgtp", ciphertext, otp_cookie_options); // add domain: backend_URL if on production
          console.log("forgot_password set otp cookie ");
        } catch (error) {
          console.log("try catch enCrypt otp_identification error", error);

          response.msg = "There is an error.";
          response.status = "fail";
        }

        //generate otp and add it into database
        try {
          const otp_numbers = await generateOTP();

          if (otp_numbers == "error") {
            response.msg = "There is something wrong.";
            response.status = "fail";
            return res.json(response);
          } else {
            const timestamp = new Date(); // Get current timestamp

            const add_otp =
              "INSERT INTO otp (`user_email`,`user_name`,`otp`,`time_start`) VALUES (?,?,?,?)";
            const values = [
              rows[0].user_email,
              rows[0].user_name,
              otp_numbers,
              timestamp,
            ];

            //add otp to database
            const [rows_addOTP] = await db.execute(add_otp, values);
            console.log(
              "add otp code to database affectedRows",
              rows_addOTP.affectedRows
            );

            //send otp code to user email section
            try {
              const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                  user: process.env.Gmail,
                  pass: process.env.GmailP,
                },
              });

              //readHTMLFile Template
              const readHTMLFile = async () => {
                try {
                  console.log("forgot_password, readHTMLFile success");
                  const data = await fs.readFile("email_otp.html", "utf8");
                  return data;
                } catch (error) {
                  console.log("forgot_password, readHTMLFile error", error);
                  return false;
                }
              };

              const htmlContent = await readHTMLFile();

              //Note If on production, we will use dynamic email which is rows[0].user_email in "to:" below
              const mailOptions = {
                from: "u6111011940013@gmail.com",
                to: rows[0].user_email, //rows[0].user_email, fortest sarankunsutha@gmail.com
                subject: "Forgot Password ToDoApp",
                text: "Forgor Password Confirmation",
                html: htmlContent.replaceAll("{{dynamicOTP}}", otp_numbers), // html body
              };

              async function sendMail() {
                try {
                  const info = await transporter.sendMail(mailOptions);
                  console.log("send mail OTP Success " + info.response);
                  response.msg =
                    "We've sent OTP code to your mail, please check it out.";
                  response.status = "success";
                } catch (error) {
                  console.log("send mail OTP Error", error);
                  response.msg = "There is an error!";
                  response.status = "fail";
                }
              }

              await sendMail();

              console.log("after check_sendMail", response);
            } catch (error) {
              console.log("try catch send email verification error", error);
              response.status = "fail";
              response.msg = "There is an error!";
              response.url = "/error_page";
              return res.json(response);
            }
          }
        } catch (error) {
          console.log("try catch generate otp and add it into database error");
          console.log(error);
          response.msg = "There is an error.";
          response.status = "fail";
        }
      } else {
        console.log("there is no user in database");

        response.msg = "Please check your username and email again.";
        response.status = "fail";
      }
    } else {
      console.log("forgot_password user input doesn't pass the regex test");
      response.msg = "username or email is invalid";
      response.status = "fail";
    }
  } catch (error) {
    response.msg = "There is something wrong.";
    response.status = "fail";
    console.log("forgotpassword error", error);
  }

  return res.json(response);
});

app.post("/todo_app/verify_otp", async (req, res) => {
  const response = { msg: "", status: "", url: "" };

  const user_otp = req.body.otp;

  const otp_pattern = new RegExp("^[0-9]{1,6}$");

  if (typeof user_otp !== "string") {
    response.status = "fail"
    response.msg = "Error!"
    response.url = "/error_page";
    return res.json(response)
  }

  //regex test user_otp
  if (otp_pattern.test(user_otp)) {
    console.log("user_otp pass a regex test");
  } else {
    console.log("user_otp doesn't pass a regex test");
    response.status = "fail";
    response.msg = "Invalid otp";
    return res.json(response);
  }

  try {
    console.log("verify_otp decrypt jwt ");
    //console.log(req.cookies["otp_fgtp"]);
    const decrypted_jwt = deCrypt(
      req.cookies["otp_fgtp"],
      process.env.SecretKey_Cryptojs_OTP
    );
    

    console.log("verify_otp verify jwt ");
    const decoded = jwt.verify(decrypted_jwt, process.env.SecretKey_JWT_OTP);

    //search for email in database
    console.log("before response_checkOTP");

    const response_checkOTP = await checkOTP(
      user_otp,
      decoded.user_email,
      decoded.user_name
    );
    console.log("after response_checkOTP");
    if (response_checkOTP === true) {
      console.log("verify_otp, otp is valid.");

      try {
        const csrfToken = generateRandomString();
        const reset_password_identification = jwt.sign(
          {
            user_name: decoded.user_name,
            user_email: decoded.user_email,
            csrfToken: csrfToken,
          },
          process.env.SecretKey_JWT_Reset_Password,
          { expiresIn: "5m" }
        );
        console.log("sign jwt for reset password");
        const ciphertext = CryptoJS.AES.encrypt(
          reset_password_identification,
          process.env.SecretKey_Cryptojs_Reset_Password
        ).toString();

        console.log("encrypt jwt reset password");
        
        //Note when set cookie, don't forget to add {withCredentials: true} in request header
        let rst_pwd_cookie_options = {
          maxAge: 5 * 60 * 1000,
          httpOnly: true,
          path: "/",
        }

        if (isOnProduction === "production") {
          rst_pwd_cookie_options.secure = true;
          rst_pwd_cookie_options.sameSite = "none";
          rst_pwd_cookie_options.domain = backend_URL;
        }

        res.cookie("rst_pwd", ciphertext, rst_pwd_cookie_options); // add domain: backend_URL if on production

        response.csrf = csrfToken;
        response.status = "success";
        response.msg =
          "OTP is valid, we will navigate you to set your new password.";
        response.url = "/resetpassword";
      } catch (error) {
        console.log(
          "try catch sign jwt reset_password and encrypt jwt error",
          error
        );
        response.status = "fail";
        response.msg = "there is something wrong.";
      }
    } else {
      console.log("verify_otp, otp is invalid.");
      response.msg = "OTP is invalid, please try again.";
      response.status = "fail";
    }
  } catch (error) {
    console.log("jwt verify_otp is invalid", error);
    response.status = "fail";
    response.msg = "Invalid otp";
  }

  console.log("last response verify_otp");
  return res.json(response);
});

app.post("/todo_app/reset_password", async (req, res) => {
  const response = { msg: "", status: "" };
  const user_password = req.body.password;
  const user_confirm_password = req.body.confirm_password;

  const regexTest = async () => {
    // Perform your regex test here

    const password_pattern = new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{8,20}$/);

    if ((password_pattern.test(user_password)) && (user_password === user_confirm_password) && (typeof user_password === "string")) {
      return true;
    } else {
      return false;
    }
  };

  try {
    const isRegexPass = await regexTest();

    if (isRegexPass) {
      console.log("reset_password user input pass a test");

      console.log("reset_password decrypt value from cookie");
      const decrypted_jwt = deCrypt(
        req.cookies["rst_pwd"],
        process.env.SecretKey_Cryptojs_Reset_Password
      );

      if (decrypted_jwt === false) {
        console.log("decrypt fail");
        response.status = "fail";
        response.msg = "Invalid token.";
        return res.json(response);
      }

      const decoded = jwt.verify(
        decrypted_jwt,
        process.env.SecretKey_JWT_Reset_Password
      );

      console.log("reset_password, verify jwt");
      if (decoded.csrfToken !== req.headers["x-csrf-token-rst-pwd"]) {
        console.log("reset_password, csrf token is invalid");
        response.status = "fail";
        response.msg = "Invalid token.";
        return res.json(response);
      }

      const hashed_password = await argon2.hash(user_password);
      console.log("reset_password hashing the password");

      const q = "UPDATE users SET `user_password`= ? WHERE user_name = ? AND user_email = ? ";

      const values = [hashed_password, decoded.user_name, decoded.user_email];

      //Note Error: Malformed communication packet. because of [values], it will error if using [values] on db.execute
      //updating new password
      console.log("updating new password");
      const [rows] = await db.execute(q, values);

      if (rows.affectedRows === 1) {
        db.unprepare(q);
        console.log("Password updated successfully");
        response.status = "success";
        response.msg = "Password updated successfully, please try login.";
        response.url = "/login";
      } else {
        db.unprepare(q);
        response.status = "fail";
        response.msg = "Password failed to update, please try again later.";
      }
    } else {
      console.log("reset_password user input doesn't pass the regex test");
      response.msg = "Invalid password.";
      response.status = "fail";
    }
  } catch (error) {
    console.log("try catch reset_password error ", error);
    response.msg =
      "Invalid Token or Session is expired, please submit within 5 minutes.";
    response.status = "fail";
  }

  return res.json(response);
});

app.post("/todo_app/login_google", async (req, res) => {
  const decoded = jwt.decode(req.body[0]);
  // console.log("req.body[0]",req.body[0])
  // console.log("decoded",decoded)
  const response = { status: null, msg: null };

  //check if gmail has verified from google
  try {
    if (decoded.email_verified === true) {
      //check email available google
      const q = "SELECT * FROM users WHERE user_email = ?";
      console.log("check email available google");
      const [rows] = await db.execute(q, [decoded.email]);

      async function verify() {
        try {
          const ticket = await client.verifyIdToken({
            idToken: req.body[0],
            audience: process.env.GoogleOauthClientID, // Specify the CLIENT_ID of the app that accesses the backend
            // Or, if multiple clients access the backend:
            //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
          });
          const payload = ticket.getPayload();
          console.log("gmail is valid");
          const response_verifyingEmailinDatabase =
            await verifyingEmailinDatabase(payload);

          return response_verifyingEmailinDatabase;
        } catch (error) {
          console.error("verify google id token error", error);
          response.status = "fail";
          response.msg = "Failed to verify google account!";

          return response;
        }
      }
      async function verifyingEmailinDatabase(payload) {
        try {
          // check if there is email name in database
          //didn't remove the cache with db.unprepare(q, [values])

          //Verify the Google ID token
          console.log(
            "after verify gmail is valid, check if there is gmail in database"
          );

          //1.if user has already signed up with our sign up system (not sign in with google), reject it
          if (rows.length === 1 && rows[0].user_password !== null) {
            response.status = "fail";
            response.msg =
              "This email has already signed up, please use another email.";
            console.log(
              "This email has already signed up, please use another email."
            );
            return response;
          }
          //2.if user has already signed up by sign in with google, navigate user to todoapp
          else if (rows.length === 1 && rows[0].user_password === null) {
            const csrfToken = generateRandomString();

            const auth_token = jwt.sign(
              {
                user_id: rows[0].user_id,
                user_name: rows[0].user_name,
                user_email: rows[0].user_email,
                role: rows[0].user_role,
              },
              process.env.SecretKey_AccessToken,
              { expiresIn: "15m" }
            );
            const refresh_token = jwt.sign(
              {
                user_id: rows[0].user_id,
                user_name: rows[0].user_name,
                user_email: rows[0].user_email,
                role: rows[0].user_role,
                csrfToken: csrfToken,
              },
              process.env.SecretKey_RefreshToken,
              { expiresIn: "15d" }
            );

            const encrypted_auth_token = enCrypt(
              auth_token,
              process.env.SecretKey_Cryptojs_JWT
            );
            const encrypted_refresh_token = enCrypt(
              refresh_token,
              process.env.SecretKey_Cryptojs_JWT
            );

            // res.cookie('auth_token', access_token, cookieOptions);
            res.cookie(
              "auth_token",
              encrypted_auth_token,
              access_token_cookieOptions
            );
            res.cookie(
              "refresh_token",
              encrypted_refresh_token,
              refresh_token_cookieOptions
            );

            response.status = "success";
            response.msg = "Login successfully.";
            response.csrf = csrfToken;
            response.url = "/todoapp";

            console.log("logging in through Sign in with google.");
            return response;
          }
          //3.If user has not signed up yet, add user to database and navigate user to todoapp
          else if (rows.length === 0) {
            console.log("login_google, user hasn't register yet");

            async function generateUsername() {
              let result = "";
              const characters =
                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
              const charactersLength = characters.length;
              let counter = 0;
              while (counter < 20) {
                result += characters.charAt(
                  Math.floor(Math.random() * charactersLength)
                );
                counter += 1;
              }

              return result;
            }
            let checkNameAvailable = false;
            let GAUTHusername;
            const checkUser = "SELECT user_name FROM users WHERE user_name = ?";
            while (!checkNameAvailable) {
              GAUTHusername = await generateUsername();
              const [rows] = await db.execute(checkUser, [GAUTHusername]);
              if (rows.length === 0) {
                db.unprepare(rows);
                break;
              }
            }

            const addUser =
              "INSERT INTO users (`user_name`,`user_email`,`user_verification`) VALUES (?,?,?)";

            try {
              console.log("GAUTHusername", GAUTHusername);
              const values = [GAUTHusername, payload.email, 1];
              const [rows] = await db.execute(addUser, values);

              db.unprepare(addUser);
              console.log("login_google,add new user to database");

              //console.log("userid in database",rows.insertId)

              const csrfToken = generateRandomString();

              const auth_token = jwt.sign(
                {
                  user_id: rows.insertId,
                  user_name: GAUTHusername,
                  user_email: payload.email,
                  role: null,
                },
                process.env.SecretKey_AccessToken,
                { expiresIn: "15m" }
              );
              const refresh_token = jwt.sign(
                {
                  user_id: rows.insertId,
                  user_name: GAUTHusername,
                  user_email: payload.email,
                  role: null,
                  csrfToken: csrfToken,
                },
                process.env.SecretKey_RefreshToken,
                { expiresIn: "15d" }
              );

              console.log("login_google, sign auth jwt ");
              const encrypted_auth_token = enCrypt(
                auth_token,
                process.env.SecretKey_Cryptojs_JWT
              );
              const encrypted_refresh_token = enCrypt(
                refresh_token,
                process.env.SecretKey_Cryptojs_JWT
              );
              console.log("login_google, encrypt jwt.");
              
              
              res.cookie(
                "auth_token",
                encrypted_auth_token,
                access_token_cookieOptions
              );
              res.cookie(
                "refresh_token",
                encrypted_refresh_token,
                refresh_token_cookieOptions
              );

              console.log("login_google, set cookie to user.");

              response.csrf = csrfToken;
              response.status = "success";
              response.msg = `Login successfully, Your username is ${GAUTHusername} , you can change it later.`;
              response.url = "/todoapp";

              console.log(
                "Successfully sign up user from sign in with google api!"
              );
              return response;
            } catch (error) {
              console.log(
                "Failed to add user from Sign in with google!",
                error
              );
              response.status = "fail";
              response.msg = "Failed to signup from Sign in with google.";
              return response;
            }
          } else {
            response.status = "fail";
            response.msg = "Failed to login.";
            console.log(
              "failed to sign up from sign in with google on if else condition might be from rows.length !== 0 || rows.length !== 1 "
            );
            console.log(
              "it might cause from this email might have more than 1 email in database, or it could be rows.length === undefined so its cause an error"
            );
            return response;
          }
        } catch (error) {
          response.status = "fail";
          response.msg = "Error login google ";
          console.log("try catch verifyingEmailinDatabase error", error);
          return response;
        }
      }

      const responseVerify = await verify();

      //   if (responseVerify.status === false) {
      //     return res.json(response)
      //   }

      return res.json(responseVerify);
    }
    //if user's gmail has not verified yet.
    else {
      response.status = "fail";
      response.msg = "Gmail has not verified!";
      console.log("Gmail has not verified!");
      return res.json(response);
    }
  } catch (error) {
    console.log("error try catch login_google", error);
    response.status = "fail";
    response.msg = "Failed to login";
    return res.json(response);
  }
});

// async..await is not allowed in global scope, must use a wrapper

//------------------------------End Login page-----------------------------------------------------

//----------------------End Login/Sign up TodoApp -------------------------------------------------

// --------------- start email verification  -----------------------------
app.get("/todo_app/email_verification", async (req, res) => {
  //confirm email process, user need to click the link that being sent to user's email to confirm signing up.

  try {
    console.log("token", req.query.token);

    const queryString = req.originalUrl.split("token=")[1];

    //console.log("queryString",queryString)
    const originalText = deCrypt(
      queryString,
      process.env.SecretKey_Cryptojs_EmailVerification
    );

    jwt.verify(
      originalText,
      process.env.SecretKey_JWT_EmailVerification,
      async (err, decoded) => {
        if (err) {
          console.log(err);
          console.log("email verification token is not valid");
          return res.redirect(`${client_URL}/error_page`);
        } else {
          const verification =
            "UPDATE users SET `user_verification` = ? WHERE user_id = ?";
          try {
            const values = [1, decoded.user_id];

            console.log("values", values);
            const [rows] = await db.execute(verification, values);
            db.unprepare(verification);
            console.log("User verification status successfully.");
            return res.redirect(`${client_URL}/email_verification_success`);
          } catch (error) {
            console.log("User verification status fail.", error);
            db.unprepare(verification);

            return res.redirect(`${client_URL}/error_page`);
          }
        }
      }
    );
  } catch (error) {
    console.log("try catch deCrypt email_verification error", error);
    return res.redirect(`${client_URL}/error_page`);
  }
});
// --------------- end email verification  -----------------------------
//----------------------Start Logout  -------------------------------------------------
app.get("/todo_app/logout", async (req, res) => {
  let cookie_option = {...access_token_cookieOptions}
  cookie_option.expires = new Date(0);

  try {
    res.cookie("auth_token", "", cookie_option);
    res.cookie("refresh_token", "", cookie_option);

    console.log("logout success");
    return res.json("Logout Success");
  } catch (error) {
    console.log("delete cookie error", error);
    return res.status(400).json("Logout Error");
  }
});




app.post("/todo_app/edit_profile", authenticateToken, async (req, res) => {
  
  
  const verified_auth = req.decoded_auth;
  const response = { msg: "", status: "" };

  
    const regexTest = async (type, data) => {
      // Perform your regex test here
      const pattern = new RegExp(type);
      if (pattern.test(data) && typeof data === "string") {
        return true;
      } else {
        return false;
      }
    };

    const action = req.body.action;
    
    //Start Edit Profile username Section
    if (action === "username") {
      const username_pattern = new RegExp("^[a-zA-Z0-9_]{8,20}$");
      const user_name = req.body.username;
      const isRegexPass = await regexTest(username_pattern, user_name);

      if (isRegexPass) {
        try {
          
        const q = "UPDATE users SET `user_name`= ? WHERE user_id = ? AND user_email = ? ";

      const values = [req.body.username, verified_auth.user_id, verified_auth.user_email];
      
      
      console.log("edit_profile - change username, updating new username");
      const [rows] = await db.execute(q, values);
      
      
      if (rows.affectedRows === 1) {
        console.log("edit_profile - change username, updated username successfully.")
        db.unprepare(q);
        response.status = "success";
        response.msg = "Username updated successfully.";
        response.url = "/todoapp"
        

        const new_auth_token = jwt.sign({
            user_id: verified_auth.user_id,
            user_name: req.body.username,
            user_email: verified_auth.user_email,
          },
          process.env.SecretKey_AccessToken,
          { expiresIn: "15m" }
          
        );
        const encrypted_auth_token = enCrypt(
          new_auth_token,
          process.env.SecretKey_Cryptojs_JWT
        );

        res.cookie(
          "auth_token",
          encrypted_auth_token,
          access_token_cookieOptions
        );
        return res.json(response)
        
      } else {
        console.log("edit_profile - change username, rows.affectedRows === 0 , no rows affected.")
        db.unprepare(q);
        response.status = "fail";
        response.msg = "Oops, there is something wrong, please try again later.";
        return res.json(response)
      }
        } catch (error) {
          response.msg = "updating username error."
          response.status = "fail"
          console.log("edit_profile - change username, updating username error.", error)
          return res.json(response)
        }
        
      } else {
        console.log("edit_profile - change username, username doesn't pass regex test on backend.")
        response.msg = "Oops.";
        response.status = "fail";
        return res.json(response)
      }
    } 
    //End Edit Profile username Section

    
    //Start Edit Profile password Section
    else if (action === "password") {
      try {
      console.log("edit profile change password started")
      const password_pattern = new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{8,20}$/);
      const old_password = req.body.old_password;;
      const new_password = req.body.new_password;
      const confirm_password = req.body.confirm_password;

      const isOldPWD_RegexPass = await regexTest(password_pattern,old_password);
      const isNewPWD_RegexPass = await regexTest(password_pattern,new_password);

      //check if all inputs is valid
      if ((isOldPWD_RegexPass) && (isNewPWD_RegexPass) && (confirm_password === new_password) && (old_password !== new_password)) {
        console.log("edit profile change password, inputs is valid")
        const q = "SELECT * FROM users WHERE user_id = ? ";
        const [rows] = await db.execute(q, [verified_auth.user_id]);
        
        if (rows[0].user_password === null) {
          //if user try to change password but they logged in by sign in with google
          console.log("edit_profile - change password ,user_password === null, user logged in with google but try to change a password")
          response.msg = "You logged in with sign in with google, you can't change a password."
          response.status = "fail"
          db.unprepare(q);
          return res.json(response)
        } else if (await argon2.verify(rows[0].user_password, old_password)) {
          //if old password matches
          console.log("updating new password")
          const hashed_password = await argon2.hash(new_password);
          const update = "UPDATE users SET `user_password` = ? WHERE `user_id` = ? ";
          //if mysql errno 1835, Malformed communication packet, it's because sending more than two params on db.execute
          // to fix, combine value into single array like below.
          const [update_rows] = await db.execute(update, [hashed_password, verified_auth.user_id]);
          if (update_rows.affectedRows === 1) {
            //if update success
            console.log("edit_profile - change password, Updated password successfully")
            response.msg = "Updated password successfully, you need to login again."
            response.status = "success"
            response.url = "/login"
            db.unprepare(q);
            db.unprepare(update);


            let cookie_option = {...access_token_cookieOptions}

            cookie_option.expires = new Date(0);
            
            res.cookie("auth_token", "", cookie_option);
            res.cookie("refresh_token", "", cookie_option);

            console.log("logout success");
              
              
            return res.json(response)
          } 
          //if update is not success
          else {
            console.log("edit_profile - change password, Updated password fail")
            response.msg = "Updated fail, please try again later."
            response.status = "fail"
            db.unprepare(q);
            db.unprepare(update);
            return res.json(response)
          }

        } else {
          //if old password doesn't match
          db.unprepare(q)
          console.log("if old password is not correct")
          response.msg = "Updated fail, please check your old password."
          response.status = "fail"
          return res.json(response)
        }
        

      }
      //if inputs don't pass a test or pwd !== confirm pwd
      else {
        console.log("edit profile change password, inputs doesn't pass a test")
        response.msg = "Please match the requested format!";
        response.status = "fail";
        return res.json(response);
      }
      } catch (error) {
        console.log("edit_profile - change password error", error)
        response.status = "fail"
        response.msg = "Oops, there is an error!"
        return res.json(response)
      }
      
    } 
    //End Edit Password Section
    else {
      response.msg = "Bad request.";
      response.status = "fail";
      return res.json(response);
    }
  
});

//----------------------End Logout  -------------------------------------------------
//----------------------End Todo App -------------------------------------------------

app.listen(port, () => {
  console.log("Hello");
});

