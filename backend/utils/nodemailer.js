import nodemailer from "nodemailer";

export async function sendEmail(data) {
  const {
    email,
    g_Otp,
    email_Type,
    StockEmailData,
    CashInEmailData,
    CashOutEmailData,
    BillEmailData,
    TransactionData,
    branchCashOutData,
    checkPaidEmailData,
    W_R_R_Bill
  } = data;

  let output = ``;
  let subject = "";

  switch (true) {
    case email_Type === "Reset Password":
      subject = "Reset Password Code";
      output = `
      <h3>Password Reset OTP</h3>
      <p>This Code will expire in 10 minutes</p>
      <p> ${g_Otp}</p>
    `;
      break;

    case email_Type === "Dashboard OTP":
      subject = "Dashboard Access Code";
      output = `
      <h3>Dashboard Access OTP</h3>
      <p>This Code will expire in 10 minutes</p>
      <p> ${g_Otp}</p>
    `;
      break;

    case email_Type === "Stock Update":
      subject = "Branch Stock Update";
      output = `
  <html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
      }
      .container {
        width: 80%;
        margin: auto;
        background: #fff;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      h3 {
        color: #333;
      }
      .section {
        padding: 10px 0;
        border-bottom: 1px solid #eee;
      }
      .section:last-child {
        border-bottom: none;
      }
      .label {
        font-weight: bold;
        color: #555;
      }
      .value {
        color: #333;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h3>Updated Stock Details</h3>
      <div class="section">
        <span class="label">Send Date:</span> <span class="value">${StockEmailData.send_date}</span>
      </div>
      <div class="section">
        <span class="label">Receive Date:</span> <span class="value">${StockEmailData.recieveDate}</span>
      </div>
      <div class="section">
        <span class="label">D No:</span> <span class="value">${StockEmailData.d_no}</span>
      </div>
      <div class="section">
        <span class="label">Category:</span> <span class="value">${StockEmailData.category}</span>
      </div>
      <div class="section">
        <span class="label">Color:</span> <span class="value">${StockEmailData.color}</span>
      </div>
      <div class="section">
        <span class="label">Quantity:</span> <span class="value">${StockEmailData.quantity}</span>
      </div>
      <div class="section">
        <span class="label">Branch Name:</span> <span class="value">${StockEmailData.branchName}</span>
      </div>
      <div class="section">
        <span class="label">Stock Status:</span> <span class="value">${StockEmailData.stockStatus}</span>
      </div>
    </div>
  </body>
  </html>
  `;
      break;
    case email_Type === "Cash In":
      subject = "Cash In Notification";
      output = `
  <html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
      }
      .container {
        width: 80%;
        margin: auto;
        background: #fff;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      h3 {
        color: #333;
      }
      .section {
        padding: 10px 0;
        border-bottom: 1px solid #eee;
      }
      .section:last-child {
        border-bottom: none;
      }
      .label {
        font-weight: bold;
        color: #555;
      }
      .value {
        color: #333;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h3>Cash In Details</h3>
      <div class="section">
        <span class="label">Branch Name:</span> <span class="value">${CashInEmailData.branchName}</span>
      </div>
      <div class="section">
        <span class="label">Party Name:</span> <span class="value">${CashInEmailData.name}</span>
      </div>
      <div class="section">
        <span class="label">Phone:</span> <span class="value">${CashInEmailData.phone}</span>
      </div>
      <div class="section">
        <span class="label">Amount:</span> <span class="value">${CashInEmailData.amount}</span>
      </div>
      <div class="section">
        <span class="label">Date:</span> <span class="value">${CashInEmailData.date}</span>
      </div>
      <div class="section">
        <span class="label">Payment Method:</span> <span class="value">${CashInEmailData.payment_Method}</span>
      </div>
    </div>
  </body>
  </html>
  `;
      break;
    case email_Type === "Cash Out":
      subject = "Cash Out Notification";
      output = `
  <html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
      }
      .container {
        width: 80%;
        margin: auto;
        background: #fff;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      h3 {
        color: #333;
      }
      .section {
        padding: 10px 0;
        border-bottom: 1px solid #eee;
      }
      .section:last-child {
        border-bottom: none;
      }
      .label {
        font-weight: bold;
        color: #555;
      }
      .value {
        color: #333;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h3>Cash Out Details</h3>
      <div class="section">
        <span class="label">Branch Name:</span> <span class="value">${CashOutEmailData.branchName}</span>
      </div>
      <div class="section">
        <span class="label">Party Name:</span> <span class="value">${CashOutEmailData.name}</span>
      </div>
      <div class="section">
        <span class="label">Phone:</span> <span class="value">${CashOutEmailData.phone}</span>
      </div>
      <div class="section">
        <span class="label">Amount:</span> <span class="value">${CashOutEmailData.amount}</span>
      </div>
      <div class="section">
        <span class="label">Date:</span> <span class="value">${CashOutEmailData.date}</span>
      </div>
      <div class="section">
        <span class="label">Payment Method:</span> <span class="value">${CashOutEmailData.payment_Method}</span>
      </div>
    </div>
  </body>
  </html>
  `;
      break;
    case email_Type === "Buyer Bill":
      subject = "Buyer Bill Notification";
      output = `
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .container {
              width: 80%;
              margin: auto;
              background: #fff;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            h3 {
              color: #333;
            }
            .section {
              padding: 10px 0;
              border-bottom: 1px solid #eee;
            }
            .section:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: bold;
              color: #555;
            }
            .value {
              color: #333;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h3>Buyer Bill Details</h3>
            <div class="section">
              <span class="label">Serial Number:</span> <span class="value">${BillEmailData.serialNumber}</span>
            </div>
            <div class="section">
              <span class="label">Branch Name:</span> <span class="value">${BillEmailData.branchName}</span>
            </div>
            <div class="section">
              <span class="label">Party Name:</span> <span class="value">${BillEmailData.name}</span>
            </div>
            <div class="section">
              <span class="label">Phone:</span> <span class="value">${BillEmailData.phone}</span>
            </div>
            <div class="section">
              <span class="label">Date:</span> <span class="value">${BillEmailData.date}</span>
            </div>
            <div class="section">
              <span class="label">Billed By:</span> <span class="value">${BillEmailData.bill_by}</span>
            </div>
            <div class="section">
              <span class="label">Payment Method:</span> <span class="value">${BillEmailData.payment_Method}</span>
            </div>
            <div class="section">
              <span class="label">Debit:</span> <span class="value">${BillEmailData.debit}</span>
            </div>
            <div class="section">
              <span class="label">Credit:</span> <span class="value">${BillEmailData.credit}</span>
            </div>
            <div class="section">
              <span class="label">Balance:</span> <span class="value">${BillEmailData.balance}</span>
            </div>
            <div class="section">
              <span class="label">Status:</span> <span class="value">${BillEmailData.status}</span>
            </div>
          </div>
        </body>
        </html>
        `;
      break;
    case email_Type === "Transaction Notification":
      subject = "Transaction Notification";
      output = `
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .container {
              width: 80%;
              margin: auto;
              background: #fff;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            h3 {
              color: #333;
            }
            .section {
              padding: 10px 0;
              border-bottom: 1px solid #eee;
            }
            .section:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: bold;
              color: #555;
            }
            .value {
              color: #333;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h3>Transaction Details</h3>
            <div class="section">
              <span class="label">Transaction Type:</span> <span class="value">${TransactionData.transactionType}</span>
            </div>
            <div class="section">
              <span class="label">Amount:</span> <span class="value">${TransactionData.amount}</span>
            </div>
            <div class="section">
              <span class="label">Payment Method:</span> <span class="value">${TransactionData.payment_Method}</span>
            </div>
            <div class="section">
              <span class="label">Date:</span> <span class="value">${TransactionData.date}</span>
            </div>
            <div class="section">
              <span class="label">Note:</span> <span class="value">${TransactionData.note}</span>
            </div>
          </div>
        </body>
        </html>
        `;
      break;
    case email_Type === "Branch Cash Out":
      subject = "Branch Cash Out Notification";
      output = `
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          width: 80%;
          margin: auto;
          background: #fff;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        h3 {
          color: #333;
        }
        .section {
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }
        .section:last-child {
          border-bottom: none;
        }
        .label {
          font-weight: bold;
          color: #555;
        }
        .value {
          color: #333;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h3>Cash In Details</h3>
        <div class="section">
          <span class="label">Branch Name:</span> <span class="value">${branchCashOutData.branchName}</span>
        </div>
        <div class="section">
          <span class="label">Amount:</span> <span class="value">${branchCashOutData.amount}</span>
        </div>
        <div class="section">
          <span class="label">Date:</span> <span class="value">${branchCashOutData.date}</span>
        </div>
        <div class="section">
          <span class="label">Payment Method:</span> <span class="value">${branchCashOutData.payment_Method}</span>
        </div>
      </div>
    </body>
    </html>
    `;
      break;
    case email_Type === "Check Paid":
      subject = "Branch Cash Out Notification";
      output = `
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container {
            width: 80%;
            margin: auto;
            background: #fff;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          h3 {
            color: #333;
          }
          .section {
            padding: 10px 0;
            border-bottom: 1px solid #eee;
          }
          .section:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: bold;
            color: #555;
          }
          .value {
            color: #333;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h3>Cash In Details</h3>
          <div class="section">
            <span class="label">Branch Name:</span> <span class="value">${checkPaidEmailData.name}</span>
          </div>
          <div class="section">
            <span class="label">Amount:</span> <span class="value">${checkPaidEmailData.amount}</span>
          </div>
          <div class="section">
            <span class="label">Date:</span> <span class="value">${checkPaidEmailData.date}</span>
          </div>
          <div class="section">
            <span class="label">Payment Method:</span> <span class="value">${checkPaidEmailData.payment_Method}</span>
          </div>
        </div>
      </body>
      </html>
      `;
      break;
    case email_Type === "Without Record Return Bill":
        subject = "Without Record Return Bill Notification";
        output = `
          <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
              }
              .container {
                width: 80%;
                margin: auto;
                background: #fff;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }
              h3 {
                color: #333;
              }
              .section {
                padding: 10px 0;
                border-bottom: 1px solid #eee;
              }
              .section:last-child {
                border-bottom: none;
              }
              .label {
                font-weight: bold;
                color: #555;
              }
              .value {
                color: #333;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h3>Buyer Bill Details</h3>
              <div class="section">
                <span class="label">Branch Name:</span> <span class="value">${W_R_R_Bill.branchName}</span>
              </div>
              <div class="section">
                <span class="label">Party Name:</span> <span class="value">${W_R_R_Bill.name}</span>
              </div>
              <div class="section">
                <span class="label">Phone:</span> <span class="value">${W_R_R_Bill.phone}</span>
              </div>
              <div class="section">
                <span class="label">Date:</span> <span class="value">${W_R_R_Bill.date}</span>
              </div>
              <div class="section">
                <span class="label">Amount:</span> <span class="value">${W_R_R_Bill.amount}</span>
              </div>
              <div class="section">
                <span class="label">Payment Method:</span> <span class="value">${W_R_R_Bill.payment_Method}</span>
              </div>
              <div class="section">
                <span class="label">Category:</span> <span class="value">${W_R_R_Bill.category}</span>
              </div>
              <div class="section">
                <span class="label">Color:</span> <span class="value">${W_R_R_Bill.color}</span>
              </div>
              <div class="section">
                <span class="label">Quantity:</span> <span class="value">${W_R_R_Bill.quantity}</span>
              </div>
            </div>
          </body>
          </html>
          `;
        break;
    default:
      "";
      break;
  }

  let transport = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_AUTH_USER_EMAIL,
      pass: process.env.EMAIL_AUTH_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  debug: true,   
  });

  let mailoptions = {
    from: process.env.EMAIL_AUTH_USER_EMAIL,
    to: email,
    subject,
    html: output,
  };

  transport.sendMail(mailoptions, (error, info) => {
    if (error) {
      console.error("❌ Email sending error:", error);
      return false;
    }
    return true;
  });
}
